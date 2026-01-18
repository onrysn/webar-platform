import { apiService } from "./httpService/apiService";

// Frontend tarafında Prisma türlerini import etmeyin.
// Backend ile uyumlu olacak şekilde local union type tanımlıyoruz.
export type ShapeCategory =
  | 'BASIC'
  | 'GEOMETRIC'
  | 'ARCHITECTURAL'
  | 'ARROWS'
  | 'SYMBOLS'
  | 'CONTROLS'
  | 'ICONS'
  | 'NATURE'
  | 'OBJECTS'
  | 'CUSTOM';

export interface ShapeDto {
  id: number;
  code: string;
  icon: string;
  svgPath: string;
  labelTR: string;
  labelEN?: string | null;
  descTR?: string | null;
  descEN?: string | null;
  category: ShapeCategory;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateShapePayload {
  code: string;
  icon: string;
  svgPath: string;
  labelTR: string;
  labelEN?: string;
  descTR?: string;
  descEN?: string;
  category: ShapeCategory;
  tags?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateShapePayload extends Partial<CreateShapePayload> {}

export const shapeService = {
  async list(category?: ShapeCategory, activeOnly?: boolean): Promise<ShapeDto[]> {
    const params: any = {};
    if (category) params.category = category;
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const res = await apiService.get<ShapeDto[]>("/shapes/list", { params });
    return res.data;
  },

  async getById(id: number): Promise<ShapeDto> {
    const res = await apiService.get<ShapeDto>(`/shapes/${id}`);
    return res.data;
  },

  async create(payload: CreateShapePayload): Promise<ShapeDto> {
    const res = await apiService.post<ShapeDto>("/shapes", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateShapePayload): Promise<ShapeDto> {
    const res = await apiService.put<ShapeDto>(`/shapes/${id}`, payload);
    return res.data;
  },

  async remove(id: number): Promise<{ success: boolean }> {
    const res = await apiService.delete<{ success: boolean }>(`/shapes/${id}`);
    return res.data;
  },
};
