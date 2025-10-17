<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '../../store/modules/auth'

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  // Eğer kullanıcı bilgisi yoksa (sayfa yenilenmiş olabilir)
  if (!auth.user && auth.token) {
    await auth.fetchMe()
  }
})

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <div class="bg-white shadow-lg rounded-xl p-6 w-full max-w-md text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">
        👋 Hoş geldin, {{ auth.user?.name || 'Kullanıcı' }}
      </h1>
      <p class="text-gray-500 mb-6">
        Burası korumalı dashboard alanı.
      </p>

      <button
        @click="logout"
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
      >
        Çıkış Yap
      </button>
    </div>
  </div>
</template>

<style scoped>
body {
  background-color: #f3f4f6;
}
</style>
