export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EDITOR' | 'MEMBER';

// 2. ŞİRKET ÇALIŞANI (Listeleme için)
export interface CompanyUserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// 3. ŞİRKET DETAYI
export interface CompanyDto {
  id: number;
  name: string;
  domain?: string;
  createdAt?: string;
  isActive?: boolean;
  subscriptionEndsAt?: string | null;
  maxStorage?: number | null; // MB
  maxApiKeys?: number | null;
  maxScenes?: number | null; // Maksimum sahne sayısı
  logoUrl?: string | null; // Logo dosyasının URL'si

  _count?: {
    users: number;
    scenes: number;
    apiKeys?: number;
  };

  users?: CompanyUserDto[];
}

// 4. ŞİRKET OLUŞTURMA (Super Admin)
export interface CreateCompanyDto {
  name: string;
  domain?: string;
  maxScenes?: number;
  logoBase64?: string;
}

// 5. ŞİRKET GÜNCELLEME (Super Admin veya Company Admin)
export interface UpdateCompanyDto {
  name?: string;
  domain?: string;
  isActive?: boolean;
  subscriptionEndsAt?: string | null;
  maxStorage?: number | null;
  maxApiKeys?: number | null;
  maxScenes?: number | null;
  logoBase64?: string;
}

// 6. EKİBE YENİ ÜYE EKLEME
export interface AddUserToCompanyDto {
  name: string;
  email: string;
  password: string;
  role: 'EDITOR' | 'MEMBER';
}

export interface UpdateCompanyUserDto {
  role?: 'EDITOR' | 'MEMBER';
}

// 7. API KEY DTO
export interface ApiKeyDto {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  companyId: number;
  allowedOrigins: string[];
  allowedDomains: string[];
  permissions: any;
  rateLimit?: number | null;
  rateLimitWindow?: number | null;
  isActive: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}