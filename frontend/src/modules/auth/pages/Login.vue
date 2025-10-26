<template>
  <div class='p-4 max-w-md mx-auto'>
    <h1 class='text-xl font-bold mb-4'>Login Page</h1>
    <form @submit.prevent="submit" class="space-y-4">
      <input v-model="email" type="email" placeholder="Email" class="border p-2 w-full" required />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full" required />
      <button type="submit" class='bg-blue-500 text-white px-4 py-2 rounded w-full'>Login</button>
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </form>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref } from 'vue';
import { useAuthStore } from '../../../store/modules/auth';
import router from '../../../router';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const email = ref('onur@gmail.com');
    const password = ref('217070');
    const error = ref('');

    const submit = async () => {
      error.value = '';
      try {
        await auth.login({ email: email.value, password: password.value });
        router.push('/dashboard');
      } catch (err: any) {
        error.value = err.message;
      }
    };

    return { email, password, submit, error };
  }
});
</script>
