import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as null | { name: string },
        token: ''
    }),
    actions: {
        login(name: string, token: string) {
            this.user = { name };
            this.token = token;
        },
        logout() {
            this.user = null;
            this.token = '';
        }
    }
});
