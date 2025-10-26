<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold">Şirketlerim</h1>
            <button @click="goToCreate" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                + Yeni Şirket
            </button>
        </div>

        <div v-if="loading" class="text-gray-500">Yükleniyor...</div>
        <div v-else-if="companies.length === 0" class="text-gray-500">
            Henüz kayıtlı şirketiniz yok.
        </div>

        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyCard v-for="company in companies" :key="company.id" :company="company"
                @click="goToDetail(company.id)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCompanyStore } from '../../store/modules/company';
import CompanyCard from './components/CompanyCard.vue';

const router = useRouter();
const companyStore = useCompanyStore();
const loading = ref(true);
const companies = ref<any[]>([]);

const loadCompanies = async () => {
    loading.value = true;
    await companyStore.fetchUserCompanies();
    companies.value = companyStore.companies;
    loading.value = false;
};

const goToDetail = (id: number) => {
    router.push(`/dashboard/companies/${id}`);
};

const goToCreate = () => {
    router.push(`/dashboard/companies/create`);
};

onMounted(loadCompanies);
</script>
