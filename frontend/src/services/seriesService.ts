import { apiService } from "./httpService/apiService";

export interface SeriesDto {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateSeriesPayload {
  name: string;
  code?: string;
  description?: string;
  companyId?: number; // Only for SUPER_ADMIN
}

export interface UpdateSeriesPayload {
  name?: string;
  code?: string;
  description?: string;
}

export const seriesService = {
  async list(companyId?: number): Promise<SeriesDto[]> {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    const res = await apiService.get<SeriesDto[]>("/series/list", { params });
    return res.data;
  },

  async getById(id: number): Promise<SeriesDto> {
    const res = await apiService.get<SeriesDto>(`/series/${id}`);
    return res.data;
  },

  async create(payload: CreateSeriesPayload): Promise<SeriesDto> {
    const res = await apiService.post<SeriesDto>("/series", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateSeriesPayload): Promise<SeriesDto> {
    const res = await apiService.put<SeriesDto>(`/series/${id}`, payload);
    return res.data;
  },

  async remove(id: number): Promise<{ success: boolean }> {
    const res = await apiService.delete<{ success: boolean }>(`/series/${id}`);
    return res.data;
  },
};
