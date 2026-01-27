import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PbrTextureService } from './pbr-texture.service';
import { CreatePbrTextureDto } from './dto/create-pbr-texture.dto';
import { UpdatePbrTextureDto } from './dto/update-pbr-texture.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { textureUploadConfig } from '../../config/multer/texture-upload.config';

interface UploadedTextureFiles {
  baseColor?: any[];
  normal?: any[];
  roughness?: any[];
  metallic?: any[];
  ao?: any[];
}

@ApiTags('PBR Textures')
@ApiBearerAuth()
@Controller('pbr-textures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PbrTextureController {
  constructor(private readonly pbrTextureService: PbrTextureService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm PBR texture\'ları listele' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['SIMPLE', 'PBR'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('category') category?: string,
    @Query('type') type?: 'SIMPLE' | 'PBR',
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.pbrTextureService.findAll(category, type, isActiveBool);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Tüm kategorileri listele' })
  async getCategories() {
    return this.pbrTextureService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir PBR texture getir' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pbrTextureService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yeni PBR texture oluştur (Sadece SUPER_ADMIN)' })
  async create(@Body() dto: CreatePbrTextureDto) {
    return this.pbrTextureService.create(dto);
  }

  @Post('upload')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'PBR texture dosyalarını yükle' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'baseColor', maxCount: 1 },
        { name: 'normal', maxCount: 1 },
        { name: 'roughness', maxCount: 1 },
        { name: 'metallic', maxCount: 1 },
        { name: 'ao', maxCount: 1 },
      ],
      textureUploadConfig,
    ),
  )
  async uploadTextures(
    @UploadedFiles() files: UploadedTextureFiles,
    @Query('textureName') textureName: string,
  ) {
    return this.pbrTextureService.processUploadedFiles(files, textureName);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'PBR texture güncelle (Sadece SUPER_ADMIN)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePbrTextureDto,
  ) {
    return this.pbrTextureService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'PBR texture sil (Sadece SUPER_ADMIN)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.pbrTextureService.remove(id);
  }
}
