// src/services/arModelService.ts
import type { ARModelDto, TempModelResponse, FinalizeModelDto, ModelDetailDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService"; // Axios instance
import type { AxiosProgressEvent } from "axios";

// Statik dosyalar (temp klasörü) genellikle API prefix'i olmadan sunulur.
// Eğer backend http://localhost:3000 ise:
const BACKEND_URL = `${window.location.origin}/api`;

export const arModelService = {
  // 1. Listeleme
  // Super Admin ise companyId gönderebilir, yoksa backend token'dan okur.
  async listModels(companyId?: number): Promise<ARModelDto[]> {
    const params = companyId ? { companyId } : {};
    const res = await apiService.get<ARModelDto[]>('/ar-model/list', { params });
    return res.data;
  },

  // 2. FBX Yükleme
  async uploadFbx(file: File, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-fbx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // STEP Yükleme
  async uploadStep(file: File, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-step', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 3. GLB Yükleme
  async uploadGlb(file: File, tempId?: string, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (tempId) formData.append('tempId', tempId);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-glb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 4. USDZ Yükleme
  async uploadUsdz(file: File, tempId?: string, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (tempId) formData.append('tempId', tempId);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 5. Finalize (Kaydetme)
  async finalizeModel(data: FinalizeModelDto): Promise<ARModelDto> {
    const formData = new FormData();
    formData.append('tempId', data.tempId);

    // Backend artık companyId'yi token'dan alıyor.
    // Ancak Super Admin başkası adına yüklüyorsa manuel ekleriz.
    if (data.companyId) {
      formData.append('companyId', data.companyId.toString());
    }

    if (data.modelName) {
      formData.append('modelName', data.modelName);
    }

    if (data.thumbnail) {
      // Blob veya File olabilir
      formData.append('thumbnail', data.thumbnail, 'thumbnail.png');
    }

    const res = await apiService.post<ARModelDto>('/ar-model/finalize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  },

  // 6. Model Detaylarını Getir
  async getModelDetails(id: number): Promise<ModelDetailDto> {
    const res = await apiService.get<ModelDetailDto>(`/ar-model/${id}`);
    return res.data;
  },

  // 7. Dosyayı Blob Olarak Çek (Stream)
  async getModelFileBlob(id: number, format: 'glb' | 'usdz', mode: 'view' | 'download'): Promise<Blob> {
    const res = await apiService.get(`/ar-model/${id}/file`, {
      params: { format, mode },
      responseType: 'blob',
    });
    return res.data as unknown as Blob;
  },

  // 8. GLB -> USDZ Çevirici
  async convertGlbToUsdz(file: Blob, fileName: string): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const res = await apiService.post<TempModelResponse>('/ar-model/convert-glb-to-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Helper: Preview URL Oluşturucu
  // Backend'den "/temp/..." gibi gelen yolu tam URL'e çevirir.
  getPreviewUrl(relativePath?: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;

    // Başında slash yoksa ekle
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    // Backend URL ile birleştir (Statik dosyalar için)
    return `${BACKEND_URL}${path}`;
  }
};

// Progress Helper
function handleProgress(event: AxiosProgressEvent, callback?: (percent: number) => void) {
  if (event.total && event.loaded && callback) {
    callback(Math.round((event.loaded * 100) / event.total));
  }
}