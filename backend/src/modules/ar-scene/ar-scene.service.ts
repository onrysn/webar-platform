import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSceneDto, AddSceneItemDto, UpdateSceneItemDto } from './dto/ar-scene.dto';

@Injectable()
export class ARSceneService {
  constructor(private prisma: PrismaService) {}

  // --- SAHNE (SCENE) YÖNETİMİ ---

  // 1. Yeni Boş Sahne Yarat
  async createScene(data: CreateSceneDto) {
    return this.prisma.aRScene.create({
      data: {
        name: data.name,
        companyId: data.companyId,
      },
    });
  }

  // 2. Sahneyi Listele (Items olmadan, sadece başlıklar)
  async listScenes(companyId: number) {
    return this.prisma.aRScene.findMany({
      where: { companyId, isDeleted: false },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // 3. Sahne Detayını Getir (Frontend Editor için Full Data)
  async getScene(id: number) {
    const scene = await this.prisma.aRScene.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            model: { 
              // Frontend'in dosyayı indirmesi için gereken bilgiler
              select: { 
                id: true, 
                fileName: true, 
                fileType: true,
                thumbnailPath: true 
              } 
            }
          }
        }
      }
    });

    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');
    return scene;
  }

  // --- EŞYA (ITEM) YÖNETİMİ ---

  // 4. Sahneye Model Ekle
  async addItemToScene(data: AddSceneItemDto) {
    // Model var mı kontrol et
    const model = await this.prisma.aRModel.findUnique({ where: { id: data.modelId } });
    if (!model) throw new NotFoundException('Model bulunamadı');

    return this.prisma.sceneItem.create({
      data: {
        sceneId: data.sceneId,
        modelId: data.modelId,
        name: data.name || model.fileName, // İsim verilmezse model adını kullan
        position: data.position || { x: 0, y: 0, z: 0 },
        rotation: data.rotation || { x: 0, y: 0, z: 0 },
        scale: data.scale || { x: 1, y: 1, z: 1 },
      },
      include: { model: true } // Ekler eklemez detayını dön
    });
  }

  // 5. Eşya Konumunu Güncelle (Drag & Drop bitince çalışır)
  async updateItemTransform(itemId: number, data: UpdateSceneItemDto) {
    return this.prisma.sceneItem.update({
      where: { id: itemId },
      data: {
        position: data.position ?? undefined,
        rotation: data.rotation ?? undefined,
        scale: data.scale ?? undefined,
      }
    });
  }

  // 6. Eşyayı Sahneden Sil
  async removeItem(itemId: number) {
    return this.prisma.sceneItem.delete({
      where: { id: itemId }
    });
  }
}