<template>
  <div class="min-h-screen bg-slate-50">

    <div v-if="loading" class="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div class="max-w-7xl mx-auto">
        <div class="h-4 w-24 bg-slate-200 rounded mb-6"></div>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-slate-200 rounded-xl shrink-0"></div>
          <div class="space-y-2 w-full">
            <div class="h-6 w-48 bg-slate-200 rounded"></div>
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div class="mt-8 h-10 w-full max-w-md bg-slate-200 rounded"></div>
      </div>
    </div>

    <div v-else-if="!company" class="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
      <h2 class="text-lg font-bold text-slate-900">Şirket Bulunamadı</h2>
      <p class="text-slate-500 text-sm mt-1">Aradığınız şirket silinmiş veya erişim izniniz yok.</p>
      <router-link to="/dashboard/companies" class="mt-4 text-indigo-600 font-bold text-sm hover:underline">
        Listeye Dön
      </router-link>
    </div>

    <div v-else>

      <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">

          <nav class="flex mb-4">
            <router-link to="/dashboard/companies"
              class="group flex items-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Şirket Listesine Dön
            </router-link>
          </nav>

          <div class="flex items-start md:items-center justify-between flex-col md:flex-row gap-4 mb-6">
            <div class="flex items-center gap-4 w-full md:w-auto">
              <div
                class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                {{ getInitials(company.name) }}
              </div>

              <div class="min-w-0 flex-1">
                <h1 class="text-2xl font-bold text-slate-900 leading-tight truncate">{{ company.name }}</h1>
                <div class="flex flex-wrap items-center gap-2 mt-1">
                  <div v-if="company.domain" class="flex items-center text-slate-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span class="font-medium truncate max-w-[150px] sm:max-w-xs">{{ company.domain }}</span>
                  </div>
                  <span
                    class="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200 shrink-0">
                    ID: {{ company.id }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div ref="tabsContainer"
            class="flex space-x-2 overflow-x-auto custom-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">

            <router-link :to="`/dashboard/companies/${company.id}/update`"
              active-class="!bg-indigo-50 !text-indigo-700 !border-indigo-200 shadow-sm"
              class="whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Genel Ayarlar
            </router-link>

            <router-link :to="`/dashboard/companies/${company.id}/manage-users`"
              active-class="!bg-indigo-50 !text-indigo-700 !border-indigo-200 shadow-sm"
              class="whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Kullanıcılar
              <span
                :class="$route.path.includes('manage-users') ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-mono ml-1 transition-colors">
                {{ company._count?.users || company.users?.length || 0 }}
              </span>
            </router-link>

            <router-link :to="`/dashboard/companies/${company.id}/api-key`"
              active-class="!bg-indigo-50 !text-indigo-700 !border-indigo-200 shadow-sm"
              class="whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API Entegrasyonu
            </router-link>

          </div>

        </div>
      </header>

      <main class="max-w-7xl mx-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useCompanyStore } from '../../../store/modules/company';
import type { CompanyDto } from '../dto/company.dto';

const route = useRoute();
const companyStore = useCompanyStore();

const loading = ref(true);
// Tip Güvenliği: CompanyDto kullanıyoruz
const company = ref<CompanyDto | null>(null);
const tabsContainer = ref<HTMLElement | null>(null);

const fetchCompany = async () => {
  try {
    loading.value = true;
    const id = Number(route.params.id);
    if (!id) return;

    // Store'dan veriyi alıyoruz. 
    // Not: Store'daki method'un CompanyDto döndüğünden emin oluyoruz.
    company.value = await companyStore.fetchCompanyById(id);

    scrollToActiveTab();
  } catch (err) {
    console.error('Şirket yüklenemedi:', err);
    company.value = null;
  } finally {
    loading.value = false;
  }
};

const getInitials = (name: string) => {
  if (!name) return 'Co';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const scrollToActiveTab = async () => {
  await nextTick();
  if (!tabsContainer.value) return;
  const activeTab = tabsContainer.value.querySelector('.\\!bg-indigo-50');
  if (activeTab) {
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
};

watch(() => route.path, () => scrollToActiveTab());
watch(() => route.params.id, () => fetchCompany());

onMounted(() => {
  fetchCompany();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 0px;
  background: transparent;
}
</style>