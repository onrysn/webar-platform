<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center p-8 border border-slate-100">
      
      <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 class="text-2xl font-extrabold text-slate-800 mb-2">Erişim Kısıtlandı</h1>
      
      <p class="text-slate-500 mb-8 leading-relaxed">
        {{ errorMessage || 'Şirket hesabınızla ilgili bir durumdan dolayı sisteme erişiminiz geçici olarak durdurulmuştur.' }}
      </p>

      <div class="space-y-3">
        <a href="mailto:destek@webar.com" class="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200">
          Destek Ekibiyle İletişime Geç
        </a>
        
        <button @click="logout" class="block w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
          Çıkış Yap
        </button>
      </div>
      
      <div class="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
        Hata Kodu: 403_ACCESS_SUSPENDED
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../../store/modules/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// URL'den gelen hata mesajını al (query param)
const errorMessage = computed(() => route.query.reason as string);

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>