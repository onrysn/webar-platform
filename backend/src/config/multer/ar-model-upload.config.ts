import { diskStorage } from 'multer';
import { extname } from 'path';

export const modelUploadConfig = {
    storage: diskStorage({
        // ... (mevcut storage ayarlarınız buradaysa kalsın) ...
    }),
    fileFilter: (req: any, file: any, callback: (error: Error | null, acceptFile: boolean) => void) => {
        // İzin verilen tüm uzantıları buraya ekleyin
        const allowedExtensions = ['.glb', '.gltf', '.fbx', '.obj', '.dxf', '.usdz'];
        
        // Dosya uzantısını alıp küçültüyoruz
        const ext = extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            // İzin ver
            callback(null, true);
        } else {
            // Hata fırlat (Loglarınızdaki hatanın kaynağı burası)
            callback(new Error(`Unsupported model format. Allowed: ${allowedExtensions.join(', ')}`), false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // Örn: 50MB sınırı
    },
};