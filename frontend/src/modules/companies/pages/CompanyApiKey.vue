<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-4xl mx-auto">

      <div v-if="loading" class="animate-pulse space-y-6">
        <div class="h-32 bg-slate-200 rounded-2xl"></div>
        <div class="h-24 bg-slate-200 rounded-2xl"></div>
      </div>

      <div v-else class="space-y-6">

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-base font-bold text-slate-800">Gizli API Anahtarı</h3>
              <span v-if="isSuperAdmin && targetCompanyId"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">ADMIN MODU</span>
            </div>

            <p class="text-sm text-slate-500 mb-4">
              Bu anahtarı backend servislerinizde WebAR API'ye erişmek için kullanın.
              <span class="font-bold text-red-500">Bu anahtarı frontend (istemci) tarafında asla paylaşmayın.</span>
            </p>

            <div class="relative group">
              <input :type="showKey ? 'text' : 'password'" :value="apiKey" readonly
                class="w-full bg-slate-50 border border-slate-300 text-slate-600 text-sm font-mono rounded-xl p-4 pr-32 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all cursor-text" />

              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button @click="showKey = !showKey"
                  class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  :title="showKey ? 'Gizle' : 'Göster'">
                  <svg v-if="!showKey" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M5.333 5.333A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.574 2.59M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                  </svg>
                </button>

                <button @click="copyToClipboard"
                  class="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition-colors relative"
                  title="Kopyala">
                  <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 border-t border-slate-200 p-4 px-6">
            <p class="text-xs font-bold text-slate-500 uppercase mb-2">Örnek Kullanım (Header)</p>
            <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto group relative">
              <code class="text-xs font-mono text-green-400">
                Authorization: Bearer <span class="text-white">{{ apiKey ? apiKey.substring(0, 10) + '...' : '••••••••' }}</span>
              </code>
            </div>
          </div>
        </div>

        <div class="border border-red-200 rounded-2xl p-6 bg-red-50/50">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-red-700">Anahtarı Yenile</h3>
              <p class="text-sm text-red-600/80 mt-1 max-w-xl">
                API anahtarını yenilediğinizde, eski anahtarı kullanan tüm uygulamaların (mobil app, web sitesi vb.)
                erişimi anında kesilecektir.
              </p>
            </div>
            <button @click="confirmRegenerate"
              class="shrink-0 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Anahtarı Yenile
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../../../store/modules/auth';
import { companyService } from '../../../services/companyService';

const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

// STATE
const loading = ref(true);
const apiKey = ref('');
const showKey = ref(false);
const copied = ref(false);

// Eğer route'da ID varsa, Super Admin bir şirketi görüntülüyordur.
// Yoksa, kullanıcı kendi şirketini görüntülüyordur.
const targetCompanyId = computed(() => route.params.id ? Number(route.params.id) : null);
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');

// 1. VERİ YÜKLEME
async function loadApiKey() {
  loading.value = true;
  try {
    let companyData;

    if (isSuperAdmin.value && targetCompanyId.value) {
      // SENARYO 1: Super Admin -> Belirli Bir Şirket
      companyData = await companyService.getCompanyById(targetCompanyId.value);
    } else {
      // SENARYO 2: Company Admin -> Kendi Şirketi
      companyData = await companyService.getMyCompany();
    }

    apiKey.value = companyData.apiKey || '';

  } catch (error) {
    console.error(error);
    toast.error("API bilgileri yüklenemedi.");
  } finally {
    loading.value = false;
  }
}

// 2. KOPYALAMA
async function copyToClipboard() {
  if (!apiKey.value) return;
  try {
    await navigator.clipboard.writeText(apiKey.value);
    copied.value = true;
    toast.info("API Anahtarı kopyalandı");
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    toast.error("Kopyalama başarısız oldu");
  }
}

// 3. YENİLEME (REGENERATE)
async function confirmRegenerate() {
  if (!confirm("DİKKAT: API anahtarını yenilemek mevcut tüm entegrasyonları bozacaktır. Devam etmek istiyor musunuz?")) return;

  try {
    let res;

    if (isSuperAdmin.value && targetCompanyId.value) {
      // Admin, başkasının anahtarını yeniliyor
      res = await companyService.regenerateCompanyApiKey(targetCompanyId.value);
    } else {
      // Kullanıcı kendi anahtarını yeniliyor
      res = await companyService.regenerateApiKey();
    }

    apiKey.value = res.apiKey;
    showKey.value = true; // Yenilenen anahtarı göster
    toast.success('API Key başarıyla yenilendi.');

  } catch (error) {
    console.error(error);
    toast.error("Yenileme işlemi başarısız oldu.");
  }
}

onMounted(loadApiKey);
</script>