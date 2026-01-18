<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dönüştürme Kuyruğu</h1>
        <p class="text-sm text-gray-500">Bekleyen ve tamamlanan işlerin listesi.</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="statusFilter" class="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white">
          <option value="">Tümü</option>
          <option value="QUEUED">QUEUED</option>
          <option value="CONVERTING">CONVERTING</option>
          <option value="CONVERTED">CONVERTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ERROR">ERROR</option>
        </select>
        <button class="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50" @click="refresh">Yenile</button>
      </div>
    </div>

    <div v-if="isSuperAdmin" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-amber-900">Şirket bağlamı:</span>
        <select v-model.number="selectedCompanyId" class="px-3 py-2 text-sm rounded-xl border border-amber-300 bg-white">
          <option :value="null">Tümü</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="job in jobs" :key="job.tempId" class="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono text-gray-500 truncate">{{ job.tempId }}</span>
          <span :class="statusClass(job.status)" class="px-2 py-1 rounded text-[10px] font-semibold">{{ job.status === 'APPROVED' ? 'Onaylandı' : job.status }}</span>
        </div>
        <div class="text-sm font-semibold text-gray-900">{{ job.type }}</div>
        <div class="mt-2">
          <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div class="h-2 bg-blue-600 rounded-full transition-all" :style="{ width: Math.round(job.progress || 0) + '%' }"></div>
          </div>
          <div class="mt-1 text-[11px] text-gray-500">İlerleme: {{ Math.round(job.progress || 0) }}%</div>
        </div>
        <div class="mt-3 text-xs text-gray-600 truncate">
          {{ job.status === 'APPROVED' ? 'Onaylandı' : (job.message || '-') }}
        </div>
        <div class="mt-4 flex justify-end">
          <button 
            class="px-3 py-1.5 text-xs rounded-lg font-semibold"
            :class="job.status === 'APPROVED' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'"
            :disabled="job.status === 'APPROVED'"
            @click="openFinalize(job)">
            Aç
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../../store/modules/auth';
import { arModelService } from '../../../services/arModelService';
import type { UploadJobDto } from '../dto/arModel.dto';
import { companyService } from '../../../services/companyService';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const jobs = ref<UploadJobDto[]>([]);
const statusFilter = ref<string>('');
const companies = ref<{ id: number; name: string }[]>([]);
const selectedCompanyId = ref<number | null>(null);

const isSuperAdmin = computed(() => auth.user?.role === 'SUPER_ADMIN');
const companyContext = computed<number | undefined>(() => {
  return selectedCompanyId.value || (route.query.companyId ? Number(route.query.companyId) : undefined) || auth.user?.companyId || undefined;
});

const refresh = async () => {
  jobs.value = await arModelService.listUploadJobs(companyContext.value, statusFilter.value || undefined);
};

const statusClass = (status: string) => {
  switch (status) {
    case 'QUEUED': return 'bg-gray-100 text-gray-700';
    case 'CONVERTING': return 'bg-blue-100 text-blue-700';
    case 'CONVERTED': return 'bg-green-100 text-green-700';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
    case 'ERROR': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const openFinalize = (job: UploadJobDto) => {
  const params: any = { tempId: job.tempId };
  if (companyContext.value) params.companyId = companyContext.value;
  router.push({ name: 'UploadModel', query: params });
};

onMounted(async () => {
  if (isSuperAdmin.value) {
    try { companies.value = await companyService.getAllCompanies(); } catch {}
  }
  await refresh();
});

watch([statusFilter, companyContext], async () => {
  await refresh();
});
</script>
