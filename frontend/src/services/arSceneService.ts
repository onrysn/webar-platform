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
  CreateFloorTextureDto
} from "../modules/ar-scene/dto/arScene.dto";

export const arSceneService = {
  // 1. Sahne Oluştur
  async createScene(data: CreateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.post<ARSceneDto>('/ar-scene', data);
    return res.data;
  },

  // 2. Sahne Güncelle
  async updateScene(id: number, data: UpdateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.patch<ARSceneDto>(`/ar-scene/${id}`, data);
    return res.data;
  },

  // 3. Listele
  // [DEĞİŞİKLİK]: companyId opsiyonel yapıldı.
  // Eğer parametre verilmezse backend, token'daki kullanıcının şirketini baz alır.
  async listScenes(companyId?: number): Promise<ARSceneDto[]> {
    const params = companyId ? { companyId } : {};
    const res = await apiService.get<ARSceneDto[]>('/ar-scene/list', { params });
    return res.data;
  },

  // 4. Detay (Editör)
  async getScene(id: number): Promise<ARSceneDto> {
    const res = await apiService.get<ARSceneDto>(`/ar-scene/${id}`);
    return res.data;
  },

  // --- ITEM İŞLEMLERİ ---

  // 5. Eşya Ekle
  async addItem(data: AddSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.post<SceneItemDto>('/ar-scene/item', data);
    return res.data;
  },

  // 6. Eşya Güncelle
  async updateItem(itemId: number, data: UpdateSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.patch<SceneItemDto>(`/ar-scene/item/${itemId}`, data);
    return res.data;
  },

  // 7. Eşya Sil
  async removeItem(itemId: number): Promise<void> {
    await apiService.delete(`/ar-scene/item/${itemId}`);
  },

  // --- DOKU (TEXTURE) İŞLEMLERİ ---

  async listFloorTextures(): Promise<FloorTextureDto[]> {
    const res = await apiService.get<FloorTextureDto[]>('/ar-scene/textures');
    return res.data;
  },

  async createFloorTexture(data: CreateFloorTextureDto): Promise<FloorTextureDto> {
    const res = await apiService.post<FloorTextureDto>('/ar-scene/textures', data);
    return res.data;
  },

  // 8. Sahne Sil (Soft Delete)
  async deleteScene(id: number): Promise<void> {
    await apiService.delete(`/ar-scene/${id}`);
  },
};