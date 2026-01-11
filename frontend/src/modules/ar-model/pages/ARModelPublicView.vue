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
          class="w-full h-full"
          format="glb"
        />
      </div>

      <div class="absolute bottom-8 left-0 right-0 z-30 flex justify-center px-4">
        <button 
          @click="activateAR"
          class="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-full shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-105 active:scale-95 group"
        >
          <div class="relative w-5 h-5">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
             </svg>
          </div>
          <span class="font-bold tracking-wide text-sm sm:text-base">AR'da Görüntüle</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
// Servis ve Component yollarını kendi projene göre ayarla
import { arModelService } from '../../../services/arModelService'; 
import ArPreview from '../components/ArPreview.vue'; // Three.js olan eski component

const route = useRoute();
const token = route.params.token as string;

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const modelData = ref<any>(null);
const previewBlobUrl = ref<string | null>(null);
const iosBlobUrl = ref<string | null>(null);

// Link oluşturucu (Backend URL'i)
const getDirectUrl = (format: 'glb' | 'usdz') => {
  // Backend'e giden gerçek public linki oluşturuyoruz
  // window.location.origin kullanımı Nginx arkasında doğru çalışır
  return `${window.location.origin}/api/shared/ar-model/${token}/file?format=${format}`;
};

onMounted(async () => {
  if (!token) {
    error.value = "Geçersiz bağlantı.";
    isLoading.value = false;
    return;
  }

  try {
    modelData.value = await arModelService.getSharedModel(token);

    // 1. Ekranda göstermek için GLB indir (Blob)
    const glbBlob = await arModelService.getSharedFileBlob(token, 'glb');
    previewBlobUrl.value = URL.createObjectURL(glbBlob);

    // 2. iOS için USDZ varsa onu da indir (Blob) - Opsiyonel, doğrudan link de verilebilir
    // iOS Blob URL ile daha hızlı çalışır
    if (modelData.value.files?.usdz?.url) {
        try {
            const usdzBlob = await arModelService.getSharedFileBlob(token, 'usdz');
            iosBlobUrl.value = URL.createObjectURL(usdzBlob);
        } catch (e) {
            console.warn("USDZ indirilemedi, doğrudan link kullanılacak.");
        }
    }

  } catch (err: any) {
    console.error("View Error:", err);
    error.value = err.response?.status === 404 
        ? "Bu model bulunamadı veya erişime kapatıldı." 
        : "Model yüklenirken hata oluştu.";
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (previewBlobUrl.value) URL.revokeObjectURL(previewBlobUrl.value);
  if (iosBlobUrl.value) URL.revokeObjectURL(iosBlobUrl.value);
});

// --- MANUEL AR TETİKLEME (model-viewer olmadan) ---
const activateAR = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
        // --- iOS (AR Quick Look) ---
        // USDZ dosyasına işaret eden bir anchor oluşturup tıklıyoruz
        const anchor = document.createElement('a');
        anchor.setAttribute('rel', 'ar');
        anchor.appendChild(document.createElement('img'));
        
        // Varsa indirdiğimiz blob'u, yoksa direkt backend linkini kullan
        const url = iosBlobUrl.value || getDirectUrl('usdz');
        anchor.setAttribute('href', url);
        
        anchor.click(); // iOS'te bu işlem AR Quick Look'u açar
    } 
    else if (isAndroid) {
        // --- Android (Scene Viewer) ---
        // Intent protokolü ile Google Scene Viewer'ı açıyoruz
        // Android Blob URL'i açamaz, bu yüzden mutlaka PUBLIC HTTP linki vermemiz lazım!
        const modelUrl = getDirectUrl('glb');
        const title = modelData.value?.description || '3D Model';
        
        const intentParams = [
            `file=${encodeURIComponent(modelUrl)}`,
            `mode=ar_only`,
            `title=${encodeURIComponent(title)}`,
            `resizable=false`
        ].join('&');

        const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?${intentParams}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(modelUrl)};end;`;

        window.location.href = intentUrl;
    } 
    else {
        // Masaüstü veya desteklenmeyen cihaz
        alert("AR özelliği sadece mobil cihazlarda (iOS ve Android) çalışır.");
    }
};
</script>

<style scoped>
:global(body) {
  overflow: hidden; 
  background-color: #111827;
}
</style>