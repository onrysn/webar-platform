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

    async convertStepToTemp(file: MulterFile, userId?: number) {
        return this._genericConvertToTemp(file, userId, 'step');
    }

    async convertFbxToTemp(file: MulterFile, userId?: number) {
        return this._genericConvertToTemp(file, userId, 'fbx');
    }

    async convertGlbToUsdzTemp(file: MulterFile, userId?: number) {
        // (Burası aynen kalıyor...)
        const tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);
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
    private async _genericConvertToTemp(file: MulterFile, userId: number | undefined, type: 'fbx' | 'step') {
        const tempId = `${Date.now()}_${uuidv4()}`;
        const tempDir = this.ensureTempDir(tempId);
        let inputPath: string | undefined;

        if (file.buffer && file.buffer.length > 0) {
            const inputName = `${Date.now()}_${path.basename(file.originalname)}`;
            inputPath = path.join(tempDir, inputName);
            fs.writeFileSync(inputPath, file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
            inputPath = path.join(tempDir, `${Date.now()}_${path.basename(file.path) + path.extname(file.originalname)}`);
            fs.copyFileSync(file.path, inputPath);
        } else {
            throw new InternalServerErrorException(`No file buffer or path for ${type.toUpperCase()} upload`);
        }

        let glbPath: string;
        try {
            if (type === 'fbx') {
                const fakeMulterFile = { originalname: path.basename(inputPath), path: inputPath } as unknown as MulterFile;
                glbPath = await this.convertCadToGlb(fakeMulterFile);
            } else {
                glbPath = await this.convertStepToGlb(inputPath);
            }
        } catch (error) {
            throw error;
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(glbPath), {
            filename: path.basename(glbPath),
            contentType: 'model/gltf-binary'
        });

        const convertResp = await fetch(`${this.converterUrl}/api/convert`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!convertResp.ok) {
            const text = await convertResp.text();
            throw new InternalServerErrorException('USDZ Converter failed: ' + text);
        }

        const convertJson = await convertResp.json();
        const { id, name } = convertJson as { id: string; name: string };

        const downloadUrl = `${this.converterUrl}/api/download?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
        const usdzResp = await fetch(downloadUrl);
        if (!usdzResp.ok) {
            throw new InternalServerErrorException('USDZ download failed: ' + (await usdzResp.text()));
        }
        const usdzBuffer = await usdzResp.buffer();

        const safeBase = path.basename(this.getFileNameWithoutExt(file.originalname));
        const glbName = `${safeBase}.glb`;
        const usdzName = `${safeBase}.usdz`;

        const finalGlbPath = path.join(tempDir, glbName);
        const finalUsdzPath = path.join(tempDir, usdzName);

        fs.copyFileSync(glbPath, finalGlbPath);
        fs.writeFileSync(finalUsdzPath, usdzBuffer);

        if (glbPath !== finalGlbPath && fs.existsSync(glbPath)) {
            try { fs.unlinkSync(glbPath); } catch (e) { /* ignore */ }
        }

        return {
            tempId,
            glb: { filename: glbName, url: `/temp/${tempId}/${glbName}`, path: finalGlbPath, size: fs.statSync(finalGlbPath).size },
            usdz: { filename: usdzName, url: `/temp/${tempId}/${usdzName}`, path: finalUsdzPath, size: fs.statSync(finalUsdzPath).size },
        };
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

        const files = fs.readdirSync(tempDir);
        const glbFile = files.find(f => f.toLowerCase().endsWith('.glb'));
        const usdzFile = files.find(f => f.toLowerCase().endsWith('.usdz'));

        if (!glbFile || !usdzFile) {
            throw new BadRequestException('Both GLB and USDZ must be present to finalize.');
        }

        // 1. Şifreleme
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

        return { id: created.id, fileName: created.fileName, message: 'Model saved successfully' };
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
}