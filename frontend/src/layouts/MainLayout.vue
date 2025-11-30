<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white flex flex-col">
      <div class="p-4 text-lg font-bold">Dashboard</div>

      <nav class="flex-1 flex flex-col space-y-2 px-4">
        <router-link to="/dashboard" class="hover:underline">Home</router-link>
        <router-link to="/dashboard/profile" class="hover:underline">Profile</router-link>
        <router-link to="/dashboard/projects" class="hover:underline">Projects</router-link>
        <router-link to="/dashboard/settings" class="hover:underline">Settings</router-link>

        <!-- Companies Menü -->
        <div v-if="isAdmin" class="mt-4">
          <div class="font-semibold mb-1">Companies</div>
          <router-link to="/dashboard/companies" class="block hover:underline ml-2">List</router-link>
          <router-link to="/dashboard/companies/create" class="block hover:underline ml-2">Create</router-link>

          <!-- Company Detail Alt Menü (Dropdown) -->
          <div v-if="activeCompanyId" class="ml-2 mt-2 space-y-1">
            <div class="font-medium">Company Options</div>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/update`" class="block hover:underline ml-2">
              Update
            </router-link>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/manage-users`" class="block hover:underline ml-2">
              Manage Users
            </router-link>
            <router-link :to="`/dashboard/companies/${activeCompanyId}/api-key`" class="block hover:underline ml-2">
              API Key
            </router-link>
          </div>
        </div>

        <!-- AR Models Menü (Örnek) -->
        <div v-if="isAdmin" class="mt-4">
          <div class="font-semibold mb-1">AR Models</div>
          <router-link to="/dashboard/ar-model" class="block hover:underline ml-2">List</router-link>
          <router-link to="/dashboard/ar-model/upload" class="block hover:underline ml-2">Upload</router-link>
        </div>
      </nav>

      <!-- Logout -->
      <div class="p-4">
        <button @click="logout" class="w-full bg-red-600 px-3 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-4 bg-gray-50">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/modules/auth';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    const logout = () => {
      auth.logout();
      router.push('/login');
    };

    const activeCompanyId = computed(() => {
      const match = route.path.match(/\/dashboard\/companies\/(\d+)/);
      return match ? match[1] : null;
    });

    // Admin-only kontrolü
    const isAdmin = computed(() => auth.user?.role === 'admin');

    return { logout, activeCompanyId, isAdmin };
  },
});
</script>
