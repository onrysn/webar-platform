import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

// Dashboard sayfaları
import MainLayout from '../layouts/MainLayout.vue';
import DashboardHome from '../modules/dashboard/pages/Dashboard.vue';
import Profile from '../modules/dashboard/pages/Profile.vue';
import Projects from '../modules/dashboard/pages/Projects.vue';
import Settings from '../modules/dashboard/pages/settings.vue';

// Companies sayfaları
import CompaniesList from '../modules/companies/pages/CompaniesList.vue';
import CompanyCreate from '../modules/companies/pages/CompanyCreate.vue';
import CompanyDetail from '../modules/companies/pages/CompanyDetail.vue';
import CompanyUpdate from '../modules/companies/pages/CompanyUpdate.vue';
import CompanyManageUsers from '../modules/companies/pages/CompanyManageUsers.vue';
import CompanyApiKey from '../modules/companies/pages/CompanyApiKey.vue';

// Auth sayfaları
import Login from '../modules/auth/pages/Login.vue';
import Register from '../modules/auth/pages/Register.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardHome },      // /dashboard
      { path: 'profile', component: Profile },    // /dashboard/profile
      { path: 'projects', component: Projects },  // /dashboard/projects
      { path: 'settings', component: Settings },  // /dashboard/settings

      // Companies
      { path: 'companies', component: CompaniesList },           // /dashboard/companies
      { path: 'companies/create', component: CompanyCreate },    // /dashboard/companies/create
      {
        path: 'companies/:id',
        component: CompanyDetail,                               // Şirket detay
        children: [
          { path: 'update', component: CompanyUpdate },         // /dashboard/companies/:id/update
          { path: 'manage-users', component: CompanyManageUsers }, // /dashboard/companies/:id/manage-users
          { path: 'api-key', component: CompanyApiKey },        // /dashboard/companies/:id/api-key
        ],
      },
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
