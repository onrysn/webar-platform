<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-5xl mx-auto">

      <div v-if="loading" class="animate-pulse space-y-6">
        <div class="h-32 bg-slate-200 rounded-2xl"></div>
        <div class="h-24 bg-slate-200 rounded-2xl"></div>
      </div>

      <div v-else class="space-y-6">

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-800">{{ t('companies.apiKey.title') }}</h3>
              <span v-if="isSuperAdmin && targetCompanyId"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">{{ t('common.adminMode') }}</span>
            </div>
            <button @click="createKey" :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {{ t('companies.apiKey.createNew') }}
            </button>
          </div>

          <div class="px-6 pb-4 text-xs text-slate-500">{{ t('companies.apiKey.maxKeys') }}: {{ maxApiKeysDisplay }}</div>

          <div class="p-6 pt-0">
            <div v-if="keys.length === 0" class="text-sm text-slate-500">{{ t('companies.apiKey.noKeys') }}</div>

            <div v-else class="space-y-3">
              <div v-for="k in keys" :key="k.id" class="border border-slate-200 rounded-xl p-4">
                <div class="flex flex-wrap items-center gap-3 justify-between">
                  <div class="flex-1 min-w-[240px]">
                    <input v-model="k.name" class="w-full px-3 py-2 border rounded-lg text-sm" />
                    <div class="mt-1 text-xs text-slate-500 font-mono">{{ k.key.substring(0, 16) + '...' }}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="text-xs font-bold text-slate-600">{{ t('common.active') }}</label>
                    <button @click="toggleActive(k)" :class="k.isActive ? 'bg-green-600' : 'bg-slate-300'"
                      class="relative inline-flex h-6 w-11 rounded-full transition-colors">
                      <span :class="k.isActive ? 'translate-x-5' : 'translate-x-0'"
                        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition" />
                    </button>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="copy(k.key)" class="px-2 py-1 text-xs bg-slate-100 border rounded">{{ t('companies.apiKey.copy') }}</button>
                    <button @click="save(k)" class="px-3 py-1 text-xs bg-indigo-600 text-white rounded">{{ t('common.save') }}</button>
                    <button @click="remove(k)" class="px-3 py-1 text-xs bg-red-600 text-white rounded">{{ t('common.delete') }}</button>
                  </div>
                </div>
              </div>
            </div>
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
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../../store/modules/auth';
import { companyService } from '../../../services/companyService';
import type { ApiKeyDto, CompanyDto } from '../dto/company.dto';

const route = useRoute();
const toast = useToast();
const { t } = useI18n();
const authStore = useAuthStore();

// STATE
const loading = ref(true);
const keys = ref<ApiKeyDto[]>([]);
const maxApiKeys = ref<number | null>(null);
const targetCompanyId = computed(() => route.params.id ? Number(route.params.id) : null);
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');

const canCreate = computed(() => {
  if (maxApiKeys.value == null) return true;
  return keys.value.length < maxApiKeys.value;
});
const maxApiKeysDisplay = computed(() => maxApiKeys.value ?? t('companies.apiKey.unlimited'));

async function load() {
  loading.value = true;
  try {
    let company: CompanyDto;
    if (isSuperAdmin.value && targetCompanyId.value) {
      company = await companyService.getCompanyById(targetCompanyId.value);
      maxApiKeys.value = company.maxApiKeys ?? null;
      keys.value = await companyService.listCompanyApiKeys(targetCompanyId.value);
    } else {
      company = await companyService.getMyCompany();
      maxApiKeys.value = company.maxApiKeys ?? null;
      keys.value = await companyService.listMyApiKeys();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'API anahtarları yüklenemedi.');
  } finally {
    loading.value = false;
  }
}

async function createKey() {
  try {
    if (!canCreate.value) return;
    const body = { name: 'API Key' } as Partial<ApiKeyDto>;
    const created = isSuperAdmin.value && targetCompanyId.value
      ? await companyService.createCompanyApiKey(targetCompanyId.value, body)
      : await companyService.createMyApiKey(body);
    keys.value.unshift(created);
    toast.success('API anahtarı oluşturuldu.');
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Anahtar oluşturulamadı.');
  }
}

async function save(k: ApiKeyDto) {
  try {
    const body = { name: k.name, isActive: k.isActive } as Partial<ApiKeyDto>;
    const updated = isSuperAdmin.value && targetCompanyId.value
      ? await companyService.updateApiKey(k.id, body)
      : await companyService.updateMyApiKey(k.id, body);
    Object.assign(k, updated);
    toast.success('Anahtar güncellendi.');
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Güncelleme başarısız oldu.');
  }
}

function toggleActive(k: ApiKeyDto) {
  k.isActive = !k.isActive;
}

async function remove(k: ApiKeyDto) {
  if (!confirm('Bu API anahtarını silmek istiyor musunuz?')) return;
  try {
    if (isSuperAdmin.value && targetCompanyId.value) {
      await companyService.deleteApiKey(k.id);
    } else {
      await companyService.deleteMyApiKey(k.id);
    }
    keys.value = keys.value.filter(x => x.id !== k.id);
    toast.success('Anahtar silindi.');
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Silme başarısız oldu.');
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.info('Kopyalandı');
  } catch {
    toast.error('Kopyalama başarısız');
  }
}

onMounted(load);
</script>