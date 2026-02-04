<template>
  <div class="relative" ref="dropdownRef">
    <button @click="toggleDropdown" ref="buttonRef"
      :class="variant === 'light' 
        ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shadow-sm">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span class="text-xs font-bold uppercase">{{ currentLocale }}</span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <teleport to="body">
      <div v-if="isOpen"
        :style="{ top: dropdownPosition.top, left: dropdownPosition.left }"
        :class="variant === 'light' 
          ? 'bg-white border-slate-200'
          : 'bg-slate-800 border-slate-700'"
        class="fixed w-48 rounded-lg shadow-xl border py-1 z-[99999]">
        <button v-for="lang in languages" :key="lang.code" @click="changeLanguage(lang.code)"
          :class="[
            variant === 'light' 
              ? currentLocale === lang.code 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-700 hover:bg-slate-50'
              : currentLocale === lang.code 
                ? 'text-indigo-400 bg-slate-700/50' 
                : 'text-slate-300 hover:bg-slate-700'
          ]"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors">
          <span class="text-xl">{{ lang.flag }}</span>
          <span class="font-medium">{{ lang.name }}</span>
          <svg v-if="currentLocale === lang.code" 
            :class="variant === 'light' ? 'text-indigo-600' : 'text-indigo-400'"
            class="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  variant?: 'dark' | 'light';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dark'
});

const { locale } = useI18n();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const dropdownPosition = ref({ top: '0px', left: '0px' });

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const currentLocale = computed(() => locale.value);

const updateDropdownPosition = () => {
  if (buttonRef.value) {
    const rect = buttonRef.value.getBoundingClientRect();
    const dropdownWidth = 192; // w-48 = 12rem = 192px
    
    // Calculate position (align to right of button)
    let left = rect.right - dropdownWidth;
    
    // Ensure dropdown stays within viewport
    if (left < 8) left = 8;
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    
    dropdownPosition.value = {
      top: `${rect.bottom + 8}px`,
      left: `${left}px`
    };
  }
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updateDropdownPosition();
  }
};

const changeLanguage = (lang: string) => {
  locale.value = lang;
  localStorage.setItem('locale', lang);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

watch(isOpen, (newVal) => {
  if (newVal) {
    // Update position when opening
    setTimeout(updateDropdownPosition, 0);
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', updateDropdownPosition, true);
  window.addEventListener('resize', updateDropdownPosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updateDropdownPosition, true);
  window.removeEventListener('resize', updateDropdownPosition);
});
</script>
