import type { ARModelDto } from "../../ar-model/dto/arModel.dto";

export interface SceneItemDto {
  id: number;
  sceneId: number;
  modelId: number;
  name?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  model: ARModelDto; // Backend include: { model: true } dönüyor
}

export interface ARSceneDto {
  id: number;
  name: string;
  companyId: number;
  createdAt: string;
  items: SceneItemDto[];
}

// Create Payload
export interface CreateSceneDto {
  name: string;
  companyId: number;
}

// Add Item Payload
export interface AddSceneItemDto {
  sceneId: number;
  modelId: number;
  name?: string;
  position?: { x: number; y: number; z: number };
}

// Update Item Payload
export interface UpdateSceneItemDto {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}