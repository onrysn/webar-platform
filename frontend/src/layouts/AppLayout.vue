<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useAuthStore } from '../store/modules/auth';

const MainLayout = defineAsyncComponent(() => import('./MainLayout.vue'));
const ViewerLayout = defineAsyncComponent(() => import('./ViewerLayout.vue'));

const auth = useAuthStore();

const layout = computed(() => {
  if (auth.user?.role === 'MEMBER') {
    return ViewerLayout;
  }
  return MainLayout; 
});
</script>