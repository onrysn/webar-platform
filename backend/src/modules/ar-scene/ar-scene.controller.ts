import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, ParseIntPipe, Req } from '@nestjs/common';
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

@ApiTags('ar-scene')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ar-scene')
export class ARSceneController {
  constructor(private readonly arSceneService: ARSceneService) { }

  // =================================================================
  // 1. ÖZEL ENDPOINTLER (STATIC ROUTES) - EN ÜSTTE OLMALI
  // =================================================================

  @Get('textures')
  @ApiOperation({ summary: 'Kullanılabilir zemin dokularını listeler' })
  listTextures() {
    return this.arSceneService.listFloorTextures();
  }

  @Post('textures')
  @ApiOperation({ summary: 'Yeni zemin dokusu tanımlar (Admin)' })
  createTexture(@Req() req: any, @Body() dto: CreateFloorTextureDto) {
    return this.arSceneService.createFloorTexture(req.user.userId, dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Şirkete ait sahneleri listeler' })
  @ApiQuery({ name: 'companyId', type: Number })
  listScenes(@Query('companyId', ParseIntPipe) companyId: number) {
    return this.arSceneService.listScenes(companyId);
  }

  // =================================================================
  // 2. ITEM (OBJE) ENDPOINTLERİ
  // =================================================================

  @Post('item')
  @ApiOperation({ summary: 'Mevcut bir sahneye model ekler' })
  addItem(@Req() req: any, @Body() dto: AddSceneItemDto) {
    return this.arSceneService.addItemToScene(req.user.userId, dto);
  }

  @Patch('item/:itemId')
  @ApiOperation({ summary: 'Sahnedeki bir objenin konumunu (pos, rot, scl) günceller' })
  updateItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateSceneItemDto
  ) {
    return this.arSceneService.updateItemTransform(req.user.userId, itemId, dto);
  }

  @Delete('item/:itemId')
  @ApiOperation({ summary: 'Sahneden bir objeyi siler' })
  removeItem(@Req() req: any, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.arSceneService.removeItem(req.user.userId, itemId);
  }

  // =================================================================
  // 3. GENEL SAHNE ENDPOINTLERİ (DYNAMIC ROUTES) - EN ALTTA OLMALI
  // =================================================================

  @Delete(':id')
  @ApiOperation({ summary: 'Sahneyi siler (Soft Delete)' })
  deleteScene(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.deleteScene(req.user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni bir sahne oluşturur (İsteğe bağlı settings ile)' })
  createScene(@Req() req: any, @Body() dto: CreateSceneDto) {
    return this.arSceneService.createScene(req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sahne bilgilerini (ad, zemin ayarları, vb.) günceller' })
  updateScene(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSceneDto
  ) {
    return this.arSceneService.updateScene(req.user.userId, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sahne detayını ve içindeki tüm objeleri getirir (Editor için)' })
  getScene(@Req() req: any,@Param('id', ParseIntPipe) id: number) {
    return this.arSceneService.getScene(req.user.userId, id);
  }
}