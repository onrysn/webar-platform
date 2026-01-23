import { parse } from "path";
import { CronJob } from "cron";
import winston from "winston";
import { readdir, rm, mkdir } from "node:fs/promises";
import { createHash } from "crypto";

// 30 minutes
const EXPIRATION_TIME = 30 * 60 * 1000;
const FILES_FOLDER = "/usr/app/gltf2usdz/files";
const LOGS_FOLDER = "/usr/app/gltf2usdz/logs";

// Performance optimizations
const MAX_CONCURRENT_CONVERSIONS = 4;
const CACHE_SIZE_LIMIT = 50; // Max cached items
let activeConversions = 0;
const conversionQueue: Array<() => void> = [];
const fileCache = new Map<string, { path: string; timestamp: number }>();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      // 20 megabytes
      maxsize: 20_000_000,
      maxFiles: 5,
      filename: `${LOGS_FOLDER}/app.log`,
      format: winston.format.timestamp(),
    }),
  ],
});

const job = new CronJob("* * * * *", deleteExpiredFiles);

job.start();

mkdir(FILES_FOLDER, { recursive: true });

// Cache helper functions
function getCacheKey(fileBuffer: ArrayBuffer): string {
  return createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
}

function getCachedFile(cacheKey: string): string | null {
  const cached = fileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < EXPIRATION_TIME) {
    logger.info(`Cache hit for key ${cacheKey.substring(0, 8)}...`);
    return cached.path;
  }
  fileCache.delete(cacheKey);
  return null;
}

function setCachedFile(cacheKey: string, path: string) {
  // Limit cache size
  if (fileCache.size >= CACHE_SIZE_LIMIT) {
    const oldestKey = fileCache.keys().next().value;
    fileCache.delete(oldestKey);
  }
  fileCache.set(cacheKey, { path, timestamp: Date.now() });
}

// Worker pool management
function canProcessConversion(): boolean {
  return activeConversions < MAX_CONCURRENT_CONVERSIONS;
}

function processNextInQueue() {
  if (conversionQueue.length > 0 && canProcessConversion()) {
    const next = conversionQueue.shift();
    next?.();
  }
}

Bun.serve({
  port: 3001,
  maxRequestBodySize: 1024 * 1024 * 50, // 50MB
  async fetch(req) {
    const { pathname, searchParams } = new URL(req.url);

    if (pathname === "/api/convert") {
      try {
        const formdata = await req.formData();
        const file = formdata.get("file") as unknown as File;

        if (
          !file ||
          !(file instanceof File) ||
          !(file.name.endsWith(".gltf") || file.name.endsWith(".glb"))
        ) {
          throw new Error("You must upload a glb/gltf file.");
        }

        logger.info(`Converting file ${file.name}...`);

        // Check cache first
        const fileBuffer = await file.arrayBuffer();
        const cacheKey = getCacheKey(fileBuffer);
        const cachedPath = getCachedFile(cacheKey);
        
        if (cachedPath) {
          const { name } = parse(cachedPath);
          const cachedId = cachedPath.split('/').slice(-2, -1)[0];
          return Response.json({ id: cachedId, expires: Date.now() + EXPIRATION_TIME, name: `${name}.usdz`, cached: true });
        }

        const expires = Date.now() + EXPIRATION_TIME;
        const id = `${expires}_${crypto.randomUUID()}`;
        const filename = `${FILES_FOLDER}/${id}/${file.name}`;

        await Bun.write(filename, fileBuffer);

        // Queue or process conversion
        const convertPromise = new Promise<string>((resolve, reject) => {
          const processConversion = async () => {
            if (!canProcessConversion()) {
              conversionQueue.push(processConversion);
              return;
            }
            
            activeConversions++;
            try {
              const name = await convertFile(filename);
              setCachedFile(cacheKey, filename);
              resolve(name);
            } catch (error) {
              reject(error);
            } finally {
              activeConversions--;
              processNextInQueue();
            }
          };
          processConversion();
        });

        const name = await convertPromise;
        return Response.json({ id, expires, name });
      } catch (error) {
        logger.error(error);
        return Response.json({ message: String(error) }, { status: 500 });
      }
    }

    if (pathname === "/api/download") {
      try {
        if (!searchParams.has("id") || !searchParams.has("name")) {
          return new Response("Bad request", { status: 400 });
        }

        const file = Bun.file(
          `${FILES_FOLDER}/${searchParams.get("id")}/${searchParams.get("name")}`,
        );

        if (!(await file.exists())) {
          throw new Error();
        }

        return new Response(file);
      } catch (error) {
        const message =
          "Failed to download the file. Your file maybe is expired.";
        logger.error(message);
        return Response.json({ message }, { status: 500 });
      }
    }

    // Health check endpoint
    if (pathname === "/health") {
      return Response.json({ 
        status: "ok", 
        activeConversions, 
        queueLength: conversionQueue.length,
        cacheSize: fileCache.size 
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

logger.info("gltf2usdz is running on port 3001");

async function convertFile(filepath: string): Promise<string> {
  const { ext, name } = parse(filepath);
  const output = filepath.replace(ext, ".usdz");

  // Async spawn for non-blocking execution
  const proc = Bun.spawn([`usd_from_gltf`, filepath, output], {
    stderr: "pipe",
    stdout: "pipe"
  });

  const exitCode = await proc.exited;
  
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    logger.error(`Conversion failed: ${stderr}`);
    throw new Error("Failed to create USDZ file");
  }

  const outputFile = Bun.file(output);
  if (!await outputFile.exists()) {
    throw new Error("USDZ file not found after conversion");
  }

  logger.info(`File converted successfully: ${name}.usdz`);
  return `${name}.usdz`;
}

async function deleteExpiredFiles() {
  logger.info("Cleaning expired files");
  const files = await readdir(FILES_FOLDER);
  const now = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    const timestamp = Number(file.substring(0, file.indexOf("_")));

    if (now > timestamp) {
      await rm(`${FILES_FOLDER}/${file}`, { recursive: true, force: true });
      deletedCount++;
    }
  }
  
  // Clean expired cache entries
  for (const [key, value] of fileCache.entries()) {
    if (now - value.timestamp > EXPIRATION_TIME) {
      fileCache.delete(key);
    }
  }
  
  logger.info(`Cleanup completed: ${deletedCount} files deleted, cache size: ${fileCache.size}`);
}
