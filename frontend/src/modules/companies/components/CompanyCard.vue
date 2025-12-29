<template>
  <div
    class="group relative bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center gap-4"
    @click="$emit('click')">
    <div
      class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors duration-300">
      <span class="font-black text-indigo-600 text-lg group-hover:text-white transition-colors">
        {{ companyInitials }}
      </span>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <h2 class="text-base font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
          {{ props.company.name }}
        </h2>
        <span class="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
          #{{ props.company.id }}
        </span>
      </div>

      <div class="flex items-center text-slate-500 text-xs font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span class="truncate">{{ props.company.domain }}</span>
      </div>
    </div>

    <div
      class="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Company {
  id: number;
  name: string;
  domain: string;
}

const props = defineProps<{
  company: Company;
}>();

const companyInitials = computed(() => {
  if (!props.company.name) return 'Co';
  return props.company.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});
</script>