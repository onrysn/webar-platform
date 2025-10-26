import type { LoginDto } from '../modules/auth/dto/login.dto';
import type { RegisterDto } from '../modules/auth/dto/register.dto';
import { apiService } from './httpService/apiService';

export const authService = {
  register: (data: RegisterDto) => apiService.post('/auth/register', data),
  login: (data: LoginDto) => apiService.post('/auth/login', data),
  fetchMe: () => apiService.get('/auth/me'),
};
