<template>
  <div class="max-w-xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">AR Model Upload</h1>

    <div
      class="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition hover:bg-gray-50 bg-white mb-6"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @click="triggerFileSelect"
    >
      <div class="flex flex-col items-center justify-center">
        <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-gray-600 font-medium">Model Seç veya Sürükle</p>
        <p class="text-gray-400 text-xs mt-1">(.glb, .gltf, .fbx, .usdz)</p>
      </div>
      <input ref="fileInput" type="file" class="hidden" accept=".glb,.gltf,.fbx,.usdz" @change="onFileChange" />
    </div>

    <div v-if="selectedFile" class="w-full h-80 mb-6 shadow-2xl rounded-3xl border border-gray-100">
      <ArPreview :file="selectedFile" />
    </div>

    <div v-if="progress > 0" class="mb-4">
      <div class="flex justify-between text-xs mb-1">
        <span>Yükleniyor...</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div class="flex space-x-3">
      <button
        class="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        :disabled="!selectedFile || uploading"
        @click="uploadModel"
      >
        {{ uploading ? 'Yükleniyor...' : 'Modeli Yükle' }}
      </button>
      
      <button
        v-if="selectedFile"
        @click="cancelUpload"
        class="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border transition"
        :disabled="uploading"
      >
        İptal
      </button>
    </div>
    
    <p v-if="error" class="text-red-600 mt-4 text-center">{{ error }}</p>

  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import ArPreview from "../components/ArPreview.vue";

// State
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const progress = ref(0);
const uploading = ref(false);
const error = ref<string | null>(null);

// Dosya Seçme İşlemleri
const triggerFileSelect = () => fileInput.value?.click();

const handleFile = (file: File) => {
  error.value = null;
  selectedFile.value = file;
};

const onFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files?.[0]) handleFile(files[0]);
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) handleFile(file);
};

const cancelUpload = () => {
  selectedFile.value = null;
  progress.value = 0;
  uploading.value = false;
  if (fileInput.value) fileInput.value.value = "";
};

const uploadModel = async () => {
  if (!selectedFile.value) return;
  uploading.value = true;
  
  try {
    // Burada kendi servisinizi çağırın
    // await arModelService.upload(...)
    
    // Simülasyon
    for (let i = 0; i <= 100; i += 20) {
      progress.value = i;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log("Upload tamamlandı");
    
  } catch (err: any) {
    error.value = err.message;
  } finally {
    uploading.value = false;
  }
};
</script>