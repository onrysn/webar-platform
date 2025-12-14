<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">AR Sahnelerim</h1>
      <button @click="createModalOpen = true" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        + Yeni Sahne
      </button>
    </div>

    <div v-if="loading" class="text-center py-10">Yükleniyor...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="scene in scenes" :key="scene.id" 
        class="bg-white p-4 rounded-xl shadow border border-gray-200 hover:shadow-md transition cursor-pointer"
        @click="goToEditor(scene.id)">
        
        <div class="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
           </svg>
        </div>
        
        <h3 class="font-bold text-lg text-gray-800">{{ scene.name }}</h3>
        <p class="text-sm text-gray-500">{{ new Date(scene.createdAt).toLocaleDateString() }}</p>
        <p class="text-xs text-blue-500 mt-2">{{ scene.items?.length || 0 }} Obje</p>
      </div>
    </div>

    <div v-if="createModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96">
        <h3 class="font-bold text-lg mb-4">Yeni Sahne Oluştur</h3>
        <input v-model="newSceneName" type="text" placeholder="Sahne Adı (Örn: Mutfak)" class="w-full border p-2 rounded mb-4">
        
        <div class="flex justify-end gap-2">
          <button @click="createModalOpen = false" class="text-gray-500 px-4 py-2">İptal</button>
          <button @click="createScene" :disabled="!newSceneName" class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">Oluştur</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { arSceneService } from '../../../services/arSceneService';
import type { ARSceneDto } from '../dto/arScene.dto';

const router = useRouter();
const scenes = ref<ARSceneDto[]>([]);
const loading = ref(true);
const createModalOpen = ref(false);
const newSceneName = ref('');
const COMPANY_ID = 1; // Dinamik alınmalı (Auth store'dan)

const fetchScenes = async () => {
  try {
    scenes.value = await arSceneService.listScenes(COMPANY_ID);
  } finally {
    loading.value = false;
  }
};

const createScene = async () => {
  try {
    await arSceneService.createScene({ name: newSceneName.value, companyId: COMPANY_ID });
    createModalOpen.value = false;
    newSceneName.value = '';
    fetchScenes();
  } catch (err) {
    alert("Hata oluştu");
  }
};

const goToEditor = (id: number) => {
  router.push(`/editor/scene/${id}`);
};

onMounted(fetchScenes);
</script>