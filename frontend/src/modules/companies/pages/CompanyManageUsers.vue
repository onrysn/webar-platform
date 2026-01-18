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

          <div v-else-if="(!company.users || company.users.length === 0)"
            class="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div
              class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              👥</div>
            <h3 class="text-lg font-bold text-slate-900">Henüz kullanıcı yok</h3>
            <p class="text-sm text-slate-500 mt-1">Sağ taraftaki formu kullanarak şirkete yeni bir ekip üyesi
              tanımlayın.</p>
          </div>


            <!-- Edit Modal -->
            <template v-if="editingUser">
              <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 border border-slate-200">
                  <h3 class="text-lg font-bold text-slate-900 mb-4">Kullanıcıyı Düzenle</h3>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Ad Soyad</label>
                      <input v-model="editingUser.name" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-posta</label>
                      <input v-model="editingUser.email" type="email" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Rol</label>
                      <select v-model="editingUser.role" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                        <option value="MEMBER">Üye</option>
                        <option value="EDITOR">Editör</option>
                        <option value="COMPANY_ADMIN" v-if="isSuperAdmin">Yönetici</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Yeni Şifre (opsiyonel)</label>
                      <input v-model="editingUser.password" type="text" minlength="6" placeholder="En az 6 karakter" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-3 mt-6">
                    <button @click="cancelEdit" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">İptal</button>
                    <button @click="saveEdit" :disabled="isUpdating" class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50">
                      <svg v-if="isUpdating" class="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </template>
          <div v-else class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Ekip Listesi</h3>
              <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">
                {{ company.users ? company.users.length : 0 }} Kişi
              </span>
            </div>

            <ul class="divide-y divide-slate-100">
              <li v-for="user in company.users" :key="user.id"
                class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                    {{ getInitials(user.name) }}
                  </div>

                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ user.name }}</p>
                    <p class="text-xs text-slate-500">{{ user.email }}</p>
                  </div>

                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ml-2"
                    :class="getRoleBadgeClass(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <button @click="openEdit(user)"
                    class="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                    title="Kullanıcıyı Düzenle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h6a1 1 0 110 2H4v10h10v-6a1 1 0 112 0v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button @click="removeUser(user.id)"
                    class="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Kullanıcıyı Çıkar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
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
              Yeni Üye Oluştur
            </h3>

            <form @submit.prevent="addUser" class="space-y-4">

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Ad Soyad</label>
                <input v-model="form.name" type="text" placeholder="Örn: Ahmet Yılmaz" required
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-posta</label>
                <input v-model="form.email" type="email" placeholder="ahmet@sirket.com" required
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Geçici Şifre</label>
                <input v-model="form.password" type="text" placeholder="******" required minlength="6"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Rol</label>
                <div class="relative">
                  <select v-model="form.role"
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none transition-all cursor-pointer">
                    <option value="MEMBER">Member (Üye)</option>
                    <option value="EDITOR">Editor (Düzenleyici)</option>
                  </select>
                  <div class="absolute right-3 top-3 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <button type="submit" :disabled="isAdding"
                class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2">
                <svg v-if="isAdding" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ isAdding ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur' }}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../../../store/modules/auth'; // Auth Store
import { companyService } from '../../../services/companyService';
import { userService } from '../../../services/userService';
import { useCompanyStore } from '../../../store/modules/company';
import type { CompanyDto } from '../dto/company.dto';

const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();
const companyStore = useCompanyStore();

// STATE
const loading = ref(true);
const isAdding = ref(false);
const company = ref<CompanyDto>({ id: 0, name: '', domain: '', users: [] });
const editingUser = ref<{ id: number; name: string; email: string; role: 'MEMBER' | 'EDITOR' | 'COMPANY_ADMIN' | 'SUPER_ADMIN'; password?: string } | null>(null);
const isUpdating = ref(false);

// FORM
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'MEMBER' as 'MEMBER' | 'EDITOR'
});

// COMPUTED
const isSuperAdmin = computed(() => authStore.user?.role === 'SUPER_ADMIN');

// HEDEF ŞİRKET ID'Sİ (Sadece Super Admin için gerekli)
const targetCompanyId = computed(() => {
  if (isSuperAdmin.value && route.params.id) {
    return Number(route.params.id);
  }
  // Company Admin için ID gerekmez, servisler token'dan alır.
  return null;
});

// 1. ŞİRKETİ VE KULLANICILARI YÜKLE
async function loadCompany() {
  loading.value = true;
  try {

    if (isSuperAdmin.value) {
      // Super Admin: ID ile veri çek
      const id = targetCompanyId.value;
      if (!id) throw new Error("Şirket ID bulunamadı.");
      // Store veya Service kullanılabilir
      company.value = await companyStore.fetchCompanyById(id);
      // Kullanıcıları ayrı endpointten çek
      const users = await userService.listUsers(id);
      company.value.users = users;
    } else {
      // Company Admin: Kendi şirketini çek
      company.value = await companyStore.fetchMyCompany();
      // Kendi şirket kullanıcılarını çek
      const users = await companyService.getMyCompanyUsers();
      company.value.users = users;
    }

  } catch (error) {
    console.error(error);
    toast.error("Şirket bilgileri yüklenemedi");
  } finally {
    loading.value = false;
  }
}

// 2. KULLANICI EKLE
async function addUser() {
  isAdding.value = true;
  try {

    if (isSuperAdmin.value) {
      // Super Admin: ID bazlı endpoint
      if (!targetCompanyId.value) throw new Error("ID eksik");
      await companyService.addUserToCompany(targetCompanyId.value, {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });
    } else {
      // Company Admin: "Kendi Şirketine Ekle" endpointi
      await companyService.addUserToMyCompany({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });
    }

    await loadCompany(); // Listeyi yenile

    // Formu sıfırla
    form.name = '';
    form.email = '';
    form.password = '';
    form.role = 'MEMBER';

    toast.success('Kullanıcı başarıyla oluşturuldu ve ekibe eklendi.');
  } catch (err: any) {
    console.error(err);
    toast.error(err.response?.data?.message || 'Kullanıcı eklenirken hata oluştu');
  } finally {
    isAdding.value = false;
  }
}

// 3. KULLANICI SİL
async function removeUser(userId: number) {
  if (!confirm("Bu kullanıcıyı şirketten ve sistemden tamamen silmek istediğinize emin misiniz?")) return;

  try {
    if (isSuperAdmin.value) {
      // Super Admin: ID bazlı endpoint
      if (!targetCompanyId.value) return;
      await companyService.removeUserFromCompany(targetCompanyId.value, userId);
    } else {
      // Company Admin: "Kendi Şirketinden Sil" endpointi
      await companyService.removeUserFromMyCompany(userId);
    }

    // Optimistic UI update (Listeden hemen sil)
    if (company.value.users) {
      company.value.users = company.value.users.filter(u => u.id !== userId);
    }
    toast.success('Kullanıcı silindi');
  } catch (err) {
    console.error(err);
    toast.error('Kullanıcı silinemedi');
  }
}

// 4. KULLANICI GÜNCELLE
function openEdit(user: { id: number; name: string; email: string; role: any }) {
  editingUser.value = { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function saveEdit() {
  if (!editingUser.value) return;
  isUpdating.value = true;
  try {
    const payload: any = {
      name: editingUser.value.name,
      email: editingUser.value.email,
      role: editingUser.value.role,
    };
    if (editingUser.value.password && editingUser.value.password.length >= 6) {
      payload.password = editingUser.value.password;
    }
    await userService.updateUser(editingUser.value.id, payload);
    toast.success('Kullanıcı güncellendi');
    await loadCompany();
    editingUser.value = null;
  } catch (err: any) {
    console.error(err);
    toast.error(err.response?.data?.message || 'Kullanıcı güncellenemedi');
  } finally {
    isUpdating.value = false;
  }
}

function cancelEdit() { editingUser.value = null; }

// YARDIMCILAR
const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'COMPANY_ADMIN': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'EDITOR': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'COMPANY_ADMIN': return 'Yönetici';
    case 'EDITOR': return 'Editör';
    case 'MEMBER': return 'Üye';
    case 'SUPER_ADMIN': return 'Sistem Yöneticisi';
    default: return role;
  }
}

onMounted(loadCompany);
</script>