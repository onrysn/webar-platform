export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EDITOR' | 'MEMBER';
  companyId: number;
  company?: {
    id: number;
    name: string;
    domain?: string;
  };
}

export interface AuthResponse {
  user: UserDto;
  token: string;
  message?: string;
}