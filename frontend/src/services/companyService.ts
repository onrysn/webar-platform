// src/services/companyService.ts

import type {
  CompanyDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  AddUserToCompanyDto,
  CompanyUserDto
} from "../modules/companies/dto/company.dto";
import { apiService } from "./httpService/apiService";

export const companyService = {

  // =================================================================
  // 1. KENDİ ŞİRKETİM (Standart Company Admin İşlemleri - Token Bazlı)
  // =================================================================

  /** Giriş yapan kullanıcının şirketini getir */
  async getMyCompany(): Promise<CompanyDto> {
    const res = await apiService.get<CompanyDto>('/companies/my-company');
    return res.data;
  },

  /** Kendi şirket bilgilerini güncelle */
  async updateMyCompany(data: UpdateCompanyDto): Promise<CompanyDto> {
    const res = await apiService.put<CompanyDto>('/companies/my-company', data);
    return res.data;
  },

  /** Kendi şirketinin API key'ini yenile */
  async regenerateApiKey(): Promise<{ apiKey: string }> {
    const res = await apiService.post<{ apiKey: string }>('/companies/my-company/regenerate-api-key');
    return res.data;
  },

  /** Kendi şirketindeki kullanıcıları listele */
  async getMyCompanyUsers(): Promise<CompanyUserDto[]> {
    const res = await apiService.get<CompanyUserDto[]>('/companies/my-company/users');
    return res.data;
  },

  /** Kendi şirketine kullanıcı ekle */
  async addUserToMyCompany(data: AddUserToCompanyDto): Promise<CompanyUserDto> {
    const res = await apiService.post<CompanyUserDto>('/companies/my-company/users', data);
    return res.data;
  },

  /** Kendi şirketinden kullanıcı sil */
  async removeUserFromMyCompany(targetUserId: number): Promise<void> {
    await apiService.delete(`/companies/my-company/users/${targetUserId}`);
  },

  // =================================================================
  // 2. SUPER ADMIN İŞLEMLERİ (ID Bazlı - Tüm Sistem)
  // =================================================================

  /** Tüm şirketleri listele */
  async getAllCompanies(): Promise<CompanyDto[]> {
    const res = await apiService.get<CompanyDto[]>('/companies');
    return res.data;
  },

  /** Yeni şirket oluştur */
  async createCompany(data: CreateCompanyDto): Promise<CompanyDto> {
    const res = await apiService.post<CompanyDto>('/companies', data);
    return res.data;
  },

  /** ID ile şirket detayı getir */
  async getCompanyById(id: number): Promise<CompanyDto> {
    const res = await apiService.get<CompanyDto>(`/companies/${id}`);
    return res.data;
  },

  /** Şirketi sil */
  async deleteCompany(id: number): Promise<void> {
    await apiService.delete(`/companies/${id}`);
  },

  async updateCompany(id: number, data: UpdateCompanyDto): Promise<CompanyDto> {
    const res = await apiService.put<CompanyDto>(`/companies/${id}`, data);
    return res.data;
  },

  /** Başka bir şirketin API key'ini yenile (Super Admin) */
  async regenerateCompanyApiKey(companyId: number): Promise<{ apiKey: string }> {
    const res = await apiService.post<{ apiKey: string }>(`/companies/${companyId}/regenerate-api-key`);
    return res.data;
  },

  async addUserToCompany(companyId: number, data: AddUserToCompanyDto): Promise<CompanyUserDto> {
    const res = await apiService.post<CompanyUserDto>(`/companies/${companyId}/users`, data);
    return res.data;
  },

  async removeUserFromCompany(companyId: number, targetUserId: number): Promise<void> {
    await apiService.delete(`/companies/${companyId}/users/${targetUserId}`);
  },
};