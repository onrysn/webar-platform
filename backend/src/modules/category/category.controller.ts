import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role, CategoryType } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard)
@ApiBearerAuth('access-token')
@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  @ApiOperation({ summary: 'Kategorileri listeler' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CategoryType })
  async list(
    @User() user: CurrentUser,
    @Query('companyId') companyIdQuery?: string,
    @Query('parentId') parentIdQuery?: string,
    @Query('type') typeQuery?: CategoryType,
  ) {
    let companyId: number | undefined;
    if (user.role === Role.SUPER_ADMIN) {
      // Super admin: companyId query'den gelirse onu kullan, yoksa tümünü getir
      companyId = companyIdQuery ? Number(companyIdQuery) : undefined;
    } else {
      // Diğer roller: kendi şirketini kullan
      companyId = user.companyId ?? undefined;
      if (!companyId) throw new BadRequestException('Şirket bilgisi bulunamadı.');
    }
    const parentId = parentIdQuery ? Number(parentIdQuery) : undefined;
    return this.categoryService.list(companyId, parentId, typeQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kategori detayını getirir' })
  async getById(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    const category = await this.categoryService.getById(id);
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && category.companyId !== user.companyId) {
      throw new NotFoundException('Kategori bulunamadı');
    }
    return category;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Yeni kategori oluşturur' })
  async create(@User() user: CurrentUser, @Body() dto: CreateCategoryDto) {
    let targetCompanyId = user.companyId;
    if (user.role === Role.SUPER_ADMIN && dto.companyId) targetCompanyId = dto.companyId;
    if (!targetCompanyId) throw new BadRequestException('Şirket bilgisi bulunamadı.');
    return this.categoryService.create(user, { ...dto, companyId: targetCompanyId });
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Kategoriyi günceller' })
  async update(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categoryService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Kategoriyi siler (soft delete)' })
  async remove(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(user, id);
  }
}
