<template>
  <div class="py-6 px-4 sm:px-0">
    <div class="max-w-6xl mx-auto">

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <div class="lg:col-span-2 space-y-6">

          <div v-if="loading" class="space-y-4">
            <div v-for="n in 3" :key="n"
              class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div class="space-y-2">
                  <div class="h-4 w-32 bg-slate-200 rounded"></div>
                  <div class="h-3 w-20 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="(company.users || []).length === 0"
            class="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div
              class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              👥</div>
            <h3 class="text-lg font-bold text-slate-900">Henüz kullanıcı yok</h3>
            <p class="text-sm text-slate-500 mt-1">Sağ taraftaki panelden ID girerek yeni ekip arkadaşları ekleyin.</p>
          </div>

          <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Ekip Listesi</h3>
              <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">{{ (company.users ||
                []).length }} Kişi</span>
            </div>

            <ul class="divide-y divide-slate-100">
              <li v-for="userItem in company.users" :key="userItem.user.id"
                class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {{ getInitials(userItem.user.name) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ userItem.user.name }}</p>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                      :class="getRoleBadgeClass(userItem.role)">
                      {{ userItem.role }}
                    </span>
                  </div>
                </div>
                <button @click="removeUser(userItem.user.id)"
                  class="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Kullanıcıyı Çıkar">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="lg:col-span-1 lg:sticky lg:top-32">
          <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span class="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </span>
              Kullanıcı Ekle
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Kullanıcı ID</label>
                <div class="relative">
                  <input v-model.number="newUserId" type="number" placeholder="Örn: 1042"
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-700 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:font-sans">
                  <div class="absolute right-3 top-3 text-slate-400">#</div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Rol Ata</label>
                <div class="relative">
                  <select v-model="newUserRole"
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none transition-all cursor-pointer">
                    <option value="member">Member (Üye)</option>
                    <option value="editor">Editor (Düzenleyici)</option>
                    <option value="admin">Admin (Yönetici)</option>
                  </select>
                  <div class="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <button @click="addUser" :disabled="!newUserId || isAdding"
                class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2">
                <svg v-if="isAdding" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ isAdding ? 'Ekleniyor...' : 'Ekibe Dahil Et' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... Mevcut script kodunuz ...
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import type { CompanyDto } from '../dto/company.dto';
import { companyService } from '../../../services/companyService';

const route = useRoute();
const toast = useToast();
const companyId = Number(route.params.id);

const loading = ref(true);
const isAdding = ref(false);
const company = ref<CompanyDto>({ id: 0, name: '', domain: '', apiKey: '', users: [] });

const newUserId = ref<number | null>(null);
const newUserRole = ref('member');

async function loadCompany() {
  try {
    company.value = await companyService.getCompanyById(companyId);
  } catch (error) {
    toast.error("Şirket bilgileri yüklenemedi");
  } finally {
    loading.value = false;
  }
}

async function addUser() {
  if (!newUserId.value) return;
  isAdding.value = true;
  try {
    await companyService.addUserToCompany(companyId, { userId: newUserId.value, role: newUserRole.value });
    await loadCompany();
    newUserId.value = null;
    newUserRole.value = 'member';
    toast.success('Kullanıcı başarıyla eklendi');
  } catch (err: any) {
    console.error(err);
    toast.error(err.response?.data?.message || 'Kullanıcı eklenirken hata oluştu');
  } finally {
    isAdding.value = false;
  }
}

async function removeUser(userId: number) {
  if (!confirm("Bu kullanıcıyı şirketten çıkarmak istediğinize emin misiniz?")) return;
  try {
    await companyService.removeUserFromCompany(companyId, userId);
    await loadCompany();
    toast.success('Kullanıcı çıkarıldı');
  } catch (err) {
    console.error(err);
    toast.error('Kullanıcı çıkarılamadı');
  }
}

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'editor': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

onMounted(loadCompany);
</script>