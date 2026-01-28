<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-3xl mx-auto">

      <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-12 bg-slate-200 rounded-xl w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-1/4"></div>
        <div class="h-12 bg-slate-200 rounded-xl w-full"></div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div class="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>

        <form @submit.prevent="handleUpdate" class="p-8 space-y-6">

          <div>
            <h2 class="text-lg font-bold text-slate-900">Temel Bilgiler</h2>
            <div class="flex items-center gap-2 mb-6">
              <p class="text-sm text-slate-500">Şirketinizin görünen adı ve domain ayarlarını buradan
                güncelleyebilirsiniz.</p>

              <span v-if="isSuperAdmin && targetCompanyId"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                ADMIN MODU
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Şirket Adı</label>
            <div class="relative">
              <input v-model="form.name" type="text"
                class="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="Şirket ismini giriniz" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Alan Adı (Domain)</label>
            <div class="flex rounded-xl shadow-sm">
              <span
                class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-sm font-mono">
                https://
              </span>
              <input v-model="form.domain" type="text" @blur="sanitizeDomain"
                class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="sirketiniz.com" />
            </div>
            <p class="text-xs text-slate-400 mt-2">CORS ve güvenlik ayarları için kullanılır (Opsiyonel).</p>
          </div>

          <div>
            <label for="logo" class="block text-sm font-bold text-slate-700 mb-2">Şirket Logosu</label>
            <div class="flex items-start gap-4">
              <div v-if="logoPreview || company?.logoUrl" class="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                <img :src="logoPreview || company?.logoUrl || ''" alt="Logo" class="w-full h-full object-contain" />
                <button v-if="logoPreview" type="button" @click="clearLogo"
                  class="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="flex-1">
                <input type="file" id="logo" @change="handleLogoChange" accept="image/*"
                  class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                <p class="text-xs text-slate-400 mt-1">PNG, JPG, GIF, WebP veya SVG (Maks. 5MB)</p>
              </div>
            </div>
          </div>

          <div v-if="isSuperAdmin" class="mt-8 pt-8 border-t border-slate-200 bg-slate-50/50 -mx-8 px-8 pb-4">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              Abonelik ve Erişim Yönetimi
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label class="text-sm font-bold text-slate-700 block">Şirket Durumu</label>
                  <span class="text-xs" :class="form.isActive ? 'text-green-600' : 'text-red-500'">
                    {{ form.isActive ? 'Aktif (Erişilebilir)' : 'Pasif (Erişim Kısıtlı)' }}
                  </span>
                </div>

                <button type="button" @click="form.isActive = !form.isActive"
                  :class="form.isActive ? 'bg-indigo-600' : 'bg-slate-200'"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span aria-hidden="true" :class="form.isActive ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                  </span>
                </button>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Abonelik Bitiş Tarihi</label>
                <input type="date" v-model="form.subscriptionEndsAt"
                  class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" />
                <p class="text-xs text-slate-400 mt-1">Bu tarihten sonra erişim kısıtlanır.</p>
              </div>

            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Maksimum API Key Sayısı</label>
                <input type="number" min="0" v-model.number="form.maxApiKeys"
                  class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p class="text-xs text-slate-400 mt-1">Sınırsız için boş bırakın.</p>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Maksimum Depolama (MB)</label>
                <input type="number" min="0" v-model.number="form.maxStorage"
                  class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p class="text-xs text-slate-400 mt-1">Toplam GLB+USDZ şifreli boyut sınırı.</p>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Maksimum Sahne Sayısı</label>
                <input type="number" min="1" v-model.number="form.maxScenes"
                  class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p class="text-xs text-slate-400 mt-1">Şirketin oluşturabileceği maksimum sahne sayısı.</p>
              </div>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end border-t border-slate-100 mt-6">
            <button type="submit" :disabled="isSaving"
              class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../../store/modules/auth';
import { companyService } from '../../../services/companyService';
import type { CompanyDto } from '../dto/company.dto';

const toast = useToast();
const route = useRoute();
const authStore = useAuthStore();

// STATE
const loading = ref(true);
const isSaving = ref(false);
const company = ref<CompanyDto | null>(null);
const logoFile = ref<File | null>(null);
const logoPreview = ref<string | null>(null);

// Form başlangıç değerleri
const form = reactive({
  name: '',
  domain: '',
  isActive: true,
  subscriptionEndsAt: '',
  maxApiKeys: null as number | null,
  maxStorage: null as number | null,
  maxScenes: null as number | null
});

// COMPUTED
const targetCompanyId = computed(() => route.params.id ? Number(route.params.id) : null);
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');

const handleLogoChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo dosyası 5MB\'dan küçük olmalıdır.');
      return;
    }
    
    logoFile.value = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const clearLogo = () => {
  logoFile.value = null;
  logoPreview.value = null;
  const input = document.getElementById('logo') as HTMLInputElement;
  if (input) input.value = '';
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 1. ŞİRKET BİLGİLERİNİ YÜKLE
async function loadCompany() {
  loading.value = true;
  try {
    let data;

    if (isSuperAdmin.value && targetCompanyId.value) {
      // Super Admin: ID ile getir
      data = await companyService.getCompanyById(targetCompanyId.value);
    } else {
      // Company Admin: Token ile getir
      data = await companyService.getMyCompany();
    }

    company.value = data;

    // Herkesin gördüğü alanlar
    form.name = data.name;
    form.domain = data.domain || '';

    if (isSuperAdmin.value) {
      form.isActive = data.isActive ?? true;
      if (data.subscriptionEndsAt) {
        form.subscriptionEndsAt = new Date(data.subscriptionEndsAt as string)
          .toISOString()
          .slice(0, 10);
      } else {
        form.subscriptionEndsAt = '';
      }
      form.maxApiKeys = data.maxApiKeys ?? null;
      form.maxStorage = data.maxStorage ?? null;
      form.maxScenes = data.maxScenes ?? null;
    }

  } catch (error) {
    console.error(error);
    toast.error("Şirket bilgileri alınamadı.");
  } finally {
    loading.value = false;
  }
}

// 2. GÜNCELLEME İŞLEMİ
async function handleUpdate() {
  if (isSaving.value) return;
  sanitizeDomain();

  isSaving.value = true;
  try {

    if (isSuperAdmin.value && targetCompanyId.value) {
      // --- SUPER ADMIN GÜNCELLEMESİ (TÜM ALANLAR) ---
      let logoBase64: string | undefined;

      if (logoFile.value) {
        logoBase64 = await fileToBase64(logoFile.value);
      }

      const payload: any = {
        name: form.name,
        domain: form.domain,
        isActive: form.isActive,
        subscriptionEndsAt: form.subscriptionEndsAt
          ? new Date(form.subscriptionEndsAt).toISOString()
          : null
      };

      if (logoBase64) {
        payload.logoBase64 = logoBase64;
      }

      await companyService.updateCompany(targetCompanyId.value, payload);

      // Limits update
      await companyService.updateCompanyLimits(targetCompanyId.value, {
        maxApiKeys: form.maxApiKeys,
        maxStorage: form.maxStorage,
        maxScenes: form.maxScenes
      });
    } else {
      // --- COMPANY ADMIN GÜNCELLEMESİ (KISITLI ALANLAR) ---
      let logoBase64: string | undefined;

      if (logoFile.value) {
        logoBase64 = await fileToBase64(logoFile.value);
      }

      const payload: any = {
        name: form.name,
        domain: form.domain
      };

      if (logoBase64) {
        payload.logoBase64 = logoBase64;
      }

      await companyService.updateMyCompany(payload);
    }

    toast.success('Şirket bilgileri başarıyla güncellendi!');
    
    // Logoyu yüklendi yse önizlemeyi temizle
    if (logoFile.value) {
      logoFile.value = null;
      logoPreview.value = null;
    }
    
    // Şirketi yeniden yükle
    await loadCompany();

  } catch (error: any) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Güncelleme sırasında hata oluştu.');
  } finally {
    isSaving.value = false;
  }
}

const sanitizeDomain = () => {
  if (!form.domain) return;
  form.domain = form.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
};

onMounted(loadCompany);
</script>