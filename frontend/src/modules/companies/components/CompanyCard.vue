<template>
  <div
    class="group relative bg-white border rounded-2xl p-4 transition-all duration-300 flex items-center gap-4 overflow-hidden"
    :class="[
      isDisabled 
        ? 'border-slate-100 bg-slate-50 opacity-60 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' 
        : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
    ]"
    @click="handleClick"
  >
    <div v-if="statusBadge" 
      class="absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[9px] font-bold uppercase tracking-wider border-b border-l z-10"
      :class="statusBadge.classes">
      {{ statusBadge.text }}
    </div>

    <div
      class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300"
      :class="[
        isDisabled 
          ? 'bg-slate-200 border-slate-300 grayscale' 
          : 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600'
      ]"
    >
      <span 
        class="font-black text-lg transition-colors"
        :class="isDisabled ? 'text-slate-400' : 'text-indigo-600 group-hover:text-white'"
      >
        {{ companyInitials }}
      </span>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <h2 
          class="text-base font-bold truncate transition-colors"
          :class="isDisabled ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-700'"
        >
          {{ props.company.name }}
        </h2>
        <span class="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
          #{{ props.company.id }}
        </span>
      </div>

      <div v-if="props.company.subscriptionEndsAt" class="flex items-center gap-1 mb-1.5 text-[10px]">
         <span :class="isExpired ? 'text-red-500 font-bold' : 'text-slate-400'">
            {{ isExpired ? '⚠️ Süresi Doldu:' : '📅 Bitiş:' }} {{ formatDate(props.company.subscriptionEndsAt) }}
         </span>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
        <div class="flex items-center" v-if="props.company.domain">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-slate-400" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span class="truncate max-w-[150px]">{{ props.company.domain }}</span>
        </div>

        <div v-if="props.company._count" class="flex items-center gap-2 pl-3 border-l border-slate-200">
          <span class="flex items-center text-slate-600" title="Kullanıcı Sayısı">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
              </path>
            </svg>
            {{ props.company._count.users || 0 }}
          </span>
          <span class="flex items-center text-slate-600" title="Sahne Sayısı">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
              </path>
            </svg>
            {{ props.company._count.scenes || 0 }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="!isDisabled"
      class="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CompanyDto } from '../dto/company.dto';
// Yolunuz değiştiyse burayı güncelleyin:

const props = defineProps<{
  company: CompanyDto;
  disabledClick?: boolean; // Tıklamayı engellemek istersek dışarıdan prop alabiliriz
}>();

const emit = defineEmits(['click']);

// --- COMPUTED ---

// Tarih geçmiş mi?
const isExpired = computed(() => {
  if (!props.company.subscriptionEndsAt) return false;
  return new Date(props.company.subscriptionEndsAt) < new Date();
});

// Kart Pasif mi? (isActive false YA DA Süresi Dolmuş)
const isDisabled = computed(() => {
  return props.company.isActive === false || isExpired.value;
});

// Köşedeki Etiket
const statusBadge = computed(() => {
  if (props.company.isActive === false) {
    return { text: 'PASİF', classes: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
  if (isExpired.value) {
    return { text: 'SÜRESİ DOLDU', classes: 'bg-red-50 text-red-600 border-red-100' };
  }
  return null;
});

const companyInitials = computed(() => {
  if (!props.company.name) return 'Co';
  return props.company.name
    .split(' ')
    .map((word: string) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

// --- METHODS ---

const handleClick = () => {
  // Pasif olsa bile Super Admin detayına gidip düzenleyebilmeli.
  // Bu yüzden tıklamayı tamamen engellemiyoruz, sadece görsel olarak soluklaştırıyoruz.
  // Eğer engellemek isteseydik: if (isDisabled.value) return; 
  
  emit('click');
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>