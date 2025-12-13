// arModel.dto.ts

// Veritabanındaki kalıcı kayıt modeli
export interface ARModelDto {
  id: number;
  fileName: string;
  fileType: string;
  companyId: number;
  fileSize: number;
  createdAt: string;
  thumbnailPath: string | null;
}

// Geçici yükleme sonrası dönen cevap modeli
export interface TempModelResponse {
  tempId: string;
  kind?: 'glb' | 'usdz';
  filename?: string;
  previewUrl?: string; // Tek dosya yüklendiyse (glb/usdz)
  
  // FBX dönüşümü sonrası dönen yapı:
  glb?: {
    filename: string;
    url: string;
    size: number;
  };
  usdz?: {
    filename: string;
    url: string;
    size: number;
  };
}

export interface FinalizeModelDto {
  tempId: string;
  companyId: number;
  modelName?: string;
  thumbnail?: string; // Base64 string
}

export interface ModelDetailDto {
  id: number;
  fileName: string;
  description: string; // Backend'den "Şirket Adı tarafından yüklendi" gibi geliyor
  uploadedBy: string;
  createdAt: string;
  thumbnailUrl: string | null;
  files: {
    glb: { exists: boolean; size: number; format: 'glb' };
    usdz: { exists: boolean; size: number; format: 'usdz' };
  };
}