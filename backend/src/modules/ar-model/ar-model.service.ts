// ar-model.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { File as MulterFile } from 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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

    async uploadModel(file: MulterFile, companyId: number, uploadedBy: number) {
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
            },
        });
    }
}
