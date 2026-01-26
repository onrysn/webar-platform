import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const textureUploadConfig = {
  storage: diskStorage({
    destination: (req: any, file: any, callback: (error: Error | null, destination: string) => void) => {
      // Get texture name from query parameter (more reliable with multipart/form-data)
      const textureName = req.query?.textureName || req.body?.textureName || 'unknown';
      
      // Sanitize folder name (remove special chars, spaces to dash)
      const folderName = textureName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const uploadPath = join(process.cwd(), 'textures', 'pbr', folderName);

      // Create directory if not exists
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      callback(null, uploadPath);
    },
    filename: (req: any, file: any, callback: (error: Error | null, filename: string) => void) => {
      // Use fieldname as filename (baseColor, normal, roughness, etc.)
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req: any, file: any, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      callback(null, true);
    } else {
      callback(new Error(`Unsupported texture format. Allowed: ${allowedExtensions.join(', ')}`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per texture
  },
};
