import type { ARModelDto, TempModelResponse, FinalizeModelDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService"; // Yolunu projene göre ayarla
import type { AxiosProgressEvent } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
    const res = await apiService.post<ARModelDto>('/ar-model/finalize', data);
    return res.data;
  },

  // Helper: Preview URL
  getPreviewUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${API_BASE_URL}${path}`;
  }
};

// Kod tekrarını önlemek için helper
function handleProgress(event: AxiosProgressEvent, callback?: (percent: number) => void) {
  if (event.total && event.loaded && callback) {
    callback(Math.round((event.loaded * 100) / event.total));
  }
}