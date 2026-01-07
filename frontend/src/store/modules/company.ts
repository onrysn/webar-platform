import { defineStore } from 'pinia';
import { companyService } from '../../services/companyService';
// DTO'ları merkezi dosyadan çekiyoruz (En sağlıklısı budur)
import type { CompanyDto, CompanyUserDto } from '../../modules/companies/dto/company.dto';

export const useCompanyStore = defineStore('company', {
  state: () => ({
    // 1. Standart Kullanıcı İçin: Kendi şirketi ve ekibi
    currentCompany: null as CompanyDto | null,
    companyUsers: [] as CompanyUserDto[],

    // 2. Super Admin İçin: Tüm şirketler listesi
    companiesList: [] as CompanyDto[],
  }),

  actions: {
    // ----------------------------------------------------------------
    // A. STANDART KULLANICI / ŞİRKET YÖNETİCİSİ AKSİYONLARI
    // ----------------------------------------------------------------

    async fetchMyCompany() {
      try {
        // DİKKAT: Servis zaten 'res.data'yı döndürüyor.
        // Bu yüzden burada tekrar .data dememize gerek yok.
        const company = await companyService.getMyCompany();
        this.currentCompany = company;
        return company;
      } catch (error) {
        console.error('Şirket bilgileri alınamadı', error);
        throw error;
      }
    },

    async updateMyCompany(data: { name?: string; domain?: string }) {
      try {
        const updatedCompany = await companyService.updateMyCompany(data);
        this.currentCompany = updatedCompany;
        return updatedCompany;
      } catch (error) {
        throw error;
      }
    },

    async regenerateApiKey() {
      try {
        const result = await companyService.regenerateApiKey(); // { apiKey: '...' } döner
        if (this.currentCompany) {
          this.currentCompany.apiKey = result.apiKey;
        }
        return result;
      } catch (error) {
        throw error;
      }
    },

    async fetchMyTeam() {
      try {
        const users = await companyService.getMyCompanyUsers();
        this.companyUsers = users;
      } catch (error) {
        throw error;
      }
    },

    async addTeamMember(data: any) {
      try {
        const newUser = await companyService.addUserToMyCompany(data);
        this.companyUsers.unshift(newUser); // newUser doğrudan obje
      } catch (error) {
        throw error;
      }
    },

    async removeTeamMember(userId: number) {
      try {
        await companyService.removeUserFromMyCompany(userId);
        this.companyUsers = this.companyUsers.filter(u => u.id !== userId);
      } catch (error) {
        throw error;
      }
    },

    // ----------------------------------------------------------------
    // B. SUPER ADMIN AKSİYONLARI
    // ----------------------------------------------------------------

    async fetchAllCompanies() {
      try {
        const companies = await companyService.getAllCompanies();
        this.companiesList = companies;
      } catch (error) {
        throw error;
      }
    },

    async createCompany(data: { name: string; domain?: string }) {
      try {
        const newCompany = await companyService.createCompany(data);
        this.companiesList.unshift(newCompany);
        return newCompany;
      } catch (error) {
        throw error;
      }
    },

    async deleteCompany(id: number) {
      try {
        await companyService.deleteCompany(id);
        this.companiesList = this.companiesList.filter(c => c.id !== id);
      } catch (error) {
        throw error;
      }
    },

    async fetchCompanyById(id: number) {
      const company = await companyService.getCompanyById(id);
      return company;
    }
  },
});