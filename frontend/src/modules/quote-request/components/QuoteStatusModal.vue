<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">{{ t('quoteRequest.updateStatus') }}</h2>
            <button @click="$emit('close')" class="hover:bg-white/20 rounded-lg p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <label class="block text-sm font-semibold text-gray-700 mb-3">{{ t('quoteRequest.newStatus') }}</label>
          <div class="space-y-2">
            <label
              v-for="status in statusOptions"
              :key="status.value"
              class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'border-blue-500 bg-blue-50': selectedStatus === status.value }"
            >
              <input
                type="radio"
                :value="status.value"
                v-model="selectedStatus"
                class="w-4 h-4 text-blue-600"
              />
              <div class="flex items-center gap-2 flex-1">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getStatusBadgeClass(status.value)"
                >
                  {{ status.label }}
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-xl border-t">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleUpdate"
            :disabled="loading || selectedStatus === currentStatus"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? t('common.updating') : t('common.update') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { quoteRequestService, QuoteStatus, type QuoteStatusType } from '../../../services/quoteRequestService';

const { t } = useI18n();

const props = defineProps<{
  quoteRequestId: number;
  currentStatus: QuoteStatusType;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const selectedStatus = ref<QuoteStatusType>(props.currentStatus);
const loading = ref(false);

const statusOptions = computed(() => [
  { value: QuoteStatus.NEW, label: t('quoteRequest.status.new') },
  { value: QuoteStatus.IN_PROGRESS, label: t('quoteRequest.status.inProgress') },
  { value: QuoteStatus.QUOTE_SENT, label: t('quoteRequest.status.quoteSent') },
  { value: QuoteStatus.CANCELLED, label: t('quoteRequest.status.cancelled') },
  { value: QuoteStatus.SALE_COMPLETED, label: t('quoteRequest.status.saleCompleted') },
]);

function getStatusBadgeClass(status: QuoteStatusType): string {
  const color = quoteRequestService.getStatusColor(status);
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800';
}

async function handleUpdate() {
  loading.value = true;
  try {
    await quoteRequestService.updateQuoteStatus(props.quoteRequestId, {
      status: selectedStatus.value,
    });
    emit('updated');
    emit('close');
  } catch (error) {
    console.error('Error updating status:', error);
    alert(t('quoteRequest.updateError'));
  } finally {
    loading.value = false;
  }
}
</script>
