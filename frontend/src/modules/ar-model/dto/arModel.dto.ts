export interface ARModelDto {
  id: number;
  fileName: string;
  fileType: string;
  companyId: number;
  fileSize: number;       // byte cinsinden
  createdAt: string;      // ISO tarih string
  thumbnailPath: string | null; // opsiyonel küçük önizleme yolu
}
