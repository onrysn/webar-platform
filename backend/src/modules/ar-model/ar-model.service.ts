// ar-model.service.ts (revize)
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { File as MulterFile } from 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ARModelService {
    private key: Buffer;
    private converterUrl = process.env.CONVERTER_URL || 'http://converter:3001';
    private TEMP_ROOT = path.join(process.cwd(), 'uploads', 'temp');
    private FINAL_ROOT = path.join(process.cwd(), 'uploads', 'models');

    constructor(
        private prisma: PrismaService,
        private activityLogger: ActivityLogService
    ) {
        const keyHex = process.env.ENCRYPTION_KEY;
        if (!keyHex || keyHex.length !== 64) {
            throw new Error('ENCRYPTION_KEY is missing or invalid (must be 32 bytes hex)!');
        }
        this.key = Buffer.from(keyHex, 'hex');

        if (!fs.existsSync(this.TEMP_ROOT)) fs.mkdirSync(this.TEMP_ROOT, { recursive: true });
        if (!fs.existsSync(this.FINAL_ROOT)) fs.mkdirSync(this.FINAL_ROOT, { recursive: true });
    }

    // encryption helpers (kendi önceki metotları kullan)
    private encrypt(buffer: Buffer) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encrypted, iv, authTag };
    }

    decryptFile(filePath: string, ivHex: string, authTagHex: string): Buffer {
        const encryptedBuffer = fs.readFileSync(filePath);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    }

    private getMimeByExt(ext: string) {
        ext = ext.toLowerCase();
        if (ext === '.glb') return 'model/gltf-binary';
        if (ext === '.gltf') return 'model/gltf+json';
        if (ext === '.usdz') return 'application/octet-stream';
        return 'application/octet-stream';
    }

    private ensureTempDir(tempId: string) {
        const dir = path.join(this.TEMP_ROOT, tempId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    // Save an uploaded file to a temp folder (glb or usdz)
    async saveTempUploadedModel(file: MulterFile, kind: 'glb' | 'usdz', tempId?: string, userId?: number) {
        // tempId yoksa oluştur
        if (!tempId) tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);

        // Determine filename
        const ext = path.extname(file.originalname) || (kind === 'glb' ? '.glb' : '.usdz');
        const baseName = path.basename(file.originalname, path.extname(file.originalname)) || `model_${Date.now()}`;
        const filename = `${baseName}${ext}`;

        // Read buffer either from disk path or file.buffer
        let buffer: Buffer;
        if (file.buffer && file.buffer.length > 0) {
            buffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
            buffer = fs.readFileSync(file.path);
        } else {
            throw new InternalServerErrorException('Uploaded file has no buffer or path');
        }

        const outPath = path.join(tempDir, filename);
        fs.writeFileSync(outPath, buffer);

        // Return preview URLs (assuming you serve /uploads/temp statically behind /temp/)
        // You may need to adapt URLs to your nginx/static config.
        const previewUrl = `/temp/${tempId}/${filename}`;

        // Basic metadata return
        return { tempId, kind, filename, previewUrl, size: buffer.length };
    }

    // Convert FBX to GLB & USDZ and save both in temp/<tempId>/
    async convertFbxToTemp(file: MulterFile, userId?: number) {
        // create tempId and dir
        const tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);

        // read input buffer/path
        let inputBuffer: Buffer;
        let inputPath: string | undefined;
        if (file.buffer && file.buffer.length > 0) {
            inputBuffer = file.buffer;
            // write to temp file
            const inputName = `${Date.now()}_${path.basename(file.originalname)}`;
            inputPath = path.join(tempDir, inputName);
            fs.writeFileSync(inputPath, inputBuffer);
        } else if (file.path && fs.existsSync(file.path)) {
            // copy disk-stored upload into temp
            inputPath = path.join(tempDir, `${Date.now()}_${path.basename(file.path) + path.extname(file.originalname)}`);
            fs.copyFileSync(file.path, inputPath);
        } else {
            throw new InternalServerErrorException('No file buffer or path for FBX upload');
        }

        // Ensure file extension
        const ext = path.extname(inputPath).toLowerCase();
        if (ext !== '.fbx' && ext !== '.obj' && ext !== '.dae' && ext !== '.gltf' && ext !== '.glb') {
            // still try to run, but better to validate
        }

        // --- 1) Convert to GLB via blender script (convertCadToGlb) ---
        // We can reuse your convertCadToGlb logic by creating a MulterFile-like object or calling the function directly.
        // For simplicity, call convertCadToGlb with a synthetic MulterFile-like input
        const fakeMulterFile = { originalname: path.basename(inputPath), path: inputPath } as unknown as MulterFile;
        const glbPath = await this.convertCadToGlb(fakeMulterFile); // returns output path

        // --- 2) Convert GLB -> USDZ via converter service (HTTP) ---
        // Use the converter endpoint used earlier (same logic as convertForTest earlier)
        const formData = new FormData();
        formData.append('file', fs.createReadStream(glbPath), { filename: path.basename(glbPath), contentType: this.getMimeByExt('.glb') });

        const convertResp = await fetch(`${this.converterUrl}/api/convert`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!convertResp.ok) {
            const text = await convertResp.text();
            throw new InternalServerErrorException('Converter failed: ' + text);
        }

        const convertJson = await convertResp.json();
        const { id, name } = convertJson as { id: string; name: string };

        // download usd
        const downloadUrl = `${this.converterUrl}/api/download?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
        const usdzResp = await fetch(downloadUrl);
        if (!usdzResp.ok) {
            throw new InternalServerErrorException('USDZ download failed: ' + (await usdzResp.text()));
        }
        const usdzBuffer = await usdzResp.buffer();

        // move or copy glb/usdz into tempDir with stable filenames
        const safeBase = path.basename(this.getFileNameWithoutExt(file.originalname));
        const glbName = `${safeBase}.glb`;
        const usdzName = `${safeBase}.usdz`;

        const finalGlbPath = path.join(tempDir, glbName);
        const finalUsdzPath = path.join(tempDir, usdzName);
        // copy/move glb
        fs.copyFileSync(glbPath, finalGlbPath);
        // write usdz
        fs.writeFileSync(finalUsdzPath, usdzBuffer);

        // optionally remove intermediate glbPath if different
        if (glbPath !== finalGlbPath && fs.existsSync(glbPath)) {
            try { fs.unlinkSync(glbPath); } catch (e) { /* ignore */ }
        }

        // return preview urls + tempId
        return {
            tempId,
            glb: { filename: glbName, url: `/temp/${tempId}/${glbName}`, path: finalGlbPath, size: fs.statSync(finalGlbPath).size },
            usdz: { filename: usdzName, url: `/temp/${tempId}/${usdzName}`, path: finalUsdzPath, size: fs.statSync(finalUsdzPath).size },
        };
    }

    private getFileNameWithoutExt(fileName: string) {
        return path.basename(fileName, path.extname(fileName));
    }

    async finalizeTempModel(
        tempId: string,
        companyId: number,
        uploadedBy: number,
        modelName?: string,
        thumbnailFile?: MulterFile
    ) {
        const tempDir = path.join(this.TEMP_ROOT, tempId);
        if (!fs.existsSync(tempDir)) throw new NotFoundException('Temp folder not found');

        const files = fs.readdirSync(tempDir);
        const glbFile = files.find(f => f.toLowerCase().endsWith('.glb'));
        const usdzFile = files.find(f => f.toLowerCase().endsWith('.usdz'));

        if (!glbFile || !usdzFile) {
            throw new BadRequestException('Both GLB and USDZ must be present to finalize.');
        }

        const glbBuffer = fs.readFileSync(path.join(tempDir, glbFile));
        const { encrypted: glbEncrypted, iv: glbIv, authTag: glbAuth } = this.encrypt(glbBuffer);
        const glbFinalName = `${Date.now()}-${uuidv4()}-${glbFile}.enc`;
        const glbFinalPath = path.join(this.FINAL_ROOT, glbFinalName);
        fs.writeFileSync(glbFinalPath, glbEncrypted);

        const usdzBuffer = fs.readFileSync(path.join(tempDir, usdzFile));
        const { encrypted: usdzEncrypted, iv: usdzIv, authTag: usdzAuth } = this.encrypt(usdzBuffer);
        const usdzFinalName = `${Date.now()}-${uuidv4()}-${usdzFile}.enc`;
        const usdzFinalPath = path.join(this.FINAL_ROOT, usdzFinalName);
        fs.writeFileSync(usdzFinalPath, usdzEncrypted);

        let thumbnailPath: string | null = null;
        if (thumbnailFile) {
            const thumbDir = path.join(process.cwd(), 'uploads', 'thumbnails');
            if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

            const thumbExt = path.extname(thumbnailFile.originalname) || '.png';
            const thumbFileName = `${Date.now()}-${uuidv4()}${thumbExt}`;
            thumbnailPath = path.join(thumbDir, thumbFileName);

            if (thumbnailFile.buffer) {
                fs.writeFileSync(thumbnailPath, thumbnailFile.buffer);
            } else if (thumbnailFile.path) {
                fs.copyFileSync(thumbnailFile.path, thumbnailPath);
            }
        }

        const fileHash = crypto.createHash('sha256').update(glbBuffer).digest('hex');
        const created = await this.prisma.aRModel.create({
            data: {
                fileName: modelName || this.getFileNameWithoutExt(glbFile),
                fileType: '.glb/.usdz',
                filePath: glbFinalPath,
                fileSize: glbEncrypted.length,
                fileHash,
                companyId,
                uploadedBy,
                iv: glbIv.toString('hex'),
                authTag: glbAuth.toString('hex'),
                usdzFilePath: usdzFinalPath,
                usdzIv: usdzIv.toString('hex'),
                usdzAuthTag: usdzAuth.toString('hex'),
                usdzFileSize: usdzEncrypted.length,
                thumbnailPath,
            },
        });
        
        await this.activityLogger.log(
            uploadedBy,
            'UPLOAD_MODEL',
            `"${created.fileName}" modeli yüklendi (GLB+USDZ).`,
            { modelId: created.id, companyId: created.companyId, size: created.fileSize }
        );

        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
            console.error('Failed to delete temp dir', tempDir, err);
        }

        return { id: created.id, fileName: created.fileName, message: 'Model and thumbnail saved successfully' };
    }

    // Reuse your existing convertCadToGlb below unchanged (but ensure it returns output path)
    async convertCadToGlb(file: MulterFile): Promise<string> {
        // ... your existing implementation unchanged (copy/paste)
        // ensure it returns the glb output path on success
        let inputPath = file.path;
        const originalExt = path.extname(file.originalname).toLowerCase();

        if (inputPath) {
            if (!inputPath.toLowerCase().endsWith(originalExt)) {
                const newPath = inputPath + originalExt;
                try {
                    fs.renameSync(inputPath, newPath);
                    inputPath = newPath;
                } catch (err) {
                    console.error('Dosya yeniden adlandırılamadı:', err);
                }
            }
        }

        if (!inputPath) {
            if (!file.buffer) {
                throw new InternalServerErrorException('File uploaded but neither path nor buffer found.');
            }

            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const safeName = (file.originalname || 'temp_cad_model').replace(/[^a-zA-Z0-9.]/g, '_').replace(originalExt, '');
            inputPath = path.join(tempDir, `${Date.now()}-${safeName}${originalExt}`);
            fs.writeFileSync(inputPath, file.buffer);
        }

        const outputDir = path.dirname(inputPath);
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const glbOutputName = `${fileName}.glb`;
        const glbOutputPath = path.join(outputDir, glbOutputName);

        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_cad_to_glb.py');

        return new Promise((resolve, reject) => {
            const blender = spawn('blender', ['-b', '-noaudio', '-P', scriptPath, '--', inputPath, glbOutputPath]);
            let combinedLog = '';
            blender.stdout.on('data', (data) => { combinedLog += data.toString(); });
            blender.stderr.on('data', (data) => { combinedLog += data.toString(); });
            blender.on('close', (code) => {
                if (code === 0 && fs.existsSync(glbOutputPath)) {
                    resolve(glbOutputPath);
                } else {
                    console.error(`Blender Process Failed (Code: ${code})`);
                    console.error(`Full Log:\n${combinedLog}`);
                    reject(new InternalServerErrorException(`CAD conversion failed with code ${code}. Check server logs for details.`));
                }
            });
        });
    }

    async getModelFileBuffer(model: any, format: 'glb' | 'usdz') {
        let filePath: string | null;
        let iv: string | null;
        let authTag: string | null;
        let mimeType: string;
        let ext: string;

        // İstenen formata göre hangi kolonları okuyacağımızı seçiyoruz
        if (format === 'usdz') {
            if (!model.usdzFilePath) {
                throw new NotFoundException('Bu model için USDZ formatı mevcut değil.');
            }
            filePath = model.usdzFilePath;
            iv = model.usdzIv;
            authTag = model.usdzAuthTag;
            mimeType = 'model/vnd.usdz+zip';
            ext = '.usdz';
        } else {
            // GLB (Varsayılan)
            filePath = model.filePath;
            iv = model.iv;
            authTag = model.authTag;
            mimeType = 'model/gltf-binary';
            ext = '.glb';
        }

        if (!filePath || !fs.existsSync(filePath)) {
            throw new NotFoundException('Fiziksel dosya sunucuda bulunamadı.');
        }

        // Decrypt işlemi
        const buffer = this.decryptFile(filePath, iv!, authTag!);

        // İndirme sırasında dosya adı düzgün görünsün diye
        let cleanFileName = model.fileName;
        if (!cleanFileName.toLowerCase().endsWith(ext)) {
            cleanFileName += ext;
        }

        return { buffer, mimeType, filename: cleanFileName };
    }

    async convertGlbToUsdzTemp(file: MulterFile, userId?: number) {
        // 1. Temp ID ve Klasör Oluştur
        const tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);

        // 2. Gelen GLB dosyasını Temp'e kaydet
        const baseName = path.basename(file.originalname, path.extname(file.originalname));
        const glbName = `${baseName}.glb`;
        const glbPath = path.join(tempDir, glbName);

        if (file.buffer) {
            fs.writeFileSync(glbPath, file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
            fs.copyFileSync(file.path, glbPath);
        } else {
            throw new InternalServerErrorException('GLB dosyası buffer veya path içermiyor.');
        }

        // 3. GLB -> USDZ Converter Servisine İstek At
        // Mevcut converterUrl yapısını kullanıyoruz
        const formData = new FormData();
        formData.append('file', fs.createReadStream(glbPath), {
            filename: glbName,
            contentType: 'model/gltf-binary'
        });

        const convertResp = await fetch(`${this.converterUrl}/api/convert`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!convertResp.ok) {
            const text = await convertResp.text();
            throw new InternalServerErrorException('Converter servisi hatası: ' + text);
        }

        const convertJson = await convertResp.json();
        const { id, name } = convertJson as { id: string; name: string };

        // 4. Oluşan USDZ dosyasını indir
        const downloadUrl = `${this.converterUrl}/api/download?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
        const usdzResp = await fetch(downloadUrl);

        if (!usdzResp.ok) {
            throw new InternalServerErrorException('USDZ indirme hatası: ' + (await usdzResp.text()));
        }

        const usdzBuffer = await usdzResp.buffer();
        const usdzName = `${baseName}.usdz`;
        const usdzPath = path.join(tempDir, usdzName);

        fs.writeFileSync(usdzPath, usdzBuffer);

        // 5. Sonuçları Dön (Frontend finalize endpointine bu tempId ile gidecek)
        return {
            tempId,
            glb: {
                filename: glbName,
                url: `/temp/${tempId}/${glbName}`,
                path: glbPath,
                size: fs.statSync(glbPath).size
            },
            usdz: {
                filename: usdzName,
                url: `/temp/${tempId}/${usdzName}`,
                path: usdzPath,
                size: fs.statSync(usdzPath).size
            },
        };
    }

}
