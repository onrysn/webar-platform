<template>
  <div class="p-6">
    <div v-if="loading" class="text-gray-500">Yükleniyor...</div>

    <div v-else-if="!company" class="text-gray-500">
      Şirket bulunamadı.
    </div>

    <div v-else>
      <h1 class="text-2xl font-semibold mb-2">{{ company.name }}</h1>
      <p class="text-gray-600 mb-4">Alan Adı: {{ company.domain }}</p>

      <router-link
        to="/dashboard/companies"
        class="text-blue-600 hover:underline"
      >
        ← Listeye Dön
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCompanyStore } from '../../store/modules/company';

const route = useRoute();
const companyStore = useCompanyStore();
const loading = ref(true);
const company = ref<any>(null);

onMounted(async () => {
  const id = Number(route.params.id);
  loading.value = true;
  company.value = await companyStore.fetchCompanyById(id);
  loading.value = false;
});
</script>
