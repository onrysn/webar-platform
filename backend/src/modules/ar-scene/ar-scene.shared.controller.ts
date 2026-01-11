import { Controller, Get, NotFoundException, Param, Query, Res, StreamableFile, ParseIntPipe, ForbiddenException } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery } from "@nestjs/swagger";
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

import { ARSceneService } from "./ar-scene.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ARModelService } from "../ar-model/ar-model.service";

@ApiTags('ar-scene-shared')
@Controller('shared/ar-scene')
export class ARSceneSharedController {
    constructor(
        private readonly arSceneService: ARSceneService,
        private readonly arModelService: ARModelService, // <-- EKLENDİ
        private readonly prisma: PrismaService
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
}