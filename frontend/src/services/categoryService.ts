import { apiService } from "./httpService/apiService";

export interface CategoryDto {
  id: number;
  name: string;
  description?: string | null;
  parentId?: number | null;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: number | null;
  companyId?: number; // Only for SUPER_ADMIN
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  parentId?: number | null;
}

export const categoryService = {
  async list(companyId?: number, parentId?: number): Promise<CategoryDto[]> {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (parentId !== undefined) params.parentId = parentId;
    const res = await apiService.get<CategoryDto[]>("/categories/list", { params });
    return res.data;
  },

  async getById(id: number): Promise<CategoryDto> {
    const res = await apiService.get<CategoryDto>(`/categories/${id}`);
    return res.data;
  },

  async create(payload: CreateCategoryPayload): Promise<CategoryDto> {
    const res = await apiService.post<CategoryDto>("/categories", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateCategoryPayload): Promise<CategoryDto> {
    const res = await apiService.put<CategoryDto>(`/categories/${id}`, payload);
    return res.data;
  },

  async remove(id: number): Promise<{ success: boolean }> {
    const res = await apiService.delete<{ success: boolean }>(`/categories/${id}`);
    return res.data;
  },
};
