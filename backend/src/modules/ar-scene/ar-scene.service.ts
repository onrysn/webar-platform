import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateSceneDto, 
  UpdateSceneDto, 
  AddSceneItemDto, 
  UpdateSceneItemDto 
} from './dto/ar-scene.dto';

@Injectable()
export class ARSceneService {
  constructor(private prisma: PrismaService) {}

  // --- SAHNE (SCENE) YÖNETİMİ ---

  // 1. Yeni Sahne Yarat (Settings Desteği ile)
  async createScene(data: CreateSceneDto) {
    return this.prisma.aRScene.create({
      data: {
        name: data.name,
        companyId: data.companyId,
        // DTO'daki settings objesi Prisma tarafından otomatik JSON'a çevrilir
        // 'as any' kullanımı, Prisma'nın Json tipi ile DTO sınıfı arasındaki 
        // katı tip uyuşmazlığını aşmak için gerekebilir.
        settings: data.settings ? (data.settings as any) : {}, 
      },
    });
  }

  // 2. Sahneyi Güncelle (YENİ - İsim veya Ayarlar için)
  async updateScene(id: number, data: UpdateSceneDto) {
    // Önce sahne var mı kontrol et
    const scene = await this.prisma.aRScene.findUnique({ where: { id } });
    if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

    return this.prisma.aRScene.update({
      where: { id },
      data: {
        name: data.name,
        // Eğer settings gönderildiyse güncelle, yoksa dokunma (undefined)
        settings: data.settings ? (data.settings as any) : undefined,
      },
    });
  }

  // 3. Sahneleri Listele
  async listScenes(companyId: number) {
    return this.prisma.aRScene.findMany({
      where: { companyId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      // Listede settings'in tamamını dönmeye gerek olmayabilir, 
      // ama önizleme için lazımsa kalabilir.
    });
  }

  // 4. Sahne Detayını Getir
  async getScene(id: number) {
    const scene = await this.prisma.aRScene.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            model: { 
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

  // 5. Sahneye Model Ekle
  async addItemToScene(data: AddSceneItemDto) {
    const model = await this.prisma.aRModel.findUnique({ where: { id: data.modelId } });
    if (!model) throw new NotFoundException('Model bulunamadı');

    return this.prisma.sceneItem.create({
      data: {
        sceneId: data.sceneId,
        modelId: data.modelId,
        name: data.name || model.fileName,
        // Vector3Dto veya default değerler
        position: data.position ? (data.position as any) : { x: 0, y: 0, z: 0 },
        rotation: data.rotation ? (data.rotation as any) : { x: 0, y: 0, z: 0 },
        scale: data.scale ? (data.scale as any) : { x: 1, y: 1, z: 1 },
      },
      include: { model: true }
    });
  }

  // 6. Eşya Konumunu Güncelle
  async updateItemTransform(itemId: number, data: UpdateSceneItemDto) {
    // Eşya var mı kontrolü opsiyonel ama iyi bir pratiktir
    // Prisma update, kayıt bulamazsa hata fırlatır (RecordNotFound)
    
    return this.prisma.sceneItem.update({
      where: { id: itemId },
      data: {
        position: data.position ? (data.position as any) : undefined,
        rotation: data.rotation ? (data.rotation as any) : undefined,
        scale: data.scale ? (data.scale as any) : undefined,
      }
    });
  }

  // 7. Eşyayı Sil
  async removeItem(itemId: number) {
    return this.prisma.sceneItem.delete({
      where: { id: itemId }
    });
  }
}