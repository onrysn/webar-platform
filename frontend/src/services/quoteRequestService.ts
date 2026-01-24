import httpClient from './httpService/httpService';

// QuoteStatus as const assertion
export const QuoteStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  QUOTE_SENT: 'QUOTE_SENT',
  CANCELLED: 'CANCELLED',
  SALE_COMPLETED: 'SALE_COMPLETED',
} as const;

export type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export interface CreateQuoteRequestDto {
  sceneId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export interface UpdateQuoteStatusDto {
  status: QuoteStatusType;
}

export interface FilterQuoteRequestDto {
  status?: QuoteStatusType;
  page?: number;
  limit?: number;
}

export interface QuoteRequestItem {
  modelId: number;
  modelName: string;
  quantity: number;
}

export interface QuoteRequest {
  id: number;
  sceneId: number;
  sceneName: string;
  companyId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  status: QuoteStatusType;
  items: QuoteRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRequestListResponse {
  data: QuoteRequest[];
  total: number;
  page: number;
  limit: number;
}

class QuoteRequestService {
  async createPublicQuoteRequest(dto: CreateQuoteRequestDto): Promise<QuoteRequest> {
    const response = await httpClient.post<QuoteRequest>('/quote-requests/public', dto);
    return response.data;
  }

  async getQuoteRequests(filter?: FilterQuoteRequestDto): Promise<QuoteRequestListResponse> {
    const response = await httpClient.get<QuoteRequestListResponse>('/quote-requests', {
      params: filter,
    });
    return response.data;
  }

  async getQuoteRequestById(id: number): Promise<QuoteRequest> {
    const response = await httpClient.get<QuoteRequest>(`/quote-requests/${id}`);
    return response.data;
  }

  async updateQuoteStatus(id: number, dto: UpdateQuoteStatusDto): Promise<QuoteRequest> {
    const response = await httpClient.patch<QuoteRequest>(`/quote-requests/${id}/status`, dto);
    return response.data;
  }

  async deleteQuoteRequest(id: number): Promise<void> {
    await httpClient.delete(`/quote-requests/${id}`);
  }

  async exportToExcel(filter?: FilterQuoteRequestDto): Promise<void> {
    const response = await httpClient.get('/quote-requests/export/excel', {
      params: filter,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teklif-talepleri-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusText(status: QuoteStatusType): string {
    const statusMap: Record<QuoteStatusType, string> = {
      [QuoteStatus.NEW]: 'Yeni',
      [QuoteStatus.IN_PROGRESS]: 'İşlemde',
      [QuoteStatus.QUOTE_SENT]: 'Teklif Gönderildi',
      [QuoteStatus.CANCELLED]: 'İptal Edildi',
      [QuoteStatus.SALE_COMPLETED]: 'Satış Tamamlandı',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: QuoteStatusType): string {
    const colorMap: Record<QuoteStatusType, string> = {
      [QuoteStatus.NEW]: 'blue',
      [QuoteStatus.IN_PROGRESS]: 'yellow',
      [QuoteStatus.QUOTE_SENT]: 'purple',
      [QuoteStatus.CANCELLED]: 'red',
      [QuoteStatus.SALE_COMPLETED]: 'green',
    };
    return colorMap[status] || 'gray';
  }
}

export const quoteRequestService = new QuoteRequestService();
