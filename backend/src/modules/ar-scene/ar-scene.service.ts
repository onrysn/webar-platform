import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
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
  ) {}

  // --- SAHNE (SCENE) YÖNETİMİ ---

  // 1. Yeni Sahne Yarat
  async createScene(userId: number, data: CreateSceneDto) {
    const scene = await this.prisma.aRScene.create({
      data: {
        name: data.name,
        companyId: data.companyId,
        settings: data.settings ? (data.settings as any) : {}, 
      },
    });

    await this.activityLogger.log(
      userId,
      'CREATE_SCENE',
      `"${scene.name}" adlı yeni sahne oluşturuldu.`,
      { sceneId: scene.id, companyId: scene.companyId }
    );

    return scene;
  }

  // 2. Sahne Güncelleme
  async updateScene(userId: number, id: number, data: UpdateSceneDto) {
    const scene = await this.prisma.aRScene.findUnique({ where: { id } });
    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

    const updatedScene = await this.prisma.aRScene.update({
      where: { id },
      data: {
        name: data.name,
        settings: data.settings ? (data.settings as any) : undefined,
      },
    });

    await this.activityLogger.log(
      userId,
      'UPDATE_SCENE',
      `"${updatedScene.name}" sahnesi güncellendi.`,
      { sceneId: id, changes: data }
    );

    return updatedScene;
  }

  // 3. Sahne Silme (Soft Delete)
  async deleteScene(userId: number, id: number) {
    const scene = await this.prisma.aRScene.findUnique({ where: { id } });
    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı.');

    await this.prisma.aRScene.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.activityLogger.log(
      userId,
      'DELETE_SCENE',
      `"${scene.name}" sahnesi silindi (Arşivlendi).`,
      { sceneId: id, companyId: scene.companyId }
    );

    return { message: 'Sahne başarıyla silindi' };
  }

  // 4. Sahneleri Listele (Log gerekmez)
  async listScenes(companyId: number) {
    return this.prisma.aRScene.findMany({
      where: { companyId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 5. Sahne Detayı (Log gerekmez)
  async getScene(userId: number, id: number) {
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

    this.activityLogger.log(
      userId,
      'VIEW_SCENE', // Yeni aksiyon adı
      `"${scene.name}" sahnesi görüntülendi.`,
      { sceneId: scene.id }
    ).catch(err => console.error('Log hatası:', err));

    return scene;
  }

  // --- EŞYA (ITEM) YÖNETİMİ ---

  // 6. Sahneye Model Ekle
  async addItemToScene(userId: number, data: AddSceneItemDto) {
    const model = await this.prisma.aRModel.findUnique({ where: { id: data.modelId } });
    if (!model) throw new NotFoundException('Model bulunamadı');

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

    // [LOG]
    await this.activityLogger.log(
      userId,
      'ADD_ITEM',
      `Sahneye "${item.name}" objesi eklendi.`,
      { sceneId: data.sceneId, itemId: item.id, modelId: data.modelId }
    );

    return item;
  }

  // 7. Eşya Konumunu Güncelle
  async updateItemTransform(userId: number, itemId: number, data: UpdateSceneItemDto) {
    const item = await this.prisma.sceneItem.update({
      where: { id: itemId },
      data: {
        position: data.position ? (data.position as any) : undefined,
        rotation: data.rotation ? (data.rotation as any) : undefined,
        scale: data.scale ? (data.scale as any) : undefined,
      }
    });

    await this.activityLogger.log(
      userId,
      'UPDATE_ITEM',
      `"${item.name || 'Obje'}" konumu güncellendi.`,
      { itemId, sceneId: item.sceneId }
    );

    return item;
  }

  // 8. Eşyayı Sil
  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.sceneItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Obje bulunamadı');

    await this.prisma.sceneItem.delete({
      where: { id: itemId }
    });

    await this.activityLogger.log(
      userId,
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
      'CREATE_TEXTURE',
      `Yeni zemin dokusu eklendi: "${texture.name}"`,
      { textureId: texture.id }
    );

    return texture;
  }
}