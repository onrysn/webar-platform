<template>
  <div class="p-6">
    <div v-if="loading" class="text-gray-500">Yükleniyor...</div>

    <div v-else-if="!company" class="text-gray-500">
      Şirket bulunamadı.
    </div>

    <div v-else>
      <!-- Şirket bilgileri -->
      <h1 class="text-2xl font-semibold mb-2">{{ company.name }}</h1>
      <p class="text-gray-600 mb-4">Alan Adı: {{ company.domain }}</p>

      <!-- Navigasyon -->
      <nav class="flex space-x-4 mb-4">
        <router-link :to="`/dashboard/companies/${company.id}/update`"
          class="text-blue-600 hover:underline">Güncelle</router-link>
        <router-link :to="`/dashboard/companies/${company.id}/manage-users`"
          class="text-blue-600 hover:underline">Kullanıcılar</router-link>
        <router-link :to="`/dashboard/companies/${company.id}/api-key`" class="text-blue-600 hover:underline">API
          Key</router-link>
        <router-link to="/dashboard/companies" class="text-gray-600 hover:underline ml-auto">← Listeye Dön</router-link>
      </nav>

      <!-- Child route render alanı -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCompanyStore } from '../../../store/modules/company';

const route = useRoute();
const companyStore = useCompanyStore();
const loading = ref(true);
const company = ref<any>(null);

const fetchCompany = async () => {
  try {
    loading.value = true;
    const id = Number(route.params.id);
    company.value = await companyStore.fetchCompanyById(id);
  } catch (err) {
    console.error('Şirket yüklenemedi:', err);
    company.value = null;
  } finally {
    loading.value = false;
  }
};


// Route param değişirse şirket bilgilerini tekrar çek
watch(() => route.params.id, () => {
  fetchCompany();
});

onMounted(() => {
  fetchCompany();
});
</script>
