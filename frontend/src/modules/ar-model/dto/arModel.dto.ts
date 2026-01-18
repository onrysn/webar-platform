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
  categoryId?: number | null;
  seriesId?: number | null;
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
  status?: 'QUEUED' | 'CONVERTING' | 'CONVERTED' | 'WAITING_APPROVAL' | 'APPROVED' | 'ERROR';
  progress?: number;
}

export interface FinalizeModelDto {
  tempId: string;
  companyId?: number;
  modelName?: string;
  thumbnail?: File | Blob;
  isPrivate?: boolean;
  categoryId?: number;
  seriesId?: number;
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
  companyId?: number; // SUPER_ADMIN için şirket bağlamı
  category?: { id: number; name: string } | null;
  series?: { id: number; name: string; code?: string | null } | null;
  
  files: {
    glb: { exists: boolean; size: number; format: 'glb' };
    usdz: { exists: boolean; size: number; format: 'usdz' };
  };
}

export interface UpdateModelDto {
  name?: string;
  isPrivate?: boolean;
  categoryId?: number | null;
  seriesId?: number | null;
}

export interface ShareTokenResponse {
  shareToken: string;
  url: string;
}

export interface UploadStatusResponse {
  tempId: string;
  status: 'QUEUED' | 'CONVERTING' | 'CONVERTED' | 'WAITING_APPROVAL' | 'APPROVED' | 'ERROR';
  progress?: number;
  message?: string;
  glb?: { filename: string; url: string; size?: number };
  usdz?: { filename: string; url: string; size?: number };
}

export interface UploadJobDto {
  tempId: string;
  type: 'FBX' | 'STEP' | 'GLB' | 'USDZ' | string;
  status: 'QUEUED' | 'CONVERTING' | 'CONVERTED' | 'ERROR' | 'APPROVED' | string;
  progress?: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
}