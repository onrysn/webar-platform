<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div class="flex items-center gap-3">
          <!-- Company Logo: Varsa company logo, yoksa default -->
          <div v-if="auth.user?.company?.logoUrl" 
            class="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <img :src="auth.user.company.logoUrl" :alt="auth.user.company.name" class="w-full h-full object-contain p-1" />
          </div>
          <div v-else class="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            W
          </div>
          <span class="font-bold text-slate-800 text-lg tracking-tight">
            {{ auth.user?.company?.name || 'WebAR' }} <span class="text-indigo-600 font-medium">Viewer</span>
          </span>
        </div>

        <nav class="hidden md:flex gap-1">
          <router-link to="/dashboard/ar-scene" 
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
            active-class="bg-indigo-50 text-indigo-700 font-bold">
            {{ t('nav.myScenes') }}
          </router-link>
          <router-link to="/dashboard/ar-model" 
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
            active-class="bg-indigo-50 text-indigo-700 font-bold">
            {{ t('nav.models') }}
          </router-link>
        </nav>

        <div class="flex items-center gap-4">          
          <button @click="logout" class="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" :title="t('nav.logout')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <router-link to="/dashboard/ar-scene" active-class="text-indigo-600" class="flex flex-col items-center gap-1 text-slate-400 p-2 w-1/2">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <span class="text-[10px] font-bold">{{ t('nav.scenes') }}</span>
      </router-link>
      <router-link to="/dashboard/ar-model" active-class="text-indigo-600" class="flex flex-col items-center gap-1 text-slate-400 p-2 w-1/2">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        <span class="text-[10px] font-bold">{{ t('nav.models') }}</span>
      </router-link>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../store/modules/auth';

const { t } = useI18n();

const auth = useAuthStore();
const router = useRouter();


const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>