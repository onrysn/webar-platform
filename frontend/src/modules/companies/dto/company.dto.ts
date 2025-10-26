export interface CompanyUserDto {
  user: {
    id: number;
    name: string;
    email: string;
  };
  role: string;
  createdAt: string;
}

export interface CompanyDto {
  id?: number;      
  name: string;
  domain: string;
  apiKey?: string;  
  createdAt?: string;
  users?: CompanyUserDto[];
}
