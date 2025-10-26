import { defineStore } from 'pinia';
import type { CompanyDto } from '../../modules/companies/dto/company.dto';
import { companyService } from '../../services/companyService';

export const useCompanyStore = defineStore('company', {
  state: () => ({
    companies: [] as CompanyDto[],
  }),
  actions: {
    async fetchUserCompanies() {
      const res = await companyService.getUserCompanies();
      this.companies = res.map((item: any) => item.company);
    },
    async createCompany(data: CompanyDto) {
      const newCompany = await companyService.createCompany(data);
      this.companies.push(newCompany);
      return newCompany;
    },
    async fetchCompanyById(id: number) {
      return await companyService.getCompanyById(id);
    },
  },
});
