import type { LoginDto, RegisterDto, AuthResponse, UserDto } from '../modules/auth/dto/auth.dto';
import { apiService } from './httpService/apiService';

export const authService = {
  register: (data: RegisterDto) => {
    return apiService.post<AuthResponse>('/auth/register', data);
  },

  login: (data: LoginDto) => {
    return apiService.post<AuthResponse>('/auth/login', data);
  },

  fetchMe: () => {
    return apiService.get<UserDto>('/auth/me');
  },
};