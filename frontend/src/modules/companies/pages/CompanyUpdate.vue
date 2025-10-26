<template>
  <div>
    <h2>Şirket Güncelleme - {{ company.name }}</h2>
    <form @submit.prevent="updateCompany">
      <label>Şirket Adı:</label>
      <input v-model="form.name" type="text" />

      <label>Domain:</label>
      <input v-model="form.domain" type="text" />

      <button type="submit">Güncelle</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CompanyDto } from '../dto/company.dto';
import { companyService } from '../../../services/companyService';

const route = useRoute();
const router = useRouter();
const companyId = Number(route.params.id);

const company = reactive<CompanyDto>({ id: 0, name: '', domain: '', apiKey: '', users: [] });
const form = reactive({ name: '', domain: '' });

async function loadCompany() {
  const data = await companyService.getCompanyById(companyId);
  Object.assign(company, data);
  form.name = data.name;
  form.domain = data.domain;
}

async function updateCompany() {
  await companyService.updateCompany(companyId, form);
  alert('Şirket güncellendi!');
  router.push('/companies');
}

onMounted(loadCompany);
</script>
