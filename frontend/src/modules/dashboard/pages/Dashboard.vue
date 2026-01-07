<template>
  <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-800">

    <header
      class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 sticky top-0 z-20">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">Genel Bakış</h2>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="auth.user?.company"
          class="hidden md:flex px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
          <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider">{{ auth.user.company.name }}</span>
        </div>

        <div class="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <div
            class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-200">
            {{ userInitials }}
          </div>
          <span class="text-sm font-semibold text-slate-700 pr-2 truncate max-w-[100px]">
            {{ auth.user?.name || 'Kullanıcı' }}
          </span>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <router-link v-if="isSuperAdmin" to="/dashboard/companies"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Toplam Şirket</span>
            <div
              class="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div class="flex justify-between items-end mt-auto">
            <span class="text-3xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {{ loading ? '-' : stats.totalCompanies }}
            </span>
          </div>
        </router-link>

        <router-link to="/dashboard/ar-scene"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Aktif Sahneler</span>
            <div
              class="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div class="flex justify-between items-end mt-auto">
            <span class="text-3xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {{ loading ? '-' : stats.activeScenes }}
            </span>
            <span
              class="text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">Yayında</span>
          </div>
        </router-link>

        <router-link to="/dashboard/ar-model"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Model Depolama</span>
            <div
              class="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="flex justify-between items-end mt-auto">
            <span class="text-3xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {{ loading ? '-' : stats.storage.used }}
              <small class="text-lg text-slate-400 font-medium">{{ stats.storage.unit }}</small>
            </span>
            <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${stats.storage.percentage}%` }">
              </div>
            </div>
          </div>
        </router-link>

        <router-link :to="isSuperAdmin ? '/dashboard/users' : '/dashboard/my-team'"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">
              {{ isSuperAdmin ? 'Toplam Kullanıcı' : 'Ekibim' }}
            </span>
            <div
              class="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div class="flex justify-between items-end mt-auto">
            <span class="text-3xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {{ loading ? '-' : stats.totalUsers }}
            </span>
            <div class="flex -space-x-2">
              <div class="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
              <div class="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
              <div class="w-6 h-6 rounded-full bg-slate-400 border-2 border-white"></div>
            </div>
          </div>
        </router-link>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <div class="xl:col-span-1 space-y-6">

          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wide">Son 7 Günlük Görüntülenme</h3>
            <div class="flex justify-between h-32 gap-2">
              <div v-if="loading" class="w-full h-full flex items-center justify-center text-xs text-slate-400">
                Veri yükleniyor...
              </div>
              <div v-else v-for="day in chartData" :key="day.date"
                class="flex flex-col items-center gap-2 flex-1 h-full group cursor-pointer">
                <div
                  class="w-full bg-slate-50 rounded-t-lg relative flex-1 flex items-end hover:bg-slate-100 transition-colors">
                  <div
                    class="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 rounded-t-sm min-h-[1px] relative"
                    :style="{ height: `${(day.count / maxChartValue) * 100}%` }">
                    <div
                      class="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1.5 px-2.5 rounded shadow-xl transition-all duration-200 whitespace-nowrap z-50 pointer-events-none transform group-hover:-translate-y-1">
                      {{ day.count }}
                      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {{ new Date(day.date).getDate() }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group">
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:translate-x-5 transition-transform duration-700">
            </div>
            <div class="relative z-10">
              <h3 class="text-xl font-bold mb-2">Yeni Deneyim Başlat</h3>
              <p class="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">Müşteriniz için etkileyici bir AR
                sahnesi tasarlamaya hemen başlayın.</p>
              <router-link to="/dashboard/ar-scene"
                class="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Sahne Oluştur
              </router-link>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 class="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Hızlı Erişim</h3>
            <div class="space-y-3">

              <router-link v-if="isSuperAdmin" to="/dashboard/companies/create"
                class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 group transition-all">
                <div class="flex items-center gap-3">
                  <span
                    class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">🏢</span>
                  <div class="text-left">
                    <span class="block text-sm font-bold text-slate-700 group-hover:text-slate-900">Şirket Ekle</span>
                    <span class="block text-xs text-slate-400">Yeni bir organizasyon</span>
                  </div>
                </div>
                <span
                  class="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all">→</span>
              </router-link>

              <router-link v-if="isCompanyAdmin" to="/dashboard/my-team"
                class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 group transition-all">
                <div class="flex items-center gap-3">
                  <span
                    class="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">👥</span>
                  <div class="text-left">
                    <span class="block text-sm font-bold text-slate-700 group-hover:text-slate-900">Ekibi Yönet</span>
                    <span class="block text-xs text-slate-400">Yeni kullanıcı davet et</span>
                  </div>
                </div>
                <span
                  class="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all">→</span>
              </router-link>

              <router-link v-if="canEdit" to="/dashboard/ar-model/upload"
                class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 group transition-all">
                <div class="flex items-center gap-3">
                  <span
                    class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">📤</span>
                  <div class="text-left">
                    <span class="block text-sm font-bold text-slate-700 group-hover:text-slate-900">Model Yükle</span>
                    <span class="block text-xs text-slate-400">GLB veya USDZ dosyası</span>
                  </div>
                </div>
                <span
                  class="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all">→</span>
              </router-link>

            </div>
          </div>
        </div>

        <div
          class="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wide">Son Aktiviteler</h3>
            <button class="text-xs text-indigo-600 font-bold hover:text-indigo-800 hover:underline">Yenile</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-100">
                <tr>
                  <th class="px-6 py-3 tracking-wider">İşlem</th>
                  <th class="px-6 py-3 tracking-wider">Kullanıcı</th>
                  <th class="px-6 py-3 tracking-wider">Tarih</th>
                  <th class="px-6 py-3 tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="loading && activities.length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-slate-400">Yükleniyor...</td>
                </tr>

                <tr v-else-if="activities.length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-slate-400">Henüz bir aktivite kaydı yok.</td>
                </tr>

                <tr v-else v-for="activity in activities" :key="activity.id"
                  class="hover:bg-slate-50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span class="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {{ activity.description || activity.action }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-6 h-6 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-500 uppercase">
                        {{ activity.user ? activity.user.substring(0, 2) : '??' }}
                      </div>
                      <span class="text-slate-600 font-medium">{{ activity.user }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-400 font-medium">
                    {{ new Date(activity.date).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'short', hour:
                        '2-digit', minute: '2-digit'
                    }) }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {{ activity.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAuthStore } from '../../../store/modules/auth';
import { dashboardService } from '../../../services/dashboardService';
import type { DashboardStats, ActivityLog, ChartData } from '../dto/dashboard.dto';

const auth = useAuthStore();

// --- STATE ---
const loading = ref(true);
const stats = ref<DashboardStats>({
  totalCompanies: 0,
  activeScenes: 0,
  totalUsers: 0,
  storage: { used: '0', unit: 'GB', percentage: 0 }
});
const activities = ref<ActivityLog[]>([]);
const chartData = ref<ChartData[]>([]);

// --- COMPUTED HELPERS ---
const userInitials = computed(() => {
  const name = auth.user?.name || 'User';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
});

// Rol Kontrolleri
const isSuperAdmin = computed(() => auth.user?.role === 'SUPER_ADMIN');
const isCompanyAdmin = computed(() => auth.user?.role === 'COMPANY_ADMIN');
const canEdit = computed(() => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR'].includes(auth.user?.role || ''));

// Chart Ölçekleme
const maxChartValue = computed(() => {
  if (chartData.value.length === 0) return 1;
  const max = Math.max(...chartData.value.map(d => d.count));
  return max === 0 ? 1 : max;
});

// --- METHODS ---
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const [statsData, activitiesData, chartDataRes] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getActivities(),
      dashboardService.getChartData()
    ]);

    stats.value = statsData;
    activities.value = activitiesData;
    chartData.value = chartDataRes;
  } catch (error) {
    console.error("Dashboard verisi yüklenemedi", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!auth.user && auth.token) {
    await auth.fetchMe();
  }
  await fetchDashboardData();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>