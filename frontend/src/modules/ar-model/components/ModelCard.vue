<template>
  <div
    class="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden cursor-pointer">

    <router-link :to="`/dashboard/ar-model/${model.id}`" class="absolute inset-0 z-10"></router-link>

    <div class="flex flex-row md:flex-col h-full">

      <div
        class="relative w-28 h-28 md:w-full md:aspect-square shrink-0 overflow-hidden bg-gray-50 m-2 md:m-0 rounded-xl md:rounded-none md:rounded-t-2xl">

        <img :src="thumbnailSrc" alt="Model Thumbnail" loading="lazy"
          class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          @error="handleImageError" />

        <div
          class="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center backdrop-blur-[2px]">
          <svg class="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>

        <div class="absolute top-2 left-2 md:top-3 md:left-3">
          <span
            class="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm border border-white/20"
            :class="getFileTypeClass(model.fileType)">
            {{ model.fileType || '3D' }}
          </span>
        </div>

        <!-- Privacy & Share badges -->
        <div class="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1">
          <span v-if="model.isPrivate"
            class="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100/90 text-slate-700 border border-slate-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 10-8 0v4m12 0V7a4 4 0 10-8 0v4m-2 0h12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" />
            </svg>
            {{ t('common.private') }}
          </span>
          <span v-else
            class="px-2 py-1 text-[10px] font-bold rounded-lg bg-green-100/90 text-green-700 border border-green-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.5 6.5L10 15l-2.5-2.5" />
            </svg>
            {{ t('common.public') }}
          </span>
          <span v-if="model.shareToken"
            class="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-100/90 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 015.657 0l.343.343a4 4 0 010 5.657l-3.536 3.536a4 4 0 01-5.657 0l-.343-.343M10.172 13.828a4 4 0 010-5.657l3.536-3.536a4 4 0 015.657 0l.343.343" />
            </svg>
            {{ t('common.shared') }}
          </span>
        </div>
      </div>

      <div class="flex flex-col justify-center p-3 md:p-5 flex-1 min-w-0">
        <h3
          class="text-slate-800 font-bold text-base md:text-lg truncate group-hover:text-indigo-600 transition-colors mb-1">
          {{ model.fileName }}
        </h3>

        <div class="flex items-center justify-between mt-1">
          <div class="flex items-center text-xs text-slate-400">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
            </svg>
            {{ formattedSize }}
          </div>

          <span class="text-[10px] text-slate-300 font-medium">
            {{ new Date(model.createdAt).toLocaleDateString('tr-TR') }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ARModelDto } from '../dto/arModel.dto';
import { arModelService } from '../../../services/arModelService';

const { t } = useI18n();

// Props Tanımı (Strict Type)
const props = defineProps<{
  model: ARModelDto;
}>();

// Helper: Resim URL'ini servisten al
const thumbnailSrc = computed(() => {
  return arModelService.getPreviewUrl(props.model.thumbnailPath || undefined);
});

// Helper: Resim yüklenemezse placeholder göster
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  // Basit bir placeholder SVG veya renkli div'e fallback yapılabilir
  // Şimdilik boş bırakıyoruz veya varsayılan bir görsel atanabilir.
  target.src = 'https://via.placeholder.com/300x300?text=No+Preview';
};

// Helper: Dosya Boyutu Formatlama
const formattedSize = computed(() => {
  const bytes = props.model.fileSize;
  if (!+bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
});

// Helper: Dosya Tipine Göre Renk
const getFileTypeClass = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('glb') || t.includes('gltf')) return 'bg-orange-100/90 text-orange-700';
  if (t.includes('usdz')) return 'bg-blue-100/90 text-blue-700';
  if (t.includes('fbx')) return 'bg-purple-100/90 text-purple-700';
  return 'bg-gray-100/90 text-gray-700';
};
</script>