<template>
  <div class="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button @click="$router.back()"
          class="group flex items-center text-gray-500 hover:text-gray-900 transition font-medium w-fit">
          <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-2 group-hover:border-gray-300 group-hover:shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </div>
          Geri Dön
        </button>
        
        <div v-if="modelData" class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
          ID: #{{ modelData.id }}
        </div>
      </div>

      <div v-if="isLoading" class="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-50 border-t-blue-600 mb-4"></div>
        <span class="text-gray-500 font-medium">Model detayları yükleniyor...</span>
      </div>

      <div v-else-if="error" class="bg-red-50 p-8 rounded-3xl text-center border border-red-100">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Bir Hata Oluştu</h3>
        <p class="text-gray-600 mt-2">{{ error }}</p>
        <button @click="loadPageData" class="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline">
          Tekrar Dene
        </button>
      </div>

      <div v-else-if="modelData" class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        <div class="lg:col-span-8 bg-gray-900 rounded-3xl shadow-lg overflow-hidden relative group">
          
          <div class="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
            <h1 class="text-2xl font-bold text-white tracking-tight drop-shadow-md">
              {{ modelData.fileName }}
            </h1>
          </div>

          <div class="h-[50vh] min-h-[400px] lg:h-[700px] w-full bg-gradient-to-br from-gray-800 to-gray-900 relative">
             <ArPreview 
                v-if="previewBlobUrl" 
                :src="previewBlobUrl" 
                class="w-full h-full z-10" 
                format="glb" 
             />
             
             <div v-else class="absolute inset-0 flex flex-col items-center justify-center z-0">
                <svg class="animate-spin h-10 w-10 text-white/20 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-white/40 text-sm font-medium">Model yükleniyor...</span>
             </div>
          </div>
        </div>

        <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-6">

          <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
            <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Dosya Yöneticisi</h2>

            <div class="space-y-3">
              <button @click="downloadFile('glb')" :disabled="isDownloading"
                class="w-full flex items-center p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition-all group text-left relative overflow-hidden">
                <div class="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <span class="font-bold text-sm">GLB</span>
                </div>
                <div class="ml-4 flex-1">
                   <p class="text-sm font-bold text-gray-900 group-hover:text-blue-700">Android & Web</p>
                   <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(modelData.files.glb.size) }}</p>
                </div>
                <div class="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </button>

              <button v-if="modelData.files.usdz.exists" @click="downloadFile('usdz')" :disabled="isDownloading"
                class="w-full flex items-center p-3 rounded-2xl border border-gray-200 hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/50 transition-all group text-left relative overflow-hidden">
                <div class="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <span class="font-bold text-sm">USDZ</span>
                </div>
                <div class="ml-4 flex-1">
                   <p class="text-sm font-bold text-gray-900 group-hover:text-indigo-700">iOS (AR Quick Look)</p>
                   <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(modelData.files.usdz.size) }}</p>
                </div>
                <div class="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </button>
              
              <div v-else class="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-center">
                 <span class="text-xs text-gray-400">iOS (USDZ) versiyonu mevcut değil.</span>
              </div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
            <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Detaylar</h2>
            
            <div class="space-y-4">
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-xs text-gray-500">Yükleyen Kullanıcı</p>
                  <p class="text-sm font-medium text-gray-900">{{ modelData.uploadedBy }}</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-1">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-xs text-gray-500">Oluşturulma Tarihi</p>
                  <p class="text-sm font-medium text-gray-900">{{ formatDate(modelData.createdAt) }}</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-xs text-gray-500">Açıklama</p>
                  <p class="text-sm font-medium text-gray-900 leading-snug">{{ modelData.description || 'Açıklama girilmemiş.' }}</p>
                </div>
              </div>
            </div>

            <div v-if="modelData.thumbnailUrl" class="mt-6 pt-6 border-t border-gray-100">
               <p class="text-xs text-gray-400 mb-2">Referans Görseli</p>
               <img :src="getThumbnailUrl(modelData.thumbnailUrl)" class="w-20 h-20 object-cover rounded-lg border border-gray-200" alt="Thumbnail" />
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