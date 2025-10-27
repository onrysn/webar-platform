import { defineStore } from 'pinia';
import type { LoginDto } from '../../modules/auth/dto/login.dto';
import type { RegisterDto } from '../../modules/auth/dto/register.dto';
import { authService } from '../../services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: number; name: string; email: string; role?: string },
    token: '' as string,
  }),
  actions: {
    async login(data: LoginDto) {
      try {
        const res = await authService.login(data);
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Login failed');
      }
    },

    async register(data: RegisterDto) {
      try {
        const res = await authService.register(data);
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Register failed');
      }
    },

    async fetchMe() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await authService.fetchMe();
        this.user = res.data;
        this.token = token;
      } catch (err) {
        console.warn('Token geçersiz, çıkış yapılıyor.');
        this.logout();
      }
    },

    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
    },

    loadFromStorage() {
      const token = localStorage.getItem('token');
      if (token) this.token = token;
    },
  },
});
