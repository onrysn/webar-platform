<template>
  <div class="min-h-screen bg-gray-50/50 p-6 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ t('quoteRequests.title') }}</h1>
          <p class="text-gray-500 mt-1 text-sm">{{ t('quoteRequests.subtitle') }}</p>
        </div>
        <button
          @click="exportToExcel"
          class="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-green-200 focus:ring-4 focus:ring-green-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {{ t('common.export') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="flex flex-wrap gap-3 w-full md:w-auto">
          <div v-if="authStore.isSuperAdmin" class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <select
              v-model.number="filter.companyId"
              @change="loadQuoteRequests"
              class="pl-10 pr-8 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all w-full md:w-48 cursor-pointer hover:bg-gray-100"
            >
              <option :value="undefined">{{ t('common.all') }}</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>

          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <select
              v-model="filter.status"
              @change="loadQuoteRequests"
              class="pl-10 pr-8 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all w-full md:w-48 cursor-pointer hover:bg-gray-100"
            >
              <option :value="undefined">{{ t('common.all') }}</option>
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>{{ t('quoteRequests.perPage') }}:</span>
          <select
            v-model.number="filter.limit"
            @change="loadQuoteRequests"
            class="py-1.5 pl-3 pr-8 bg-transparent border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p class="text-gray-500 mt-4 text-sm font-medium">{{ t('common.loading') }}</p>
      </div>

      <div v-else-if="!quoteRequests.length" class="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{{ t('quoteRequests.noRequests') }}</h3>
        <p class="text-gray-500 max-w-sm mx-auto">{{ t('quoteRequests.subtitle') }}</p>
      </div>

      <div v-else class="grid gap-6">
        <div
          v-for="quote in quoteRequests"
          :key="quote.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 group overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center text-lg font-bold border border-blue-100">
                  {{ quote.customerName.charAt(0).toUpperCase() }}
                </div>
                
                <div>
                  <h3 class="text-lg font-bold text-gray-900 leading-tight">{{ quote.customerName }}</h3>
                  
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <a :href="`mailto:${quote.customerEmail}`" class="flex items-center hover:text-blue-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {{ quote.customerEmail }}
                    </a>
                    <a v-if="quote.customerPhone" :href="`tel:${quote.customerPhone}`" class="flex items-center hover:text-blue-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {{ quote.customerPhone }}
                    </a>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset"
                  :class="getStatusBadgeClass(quote.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(quote.status)"></span>
                  {{ quoteRequestService.getStatusText(quote.status) }}
                </span>
                <span class="text-xs text-gray-400 font-medium">
                  {{ formatDate(quote.createdAt) }}
                </span>
              </div>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-4">
              <div class="inline-flex items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span class="mr-1">{{ t('quoteRequests.scene') }}:</span>
                <strong class="font-semibold text-gray-900 mr-2">{{ quote.sceneName }}</strong>
                <router-link
                  :to="`/editor/scene/${quote.sceneId}`"
                  class="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ({{ t('quoteRequests.view') }})
                </router-link>
              </div>

              <div v-if="quote.notes" class="flex-1 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {{ quote.notes }}
               </div>
            </div>
          </div>

          <div v-if="quote.items.length" class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex-1 w-full overflow-hidden">
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('quoteRequests.requestedProducts') }} ({{ getTotalQuantity(quote.items) }})</div>
              <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <router-link
                  v-for="item in groupItems(quote.items)"
                  :key="item.modelId"
                  :to="`/dashboard/ar-model/${item.modelId}`"
                  class="flex-shrink-0 group/item relative w-16 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors"
                  :title="item.modelName"
                >
                  <img
                    v-if="item.modelThumbnail"
                    :src="arModelService.getPreviewUrl(item.modelThumbnail)"
                    class="w-full h-full object-contain p-1"
                    @error="(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=Img'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="absolute bottom-0 right-0 bg-gray-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md">
                    x{{ item.quantity }}
                  </div>
                </router-link>
              </div>
            </div>

            <div class="flex items-center gap-2 w-full md:w-auto md:justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
               <button
                @click="openStatusModal(quote)"
                class="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ t('common.status') }}
              </button>
              <button
                @click="deleteQuote(quote.id)"
                class="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center pt-6">
        <nav class="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="
              page === currentPage
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-gray-50'
            "
          >
            {{ page }}
          </button>
        </nav>
      </div>
    </div>

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
import { useI18n } from 'vue-i18n';
import { quoteRequestService, type QuoteRequest, type QuoteStatusType, QuoteStatus } from '../../../services/quoteRequestService';
import { companyService } from '../../../services/companyService';
import { arModelService } from '../../../services/arModelService';
import type { CompanyDto } from '../../companies/dto/company.dto';
import { useAuthStore } from '../../../store/modules/auth';
import QuoteStatusModal from '../components/QuoteStatusModal.vue';

const { t } = useI18n();

const authStore = useAuthStore();
const quoteRequests = ref<QuoteRequest[]>([]);
const companies = ref<CompanyDto[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalItems = ref(0);
const selectedQuote = ref<QuoteRequest | null>(null);

const filter = ref({
  status: undefined as QuoteStatusType | undefined,
  limit: 10,
  companyId: undefined as number | undefined,
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

// Modern Badge Styling
function getStatusBadgeClass(status: QuoteStatusType): string {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20', // New
    yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20', // In Progress
    purple: 'bg-purple-50 text-purple-700 ring-purple-600/20', // Quote Sent
    red: 'bg-red-50 text-red-700 ring-red-600/10', // Cancelled
    green: 'bg-green-50 text-green-700 ring-green-600/20', // Completed
  };
  const baseColor = quoteRequestService.getStatusColor(status);
  return colorMap[baseColor] || 'bg-gray-50 text-gray-600 ring-gray-500/10';
}

function getStatusDotClass(status: QuoteStatusType): string {
   const baseColor = quoteRequestService.getStatusColor(status);
   const dotMap: Record<string, string> = {
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    green: 'bg-green-600',
   }
   return dotMap[baseColor] || 'bg-gray-500';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  // Daha modern, kısa tarih formatı
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function groupItems(items: any[]) {
  const grouped = new Map();
  items.forEach(item => {
    if (grouped.has(item.modelId)) {
      grouped.get(item.modelId).quantity += item.quantity;
    } else {
      grouped.set(item.modelId, { ...item });
    }
  });
  return Array.from(grouped.values());
}

function getTotalQuantity(items: any[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

onMounted(async () => {
  if (authStore.isSuperAdmin) {
    try {
      companies.value = await companyService.getAllCompanies();
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }
  loadQuoteRequests();
});
</script>

<style scoped>
/* Yatay kaydırma çubuğunu gizlemek için yardımcı stil */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>