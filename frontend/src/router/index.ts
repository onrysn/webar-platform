import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

// --- LAYOUTS ---
// [ÖNEMLİ] MainLayout yerine, oluşturduğumuz Akıllı Wrapper'ı import ediyoruz.
import AppLayout from '../layouts/AppLayout.vue';

// --- DASHBOARD PAGES ---
import DashboardHome from '../modules/dashboard/pages/Dashboard.vue';
import Settings from '../modules/dashboard/pages/settings.vue';

// --- COMPANIES PAGES ---
import CompaniesList from '../modules/companies/pages/CompaniesList.vue';
import CompanyCreate from '../modules/companies/pages/CompanyCreate.vue';
import CompanyDetail from '../modules/companies/pages/CompanyDetail.vue';
import CompanyUpdate from '../modules/companies/pages/CompanyUpdate.vue';
import CompanyManageUsers from '../modules/companies/pages/CompanyManageUsers.vue';
import CompanyApiKey from '../modules/companies/pages/CompanyApiKey.vue';

// --- AUTH PAGES ---
import Login from '../modules/auth/pages/Login.vue';
import Register from '../modules/auth/pages/Register.vue';

// --- AR MODEL PAGES ---
import ModelList from '../modules/ar-model/pages/ModelList.vue';
import UploadModel from '../modules/ar-model/pages/UploadModel.vue';
import ModelDetail from '../modules/ar-model/pages/ModelDetail.vue';

// --- AR SCENE PAGES ---
import SceneList from '../modules/ar-scene/pages/SceneList.vue';
import SceneEditor from '../modules/ar-scene/pages/SceneEditor.vue';

// --- ROL SABİTLERİ ---
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  EDITOR: 'EDITOR',
  MEMBER: 'MEMBER'
};

// Member HARİÇ herkes (Yönetim Paneli Görenler)
const ADMINS_AND_EDITORS = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.EDITOR];

// Düzenleme yetkisi olanlar (Upload, Create, Edit)
const EDITORS_AND_ABOVE = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.EDITOR];

const routes: RouteRecordRaw[] = [
  // --- PUBLIC ROUTES ---
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },

  // --- EDITOR (Standalone / Layoutsız) ---
  {
    path: '/editor/scene/:id',
    name: 'SceneEditor',
    component: SceneEditor,
    // Herkes girebilir (Member izler, diğerleri düzenler)
    meta: { requiresAuth: true } 
  },

  // --- DASHBOARD (DYNAMIC LAYOUT) ---
  {
    path: '/dashboard',
    // [DEĞİŞİKLİK BURADA] MainLayout yerine AppLayout kullanıyoruz.
    // AppLayout, kullanıcının rolüne göre MainLayout veya ViewerLayout'u render edecek.
    component: AppLayout, 
    meta: { requiresAuth: true },
    children: [
      
      // 1. GENEL BAKIŞ (Sadece Yönetim Ekibi)
      { 
        path: '', 
        name: 'DashboardHome',
        component: DashboardHome,
        // Member burayı göremez, Guard onu SceneList'e atacak.
        meta: { roles: ADMINS_AND_EDITORS } 
      },
      { 
        path: 'settings', 
        name: 'Settings',
        component: Settings,
        meta: { roles: ADMINS_AND_EDITORS }
      },

      // 2. SUPER ADMIN: ŞİRKET YÖNETİMİ
      { 
        path: 'companies', 
        name: 'CompaniesList',
        component: CompaniesList, 
        meta: { roles: [ROLES.SUPER_ADMIN] } 
      },
      { 
        path: 'companies/create', 
        name: 'CompanyCreate',
        component: CompanyCreate, 
        meta: { roles: [ROLES.SUPER_ADMIN] } 
      },
      {
        path: 'companies/:id',
        component: CompanyDetail,
        meta: { roles: [ROLES.SUPER_ADMIN] },
        children: [
          { path: '', redirect: to => `/dashboard/companies/${to.params.id}/update` },
          { path: 'update', component: CompanyUpdate },
          { path: 'manage-users', component: CompanyManageUsers },
          { path: 'api-key', component: CompanyApiKey },
        ],
      },

      // 3. COMPANY ADMIN: EKİP YÖNETİMİ
      {
        path: 'my-team',
        name: 'MyTeam',
        component: CompanyManageUsers, 
        meta: { roles: [ROLES.COMPANY_ADMIN] }
      },

      // 4. AR MODELS (Ortak Alan)
      { 
        path: 'ar-model', 
        name: 'ModelList', 
        component: ModelList 
        // Herkes görebilir
      },
      { 
        path: 'ar-model/upload', 
        name: 'UploadModel', 
        component: UploadModel, 
        // Sadece yetkililer yükleme yapabilir
        meta: { roles: EDITORS_AND_ABOVE } 
      },
      { 
        path: 'ar-model/:id', 
        name: 'ModelDetail', 
        component: ModelDetail 
      },

      // 5. AR SCENES (Ortak Alan)
      { 
        path: 'ar-scene', 
        name: 'SceneList', 
        component: SceneList 
        // Herkes görebilir
      },
    ],
  },
  
  // 404 Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- NAVIGATION GUARD ---
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  
  // 1. Token Kontrolü
  if (!auth.token) auth.loadFromStorage();
  const isAuthenticated = !!auth.token;

  // 2. Zaten giriş yapmışsa Login'e sokma
  if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    return next('/dashboard');
  }

  // 3. Auth Gerektiren Sayfa Kontrolü
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  // 4. Kullanıcı Bilgisi Yoksa Çek (F5 durumları)
  if (isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe();
    } catch (error) {
      auth.logout();
      return next('/login');
    }
  }

  if (isAuthenticated && auth.user?.role === ROLES.MEMBER && to.path === '/dashboard') {
      return next('/dashboard/ar-scene');
  }

  // 6. Rol Tabanlı Erişim Kontrolü
  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as string[];
    const userRole = auth.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Yetkisiz erişim.
      // Eğer Member ise Sahneler sayfasına at, diğerleri için Dashboard'a at.
      if (userRole === ROLES.MEMBER) {
          return next('/dashboard/ar-scene');
      }
      return next('/dashboard'); 
    }
  }

  next();
});

export default router;