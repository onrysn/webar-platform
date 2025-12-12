import type { ARModelDto, TempModelResponse, FinalizeModelDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService";
import type { AxiosProgressEvent } from "axios";

// Backend URL'ini önizleme path'lerine eklemek için
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const arModelService = {
  // 1. Listeleme
  async listModels(companyId?: number): Promise<ARModelDto[]> {
    const res = await apiService.get('/ar-model/list', { params: { companyId } });
    return res.data;
  },

  // 2. Geçici Yükleme (Dosya tipine göre yönlendirme)
  async uploadTempModel(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const ext = file.name.split('.').pop()?.toLowerCase();
    let endpoint = '/ar-model/upload-glb'; // varsayılan

    if (ext === 'fbx') endpoint = '/ar-model/upload-fbx';
    else if (ext === 'usdz') endpoint = '/ar-model/upload-usdz';
    else if (ext === 'glb' || ext === 'gltf') endpoint = '/ar-model/upload-glb';

    const res = await apiService.post<TempModelResponse>(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && progressEvent.loaded && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },

  // 3. Finalize (Kalıcı hale getirme)
  async finalizeModel(data: FinalizeModelDto): Promise<ARModelDto> {
    const res = await apiService.post<ARModelDto>('/ar-model/finalize', data);
    return res.data;
  },

  // 4. İndirme
  async downloadModel(id: number): Promise<Blob> {
    const res = await apiService.get(`/ar-model/download/${id}`, { responseType: 'blob' });
    return res.data;
  },

  // Helper: Relative URL'i tam URL'e çevirir (Örn: /temp/123/x.glb -> http://api/temp/123/x.glb)
  getPreviewUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) return relativePath;
    // Başındaki slash'ı kontrol et
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${API_BASE_URL}${path}`;
  }
};