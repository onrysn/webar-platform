import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Logo upload dizini
const uploadDir = join(process.cwd(), 'uploads', 'logo');

// Dizin yoksa oluştur
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const logoUploadConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      callback(null, uploadDir);
    },
    filename: (req, file, callback) => {
      // Benzersiz dosya adı: company-{timestamp}-{random}.ext
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      callback(null, `company-logo-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req: any, file: any, callback: (error: Error | null, acceptFile: boolean) => void) => {
    // Sadece resim dosyaları kabul edilir
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP, SVG)'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};
