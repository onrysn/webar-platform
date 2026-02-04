<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{{ t('companies.title') }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ t('companies.subtitle') }}</p>
        </div>

        <button @click="goToCreate"
          class="group w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('companies.createNew') }}
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n"
          class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm animate-pulse flex items-center gap-4">
          <div class="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-slate-200 rounded w-3/4"></div>
            <div class="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <div v-else-if="companies.length === 0"
        class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center">
        <div class="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-slate-900">{{ t('companies.noCompanies') }}</h3>
        <p class="text-slate-500 text-sm mt-1 max-w-sm">{{ t('companies.noCompaniesDesc') }}
        </p>
        <button @click="goToCreate"
          class="mt-6 px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
          {{ t('companies.addCompany') }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
        <CompanyCard v-for="company in companies" :key="company.id" :company="company"
          @click="goToDetail(company.id)" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CompanyCard from '../components/CompanyCard.vue';
import { useCompanyStore } from '../../../store/modules/company';
import type { CompanyDto } from '../dto/company.dto';

const router = useRouter();
const companyStore = useCompanyStore();
const loading = ref(true);
const { t } = useI18n();

const companies = computed<CompanyDto[]>(() => companyStore.companiesList);

const loadCompanies = async () => {
  loading.value = true;
  try {
    await companyStore.fetchAllCompanies();
  } catch (err) {
    console.error("Şirketler yüklenirken hata:", err);
  } finally {
    loading.value = false;
  }
};

const goToDetail = (id: number) => {
  router.push(`/dashboard/companies/${id}`);
};

const goToCreate = () => {
  router.push(`/dashboard/companies/create`);
};

onMounted(loadCompanies);
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>