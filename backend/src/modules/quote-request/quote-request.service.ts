import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  CreateQuoteRequestDto,
  UpdateQuoteStatusDto,
  FilterQuoteRequestDto,
  QuoteRequestResponseDto,
  QuoteStatus,
  QuoteStatusType,
} from './dto/quote-request.dto';

@Injectable()
export class QuoteRequestService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async createQuoteRequest(dto: CreateQuoteRequestDto): Promise<QuoteRequestResponseDto> {
    // Get scene with items
    const scene = await this.prisma.aRScene.findUnique({
      where: { id: dto.sceneId },
      include: {
        items: {
          include: {
            model: true,
          },
        },
      },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    // Create quote request with items
    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        sceneId: dto.sceneId,
        companyId: scene.companyId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        items: {
          create: scene.items.map((item) => ({
            modelId: item.modelId,
            quantity: 1,
          })),
        },
      },
      include: {
        scene: true,
        items: {
          include: {
            model: true,
          },
        },
      },
    });

    return this.mapToResponseDto(quoteRequest);
  }

  async getQuoteRequestsForCompany(
    companyId: number,
    filter: FilterQuoteRequestDto,
  ): Promise<{ data: QuoteRequestResponseDto[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          scene: true,
          items: {
            include: {
              model: true,
            },
          },
        },
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return {
      data: data.map((qr) => this.mapToResponseDto(qr)),
      total,
      page,
      limit,
    };
  }

  async getQuoteRequestById(id: number, userId: number, companyId: number): Promise<QuoteRequestResponseDto> {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        scene: true,
        items: {
          include: {
            model: true,
          },
        },
      },
    });

    if (!quoteRequest) {
      throw new NotFoundException('Quote request not found');
    }

    if (quoteRequest.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapToResponseDto(quoteRequest);
  }

  async updateQuoteStatus(
    id: number,
    dto: UpdateQuoteStatusDto,
    userId: number,
    companyId: number,
  ): Promise<QuoteRequestResponseDto> {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!quoteRequest) {
      throw new NotFoundException('Quote request not found');
    }

    if (quoteRequest.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: dto.status },
      include: {
        scene: true,
        items: {
          include: {
            model: true,
          },
        },
      },
    });

    // Log activity
    await this.activityLog.log(
      userId,
      companyId,
      'QUOTE_STATUS_UPDATE',
      `Quote request #${id} status changed to ${dto.status}`,
      { quoteRequestId: id, oldStatus: quoteRequest.status, newStatus: dto.status },
    );

    return this.mapToResponseDto(updated);
  }

  async deleteQuoteRequest(id: number, userId: number, companyId: number): Promise<void> {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!quoteRequest) {
      throw new NotFoundException('Quote request not found');
    }

    if (quoteRequest.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.quoteRequest.delete({
      where: { id },
    });

    await this.activityLog.log(
      userId,
      companyId,
      'QUOTE_REQUEST_DELETE',
      `Quote request #${id} deleted`,
      { quoteRequestId: id },
    );
  }

  async exportToExcel(companyId: number, filter: FilterQuoteRequestDto): Promise<string> {
    const { data } = await this.getQuoteRequestsForCompany(companyId, { ...filter, limit: 10000 });

    // Generate CSV with UTF-8 BOM for Turkish characters
    const csv = this.generateCSV(data);
    return csv;
  }

  private generateCSV(data: QuoteRequestResponseDto[]): string {
    // UTF-8 BOM for Excel to recognize Turkish characters
    const BOM = '\uFEFF';
    
    const headers = [
      'ID',
      'Müşteri Adı',
      'E-posta',
      'Telefon',
      'Sahne',
      'Durum',
      'Ürünler',
      'Notlar',
      'Tarih',
    ];

    const rows = data.map((qr) => [
      qr.id,
      qr.customerName,
      qr.customerEmail,
      qr.customerPhone || '',
      qr.sceneName,
      this.getStatusText(qr.status),
      qr.items.map((item) => `${item.modelName} (${item.quantity})`).join(', '),
      qr.notes || '',
      new Date(qr.createdAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return BOM + csvContent;
  }

  private getStatusText(status: QuoteStatusType): string {
    const statusMap: Record<QuoteStatusType, string> = {
      [QuoteStatus.NEW]: 'Yeni',
      [QuoteStatus.IN_PROGRESS]: 'İşlemde',
      [QuoteStatus.QUOTE_SENT]: 'Teklif Gönderildi',
      [QuoteStatus.CANCELLED]: 'İptal Edildi',
      [QuoteStatus.SALE_COMPLETED]: 'Satış Tamamlandı',
    };
    return statusMap[status] || status;
  }

  private mapToResponseDto(quoteRequest: any): QuoteRequestResponseDto {
    return {
      id: quoteRequest.id,
      sceneId: quoteRequest.sceneId,
      sceneName: quoteRequest.scene.name,
      companyId: quoteRequest.companyId,
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      customerPhone: quoteRequest.customerPhone,
      notes: quoteRequest.notes,
      status: quoteRequest.status,
      items: quoteRequest.items.map((item: any) => ({
        modelId: item.modelId,
        modelName: item.model.fileName,
        quantity: item.quantity,
      })),
      createdAt: quoteRequest.createdAt,
      updatedAt: quoteRequest.updatedAt,
    };
  }
}
