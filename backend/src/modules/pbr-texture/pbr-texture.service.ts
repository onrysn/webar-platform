import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePbrTextureDto } from './dto/create-pbr-texture.dto';
import { UpdatePbrTextureDto } from './dto/update-pbr-texture.dto';
import { TextureType } from '@prisma/client';

@Injectable()
export class PbrTextureService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, type?: TextureType, isActive?: boolean) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.floorTexture.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const texture = await this.prisma.floorTexture.findUnique({
      where: { id },
    });

    if (!texture) {
      throw new NotFoundException(`PBR Texture with ID ${id} not found`);
    }

    return texture;
  }

  async create(dto: CreatePbrTextureDto) {
    // PBR texture ise en az baseColor olmalı
    if (dto.type === TextureType.PBR && !dto.baseColorUrl) {
      throw new BadRequestException('PBR texture requires at least baseColorUrl');
    }

    return this.prisma.floorTexture.create({
      data: {
        name: dto.name,
        thumbnailUrl: dto.thumbnailUrl,
        type: dto.type,
        baseColorUrl: dto.baseColorUrl,
        normalUrl: dto.normalUrl,
        roughnessUrl: dto.roughnessUrl,
        metallicUrl: dto.metallicUrl,
        aoUrl: dto.aoUrl,
        defaultScale: dto.defaultScale ?? 2.0,
        roughnessValue: dto.roughnessValue ?? 0.9,
        metalnessValue: dto.metalnessValue ?? 0.0,
        aoIntensity: dto.aoIntensity ?? 1.2,
        normalScale: dto.normalScale ?? 2.0,
        category: dto.category,
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: number, dto: UpdatePbrTextureDto) {
    // Texture var mı kontrol et
    await this.findOne(id);

    return this.prisma.floorTexture.update({
      where: { id },
      data: {
        name: dto.name,
        thumbnailUrl: dto.thumbnailUrl,
        type: dto.type,
        baseColorUrl: dto.baseColorUrl,
        normalUrl: dto.normalUrl,
        roughnessUrl: dto.roughnessUrl,
        metallicUrl: dto.metallicUrl,
        aoUrl: dto.aoUrl,
        defaultScale: dto.defaultScale,
        roughnessValue: dto.roughnessValue,
        metalnessValue: dto.metalnessValue,
        aoIntensity: dto.aoIntensity,
        normalScale: dto.normalScale,
        category: dto.category,
        tags: dto.tags,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: number) {
    // Texture var mı kontrol et
    await this.findOne(id);

    return this.prisma.floorTexture.delete({
      where: { id },
    });
  }

  async getCategories() {
    const textures = await this.prisma.floorTexture.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return textures.map((t) => t.category).filter((c) => c !== null);
  }

  async processUploadedFiles(
    files: {
      thumbnail?: any[];
      baseColor?: any[];
      normal?: any[];
      roughness?: any[];
      metallic?: any[];
      ao?: any[];
    },
    textureName: string,
  ) {
    const folderName = textureName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const result: any = {};

    if (files.thumbnail?.[0]) {
      result.thumbnailUrl = `/textures/pbr/${folderName}/${files.thumbnail[0].filename}`;
    }
    if (files.baseColor?.[0]) {
      result.baseColorUrl = `/textures/pbr/${folderName}/${files.baseColor[0].filename}`;
    }
    if (files.normal?.[0]) {
      result.normalUrl = `/textures/pbr/${folderName}/${files.normal[0].filename}`;
    }
    if (files.roughness?.[0]) {
      result.roughnessUrl = `/textures/pbr/${folderName}/${files.roughness[0].filename}`;
    }
    if (files.metallic?.[0]) {
      result.metallicUrl = `/textures/pbr/${folderName}/${files.metallic[0].filename}`;
    }
    if (files.ao?.[0]) {
      result.aoUrl = `/textures/pbr/${folderName}/${files.ao[0].filename}`;
    }

    return result;
  }
}
