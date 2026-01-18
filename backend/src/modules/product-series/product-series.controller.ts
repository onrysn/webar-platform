import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductSeriesService } from './product-series.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard)
@ApiBearerAuth('access-token')
@ApiTags('series')
@Controller('series')
export class ProductSeriesController {
  constructor(private readonly seriesService: ProductSeriesService) {}

  @Get('list')
  @ApiOperation({ summary: 'Serileri listeler' })
  @ApiQuery({ name: 'companyId', required: false })
  async list(
    @User() user: CurrentUser,
    @Query('companyId') companyIdQuery?: string,
  ) {
    const companyId = user.role === Role.SUPER_ADMIN && companyIdQuery ? Number(companyIdQuery) : user.companyId;
    if (!companyId) throw new BadRequestException('Şirket bilgisi bulunamadı.');
    return this.seriesService.list(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Seri detayını getirir' })
  async getById(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    const series = await this.seriesService.getById(id);
    if (!series) throw new NotFoundException('Seri bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && series.companyId !== user.companyId) {
      throw new NotFoundException('Seri bulunamadı');
    }
    return series;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Yeni seri oluşturur' })
  async create(@User() user: CurrentUser, @Body() dto: CreateSeriesDto) {
    let targetCompanyId = user.companyId;
    if (user.role === Role.SUPER_ADMIN && dto.companyId) targetCompanyId = dto.companyId;
    if (!targetCompanyId) throw new BadRequestException('Şirket bilgisi bulunamadı.');
    return this.seriesService.create(user, { ...dto, companyId: targetCompanyId });
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Seriyi günceller' })
  async update(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSeriesDto
  ) {
    return this.seriesService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Seriyi siler (soft delete)' })
  async remove(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.seriesService.remove(user, id);
  }
}
