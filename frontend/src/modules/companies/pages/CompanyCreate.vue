<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div
        class="mx-auto h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm transform rotate-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>

      <h2 class="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">Yeni Şirket Oluştur</h2>
      <p class="mt-2 text-center text-sm text-slate-500">
        Organizasyonunuzu sisteme kaydederek yönetime başlayın.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div
        class="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10 relative overflow-hidden">

        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <form class="space-y-6" @submit.prevent="handleSubmit">

          <div>
            <label for="name" class="block text-sm font-bold text-slate-700 mb-1">Şirket Adı</label>
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm13 10a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v2zm-1-4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v2z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <input v-model="name" type="text" id="name"
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-3 placeholder-slate-400 transition-colors"
                placeholder="Örn. Anatolio Teknoloji" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Alan Adı (Domain)</label>
            <div class="flex rounded-xl shadow-sm">
              <span
                class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-mono">
                https://
              </span>
              <input v-model="domain" type="text"
                class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="sirketiniz.com" required />
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <button type="submit" :disabled="isLoading"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isLoading ? 'Oluşturuluyor...' : 'Şirketi Oluştur' }}
            </button>

            <button type="button" @click="$router.back()"
              class="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors">
              Vazgeç
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
const isLoading = ref(false); // UI Feedback için

const handleSubmit = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await companyStore.createCompany({ name: name.value, domain: domain.value });
    toast.success('Şirket başarıyla oluşturuldu!');

    // Kısa bir gecikme ile yönlendirme (Toast görünsün diye)
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