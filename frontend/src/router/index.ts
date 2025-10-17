import { createRouter, createWebHistory } from 'vue-router';
import Login from '../modules/auth/Login.vue';
import Register from '../modules/auth/Register.vue';
import Dashboard from '../modules/dashboard/Dashboard.vue';
import { useAuthStore } from '../store/modules/auth';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  auth.loadFromStorage();

  const isAuthenticated = !!auth.token;

  if (isAuthenticated && !auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.requiresAuth && !auth.token) {
    return '/login';
  }

  if ((to.path === '/login' || to.path === '/register') && auth.token) {
    return '/dashboard';
  }

  return true;
});

export default router;
