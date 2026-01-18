// src/services/arModelService.ts
import type { ARModelDto, TempModelResponse, FinalizeModelDto, ModelDetailDto, UpdateModelDto, ShareTokenResponse, UploadStatusResponse, UploadJobDto } from "../modules/ar-model/dto/arModel.dto";
import { apiService } from "./httpService/apiService"; // Axios instance
import type { AxiosProgressEvent } from "axios";

// Statik dosyalar (temp klasörü) genellikle API prefix'i olmadan sunulur.
// Nginx proxy ayarına göre burası dinamik çalışır.
const BACKEND_URL = `${window.location.origin}/api`;

export const arModelService = {
  // ----------------------------------------------------------------
  // 1. LİSTELEME
  // ----------------------------------------------------------------
  async listModels(companyId?: number, filters?: { categoryId?: number; seriesId?: number }): Promise<ARModelDto[]> {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.seriesId) params.seriesId = filters.seriesId;
    const res = await apiService.get<ARModelDto[]>('/ar-model/list', { params });
    return res.data;
  },

  // ----------------------------------------------------------------
  // 2. YÜKLEME İŞLEMLERİ (TEMP)
  // ----------------------------------------------------------------
  
  // FBX Yükleme
  async uploadFbx(file: File, companyId?: number, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (companyId) formData.append('companyId', String(companyId));

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-fbx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // STEP Yükleme
  async uploadStep(file: File, companyId?: number, onProgress?: (percent: number) => void): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (companyId) formData.append('companyId', String(companyId));

    const res = await apiService.post<TempModelResponse>('/ar-model/upload-step', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => handleProgress(e, onProgress),
    });
    return res.data;
  },

  // GLB Yükleme
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

  // USDZ Yükleme
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

  // ----------------------------------------------------------------
  // 3. KAYDETME (FINALIZE)
  // ----------------------------------------------------------------
  async finalizeModel(data: FinalizeModelDto): Promise<ARModelDto> {
    const formData = new FormData();
    formData.append('tempId', data.tempId);

    if (data.companyId) {
      formData.append('companyId', data.companyId.toString());
    }

    if (data.modelName) {
      formData.append('modelName', data.modelName);
    }

    // --- YENİ: Gizlilik Durumu ---
    if (data.isPrivate !== undefined) {
      // FormData boolean kabul etmez, string'e çeviriyoruz
      formData.append('isPrivate', String(data.isPrivate));
    }

    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail, 'thumbnail.png');
    }

    if (data.categoryId !== undefined) {
      formData.append('categoryId', String(data.categoryId));
    }
    if (data.seriesId !== undefined) {
      formData.append('seriesId', String(data.seriesId));
    }

    const res = await apiService.post<ARModelDto>('/ar-model/finalize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  },

  // ----------------------------------------------------------------
  // 4. DETAY VE DOSYA İŞLEMLERİ (AUTH REQUIRED)
  // ----------------------------------------------------------------
  
  // Model Detaylarını Getir
  async getModelDetails(id: number): Promise<ModelDetailDto> {
    const res = await apiService.get<ModelDetailDto>(`/ar-model/${id}`);
    return res.data;
  },

  // Dosyayı Blob Olarak Çek (Stream) - Panelden indirme/izleme için
  async getModelFileBlob(id: number, format: 'glb' | 'usdz', mode: 'view' | 'download'): Promise<Blob> {
    const res = await apiService.get(`/ar-model/${id}/file`, {
      params: { format, mode },
      responseType: 'blob',
    });
    return res.data as unknown as Blob;
  },

  // ----------------------------------------------------------------
  // 5. YÖNETİM VE PAYLAŞIM (YENİ)
  // ----------------------------------------------------------------

  // Model Güncelleme (İsim, Gizlilik)
  async updateModel(id: number, data: UpdateModelDto): Promise<ARModelDto> {
    const res = await apiService.post<ARModelDto>(`/ar-model/${id}/update`, data);
    return res.data;
  },

  // Paylaşım Linki Oluştur
  async generateShareToken(id: number): Promise<ShareTokenResponse> {
    const res = await apiService.post<ShareTokenResponse>(`/ar-model/${id}/share-token`);
    return res.data;
  },

  // Paylaşımı İptal Et
  async revokeShareToken(id: number): Promise<{ success: boolean; message: string }> {
    const res = await apiService.post<{ success: boolean; message: string }>(`/ar-model/${id}/revoke-token`);
    return res.data;
  },

  // Kuyruk Durumu
  async getUploadStatus(tempId: string): Promise<UploadStatusResponse> {
    const res = await apiService.get<UploadStatusResponse>('/ar-model/upload-status', { params: { tempId } });
    return res.data;
  },

  // Upload job list (queue overview)
  async listUploadJobs(companyId?: number, status?: string): Promise<UploadJobDto[]> {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (status) params.status = status;
    const res = await apiService.get<UploadJobDto[]>('/ar-model/upload-jobs', { params });
    return res.data;
  },

  // ----------------------------------------------------------------
  // 6. PUBLIC ERİŞİM (LOGIN GEREKTİRMEZ) (YENİ)
  // ----------------------------------------------------------------

  // Token ile model detayını getir (Müşteri ekranı için)
  async getSharedModel(token: string): Promise<any> { // DTO: SharedModelDto yapılabilir
    // Bu istekte Auth header gitse de sorun olmaz, backend guard yok.
    const res = await apiService.get(`/shared/ar-model/${token}`);
    return res.data;
  },

  // Token ile dosya stream et (Müşteri ekranı için)
  async getSharedFileBlob(token: string, format: 'glb' | 'usdz'): Promise<Blob> {
    const res = await apiService.get(`/shared/ar-model/${token}/file`, {
      params: { format },
      responseType: 'blob'
    });
    return res.data as unknown as Blob;
  },

  async convertSharedGlbToUsdz(file: Blob, fileName: string): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const res = await apiService.post<TempModelResponse>('/shared/ar-model/convert-shared-glb-to-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // ----------------------------------------------------------------
  // 7. ARAÇLAR
  // ----------------------------------------------------------------

  // GLB -> USDZ Çevirici
  async convertGlbToUsdz(file: Blob, fileName: string): Promise<TempModelResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const res = await apiService.post<TempModelResponse>('/ar-model/convert-glb-to-usdz', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Helper: Preview URL Oluşturucu
  getPreviewUrl(relativePath?: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${BACKEND_URL}${path}`;
  }
};

// Progress Helper
function handleProgress(event: AxiosProgressEvent, callback?: (percent: number) => void) {
  if (event.total && event.loaded && callback) {
    callback(Math.round((event.loaded * 100) / event.total));
  }
}