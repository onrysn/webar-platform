import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: number; name: string; email: string },
    token: '' as string,
  }),
  actions: {
    async login(email: string, password: string) {
      try {
        const res = await axios.post('http://localhost:3000/auth/login', { email, password });
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Login failed');
      }
    },
    async register(name: string, email: string, password: string) {
      try {
        const res = await axios.post('http://localhost:3000/auth/register', { name, email, password });
        this.user = res.data.user;
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Register failed');
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
