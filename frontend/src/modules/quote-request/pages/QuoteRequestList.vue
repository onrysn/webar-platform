<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Teklif Talepleri</h1>
        <p class="text-gray-600 mt-1">Müşterilerden gelen teklif taleplerini görüntüleyin ve yönetin</p>
      </div>

      <!-- Filters & Actions -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex gap-3 flex-wrap items-center">
          <!-- Status Filter -->
          <select
            v-model="filter.status"
            @change="loadQuoteRequests"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="undefined">Tüm Durumlar</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>

          <!-- Limit Filter -->
          <select
            v-model.number="filter.limit"
            @change="loadQuoteRequests"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="10">10 kayıt</option>
            <option :value="25">25 kayıt</option>
            <option :value="50">50 kayıt</option>
            <option :value="100">100 kayıt</option>
          </select>
        </div>

        <!-- Export Button -->
        <button
          @click="exportToExcel"
          class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV İndir
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="text-gray-600 mt-4">Yükleniyor...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!quoteRequests.length" class="bg-white rounded-xl shadow-sm p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Henüz teklif talebi yok</h3>
        <p class="text-gray-600">Müşteriler sahne görüntüleyiciden teklif talebinde bulunduğunda burada görünecek</p>
      </div>

      <!-- Quote Requests List -->
      <div v-else class="space-y-4">
        <div
          v-for="quote in quoteRequests"
          :key="quote.id"
          class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">{{ quote.customerName }}</h3>
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(quote.status)"
                >
                  {{ quoteRequestService.getStatusText(quote.status) }}
                </span>
              </div>
              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {{ quote.customerEmail }}
                </div>
                <div v-if="quote.customerPhone" class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ quote.customerPhone }}
                </div>
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  Sahne: <strong>{{ quote.sceneName }}</strong>
                </div>
                <div class="flex items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ formatDate(quote.createdAt) }}
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="openStatusModal(quote)"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Durum Güncelle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="deleteQuote(quote.id)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Items -->
          <div v-if="quote.items.length" class="mt-4 pt-4 border-t">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Ürünler ({{ quote.items.length }})</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="item in quote.items"
                :key="item.modelId"
                class="px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-700"
              >
                {{ item.modelName }} ({{ item.quantity }}x)
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="quote.notes" class="mt-4 pt-4 border-t">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Notlar</h4>
            <p class="text-sm text-gray-600">{{ quote.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center gap-2">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          "
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- Status Update Modal -->
    <QuoteStatusModal
      v-if="selectedQuote"
      :quoteRequestId="selectedQuote.id"
      :currentStatus="selectedQuote.status"
      @close="selectedQuote = null"
      @updated="handleStatusUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { quoteRequestService, type QuoteRequest, type QuoteStatusType, QuoteStatus } from '../../../services/quoteRequestService';
import QuoteStatusModal from '../components/QuoteStatusModal.vue';

const quoteRequests = ref<QuoteRequest[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalItems = ref(0);
const selectedQuote = ref<QuoteRequest | null>(null);

const filter = ref({
  status: undefined as QuoteStatusType | undefined,
  limit: 10,
});

const statusOptions = [
  { value: QuoteStatus.NEW, label: 'Yeni' },
  { value: QuoteStatus.IN_PROGRESS, label: 'İşlemde' },
  { value: QuoteStatus.QUOTE_SENT, label: 'Teklif Gönderildi' },
  { value: QuoteStatus.CANCELLED, label: 'İptal Edildi' },
  { value: QuoteStatus.SALE_COMPLETED, label: 'Satış Tamamlandı' },
];

const totalPages = computed(() => Math.ceil(totalItems.value / filter.value.limit));

async function loadQuoteRequests() {
  loading.value = true;
  try {
    const response = await quoteRequestService.getQuoteRequests({
      ...filter.value,
      page: currentPage.value,
    });
    quoteRequests.value = response.data;
    totalItems.value = response.total;
  } catch (error) {
    console.error('Error loading quote requests:', error);
  } finally {
    loading.value = false;
  }
}

function goToPage(page: number) {
  currentPage.value = page;
  loadQuoteRequests();
}

function openStatusModal(quote: QuoteRequest) {
  selectedQuote.value = quote;
}

function handleStatusUpdated() {
  loadQuoteRequests();
}

async function deleteQuote(id: number) {
  if (!confirm('Bu teklif talebini silmek istediğinizden emin misiniz?')) return;

  try {
    await quoteRequestService.deleteQuoteRequest(id);
    loadQuoteRequests();
  } catch (error) {
    console.error('Error deleting quote request:', error);
    alert('Silme işlemi sırasında bir hata oluştu');
  }
}

async function exportToExcel() {
  try {
    await quoteRequestService.exportToExcel(filter.value);
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Dışa aktarma sırasında bir hata oluştu');
  }
}

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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  loadQuoteRequests();
});
</script>
