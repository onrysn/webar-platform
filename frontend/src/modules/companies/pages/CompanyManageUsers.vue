<template>
  <div>
    <h2>Kullanıcı Yönetimi - {{ company.name }}</h2>

    <div>
      <h3>Şirkete Dahil Kullanıcılar</h3>
      <ul>
        <li v-for="user in company.users" :key="user.user.id">
          {{ user.user.name }} ({{ user.role }})
          <button @click="removeUser(user.user.id)">Çıkar</button>
        </li>
      </ul>
    </div>

    <div>
      <h3>Kullanıcı Ekle</h3>
      <input v-model="newUserId" type="number" placeholder="User ID" />
      <select v-model="newUserRole">
        <option value="member">Member</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      <button @click="addUser">Ekle</button>
    </div>
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
const newUserId = ref<number | null>(null);
const newUserRole = ref('member');

async function loadCompany() {
  company.value = await companyService.getCompanyById(companyId);
}

async function addUser() {
  if (!newUserId.value) return;
  await companyService.addUserToCompany(companyId, { userId: newUserId.value, role: newUserRole.value });
  await loadCompany();
  newUserId.value = null;
}

async function removeUser(userId: number) {
  await companyService.removeUserFromCompany(companyId, userId);
  await loadCompany();
}

onMounted(loadCompany);
</script>
