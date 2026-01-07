
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
  previewUrl?: string; // Backend'den gelen relative path (örn: /temp/123/model.glb)
  
  // FBX/STEP dönüşümü sonrası dönen yapı:
  glb?: {
    filename: string;
    url: string;
    path: string;
    size: number;
  };
  usdz?: {
    filename: string;
    url: string;
    path: string;
    size: number;
  };
}

export interface FinalizeModelDto {
  tempId: string;
  companyId?: number; // <-- ARTIK OPSİYONEL (Sadece Super Admin kullanır)
  modelName?: string;
  thumbnail?: File | Blob;
}

export interface ModelDetailDto {
  id: number;
  fileName: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
  thumbnailUrl: string | null;
  files: {
    glb: { exists: boolean; size: number; format: 'glb' };
    usdz: { exists: boolean; size: number; format: 'usdz' };
  };
}