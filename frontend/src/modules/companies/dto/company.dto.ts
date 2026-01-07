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
  apiKey?: string;
  createdAt?: string;
  _count?: {
    users: number;
    scenes: number;
  };

  users?: CompanyUserDto[];
}

// 4. ŞİRKET OLUŞTURMA (Super Admin)
export interface CreateCompanyDto {
  name: string;
  domain?: string;
}

// 5. ŞİRKET GÜNCELLEME (Super Admin veya Company Admin)
export interface UpdateCompanyDto {
  name?: string;
  domain?: string;
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