import { Controller, Get, NotFoundException, Param, Query, Res, StreamableFile, ParseIntPipe, ForbiddenException } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery } from "@nestjs/swagger";
import type { Response } from 'express';

import { ARSceneService } from "./ar-scene.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ARModelService } from "../ar-model/ar-model.service";
import { Public } from "src/common/decorators/public.decorator";
import { SceneExportService } from "./scene-export.service";

@ApiTags('ar-scene-shared')
@Controller('shared/ar-scene')
@Public()
export class ARSceneSharedController {
    constructor(
        private readonly arSceneService: ARSceneService,
        private readonly sceneExportService: SceneExportService,
        private readonly arModelService: ARModelService,
        private readonly prisma: PrismaService,
    ) { }

    // 1. Sahne JSON Verisi
    @Get(':token')
    @ApiOperation({ summary: 'Token ile sahne detaylarını getirir (Public Erişim)' })
    async getSharedScene(@Param('token') token: string) {
        const scene = await this.arSceneService.getSharedScene(token);

        if (!scene) throw new NotFoundException('Sahne bulunamadı veya erişime kapatıldı.');

        if (!scene.company || !scene.company.isActive) {
             throw new NotFoundException('Erişim kısıtlandı.');
        }

        return scene;
    }

    @Get(':token/model/:modelId')
    @ApiOperation({ summary: 'Sahne içindeki bir modelin dosyasını indirir' })
    @ApiQuery({ name: 'format', enum: ['glb', 'usdz'], required: false }) // Swagger için enum eklendi
    async getSceneModelFile(
        @Param('token') token: string,
        @Param('modelId', ParseIntPipe) modelId: number,
        @Query('format') format: 'glb' | 'usdz' = 'glb',
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {
        
        // A. Sahne Kontrolü
        const scene = await this.arSceneService.getSharedScene(token);
        if (!scene) {
            throw new NotFoundException('Sahne bulunamadı.');
        }

        // B. Model Sahnede mi? (Yetki Kontrolü)
        const isModelInScene = scene.items.some(item => item.modelId === modelId);
        if (!isModelInScene) {
            throw new ForbiddenException('Bu modele bu sahne üzerinden erişim izniniz yok.');
        }

        // C. Modeli Veritabanından Çek (File path ve şifreleme anahtarları için)
        // Not: Servisteki 'getSharedModelFile' fonksiyonunu sildiğimiz için
        // veriyi burada çekip servise ham halini yolluyoruz.
        const model = await this.prisma.aRModel.findUnique({
            where: { id: modelId }
        });

        if (!model) throw new NotFoundException('Model dosyası bulunamadı.');
        if (model.isDeleted) throw new NotFoundException('Model silinmiş.');

        // D. Dosyayı Servisten Buffer Olarak Al
        // format parametresini 'glb' | 'usdz' tipine zorluyoruz
        const { buffer, mimeType, filename } = await this.arModelService.getModelFileBuffer(model, format);

        // E. Response Header Ayarla (Türkçe karakter ve tarayıcı uyumluluğu için düzeltildi)
        const encodedFilename = encodeURIComponent(filename);

        res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            // 'attachment' yerine 'inline' kullanırsan tarayıcıda direkt açmaya çalışır, 
            // 'attachment' indirir. AR görüntüleyici için genelde inline tercih edilir ama duruma göre değişir.
            // Çalışan kodda 'inline' kullanılmış, buraya da aynısını uyguladım:
            'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            'Cache-Control': 'public, max-age=3600', 
        });

        // F. Stream Dön
        return new StreamableFile(buffer);
    }

    // ================================================================
    // 3. SAHNE EXPORT - Backend tarafında sahneyi GLB olarak oluştur + USDZ dönüşümü
    // ================================================================

    @Get(':token/export')
    @ApiOperation({
        summary: 'Sahneyi backend tarafında GLB olarak oluşturur, opsiyonel olarak USDZ ye dönüştürür ve URL döner.',
        description: 'Backend Three.js ile sahneyi (zemin, duvarlar, modeller) sıfırdan GLB olarak oluşturur. Mobil cihazlardaki export yükünü almak için tüm işlem sunucuda yapılır. Android Scene Viewer ve iOS AR Quick Look için URL tabanlı erişim sağlar.',
    })
    @ApiQuery({ name: 'sceneName', required: false, description: 'Export dosya adı' })
    @ApiQuery({ name: 'convertToUsdz', required: false, type: String, description: 'USDZ dönüşümü (varsayılan: true)' })
    async exportScene(
        @Param('token') token: string,
        @Query('sceneName') sceneName?: string,
        @Query('convertToUsdz') convertToUsdz?: string,
    ) {
        // Token doğrulama
        const scene = await this.arSceneService.getSharedScene(token);
        if (!scene) throw new NotFoundException('Sahne bulunamadı.');
        if (!scene.company?.isActive) throw new NotFoundException('Erişim kısıtlandı.');

        const shouldConvert = convertToUsdz !== 'false';
        const name = sceneName || scene.name || 'scene';

        const result = await this.sceneExportService.exportScene(
            token,
            {
                sceneName: name,
                convertToUsdz: shouldConvert,
            },
        );

        // URL'leri tam API path ile döndür
        return {
            exportId: result.exportId,
            sceneName: result.sceneName,
            glb: result.glb ? {
                ...result.glb,
                url: `/api${result.glb.url}`,
                sizeFormatted: this.formatFileSize(result.glb.size),
            } : undefined,
            usdz: result.usdz ? {
                ...result.usdz,
                url: `/api${result.usdz.url}`,
                sizeFormatted: this.formatFileSize(result.usdz.size),
            } : undefined,
            usdzError: result.usdzError,
        };
    }

    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}