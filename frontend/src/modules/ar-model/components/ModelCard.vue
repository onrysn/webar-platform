<template>
  <div class="border rounded-lg p-4 flex flex-col items-center shadow hover:shadow-md transition">
    <img :src="fullThumbnailPath" alt="Thumbnail" class="w-32 h-32 object-cover mb-2 rounded" />
    <router-link :to="`/dashboard/ar-model/${model.id}`" class="text-blue-600 font-semibold hover:underline">
      {{ model.fileName }}
    </router-link>
    <span class="text-gray-500 text-sm">{{ model.fileType }} | {{ formattedSize }}</span>
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
      default: '' // backend URL varsa buraya eklenebilir
    }
  },
  setup(props) {
    const fullThumbnailPath = computed(() => props.baseUrl + props.model.thumbnailPath);
    const formattedSize = computed(() => (props.model.fileSize / 1024 / 1024).toFixed(2) + ' MB');

    return { fullThumbnailPath, formattedSize };
  }
});
</script>
