// src/services/arSceneService.ts
import { apiService } from "./httpService/apiService";
import type {
  ARSceneDto,
  CreateSceneDto,
  UpdateSceneDto,
  AddSceneItemDto,
  UpdateSceneItemDto,
  SceneItemDto,
  FloorTextureDto,
  CreateFloorTextureDto,
  ShareSceneResponse,
  SceneExportResponse
} from "../modules/ar-scene/dto/arScene.dto";

export const arSceneService = {
  // =================================================================
  // 1. SAHNE YÖNETİMİ
  // =================================================================

  // Sahne Oluştur
  async createScene(data: CreateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.post<ARSceneDto>('/ar-scene', data);
    return res.data;
  },

  // Sahne Güncelle
  async updateScene(id: number, data: UpdateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.patch<ARSceneDto>(`/ar-scene/${id}`, data);
    return res.data;
  },

  // Listele
  async listScenes(companyId?: number, categoryId?: number): Promise<ARSceneDto[]> {
    const params: any = {};
    if (companyId !== undefined) params.companyId = companyId;
    if (categoryId !== undefined) params.categoryId = categoryId;
    const res = await apiService.get<ARSceneDto[]>('/ar-scene/list', { params });
    return res.data;
  },

  // Detay (Editör için - Auth Gerekli)
  async getScene(id: number): Promise<ARSceneDto> {
    const res = await apiService.get<ARSceneDto>(`/ar-scene/${id}`);
    return res.data;
  },

  // Sahne Sil (Soft Delete)
  async deleteScene(id: number): Promise<void> {
    await apiService.delete(`/ar-scene/${id}`);
  },

  // =================================================================
  // 2. ITEM (OBJE) İŞLEMLERİ
  // =================================================================

  // Eşya Ekle
  async addItem(data: AddSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.post<SceneItemDto>('/ar-scene/item', data);
    return res.data;
  },

  // Eşya Güncelle
  async updateItem(itemId: number, data: UpdateSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.patch<SceneItemDto>(`/ar-scene/item/${itemId}`, data);
    return res.data;
  },

  // Eşya Sil
  async removeItem(itemId: number): Promise<void> {
    await apiService.delete(`/ar-scene/item/${itemId}`);
  },

  // =================================================================
  // 3. DOKU (TEXTURE) İŞLEMLERİ
  // =================================================================

  async listFloorTextures(category?: string): Promise<FloorTextureDto[]> {
    const params = category ? { category } : {};
    const res = await apiService.get<FloorTextureDto[]>('/ar-scene/textures', { params });
    return res.data;
  },

  async createFloorTexture(data: CreateFloorTextureDto): Promise<FloorTextureDto> {
    const res = await apiService.post<FloorTextureDto>('/ar-scene/textures', data);
    return res.data;
  },

  async updateFloorTexture(id: number, data: Partial<CreateFloorTextureDto>): Promise<FloorTextureDto> {
    const res = await apiService.patch<FloorTextureDto>(`/ar-scene/textures/${id}`, data);
    return res.data;
  },

  async deleteFloorTexture(id: number): Promise<void> {
    await apiService.delete(`/ar-scene/textures/${id}`);
  },

  // =================================================================
  // 4. PAYLAŞIM VE PUBLIC ERİŞİM (YENİ)
  // =================================================================

  // Paylaşım Linki Oluştur
  async generateShareToken(id: number): Promise<ShareSceneResponse> {
    const res = await apiService.post<ShareSceneResponse>(`/ar-scene/${id}/share-token`);
    return res.data;
  },

  // Paylaşımı İptal Et
  async revokeShareToken(id: number): Promise<{ success: boolean }> {
    const res = await apiService.post<{ success: boolean }>(`/ar-scene/${id}/revoke-token`);
    return res.data;
  },

  async getSharedScene(token: string): Promise<ARSceneDto> {
    const res = await apiService.get<ARSceneDto>(`/shared/ar-scene/${token}`);
    return res.data;
  },

  async getSharedModelBlob(token: string, modelId: number, format: 'glb' | 'usdz' = 'glb'): Promise<Blob> {
    const res = await apiService.get(`/shared/ar-scene/${token}/model/${modelId}`, {
      params: { format },
      responseType: 'blob'
    });
    return res.data;
  },

  // =================================================================
  // 5. SCENE EXPORT - Frontend GLB upload + Backend USDZ dönüşümü
  // =================================================================

  /**
   * Backend'den sahneyi GLB olarak export etmesini ister.
   * Backend Three.js ile sahneyi sıfırdan oluşturur, opsiyonel olarak USDZ'ye dönüştürür.
   * Mobil cihazlardaki export yükünü tamamen sunucuya alır.
   */
  async exportSceneForAR(
    token: string,
    sceneName: string,
    convertToUsdz: boolean = true,
  ): Promise<SceneExportResponse> {
    const params: any = { sceneName };
    if (!convertToUsdz) params.convertToUsdz = 'false';

    const res = await apiService.get<SceneExportResponse>(
      `/shared/ar-scene/${token}/export`,
      {
        params,
        timeout: 120000, // 2dk timeout - sahne oluşturma + USDZ dönüşümü uzun sürebilir
      },
    );
    return res.data;
  },

  /**
   * Backend tarafından dönen relative URL'yi tam URL'ye çevirir
   */
  getExportFileUrl(relativePath?: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${window.location.origin}${path}`;
  },
};