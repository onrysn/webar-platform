import type { ARModelDto } from "../../ar-model/dto/arModel.dto";

// --- YENİ EKLENEN TİPLER (Texture için) ---
export interface FloorTextureDto {
  id: number;
  name: string;
  thumbnailUrl: string;
  textureUrl: string;
  isActive: boolean;
}

export interface CreateFloorTextureDto {
  name: string;
  thumbnailUrl?: string;
  textureUrl: string;
  isActive?: boolean;
}

// --- MEVCUT TİPLER (Aynen kalıyor) ---

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface FloorPoint {
  x: number;
  z: number;
}

export interface SceneSettings {
  floorType?: 'rectangle' | 'custom';
  width?: number;       // Örn: 20
  depth?: number;       // Örn: 15
  floorPoints?: FloorPoint[];
  backgroundColor?: string;
  gridVisible?: boolean;
  floorColor?: string;
  floorTextureUrl?: string;
  wallHeight?: number;
  textureScale?: number;
}

// --- ANA VERİ MODELLERİ (Response Types) ---

export interface SceneItemDto {
  id: number;
  sceneId: number;
  modelId: number;
  name?: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  model: ARModelDto; 
}

export interface ARSceneDto {
  id: number;
  name: string;
  companyId: number;
  createdAt: string;
  updatedAt?: string;
  items: SceneItemDto[];
  settings: SceneSettings; // <--- YENİ: Backend'den gelen JSON ayarları
}

// --- PAYLOADS (Request Types) ---

// 1. Yeni Sahne Oluşturma
export interface CreateSceneDto {
  name: string;
  companyId: number;
  settings?: SceneSettings; // <--- YENİ: Oluştururken ayar gönderebiliriz
}

// 2. Sahne Güncelleme (YENİ)
export interface UpdateSceneDto {
  name?: string;
  settings?: SceneSettings;
}

// 3. Eşya Ekleme
export interface AddSceneItemDto {
  sceneId: number;
  modelId: number;
  name?: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

// 4. Eşya Güncelleme
export interface UpdateSceneItemDto {
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}