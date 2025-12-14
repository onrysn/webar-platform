import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ARSceneService } from './ar-scene.service';
import { CreateSceneDto, AddSceneItemDto, UpdateSceneItemDto } from './dto/ar-scene.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ar-scene')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ar-scene')
export class ARSceneController {
  constructor(private readonly arSceneService: ARSceneService) {}

  // --- SAHNE ENDPOINTLERİ ---

  @Post()
  @ApiOperation({ summary: 'Yeni bir boş sahne oluşturur' })
  createScene(@Body() dto: CreateSceneDto) {
    return this.arSceneService.createScene(dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Şirkete ait sahneleri listeler' })
  @ApiQuery({ name: 'companyId', type: Number })
  listScenes(@Query('companyId') companyId: number) {
    return this.arSceneService.listScenes(+companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sahne detayını ve içindeki tüm objeleri getirir (Editor için)' })
  getScene(@Param('id') id: string) {
    return this.arSceneService.getScene(+id);
  }

  // --- ITEM (OBJE) ENDPOINTLERİ ---

  @Post('item')
  @ApiOperation({ summary: 'Mevcut bir sahneye model ekler' })
  addItem(@Body() dto: AddSceneItemDto) {
    return this.arSceneService.addItemToScene(dto);
  }

  @Patch('item/:itemId')
  @ApiOperation({ summary: 'Sahnedeki bir objenin konumunu (pos, rot, scl) günceller' })
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateSceneItemDto) {
    return this.arSceneService.updateItemTransform(+itemId, dto);
  }

  @Delete('item/:itemId')
  @ApiOperation({ summary: 'Sahneden bir objeyi siler' })
  removeItem(@Param('itemId') itemId: string) {
    return this.arSceneService.removeItem(+itemId);
  }
}