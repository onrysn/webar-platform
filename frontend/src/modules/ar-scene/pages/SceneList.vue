<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">

      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">AR Sahnelerim</h1>
          <p class="text-gray-500 text-sm mt-1">Projelerinizi ve 3D alanlarınızı yönetin</p>
        </div>
        <button @click="openCreateModal"
          class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors flex items-center gap-2">
          <span>+</span> Yeni Sahne
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="scene in scenes" :key="scene.id"
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group relative">

          <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button @click.stop="openEditModal(scene)"
              class="p-2 bg-white rounded-full shadow hover:text-blue-600 text-gray-500">
              <span class="text-xs">✏️</span>
            </button>
            <button @click.stop="deleteScene(scene.id)"
              class="p-2 bg-white rounded-full shadow hover:text-red-600 text-gray-500">
              <span class="text-xs">🗑️</span>
            </button>
          </div>

          <div @click="goToEditor(scene.id)" class="cursor-pointer">
            <div
              class="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden border border-gray-100">

              <div v-if="scene.settings?.backgroundColor" class="absolute inset-0 opacity-50"
                :style="{ backgroundColor: scene.settings.backgroundColor }"></div>

              <div v-if="scene.settings?.floorTextureUrl"
                class="absolute w-20 h-20 shadow-sm transform rotate-45 border border-white/20 bg-cover bg-center"
                :style="{ backgroundImage: `url(${scene.settings.floorTextureUrl})` }"></div>

              <div v-else-if="scene.settings?.floorColor"
                class="absolute w-16 h-16 rounded shadow-sm transform rotate-45 border border-black/10"
                :style="{ backgroundColor: scene.settings.floorColor }"></div>
            </div>

            <h3 class="font-bold text-lg text-gray-800">{{ scene.name }}</h3>
          </div>
        </div>
      </div>

      <SceneCreatorModal :is-open="modal.isOpen" :mode="modal.mode" :initial-data="modal.editingData"
        @close="modal.isOpen = false" @save="handleSaveFromModal" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { arSceneService } from '../../../services/arSceneService';
import SceneCreatorModal from '../components/SceneCreatorModal.vue'; // Yolu düzenleyin
import type { ARSceneDto } from '../dto/arScene.dto';

const router = useRouter();
const scenes = ref<ARSceneDto[]>([]);
const loading = ref(true);
const COMPANY_ID = 1;

const modal = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  editingData: null as ARSceneDto | null
});

const fetchScenes = async () => {
  try { scenes.value = await arSceneService.listScenes(COMPANY_ID); }
  catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const openCreateModal = () => {
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
        // ... (Dosya yükleme işlemleri varsa buraya gelir) ...

        if (modal.mode === 'create') {
            // 1. OLUŞTURMA MODU: companyId ZORUNLU
            // Payload'a companyId ekleyip gönderiyoruz.
            const createData = { ...payload, companyId: COMPANY_ID };
            await arSceneService.createScene(createData);

        } else if (modal.mode === 'edit' && modal.editingData) {
            // 2. GÜNCELLEME MODU: companyId YASAK 🚫
            // Backend UpdateSceneDto'sunda companyId yok.
            // Payload'dan sadece name ve settings'i alıyoruz.
            
            const updateData = { ...payload };
            
            // Eğer payload içinde companyId varsa SİLİYORUZ
            if ('companyId' in updateData) {
                delete updateData.companyId;
            }

            await arSceneService.updateScene(modal.editingData.id, updateData);
        }

        modal.isOpen = false;
        await fetchScenes();
    } catch (err: any) {
        console.error(err);
        // Hata mesajını göster
        const msg = err.response?.data?.message;
        alert("Hata: " + (Array.isArray(msg) ? msg.join(', ') : msg));
    } finally {
        loading.value = false;
    }
};

const deleteScene = async (id: number) => {
  if (!confirm('Bu sahneyi silmek istediğinize emin misiniz?')) return;

  loading.value = true;
  try {
    await arSceneService.deleteScene(id);
    
    scenes.value = scenes.value.filter(s => s.id !== id);
    
    console.log("Sahne başarıyla silindi.");
  } catch (err: any) {
    console.error("Silme hatası:", err);
    const msg = err.response?.data?.message || "Sahne silinirken bir hata oluştu.";
    alert("Hata: " + msg);
  } finally {
    loading.value = false;
  }
};

const goToEditor = (id: number) => router.push(`/editor/scene/${id}`);

onMounted(fetchScenes);
</script>