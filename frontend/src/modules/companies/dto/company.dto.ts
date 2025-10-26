export interface CompanyDto {
  id?: number;      // Oluşturulurken id yok olabilir
  name: string;
  domain: string;
  apiKey?: string;  // sadece backend tarafından döndürülen alan
  createdAt?: string;
}