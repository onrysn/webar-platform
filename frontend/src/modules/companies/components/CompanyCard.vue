<template>
  <div
    class="p-4 border rounded-lg shadow hover:shadow-md cursor-pointer transition"
    @click="$emit('click')"
  >
    <h2 class="text-lg font-semibold">{{ props.company.name }}</h2>
    <p class="text-gray-500 text-sm">{{ props.company.domain }}</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface Company {
  id: number;
  name: string;
  domain: string;
}

const props = defineProps<{
  company: Company;
}>();
</script>
