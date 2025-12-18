<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">3D Model Yükle</h1>

    <div v-if="!tempData"
      class="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer transition hover:bg-gray-50 hover:border-blue-400 bg-white mb-6 group"
      @drop.prevent="(e) => handleDrop(e, 'auto')" @dragover.prevent @click="triggerFileSelect('auto')">

      <div class="flex flex-col items-center justify-center pointer-events-none">
        <div class="p-4 bg-blue-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold text-lg">Model Dosyasını Sürükleyin</p>
        <p class="text-gray-400 text-sm mt-2">veya dosya seçmek için tıklayın</p>
        <div class="flex gap-2 mt-4 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
          <span class="text-blue-600 font-bold">.FBX (Otomatik Dönüştür)</span>
          <span class="border-l border-gray-300 pl-2">.GLB + .USDZ (Manuel)</span>
        </div>
      </div>
      <input ref="mainInput" type="file" class="hidden" accept=".glb,.gltf,.fbx,.usdz"
        @change="(e) => onFileChange(e, 'auto')" />
    </div>

    <div v-if="uploading" class="mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div class="flex justify-between text-sm font-medium text-gray-700 mb-2">
        <span>{{ progress === 100 ? 'İşleniyor...' : 'Yükleniyor...' }}</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div class="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
          :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div v-if="tempData" class="flex flex-col gap-6">

      <div v-if="previewUrl"
        class="w-full h-96 shadow-lg rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
        <ArPreview ref="previewRef" :src="previewUrl" />
        <div
          class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">
          3D Önizleme
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="p-4 rounded-xl border shadow-sm flex flex-col gap-3 relative transition-colors"
          :class="tempData.glb ? 'bg-white border-blue-100' : 'bg-gray-50 border-dashed border-gray-300 hover:bg-blue-50 cursor-pointer'"
          @click="!tempData.glb ? triggerFileSelect('glb') : null"
          @drop.prevent="(e) => !tempData?.glb && handleDrop(e, 'glb')" @dragover.prevent>

          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg transition-colors"
              :class="tempData.glb ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'">
              <span class="font-bold text-xs">GLB</span>
            </div>

            <div v-if="tempData.glb" class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ tempData.glb.filename }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(tempData.glb.size) }} • Web & Android</p>
              <a :href="getDownloadUrl(tempData.glb.url)" target="_blank"
                class="text-xs text-blue-600 hover:underline mt-1 inline-block">İndir</a>
            </div>

            <div v-else class="flex-1 flex flex-col justify-center h-full min-h-[50px]">
              <p class="text-sm font-medium text-gray-600">GLB Dosyası Eksik</p>
              <p class="text-xs text-gray-400">Yüklemek için tıklayın</p>
            </div>

            <div v-if="tempData.glb" class="text-green-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <input ref="glbInput" type="file" class="hidden" accept=".glb,.gltf"
            @change="(e) => onFileChange(e, 'glb')" />
        </div>

        <div class="p-4 rounded-xl border shadow-sm flex flex-col gap-3 relative transition-colors"
          :class="tempData.usdz ? 'bg-white border-purple-100' : 'bg-gray-50 border-dashed border-gray-300 hover:bg-purple-50 cursor-pointer'"
          @click="!tempData.usdz ? triggerFileSelect('usdz') : null"
          @drop.prevent="(e) => !tempData?.usdz && handleDrop(e, 'usdz')" @dragover.prevent>

          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg transition-colors"
              :class="tempData.usdz ? 'bg-purple-50 text-purple-600' : 'bg-gray-200 text-gray-400'">
              <span class="font-bold text-xs">USDZ</span>
            </div>

            <div v-if="tempData.usdz" class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ tempData.usdz.filename }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatBytes(tempData.usdz.size) }} • iOS AR</p>
              <a :href="getDownloadUrl(tempData.usdz.url)" target="_blank"
                class="text-xs text-purple-600 hover:underline mt-1 inline-block">İndir</a>
            </div>

            <div v-else class="flex-1 flex flex-col justify-center h-full min-h-[50px]">
              <p class="text-sm font-medium text-gray-600">USDZ Dosyası Eksik</p>
              <p class="text-xs text-gray-400">Yüklemek için tıklayın</p>
            </div>

            <div v-if="tempData.usdz" class="text-green-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <input ref="usdzInput" type="file" class="hidden" accept=".usdz" @change="(e) => onFileChange(e, 'usdz')" />
        </div>

      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Model Yayınlama</h3>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Model Adı</label>
          <input v-model="modelName" type="text"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Örn: iPhone 15 Pro Max">
        </div>

        <div v-if="!isReadyToFinalize"
          class="mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
            </path>
          </svg>
          <span>Kaydetmek için hem GLB hem de USDZ dosyasının yüklenmiş olması gerekmektedir.</span>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="finalizeUpload" :disabled="!isReadyToFinalize || finalizing"
            class="flex-1 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-xl transition disabled:cursor-not-allowed flex items-center justify-center gap-2">
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

// --- Refs ---
const mainInput = ref<HTMLInputElement | null>(null);
const glbInput = ref<HTMLInputElement | null>(null);
const usdzInput = ref<HTMLInputElement | null>(null);
const previewRef = ref<InstanceType<typeof ArPreview> | null>(null);

// --- State ---
const uploading = ref(false);
const finalizing = ref(false);
const progress = ref(0);
const error = ref<string | null>(null);
const modelName = ref("");

const tempData = ref<TempModelResponse | null>(null);
const COMPANY_ID = 1;

// --- Computed ---
const previewUrl = computed(() => {
  if (!tempData.value) return '';
  // Öncelik GLB'de
  if (tempData.value.glb?.url) return arModelService.getPreviewUrl(tempData.value.glb.url);
  // Yoksa genel preview
  if (tempData.value.previewUrl) return arModelService.getPreviewUrl(tempData.value.previewUrl);
  return '';
});

// Finalize butonu sadece iki dosya da varsa aktif olur
const isReadyToFinalize = computed(() => {
  return tempData.value && tempData.value.glb && tempData.value.usdz;
});

// --- Helper Functions ---
const formatBytes = (bytes: number) => {
  if (!+bytes) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

const getDownloadUrl = (path: string) => arModelService.getPreviewUrl(path);

// --- Actions ---

// Hangi input'un tetikleneceğini belirler
const triggerFileSelect = (type: 'auto' | 'glb' | 'usdz') => {
  if (type === 'auto') mainInput.value?.click();
  else if (type === 'glb') glbInput.value?.click();
  else if (type === 'usdz') usdzInput.value?.click();
};

const onFileChange = (event: Event, type: 'auto' | 'glb' | 'usdz') => {
  const files = (event.target as HTMLInputElement).files;
  if (files?.[0]) processUpload(files[0], type);
};

const handleDrop = (event: DragEvent, type: 'auto' | 'glb' | 'usdz') => {
  const file = event.dataTransfer?.files[0];
  if (file) processUpload(file, type);
};

// --- Ana Yükleme Mantığı ---
const processUpload = async (file: File, type: 'auto' | 'glb' | 'usdz') => {
  error.value = null;
  uploading.value = true;
  progress.value = 0;

  if (!modelName.value) {
    modelName.value = file.name.replace(/\.[^/.]+$/, "");
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    // Gelen yanıtın tipini 'any' olarak işaretliyoruz çünkü manuel upload yanıtı 
    // standart TempModelResponse yapısından (iç içe yapıdan) farklı dönüyor.
    let res: any = null;
    const currentTempId = tempData.value?.tempId;

    // --- 1. FBX Yükleme (Bu kısımda sorun yok, backend zaten nested dönüyor) ---
    if (ext === 'fbx') {
      if (type !== 'auto') throw new Error("FBX dosyaları sadece ana ekrandan yüklenebilir.");
      res = await arModelService.uploadFbx(file, (p) => progress.value = p);
      tempData.value = res;
    }

    // --- 2. GLB Yükleme (DÜZELTİLDİ) ---
    else if (ext === 'glb' || ext === 'gltf') {
      if (type === 'usdz') throw new Error("Lütfen buraya USDZ dosyası yükleyin.");

      res = await arModelService.uploadGlb(file, currentTempId, (p) => progress.value = p);

      // Backend'den düz gelen veriyi, frontend'in beklediği 'glb' objesi içine paketliyoruz
      tempData.value = {
        tempId: res.tempId,          // ID güncellenir
        previewUrl: res.previewUrl,  // Ana önizleme URL'i GLB'den gelir
        glb: {                       // <--- İŞTE BURASI EKSİKTİ
          filename: res.filename,
          url: res.previewUrl,
          size: res.size
        },
        usdz: tempData.value?.usdz || undefined // Varsa eski USDZ'yi koru
      };
    }

    // --- 3. USDZ Yükleme (DÜZELTİLDİ) ---
    else if (ext === 'usdz') {
      if (type === 'glb') throw new Error("Lütfen buraya GLB dosyası yükleyin.");

      res = await arModelService.uploadUsdz(file, currentTempId, (p) => progress.value = p);

      // Backend'den düz gelen veriyi, frontend'in beklediği 'usdz' objesi içine paketliyoruz
      tempData.value = {
        tempId: res.tempId,
        // Eğer önceden yüklenmiş bir GLB varsa onun previewUrl'ini koru, yoksa boş kalsın 
        // (USDZ web'de doğrudan render edilemez)
        previewUrl: tempData.value?.previewUrl,
        glb: tempData.value?.glb || undefined, // Varsa eski GLB'yi koru
        usdz: {                      // <--- BURAYI OLUŞTURUYORUZ
          filename: res.filename,
          url: res.previewUrl,
          size: res.size
        }
      };
    } else {
      throw new Error("Desteklenmeyen dosya formatı.");
    }

  } catch (err: any) {
    console.error(err);
    error.value = err.message || err.response?.data?.message || "Yükleme hatası";
  } finally {
    uploading.value = false;
    if (mainInput.value) mainInput.value.value = "";
    if (glbInput.value) glbInput.value.value = "";
    if (usdzInput.value) usdzInput.value.value = "";
  }
};

const dataURLtoBlob = (dataurl: string): Blob => {
  const [header, base64Data] = dataurl.split(',');

  if (!header || !base64Data) {
    throw new Error('Geçersiz DataURL formatı: Parçalar eksik.');
  }
  const match = header.match(/:(.*?);/);
  const mime = (match && match[1]) ? match[1] : 'image/png';

  try {
    const bstr = atob(base64Data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    throw new Error('Base64 verisi decode edilemedi: ' + e);
  }
};

const finalizeUpload = async () => {
  if (!isReadyToFinalize.value || !tempData.value?.tempId) return;

  finalizing.value = true;
  error.value = null;

  try {
    const screenshotBase64 = previewRef.value?.takeScreenshot();
    let thumbnailBlob: Blob | undefined;

    if (screenshotBase64) {
      thumbnailBlob = dataURLtoBlob(screenshotBase64);
    }

    await arModelService.finalizeModel({
      tempId: tempData.value.tempId,
      companyId: COMPANY_ID,
      modelName: modelName.value,
      thumbnail: thumbnailBlob // Artık Blob gönderiyoruz
    });

    alert("Model ve thumbnail başarıyla kaydedildi!");
    resetForm();

  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Kaydetme başarısız.";
  } finally {
    finalizing.value = false;
  }
};

const cancelProcess = () => resetForm();

const resetForm = () => {
  tempData.value = null;
  progress.value = 0;
  modelName.value = "";
  error.value = null;
  uploading.value = false;
};
</script>