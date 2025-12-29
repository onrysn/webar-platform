import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

// Dashboard sayfaları
import MainLayout from '../layouts/MainLayout.vue';
import DashboardHome from '../modules/dashboard/pages/Dashboard.vue';
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

// AR Model sayfaları
import ModelList from '../modules/ar-model/pages/ModelList.vue';
import UploadModel from '../modules/ar-model/pages/UploadModel.vue';
import ModelDetail from '../modules/ar-model/pages/ModelDetail.vue';

// AR Scene sayfaları
import SceneList from '../modules/ar-scene/pages/SceneList.vue';
import SceneEditor from '../modules/ar-scene/pages/SceneEditor.vue'; // <--- Import Edildi

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/editor/scene/:id',
    name: 'SceneEditor',
    component: SceneEditor,
    meta: { requiresAuth: true }
  },

  // --- 2. DASHBOARD ROTASI ---
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardHome },
      { path: 'settings', component: Settings },

      // Companies
      { path: 'companies', component: CompaniesList, meta: { adminOnly: true } },
      { path: 'companies/create', component: CompanyCreate, meta: { adminOnly: true } },
      {
        path: 'companies/:id',
        component: CompanyDetail,
        children: [
          { path: 'update', component: CompanyUpdate, meta: { adminOnly: true } },
          { path: 'manage-users', component: CompanyManageUsers, meta: { adminOnly: true } },
          { path: 'api-key', component: CompanyApiKey, meta: { adminOnly: true } },
        ],
      },

      // AR Models
      { path: 'ar-model', name: 'ModelList', component: ModelList },
      { path: 'ar-model/upload', name: 'UploadModel', component: UploadModel, meta: { adminOnly: true }  },
      { path: 'ar-model/:id', name: 'ModelDetail', component: ModelDetail },

      // AR Scenes (LİSTE) -> Dashboard içinde kalıyor
      { path: 'ar-scene', name: 'SceneList', component: SceneList },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ... (Router Guard kısmı aynen kalacak) ...
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

  // Admin-only sayfa kontrolü
  if (to.meta.adminOnly && auth.user?.role !== 'admin') {
    return '/dashboard';
  }

  if ((to.path === '/login' || to.path === '/register') && auth.token) {
    return '/dashboard';
  }

  return true;
});

export default router;