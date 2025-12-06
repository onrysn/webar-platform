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

        // --- 1. DOSYA ADI VE UZANTI KONTROLÜ ---
        // Dosyanın orijinal uzantısını alıyoruz (.glb)
        const originalExt = path.extname(file.originalname).toLowerCase();

        // A) DiskStorage durumunda:
        // Multer dosyayı uzantısız kaydettiyse (örn: "temp/1234abc"), sonuna .glb ekleyelim.
        if (glbPath) {
            if (!glbPath.toLowerCase().endsWith(originalExt)) {
                const newPath = glbPath + originalExt;
                try {
                    fs.renameSync(glbPath, newPath);
                    glbPath = newPath;
                } catch (err) {
                    console.error('Dosya yeniden adlandırılamadı:', err);
                }
            }
        }

        // B) MemoryStorage (Buffer) durumunda veya yol yoksa:
        if (!glbPath) {
            if (!file.buffer) {
                throw new InternalServerErrorException('File uploaded but neither path nor buffer found.');
            }

            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Dosya ismini güvenli hale getir ve mutlaka UZANTIYI ekle
            const safeName = (file.originalname || 'temp_model')
                .replace(/[^a-zA-Z0-9.]/g, '_')
                .replace(originalExt, ''); // Uzantı çiftlenmesin diye siliyoruz

            // Timestamp + Ad + Uzantı
            glbPath = path.join(tempDir, `${Date.now()}-${safeName}${originalExt}`);

            fs.writeFileSync(glbPath, file.buffer);
        }
        // -----------------------------------------------------

        const outputDir = path.dirname(glbPath);
        const fileName = path.basename(glbPath, path.extname(glbPath));
        const usdzOutputName = `${fileName}.usdz`;
        const usdzOutputPath = path.join(outputDir, usdzOutputName);

        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_glb_usdz.py');

        return new Promise((resolve, reject) => {
            const blender = spawn('blender', [
                '-b',           // Background (Arayüzsüz)
                '-noaudio',     // <--- SES HATASINI ÇÖZEN KOMUT
                '-P', scriptPath,
                '--',
                glbPath,
                usdzOutputPath,
            ]);

            let combinedLog = '';

            // Hem stdout hem stderr dinleniyor
            blender.stdout.on('data', (data) => {
                combinedLog += data.toString();
            });

            blender.stderr.on('data', (data) => {
                combinedLog += data.toString();
            });

            blender.on('close', (code) => {
                // İşlem bitti ve dosya oluştuysa başarılı
                if (code === 0 && fs.existsSync(usdzOutputPath)) {
                    resolve(usdzOutputPath);
                } else {
                    console.error(`Blender USDZ Conversion Failed (Code: ${code})`);
                    console.error(`Full Log:\n${combinedLog}`);

                    reject(new InternalServerErrorException(
                        `Conversion failed with code ${code}. Check server logs for details.`
                    ));
                }
            });
        });
    }

    async convertCadToGlb(file: MulterFile): Promise<string> {
        let inputPath = file.path;

        // Dosyanın orijinal uzantısını alıyoruz (Örn: .fbx, .obj)
        // Blender scripti bu uzantıya bakarak import yöntemini seçiyor.
        const originalExt = path.extname(file.originalname).toLowerCase();

        // --- 1. SENARYO: Dosya DiskStorage ile kaydedildiyse ---
        // Multer bazen dosyaları uzantısız kaydeder (örn: "temp/1234abc").
        // Eğer dosya yolunda uzantı yoksa, yeniden adlandırıp uzantıyı ekliyoruz.
        if (inputPath) {
            if (!inputPath.toLowerCase().endsWith(originalExt)) {
                const newPath = inputPath + originalExt;
                try {
                    fs.renameSync(inputPath, newPath);
                    inputPath = newPath; // Artık script'e bu yeni yolu göndereceğiz
                } catch (err) {
                    console.error('Dosya yeniden adlandırılamadı:', err);
                    // Rename başarısız olsa bile devam edelim, belki şans eseri çalışır
                }
            }
        }

        // --- 2. SENARYO: Dosya MemoryStorage (Buffer) ile geldiyse ---
        // inputPath henüz yoksa, buffer'ı diske yazmamız gerekiyor.
        if (!inputPath) {
            if (!file.buffer) {
                throw new InternalServerErrorException('File uploaded but neither path nor buffer found.');
            }

            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Dosya ismini güvenli hale getir ve mutlaka UZANTIYI ekle
            const safeName = (file.originalname || 'temp_cad_model')
                .replace(/[^a-zA-Z0-9.]/g, '_')
                .replace(originalExt, ''); // Uzantıyı çiftlememek için siliyoruz, aşağıda ekleyeceğiz

            // Dosya yolunu oluştururken uzantıyı (originalExt) eklemeyi unutmuyoruz
            inputPath = path.join(tempDir, `${Date.now()}-${safeName}${originalExt}`);

            fs.writeFileSync(inputPath, file.buffer);
        }

        // --- CONVERT İŞLEMİ HAZIRLIK ---

        const outputDir = path.dirname(inputPath);
        // Dosya adını alıp uzantısını değiştiriyoruz
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const glbOutputName = `${fileName}.glb`;
        const glbOutputPath = path.join(outputDir, glbOutputName);

        // Python scriptimizin yolu
        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_cad_to_glb.py');

        // --- BLENDER PROCESS ---
        return new Promise((resolve, reject) => {
            const blender = spawn('blender', [
                '-b',           // Background mod (arayüzsüz)
                '-noaudio',     // Ses sistemini kapat (Docker/Linux hatalarını önler)
                '-P', scriptPath, // Python scriptini çalıştır
                '--',           // Script argümanları başlıyor
                inputPath,      // Girdi dosyası
                glbOutputPath,  // Çıktı dosyası
            ]);

            let combinedLog = '';

            // Hem normal çıktıları (stdout) hem de hataları (stderr) yakalıyoruz
            // Çünkü Blender bazen hataları normal çıktı gibi basabiliyor.
            blender.stdout.on('data', (data) => {
                combinedLog += data.toString();
            });

            blender.stderr.on('data', (data) => {
                combinedLog += data.toString();
            });

            blender.on('close', (code) => {
                // İşlem bitti ve dosya başarıyla oluştu mu?
                if (code === 0 && fs.existsSync(glbOutputPath)) {
                    resolve(glbOutputPath);
                } else {
                    // Hata durumunda konsola detaylı log basıyoruz
                    console.error(`Blender Process Failed (Code: ${code})`);
                    console.error(`Full Log:\n${combinedLog}`);

                    reject(new InternalServerErrorException(
                        `CAD conversion failed with code ${code}. Check server logs for details.`
                    ));
                }
            });
        });
    }
}
