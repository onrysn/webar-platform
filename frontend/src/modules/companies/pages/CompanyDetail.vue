<template>
  <div class="p-6">
    <div v-if="loading" class="text-gray-500">Yükleniyor...</div>

    <div v-else-if="!company" class="text-gray-500">
      Şirket bulunamadı.
    </div>

    <div v-else>
      <h1 class="text-2xl font-semibold mb-2">{{ company.name }}</h1>
      <p class="text-gray-600 mb-4">Alan Adı: {{ company.domain }}</p>

      <nav class="flex space-x-4 mb-4">
        <router-link :to="`/dashboard/companies/${company.id}/update`"
          class="text-blue-600 hover:underline">Güncelle</router-link>
        <router-link :to="`/dashboard/companies/${company.id}/manage-users`"
          class="text-blue-600 hover:underline">Kullanıcılar</router-link>
        <router-link :to="`/dashboard/companies/${company.id}/api-key`" class="text-blue-600 hover:underline">API
          Key</router-link>
      </nav>

      <!-- Burada child component render edilecek -->
      <router-view />
    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCompanyStore } from '../../../store/modules/company';

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
