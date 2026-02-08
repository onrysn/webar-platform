import { Controller, Get, Post, NotFoundException, Param, Query, Res, StreamableFile, ParseIntPipe, ForbiddenException, Body } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiBody } from "@nestjs/swagger";
import type { Response } from 'express';

import { ARSceneService } from "./ar-scene.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ARModelService } from "../ar-model/ar-model.service";
import { Public } from "src/common/decorators/public.decorator";
import { SceneExportQueueService } from "./scene-export-queue.service";

@ApiTags('ar-scene-shared')
@Controller('shared/ar-scene')
@Public()
export class ARSceneSharedController {
    constructor(
        private readonly arSceneService: ARSceneService,
        private readonly sceneExportQueueService: SceneExportQueueService,
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
    // 3. SAHNE EXPORT - Queue tabanlı (Bull/Redis)
    // ================================================================

    @Post(':token/export')
    @ApiOperation({
        summary: 'Sahne export işini kuyruğa ekler ve jobId döner.',
        description: 'Export işi arka planda çalışır. Durum takibi için GET /export/status/:jobId kullanın.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                sceneName: { type: 'string', description: 'Export dosya adı' },
                convertToUsdz: { type: 'boolean', description: 'USDZ dönüşümü (varsayılan: true)' },
            },
        },
        required: false,
    })
    async startExport(
        @Param('token') token: string,
        @Body() body?: { sceneName?: string; convertToUsdz?: boolean },
    ) {
        // Token doğrulama
        const scene = await this.arSceneService.getSharedScene(token);
        if (!scene) throw new NotFoundException('Sahne bulunamadı.');
        if (!scene.company?.isActive) throw new NotFoundException('Erişim kısıtlandı.');

        const sceneName = body?.sceneName || scene.name || 'scene';
        const convertToUsdz = body?.convertToUsdz !== false;

        const { jobId } = await this.sceneExportQueueService.enqueue(
            token,
            sceneName,
            convertToUsdz,
        );

        return { jobId, message: 'Export kuyruğa eklendi.' };
    }

    @Get('export/status/:jobId')
    @ApiOperation({
        summary: 'Export job durumunu sorgular.',
        description: 'Polling ile durum takibi yapılır. status=completed olduğunda result içinde URL\'ler bulunur.',
    })
    async getExportStatus(@Param('jobId') jobId: string) {
        return this.sceneExportQueueService.getJobStatus(jobId);
    }

    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}