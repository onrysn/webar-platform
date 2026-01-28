import { defineStore } from 'pinia';
import { authService } from '../../services/authService';
import type { LoginDto, RegisterDto } from '../../modules/auth/dto/auth.dto';

// Backend'deki yapıya uygun tipler
export interface Company {
  id: number;
  name: string;
  domain?: string;
  logoUrl?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EDITOR' | 'MEMBER';
  companyId?: number | null;
  company?: Company | null; // Backend 'me' endpointinde company detayını dönüyor
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Kullanıcı bilgisi ve Şirket detayı
    user: null as User | null,
    // Token varsa direkt storage'dan al, yoksa boş string
    token: localStorage.getItem('token') || '',
  }),

  getters: {
    // Yardımcı getterlar (MainLayout'ta işe yarar)
    isAuthenticated: (state) => !!state.token,
    isSuperAdmin: (state) => state.user?.role === 'SUPER_ADMIN',
    userCompanyId: (state) => state.user?.companyId,
  },

  actions: {
    async login(data: LoginDto) {
      try {
        const res = await authService.login(data);
        // Backend: { user: {...}, token: '...' } dönüyor
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Giriş yapılamadı.');
      }
    },

    async register(data: RegisterDto) {
      try {
        const res = await authService.register(data);
        // Backend: { user: {...}, token: '...', message: '...' } dönüyor
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Kayıt olunamadı.');
      }
    },

    async fetchMe() {
      if (!this.token) return;

      try {
        const res = await authService.fetchMe();
        // Backend 'me' endpointi direkt User objesi dönüyor
        this.user = res.data;
      } catch (err) {
        console.warn('Oturum süresi doldu veya token geçersiz.');
        this.logout();
      }
    },

    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
    },

    // Router guard içinde çağrılıyor, manuel set etmek için
    loadFromStorage() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
      }
    },
  },
});