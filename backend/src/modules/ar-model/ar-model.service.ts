// ar-model.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { File as MulterFile } from 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class ARModelService {
    private key: Buffer;

    constructor(private prisma: PrismaService) {
        const keyHex = process.env.ENCRYPTION_KEY;
        if (!keyHex || keyHex.length !== 64) {
            throw new Error('ENCRYPTION_KEY is missing or invalid (must be 32 bytes hex)!');
        }
        this.key = Buffer.from(keyHex, 'hex'); // 32 byte
    }

    // AES-256-GCM şifreleme
    private encrypt(buffer: Buffer) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encrypted, iv, authTag };
    }

    // AES-256-GCM çözme
    decryptFile(filePath: string, ivHex: string, authTagHex: string): Buffer {
        const encryptedBuffer = fs.readFileSync(filePath);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    }

    // MIME tipini veya uzantıyı almak
    private getFileType(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();
        return ext || 'application/octet-stream';
    }

    // Dosya adı uzantısız
    private getFileNameWithoutExt(fileName: string): string {
        return path.basename(fileName, path.extname(fileName));
    }

    async uploadModel(file: MulterFile, companyId: number, uploadedBy: number, thumbnailBase64?: string | null) {
        // 1️⃣ Dosyayı şifrele
        const { encrypted, iv, authTag } = this.encrypt(file.buffer);

        // 2️⃣ Klasör kontrolü
        const uploadDir = path.resolve('./uploads/models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 3️⃣ Benzersiz dosya adı
        const encryptedName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.enc`;
        const savePath = path.join(uploadDir, encryptedName);

        // 4️⃣ Şifreli dosyayı kaydet
        await fs.promises.writeFile(savePath, encrypted);

        // 5️⃣ Dosya hash (bütünlük kontrolü için plaintext üzerinden)
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        let thumbnailPath: string | null = null;

        // 6️⃣ Thumbnail kaydet (opsiyonel)
        if (thumbnailBase64) {
            const thumbDir = path.resolve('./uploads/thumbnails');
            if (!fs.existsSync(thumbDir)) {
                fs.mkdirSync(thumbDir, { recursive: true });
            }

            const thumbFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
            thumbnailPath = path.join(thumbDir, thumbFileName);

            // Base64 → buffer
            const base64Data = thumbnailBase64.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            await fs.promises.writeFile(thumbnailPath, buffer);
        }


        // 6️⃣ DB kaydı oluştur
        return this.prisma.aRModel.create({
            data: {
                fileName: this.getFileNameWithoutExt(file.originalname),
                fileType: this.getFileType(file.originalname),
                filePath: savePath,
                fileSize: encrypted.length,
                fileHash,
                companyId,
                uploadedBy,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                thumbnailPath,
            },
        });
    }

    async convertForTest(file: MulterFile): Promise<string> {
        let glbPath = file.path;

        // --- DÜZELTME BAŞLANGICI ---
        // Eğer Multer MemoryStorage kullanıyorsa 'path' undefined gelir.
        // Bu durumda buffer'ı diske geçici olarak yazmalıyız.
        if (!glbPath) {
            if (!file.buffer) {
                throw new InternalServerErrorException('File uploaded but neither path nor buffer found.');
            }

            // Geçici bir dosya yolu oluştur (uploads/temp klasörü altına)
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Dosya ismini güvenli hale getir
            const safeName = (file.originalname || 'temp_model.glb').replace(/[^a-zA-Z0-9.]/g, '_');
            glbPath = path.join(tempDir, `${Date.now()}-${safeName}`);

            // Buffer'ı diske yaz
            fs.writeFileSync(glbPath, file.buffer);
        }
        // --- DÜZELTME BİTİŞİ ---

        const outputDir = path.dirname(glbPath);
        // Dosya uzantısını (.glb) silip yerine .usdz ekle
        const fileName = path.basename(glbPath, path.extname(glbPath));
        const usdzOutputName = `${fileName}.usdz`;
        const usdzOutputPath = path.join(outputDir, usdzOutputName);

        // Docker içindeki script yolu
        const scriptPath = path.join(process.cwd(), 'scripts', 'convert.py');

        return new Promise((resolve, reject) => {
            const blender = spawn('blender', [
                '-b',
                '-P', scriptPath,
                '--',
                glbPath,
                usdzOutputPath,
            ]);

            let errorLog = '';

            blender.stderr.on('data', (data) => {
                errorLog += data.toString();
            });

            blender.on('close', (code) => {
                // İşlem bittiyse ve dosya varsa
                if (code === 0 && fs.existsSync(usdzOutputPath)) {
                    resolve(usdzOutputPath);
                } else {
                    console.error(`Blender Error Log: ${errorLog}`);
                    reject(new InternalServerErrorException(`Conversion failed with code ${code}. Log: ${errorLog}`));
                }
            });
        });
    }
}
