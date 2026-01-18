import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShapeDto } from './dto/create-shape.dto';
import { UpdateShapeDto } from './dto/update-shape.dto';
import { ShapeCategory } from '@prisma/client';

@Injectable()
export class ShapeService {
  constructor(private prisma: PrismaService) {}

  async list(category?: ShapeCategory, activeOnly: boolean = false) {
    return this.prisma.shape.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(activeOnly ? { isActive: true } : {}),
        isDeleted: false,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
  }

  async getById(id: number) {
    const shape = await this.prisma.shape.findUnique({ where: { id } });
    if (!shape) throw new NotFoundException('Şekil bulunamadı');
    return shape;
  }

  async create(dto: CreateShapeDto) {
    return this.prisma.shape.create({
      data: {
        code: dto.code,
        icon: dto.icon,
        svgPath: dto.svgPath,
        labelTR: dto.labelTR,
        labelEN: dto.labelEN,
        descTR: dto.descTR,
        descEN: dto.descEN,
        category: dto.category,
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }
    });
  }

  async update(id: number, dto: UpdateShapeDto) {
    const shape = await this.prisma.shape.findUnique({ where: { id } });
    if (!shape) throw new NotFoundException('Şekil bulunamadı');
    return this.prisma.shape.update({
      where: { id },
      data: {
        code: dto.code ?? shape.code,
        icon: dto.icon ?? shape.icon,
        svgPath: dto.svgPath ?? shape.svgPath,
        labelTR: dto.labelTR ?? shape.labelTR,
        labelEN: dto.labelEN ?? shape.labelEN,
        descTR: dto.descTR ?? shape.descTR,
        descEN: dto.descEN ?? shape.descEN,
        category: dto.category ?? shape.category,
        tags: dto.tags ?? shape.tags,
        isActive: dto.isActive ?? shape.isActive,
        sortOrder: dto.sortOrder ?? shape.sortOrder,
      }
    });
  }

  async remove(id: number) {
    await this.getById(id); // throws if not found
    await this.prisma.shape.update({ where: { id }, data: { isDeleted: true } });
    return { success: true };
  }
}
