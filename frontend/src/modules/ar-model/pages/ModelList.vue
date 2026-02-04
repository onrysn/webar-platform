<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{{ t('models.title') }}</h1>
            <span v-if="routeCompanyId"
              class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
              {{ t('companies.title') }} #{{ routeCompanyId }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ t('models.subtitle') }}
          </p>
        </div>

        <div class="flex gap-3 w-full sm:w-auto">
          <button v-if="routeCompanyId" @click="goBackToCompany"
            class="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('scenes.backToCompany') }}
          </button>

          <button v-if="canUpload" @click="goToUpload"
            class="group w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ t('models.uploadNew') }}
          </button>
        </div>
      </div>

      <div v-if="isSuperAdmin && !routeCompanyId"
        class="mb-8 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-2 text-gray-500 min-w-max">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="text-sm font-bold">{{ t('models.filterByCompany') }}:</span>
        </div>

        <select v-model="selectedFilterCompanyId" @change="fetchModels"
          class="flex-1 w-full sm:w-auto p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block">
          <option :value="null">{{ t('models.allCompanies') }}</option>
          <option v-for="company in companiesList" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </select>

        <button v-if="selectedFilterCompanyId" @click="clearFilter"
          class="text-xs text-red-600 font-bold hover:underline">
          {{ t('common.filter') }} {{ t('common.remove') }}
        </button>
      </div>

      <!-- Kategori Filtresi (Tüm Kullanıcılar) -->
      <div class="mb-8 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-2 text-gray-500 min-w-max">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span class="text-sm font-bold">{{ t('models.filterByCategory') }}:</span>
        </div>

        <select v-model="selectedCategoryId" @change="fetchModels"
          class="flex-1 w-full sm:w-auto p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block">
          <option :value="null">{{ t('models.allCategories') }}</option>
          <option v-for="category in modelCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>

        <button v-if="selectedCategoryId" @click="clearCategoryFilter"
          class="text-xs text-red-600 font-bold hover:underline">
          {{ t('scenes.clearCategoryFilter') }}
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
          <div class="bg-gray-200 h-32 w-full rounded-xl mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-100 rounded-2xl p-6 text-center animate-pulse">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-900">{{ t('models.uploadModel.uploadError') }}</h3>
        <p class="mt-2 text-sm text-red-500">{{ error }}</p>
        <button @click="fetchModels" class="mt-4 text-sm font-medium text-red-600 hover:text-red-500 underline">
          {{ t('common.refresh') }}
        </button>
      </div>

      <div v-else-if="models.length === 0 && canUpload"
        class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
        <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900">{{ t('models.noModels') }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ selectedFilterCompanyId ? t('models.noModelsDesc') : t('models.noModelsDesc') }}
        </p>
        <div class="mt-6">
          <button @click="goToUpload"
            class="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-bold rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
            {{ t('models.uploadModel.title') }}
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ModelCard v-for="model in models" :key="model.id" :model="model" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { arModelService } from '../../../services/arModelService';
import { companyService } from '../../../services/companyService';
import { categoryService } from '../../../services/categoryService';
import { useAuthStore } from '../../../store/modules/auth';
import ModelCard from '../components/ModelCard.vue';
import type { ARModelDto } from '../dto/arModel.dto';
import type { CompanyDto } from '../../companies/dto/company.dto';
import type { CategoryDto } from '../../../services/categoryService';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

// STATE
const models = ref<ARModelDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// SUPER ADMIN STATE
const companiesList = ref<CompanyDto[]>([]);
const selectedFilterCompanyId = ref<number | null>(null);

// CATEGORY STATE
const modelCategories = ref<CategoryDto[]>([]);
const selectedCategoryId = ref<number | null>(null);

// COMPUTED
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');
const canUpload = computed(() => {
  const role = authStore.user?.role;
  return ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR'].includes(role || '');
});
// URL'den gelen zorunlu ID (Şirket Detay sayfasından gelindiyse)
const routeCompanyId = computed(() => route.params.companyId ? Number(route.params.companyId) : undefined);

// FETCH MODELS
const fetchModels = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Öncelik Sırası:
    // 1. URL'de companyId varsa (routeCompanyId) -> Onu kullan (Zorunlu)
    // 2. Super Admin Dropdown'dan bir şey seçtiyse (selectedFilterCompanyId) -> Onu kullan
    // 3. Hiçbiri yoksa -> undefined gönder (Backend token'a bakar veya hepsi gelir)

    const targetId = routeCompanyId.value || selectedFilterCompanyId.value || undefined;
    
    const filters: { categoryId?: number } = {};
    if (selectedCategoryId.value) {
      filters.categoryId = selectedCategoryId.value;
    }

    models.value = await arModelService.listModels(targetId, filters);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Modeller yüklenirken bir hata oluştu.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// FETCH COMPANIES (Sadece Super Admin için)
const fetchCompanies = async () => {
  if (isSuperAdmin.value && !routeCompanyId.value) {
    try {
      companiesList.value = await companyService.getAllCompanies();
    } catch (e) {
      console.error("Şirketler yüklenemedi", e);
    }
  }
};

// FETCH MODEL CATEGORIES
const fetchModelCategories = async () => {
  try {
    // MODEL tipindeki kategorileri getir
    modelCategories.value = await categoryService.list(undefined, undefined, 'MODEL');
  } catch (e) {
    console.error("Kategoriler yüklenemedi", e);
  }
};

const clearFilter = () => {
  selectedFilterCompanyId.value = null;
  fetchModels();
};

const clearCategoryFilter = () => {
  selectedCategoryId.value = null;
  fetchModels();
};

const goToUpload = () => {
  // Eğer filtre seçiliyse veya route'dan geldiyse, upload sayfasına ID taşı
  const idToPass = routeCompanyId.value || selectedFilterCompanyId.value;

  if (idToPass) {
    router.push({ path: '/dashboard/ar-model/upload', query: { companyId: idToPass } });
  } else {
    router.push('/dashboard/ar-model/upload');
  }
};

const goBackToCompany = () => {
  if (routeCompanyId.value) {
    router.push(`/dashboard/companies/${routeCompanyId.value}`);
  }
};

// Lifecycle
onMounted(() => {
  fetchCompanies();
  fetchModelCategories();
  fetchModels();
});

// Route değişirse (örn: bir şirketten çıkıp ana listeye dönerse)
watch(() => route.params.companyId, () => {
  fetchModels();
});
</script>