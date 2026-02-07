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
  textureId?: number; // PBR texture ID
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
  floorTextureUrl?: string; // Legacy simple texture
  floorTextureId?: number;  // PBR texture ID
  wallHeight?: number;
  textureScale?: number;
  floorLayers?: FloorLayer[];
  perimeterLayers?: PerimeterLayer[];
  
  // Aydınlatma ayarları
  lighting?: {
    ambientIntensity?: number;
    ambientColor?: string;
    directionalIntensity?: number;
    directionalColor?: string;
    directionalX?: number;
    directionalY?: number;
    directionalZ?: number;
  };
}

// --- DOKU (TEXTURE) TİPLERİ ---

export type TextureType = 'SIMPLE' | 'PBR';

export interface PBRTextureMaps {
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
}

export interface FloorTextureDto {
  id: number;
  name: string;
  thumbnailUrl: string;
  type: TextureType;
  
  // Simple Texture
  textureUrl?: string;
  
  // PBR Texture Maps
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
  
  // PBR Ayarları
  defaultScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  
  // Kategori ve Etiketler
  category?: string;
  tags?: string[];
  
  isActive: boolean;
  sortOrder?: number;
}

export interface CreateFloorTextureDto {
  name: string;
  type?: TextureType;
  
  // Simple Texture
  textureUrl?: string;
  
  // PBR Texture Maps
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
  
  thumbnailUrl?: string;
  
  // PBR Ayarları
  defaultScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  
  // Kategori ve Etiketler
  category?: string;
  tags?: string[];
  
  isActive?: boolean;
  sortOrder?: number;
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
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    categoryType: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
  items: SceneItemDto[];
  settings: SceneSettings;
  
  // --- YENİ EKLENEN ALANLAR ---
  isPrivate: boolean;        // Liste gizliliği
  memberCanEdit: boolean;    // Yetki kontrolü
  shareToken?: string | null; // Paylaşım token'ı
  shareUrl?: string | null;   // Frontend'de hesaplanan tam URL
  
  // Liste görünümünde obje sayısını göstermek için
  _count?: {
    items: number;
  };
}

// --- PAYLOADS (Request Types) ---

// 1. Yeni Sahne Oluşturma
export interface CreateSceneDto {
  name: string;
  companyId?: number; 
  categoryId?: number | null;
  settings?: SceneSettings;
  
  // Yeni
  isPrivate?: boolean;
  memberCanEdit?: boolean;
}

// 2. Sahne Güncelleme
export interface UpdateSceneDto {
  name?: string;
  categoryId?: number | null;
  settings?: SceneSettings;
  
  // Yeni
  isPrivate?: boolean;
  memberCanEdit?: boolean;
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

// 5. Paylaşım Token Cevabı (YENİ)
export interface ShareSceneResponse {
    shareToken: string;
    url: string;
}

// 6. Backend Scene Export Response
export interface SceneExportFileInfo {
    fileName: string;
    url: string;
    size: number;
    sizeFormatted?: string;
}

export interface SceneExportResponse {
    exportId: string;
    sceneName: string;
    glb?: SceneExportFileInfo;
    usdz?: SceneExportFileInfo;
    usdzError?: string;
}