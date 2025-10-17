import { createRouter, createWebHistory } from 'vue-router';
import Login from '../modules/auth/Login.vue';
import Register from '../modules/auth/Register.vue';
import DashboardHome from '../modules/dashboard/Dashboard.vue';
import { useAuthStore } from '../store/modules/auth';
import MainLayout from '../layouts/MainLayout.vue';
import Profile from '../modules/dashboard/Profile.vue';
import Projects from '../modules/dashboard/Projects.vue';
import Settings from '../modules/dashboard/settings.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/dashboard',
    component: MainLayout,   // MainLayout kullanılıyor
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardHome },      // /dashboard
      { path: 'profile', component: Profile },    // /dashboard/profile
      { path: 'projects', component: Projects },  // /dashboard/projects
      { path: 'settings', component: Settings },  // /dashboard/settings
    ],
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
