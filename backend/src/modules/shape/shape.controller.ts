import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShapeService } from './shape.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, ShapeCategory } from '@prisma/client';
import { CreateShapeDto } from './dto/create-shape.dto';
import { UpdateShapeDto } from './dto/update-shape.dto';

@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard)
@ApiBearerAuth('access-token')
@ApiTags('shapes')
@Controller('shapes')
export class ShapeController {
  constructor(private readonly shapeService: ShapeService) {}

  @Get('list')
  @ApiOperation({ summary: 'Şekilleri listeler' })
  @ApiQuery({ name: 'category', required: false, enum: Object.values(ShapeCategory) })
  @ApiQuery({ name: 'activeOnly', required: false })
  async list(
    @Query('category') category?: ShapeCategory,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.shapeService.list(category, activeOnly === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Şekil detayını getirir' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.shapeService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yeni şekil oluşturur (Super Admin)' })
  async create(@Body() dto: CreateShapeDto) {
    return this.shapeService.create(dto);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şekli günceller (Super Admin)' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShapeDto) {
    return this.shapeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Şekli siler (Super Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.shapeService.remove(id);
  }
}
