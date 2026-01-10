// ar-model.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Query, Get, Param, Res, Body, BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ARModelService } from './ar-model.service';
import { modelUploadConfig } from 'src/config/multer/ar-model-upload.config';
import { File as MulterFile } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiQuery, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { Response } from 'express';
import * as path from 'path';

// --- YENİ EKLENENLER ---
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';

@UseGuards(JwtAuthGuard, RolesGuard, CompanyActiveGuard) // 1. Rol korumasını ekledik
@ApiBearerAuth('access-token')
@ApiTags('ar-model')
@Controller('ar-model')
export class ARModelController {
    constructor(private readonly arModelService: ARModelService, private prisma: PrismaService) { }

    // ----------------------------------------------------------------
    // 1. LİSTELEME
    // ----------------------------------------------------------------
    @Get('list')
    @ApiOperation({ summary: 'Kullanıcının yetkisine göre modelleri listeler' })
    @ApiQuery({
        name: 'companyId',
        required: false,
        type: Number,
        description: 'Sadece Super Admin için: Başka bir şirketin modellerini görmek isterse.',
    })
    // Herkes listeleme yapabilir (MEMBER dahil)
    async listModels(
        @User() user: CurrentUser, // req.user yerine @User()
        @Query('companyId') companyIdQuery: string | null,
    ) {
        // --- YETKİ VE FİLTRELEME MANTIĞI ---
        const whereClause: any = {};

        // A) SUPER ADMIN: Her şeyi görebilir, isterse companyId ile filtreler
        if (user.role === Role.SUPER_ADMIN) {
            if (companyIdQuery) whereClause.companyId = +companyIdQuery;
        }
        // B) COMPANY ADMIN & EDITOR & MEMBER: Sadece kendi şirketini görür
        else {
            whereClause.companyId = user.companyId;
        }

        // --- SERVİSE GİTMEDEN SORGULAMA ---
        // (Listeleme basit olduğu için burada bıraktım, servise de taşınabilir)
        const models = await this.prisma.aRModel.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                fileType: true,
                companyId: true,
                fileSize: true,
                createdAt: true,
                thumbnailPath: true,
            },
        });

        return models;
    }

    // ----------------------------------------------------------------
    // 2. DOSYA DETAY VE İNDİRME
    // ----------------------------------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'Model detaylarını getirir' })
    async getModelDetails(@Param('id') id: number, @User() user: CurrentUser) {
        // Servis içinde yetki kontrolü yapılmalı veya burada manuel kontrol eklenmeli
        // Şimdilik sadece bulup dönüyor, detaylı güvenlik için servise 'user' gönderilmeli.
        const model = await this.prisma.aRModel.findUnique({
            where: { id: +id },
            include: {
                company: { select: { name: true } },
                user: { select: { name: true, email: true } }
            }
        });

        if (!model) throw new NotFoundException('Model bulunamadı');

        // GÜVENLİK KONTROLÜ: Başkasının modelini görmesin
        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
             throw new NotFoundException('Model bulunamadı'); // Yetkisiz dememek daha güvenli
        }

        return {
            id: model.id,
            fileName: model.fileName,
            description: `${model.company.name} tarafından yüklendi.`,
            uploadedBy: model.user.name,
            createdAt: model.createdAt,
            thumbnailUrl: model.thumbnailPath ? model.thumbnailPath : null,
            files: {
                glb: { exists: true, size: model.fileSize, format: 'glb' },
                usdz: { exists: !!model.usdzFilePath, size: model.usdzFileSize || 0, format: 'usdz' }
            }
        };
    }

    @Get('download/:id')
    @ApiOperation({ summary: 'Model dosyasını indirir (Eski Yöntem)' })
    async downloadModel(@Param('id') id: number, @Res() res: Response, @User() user: CurrentUser) {
        const model = await this.prisma.aRModel.findUnique({ where: { id: +id } });
        if (!model) return res.status(404).send('Model not found');

        // Güvenlik
        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            return res.status(404).send('Model not found');
        }

        const buffer = this.arModelService.decryptFile(model.filePath, model.iv, model.authTag);

        let filename = model.fileName;
        if (!path.extname(filename) && model.fileType.startsWith('.')) {
            filename += model.fileType;
        }

        res.setHeader('Content-Type', model.fileType.startsWith('.') ? 'application/octet-stream' : model.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }

    @Get(':id/file')
    @ApiOperation({ summary: 'Model dosyasını stream eder (Preview veya Download)' })
    @ApiQuery({ name: 'format', enum: ['glb', 'usdz'], required: false })
    @ApiQuery({ name: 'mode', enum: ['view', 'download'], required: false })
    async getModelFile(
        @Param('id') id: number,
        @User() user: CurrentUser, // User eklendi
        @Query('format') format: 'glb' | 'usdz' = 'glb',
        @Query('mode') mode: 'view' | 'download' = 'view',
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {

        const model = await this.prisma.aRModel.findUnique({ where: { id: +id } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        // Güvenlik
        if (user.role !== Role.SUPER_ADMIN && model.companyId !== user.companyId) {
            throw new NotFoundException('Model bulunamadı');
        }

        const { buffer, mimeType, filename } = await this.arModelService.getModelFileBuffer(model, format);
        const encodedFilename = encodeURIComponent(filename);

        res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            'Content-Disposition': `${mode === 'download' ? 'attachment' : 'inline'}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            'Cache-Control': 'private, max-age=3600'
        });

        return new StreamableFile(buffer);
    }

    // ----------------------------------------------------------------
    // 3. YÜKLEME VE DÖNÜŞTÜRME (Sadece EDITOR ve Üstü)
    // ----------------------------------------------------------------
    
    @Post('upload-fbx')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR) // MEMBER yükleyemez
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'FBX dosyasını yükler ve GLB/USDZ formatına çevirir' })
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadFbx(@UploadedFile() file: MulterFile, @User() user: CurrentUser) {
        if (!file) throw new BadRequestException('File is required');
        return this.arModelService.convertFbxToTemp(file, user.id);
    }

    @Post('upload-step')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'STEP/STP dosyasını yükler ve GLB/USDZ formatına çevirir' })
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadStep(@UploadedFile() file: MulterFile, @User() user: CurrentUser) {
        if (!file) throw new BadRequestException('File is required');
        return this.arModelService.convertStepToTemp(file, user.id);
    }

    @Post('upload-glb')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, tempId: { type: 'string', nullable: true } } } })
    async uploadGlb(@UploadedFile() file: MulterFile, @Body('tempId') tempId: string | undefined, @User() user: CurrentUser) {
        if (!file) throw new BadRequestException('File is required');
        return this.arModelService.saveTempUploadedModel(file, 'glb', tempId, user.id);
    }

    @Post('upload-usdz')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, tempId: { type: 'string', nullable: true } } } })
    async uploadUsdz(@UploadedFile() file: MulterFile, @Body('tempId') tempId: string | undefined, @User() user: CurrentUser) {
        if (!file) throw new BadRequestException('File is required');
        return this.arModelService.saveTempUploadedModel(file, 'usdz', tempId, user.id);
    }

    @Post('convert-glb-to-usdz')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR, Role.MEMBER)
    @ApiOperation({ summary: 'GLB yükler, converter servisi ile USDZ oluşturur.' })
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async convertGlbToUsdz(@UploadedFile() file: MulterFile, @User() user: CurrentUser) {
        if (!file) throw new BadRequestException('Dosya gereklidir.');
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.glb') {
            throw new BadRequestException('Sadece .glb uzantılı dosyalar desteklenmektedir.');
        }
        return this.arModelService.convertGlbToUsdzTemp(file, user.id);
    }

    // ----------------------------------------------------------------
    // 4. KAYDETME (Finalize)
    // ----------------------------------------------------------------
    @Post('finalize')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @UseInterceptors(FileInterceptor('thumbnail'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Temp dosyaları kaydeder ve DB kaydı oluşturur.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                tempId: { type: 'string' },
                // companyId parametresi opsiyonel hale geldi, çünkü user.companyId kullanacağız
                companyId: { type: 'number', description: 'Sadece Super Admin başka şirkete yüklerse gerekir' },
                modelName: { type: 'string', nullable: true },
                thumbnail: { type: 'string', format: 'binary' },
            },
            required: ['tempId']
        }
    })
    async finalize(
        @Body() body: { tempId: string, companyId?: string, modelName?: string },
        @UploadedFile() thumbnail: MulterFile,
        @User() user: CurrentUser
    ) {
        const { tempId, modelName } = body;
        
        // Şirket ID belirleme mantığı:
        // Eğer kullanıcı Super Admin ise ve body'de companyId varsa onu kullan.
        // Değilse kullanıcının kendi şirket ID'sini kullan.
        let targetCompanyId = user.companyId;
        if (user.role === Role.SUPER_ADMIN && body.companyId) {
            targetCompanyId = Number(body.companyId);
        }

        if (!targetCompanyId) {
            throw new BadRequestException('Şirket bilgisi bulunamadı.');
        }

        return this.arModelService.finalizeTempModel(
            tempId,
            targetCompanyId,
            user.id,
            modelName,
            thumbnail
        );
    }
}