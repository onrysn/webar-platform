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
  ShareSceneResponse
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
  async listScenes(companyId?: number): Promise<ARSceneDto[]> {
    const params = companyId ? { companyId } : {};
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

  async listFloorTextures(): Promise<FloorTextureDto[]> {
    const res = await apiService.get<FloorTextureDto[]>('/ar-scene/textures');
    return res.data;
  },

  async createFloorTexture(data: CreateFloorTextureDto): Promise<FloorTextureDto> {
    const res = await apiService.post<FloorTextureDto>('/ar-scene/textures', data);
    return res.data;
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
  }
};