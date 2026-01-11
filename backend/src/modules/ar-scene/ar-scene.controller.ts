import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, ParseIntPipe, BadRequestException, Req } from '@nestjs/common';
import { ARSceneService } from './ar-scene.service';
import {
  CreateSceneDto,
  UpdateSceneDto,
  AddSceneItemDto,
  UpdateSceneItemDto,
  CreateFloorTextureDto
} from './dto/ar-scene.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

// --- GÜVENLİK IMPORTLARI ---
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';

@ApiTags('ar-scene')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard)
@Controller('ar-scene')
export class ARSceneController {
  constructor(private readonly arSceneService: ARSceneService) { }

  // =================================================================
  // 1. ÖZEL ENDPOINTLER (STATIC ROUTES)
  // =================================================================

  @Get('textures')
  @ApiOperation({ summary: 'Kullanılabilir zemin dokularını listeler' })
  listTextures() {
    return this.arSceneService.listFloorTextures();
  }

  @Post('textures')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yeni zemin dokusu tanımlar (Sadece Super Admin)' })
  createTexture(@User() user: CurrentUser, @Body() dto: CreateFloorTextureDto) {
    return this.arSceneService.createFloorTexture(user.id, dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Şirkete ait sahneleri listeler' })
  @ApiQuery({ name: 'companyId', type: Number, required: false, description: 'Sadece Super Admin için' })
  listScenes(
    @User() user: CurrentUser,
    @Query('companyId') queryCompanyId?: string
  ) {
    let targetCompanyId: number | undefined = user.companyId || undefined;

    if (user.role === Role.SUPER_ADMIN && queryCompanyId) {
      targetCompanyId = Number(queryCompanyId);
    }

    if (!targetCompanyId && user.role !== Role.SUPER_ADMIN) {
      return [];
    }

    const onlyPublic = user.role === Role.MEMBER;

    return this.arSceneService.listScenes(targetCompanyId, onlyPublic);
  }

  // =================================================================
  // 2. ITEM (OBJE) ENDPOINTLERİ
  // =================================================================

  @Post('item')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Mevcut bir sahneye model ekler' })
  addItem(@User() user: CurrentUser, @Body() dto: AddSceneItemDto) {
    return this.arSceneService.addItemToScene(user, dto);
  }

  @Patch('item/:itemId')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Sahnedeki bir objenin konumunu günceller' })
  updateItem(
    @User() user: CurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateSceneItemDto
  ) {
    return this.arSceneService.updateItemTransform(user, itemId, dto);
  }

  @Delete('item/:itemId')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Sahneden bir objeyi siler' })
  removeItem(@User() user: CurrentUser, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.arSceneService.removeItem(user, itemId);
  }

  // =================================================================
  // 3. GENEL SAHNE ENDPOINTLERİ
  // =================================================================

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Yeni bir sahne oluşturur' })
  createScene(@User() user: CurrentUser, @Body() dto: CreateSceneDto) {
    return this.arSceneService.createScene(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sahne detayını getirir' })
  getScene(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.getScene(user, id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Sahne bilgilerini (ad, ayarlar, gizlilik) günceller' })
  updateScene(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSceneDto
  ) {
    return this.arSceneService.updateScene(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Sahneyi siler (Soft Delete)' })
  deleteScene(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.deleteScene(user, id);
  }

  // =================================================================
  // 4. PAYLAŞIM VE TOKEN (YENİ)
  // =================================================================

  @Post(':id/share-token')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Sahne için paylaşılabilir public link oluşturur' })
  async generateShareToken(
    @Param('id', ParseIntPipe) id: number,
    @User() user: CurrentUser,
    @Req() req: Request
  ) {
    const result = await this.arSceneService.generateShareToken(id, user);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const fullUrl = `${protocol}://${host}/view/scene/${result.shareToken}`; // URL yapısı: /view/scene/:token

    return {
      shareToken: result.shareToken,
      url: fullUrl
    };
  }

  @Post(':id/revoke-token')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Paylaşım linkini iptal eder' })
  async revokeShareToken(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
    return this.arSceneService.revokeShareToken(id, user);
  }
}