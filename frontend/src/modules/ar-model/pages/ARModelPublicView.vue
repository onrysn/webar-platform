<template>
  <div class="h-screen w-full bg-gray-900 flex flex-col relative overflow-hidden">

    <div v-if="isLoading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
      <p class="text-sm font-medium tracking-wide animate-pulse">AR Deneyimi Hazırlanıyor...</p>
    </div>

    <div v-else-if="error" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Erişim Sağlanamadı</h1>
      <p class="text-gray-600 max-w-md">{{ error }}</p>
      <p class="text-xs text-gray-400 mt-8">Linkin süresi dolmuş veya iptal edilmiş olabilir.</p>
    </div>

    <div v-else class="relative w-full h-full">
      
      <div class="absolute top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div class="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-white drop-shadow-md">
              {{ modelData?.description || modelData?.fileName }}
            </h1>
            <p v-if="modelData?.companyName" class="text-sm text-gray-300 font-medium mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {{ modelData.companyName }}
            </p>
          </div>
          
          <div class="hidden md:block text-right">
             <span class="text-[10px] text-white/40 uppercase tracking-widest border border-white/20 px-2 py-1 rounded">
               WebAR Viewer
             </span>
          </div>
        </div>
      </div>

      <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
        <ArPreview 
          v-if="previewBlobUrl" 
          :src="previewBlobUrl" 
          :poster="null"
          class="w-full h-full"
          format="glb"
        />
      </div>

      <div class="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div class="bg-black/50 backdrop-blur-md text-white/80 text-xs px-4 py-2 rounded-full border border-white/10 shadow-lg">
             AR Modu için sağ alttaki butona tıklayın
          </div>
       </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { arModelService } from '../../../services/arModelService';
import ArPreview from '../components/ArPreview.vue';


const route = useRoute();
const token = route.params.token as string;

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const modelData = ref<any>(null); // Tip: SharedModelDto
const previewBlobUrl = ref<string | null>(null);

onMounted(async () => {
  if (!token) {
    error.value = "Geçersiz bağlantı.";
    isLoading.value = false;
    return;
  }

  try {
    // 1. Model Metadata'sını çek
    // (Auth gerektirmez, public endpoint)
    modelData.value = await arModelService.getSharedModel(token);

    // 2. GLB Dosyasını indir
    // (Auth gerektirmez, public endpoint)
    const blob = await arModelService.getSharedFileBlob(token, 'glb');
    previewBlobUrl.value = URL.createObjectURL(blob);

  } catch (err: any) {
    console.error("Public View Error:", err);
    // Backend'den gelen 404 mesajını göster
    if (err.response && err.response.status === 404) {
        error.value = "Bu model bulunamadı veya erişime kapatıldı.";
    } else {
        error.value = "Model yüklenirken bir bağlantı hatası oluştu.";
    }
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
});
</script>

<style scoped>
/* Tam ekran deneyim için scroll'u kapat */
:global(body) {
  overflow: hidden; 
  background-color: #111827; /* gray-900 */
}
</style>