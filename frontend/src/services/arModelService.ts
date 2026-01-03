import type { ARModelDto, TempModelResponse, FinalizeModelDto, ModelDetailDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService"; // Yolunu projene göre ayarla
import type { AxiosProgressEvent } from "axios";

const API_BASE_URL = `${window.location.origin}/api`;

export const arModelService = {
  // 1. Listeleme
  async listModels(companyId?: number): Promise<ARModelDto[]> {
    const res = await apiService.get('/ar-model/list', { params: { companyId } });
    return res.data;
  },

  // 2. FBX Yükleme (Convert işlemini tetikler, tempId'ye ihtiyaç duymaz)
  async uploadFbx(file: File, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-fbx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  async uploadStep(file: File, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-step', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 3. GLB Yükleme (Manuel - Varsa tempId alır)
  async uploadGlb(file: File, tempId?: string, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (tempId) formData.append('tempId', tempId); // Kritik nokta: Dosyaları birleştirir

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-glb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 4. USDZ Yükleme (Manuel - Varsa tempId alır)
  async uploadUsdz(file: File, tempId?: string, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (tempId) formData.append('tempId', tempId); // Kritik nokta: Dosyaları birleştirir

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // 5. Finalize
  async finalizeModel(data: FinalizeModelDto): Promise<ARModelDto> {
    const formData = new FormData();
    formData.append('tempId', data.tempId);
    formData.append('companyId', data.companyId.toString());

    if (data.modelName) {
      formData.append('modelName', data.modelName);
    }

    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail, 'thumbnail.png');
    }

    const res = await apiService.post<ARModelDto>('/ar-model/finalize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  },

  // Helper: Preview URL
  getPreviewUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${API_BASE_URL}${path}`;
  },

  // 6. [YENİ] Model Detaylarını Getir
  async getModelDetails(id: number): Promise<ModelDetailDto> {
    const res = await apiService.get<ModelDetailDto>(`/ar-model/${id}`);
    return res.data;
  },

  // 7. [YENİ] Dosyayı Blob Olarak Çek (Preview veya Download için)
  async getModelFileBlob(id: number, format: 'glb' | 'usdz', mode: 'view' | 'download'): Promise<Blob> {
    const res = await apiService.get(`/ar-model/${id}/file`, {
      params: { format, mode },
      responseType: 'blob', // Binary veri olduğu için çok önemli
    });
    return res.data as unknown as Blob;
  },

  // 8. [YENİ] GLB'den USDZ'ye Dönüştür
  async convertGlbToUsdz(file: Blob, fileName: string): Promise<TempModelResponse> {
    const formData = new FormData();
    // Blob'u dosyaya çevirip ekliyoruz
    formData.append('file', file, fileName);

    const res = await apiService.post<TempModelResponse>('/ar-model/convert-glb-to-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

};

// Kod tekrarını önlemek için helper
function handleProgress(event: AxiosProgressEvent, callback?: (percent: number) => void) {
  if (event.total && event.loaded && callback) {
    callback(Math.round((event.loaded * 100) / event.total));
  }
}