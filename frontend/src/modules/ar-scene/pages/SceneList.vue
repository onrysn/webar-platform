<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">

      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">AR Sahnelerim</h1>
            <span v-if="routeCompanyId"
              class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
              Şirket #{{ routeCompanyId }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">Müşterilerinize sunacağınız 3D ortamları buradan tasarlayın.</p>
        </div>

        <div class="flex gap-3 w-full sm:w-auto">
          <button v-if="routeCompanyId" @click="goBackToCompany"
            class="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Şirkete Dön
          </button>

          <button @click="openCreateModal"
            class="group w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Sahne Oluştur
          </button>
        </div>
      </div>

      <div v-if="isSuperAdmin && !routeCompanyId"
        class="mb-8 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-2 text-gray-500 min-w-max">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="text-sm font-bold">Şirket Filtrele:</span>
        </div>
        <select v-model="selectedFilterCompanyId" @change="fetchScenes"
          class="flex-1 w-full sm:w-auto p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block">
          <option :value="null">Tüm Şirketler</option>
          <option v-for="c in companiesList" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
          <div class="h-48 bg-gray-200 rounded-xl mb-4"></div>
          <div class="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else-if="scenes.length === 0"
        class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
        <div class="mx-auto h-24 w-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="mt-2 text-lg font-bold text-gray-900">Henüz hiç sahne yok</h3>
        <p class="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          {{ selectedFilterCompanyId ? 'Bu şirkete ait sahne bulunamadı.' : 'İlk AR sahnenizi oluşturarak başlayın.' }}
        </p>
        <div class="mt-6">
          <button @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200">
            Sahne Oluştur
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="scene in scenes" :key="scene.id"
          class="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">

          <div
            class="absolute top-3 right-3 flex gap-2 z-20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button @click.stop="openEditModal(scene)"
              class="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 hover:text-blue-600 hover:bg-white transition-colors border border-gray-200"
              title="Düzenle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button @click.stop="deleteScene(scene.id)"
              class="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 hover:text-red-600 hover:bg-white transition-colors border border-gray-200"
              title="Sil">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div @click="goToEditor(scene.id)" class="cursor-pointer">
            <div class="h-48 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
              <div v-if="scene.settings?.backgroundColor"
                class="absolute inset-0 opacity-50 transition-colors duration-300"
                :style="{ backgroundColor: scene.settings.backgroundColor }"></div>
              <div class="absolute inset-0 opacity-10 pointer-events-none"
                style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>

              <!-- Privacy & Share badges -->
              <div class="absolute top-3 left-3 z-20 flex items-center gap-1">
                <span v-if="scene.isPrivate"
                  class="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100/90 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 10-8 0v4m12 0V7a4 4 0 10-8 0v4m-2 0h12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" />
                  </svg>
                  Gizli
                </span>
                <span v-else
                  class="px-2 py-1 text-[10px] font-bold rounded-lg bg-green-100/90 text-green-700 border border-green-200 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.5 6.5L10 15l-2.5-2.5" />
                  </svg>
                  Açık
                </span>
                <span v-if="scene.shareToken"
                  class="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-100/90 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 015.657 0l.343.343a4 4 0 010 5.657l-3.536 3.536a4 4 0 01-5.657 0l-.343-.343M10.172 13.828a4 4 0 010-5.657l3.536-3.536a4 4 0 015.657 0l.343.343" />
                  </svg>
                  Paylaşıldı
                </span>
              </div>

              <div class="absolute inset-0 flex items-center justify-center">
                <div v-if="scene.settings?.floorTextureUrl"
                  class="w-24 h-24 shadow-2xl transform rotate-45 border-4 border-white/30 bg-cover bg-center rounded-xl transition-transform group-hover:scale-110 duration-500"
                  :style="{ backgroundImage: `url(${scene.settings.floorTextureUrl})` }"></div>
                <div v-else-if="scene.settings?.floorColor"
                  class="w-24 h-24 shadow-2xl transform rotate-45 border-4 border-white/30 rounded-xl transition-transform group-hover:scale-110 duration-500"
                  :style="{ backgroundColor: scene.settings.floorColor }"></div>
                <div v-else class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="p-5">
              <h3 class="font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">{{
                scene.name }}</h3>
              <div class="flex items-center text-xs text-gray-500 gap-2">
                <span class="flex items-center bg-gray-100 px-2 py-1 rounded">ID: #{{ scene.id }}</span>
                <span v-if="scene.createdAt" class="text-gray-400">{{ new
                  Date(scene.createdAt).toLocaleDateString('tr-TR') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SceneCreatorModal :is-open="modal.isOpen" :mode="modal.mode" :initial-data="modal.editingData"
        @close="modal.isOpen = false" @save="handleSaveFromModal" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { arSceneService } from '../../../services/arSceneService';
import { companyService } from '../../../services/companyService';
import { useAuthStore } from '../../../store/modules/auth';
import type { CompanyDto } from '../../companies/dto/company.dto';
import SceneCreatorModal from '../components/SceneCreatorModal.vue';
import type { ARSceneDto } from '../dto/arScene.dto';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// STATE
const scenes = ref<ARSceneDto[]>([]);
const loading = ref(true);
const companiesList = ref<CompanyDto[]>([]);
const selectedFilterCompanyId = ref<number | null>(null);

const modal = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  editingData: null as ARSceneDto | null
});

// COMPUTED
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');
const routeCompanyId = computed(() => route.params.companyId ? Number(route.params.companyId) : undefined);

// FETCH
const fetchScenes = async () => {
  loading.value = true;
  try {
    const targetId = routeCompanyId.value || selectedFilterCompanyId.value || undefined;
    scenes.value = await arSceneService.listScenes(targetId);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const fetchCompanies = async () => {
  if (isSuperAdmin.value && !routeCompanyId.value) {
    try {
      companiesList.value = await companyService.getAllCompanies();
    } catch (e) {
      console.error(e);
    }
  }
};

// MODAL ACTIONS
const openCreateModal = () => {
  // Super Admin Validation: Şirket seçmediyse uyar
  if (isSuperAdmin.value && !routeCompanyId.value && !selectedFilterCompanyId.value) {
    alert("Lütfen önce yukarıdaki filtreden sahne oluşturulacak şirketi seçiniz.");
    return;
  }
  modal.mode = 'create';
  modal.editingData = null;
  modal.isOpen = true;
};

const openEditModal = (scene: ARSceneDto) => {
  modal.mode = 'edit';
  modal.editingData = scene;
  modal.isOpen = true;
};

const handleSaveFromModal = async (payload: any) => {
  loading.value = true;
  try {
    const targetId = routeCompanyId.value || selectedFilterCompanyId.value;

    if (modal.mode === 'create') {
      const createData = {...payload};
      if (targetId) {
        createData.companyId = targetId;
      }
      await arSceneService.createScene(createData);
    } else if (modal.mode === 'edit' && modal.editingData) {
      const updateData = { ...payload };
      delete updateData.companyId; // Update'de companyId değişmez
      await arSceneService.updateScene(modal.editingData.id, updateData);
    }

    modal.isOpen = false;
    await fetchScenes();
  } catch (err: any) {
    console.error(err);
    const msg = err.response?.data?.message || 'Bir hata oluştu';
    alert("Hata: " + (Array.isArray(msg) ? msg.join(', ') : msg));
  } finally {
    loading.value = false;
  }
};

const deleteScene = async (id: number) => {
  if (!confirm('Bu sahneyi silmek istediğinize emin misiniz?')) return;
  const previousScenes = [...scenes.value];
  scenes.value = scenes.value.filter(s => s.id !== id);
  try {
    await arSceneService.deleteScene(id);
  } catch (err) {
    scenes.value = previousScenes;
    alert("Silme işlemi başarısız oldu.");
  }
};

const goToEditor = (id: number) => {
  // Editör yeni sekmede açılabilir (daha iyi UX)
  // window.open(`/editor/scene/${id}`, '_blank');
  router.push(`/editor/scene/${id}`);
};

const goBackToCompany = () => {
  if (routeCompanyId.value) router.push(`/dashboard/companies/${routeCompanyId.value}`);
};

// LIFECYCLE
onMounted(() => {
  fetchCompanies();
  fetchScenes();
});

watch(() => route.params.companyId, () => {
  fetchScenes();
});
</script>