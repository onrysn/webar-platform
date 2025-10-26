import type { CompanyDto } from "../modules/companies/dto/company.dto";
import { apiService } from "./httpService/apiService";

export const companyService = {
  async getUserCompanies(): Promise<CompanyDto[]> {
    const res = await apiService.get('/companies');
    return res.data;
  },

  async createCompany(data: CompanyDto): Promise<CompanyDto> {
    const res = await apiService.post('/companies', data);
    return res.data;
  },

  async getCompanyById(id: number): Promise<CompanyDto> {
    const res = await apiService.get(`/companies/${id}`);
    return res.data;
  },
};
