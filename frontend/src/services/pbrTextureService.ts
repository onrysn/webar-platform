import { apiService } from './httpService/apiService';

export interface PbrTexture {
  id: number;
  name: string;
  thumbnailUrl: string;
  type: 'SIMPLE' | 'PBR';
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
  defaultScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  category?: string;
  tags?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePbrTextureDto {
  name: string;
  thumbnailUrl: string;
  type: 'SIMPLE' | 'PBR';
  baseColorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
  metallicUrl?: string;
  aoUrl?: string;
  defaultScale?: number;
  roughnessValue?: number;
  metalnessValue?: number;
  aoIntensity?: number;
  normalScale?: number;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePbrTextureDto extends Partial<CreatePbrTextureDto> {}

export const pbrTextureService = {
  async getAll(params?: {
    category?: string;
    type?: 'SIMPLE' | 'PBR';
    isActive?: boolean;
  }) {
    const response = await apiService.get<PbrTexture[]>('/pbr-textures', { params });
    return response.data;
  },

  async getOne(id: number) {
    const response = await apiService.get<PbrTexture>(`/pbr-textures/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await apiService.get<string[]>('/pbr-textures/categories');
    return response.data;
  },

  async create(dto: CreatePbrTextureDto) {
    const response = await apiService.post<PbrTexture>('/pbr-textures', dto);
    return response.data;
  },

  async update(id: number, dto: UpdatePbrTextureDto) {
    const response = await apiService.put<PbrTexture>(`/pbr-textures/${id}`, dto);
    return response.data;
  },

  async delete(id: number) {
    await apiService.delete(`/pbr-textures/${id}`);
  },

  async uploadTextures(textureName: string, files: {
    thumbnail?: File;
    baseColor?: File;
    normal?: File;
    roughness?: File;
    metallic?: File;
    ao?: File;
  }) {
    const formData = new FormData();

    if (files.thumbnail) formData.append('thumbnail', files.thumbnail);
    if (files.baseColor) formData.append('baseColor', files.baseColor);
    if (files.normal) formData.append('normal', files.normal);
    if (files.roughness) formData.append('roughness', files.roughness);
    if (files.metallic) formData.append('metallic', files.metallic);
    if (files.ao) formData.append('ao', files.ao);

    const response = await apiService.post<{
      thumbnailUrl?: string;
      baseColorUrl?: string;
      normalUrl?: string;
      roughnessUrl?: string;
      metallicUrl?: string;
      aoUrl?: string;
    }>(`/pbr-textures/upload?textureName=${encodeURIComponent(textureName)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
