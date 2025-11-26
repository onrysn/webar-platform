import { memoryStorage } from 'multer';
import { extname } from 'path';

export const modelUploadConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['.glb', '.gltf', '.usdz'];
    const ext = extname(file.originalname).toLowerCase();

    if (!allowed.includes(ext)) {
      return cb(new Error('Unsupported model format'), false);
    }

    cb(null, true);
  },
};
