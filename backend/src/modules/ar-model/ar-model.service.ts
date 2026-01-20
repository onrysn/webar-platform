import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
import { Role } from '@prisma/client'; // Role enum'ını ekledik
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { 
    InitiateChunkedUploadDto, 
    UploadChunkDto, 
    CompleteChunkedUploadDto,
    ChunkedUploadSession,
    ChunkUploadProgress
} from './dto/chunked-upload.dto';

@Injectable()
export class ARModelService {
    private key: Buffer;
    private converterUrl = process.env.CONVERTER_URL || 'http://converter:3001';
    private TEMP_ROOT = path.join(process.cwd(), 'uploads', 'temp');
    private FINAL_ROOT = path.join(process.cwd(), 'uploads', 'models');
    private CHUNKS_ROOT = path.join(process.cwd(), 'uploads', 'chunks');
    
    // In-memory storage for upload sessions (production'da Redis kullanılmalı)
    private uploadSessions: Map<string, ChunkedUploadSession> = new Map();

    constructor(
        private prisma: PrismaService,
        private activityLogger: ActivityLogService,
        @InjectQueue('model-convert') private convertQueue: Queue
    ) {
        const keyHex = process.env.ENCRYPTION_KEY;
        if (!keyHex || keyHex.length !== 64) {
            throw new Error('ENCRYPTION_KEY is missing or invalid (must be 32 bytes hex)!');
        }
        this.key = Buffer.from(keyHex, 'hex');

        if (!fs.existsSync(this.TEMP_ROOT)) fs.mkdirSync(this.TEMP_ROOT, { recursive: true });
        if (!fs.existsSync(this.FINAL_ROOT)) fs.mkdirSync(this.FINAL_ROOT, { recursive: true });
        if (!fs.existsSync(this.CHUNKS_ROOT)) fs.mkdirSync(this.CHUNKS_ROOT, { recursive: true });

        // Expired sessions temizleme (her 1 saatte bir)
        setInterval(() => this.cleanExpiredSessions(), 60 * 60 * 1000);
    }

    // --- ENCRYPTION HELPERS ---
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

    private ensureTempDir(tempId: string) {
        const dir = path.join(this.TEMP_ROOT, tempId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    private getFileNameWithoutExt(fileName: string) {
        return path.basename(fileName, path.extname(fileName));
    }

    // --- UPLOAD HANDLERS (TEMP) ---
    // (Burası aynen kalıyor...)
    async saveTempUploadedModel(file: MulterFile, kind: 'glb' | 'usdz', tempId?: string, userId?: number) {
        if (!tempId) tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);

        const ext = path.extname(file.originalname) || (kind === 'glb' ? '.glb' : '.usdz');
        const baseName = path.basename(file.originalname, path.extname(file.originalname)) || `model_${Date.now()}`;
        const filename = `${baseName}${ext}`;

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

        const previewUrl = `/temp/${tempId}/${filename}`;
        return { tempId, kind, filename, previewUrl, size: buffer.length };
    }

    async convertStepToTemp(file: MulterFile, userId?: number, companyId?: number) {
        return this._enqueueConversion(file, userId, 'step', companyId);
    }

    async convertFbxToTemp(file: MulterFile, userId?: number, companyId?: number) {
        return this._enqueueConversion(file, userId, 'fbx', companyId);
    }

    async convertGlbToUsdzTemp(file: MulterFile, userId?: number, targetTempId?: string) {
        // Optional: write into existing temp folder (used by queue processor)
        const tempId = targetTempId || `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);
        const baseName = path.basename(file.originalname, path.extname(file.originalname));
        const glbName = `${baseName}.glb`;
        const glbPath = path.join(tempDir, glbName);

        if (file.buffer) {
            fs.writeFileSync(glbPath, file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
            // If already copied by caller, ensure it exists; otherwise copy
            if (!fs.existsSync(glbPath)) fs.copyFileSync(file.path, glbPath);
        } else {
            throw new InternalServerErrorException('GLB dosyası buffer veya path içermiyor.');
        }

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

        const downloadUrl = `${this.converterUrl}/api/download?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
        const usdzResp = await fetch(downloadUrl);

        if (!usdzResp.ok) {
            throw new InternalServerErrorException('USDZ indirme hatası: ' + (await usdzResp.text()));
        }

        const usdzBuffer = await usdzResp.buffer();
        const usdzName = `${baseName}.usdz`;
        const usdzPath = path.join(tempDir, usdzName);

        fs.writeFileSync(usdzPath, usdzBuffer);

        return {
            tempId,
            glb: { filename: glbName, url: `/temp/${tempId}/${glbName}`, path: glbPath, size: fs.statSync(glbPath).size },
            usdz: { filename: usdzName, url: `/temp/${tempId}/${usdzName}`, path: usdzPath, size: fs.statSync(usdzPath).size },
        };
    }

    // --- INTERNAL HELPERS (_genericConvertToTemp, convertCadToGlb, etc. - Aynen kalıyor) ---
    private async _enqueueConversion(file: MulterFile, userId: number | undefined, type: 'fbx' | 'step', companyId?: number) {
        const tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);

        let inputPath: string | undefined;
        if (file.buffer && file.buffer.length > 0) {
            const inputName = `${Date.now()}_${path.basename(file.originalname)}`;
            inputPath = path.join(tempDir, inputName);
            fs.writeFileSync(inputPath, file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
            inputPath = path.join(tempDir, `${Date.now()}_${path.basename(file.originalname)}`);
            fs.copyFileSync(file.path, inputPath);
        } else {
            throw new InternalServerErrorException(`No file buffer or path for ${type.toUpperCase()} upload`);
        }

        await (this.prisma as any).modelUploadJob.create({
            data: {
                tempId,
                type,
                userId: userId || 0,
                companyId: companyId,
                inputPath,
                status: 'QUEUED',
                progress: 0,
            },
        });

        await this.convertQueue.add('convert', { tempId, type, inputPath, userId, companyId });

        return { tempId, status: 'QUEUED' };
    }

    // --- 1. FINALIZE (DB SAVE) ---
    async finalizeTempModel(
        tempId: string,
        companyId: number,
        uploadedBy: number,
        modelName?: string,
        thumbnailFile?: MulterFile,
        isPrivate: boolean = false,
        categoryId?: number,
        seriesId?: number
    ) {
        const tempDir = path.join(this.TEMP_ROOT, tempId);
        if (!fs.existsSync(tempDir)) throw new NotFoundException('Temp folder not found');

        let files = fs.readdirSync(tempDir);
        let glbFile = files.find(f => f.toLowerCase().endsWith('.glb'));
        let usdzFile = files.find(f => f.toLowerCase().endsWith('.usdz'));

        // Fallback for legacy jobs: if files missing, try to copy from recorded job paths
        if (!glbFile || !usdzFile) {
            const job = await (this.prisma as any).modelUploadJob.findUnique({ where: { tempId } });
            if (job) {
                if (!glbFile && job.glbPath && fs.existsSync(job.glbPath)) {
                    const dest = path.join(tempDir, path.basename(job.glbPath));
                    if (!fs.existsSync(dest)) fs.copyFileSync(job.glbPath, dest);
                }
                if (!usdzFile && job.usdzPath && fs.existsSync(job.usdzPath)) {
                    const dest = path.join(tempDir, path.basename(job.usdzPath));
                    if (!fs.existsSync(dest)) fs.copyFileSync(job.usdzPath, dest);
                }
                // Refresh listing
                files = fs.readdirSync(tempDir);
                glbFile = files.find(f => f.toLowerCase().endsWith('.glb'));
                usdzFile = files.find(f => f.toLowerCase().endsWith('.usdz'));
            }
        }

        if (!glbFile || !usdzFile) {
            throw new BadRequestException('Both GLB and USDZ must be present to finalize.');
        }

        // 1. Şifreleme (dosyaları yazmadan önce limit kontrolü için boyutları hesapla)
        const glbBuffer = fs.readFileSync(path.join(tempDir, glbFile));
        const { encrypted: glbEncrypted, iv: glbIv, authTag: glbAuth } = this.encrypt(glbBuffer);
        const usdzBuffer = fs.readFileSync(path.join(tempDir, usdzFile));
        const { encrypted: usdzEncrypted, iv: usdzIv, authTag: usdzAuth } = this.encrypt(usdzBuffer);

        // 1b. maxStorage kontrolü (MB cinsinden)
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new BadRequestException('Şirket bulunamadı');
        if (company.maxStorage != null) {
            const agg = await this.prisma.aRModel.aggregate({
                where: { companyId },
                _sum: { fileSize: true, usdzFileSize: true }
            });
            const currentBytes = (agg._sum?.fileSize ?? 0) + (agg._sum?.usdzFileSize ?? 0);
            const newTotalBytes = currentBytes + glbEncrypted.length + usdzEncrypted.length;
            const newTotalMB = newTotalBytes / (1024 * 1024);
            if (newTotalMB > company.maxStorage) {
                throw new BadRequestException(`Depolama kotası aşılıyor: ${newTotalMB.toFixed(2)}MB / ${company.maxStorage}MB`);
            }
        }

        // 1c. Dosyaları yaz
        const glbFinalName = `${Date.now()}-${uuidv4()}-${glbFile}.enc`;
        const glbFinalPath = path.join(this.FINAL_ROOT, glbFinalName);
        fs.writeFileSync(glbFinalPath, glbEncrypted);
        const usdzFinalName = `${Date.now()}-${uuidv4()}-${usdzFile}.enc`;
        const usdzFinalPath = path.join(this.FINAL_ROOT, usdzFinalName);
        fs.writeFileSync(usdzFinalPath, usdzEncrypted);

        // 2. Thumbnail
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

        // 3a. Opsiyonel kategori/seri doğrulamaları (şirket uyumu)
        if (categoryId !== undefined) {
            const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
            if (!cat) throw new BadRequestException('Kategori bulunamadı');
            if (cat.companyId !== companyId) throw new BadRequestException('Kategori hedef şirket ile uyuşmuyor');
        }
        if (seriesId !== undefined) {
            const ser = await this.prisma.series.findUnique({ where: { id: seriesId } });
            if (!ser) throw new BadRequestException('Seri bulunamadı');
            if (ser.companyId !== companyId) throw new BadRequestException('Seri hedef şirket ile uyuşmuyor');
        }

        // 3b. DB Kayıt
        const fileHash = crypto.createHash('sha256').update(glbBuffer).digest('hex');
        const created = await this.prisma.aRModel.create({
            data: {
                fileName: modelName || this.getFileNameWithoutExt(glbFile),
                // modelName: modelName, // Opsiyonel: Schema'da varsa açabilirsin
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
                isPrivate: isPrivate,
                categoryId: categoryId,
                seriesId: seriesId
            },
        });

        // 4. Log
        await this.activityLogger.log(
            uploadedBy,
            companyId,
            'UPLOAD_MODEL',
            `"${created.fileName}" modeli yüklendi (GLB+USDZ).`,
            { modelId: created.id, companyId: created.companyId, size: created.fileSize }
        );

        // 5. Temp Temizlik
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

        // Job status update to APPROVED
        try {
            await (this.prisma as any).modelUploadJob.update({ where: { tempId }, data: { status: 'APPROVED' } });
        } catch {}

        return { id: created.id, fileName: created.fileName, message: 'Model saved successfully' };
    }

    // STATUS API
    async getUploadStatus(tempId: string) {
        const job = await (this.prisma as any).modelUploadJob.findUnique({ where: { tempId } });
        if (!job) throw new NotFoundException('Upload job not found');

        const resp: any = {
            tempId,
            status: job.status,
            progress: job.progress,
            message: job.message,
        };
        if (job.status === 'CONVERTED' && job.glbPath && job.usdzPath) {
            const glbName = path.basename(job.glbPath);
            const usdzName = path.basename(job.usdzPath);
            let glbSize = 0;
            let usdzSize = 0;
            try { glbSize = fs.statSync(job.glbPath).size; } catch {}
            try { usdzSize = fs.statSync(job.usdzPath).size; } catch {}
            resp.glb = { filename: glbName, url: `/temp/${tempId}/${glbName}`, size: glbSize };
            resp.usdz = { filename: usdzName, url: `/temp/${tempId}/${usdzName}`, size: usdzSize };
        }
        return resp;
    }

    async listUploadJobs(user: any, companyId?: number, status?: string) {
        const where: any = {};
        // SUPER_ADMIN: filter by selected companyId if provided, otherwise own jobs
        if (user.role === Role.SUPER_ADMIN) {
            if (companyId) where.companyId = companyId; else where.userId = user.id;
        } else {
            // Company roles: list jobs for their company
            where.companyId = user.companyId;
        }
        if (status) where.status = status as any;
        const jobs = await (this.prisma as any).modelUploadJob.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                tempId: true,
                type: true,
                status: true,
                progress: true,
                message: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return jobs;
    }

    async convertCadToGlb(file: MulterFile): Promise<string> {
        // ... (Mevcut kod aynen)
        let inputPath = file.path;
        const originalExt = path.extname(file.originalname).toLowerCase();
        if (inputPath) {
            if (!inputPath.toLowerCase().endsWith(originalExt)) {
                const newPath = inputPath + originalExt;
                try { fs.renameSync(inputPath, newPath); inputPath = newPath; } catch (err) { console.error('Dosya yeniden adlandırılamadı:', err); }
            }
        }
        if (!inputPath) {
            if (!file.buffer) throw new InternalServerErrorException('File upload error');
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const safeName = (file.originalname || 'temp').replace(/[^a-zA-Z0-9.]/g, '_').replace(originalExt, '');
            inputPath = path.join(tempDir, `${Date.now()}-${safeName}${originalExt}`);
            fs.writeFileSync(inputPath, file.buffer);
        }
        const outputDir = path.dirname(inputPath);
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const glbOutputPath = path.join(outputDir, `${fileName}.glb`);
        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_cad_to_glb.py');

        return new Promise((resolve, reject) => {
            const blender = spawn('blender', ['-b', '-noaudio', '-P', scriptPath, '--', inputPath, glbOutputPath]);
            blender.on('close', (code) => {
                if (code === 0 && fs.existsSync(glbOutputPath)) resolve(glbOutputPath);
                else reject(new InternalServerErrorException(`Blender conversion failed (Code: ${code})`));
            });
        });
    }

    async convertStepToGlb(inputPath: string): Promise<string> {
        const outputDir = path.dirname(inputPath);
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const glbOutputPath = path.join(outputDir, `${fileName}.glb`);
        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_step_to_glb.py');

        if (!fs.existsSync(scriptPath)) throw new InternalServerErrorException('Script not found');

        return new Promise((resolve, reject) => {
            // '-u' parametresi Python çıktılarının bufferlanmadan (unbuffered) gelmesini sağlar
            const pythonProcess = spawn('python3', ['-u', scriptPath, inputPath, glbOutputPath]);

            // Çıktıları biriktirmek için değişkenler (Hata durumunda mesaj olarak dönmek için)
            let stderrData = '';

            // 1. Standart Çıktıları (Print) Yakala ve Logla
            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString();
                console.log(`[Python-Log]: ${message.trim()}`);
            });

            // 2. Hata Çıktılarını Yakala ve Logla
            pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                console.error(`[Python-Error]: ${message.trim()}`);
                stderrData += message; // Hatayı biriktir
            });

            const timeout = setTimeout(() => {
                pythonProcess.kill('SIGKILL');
                reject(new InternalServerErrorException('Conversion timed out'));
            }, 10 * 60 * 1000);

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);

                if (code === 0 && fs.existsSync(glbOutputPath)) {
                    console.log(`[Success] STEP conversion completed: ${glbOutputPath}`);
                    resolve(glbOutputPath);
                } else {
                    // Hata oluştuğunda Python'dan gelen hata mesajını da ekleyelim
                    console.error(`[Failed] Process exited with code ${code}`);
                    reject(new InternalServerErrorException(
                        `STEP conversion failed (Code: ${code}). Details: ${stderrData}`
                    ));
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

        if (format === 'usdz') {
            if (!model.usdzFilePath) throw new NotFoundException('USDZ not available');
            filePath = model.usdzFilePath;
            iv = model.usdzIv;
            authTag = model.usdzAuthTag;
            mimeType = 'model/vnd.usdz+zip';
            ext = '.usdz';
        } else {
            filePath = model.filePath;
            iv = model.iv;
            authTag = model.authTag;
            mimeType = 'model/gltf-binary';
            ext = '.glb';
        }

        if (!filePath || !fs.existsSync(filePath)) throw new NotFoundException('File not found on disk');

        const buffer = this.decryptFile(filePath, iv!, authTag!);
        let filename = model.fileName;
        if (!filename.toLowerCase().endsWith(ext)) filename += ext;

        return { buffer, mimeType, filename };
    }

    // --- 2. UPDATE MODEL (YENİ) ---
    async updateModel(id: number, user: any, data: { name?: string, isPrivate?: boolean, categoryId?: number | null, seriesId?: number | null }) {
        const model = await this.prisma.aRModel.findUnique({ where: { id } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        // Yetki: SuperAdmin veya Kendi Şirketi
        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok');
        }

        const updatedModel = await this.prisma.aRModel.update({
            where: { id },
            data: {
                fileName: data.name || model.fileName,
                isPrivate: data.isPrivate !== undefined ? data.isPrivate : model.isPrivate,
                categoryId: data.categoryId === undefined ? model.categoryId : data.categoryId,
                seriesId: data.seriesId === undefined ? model.seriesId : data.seriesId
            }
        });

        await this.activityLogger.log(
            user.id,
            user.companyId,
            'MODEL_UPDATE',
            `Model güncellendi: ${updatedModel.fileName}`,
            { modelId: id, changes: data }
        );

        return updatedModel;
    }

    // --- 3. SHARE TOKEN GENERATE (YENİ) ---
    async generateShareToken(id: number, user: any) {
        const model = await this.prisma.aRModel.findUnique({ where: { id } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            throw new ForbiddenException('Yetkisiz işlem');
        }

        // Zaten varsa eskisini dön
        if (model.shareToken) {
            return { shareToken: model.shareToken }; // URL yok, sadece token
        }

        const token = uuidv4();
        await this.prisma.aRModel.update({
            where: { id },
            data: { shareToken: token }
        });

        await this.activityLogger.log(
            user.id,
            user.companyId,
            'MODEL_SHARE',
            `Model paylaşıma açıldı: ${model.fileName}`,
            { modelId: id }
        );

        return { shareToken: token };
    }

    // --- 4. REVOKE SHARE TOKEN (YENİ) ---
    async revokeShareToken(id: number, user: any) {
        const model = await this.prisma.aRModel.findUnique({ where: { id } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            throw new ForbiddenException('Yetkisiz işlem');
        }

        await this.prisma.aRModel.update({
            where: { id },
            data: { shareToken: null }
        });

        await this.activityLogger.log(
            user.id,
            user.companyId,
            'MODEL_UNSHARE',
            `Model paylaşımı kapatıldı: ${model.fileName}`,
            { modelId: id }
        );

        return { success: true, message: 'Paylaşım bağlantısı iptal edildi.' };
    }

    // ==================== CHUNKED UPLOAD METHODS ====================
    
    /**
     * Parçalı upload session başlatır
     */
    async initiateChunkedUpload(
        dto: InitiateChunkedUploadDto,
        userId: number,
        companyId?: number
    ): Promise<{ uploadId: string; chunkSize: number }> {
        const uploadId = `upload_${Date.now()}_${uuidv4()}`;
        const chunkSize = dto.chunkSize || 5 * 1024 * 1024; // Default 5MB
        
        // Upload directory oluştur
        const uploadDir = path.join(this.CHUNKS_ROOT, uploadId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const session: ChunkedUploadSession = {
            uploadId,
            userId,
            companyId,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            fileType: dto.fileType,
            chunkSize,
            totalChunks: dto.totalChunks,
            uploadedChunks: [],
            tempId: dto.tempId,
            fileHash: dto.fileHash,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
            status: 'PENDING'
        };

        this.uploadSessions.set(uploadId, session);

        return { uploadId, chunkSize };
    }

    /**
     * Tek bir chunk yükler
     */
    async uploadChunk(
        dto: UploadChunkDto,
        file: MulterFile,
        userId: number
    ): Promise<ChunkUploadProgress> {
        const session = this.uploadSessions.get(dto.uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session bulunamadı veya süresi dolmuş');
        }

        if (session.userId !== userId) {
            throw new ForbiddenException('Bu upload session size ait değil');
        }

        if (session.status === 'COMPLETED') {
            throw new BadRequestException('Bu upload zaten tamamlanmış');
        }

        if (session.status === 'CANCELLED') {
            throw new BadRequestException('Bu upload iptal edilmiş');
        }

        // Chunk index validasyonu
        if (dto.chunkIndex < 0 || dto.chunkIndex >= session.totalChunks) {
            throw new BadRequestException('Geçersiz chunk index');
        }

        // Chunk zaten yüklenmiş mi kontrol et
        if (session.uploadedChunks.includes(dto.chunkIndex)) {
            // İdempotent: Zaten yüklenmiş, başarılı dön
            return this.getChunkedUploadProgress(session);
        }

        const uploadDir = path.join(this.CHUNKS_ROOT, dto.uploadId);
        const chunkPath = path.join(uploadDir, `chunk_${dto.chunkIndex}`);

        // Chunk dosyasını kaydet
        let buffer: Buffer;
        if (file.buffer) {
            buffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
            buffer = fs.readFileSync(file.path);
            fs.unlinkSync(file.path); // Temp dosyayı sil
        } else {
            throw new InternalServerErrorException('Chunk dosyası okunamadı');
        }

        // Hash doğrulama (opsiyonel)
        if (dto.chunkHash) {
            const hash = crypto.createHash('md5').update(buffer).digest('hex');
            if (hash !== dto.chunkHash) {
                throw new BadRequestException('Chunk hash doğrulaması başarısız');
            }
        }

        fs.writeFileSync(chunkPath, buffer);

        // Session güncelle
        session.uploadedChunks.push(dto.chunkIndex);
        session.uploadedChunks.sort((a, b) => a - b); // Sıralı tut
        session.updatedAt = new Date();
        session.status = 'UPLOADING';

        this.uploadSessions.set(dto.uploadId, session);

        return this.getChunkedUploadProgress(session);
    }

    /**
     * Upload tamamlar ve chunk'ları birleştirir
     */
    async completeChunkedUpload(
        dto: CompleteChunkedUploadDto,
        userId: number
    ): Promise<any> {
        const session = this.uploadSessions.get(dto.uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session bulunamadı');
        }

        if (session.userId !== userId) {
            throw new ForbiddenException('Bu upload session size ait değil');
        }

        if (session.status === 'COMPLETED') {
            throw new BadRequestException('Bu upload zaten tamamlanmış');
        }

        // Tüm chunk'lar yüklenmiş mi?
        if (session.uploadedChunks.length !== session.totalChunks) {
            throw new BadRequestException(
                `Eksik chunk var. ${session.uploadedChunks.length}/${session.totalChunks} yüklendi`
            );
        }

        const uploadDir = path.join(this.CHUNKS_ROOT, dto.uploadId);
        
        // Chunk'ları birleştir
        const combinedPath = path.join(uploadDir, session.fileName);
        const writeStream = fs.createWriteStream(combinedPath);

        for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(uploadDir, `chunk_${i}`);
            if (!fs.existsSync(chunkPath)) {
                throw new InternalServerErrorException(`Chunk ${i} bulunamadı`);
            }
            const chunkBuffer = fs.readFileSync(chunkPath);
            writeStream.write(chunkBuffer);
        }

        writeStream.end();

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });

        // Hash doğrulama (opsiyonel)
        if (dto.fileHash) {
            const fileBuffer = fs.readFileSync(combinedPath);
            const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
            if (fileHash !== dto.fileHash) {
                throw new BadRequestException('Dosya hash doğrulaması başarısız');
            }
        }

        // Session tamamlandı olarak işaretle
        session.status = 'COMPLETED';
        session.updatedAt = new Date();
        this.uploadSessions.set(dto.uploadId, session);

        // Birleştirilmiş dosyayı uygun handler'a gönder
        const file: MulterFile = {
            fieldname: 'file',
            originalname: session.fileName,
            encoding: '7bit',
            mimetype: this.getMimeType(session.fileType),
            size: session.fileSize,
            buffer: fs.readFileSync(combinedPath),
            stream: null,
            destination: uploadDir,
            filename: session.fileName,
            path: combinedPath
        };

        let result: any;

        try {
            // Dosya tipine göre işlem yap
            if (session.fileType === 'fbx') {
                result = await this.convertFbxToTemp(file, session.userId, session.companyId);
            } else if (session.fileType === 'step') {
                result = await this.convertStepToTemp(file, session.userId, session.companyId);
            } else if (session.fileType === 'glb') {
                result = await this.saveTempUploadedModel(file, 'glb', session.tempId, session.userId);
            } else if (session.fileType === 'usdz') {
                result = await this.saveTempUploadedModel(file, 'usdz', session.tempId, session.userId);
            } else {
                throw new BadRequestException('Desteklenmeyen dosya tipi');
            }
        } finally {
            // Chunk'ları ve geçici dosyaları temizle
            this.cleanupChunks(dto.uploadId);
        }

        return {
            ...result,
            uploadId: dto.uploadId,
            message: 'Upload başarıyla tamamlandı'
        };
    }

    /**
     * Upload durumunu getirir (resume için)
     */
    async getChunkedUploadStatus(uploadId: string, userId: number): Promise<ChunkUploadProgress> {
        const session = this.uploadSessions.get(uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session bulunamadı');
        }

        if (session.userId !== userId) {
            throw new ForbiddenException('Bu upload session size ait değil');
        }

        return this.getChunkedUploadProgress(session);
    }

    /**
     * Upload iptal eder
     */
    async cancelChunkedUpload(uploadId: string, userId: number): Promise<{ success: boolean }> {
        const session = this.uploadSessions.get(uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session bulunamadı');
        }

        if (session.userId !== userId) {
            throw new ForbiddenException('Bu upload session size ait değil');
        }

        session.status = 'CANCELLED';
        session.updatedAt = new Date();
        this.uploadSessions.set(uploadId, session);

        // Chunk'ları temizle
        this.cleanupChunks(uploadId);

        return { success: true };
    }

    // ==================== PRIVATE HELPERS ====================

    private getChunkedUploadProgress(session: ChunkedUploadSession): ChunkUploadProgress {
        const progress = (session.uploadedChunks.length / session.totalChunks) * 100;
        
        return {
            uploadId: session.uploadId,
            fileName: session.fileName,
            fileSize: session.fileSize,
            totalChunks: session.totalChunks,
            uploadedChunks: session.uploadedChunks,
            progress: Math.round(progress * 100) / 100,
            status: session.status,
            canResume: session.status === 'PENDING' || session.status === 'UPLOADING',
            error: session.error
        };
    }

    private cleanupChunks(uploadId: string) {
        const uploadDir = path.join(this.CHUNKS_ROOT, uploadId);
        if (fs.existsSync(uploadDir)) {
            try {
                fs.rmSync(uploadDir, { recursive: true, force: true });
            } catch (error) {
                console.error(`Chunk cleanup hatası (${uploadId}):`, error);
            }
        }
        this.uploadSessions.delete(uploadId);
    }

    private cleanExpiredSessions() {
        const now = new Date();
        for (const [uploadId, session] of this.uploadSessions.entries()) {
            if (session.expiresAt < now) {
                this.cleanupChunks(uploadId);
            }
        }
    }

    private getMimeType(fileType: string): string {
        const mimeTypes: Record<string, string> = {
            'glb': 'model/gltf-binary',
            'usdz': 'model/vnd.usdz+zip',
            'fbx': 'application/octet-stream',
            'step': 'application/step'
        };
        return mimeTypes[fileType] || 'application/octet-stream';
    }
}
