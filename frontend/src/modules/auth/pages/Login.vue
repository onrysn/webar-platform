<template>
  <div class="min-h-screen flex bg-white">

    <div class="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
      <div class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 30px 30px;">
      </div>
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div class="relative z-10 text-center px-12">
        <h2 class="text-4xl font-extrabold text-white mb-6 tracking-tight">{{ t('auth.login.hero.title') }}</h2>
        <p class="text-slate-400 text-lg leading-relaxed">
          {{ t('auth.login.hero.subtitle') }}
        </p>
        <div class="mt-12 flex justify-center">
          <div
            class="w-32 h-32 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-3xl shadow-2xl flex items-center justify-center transform rotate-12 border border-white/10 backdrop-blur-sm">
            <span class="text-6xl">📦</span>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
      <!-- Language Switcher -->
      <div class="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="light" />
      </div>

      <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">

        <div class="text-center mb-10">
          <h1 class="text-2xl font-bold text-slate-900">{{ t('auth.login.title') }}</h1>
          <p class="text-slate-500 text-sm mt-2">{{ t('auth.login.subtitle') }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('auth.login.email') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input v-model="email" type="email" :placeholder="t('auth.login.emailPlaceholder')"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('auth.login.password') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <input v-model="password" type="password" :placeholder="t('auth.login.passwordPlaceholder')"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember_me" type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
              <label for="remember_me" class="ml-2 block text-sm text-slate-600">{{ t('auth.login.rememberMe') }}</label>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">{{ t('auth.login.forgotPassword') }}</a>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
          </div>

          <button type="submit" :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">

            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ isLoading ? t('auth.login.loggingIn') : t('auth.login.loginButton') }}
          </button>
        </form>

        <div class="mt-8 text-center border-t border-slate-100 pt-6">
          <p class="text-sm text-slate-500">
            {{ t('auth.login.noAccount') }}
            <router-link to="/register" class="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
              {{ t('auth.login.registerNow') }}
            </router-link>
          </p>
        </div>

        <div class="mt-4 text-center">
          <p class="text-xs text-slate-400">
            {{ t('auth.login.copyright') }}
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../store/modules/auth';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../../../components/LanguageSwitcher.vue';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const email = ref('onur@gmail.com');
const password = ref('217070');

const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    await auth.login({
      email: email.value,
      password: password.value
    });

    // Başarılı giriş sonrası yönlendirme
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.message || t('auth.login.error');
  } finally {
    isLoading.value = false;
  }
};
</script>