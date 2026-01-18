<template>
  <div class="h-screen flex bg-slate-50 overflow-hidden">

    <div v-if="isSidebarOpen" @click="closeSidebar"
      class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <aside
      class="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-out md:translate-x-0 md:static border-r border-slate-800"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'">

      <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900 shrink-0 gap-3">
        <div
          class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-900/50">
          W</div>
        <span class="font-bold text-lg text-white tracking-wide">WebAR Admin</span>
        <button @click="closeSidebar" class="md:hidden ml-auto text-slate-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      

      <nav class="flex-1 flex flex-col space-y-6 px-3 py-6 overflow-y-auto custom-scrollbar">
        <div v-for="(group, index) in navigation" :key="index">
          <p v-if="group.items.some(item => item.visible)"
            class="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {{ group.title }}
          </p>

          <div class="space-y-1">
            <template v-for="item in group.items" :key="item.to">
              <router-link v-if="item.visible" :to="item.to"
                active-class="bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500"
                class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-none rounded-l-lg hover:bg-slate-800 hover:text-white transition-all border-r-2 border-transparent">

                <svg class="mr-3 h-5 w-5 transition-colors"
                  :class="$route.path.startsWith(item.to) && item.to !== '/' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                </svg>

                {{ item.name }}
              </router-link>
            </template>
          </div>
        </div>
      </nav>

      <div class="border-t border-slate-800 p-4 shrink-0 bg-slate-900">
        <div class="flex items-center gap-3 mb-4 px-2">
          <div
            class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate">{{ auth.user?.name || 'Kullanıcı' }}</p>

            <p class="text-xs text-indigo-400 truncate font-medium">
              {{ auth.user?.company?.name || 'Bağımsız Hesap' }}
            </p>

            <p class="text-[10px] text-slate-500 truncate mt-0.5">
              {{ formatRole(auth.user?.role) }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <router-link to="/dashboard/settings"
            class="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-bold">
            Ayarlar
          </router-link>
          <button @click="logout"
            class="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors text-xs font-bold">
            Çıkış
          </button>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header
        class="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 shrink-0 z-20">
        <span class="font-bold text-lg text-slate-800 tracking-tight">WebAR Admin</span>
        <button @click="toggleSidebar" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </header>

      <main class="flex-1 overflow-y-auto relative w-full custom-scrollbar-light bg-slate-50">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// Sidebar Logic
const isSidebarOpen = ref(false);
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value; };
const closeSidebar = () => { isSidebarOpen.value = false; };

watch(() => route.path, () => closeSidebar());

// --- ROL KONTROLLERİ (Backend Enumlarına Göre) ---
const role = computed(() => auth.user?.role);

// 1. Super Admin: Sistemin sahibi
const isSuperAdmin = computed(() => role.value === 'SUPER_ADMIN');

// 2. Company Admin: Şirket yöneticisi
const isCompanyAdmin = computed(() => role.value === 'COMPANY_ADMIN');

// 3. İçerik Düzenleyiciler (Editör ve üstü)
const canEdit = computed(() => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR'].includes(role.value || ''));

// Kullanıcı Baş harfleri
const userInitials = computed(() => {
  const name = auth.user?.name || 'U';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
});

// Rolü okunabilir string'e çevir
const formatRole = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'Süper Yönetici';
    case 'COMPANY_ADMIN': return 'Şirket Yöneticisi';
    case 'EDITOR': return 'Editör';
    case 'MEMBER': return 'İzleyici (Üye)';
    default: return 'Misafir';
  }
};

const logout = () => {
  auth.logout();
  router.push('/login');
};

// --- DİNAMİK NAVİGASYON ---
const navigation = computed(() => [
  {
    title: 'Genel Bakış',
    items: [
      {
        name: 'Dashboard',
        to: '/dashboard',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        visible: true // Herkes görür
      }
    ]
  },
  {
    title: 'AR Studio',
    items: [
      {
        name: 'Sahnelerim',
        to: '/dashboard/ar-scene',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        visible: true // Herkes görür
      },
      {
        name: '3D Modeller',
        to: '/dashboard/ar-model',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        visible: true // Herkes görür
      },
      {
        name: 'Model Yükle',
        to: '/dashboard/ar-model/upload',
        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        visible: canEdit.value // Member göremez
      }
    ]
  },
  {
    title: 'Katalog',
    items: [
      {
        name: 'Kategoriler',
        to: '/dashboard/catalog/categories',
        icon: 'M4 6h16M4 12h10M4 18h7',
        visible: canEdit.value
      },
      {
        name: 'Seriler',
        to: '/dashboard/catalog/series',
        icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
        visible: canEdit.value
      },
      {
        name: 'Şekiller',
        to: '/dashboard/catalog/shapes',
        icon: 'M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z',
        visible: isSuperAdmin.value
      }
    ]
  },
  {
    title: 'Yönetim',
    items: [
      {
        name: 'Şirketim', // Şirket Yöneticisi için
        to: '/dashboard/my-company',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        visible: isCompanyAdmin.value
      },
      {
        name: 'Şirketler', // Sadece Super Admin için
        to: '/dashboard/companies',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        visible: isSuperAdmin.value
      }
    ]
  }
]);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
}

.custom-scrollbar-light::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar-light::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-light::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>