<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">3D Model Yükle</h1>

    <div v-if="!tempData"
      class="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer transition hover:bg-gray-50 hover:border-blue-400 bg-white mb-6 group"
      @drop.prevent="handleDrop" @dragover.prevent @click="triggerFileSelect">
      <div class="flex flex-col items-center justify-center pointer-events-none">
        <div class="p-4 bg-blue-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold text-lg">Modeli Buraya Sürükleyin</p>
        <p class="text-gray-400 text-sm mt-2">veya dosya seçmek için tıklayın</p>
        <div class="flex gap-2 mt-4 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
          <span>.FBX</span>
          <span>.GLB</span>
          <span>.USDZ</span>
        </div>
      </div>
      <input ref="fileInput" type="file" class="hidden" accept=".glb,.gltf,.fbx,.usdz" @change="onFileChange" />
    </div>

    <div v-if="uploading" class="mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div class="flex justify-between text-sm font-medium text-gray-700 mb-2">
        <span>İşleniyor...</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div class="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
          :style="{ width: progress + '%' }"></div>
      </div>
      <p class="text-xs text-gray-400 mt-2">Model dönüştürme işlemi dosya boyutuna göre zaman alabilir.</p>
    </div>

    <div v-if="tempData" class="flex flex-col gap-6">
      
      <div class="w-full h-96 shadow-lg rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
        <ArPreview ref="previewRef" :src="previewUrl" />
        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">
          3D Önizleme
        </div>
      </div>

      <div v-if="tempData.glb || tempData.usdz" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div v-if="tempData.glb" class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-start gap-3">
          <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <span class="font-bold text-xs">GLB</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate" :title="tempData.glb.filename">
              {{ tempData.glb.filename }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(tempData.glb.size) }} • Web & Android</p>
            <a :href="getDownloadUrl(tempData.glb.url)" target="_blank" class="text-xs text-blue-600 hover:underline mt-1 inline-block">
              İndir / Önizle
            </a>
          </div>
        </div>

        <div v-if="tempData.usdz" class="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-start gap-3">
          <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
             <span class="font-bold text-xs">USDZ</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate" :title="tempData.usdz.filename">
              {{ tempData.usdz.filename }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(tempData.usdz.size) }} • iOS AR</p>
             <a :href="getDownloadUrl(tempData.usdz.url)" target="_blank" class="text-xs text-purple-600 hover:underline mt-1 inline-block">
              İndir / Önizle
            </a>
          </div>
        </div>

      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Model Yayınlama</h3>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Model Adı</label>
          <input v-model="modelName" type="text"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Örn: iPhone 15 Pro Max">
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="finalizeUpload" :disabled="finalizing"
            class="flex-1 bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="finalizing" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ finalizing ? 'Kaydediliyor...' : 'Kaydet ve Yayınla' }}
          </button>

          <button @click="cancelProcess" :disabled="finalizing"
            class="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
            İptal
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
      <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{{ error }}</span>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import ArPreview from "../components/ArPreview.vue";
import type { TempModelResponse } from "../dto/arModel.dto";
import { arModelService } from "../../../services/arModelService";

// --- State ---
const fileInput = ref<HTMLInputElement | null>(null);
const previewRef = ref<InstanceType<typeof ArPreview> | null>(null);

const uploading = ref(false);
const finalizing = ref(false);
const progress = ref(0);
const error = ref<string | null>(null);

const tempData = ref<TempModelResponse | null>(null);
const modelName = ref("");

const COMPANY_ID = 1;

// --- Computed ---
const previewUrl = computed(() => {
  if (!tempData.value) return '';

  // 1. FBX dönüşümü sonucu oluşan GLB varsa onu kullan
  if (tempData.value.glb?.url) {
    return arModelService.getPreviewUrl(tempData.value.glb.url);
  }

  // 2. Doğrudan GLB/USDZ yüklendiyse genel previewUrl kullan
  if (tempData.value.previewUrl) {
    return arModelService.getPreviewUrl(tempData.value.previewUrl);
  }

  return '';
});

// --- Helper Functions ---

// Byte cinsinden boyutu okunabilir formata çevirir (KB, MB)
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// URL'i frontend'de kullanılabilir tam linke çevirir
const getDownloadUrl = (path: string) => {
  return arModelService.getPreviewUrl(path);
};

// --- Actions ---

const triggerFileSelect = () => fileInput.value?.click();

const onFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files?.[0]) startUploadProcess(files[0]);
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) startUploadProcess(file);
};

const startUploadProcess = async (file: File) => {
  error.value = null;
  uploading.value = true;
  progress.value = 0;
  // Dosya adını al (uzantısız)
  modelName.value = file.name.replace(/\.[^/.]+$/, "") || file.name;
  
  try {
    const res = await arModelService.uploadTempModel(file, (pct) => {
      progress.value = pct;
    });
    
    // Backend'den gelen yanıtı ata
    tempData.value = res;

  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Dosya yüklenirken bir hata oluştu.";
    tempData.value = null;
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const finalizeUpload = async () => {
  if (!tempData.value || !tempData.value.tempId) return;

  finalizing.value = true;
  error.value = null;

  try {
    const thumbnailBase64 = previewRef.value?.takeScreenshot() || undefined;

    await arModelService.finalizeModel({
      tempId: tempData.value.tempId,
      companyId: COMPANY_ID,
      modelName: modelName.value,
      thumbnail: thumbnailBase64
    });

    alert("Model başarıyla kaydedildi!");
    resetForm();

  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Kaydetme işlemi başarısız oldu.";
  } finally {
    finalizing.value = false;
  }
};

const cancelProcess = () => {
  resetForm();
};

const resetForm = () => {
  tempData.value = null;
  progress.value = 0;
  modelName.value = "";
  error.value = null;
  uploading.value = false;
};
</script>