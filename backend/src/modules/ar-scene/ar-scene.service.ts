import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
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

    // =================================================================
    // HELPER: YETKİ KONTROLÜ (MERKEZİ KONTROL NOKTASI)
    // =================================================================
    /**
     * Kullanıcının bu sahne üzerinde "Yazma/Düzenleme" yetkisi var mı?
     */
    private validateWriteAccess(user: any, scene: any) {
        // 1. Şirket Kontrolü (Temel Kural)
        // Super Admin değilse ve sahnenin şirketi kullanıcının şirketi değilse -> YASAK
        if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
            throw new ForbiddenException('Bu işlem için yetkiniz yok (Farklı Şirket).');
        }

        // 2. Rol Bazlı Kontrol
        if (user.role === Role.SUPER_ADMIN) return;   // Tanrı modu
        if (user.role === Role.COMPANY_ADMIN) return; // Şirket yöneticisi
        if (user.role === Role.EDITOR) return;        // Editör

        // 3. MEMBER Kontrolü (Kritik Nokta)
        if (user.role === Role.MEMBER) {
            // Sahne ayarı izin veriyor mu?
            if (scene.memberCanEdit === true) {
                return; // İzin ver
            } else {
                throw new ForbiddenException('Bu sahneyi düzenleme yetkisi kısıtlanmış.');
            }
        }
        
        // Tanımsız rol
        throw new ForbiddenException('Yetkisiz işlem.');
    }

    // =================================================================
    // 1. SAHNE (SCENE) YÖNETİMİ
    // =================================================================

    async listScenes(companyId?: number, onlyPublic = false) {
        const whereClause: any = {
            isDeleted: false
        };

        if (companyId) {
            whereClause.companyId = companyId;
        }

        // NOT: Eğer Member'ların şirket içindeki "Private" sahneleri de görmesini istiyorsan
        // Controller'daki 'onlyPublic' mantığını kaldırabilirsin.
        // Şu anki mantık: Member sadece "Public" işaretli sahneleri görür.
        if (onlyPublic) {
            whereClause.isPrivate = false;
        }

        return this.prisma.aRScene.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { items: true } }
            }
        });
    }

    async createScene(user: any, data: CreateSceneDto) {
        // Member yeni sahne oluşturabilir mi? 
        // Controller'da izin verdik, burası da izin veriyor.
        
        const targetCompanyId = user.role === Role.SUPER_ADMIN && data.companyId
            ? data.companyId
            : user.companyId;

        if (!targetCompanyId) throw new NotFoundException('Şirket bilgisi bulunamadı.');

        const scene = await this.prisma.aRScene.create({
            data: {
                name: data.name,
                companyId: targetCompanyId,
                settings: data.settings ? (data.settings as any) : {},
                isPrivate: data.isPrivate ?? false,
                memberCanEdit: data.memberCanEdit ?? true, // Default true yapıyoruz
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

    async updateScene(user: any, id: number, data: UpdateSceneDto) {
        const scene = await this.prisma.aRScene.findUnique({ where: { id } });
        if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

        // YETKİ KONTROLÜ
        this.validateWriteAccess(user, scene);

        const updatedScene = await this.prisma.aRScene.update({
            where: { id },
            data: {
                name: data.name,
                settings: data.settings ? (data.settings as any) : undefined,
                isPrivate: data.isPrivate,
                memberCanEdit: data.memberCanEdit,
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

    async deleteScene(user: any, id: number) {
        const scene = await this.prisma.aRScene.findUnique({ where: { id } });
        if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı.');

        // Silme işlemi kritik olduğu için MEMBER'a kapalı olmalı (Controller'da zaten engelledik)
        // Ama yine de güvenlik için:
        if (user.role === Role.MEMBER) throw new ForbiddenException('Silme yetkiniz yok.');
        
        // Diğer roller için standart kontrol
        if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
            throw new ForbiddenException('Yetkiniz yok');
        }

        await this.prisma.aRScene.update({
            where: { id },
            data: { isDeleted: true },
        });

        await this.activityLogger.log(
            user.id,
            scene.companyId,
            'DELETE_SCENE',
            `"${scene.name}" sahnesi silindi.`,
            { sceneId: id }
        );

        return { message: 'Sahne başarıyla silindi' };
    }

    async getScene(user: any, id: number) {
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
                                thumbnailPath: true,
                                isPrivate: true,
                                shareToken: true 
                            }
                        }
                    }
                }
            }
        });

        if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

        if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) {
            throw new ForbiddenException('Erişim yetkiniz yok');
        }

        // Log
        this.activityLogger.log(user.id, scene.companyId, 'VIEW_SCENE', `"${scene.name}" görüntülendi.`, { sceneId: scene.id }).catch(() => {});

        return scene;
    }

    // =================================================================
    // 2. EŞYA (ITEM) YÖNETİMİ
    // =================================================================

    async addItemToScene(user: any, data: AddSceneItemDto) {
        const scene = await this.prisma.aRScene.findUnique({ where: { id: data.sceneId } });
        if (!scene || scene.isDeleted) throw new NotFoundException('Sahne bulunamadı');

        // YETKİ KONTROLÜ (MEMBER burada denetlenir)
        this.validateWriteAccess(user, scene);

        const model = await this.prisma.aRModel.findUnique({ where: { id: data.modelId } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        // Model de aynı şirkette olmalı
        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            throw new ForbiddenException('Bu modeli kullanamazsınız.');
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

        await this.activityLogger.log(user.id, scene.companyId, 'ADD_ITEM', `Sahneye "${item.name}" eklendi.`, { sceneId: data.sceneId, itemId: item.id });
        return item;
    }

    async updateItemTransform(user: any, itemId: number, data: UpdateSceneItemDto) {
        const item = await this.prisma.sceneItem.findUnique({
            where: { id: itemId },
            include: { scene: true }
        });

        if (!item || !item.scene || item.scene.isDeleted) throw new NotFoundException('Obje bulunamadı');

        // YETKİ KONTROLÜ (MEMBER burada denetlenir)
        this.validateWriteAccess(user, item.scene);

        const updatedItem = await this.prisma.sceneItem.update({
            where: { id: itemId },
            data: {
                position: data.position ? (data.position as any) : undefined,
                rotation: data.rotation ? (data.rotation as any) : undefined,
                scale: data.scale ? (data.scale as any) : undefined,
                materialConfig: data.materialConfig ? (data.materialConfig as any) : undefined,
            }
        });

        return updatedItem;
    }

    async removeItem(user: any, itemId: number) {
        const item = await this.prisma.sceneItem.findUnique({
            where: { id: itemId },
            include: { scene: true }
        });

        if (!item || !item.scene) throw new NotFoundException('Obje bulunamadı');

        // YETKİ KONTROLÜ
        this.validateWriteAccess(user, item.scene);

        await this.prisma.sceneItem.delete({ where: { id: itemId } });

        await this.activityLogger.log(user.id, item.scene.companyId, 'REMOVE_ITEM', `"${item.name}" kaldırıldı.`, { itemId, sceneId: item.sceneId });
        return { message: 'Obje silindi' };
    }

    // =================================================================
    // 3. DİĞER (TEXTURE, TOKEN, SHARED) - AYNI KALIYOR
    // =================================================================
    
    // Texture
    async listFloorTextures() {
        return this.prisma.floorTexture.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    }

    async createFloorTexture(userId: number, data: CreateFloorTextureDto) {
        const texture = await this.prisma.floorTexture.create({
            data: { ...data, thumbnailUrl: data.thumbnailUrl || data.textureUrl, isActive: data.isActive ?? true },
        });
        return texture;
    }

    // Token & Shared
    async generateShareToken(id: number, user: any) {
        // Token üretmek yönetimsel bir iştir, Member yapamaz (Controller'da engelli)
        const scene = await this.prisma.aRScene.findUnique({ where: { id } });
        if (!scene) throw new NotFoundException('Sahne bulunamadı');
        
        if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) throw new ForbiddenException();

        if (scene.shareToken) return { shareToken: scene.shareToken };

        const token = uuidv4();
        await this.prisma.aRScene.update({ where: { id }, data: { shareToken: token } });
        return { shareToken: token };
    }

    async revokeShareToken(id: number, user: any) {
        const scene = await this.prisma.aRScene.findUnique({ where: { id } });
        if (!scene) throw new NotFoundException('Sahne bulunamadı');
        if (user.role !== Role.SUPER_ADMIN && scene.companyId !== user.companyId) throw new ForbiddenException();

        await this.prisma.aRScene.update({ where: { id }, data: { shareToken: null } });
        return { success: true };
    }

    async getSharedScene(token: string) {
        const scene = await this.prisma.aRScene.findUnique({
            where: { shareToken: token },
            include: {
                company: { select: { name: true, isActive: true } },
                items: {
                    include: {
                        model: {
                            select: { id: true, fileName: true, fileType: true, shareToken: true, isPrivate: true }
                        }
                    }
                }
            }
        });
        if (!scene || scene.isDeleted) return null;
        if (!scene.company || !scene.company.isActive) return null;
        return scene;
    }
}