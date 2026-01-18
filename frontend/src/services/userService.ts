import { apiService } from './httpService/apiService';

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: 'MEMBER' | 'EDITOR' | 'COMPANY_ADMIN' | 'SUPER_ADMIN';
}

export const userService = {
  async listUsers(companyId?: number) {
    const res = await apiService.get('/users', { params: companyId ? { companyId } : undefined });
    return res.data;
  },
  async updateUser(userId: number, data: UpdateUserPayload) {
    const res = await apiService.patch(`/users/${userId}`, data);
    return res.data;
  },

  async uploadAvatar(_userId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    // Örnek: const res = await apiService.post(`/users/${userId}/avatar`, formData);
    // return res.data;
    throw new Error("Avatar yükleme özelliği henüz aktif değil.");
  }
};