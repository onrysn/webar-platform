<template>
  <div class='p-4'>
    <h1 class='text-xl font-bold mb-4'>Login Page</h1>
    <button @click='login' class='bg-blue-500 text-white px-4 py-2 rounded'>Login</button>
  </div>
</template>

<script lang='ts'>
import { defineComponent } from 'vue';
import { useAuthStore } from '../../store/modules/auth';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const login = () => {
      auth.login('Onur', 'fake-jwt-token');
      alert('Logged in!');
    };
    return { login };
  }
});
</script>
