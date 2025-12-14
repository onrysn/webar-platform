import { apiService } from "./httpService/apiService";
import type { ARSceneDto, CreateSceneDto, AddSceneItemDto, UpdateSceneItemDto, SceneItemDto } from "../modules/ar-scene/dto/arScene.dto";

export const arSceneService = {
  // 1. Sahne Oluştur
  async createScene(data: CreateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.post<ARSceneDto>('/ar-scene', data);
    return res.data;
  },

  // 2. Listele
  async listScenes(companyId: number): Promise<ARSceneDto[]> {
    const res = await apiService.get<ARSceneDto[]>('/ar-scene/list', { params: { companyId } });
    return res.data;
  },

  // 3. Detay (Editör için full data)
  async getScene(id: number): Promise<ARSceneDto> {
    const res = await apiService.get<ARSceneDto>(`/ar-scene/${id}`);
    return res.data;
  },

  // 4. Eşya Ekle
  async addItem(data: AddSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.post<SceneItemDto>('/ar-scene/item', data);
    return res.data;
  },

  // 5. Eşya Güncelle (Pozisyon/Rotasyon)
  async updateItem(itemId: number, data: UpdateSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.patch<SceneItemDto>(`/ar-scene/item/${itemId}`, data);
    return res.data;
  },

  // 6. Eşya Sil
  async removeItem(itemId: number): Promise<void> {
    await apiService.delete(`/ar-scene/item/${itemId}`);
  }
};