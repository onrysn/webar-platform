<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-3xl mx-auto">

      <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-12 bg-slate-200 rounded-xl w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-12 bg-slate-200 rounded-xl w-full"></div>
        <div class="h-12 bg-slate-200 rounded-xl w-32 mt-4"></div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div class="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>

        <form @submit.prevent="updateCompany" class="p-8 space-y-6">

          <div>
            <h2 class="text-lg font-bold text-slate-900">Temel Bilgiler</h2>
            <p class="text-sm text-slate-500 mb-6">Şirketinizin görünen adı ve domain ayarlarını buradan
              güncelleyebilirsiniz.</p>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Şirket Adı</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm13 10a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v2zm-1-4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v2z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <input v-model="form.name" type="text"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="Şirket ismini giriniz" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Alan Adı (Domain)</label>
            <div class="flex rounded-xl shadow-sm">
              <span
                class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-mono">
                https://
              </span>
              <input v-model="form.domain" type="text"
                class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="sirketiniz.com" required />
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end border-t border-slate-100 mt-6">
            <button type="submit" :disabled="isSaving"
              class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
// ... Mevcut script kodunuz (loadCompany, updateCompany vs.) ...
import { reactive, ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import type { CompanyDto } from '../dto/company.dto';
import { companyService } from '../../../services/companyService';

const toast = useToast();
const route = useRoute();
const companyId = Number(route.params.id);

const loading = ref(true);
const isSaving = ref(false);

const company = reactive<CompanyDto>({ id: 0, name: '', domain: '', apiKey: '', users: [] });
const form = reactive({ name: '', domain: '' });

async function loadCompany() {
  loading.value = true;
  try {
    const data = await companyService.getCompanyById(companyId);
    Object.assign(company, data);
    form.name = data.name;
    form.domain = data.domain;
  } catch (error) {
    toast.error("Şirket bilgileri alınamadı.");
  } finally {
    loading.value = false;
  }
}

async function updateCompany() {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    await companyService.updateCompany(companyId, form);
    toast.success('Şirket bilgileri güncellendi!');
  } catch (error: any) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Güncelleme sırasında hata oluştu.');
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadCompany);
</script>