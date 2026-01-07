import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator'; // Type import
import { Role } from '@prisma/client';
import {
  CreateSceneDto,
  UpdateSceneDto,
  AddSceneItemDto,
  UpdateSceneItemDto,
  CreateFloorTextureDto
} from './dto/ar-scene.dto';

@Injectable()
export class ARSceneService {
  constructor(
    private prisma: PrismaService,
    private activityLogger: ActivityLogService
  ) { }

  // --- SAHNE (SCENE) YÖNETİMİ ---

  // 1. Yeni Sahne Yarat
  async createScene(user: CurrentUser, data: CreateSceneDto) {
    // Eğer Super Admin ise DTO'dan gelen companyId'yi, değilse kendi companyId'sini kullanır.
    const targetCompanyId = user.role === Role.SUPER_ADMIN && data.companyId
      ? data.companyId
      : user.companyId;

    if (!targetCompanyId) throw new NotFoundException('Şirket bilgisi bulunamadı.');

    const scene = await this.prisma.aRScene.create({
      data: {
        name: data.name,
        companyId: targetCompanyId,
        settings: data.settings ? (data.settings as any) : {},
      },
    });

    await this.activityLogger.log(
      user.id,
      targetCompanyId,
      'CREATE_SCENE',
      `"${scene.name}" adlı yeni sahne oluşturuldu.`,
      { sceneId: scene.id }
    );

    return scene;
  }

  // 2. Sahne Güncelleme
  async updateScene(user: CurrentUser, id: number, data: UpdateSceneDto) {
    const scene = await this.prisma.aRScene.findUnique({ where: { id } });
    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

    // GÜVENLİK: Başkasının sahnesini güncellemeye çalışıyorsa engelle
    if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
      throw new NotFoundException('Sahne bulunamadı');
    }

    const updatedScene = await this.prisma.aRScene.update({
      where: { id },
      data: {
        name: data.name,
        settings: data.settings ? (data.settings as any) : undefined,
      },
    });

    await this.activityLogger.log(
      user.id,
      scene.companyId,
      'UPDATE_SCENE',
      `"${updatedScene.name}" sahnesi güncellendi.`,
      { sceneId: id, changes: data }
    );

    return updatedScene;
  }

  // 3. Sahne Silme (Soft Delete)
  async deleteScene(user: CurrentUser, id: number) {
    const scene = await this.prisma.aRScene.findUnique({ where: { id } });
    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı.');

    // GÜVENLİK:
    if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
      throw new NotFoundException('Sahne bulunamadı');
    }

    await this.prisma.aRScene.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.activityLogger.log(
      user.id,
      scene.companyId,
      'DELETE_SCENE',
      `"${scene.name}" sahnesi silindi (Arşivlendi).`,
      { sceneId: id }
    );

    return { message: 'Sahne başarıyla silindi' };
  }

  async listScenes(companyId?: number) {
    return this.prisma.aRScene.findMany({
      where: {
        isDeleted: false,
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });
  }

  // 5. Sahne Detayı
  async getScene(user: CurrentUser, id: number) {
    const scene = await this.prisma.aRScene.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            model: {
              select: { id: true, fileName: true, fileType: true, thumbnailPath: true }
            }
          }
        }
      }
    });

    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

    // GÜVENLİK:
    if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
      throw new NotFoundException('Sahne bulunamadı');
    }

    // Log (Await etmeyip arka planda çalıştırabiliriz, performansı etkilemesin)
    this.activityLogger.log(
      user.id,
      scene.companyId,
      'VIEW_SCENE',
      `"${scene.name}" sahnesi görüntülendi.`,
      { sceneId: scene.id }
    ).catch(err => console.error('Log hatası:', err));

    return scene;
  }

  // --- EŞYA (ITEM) YÖNETİMİ ---

  // 6. Sahneye Model Ekle
  async addItemToScene(user: CurrentUser, data: AddSceneItemDto) {
    // Önce Sahneyi bul ve yetki kontrolü yap
    const scene = await this.prisma.aRScene.findUnique({ where: { id: data.sceneId } });
    if (!scene) throw new NotFoundException('Sahne bulunamadı');

    if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
      throw new NotFoundException('Sahne bulunamadı');
    }

    const model = await this.prisma.aRModel.findUnique({ where: { id: data.modelId } });
    if (!model) throw new NotFoundException('Model bulunamadı');

    // Model de aynı şirkete ait olmalı (Opsiyonel ama iyi bir güvenlik önlemi)
    if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
      throw new ForbiddenException('Bu modeli kullanmaya yetkiniz yok');
    }

    const item = await this.prisma.sceneItem.create({
      data: {
        sceneId: data.sceneId,
        modelId: data.modelId,
        name: data.name || model.fileName,
        position: data.position ? (data.position as any) : { x: 0, y: 0, z: 0 },
        rotation: data.rotation ? (data.rotation as any) : { x: 0, y: 0, z: 0 },
        scale: data.scale ? (data.scale as any) : { x: 1, y: 1, z: 1 },
      },
      include: { model: true }
    });

    await this.activityLogger.log(
      user.id,
      scene.companyId, // Log sahnenin şirketine yazılır
      'ADD_ITEM',
      `Sahneye "${item.name}" objesi eklendi.`,
      { sceneId: data.sceneId, itemId: item.id, modelId: data.modelId }
    );

    return item;
  }

  // 7. Eşya Konumunu Güncelle
  async updateItemTransform(user: CurrentUser, itemId: number, data: UpdateSceneItemDto) {
    // Eşyayı ve bağlı olduğu sahneyi çek
    const item = await this.prisma.sceneItem.findUnique({
      where: { id: itemId },
      include: { scene: true }
    });

    if (!item) throw new NotFoundException('Obje bulunamadı');

    // Yetki kontrolü (Sahne üzerinden)
    if (user.role !== Role.SUPER_ADMIN && item.scene.companyId !== user.companyId) {
      throw new NotFoundException('Obje bulunamadı');
    }

    const updatedItem = await this.prisma.sceneItem.update({
      where: { id: itemId },
      data: {
        position: data.position ? (data.position as any) : undefined,
        rotation: data.rotation ? (data.rotation as any) : undefined,
        scale: data.scale ? (data.scale as any) : undefined,
        materialConfig: data.materialConfig ? (data.materialConfig as any) : undefined,
      }
    });

    await this.activityLogger.log(
      user.id,
      item.scene.companyId,
      'UPDATE_ITEM',
      `"${item.name}" güncellendi.`,
      { itemId, sceneId: item.sceneId }
    );

    return updatedItem;
  }

  // 8. Eşyayı Sil
  async removeItem(user: CurrentUser, itemId: number) {
    const item = await this.prisma.sceneItem.findUnique({
      where: { id: itemId },
      include: { scene: true }
    });

    if (!item) throw new NotFoundException('Obje bulunamadı');

    if (user.role !== Role.SUPER_ADMIN && item.scene.companyId !== user.companyId) {
      throw new NotFoundException('Obje bulunamadı');
    }

    await this.prisma.sceneItem.delete({
      where: { id: itemId }
    });

    await this.activityLogger.log(
      user.id,
      item.scene.companyId,
      'REMOVE_ITEM',
      `"${item.name}" objesi sahneden kaldırıldı.`,
      { itemId, sceneId: item.sceneId }
    );

    return { message: 'Obje silindi' };
  }

  // --- DOKU (TEXTURE) YÖNETİMİ ---

  async listFloorTextures() {
    return this.prisma.floorTexture.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createFloorTexture(userId: number, data: CreateFloorTextureDto) {
    // Sadece Super Admin oluşturabildiği için companyId yok (Sistem geneli)
    const texture = await this.prisma.floorTexture.create({
      data: {
        name: data.name,
        textureUrl: data.textureUrl,
        thumbnailUrl: data.thumbnailUrl || data.textureUrl,
        isActive: data.isActive ?? true,
      },
    });

    await this.activityLogger.log(
      userId,
      null, // Sistem geneli işlem
      'CREATE_TEXTURE',
      `Yeni zemin dokusu eklendi: "${texture.name}"`,
      { textureId: texture.id }
    );

    return texture;
  }
}