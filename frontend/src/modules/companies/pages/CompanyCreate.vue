<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">

      <nav class="flex mb-6">
        <router-link to="/dashboard/companies"
          class="group flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Şirket Listesine Dön
        </router-link>
      </nav>

      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Yeni Şirket Oluştur</h1>
        <p class="mt-2 text-sm text-slate-500">
          Sisteme yeni bir organizasyon ekleyin. Bu işlem sonrası şirkete özel API anahtarı otomatik oluşturulacaktır.
        </p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <form class="p-6 sm:p-8 space-y-8" @submit.prevent="handleSubmit">

          <div>
            <label for="name" class="block text-sm font-bold text-slate-700 mb-1.5">Şirket Adı</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <input v-model="name" type="text" id="name"
                class="block w-full pl-10 bg-slate-50 border border-slate-300 rounded-xl py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium"
                placeholder="Örn. Anatolio Teknoloji A.Ş." required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">Alan Adı (Domain)</label>
            <div class="flex rounded-xl shadow-sm">
              <span
                class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-mono select-none">
                https://
              </span>
              <input v-model="domain" type="text" @blur="sanitizeDomain"
                class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                placeholder="sirketiniz.com" />
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Opsiyoneldir. CORS politikaları ve Whitelist işlemleri için kullanılır. 'http://' veya 'https://'
              yazmanıza gerek yoktur.
            </p>
          </div>

          <div class="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
            <button type="button" @click="$router.back()"
              class="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200">
              Vazgeç
            </button>

            <button type="submit" :disabled="isLoading"
              class="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isLoading ? 'Oluşturuluyor...' : 'Şirketi Oluştur' }}
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import { useCompanyStore } from '../../../store/modules/company';

const toast = useToast();
const router = useRouter();
const companyStore = useCompanyStore();

const name = ref('');
const domain = ref('');
const isLoading = ref(false);

// Kullanıcı domain'i kopyala yapıştır yaparsa https:// kısmını temizle
const sanitizeDomain = () => {
  if (!domain.value) return;
  domain.value = domain.value
    .replace(/^https?:\/\//, '') // http:// veya https:// kaldır
    .replace(/\/$/, '') // Sondaki slash'ı kaldır
    .toLowerCase();
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  // Göndermeden önce temizle
  sanitizeDomain();

  isLoading.value = true;
  try {
    // DTO'ya uygun obje gönderiyoruz
    await companyStore.createCompany({
      name: name.value,
      domain: domain.value || undefined // Boş string yerine undefined gitsin
    });

    toast.success('Şirket başarıyla oluşturuldu!');

    setTimeout(() => {
      router.push('/dashboard/companies');
    }, 500);

  } catch (err: any) {
    console.error(err);
    const msg = err.response?.data?.message || 'Şirket oluşturulamadı. Lütfen tekrar deneyin.';
    toast.error(msg);
  } finally {
    isLoading.value = false;
  }
};
</script>