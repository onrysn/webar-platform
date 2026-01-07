<template>
  <div class="min-h-screen flex bg-white">

    <div class="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
      <div class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(#10b981 1px, transparent 1px); background-size: 30px 30px;">
      </div>

      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>

      <div class="relative z-10 text-center px-12">
        <h2 class="text-4xl font-extrabold text-white mb-6 tracking-tight">Aramıza Katılın</h2>
        <p class="text-slate-400 text-lg leading-relaxed">
          WebAR Studio ile hayal gücünüzü 3. boyuta taşıyın. Dakikalar içinde kendi AR sahnenizi oluşturun.
        </p>
        <div class="mt-12 flex justify-center">
          <div
            class="w-32 h-32 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-3xl shadow-2xl flex items-center justify-center transform -rotate-6 border border-white/10 backdrop-blur-sm">
            <span class="text-6xl">🚀</span>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
      <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">

        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-slate-900">Hesap Oluştur</h1>
          <p class="text-slate-500 text-sm mt-2">Tüm özelliklere erişmek için bilgilerinizi girin.</p>
        </div>

        <form @submit.prevent="submitRegister" class="space-y-5">

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Ad Soyad</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <input v-model="name" type="text" placeholder="Adınız Soyadınız"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Şirket Adı</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <input v-model="companyName" type="text" placeholder="Şirketinizin Adı (Örn: Tech A.Ş.)"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">E-posta Adresi</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input v-model="email" type="email" placeholder="ornek@sirket.com"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                  fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <input v-model="password" type="password" placeholder="Güçlü bir şifre seçin"
                class="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm"
                required />
            </div>
            <p class="mt-1 text-xs text-slate-400">En az 6 karakter olmalıdır.</p>
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
          </div>

          <button type="submit" :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">

            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ isLoading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol' }}
          </button>

        </form>

        <div class="mt-8 text-center border-t border-slate-100 pt-6">
          <p class="text-sm text-slate-500">
            Zaten bir hesabınız var mı?
            <router-link to="/login" class="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
              Giriş Yap
            </router-link>
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

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const companyName = ref(''); // [YENİ]: Şirket Adı
const email = ref('');
const password = ref('');

const error = ref('');
const isLoading = ref(false);

const submitRegister = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    // Backend RegisterDto'ya uygun şekilde verileri gönderiyoruz
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      companyName: companyName.value // [YENİ]
    });

    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.message || 'Kayıt işlemi sırasında bir hata oluştu.';
  } finally {
    isLoading.value = false;
  }
};
</script>