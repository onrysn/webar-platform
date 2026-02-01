<template>
  <div class="api-login-container">
    <div class="loading-box">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../../store/modules/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const message = ref('API key ile giriş yapılıyor...');

onMounted(async () => {
  const token = route.query.token as string;
  const userStr = route.query.user as string;

  if (!token) {
    message.value = 'Token bulunamadı, login sayfasına yönlendiriliyorsunuz...';
    setTimeout(() => router.push('/login'), 2000);
    return;
  }

  try {
    // Token ve user bilgisini store'a ve localStorage'a kaydet
    auth.token = token;
    localStorage.setItem('token', token);

    if (userStr) {
      const user = JSON.parse(decodeURIComponent(userStr));
      auth.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    }

    message.value = 'Giriş başarılı! Yönlendiriliyorsunuz...';
    
    // MEMBER rolü ar-scene'e, diğerleri dashboard'a
    setTimeout(() => {
      if (auth.user?.role === 'MEMBER') {
        router.push('/dashboard/ar-scene');
      } else {
        router.push('/dashboard');
      }
    }, 1000);

  } catch (error) {
    message.value = 'Bir hata oluştu, login sayfasına yönlendiriliyorsunuz...';
    setTimeout(() => router.push('/login'), 2000);
  }
});
</script>

<style scoped>
.api-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-box {
  background: white;
  padding: 40px 60px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-box p {
  color: #374151;
  font-size: 16px;
  margin: 0;
}
</style>
