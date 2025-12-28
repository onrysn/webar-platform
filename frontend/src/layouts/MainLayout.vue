<template>
  <div class="h-screen flex flex-col md:flex-row bg-gray-100 overflow-hidden">

    <div class="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shrink-0 z-20 shadow-md">
      <span class="font-bold text-lg tracking-wider">WebAR Admin</span>
      <button @click="toggleSidebar" class="p-2 rounded focus:bg-gray-800">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>

    <div v-if="isSidebarOpen" @click="closeSidebar" class="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity">
    </div>

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div
        class="h-16 flex items-center px-6 bg-gray-800 text-white font-bold text-xl tracking-wider shadow-sm shrink-0">
        WebAR Admin
        <button @click="closeSidebar" class="md:hidden ml-auto text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="flex-1 flex flex-col space-y-1 px-3 py-4 overflow-y-auto">

        <div class="space-y-1">
          <router-link to="/dashboard" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </router-link>

          <router-link to="/dashboard/projects" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Projects
          </router-link>
        </div>

        <div class="pt-4">
          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AR Studio</p>

          <router-link to="/dashboard/ar-scene" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-indigo-400 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sahnelerim
          </router-link>

          <router-link to="/dashboard/ar-model" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-blue-400 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            3D Modeller
          </router-link>

          <router-link v-if="isAdmin" to="/dashboard/ar-model/upload" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-gray-500 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Model Yükle
          </router-link>
        </div>

        <div v-if="isAdmin" class="pt-4">
          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yönetim</p>

          <router-link to="/dashboard/companies" active-class="bg-gray-800 text-white"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition-colors">
            <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Şirketler
          </router-link>

          <div v-if="activeCompanyId" class="mt-1 ml-4 border-l-2 border-gray-700 pl-2 space-y-1">
            <p class="text-xs text-gray-500 mb-1">Seçili Şirket (#{{ activeCompanyId }})</p>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/update`" active-class="text-white"
              class="block text-sm text-gray-400 hover:text-white">Düzenle</router-link>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/manage-users`" active-class="text-white"
              class="block text-sm text-gray-400 hover:text-white">Kullanıcılar</router-link>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/api-key`" active-class="text-white"
              class="block text-sm text-gray-400 hover:text-white">API Key</router-link>
          </div>
        </div>

      </nav>

      <div class="border-t border-gray-800 p-4 shrink-0">
        <router-link to="/dashboard/settings"
          class="flex items-center text-sm font-medium text-gray-300 hover:text-white mb-3">
          <svg class="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ayarlar
        </router-link>

        <button @click="logout"
          class="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors">
          <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış Yap
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto relative w-full">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    // Sidebar kontrolü için reactive state
    const isSidebarOpen = ref(false);

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    const closeSidebar = () => {
      isSidebarOpen.value = false;
    };

    // Mobil menü açıkken sayfa değişirse menüyü otomatik kapat
    watch(() => route.path, () => {
      closeSidebar();
    });

    const logout = () => {
      auth.logout();
      router.push('/login');
    };

    const activeCompanyId = computed(() => {
      const match = route.path.match(/\/dashboard\/companies\/(\d+)/);
      return match ? match[1] : null;
    });

    const isAdmin = computed(() => auth.user?.role === 'admin');

    return {
      logout,
      activeCompanyId,
      isAdmin,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar
    };
  },
});
</script>