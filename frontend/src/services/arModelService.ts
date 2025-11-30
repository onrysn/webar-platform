import type { ARModelDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService";
import type { AxiosProgressEvent } from "axios";

export const arModelService = {
  async listModels(companyId?: number): Promise<ARModelDto[]> {
    const res = await apiService.get('/ar-model/list', { params: { companyId } });
    return res.data;
  },

  async uploadModel(
    file: File,
    companyId: number,
    thumbnailBase64?: string | null,
    onProgress?: (percent: number) => void
  ): Promise<ARModelDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', String(companyId));
    if (thumbnailBase64) formData.append('thumbnail', thumbnailBase64);

    const res = await apiService.post<ARModelDto>('/ar-model/upload', formData, {
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

  async downloadModel(id: number): Promise<Blob> {
    const res = await apiService.get(`/ar-model/download/${id}`, { responseType: 'blob' });
    return res.data;
  },
};
