import { IsString, IsEmail, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// QuoteStatus as const assertion instead of enum (erasableSyntaxOnly)
export const QuoteStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  QUOTE_SENT: 'QUOTE_SENT',
  CANCELLED: 'CANCELLED',
  SALE_COMPLETED: 'SALE_COMPLETED',
} as const;

export type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export class CreateQuoteRequestDto {
  @ApiProperty({ description: 'ID sahne yang diminta' })
  @IsInt()
  sceneId: number;

  @ApiProperty({ description: 'Nama pelanggan' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Email pelanggan' })
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({ description: 'Nomor telepon pelanggan' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateQuoteStatusDto {
  @ApiProperty({ 
    description: 'Status baru permintaan penawaran',
    enum: Object.values(QuoteStatus)
  })
  @IsEnum(QuoteStatus)
  status: QuoteStatusType;
}

export class FilterQuoteRequestDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan status' })
  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatusType;

  @ApiPropertyOptional({ description: 'Sayfa numarası', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Sayfa başına öğe sayısı', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Şirket ID (sadece super admin için)' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  companyId?: number;
}

export class QuoteRequestItemDto {
  modelId: number;
  modelName: string;
  modelThumbnail?: string;
  quantity: number;
}

export class QuoteRequestResponseDto {
  id: number;
  sceneId: number;
  sceneName: string;
  companyId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  status: QuoteStatusType;
  items: QuoteRequestItemDto[];
  createdAt: Date;
  updatedAt: Date;
}
