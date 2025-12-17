import { apiService } from "./httpService/apiService";
import type { 
  ARSceneDto, 
  CreateSceneDto, 
  UpdateSceneDto, // <--- YENİ: Import eklendi
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

  // 2. Sahne Güncelle (YENİ - Ad veya Ayarlar için)
  // Backend: PATCH /ar-scene/:id
  async updateScene(id: number, data: UpdateSceneDto): Promise<ARSceneDto> {
    const res = await apiService.patch<ARSceneDto>(`/ar-scene/${id}`, data);
    return res.data;
  },

  // 3. Listele
  async listScenes(companyId: number): Promise<ARSceneDto[]> {
    const res = await apiService.get<ARSceneDto[]>('/ar-scene/list', { params: { companyId } });
    return res.data;
  },

  // 4. Detay (Editör için full data - Items ve Settings dahil)
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

  // 6. Eşya Güncelle (Pozisyon/Rotasyon/Ölçek)
  async updateItem(itemId: number, data: UpdateSceneItemDto): Promise<SceneItemDto> {
    const res = await apiService.patch<SceneItemDto>(`/ar-scene/item/${itemId}`, data);
    return res.data;
  },

  // 7. Eşya Sil
  async removeItem(itemId: number): Promise<void> {
    await apiService.delete(`/ar-scene/item/${itemId}`);
  },

  async listFloorTextures(): Promise<FloorTextureDto[]> {
    const res = await apiService.get<FloorTextureDto[]>('/ar-scene/textures');
    return res.data;
  },

  // Backend: POST /ar-scene/textures (İleride admin paneli yaparsan lazım olur)
  async createFloorTexture(data: CreateFloorTextureDto): Promise<FloorTextureDto> {
    const res = await apiService.post<FloorTextureDto>('/ar-scene/textures', data);
    return res.data;
  },
};