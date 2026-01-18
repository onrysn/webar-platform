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
        
        <div v-if="modelData" class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                :class="modelData.isPrivate ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'">
                {{ modelData.isPrivate ? '🔒 Gizli Model' : '🌍 Herkese Açık' }}
            </span>
            <div class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                ID: #{{ modelData.id }}
            </div>
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

            <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative">
                <div v-if="processing" class="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
                    <svg class="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>

                <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Model Yönetimi</h2>

                <div class="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div class="pr-2">
                        <div class="font-bold text-sm text-gray-800">Model Gizliliği</div>
                        <div v-if="modelData.isPrivate" class="text-xs text-gray-500 mt-1">Model gizli olarak ayarlandı.</div>
                        <div v-else class="text-xs text-gray-500 mt-1">Model herkese açık olarak ayarlandı.</div>
                    </div>
                    <button 
                        @click="togglePrivacy" 
                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        :class="modelData.isPrivate ? 'bg-slate-300' : 'bg-green-500'"
                    >
                        <span class="sr-only">Gizlilik Ayarı</span>
                        <span 
                            aria-hidden="true" 
                            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                            :class="modelData.isPrivate ? 'translate-x-0' : 'translate-x-5'"
                        ></span>
                    </button>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-3">
                        <div class="font-bold text-sm text-gray-800">Müşteri Paylaşımı</div>
                        <span v-if="modelData.shareToken" class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">AKTİF</span>
                    </div>

                    <div v-if="!modelData.shareToken" class="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100 border-dashed">
                        <p class="text-xs text-indigo-800 mb-3">Müşterileriniz için benzersiz bir görüntüleme linki oluşturun.</p>
                        <button @click="generateToken" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                            Link Oluştur
                        </button>
                    </div>

                    <div v-else class="space-y-3">
                        <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <input type="text" readonly :value="modelData.shareUrl" class="bg-transparent border-none text-xs text-gray-600 w-full focus:ring-0 truncate font-mono" />
                            <button @click="copyToClipboard" class="text-indigo-600 hover:text-indigo-800 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <a :href="modelData.shareUrl || '#'" target="_blank" class="text-indigo-600 hover:text-indigo-800 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                        <button @click="revokeToken" class="w-full text-center text-xs text-red-500 hover:text-red-700 hover:underline">
                            Linki İptal Et (Erişimi Kes)
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
              <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Katalog</h2>
              <p class="text-[11px] text-gray-500 mb-3">Bu modeli isteğe bağlı olarak kategori ve seriye bağlayın.</p>
              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Kategori</label>
                  <select v-model="editCategoryId" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <option :value="null">Seçili değil</option>
                    <option v-for="c in categoriesList" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Seri</label>
                  <select v-model="editSeriesId" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <option :value="null">Seçili değil</option>
                    <option v-for="s in seriesList" :key="s.id" :value="s.id">{{ s.name }}<span v-if="s.code"> ({{ s.code }})</span></option>
                  </select>
                </div>
              </div>
              <div class="mt-4 flex justify-end">
                <button @click="saveCatalog" :disabled="processing" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50">Kaydet</button>
              </div>
            </div>

          <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
            <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Dosya İndir</h2>

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
import { useToast } from 'vue-toastification'; // Toast kütüphanesini ekleyin (kurulu değilse alert kullanın)
import type { ModelDetailDto } from '../dto/arModel.dto'; // DTO dosyanızın yolu
import { arModelService } from '../../../services/arModelService'; // Service dosyanızın yolu
import ArPreview from "../components/ArPreview.vue";
import { categoryService, type CategoryDto } from '../../../services/categoryService';
import { seriesService, type SeriesDto } from '../../../services/seriesService';
import { useAuthStore } from '../../../store/modules/auth';

const route = useRoute();
const toast = useToast();
const modelId = Number(route.params.id);

// State
const isLoading = ref(true);
const isDownloading = ref(false);
const processing = ref(false); // Yönetim işlemleri için loading
const error = ref<string | null>(null);
const modelData = ref<ModelDetailDto | null>(null);
const previewBlobUrl = ref<string | null>(null);
const authStore = useAuthStore();

// [YENİ] Katalog düzenleme durumu
const categoriesList = ref<CategoryDto[]>([]);
const seriesList = ref<SeriesDto[]>([]);
const editCategoryId = ref<number | null>(null);
const editSeriesId = ref<number | null>(null);

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

    // 2. Önizleme
    await loadPreviewModel();

    // 3. Katalog listelerini yükle ve mevcut değerleri doldur
    await loadCatalogLists();
    editCategoryId.value = modelData.value?.category?.id ?? null;
    editSeriesId.value = modelData.value?.series?.id ?? null;

  } catch (err: any) {
    console.error('Model yükleme hatası:', err);
    error.value = err.response?.data?.message || 'Model detayları yüklenirken bir hata oluştu.';
  } finally {
    isLoading.value = false;
  }
};

const loadPreviewModel = async () => {
  try {
    const blob = await arModelService.getModelFileBlob(modelId, 'glb', 'view');
    previewBlobUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error("Önizleme dosyası alınamadı:", err);
  }
};

const downloadFile = async (format: 'glb' | 'usdz') => {
  if (!modelData.value) return;

  try {
    isDownloading.value = true;
    const blob = await arModelService.getModelFileBlob(modelId, format, 'download');
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fileName = `${modelData.value.fileName}.${format}`;
    link.setAttribute('download', fileName);
    
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("İndirme başladı.");
  } catch (err) {
    console.error("İndirme hatası:", err);
    toast.error('Dosya indirilemedi.');
  } finally {
    isDownloading.value = false;
  }
};

// --- YENİ YÖNETİM METODLARI ---

const togglePrivacy = async () => {
  if (!modelData.value || processing.value) return;

  const newState = !modelData.value.isPrivate;
  processing.value = true;

  try {
    const updated = await arModelService.updateModel(modelId, { isPrivate: newState });
    modelData.value.isPrivate = updated.isPrivate;
    
    if (updated.isPrivate) {
      toast.info("Model gizli duruma getirildi.");
    } else {
      toast.success("Model herkese açık yapıldı.");
    }
  } catch (error) {
    toast.error("Gizlilik ayarı değiştirilemedi.");
  } finally {
    processing.value = false;
  }
};

const generateToken = async () => {
  if (processing.value) return;
  processing.value = true;

  try {
    const res = await arModelService.generateShareToken(modelId);
    if (modelData.value) {
      modelData.value.shareToken = res.shareToken;
      modelData.value.shareUrl = res.url;
    }
    toast.success("Link oluşturuldu!");
  } catch (error) {
    toast.error("Link oluşturulamadı.");
  } finally {
    processing.value = false;
  }
};

const revokeToken = async () => {
  if (!confirm("Bu linki iptal etmek istediğinize emin misiniz? Müşterileriniz erişimi kaybedecek.") || processing.value) return;

  processing.value = true;
  try {
    await arModelService.revokeShareToken(modelId);
    if (modelData.value) {
      modelData.value.shareToken = null;
      modelData.value.shareUrl = null;
    }
    toast.info("Link iptal edildi.");
  } catch (error) {
    toast.error("İşlem başarısız.");
  } finally {
    processing.value = false;
  }
};

const copyToClipboard = () => {
  if (!modelData.value?.shareUrl) return;
  navigator.clipboard.writeText(modelData.value.shareUrl).then(() => {
    toast.success("Link kopyalandı!");
  });
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

const getThumbnailUrl = (path: string) => {
  return arModelService.getPreviewUrl(path);
};

// [YENİ] Katalog listelerini yükle
const loadCatalogLists = async () => {
  try {
    // Şirket bağlamı: SUPER_ADMIN ise modelin companyId'sini kullan; değilse kullanıcının şirketi
    const companyCtx = authStore.user?.role === 'SUPER_ADMIN'
      ? (modelData.value?.companyId || undefined)
      : (authStore.user?.companyId || undefined);

    categoriesList.value = await categoryService.list(companyCtx);
    seriesList.value = await seriesService.list(companyCtx);
  } catch (err) {
    console.warn('Kategori/seri listeleri getirilemedi', err);
  }
};

// [YENİ] Katalog güncelle kaydet
const saveCatalog = async () => {
  if (!modelData.value || processing.value) return;
  processing.value = true;
  try {
    const updated = await arModelService.updateModel(modelId, {
      categoryId: editCategoryId.value,
      seriesId: editSeriesId.value,
    });
    // UI'yi senkronize et
    modelData.value.category = updated.categoryId ? { id: updated.categoryId, name: categoriesList.value.find(c => c.id === updated.categoryId)?.name || '' } : null;
    modelData.value.series = updated.seriesId ? { id: updated.seriesId, name: seriesList.value.find(s => s.id === updated.seriesId)?.name || '', code: seriesList.value.find(s => s.id === updated.seriesId)?.code || null } : null;
    toast.success('Katalog bilgileri güncellendi.');
  } catch (err) {
    toast.error('Katalog bilgileri güncellenemedi.');
  } finally {
    processing.value = false;
  }
};
</script>