export interface ARModelDto {
  id: number;
  fileName: string;
  fileType: string;
  companyId: number;
  fileSize: number;
  createdAt: string;
  thumbnailPath: string | null;
  
  isPrivate: boolean;
  shareToken?: string | null;
}

export interface TempModelResponse {
  tempId: string;
  kind?: 'glb' | 'usdz';
  filename?: string;
  previewUrl?: string;
  
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
  companyId?: number;
  modelName?: string;
  thumbnail?: File | Blob;
  isPrivate?: boolean;
}

export interface ModelDetailDto {
  id: number;
  fileName: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
  thumbnailUrl: string | null;
  isPrivate: boolean;
  shareToken?: string | null;
  shareUrl?: string | null;
  
  files: {
    glb: { exists: boolean; size: number; format: 'glb' };
    usdz: { exists: boolean; size: number; format: 'usdz' };
  };
}

export interface UpdateModelDto {
  name?: string;
  isPrivate?: boolean;
}

export interface ShareTokenResponse {
  shareToken: string;
  url: string;
}