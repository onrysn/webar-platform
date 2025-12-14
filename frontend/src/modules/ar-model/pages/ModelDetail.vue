<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="mb-6 flex items-center justify-between">
        <button @click="$router.back()"
          class="flex items-center text-gray-600 hover:text-gray-900 transition font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd" />
          </svg>
          Geri Dön
        </button>
        <h1 class="text-2xl font-bold text-gray-900" v-if="modelData">{{ modelData.fileName }}</h1>
      </div>

      <div v-if="isLoading"
        class="flex justify-center items-center h-96 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <span class="text-gray-500 text-sm">Model detayları yükleniyor...</span>
        </div>
      </div>

      <div v-else-if="error" class="bg-red-50 p-6 rounded-xl text-center border border-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-400 mx-auto mb-2" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-medium text-red-800">Hata Oluştu</h3>
        <p class="text-red-600 mt-1">{{ error }}</p>
      </div>

      <div v-else-if="modelData" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div
          class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] relative group">

          <ArPreview v-if="previewBlobUrl" :src="previewBlobUrl" class="w-full h-full z-10 relative" format="glb" />

          <div v-else class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
            <svg class="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span class="text-gray-500 text-sm font-medium">3D Model dosyası indiriliyor...</span>
          </div>
        </div>

        <div class="space-y-6">

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Model Bilgileri</h2>

            <dl class="space-y-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Yükleyen</dt>
                <dd class="font-medium text-gray-900">{{ modelData.uploadedBy }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Şirket/Açıklama</dt>
                <dd class="font-medium text-gray-900">{{ modelData.description }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Oluşturulma</dt>
                <dd class="font-medium text-gray-900">{{ formatDate(modelData.createdAt) }}</dd>
              </div>
            </dl>

            <div v-if="modelData.thumbnailUrl" class="mt-6">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Önizleme
                Görseli</span>
              <div class="rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img :src="getThumbnailUrl(modelData.thumbnailUrl)" class="w-full h-full object-cover"
                  alt="Model Thumbnail" />
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Dosyalar</h2>

            <div class="space-y-3">
              <button @click="downloadFile('glb')" :disabled="isDownloading"
                class="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-white text-blue-600 transition-colors">
                    <span class="font-bold text-xs">GLB</span>
                  </div>
                  <div class="ml-3 text-left">
                    <p class="text-sm font-medium text-gray-900">3D Model (Android/Web)</p>
                    <p class="text-xs text-gray-500">{{ formatBytes(modelData.files.glb.size) }}</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              <button v-if="modelData.files.usdz.exists" @click="downloadFile('usdz')" :disabled="isDownloading"
                class="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-white text-blue-600 transition-colors">
                    <span class="font-bold text-xs">USDZ</span>
                  </div>
                  <div class="ml-3 text-left">
                    <p class="text-sm font-medium text-gray-900">AR Model (iOS)</p>
                    <p class="text-xs text-gray-500">{{ formatBytes(modelData.files.usdz.size) }}</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              <div v-else class="p-4 bg-gray-50 rounded-xl text-center border border-dashed border-gray-300">
                <span class="text-xs text-gray-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                  Bu modelin iOS (USDZ) versiyonu bulunmuyor.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
// Import yollarını diğer ekranlarınızla eşitledik
import type { ModelDetailDto } from '../dto/arModel.dto';
import { arModelService } from '../../../services/arModelService';
import ArPreview from "../components/ArPreview.vue";

const route = useRoute();
const modelId = Number(route.params.id);

// State
const isLoading = ref(true);
const isDownloading = ref(false);
const error = ref<string | null>(null);
const modelData = ref<ModelDetailDto | null>(null);
const previewBlobUrl = ref<string | null>(null);

// Lifecycle
onMounted(() => {
  if (modelId) {
    loadPageData();
  } else {
    error.value = "Geçersiz Model ID";
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  // Memory leak'i önlemek için Blob URL'i temizle
  if (previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
});

// Metodlar
const loadPageData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // 1. Model detaylarını çek
    modelData.value = await arModelService.getModelDetails(modelId);

    // 2. Detaylar geldikten sonra önizleme için GLB dosyasını binary çek
    await loadPreviewModel();

  } catch (err: any) {
    console.error('Model yükleme hatası:', err);
    error.value = err.response?.data?.message || 'Model detayları yüklenirken bir hata oluştu.';
  } finally {
    isLoading.value = false;
  }
};

const loadPreviewModel = async () => {
  try {
    // Backend'den 'view' modunda blob iste (Auth token ile gelir)
    const blob = await arModelService.getModelFileBlob(modelId, 'glb', 'view');
    // Blob'u URL'e çevir ve state'e ata
    previewBlobUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error("Önizleme dosyası alınamadı:", err);
    // Hata olsa bile sayfa render edilmeli, sadece viewer boş kalır
  }
};

const downloadFile = async (format: 'glb' | 'usdz') => {
  if (!modelData.value) return;

  try {
    isDownloading.value = true;

    // Servis üzerinden dosyayı blob olarak indir
    const blob = await arModelService.getModelFileBlob(modelId, format, 'download');

    // JS ile indirmeyi tetikle
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Dosya adını belirle
    const fileName = `${modelData.value.fileName}.${format}`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();

    // Temizlik
    link.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("İndirme hatası:", err);
    alert('Dosya indirilemedi. Lütfen tekrar deneyin.');
  } finally {
    isDownloading.value = false;
  }
};

// Helper Formatlayıcılar
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// DÜZELTME: Bu fonksiyon artık arModelService kullanıyor, böylece Upload ekranıyla aynı mantık çalışıyor
const getThumbnailUrl = (path: string) => {
  return arModelService.getPreviewUrl(path);
};
</script>