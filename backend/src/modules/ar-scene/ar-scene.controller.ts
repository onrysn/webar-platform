import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
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

// --- YENİ GÜVENLİK IMPORTLARI ---
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('ar-scene')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard) // Guardlar aktif
@Controller('ar-scene')
export class ARSceneController {
  constructor(private readonly arSceneService: ARSceneService) { }

  // =================================================================
  // 1. ÖZEL ENDPOINTLER (STATIC ROUTES)
  // =================================================================

  @Get('textures')
  @ApiOperation({ summary: 'Kullanılabilir zemin dokularını listeler' })
  // Rol kısıtlaması yok, login olan herkes görebilir.
  listTextures() {
    return this.arSceneService.listFloorTextures();
  }

  @Post('textures')
  @Roles(Role.SUPER_ADMIN) // Sadece SEN (Super Admin) doku ekleyebilirsin
  @ApiOperation({ summary: 'Yeni zemin dokusu tanımlar (Sadece Super Admin)' })
  createTexture(@User() user: CurrentUser, @Body() dto: CreateFloorTextureDto) {
    // Servis, loglama için user ID'ye ihtiyaç duyabilir
    return this.arSceneService.createFloorTexture(user.id, dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Şirkete ait sahneleri listeler' })
  @ApiQuery({ name: 'companyId', type: Number, required: false, description: 'Sadece Super Admin için' })
  listScenes(
    @User() user: CurrentUser,
    @Query('companyId') queryCompanyId?: string
  ) {
    // 1. Senaryo: Super Admin
    if (user.role === Role.SUPER_ADMIN) {
      // Eğer query varsa o şirketi, yoksa (undefined) TÜMÜNÜ listele
      const targetId = queryCompanyId ? Number(queryCompanyId) : undefined;
      return this.arSceneService.listScenes(targetId);
    }

    // 2. Senaryo: Normal Kullanıcı
    // Kendi şirketi yoksa hata ver veya boş dön
    if (!user.companyId) {
      return []; // veya throw new ForbiddenException("Bir şirkete bağlı değilsiniz");
    }

    // Sadece kendi şirketini görebilir
    return this.arSceneService.listScenes(user.companyId);
  }

  // =================================================================
  // 2. ITEM (OBJE) ENDPOINTLERİ
  // =================================================================

  @Post('item')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR) // MEMBER ekleyemez
  @ApiOperation({ summary: 'Mevcut bir sahneye model ekler' })
  addItem(@User() user: CurrentUser, @Body() dto: AddSceneItemDto) {
    // Servise tüm user objesini göndermek en güvenlisidir (yetki kontrolü serviste de yapılabilir)
    // Ama şimdilik mevcut yapını koruyarak ID gönderiyoruz, serviste şirket kontrolü yapılmalı.
    return this.arSceneService.addItemToScene(user, dto);
  }

  @Patch('item/:itemId')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Sahnedeki bir objenin konumunu günceller' })
  updateItem(
    @User() user: CurrentUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateSceneItemDto
  ) {
    return this.arSceneService.updateItemTransform(user, itemId, dto);
  }

  @Delete('item/:itemId')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Sahneden bir objeyi siler' })
  removeItem(@User() user: CurrentUser, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.arSceneService.removeItem(user, itemId);
  }

  // =================================================================
  // 3. GENEL SAHNE ENDPOINTLERİ
  // =================================================================

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN) // Sahne silmek kritik iştir, Editör silemesin (Opsiyonel)
  @ApiOperation({ summary: 'Sahneyi siler (Soft Delete)' })
  deleteScene(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.deleteScene(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
  @ApiOperation({ summary: 'Yeni bir sahne oluşturur' })
  createScene(@User() user: CurrentUser, @Body() dto: CreateSceneDto) {
    // Eğer Super Admin ise ve DTO'da companyId yoksa hata verebilir veya kendi null companyId'si ile oluşturur.
    // Güvenli yöntem: Eğer companyId yoksa hata fırlat (Super Admin için).
    if (user.role === Role.SUPER_ADMIN && !dto.companyId) {
      // Super admin hangi şirkete oluşturacağını belirtmeli (DTO'ya eklenebilir)
      // Şimdilik varsayılan akışta kullanıcının kendi şirketi kullanılır.
    }
    return this.arSceneService.createScene(user, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Sahne bilgilerini günceller' })
  updateScene(
    @User() user: CurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSceneDto
  ) {
    return this.arSceneService.updateScene(user, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sahne detayını getirir' })
  // Herkes görebilir (Kendi şirketi olmak şartıyla)
  getScene(@User() user: CurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.getScene(user, id);
  }
}