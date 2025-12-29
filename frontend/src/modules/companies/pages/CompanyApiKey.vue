<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-4xl mx-auto">

      <div class="space-y-6">

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6">
            <h3 class="text-base font-bold text-slate-800 mb-1">Gizli API Anahtarı</h3>
            <p class="text-sm text-slate-500 mb-4">Bu anahtarı backend servislerinizde WebAR API'ye erişmek için
              kullanın. Lütfen bu anahtarı frontend kodunuzda açıkça paylaşmayın.</p>

            <div class="relative group">
              <input :type="showKey ? 'text' : 'password'" :value="company.apiKey" readonly
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
            <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto">
              <code
                class="text-xs font-mono text-green-400">Authorization: Bearer <span class="text-white">{{ company.apiKey ? company.apiKey.substring(0, 10) + '...' : '••••••••' }}</span></code>
            </div>
          </div>
        </div>

        <div class="border border-red-200 rounded-2xl p-6 bg-red-50/50">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-red-700">Anahtarı Yenile</h3>
              <p class="text-sm text-red-600/80 mt-1 max-w-xl">
                API anahtarını yenilediğinizde, eski anahtarı kullanan tüm uygulamaların erişimi anında kesilecektir.
              </p>
            </div>
            <button @click="confirmRegenerate"
              class="shrink-0 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
              Anahtarı Yenile
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... Mevcut script kodunuz ...
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import type { CompanyDto } from '../dto/company.dto';
import { companyService } from '../../../services/companyService';

const route = useRoute();
const toast = useToast();
const companyId = Number(route.params.id);

const company = ref<CompanyDto>({ id: 0, name: '', domain: '', apiKey: '', users: [] });
const showKey = ref(false);
const copied = ref(false);
const loading = ref(true);

async function loadCompany() {
  try {
    loading.value = true;
    company.value = await companyService.getCompanyById(companyId);
  } catch (error) {
    toast.error("Şirket bilgileri yüklenemedi.");
  } finally {
    loading.value = false;
  }
}

async function copyToClipboard() {
  if (!company.value.apiKey) return;
  try {
    await navigator.clipboard.writeText(company.value.apiKey);
    copied.value = true;
    toast.info("API Anahtarı kopyalandı");
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    toast.error("Kopyalama başarısız oldu");
  }
}

async function confirmRegenerate() {
  if (!confirm("DİKKAT: API anahtarını yenilemek mevcut tüm entegrasyonları bozacaktır. Devam etmek istiyor musunuz?")) return;
  try {
    const res = await companyService.regenerateApiKey(companyId);
    company.value.apiKey = res.apiKey;
    toast.success('API Key başarıyla yenilendi.');
    showKey.value = true;
  } catch (error) {
    toast.error("Yenileme işlemi başarısız oldu.");
  }
}

onMounted(loadCompany);
</script>