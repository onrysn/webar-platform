import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { QuoteRequestService } from './quote-request.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateQuoteRequestDto,
  UpdateQuoteStatusDto,
  FilterQuoteRequestDto,
  QuoteRequestResponseDto,
} from './dto/quote-request.dto';

@ApiTags('Quote Requests')
@Controller('quote-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuoteRequestController {
  constructor(private readonly quoteRequestService: QuoteRequestService) {}

  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Create a quote request (public endpoint)' })
  @ApiResponse({ status: 201, description: 'Quote request created successfully' })
  async createPublicQuoteRequest(@Body() dto: CreateQuoteRequestDto) {
    return this.quoteRequestService.createQuoteRequest(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quote requests for company' })
  @ApiResponse({ status: 200, type: [QuoteRequestResponseDto] })
  async getQuoteRequests(@User() user: any, @Query() filter: FilterQuoteRequestDto) {
    // Super admin can filter by companyId from query, others use their own companyId
    const companyId = user.role === 'SUPER_ADMIN' ? filter.companyId : user.companyId;
    return this.quoteRequestService.getQuoteRequestsForCompany(companyId, filter);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quote request by ID' })
  @ApiResponse({ status: 200, type: QuoteRequestResponseDto })
  async getQuoteRequestById(@Param('id') id: string, @User() user: any) {
    return this.quoteRequestService.getQuoteRequestById(+id, user.id, user.companyId, user.role);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quote request status' })
  @ApiResponse({ status: 200, type: QuoteRequestResponseDto })
  async updateQuoteStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteStatusDto,
    @User() user: any,
  ) {
    return this.quoteRequestService.updateQuoteStatus(+id, dto, user.id, user.companyId, user.role);
  }

  @Get('export/excel')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export quote requests to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportToExcel(
    @User() user: any,
    @Query() filter: FilterQuoteRequestDto,
    @Res() res: Response,
  ) {
    const companyId = user.role === 'SUPER_ADMIN' ? filter.companyId : user.companyId;
    const csv = await this.quoteRequestService.exportToExcel(companyId, filter);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="teklif-talepleri.csv"');
    res.status(HttpStatus.OK).send(csv);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete quote request' })
  @ApiResponse({ status: 204, description: 'Quote request deleted' })
  async deleteQuoteRequest(@Param('id') id: string, @User() user: any) {
    await this.quoteRequestService.deleteQuoteRequest(+id, user.id, user.companyId, user.role);
    return { message: 'Quote request deleted successfully' };
  }
}
