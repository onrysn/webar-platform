<template>
  <div class="min-h-full py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
    <div class="max-w-4xl mx-auto space-y-10">

      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ t('settings.title') }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ t('settings.subtitle') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900">{{ t('settings.profile.title') }}</h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('settings.profile.subtitle') }}
          </p>
        </div>

        <div class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 space-y-6">

            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm">
                {{ userInitials }}
              </div>
              <div>
                <button
                  class="text-sm font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors opacity-50 cursor-not-allowed"
                  :title="t('common.comingSoon')">
                  {{ t('settings.profile.changePhoto') }}
                </button>
                <p class="text-xs text-slate-400 mt-1">{{ t('settings.profile.photoHint') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="col-span-2 sm:col-span-1">
                <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('settings.profile.name') }}</label>
                <input v-model="profileForm.name" type="text"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>

              <div class="col-span-2 sm:col-span-1">
                <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('settings.profile.email') }}</label>
                <input v-model="profileForm.email" type="email"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
            <button @click="updateProfile" :disabled="loadingProfile"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-70 flex items-center gap-2">
              <svg v-if="loadingProfile" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ loadingProfile ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>

      <hr class="border-slate-200" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900">{{ t('settings.security.title') }}</h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('settings.security.subtitle') }}
          </p>
        </div>

        <div class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('settings.security.currentPassword') }}</label>
              <input v-model="passwordForm.current" type="password" :placeholder="t('settings.security.currentPasswordPlaceholder')"
                class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('settings.security.newPassword') }}</label>
                <input v-model="passwordForm.new" type="password"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">{{ t('settings.security.confirmPassword') }}</label>
                <input v-model="passwordForm.confirm" type="password"
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>
          <div class="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
            <button @click="updatePassword" :disabled="loadingPass"
              class="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-2.5 px-6 rounded-xl text-sm shadow-sm transition-all flex items-center gap-2">
              <svg v-if="loadingPass" class="animate-spin h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ t('settings.security.updatePassword') }}
            </button>
          </div>
        </div>
      </div>

      <hr class="border-slate-200" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-bold text-slate-900">{{ t('settings.notifications.title') }}</h3>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('settings.notifications.subtitle') }}
          </p>
        </div>

        <div class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="divide-y divide-slate-100">

            <div class="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p class="text-sm font-bold text-slate-800">{{ t('settings.notifications.projectUpdates') }}</p>
                <p class="text-xs text-slate-500">{{ t('settings.notifications.projectUpdatesDesc') }}</p>
              </div>
              <button @click="notifications.projects = !notifications.projects"
                :class="notifications.projects ? 'bg-indigo-600' : 'bg-slate-200'"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                <span :class="notifications.projects ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>

            <div class="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p class="text-sm font-bold text-slate-800">{{ t('settings.notifications.systemAnnouncements') }}</p>
                <p class="text-xs text-slate-500">{{ t('settings.notifications.systemAnnouncementsDesc') }}</p>
              </div>
              <button @click="notifications.system = !notifications.system"
                :class="notifications.system ? 'bg-indigo-600' : 'bg-slate-200'"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                <span :class="notifications.system ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../../store/modules/auth';
import { userService } from '../../../services/userService';
import { useToast } from 'vue-toastification';

const { t } = useI18n();

const auth = useAuthStore();
const toast = useToast();

const loadingProfile = ref(false);
const loadingPass = ref(false);

const profileForm = reactive({
  name: '',
  email: ''
});

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
});

const notifications = reactive({
  projects: true,
  system: false
});

const userInitials = computed(() => {
  const name = profileForm.name || auth.user?.name || 'User';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
});

// Sayfa açılınca verileri doldur
onMounted(async () => {
  if (!auth.user && auth.token) {
    await auth.fetchMe();
  }

  if (auth.user) {
    profileForm.name = auth.user.name;
    profileForm.email = auth.user.email;
  }
});

// Profil Güncelleme (GERÇEK)
const updateProfile = async () => {
  if (!auth.user?.id) return;

  loadingProfile.value = true;
  try {
    await userService.updateUser(auth.user.id, {
      name: profileForm.name,
      email: profileForm.email
    });

    toast.success(t('settings.profile.saveSuccess'));

    auth.user.name = profileForm.name;
    auth.user.email = profileForm.email;

  } catch (e: any) {
    console.error(e);
    toast.error(e.response?.data?.message || t('settings.profile.saveError'));
  } finally {
    loadingProfile.value = false;
  }
};

// Şifre Güncelleme (GERÇEK)
const updatePassword = async () => {
  if (!auth.user?.id) return;

  if (!passwordForm.new || passwordForm.new.length < 6) {
    toast.warning(t('settings.security.passwordMinLength'));
    return;
  }

  if (passwordForm.new !== passwordForm.confirm) {
    toast.warning(t('settings.security.passwordMismatch'));
    return;
  }

  loadingPass.value = true;
  try {
    await userService.updateUser(auth.user.id, {
      password: passwordForm.new
    });

    toast.success(t('settings.security.passwordSuccess'));

    // Formu temizle
    passwordForm.current = '';
    passwordForm.new = '';
    passwordForm.confirm = '';
  } catch (e: any) {
    console.error(e);
    toast.error(e.response?.data?.message || t('settings.security.passwordError'));
  } finally {
    loadingPass.value = false;
  }
};
</script>