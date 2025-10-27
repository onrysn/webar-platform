<template>
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-2xl font-semibold mb-4">Yeni Şirket Oluştur</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block mb-1 font-medium">Şirket Adı</label>
        <input
          v-model="name"
          type="text"
          placeholder="Örn. Anatolio Teknoloji"
          class="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label class="block mb-1 font-medium">Alan Adı</label>
        <input
          v-model="domain"
          type="text"
          placeholder="örn. anatolio.com"
          class="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full"
      >
        Oluştur
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import { useCompanyStore } from '../../../store/modules/company';

const toast = useToast();
const router = useRouter();
const companyStore = useCompanyStore();

const name = ref('');
const domain = ref('');

const handleSubmit = async () => {
  try {
    await companyStore.createCompany({ name: name.value, domain: domain.value });
    router.push('/dashboard/companies');
  } catch (err) {
    console.error(err);
    toast.error('Şirket oluşturulamadı');
  }
};
</script>
