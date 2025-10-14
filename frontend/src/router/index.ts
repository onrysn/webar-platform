import { createRouter, createWebHistory } from 'vue-router';
import Login from '../modules/auth/Login.vue';
import Dashboard from '../modules/dashboard/Dashboard.vue';
import { useAuthStore } from '../store/modules/auth';
import Register from '../modules/auth/Register.vue';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    {
        path: '/dashboard',
        component: Dashboard,
        meta: { requiresAuth: true } // Auth gerekli sayfa
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global route guard
router.beforeEach((to) => {
    const auth = useAuthStore();
    auth.loadFromStorage();

    // Auth gerekli ama token yoksa login sayfasına yönlendir
    if (to.meta.requiresAuth && !auth.token) {
        return '/login';
    }

    // Login sayfasına token varsa dashboard'a yönlendir
    if ((to.path === '/login' || to.path === '/register') && auth.token) {
        return '/dashboard';
    }

    // Diğer durumlarda yönlendirme yapma
    return true;
});

export default router;
