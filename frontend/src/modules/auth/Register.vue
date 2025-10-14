<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-xl font-bold mb-4">Register</h1>
    <form @submit.prevent="submitRegister" class="space-y-4">
      <input v-model="name" type="text" placeholder="Name" class="border p-2 w-full" required />
      <input v-model="email" type="email" placeholder="Email" class="border p-2 w-full" required />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full" required />
      <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded w-full">Register</button>
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useAuthStore } from '../../store/modules/auth';
import router from '../../router';

export default defineComponent({
  setup() {
    const auth = useAuthStore();
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const error = ref('');

    const submitRegister = async () => {
      error.value = '';
      try {
        await auth.register(name.value, email.value, password.value);
        router.push('/dashboard');
      } catch (err: any) {
        error.value = err.message;
      }
    };

    return { name, email, password, submitRegister, error };
  },
});
</script>
