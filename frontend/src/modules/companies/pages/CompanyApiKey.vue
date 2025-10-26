<template>
  <div>
    <h2>API Key Yönetimi - {{ company.name }}</h2>
    <p>API Key: <strong>{{ company.apiKey }}</strong></p>
    <button @click="regenerateKey">Yenile</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { CompanyDto } from '../dto/company.dto';
import { companyService } from '../../../services/companyService';

const route = useRoute();
const companyId = Number(route.params.id);
const company = ref<CompanyDto>({ id: 0, name: '', domain: '', apiKey: '', users: [] });

async function loadCompany() {
  company.value = await companyService.getCompanyById(companyId);
}

async function regenerateKey() {
  const res = await companyService.regenerateApiKey(companyId);
  company.value.apiKey = res.apiKey;
  alert('API Key yenilendi!');
}

onMounted(loadCompany);
</script>
