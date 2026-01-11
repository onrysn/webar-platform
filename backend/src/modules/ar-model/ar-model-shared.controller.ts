import { Controller, Get, NotFoundException, Param, Query, Res, StreamableFile } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ARModelService } from "./ar-model.service";
import { PrismaService } from "src/prisma/prisma.service";
import type { Response } from 'express'; // <-- 1. BU IMPORT EKLENDİ

// ARModelSharedController - Public Erişim İçin (Guard Yok!)
@ApiTags('ar-model-shared')
@Controller('shared/ar-model')
export class ARModelSharedController {
    constructor(private readonly arModelService: ARModelService, private prisma: PrismaService) { }

    @Get(':token')
    @ApiOperation({ summary: 'Token ile model detaylarını getirir (Public Erişim)' })
    async getSharedModel(@Param('token') token: string) {
        const model = await this.prisma.aRModel.findUnique({
            where: { shareToken: token },
            include: { company: { select: { name: true, isActive: true } } } // isActive'i select'e ekledik
        });

        // 2. GÜVENLİK KONTROLLERİ
        if (!model) throw new NotFoundException('Model bulunamadı.');
        if (model.isDeleted) throw new NotFoundException('Model silinmiş.');
        
        // 3. ŞİRKET KONTROLÜ
        if (!model.company || !model.company.isActive) throw new NotFoundException('Erişim kısıtlandı (Şirket aktif değil).');

        return {
            fileName: model.fileName,
            description: model.fileName, // İlerde modelName veya description alanı eklenirse burayı güncellersin
            companyName: model.company.name,
            createdAt: model.createdAt,
            files: {
                glb: { url: `/api/shared/ar-model/${token}/file?format=glb` },
                // usdzFilePath var mı kontrolü
                usdz: model.usdzFilePath ? { url: `/api/shared/ar-model/${token}/file?format=usdz` } : null
            }
        };
    }

    @Get(':token/file')
    @ApiOperation({ summary: 'Token ile model dosyasını stream eder (Public Erişim)' })
    @ApiQuery({ name: 'format', enum: ['glb', 'usdz'] })
    async getSharedModelFile(
        @Param('token') token: string,
        @Query('format') format: 'glb' | 'usdz' = 'glb',
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {
        
        const model = await this.prisma.aRModel.findUnique({
            where: { shareToken: token },
            include: { company: true }
        });

        // AYNI GÜVENLİK KONTROLLERİ BURADA DA OLMALI
        // (Çünkü kullanıcı metadata endpointini atlayıp direkt dosya linkine tıklayabilir)
        if (!model) throw new NotFoundException('Model bulunamadı.');
        if (model.isDeleted) throw new NotFoundException('Model silinmiş.');
        if (!model.company.isActive) throw new NotFoundException('Erişim kısıtlandı.');

        // Servisteki mevcut stream fonksiyonunu kullanıyoruz
        const { buffer, mimeType, filename } = await this.arModelService.getModelFileBuffer(model, format);
        
        // Türkçe karakter sorununa karşı encode işlemi
        const encodedFilename = encodeURIComponent(filename);

        res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            // 'inline' sayesinde tarayıcı indirmek yerine göstermeye çalışır (AR Viewer için uygun)
            'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            'Cache-Control': 'public, max-age=3600' // CDN veya Tarayıcı cache için
        });

        return new StreamableFile(buffer);
    }
}