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
          {{ t('companies.backToList') }}
        </router-link>
      </nav>

      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ t('companies.createNew') }}</h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ t('companies.createNewDesc') }}
        </p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <form class="p-6 sm:p-8 space-y-8" @submit.prevent="handleSubmit">

          <div>
            <label for="name" class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('companies.form.name') }}</label>
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
                :placeholder="t('companies.form.companyNamePlaceholder')" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('companies.form.domain') }}</label>
            <div class="flex rounded-xl shadow-sm">
              <span
                class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-mono select-none">
                https://
              </span>
              <input v-model="domain" type="text" @blur="sanitizeDomain"
                class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                :placeholder="t('companies.form.domainPlaceholder')" />
            </div>
            <p class="mt-2 text-xs text-slate-500">
              {{ t('companies.form.domainHint') }}
            </p>
          </div>

          <div>
            <label for="maxScenes" class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('companies.form.maxScenes') }}</label>
            <input v-model.number="maxScenes" type="number" id="maxScenes" min="1"
              class="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm font-medium"
              :placeholder="t('companies.form.maxScenesPlaceholder')" />
            <p class="mt-2 text-xs text-slate-500">
              {{ t('companies.form.maxScenesHint') }}
            </p>
          </div>

          <div>
            <label for="logo" class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('companies.form.logo') }}</label>
            <div class="mt-1 flex items-center gap-4">
              <div v-if="logoPreview" class="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                <img :src="logoPreview" alt="Logo önizleme" class="w-full h-full object-contain" />
                <button type="button" @click="clearLogo"
                  class="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input type="file" id="logo" @change="handleLogoChange" accept="image/*"
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
            <p class="mt-2 text-xs text-slate-500">
              {{ t('companies.form.logoHint') }}
            </p>
          </div>

          <div class="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
            <button type="button" @click="$router.back()"
              class="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200">
              {{ t('common.cancel') }}
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
              {{ isLoading ? t('companies.creating') : t('companies.createCompany') }}
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
import { useI18n } from 'vue-i18n';
import { useCompanyStore } from '../../../store/modules/company';

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const companyStore = useCompanyStore();

const name = ref('');
const domain = ref('');
const maxScenes = ref<number | null>(10);
const logoFile = ref<File | null>(null);
const logoPreview = ref<string | null>(null);
const isLoading = ref(false);

// Kullanıcı domain'i kopyala yapıştır yaparsa https:// kısmını temizle
const sanitizeDomain = () => {
  if (!domain.value) return;
  domain.value = domain.value
    .replace(/^https?:\/\//, '') // http:// veya https:// kaldır
    .replace(/\/$/, '') // Sondaki slash'ı kaldır
    .toLowerCase();
};

const handleLogoChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo dosyası 5MB\'dan küçük olmalıdır.');
      return;
    }
    
    logoFile.value = file;
    
    // Önizleme oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const clearLogo = () => {
  logoFile.value = null;
  logoPreview.value = null;
  const input = document.getElementById('logo') as HTMLInputElement;
  if (input) input.value = '';
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  // Göndermeden önce temizle
  sanitizeDomain();

  isLoading.value = true;
  try {
    let logoBase64: string | undefined;

    // Logo varsa base64'e çevir
    if (logoFile.value) {
      logoBase64 = await fileToBase64(logoFile.value);
    }

    await companyStore.createCompany({
      name: name.value,
      domain: domain.value || undefined,
      maxScenes: maxScenes.value || undefined,
      logoBase64
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