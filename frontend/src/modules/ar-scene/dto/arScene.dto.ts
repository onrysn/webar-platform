// src/modules/ar-scene/dto/arScene.dto.ts
import type { ARModelDto } from "../../ar-model/dto/arModel.dto";

// --- YARDIMCI TİPLER (Settings İçin) ---

export interface PerimeterLayer {
  id: string;
  type: 'wall' | 'sidewalk' | 'grass' | 'curb';
  width: number;
  height: number;
  color: string;
  elevation: number;
  textureUrl?: string | null;
  textureScale?: number;
}

export interface FloorLayer {
  id: string;        
  shapeId: string;
  name: string;
  x: number;
  z: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  opacity: number;
  zIndex: number;
}

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
  floorLayers?: FloorLayer[];
  perimeterLayers?: PerimeterLayer[];
}

// --- DOKU (TEXTURE) TİPLERİ ---

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
  // Backend'den gelen materyal konfigürasyonu
  materialConfig?: Record<string, {
    color: string;
    metalness: number;
    roughness: number;
  }>;
}

export interface ARSceneDto {
  id: number;
  name: string;
  companyId: number;
  createdAt: string;
  updatedAt?: string;
  items: SceneItemDto[];
  settings: SceneSettings; 
}

// --- PAYLOADS (Request Types) ---

// 1. Yeni Sahne Oluşturma
export interface CreateSceneDto {
  name: string;
  // [DEĞİŞİKLİK]: Artık opsiyonel. Normal kullanıcılar için backend token'dan alır.
  // Sadece Super Admin başkası adına oluştururken kullanır.
  companyId?: number; 
  settings?: SceneSettings;
}

// 2. Sahne Güncelleme
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
  materialConfig?: Record<string, any>;
}