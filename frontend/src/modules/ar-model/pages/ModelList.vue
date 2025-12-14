<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">AR Models</h1>
    <button @click="goToUpload" class="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Upload New Model
    </button>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <ModelCard v-for="model in models" :key="model.id" :model="model" :baseUrl="baseUrl" />
    </div>

    <p v-if="loading">Loading...</p>
    <p v-if="error" class="text-red-600">{{ error }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { arModelService } from '../../../services/arModelService';
import ModelCard from '../components/ModelCard.vue';

export default defineComponent({
  name: 'ModelList',
  components: { ModelCard },
  setup() {
    const router = useRouter();
    const models = ref<any[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const baseUrl = 'http://localhost:3000'; // backend URL, thumbnail için

    const fetchModels = async () => {
      loading.value = true;
      try {
        models.value = await arModelService.listModels();
      } catch (err: any) {
        error.value = err.message || 'Failed to fetch models';
      } finally {
        loading.value = false;
      }
    };

    const goToUpload = () => {
      router.push('/dashboard/ar-model/upload');
    };

    onMounted(fetchModels);

    return { models, loading, error, goToUpload, baseUrl };
  }
});
</script>
