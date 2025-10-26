import type { CompanyDto } from "../modules/companies/dto/company.dto";
import type { ManageUserDto } from "../modules/companies/dto/manageUser.dto";
import { apiService } from "./httpService/apiService";

export const companyService = {
  /** Kullanıcının şirketlerini listele */
  async getUserCompanies(): Promise<CompanyDto[]> {
    const res = await apiService.get('/companies');
    return res.data;
  },

  /** Şirket oluştur */
  async createCompany(data: CompanyDto): Promise<CompanyDto> {
    const res = await apiService.post('/companies', data);
    return res.data;
  },

  /** Şirket detayları */
  async getCompanyById(id: number): Promise<CompanyDto> {
    const res = await apiService.get(`/companies/${id}`);
    return res.data;
  },

  /** Şirketi güncelle (admin) */
  async updateCompany(id: number, data: Partial<CompanyDto>): Promise<CompanyDto> {
    const res = await apiService.put(`/companies/${id}`, data);
    return res.data;
  },

  /** Şirketi sil (admin) */
  async deleteCompany(id: number): Promise<void> {
    await apiService.delete(`/companies/${id}`);
  },

  /** Kullanıcı ekle (admin) */
  async addUserToCompany(companyId: number, data: ManageUserDto): Promise<void> {
    await apiService.post(`/companies/${companyId}/users`, data);
  },

  /** Kullanıcıyı çıkar (admin) */
  async removeUserFromCompany(companyId: number, userId: number): Promise<void> {
    await apiService.delete(`/companies/${companyId}/users/${userId}`);
  },

  /** API key yenile (admin) */
  async regenerateApiKey(companyId: number): Promise<{ apiKey: string }> {
    const res = await apiService.post(`/companies/${companyId}/regenerate-api-key`);
    return res.data;
  },
};
