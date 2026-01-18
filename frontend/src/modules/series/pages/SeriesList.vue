<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Seriler</h1>
        <p class="text-xs text-slate-500">Ürün serilerini yönetin</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="search" type="text" placeholder="Ara..." class="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white w-48" />
        <button @click="openCreate" class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold">Yeni Seri</button>
      </div>
    </div>

    <!-- Super Admin company filter -->
    <div v-if="isSuperAdmin" class="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div class="flex items-center gap-2 text-slate-500 min-w-max">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M4 8h16M5 12h14M6 16h12" />
        </svg>
        <span class="text-sm font-bold">Şirket Filtrele:</span>
      </div>
      <select v-model="selectedFilterCompanyId" @change="refetch" class="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm">
        <option :value="null">Tüm Şirketler</option>
        <option v-for="c in companiesList" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button v-if="selectedFilterCompanyId" @click="clearFilter" class="text-xs text-red-600 font-bold hover:underline">Temizle</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="s in filtered" :key="s.id" class="p-4 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all flex justify-between items-start">
        <div class="space-y-1">
          <div class="font-bold text-slate-800">{{ s.name }}</div>
          <div class="text-[11px] text-slate-500">Kod: {{ s.code || '—' }} · #{{ s.id }}</div>
          <div v-if="s.description" class="text-[11px] text-slate-400">{{ s.description }}</div>
        </div>
        <div class="flex gap-2">
          <button @click="edit(s)" class="px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50">Düzenle</button>
          <button @click="remove(s.id)" class="px-3 py-1.5 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Sil</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white p-5 rounded-2xl w-full max-w-md space-y-4 border border-slate-200 shadow-xl">
        <div class="font-bold text-slate-800">{{ editing ? 'Seriyi Güncelle' : 'Yeni Seri' }}</div>
        <div class="space-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">Ad</label>
            <input v-model="form.name" placeholder="Örn: Premium" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">Kod</label>
            <input v-model="form.code" placeholder="Opsiyonel" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase">Açıklama</label>
            <input v-model="form.description" placeholder="Opsiyonel" class="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="close" class="px-3 py-2 rounded-lg border">İptal</button>
          <button @click="save" class="px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold">Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue';
import { seriesStore } from '../../../store/modules/series';
import { useAuthStore } from '../../../store/modules/auth';
import { companyService } from '../../../services/companyService';
import type { CompanyDto } from '../../companies/dto/company.dto';

const auth = useAuthStore();
const series = seriesStore;
const isSuperAdmin = computed(() => auth.user?.role === 'SUPER_ADMIN');
const companiesList = ref<CompanyDto[]>([]);
const selectedFilterCompanyId = ref<number | null>(null);
const showModal = ref(false);
const editing = ref(false);
const editId = ref<number | null>(null);
const search = ref('');

const form = reactive({ name: '', code: '', description: '' });

onMounted(async () => {
  if (isSuperAdmin.value) {
    try { companiesList.value = await companyService.getAllCompanies(); } catch (e) { /* ignore */ }
  }
  await refetch();
});

const refetch = async () => {
  const targetId = isSuperAdmin.value ? (selectedFilterCompanyId.value ?? undefined) : (auth.user?.companyId ?? undefined);
  await series.fetch(targetId);
};

const clearFilter = async () => { selectedFilterCompanyId.value = null; await refetch(); };

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return series.items;
  return series.items.filter((s: any) => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
});

function openCreate() { editing.value = false; editId.value = null; form.name = ''; form.code = ''; form.description = ''; showModal.value = true; }
function edit(s: any) { editing.value = true; editId.value = s.id; form.name = s.name; form.code = s.code || ''; form.description = s.description || ''; showModal.value = true; }
function close() { showModal.value = false; }

async function save() {
  if (!editing.value) {
    const payload: any = { name: form.name, code: form.code || undefined, description: form.description || undefined };
    if (isSuperAdmin.value && selectedFilterCompanyId.value) payload.companyId = selectedFilterCompanyId.value;
    await series.create(payload);
  } else {
    await series.update(editId.value!, { name: form.name, code: form.code || undefined, description: form.description || undefined });
  }
  showModal.value = false;
}

async function remove(id: number) { await series.remove(id); }
</script>
