import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ARSceneService } from "./ar-scene.service";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags('ar-scene-shared')
@Controller('shared/ar-scene')
export class ARSceneSharedController {
    constructor(private readonly arSceneService: ARSceneService, private prisma: PrismaService) { }

    @Get(':token')
    @ApiOperation({ summary: 'Token ile sahne detaylarını getirir (Public Erişim)' })
    async getSharedScene(@Param('token') token: string) {
        // Servisteki logic'i çağırıyoruz
        const scene = await this.arSceneService.getSharedScene(token);

        if (!scene) throw new NotFoundException('Sahne bulunamadı veya erişime kapatıldı.');

        // Şirket kontrolü (Serviste de yapılabilir ama burada explicit olması iyidir)
        if (!scene.company || !scene.company.isActive) {
             throw new NotFoundException('Erişim kısıtlandı.');
        }

        return scene;
    }
}