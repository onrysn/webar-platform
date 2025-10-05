import { createRouter, createWebHistory } from 'vue-router';
import Login from '../modules/auth/Login.vue';
import Dashboard from '../modules/dashboard/Dashboard.vue';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/dashboard', component: Dashboard },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
