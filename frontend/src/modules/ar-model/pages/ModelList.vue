<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">3D Kütüphanesi</h1>
          <p class="mt-1 text-sm text-gray-500">Yüklenen tüm AR modellerini buradan yönetebilirsiniz.</p>
        </div>

        <button @click="goToUpload"
          class="group w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Model Yükle
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
          <div class="bg-gray-200 h-32 w-full rounded-xl mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-900">Modeller Yüklenemedi</h3>
        <p class="mt-2 text-sm text-red-500">{{ error }}</p>
        <button @click="fetchModels" class="mt-4 text-sm font-medium text-red-600 hover:text-red-500 underline">
          Tekrar Dene
        </button>
      </div>

      <div v-else-if="models.length === 0"
        class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
        <div class="mx-auto h-24 w-24 text-gray-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Henüz hiç model yok</h3>
        <p class="mt-1 text-sm text-gray-500">İlk 3D modelinizi yükleyerek başlayın.</p>
        <div class="mt-6">
          <button @click="goToUpload"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
            Model Yükle
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ModelCard v-for="model in models" :key="model.id" :model="model" :baseUrl="baseUrl" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { arModelService } from '../../../services/arModelService';
import ModelCard from '../components/ModelCard.vue';

const router = useRouter();
const models = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const baseUrl = `${window.location.origin}/api`;

const fetchModels = async () => {
  loading.value = true;
  error.value = null; // Önceki hatayı temizle
  try {
    models.value = await arModelService.listModels();
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch models';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const goToUpload = () => {
  router.push('/dashboard/ar-model/upload');
};

onMounted(fetchModels);
</script>