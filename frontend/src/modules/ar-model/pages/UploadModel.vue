<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">

      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Yeni Model Yükle</h1>
          <p class="mt-2 text-gray-500 text-sm">
            Modelinizi yükleyin, önizleyin ve yayınlayın. FBX ve STEP dosyaları otomatik dönüştürülür.
          </p>
        </div>
        <div v-if="targetCompanyId"
          class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200">
          ADMIN MODU: Şirket #{{ targetCompanyId }}
        </div>
      </div>

      <div v-if="isSuperAdmin && !targetCompanyId" class="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-amber-100 rounded-full text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-bold text-amber-900 mb-2">Yükleme Yapılacak Şirketi Seçin</label>
            <p class="text-xs text-amber-700/80 mb-3">Super Admin olduğunuz için, bu modelin hangi şirkete ait olacağını belirtmelisiniz.</p>
            
            <select v-model="selectedCompanyId" 
              class="w-full p-3 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-gray-700">
              <option :value="null" disabled>Lütfen bir şirket seçiniz...</option>
              <option v-for="c in companiesList" :key="c.id" :value="c.id">{{ c.name }} ({{ c.domain || 'No Domain' }})</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="!tempData"
        class="relative border-2 border-dashed border-gray-300 rounded-3xl p-8 md:p-16 text-center hover:bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-300 group cursor-pointer bg-gray-50/50"
        @drop.prevent="(e) => handleDrop(e, 'auto')" @dragover.prevent @click="triggerFileSelect('auto')">

        <div class="flex flex-col items-center justify-center pointer-events-none space-y-4">
          <div
            class="p-5 bg-white shadow-sm rounded-full group-hover:scale-110 group-hover:shadow-md transition-transform duration-300">
            <div class="bg-blue-50 p-3 rounded-full">
              <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
          </div>

          <div>
            <p class="text-gray-900 font-bold text-lg md:text-xl">Dosyayı buraya bırakın</p>
            <p class="text-gray-500 text-sm mt-1">veya tarayıcıyı açmak için tıklayın</p>
          </div>

          <div class="flex flex-wrap justify-center gap-2 mt-2">
            <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg shadow-sm border border-blue-200">FBX (Otomatik)</span>
            <span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg shadow-sm border border-orange-200">STEP (Otomatik)</span>
            <span class="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">GLB</span>
            <span class="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">USDZ</span>
          </div>
        </div>

        <input ref="mainInput" type="file" class="hidden" accept=".glb,.gltf,.fbx,.usdz,.step,.stp"
          @change="(e) => onFileChange(e, 'auto')" />
      </div>

      <div v-if="uploading"
        class="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
        <div class="flex justify-between items-end mb-2 relative z-10">
          <div>
            <span class="text-lg font-bold text-gray-900 block">Dosya Yükleniyor</span>
            <span class="text-sm text-gray-500">
              {{ progress === 100 ? 'İşleniyor, lütfen bekleyin...' : `${uploadedChunks}/${totalChunks} parça yüklendi` }}
            </span>
          </div>
          <span class="text-2xl font-black text-blue-600">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative z-10">
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            :style="{ width: progress + '%' }"></div>
        </div>
        
        <!-- Pause/Resume/Cancel Buttons -->
        <div class="flex gap-3 mt-4 relative z-10">
          <button 
            v-if="uploadStatus === 'uploading'"
            @click="pauseUpload"
            class="flex-1 py-2 px-4 rounded-lg font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Duraklat
          </button>
          
          <button 
            v-if="uploadStatus === 'paused'"
            @click="resumeUpload"
            class="flex-1 py-2 px-4 rounded-lg font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Devam Et
          </button>
          
          <button 
            @click="cancelUpload"
            :disabled="uploadStatus === 'completed'"
            class="flex-1 py-2 px-4 rounded-lg font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </button>
        </div>
        
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50"></div>
      </div>

      <div v-if="tempData" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
         <div class="lg:col-span-7 space-y-6">
            <div class="relative w-full bg-gray-900 rounded-3xl overflow-hidden shadow-xl group border border-gray-800">
               <div class="h-64 md:h-96 w-full">
                  <ArPreview ref="previewRef" :src="previewUrl" v-if="previewUrl" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                     <span class="text-sm">Önizleme hazırlanamadı</span>
                  </div>
               </div>
            <div v-if="queueStatus?.status && (queueStatus.status === 'QUEUED' || queueStatus.status === 'CONVERTING')" class="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-3 rounded-lg text-xs font-medium border border-white/10">
              <div class="flex items-center justify-between">
                <span>📦 Dönüştürme kuyruğa alındı / işleniyor...</span>
                <span class="text-blue-300">%{{ Math.round(queueStatus.progress || 0) }}</span>
              </div>
              <div class="mt-2 w-full bg-white/10 rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full transition-all" :style="{ width: (queueStatus.progress || 0) + '%' }"></div>
              </div>
             </div>
               <div class="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Bu açı kapak fotoğrafı olacak
               </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <label class="block text-sm font-bold text-gray-700 mb-2">Model Adı</label>
               <input v-model="modelName" type="text" class="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Modern Ahşap Sandalye">
            </div>
         </div>

         <div class="lg:col-span-5 space-y-4">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Gerekli Dosyalar</h3>
            
            <div class="relative rounded-2xl p-4 transition-all duration-300 border" :class="tempData.glb ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'" @click="!tempData.glb ? triggerFileSelect('glb') : null" @drop.prevent="(e) => !tempData?.glb && handleDrop(e, 'glb')" @dragover.prevent>
               <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors" :class="tempData.glb ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'">
                     <span class="font-black text-xs">GLB</span>
                  </div>
                  <div class="flex-1 min-w-0">
                     <div v-if="tempData.glb">
                        <p class="text-sm font-bold text-gray-900 truncate">{{ tempData.glb.filename }}</p>
                        <p class="text-xs text-green-600 flex items-center mt-0.5">Yüklendi ({{ formatBytes(tempData.glb.size) }})</p>
                     </div>
                     <div v-else>
                        <p class="text-sm font-bold text-gray-600">GLB Dosyası</p>
                        <p class="text-xs text-gray-400">Android ve Web için zorunlu</p>
                     </div>
                  </div>
               </div>
               <input ref="glbInput" type="file" class="hidden" accept=".glb,.gltf" @change="(e) => onFileChange(e, 'glb')" />
            </div>

            <div class="relative rounded-2xl p-4 transition-all duration-300 border" :class="tempData.usdz ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer'" @click="!tempData.usdz ? triggerFileSelect('usdz') : null" @drop.prevent="(e) => !tempData?.usdz && handleDrop(e, 'usdz')" @dragover.prevent>
               <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors" :class="tempData.usdz ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'">
                     <span class="font-black text-xs">USDZ</span>
                  </div>
                  <div class="flex-1 min-w-0">
                     <div v-if="tempData.usdz">
                        <p class="text-sm font-bold text-gray-900 truncate">{{ tempData.usdz.filename }}</p>
                        <p class="text-xs text-green-600 flex items-center mt-0.5">Yüklendi ({{ formatBytes(tempData.usdz.size) }})</p>
                     </div>
                     <div v-else>
                        <p class="text-sm font-bold text-gray-600">USDZ Dosyası</p>
                        <p class="text-xs text-gray-400">iOS (iPhone/iPad) için zorunlu</p>
                     </div>
                  </div>
               </div>
               <input ref="usdzInput" type="file" class="hidden" accept=".usdz" @change="(e) => onFileChange(e, 'usdz')" />
            </div>

            <div v-if="!isReadyToFinalize" class="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start">
               <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
              <p class="text-xs text-amber-800 font-medium">Modeli yayınlayabilmek için hem GLB hem de USDZ dosyasının eksiksiz yüklenmesi gerekmektedir. FBX/STEP yüklediyseniz dönüşüm tamamlandığında aşağıda görünecek.</p>
            </div>

            <hr class="border-gray-200 my-4" />

            <!-- [YENİ] Katalog Alanları (Opsiyonel) -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <h3 class="text-sm font-bold text-gray-800 mb-3">Katalog</h3>
              <p class="text-[11px] text-gray-500 mb-3">İsteğe bağlı olarak bu modeli bir kategori ve seriye bağlayabilirsiniz.</p>
              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Kategori (Opsiyonel)</label>
                  <select v-model="selectedCategoryId" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option :value="null">Seçili değil</option>
                    <option v-for="c in categoriesList" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Seri (Opsiyonel)</label>
                  <select v-model="selectedSeriesId" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option :value="null">Seçili değil</option>
                    <option v-for="s in seriesList" :key="s.id" :value="s.id">{{ s.name }}<span v-if="s.code"> ({{ s.code }})</span></option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3">
               <button @click="finalizeUpload" :disabled="!isReadyToFinalize || finalizing" class="w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed" :class="isReadyToFinalize ? 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900' : 'bg-gray-300'">
                  <svg v-if="finalizing" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                     <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span v-else>Kaydet ve Yayınla</span>
               </button>
               <button @click="cancelProcess" :disabled="finalizing" class="w-full py-3 px-6 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">Vazgeç ve Sil</button>
            </div>
         </div>
      </div>

      <div v-if="error"
        class="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3 animate-pulse">
        <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium text-sm">{{ error }}</span>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import ArPreview from "../components/ArPreview.vue";
import type { TempModelResponse } from "../dto/arModel.dto";
import type { CompanyDto } from "../../companies/dto/company.dto"; // Company DTO
import { arModelService } from "../../../services/arModelService";
import { companyService } from "../../../services/companyService";
import { useAuthStore } from "../../../store/modules/auth"; // Auth Store
import { categoryService, type CategoryDto } from "../../../services/categoryService";
import { seriesService, type SeriesDto } from "../../../services/seriesService";
import { ChunkUploader } from "../../../utils/ChunkUploader";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

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
const queueStatus = ref<{ status?: string; progress?: number; message?: string } | null>(null);
let statusTimer: number | null = null;

// [YENİ] Chunked Upload State
let currentUploader: ChunkUploader | null = null;
const uploadStatus = ref<'idle' | 'preparing' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled'>('idle');
const uploadedChunks = ref(0);
const totalChunks = ref(0);
const currentUploadId = ref<string | null>(null);

// ChunkUploader state değişikliklerini izle ve uploadStatus'u senkronize et
watch(() => currentUploader?.state.value.status, (newStatus) => {
  if (newStatus) {
    uploadStatus.value = newStatus;
  }
}, { deep: true });

// [YENİ] Şirket Seçimi İçin State
const companiesList = ref<CompanyDto[]>([]);
const selectedCompanyId = ref<number | null>(null);

// [YENİ] Katalog Seçimleri (Opsiyonel)
const categoriesList = ref<CategoryDto[]>([]);
const seriesList = ref<SeriesDto[]>([]);
const selectedCategoryId = ref<number | null>(null);
const selectedSeriesId = ref<number | null>(null);

// --- Multi-tenant (SaaS) ID Yönetimi ---
const targetCompanyId = computed(() => route.query.companyId ? Number(route.query.companyId) : undefined);
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');

// [YENİ] Şirket Listesini Çek
onMounted(async () => {
  if (isSuperAdmin.value && !targetCompanyId.value) {
    try {
      companiesList.value = await companyService.getAllCompanies();
    } catch (err) {
      console.error("Şirket listesi yüklenemedi", err);
      toast.error("Şirket listesi yüklenirken hata oluştu.");
    }
  }

  // Varsayılan şirket bağlamına göre kategori/seri listelerini yükle
  await loadCatalogLists();

  // [YENİ] Eğer URL'de tempId varsa, kuyruğu takip ederek ekrana getir
  const qTempId = route.query.tempId as string | undefined;
  if (qTempId) {
    tempData.value = { tempId: qTempId } as any;
    startStatusPolling();
  }
});

// --- Computed ---
const previewUrl = computed(() => {
  if (!tempData.value) return '';
  if (tempData.value.glb?.url) return arModelService.getPreviewUrl(tempData.value.glb.url);
  if (tempData.value.previewUrl) return arModelService.getPreviewUrl(tempData.value.previewUrl);
  return '';
});

const isReadyToFinalize = computed(() => {
  return tempData.value && tempData.value.glb && tempData.value.usdz;
});

// Aktif şirket bağlamını hesapla (Super Admin seçim → route companyId → kullanıcının şirketi)
const activeCompanyContext = computed<number | undefined>(() => {
  return selectedCompanyId.value || targetCompanyId.value || authStore.user?.companyId || undefined;
});

// Katalog listelerini şirket değişince güncelle
const loadCatalogLists = async () => {
  try {
    const ctx = activeCompanyContext.value;
    categoriesList.value = await categoryService.list(ctx);
    seriesList.value = await seriesService.list(ctx);
  } catch (err) {
    console.warn('Kategori/seri listeleri yüklenemedi', err);
  }
};

// Şirket seçimi değişince katalog listelerini yenile
watch(() => activeCompanyContext.value, async () => {
  await loadCatalogLists();
});

// --- Helper Functions ---
const formatBytes = (bytes: number) => {
  if (!+bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

const dataURLtoBlob = (dataurl: string): Blob => {
  const [header, base64Data] = dataurl.split(',');
  if (!header || !base64Data) throw new Error('Geçersiz DataURL');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(base64Data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
};

// --- Actions ---
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

const processUpload = async (file: File, _type: 'auto' | 'glb' | 'usdz') => {
  // [YENİ] Validasyon: Eğer Super Admin ise ve şirket seçmediyse işlem yapma
  if (isSuperAdmin.value && !targetCompanyId.value && !selectedCompanyId.value) {
    toast.warning("Lütfen önce yükleme yapılacak şirketi seçiniz.");
    return;
  }

  error.value = null;
  uploading.value = true;
  progress.value = 0;
  uploadedChunks.value = 0;
  totalChunks.value = 0;

  if (!modelName.value) {
    modelName.value = file.name.replace(/\.[^/.]+$/, "");
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const currentTempId = tempData.value?.tempId;

    // Dosya tipi belirleme
    let fileType: 'glb' | 'usdz' | 'fbx' | 'step' = 'glb';
    if (ext === 'fbx') fileType = 'fbx';
    else if (ext === 'step' || ext === 'stp') fileType = 'step';
    else if (ext === 'usdz') fileType = 'usdz';
    else if (ext === 'glb' || ext === 'gltf') fileType = 'glb';
    else {
      throw new Error("Desteklenmeyen dosya formatı.");
    }

    // Chunk uploader oluştur
    currentUploader = new ChunkUploader({
      file,
      fileType,
      chunkSize: 5 * 1024 * 1024, // 5MB
      tempId: currentTempId,
      companyId: activeCompanyContext.value,
      onProgress: (p) => {
        progress.value = Math.round(p);
      },
      onChunkComplete: (chunkIndex, total) => {
        uploadedChunks.value = chunkIndex + 1;
        totalChunks.value = total;
        uploadStatus.value = 'uploading'; // Chunk yüklenirken status güncelle
      },
      onComplete: async (result) => {
        uploading.value = false;
        uploadStatus.value = 'completed';
        
        // Sonucu işle
        if (result.tempId) {
          if (fileType === 'fbx' || fileType === 'step') {
            tempData.value = result;
            startStatusPolling();
          } else if (fileType === 'glb') {
            tempData.value = {
              ...tempData.value!,
              tempId: result.tempId || tempData.value?.tempId,
              previewUrl: result.previewUrl,
              glb: {
                filename: result.filename,
                url: result.previewUrl,
                size: result.size,
                path: result.path
              }
            };
          } else if (fileType === 'usdz') {
            tempData.value = {
              ...tempData.value!,
              tempId: result.tempId || tempData.value?.tempId,
              usdz: {
                filename: result.filename,
                url: result.previewUrl,
                size: result.size,
                path: result.path
              }
            };
          }
          toast.success('Dosya başarıyla yüklendi!');
        }
      },
      onError: (err) => {
        uploading.value = false;
        uploadStatus.value = 'error';
        error.value = err.message;
        toast.error(err.message);
      }
    });

    // Upload'u başlat
    uploadStatus.value = 'preparing';
    totalChunks.value = currentUploader.state.value.totalChunks;
    currentUploadId.value = null;
    
    await currentUploader.start();
    
    // Start tamamlandığında status'u güncelle
    uploadStatus.value = currentUploader.state.value.status;

  } catch (err: any) {
    console.error(err);
    const msg = err.response?.data?.message || err.message || "Yükleme hatası";
    error.value = msg;
    uploading.value = false;
    uploadStatus.value = 'error';
    try { toast.error(msg); } catch (_) {}
  } finally {
    if (mainInput.value) mainInput.value.value = "";
    if (glbInput.value) glbInput.value.value = "";
    if (usdzInput.value) usdzInput.value.value = "";
  }
};

const pauseUpload = () => {
  if (currentUploader) {
    currentUploader.pause();
    uploadStatus.value = 'paused';
    currentUploadId.value = currentUploader.state.value.uploadId;
    toast.info('Upload duraklatıldı. İstediğiniz zaman devam ettirebilirsiniz.');
  }
};

const resumeUpload = async () => {
  if (currentUploader && currentUploadId.value) {
    try {
      uploadStatus.value = 'preparing';
      uploading.value = true;
      await currentUploader.resume(currentUploadId.value);
    } catch (err: any) {
      error.value = err.message;
      toast.error('Devam ettirme hatası: ' + err.message);
    }
  }
};

const cancelUpload = async () => {
  if (currentUploader && confirm('Upload iptal edilecek, emin misiniz?')) {
    await currentUploader.cancel();
    uploading.value = false;
    uploadStatus.value = 'cancelled';
    currentUploadId.value = null;
    progress.value = 0;
    uploadedChunks.value = 0;
    toast.warning('Upload iptal edildi.');
  }
};

const startStatusPolling = () => {
  stopStatusPolling();
  if (!tempData.value?.tempId) return;
  queueStatus.value = { status: 'QUEUED', progress: 0 };
  const tempId = tempData.value.tempId;
  const tick = async () => {
    try {
      const s = await arModelService.getUploadStatus(tempId);
      queueStatus.value = { status: s.status, progress: s.progress, message: s.message };
      // when converted, fill glb/usdz and stop
      if (s.status === 'CONVERTED') {
        tempData.value = {
          ...tempData.value!,
          tempId: s.tempId,
          glb: s.glb ? { filename: s.glb.filename, url: s.glb.url, path: s.glb.url, size: (s as any).glb?.size || 0 } : tempData.value?.glb,
          usdz: s.usdz ? { filename: s.usdz.filename, url: s.usdz.url, path: s.usdz.url, size: (s as any).usdz?.size || 0 } : tempData.value?.usdz,
        };
        stopStatusPolling();
        toast.success('Dönüştürme tamamlandı. Lütfen onaylayın.');
      } else if (s.status === 'ERROR') {
        stopStatusPolling();
        error.value = s.message || 'Dönüştürme sırasında hata oluştu.';
        toast.error(error.value);
      }
    } catch (e) {
      // silently continue; possibly backend not ready
    }
  };
  statusTimer = window.setInterval(tick, 3000);
  tick();
};

const stopStatusPolling = () => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
};

onBeforeUnmount(() => stopStatusPolling());

const finalizeUpload = async () => {
  if (!isReadyToFinalize.value || !tempData.value?.tempId) return;

  // [YENİ] Final Validasyon
  const finalCompanyId = targetCompanyId.value || selectedCompanyId.value || undefined;
  
  if (isSuperAdmin.value && !finalCompanyId) {
    toast.warning("Lütfen bir şirket seçiniz.");
    return;
  }

  finalizing.value = true;
  error.value = null;

  try {
    const screenshotBase64 = previewRef.value?.takeScreenshot();
    let thumbnailBlob: Blob | undefined;
    if (screenshotBase64) thumbnailBlob = dataURLtoBlob(screenshotBase64);

    await arModelService.finalizeModel({
      tempId: tempData.value.tempId,
      companyId: finalCompanyId, // [YENİ] Seçilen ID'yi gönder
      modelName: modelName.value,
      thumbnail: thumbnailBlob,
      // [YENİ] Opsiyonel katalog alanları
      categoryId: selectedCategoryId.value === null ? undefined : selectedCategoryId.value || undefined,
      seriesId: selectedSeriesId.value === null ? undefined : selectedSeriesId.value || undefined,
    });

    toast.success("Model ve thumbnail başarıyla yayınlandı!");
    
    setTimeout(() => {
        if (finalCompanyId) {
            // Şirketin model listesine git
            router.push(`/dashboard/companies/${finalCompanyId}/models`);
        } else {
            // Kendi model listene git
            router.push('/dashboard/ar-model');
        }
    }, 1000);

  } catch (err: any) {
    console.error(err);
    const msg = err.response?.data?.message || "Kaydetme başarısız.";
    error.value = msg;
    try { toast.error(msg); } catch (_) {}
    finalizing.value = false;
  }
};

const cancelProcess = () => {
    if(confirm("Yükleme iptal edilecek, emin misiniz?")) {
        tempData.value = null;
        progress.value = 0;
        modelName.value = "";
        error.value = null;
        uploading.value = false;
        router.back();
    }
};
</script>