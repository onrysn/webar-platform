<template>
  <div
    class="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden cursor-pointer">

    <router-link :to="`/dashboard/ar-model/${model.id}`" class="absolute inset-0 z-10"></router-link>

    <div class="flex flex-row md:flex-col h-full">

      <div
        class="relative w-28 h-28 md:w-full md:aspect-square shrink-0 overflow-hidden bg-gray-50 m-2 md:m-0 rounded-xl md:rounded-none md:rounded-t-2xl">
        <img :src="fullThumbnailPath" alt="Thumbnail"
          class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />

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
            class="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm"
            :class="getFileTypeClass(model.fileType)">
            {{ model.fileType }}
          </span>
        </div>
      </div>

      <div class="flex flex-col justify-center p-3 md:p-5 flex-1 min-w-0">
        <h3
          class="text-gray-800 font-bold text-base md:text-lg truncate group-hover:text-blue-600 transition-colors mb-1">
          {{ model.fileName }}
        </h3>

        <div class="flex items-center text-xs text-gray-400 space-x-2">
          <span class="flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            {{ formattedSize }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'ModelCard',
  props: {
    model: {
      type: Object,
      required: true
    },
    baseUrl: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const fullThumbnailPath = computed(() => props.baseUrl + props.model.thumbnailPath);
    const formattedSize = computed(() => (props.model.fileSize / 1024 / 1024).toFixed(2) + ' MB');

    const getFileTypeClass = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes('glb') || t.includes('gltf')) return 'bg-orange-100/90 text-orange-700';
      if (t.includes('usdz')) return 'bg-blue-100/90 text-blue-700';
      if (t.includes('fbx')) return 'bg-purple-100/90 text-purple-700';
      return 'bg-gray-100/90 text-gray-700';
    };

    return { fullThumbnailPath, formattedSize, getFileTypeClass };
  }
});
</script>
