<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-gray-800 text-white p-4 flex space-x-4">
      <router-link to="/dashboard" class="hover:underline">Home</router-link>
      <router-link to="/dashboard/profile" class="hover:underline">Profile</router-link>
      <router-link to="/dashboard/projects" class="hover:underline">Projects</router-link>
      <router-link to="/dashboard/settings" class="hover:underline">Settings</router-link>
      <button @click="logout" class="ml-auto bg-red-600 px-3 py-1 rounded">Logout</button>
    </nav>

    <main class="flex-1 p-4">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthStore } from '../store/modules/auth';
import { useRouter } from 'vue-router';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const router = useRouter();

    const logout = () => {
      auth.logout();
      router.push('/login');
    };

    return { logout };
  },
});
</script>
