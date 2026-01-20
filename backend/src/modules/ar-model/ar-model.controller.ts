// ar-model.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Query, Get, Param, Res, Body, BadRequestException, NotFoundException, StreamableFile, Req, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ARModelService } from './ar-model.service';
import { modelUploadConfig } from 'src/config/multer/ar-model-upload.config';
import { File as MulterFile } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiQuery, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request, Response } from 'express';
import * as path from 'path';

// --- YENİ EKLENENLER ---
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CompanyActiveGuard } from 'src/common/guards/company-active.guard';
import { ApiResponse } from '@nestjs/swagger';
import { InitiateChunkedUploadDto, UploadChunkDto, CompleteChunkedUploadDto } from './dto/chunked-upload.dto';

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
    @ApiQuery({ name: 'companyId', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'seriesId', required: false })
    async listModels(
        @User() user: CurrentUser,
        @Query('companyId') companyIdQuery: string | null,
        @Query('categoryId') categoryIdQuery?: string,
        @Query('seriesId') seriesIdQuery?: string,
    ) {
        const whereClause: any = {};

        // A) ROL KONTROLÜ
        if (user.role === Role.SUPER_ADMIN) {
            if (companyIdQuery) whereClause.companyId = +companyIdQuery;
        } else {
            whereClause.companyId = user.companyId;
        }

        if (user.role === Role.MEMBER) {
            whereClause.isPrivate = false; 
        }

        if (categoryIdQuery) whereClause.categoryId = +categoryIdQuery;
        if (seriesIdQuery) whereClause.seriesId = +seriesIdQuery;

        const models = await this.prisma.aRModel.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                // modelName: true, // Eğer modelName alanı eklediysen buraya da ekle
                fileType: true,
                companyId: true,
                fileSize: true,
                createdAt: true,
                thumbnailPath: true,
                // --- YENİ ALANLAR ---
                isPrivate: true,    // Frontend kilit ikonu koyabilsin
                shareToken: true,   // Frontend paylaşım ikonunu aktif göstersin
                categoryId: true,
                seriesId: true,
            },
        });

        return models;
    }

    // --- Upload Queue: Status & Listing ---
    @Get('upload-status')
    @ApiOperation({ summary: 'Geçici yükleme (tempId) için dönüşüm durumunu getirir' })
    @ApiQuery({ name: 'tempId', required: true })
    async getUploadStatus(@Query('tempId') tempId: string) {
        if (!tempId) throw new BadRequestException('tempId gerekli');
        return this.arModelService.getUploadStatus(tempId);
    }

    @Get('upload-jobs')
    @ApiOperation({ summary: 'Kullanıcının/şirketin upload kuyruğunu listeler' })
    @ApiQuery({ name: 'companyId', required: false })
    @ApiQuery({ name: 'status', required: false, description: 'Filtre: QUEUED|CONVERTING|CONVERTED|ERROR|APPROVED' })
    async getUploadJobs(
        @Req() req: any,
        @Query('companyId') companyId?: string,
        @Query('status') status?: string,
    ) {
        const parsedCompanyId = companyId ? parseInt(companyId, 10) : undefined;
        return this.arModelService.listUploadJobs(req.user, parsedCompanyId, status);
    }

    

    // ----------------------------------------------------------------
    // 2. DOSYA DETAY VE İNDİRME
    // ----------------------------------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'Model detaylarını getirir' })
    async getModelDetails(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
        // Servis içinde yetki kontrolü yapılmalı veya burada manuel kontrol eklenmeli
        // Şimdilik sadece bulup dönüyor, detaylı güvenlik için servise 'user' gönderilmeli.
        const model = await this.prisma.aRModel.findUnique({
            where: { id: +id },
            include: {
                company: { select: { name: true } },
                user: { select: { name: true, email: true } },
                category: { select: { id: true, name: true } },
                series: { select: { id: true, name: true, code: true } }
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
            isPrivate: model.isPrivate,
            shareToken: model.shareToken,
            shareUrl: model.shareToken ? `/view/${model.shareToken}` : null,
            companyId: model.companyId,
            category: model.category ? { id: model.category.id, name: model.category.name } : null,
            series: model.series ? { id: model.series.id, name: model.series.name, code: model.series.code } : null,
            files: {
                glb: { exists: true, size: model.fileSize, format: 'glb' },
                usdz: { exists: !!model.usdzFilePath, size: model.usdzFileSize || 0, format: 'usdz' }
            }
        };
    }

    @Get('download/:id')
    @ApiOperation({ summary: 'Model dosyasını indirir (Eski Yöntem)' })
    async downloadModel(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @User() user: CurrentUser) {
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
        @Param('id', ParseIntPipe) id: number,
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
    
    // ==================== CHUNKED UPLOAD (YENİ) ====================
    @Post('initiate-chunked-upload')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Parçalı upload session başlatır' })
    @ApiBody({ type: InitiateChunkedUploadDto })
    async initiateChunkedUpload(
        @Body() dto: InitiateChunkedUploadDto,
        @User() user: CurrentUser
    ) {
        let targetCompanyId = user.companyId ?? undefined;
        if (user.role === Role.SUPER_ADMIN && dto.companyId) {
            targetCompanyId = dto.companyId;
        }
        return this.arModelService.initiateChunkedUpload(dto, user.id, targetCompanyId);
    }

    @Post('upload-chunk')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @UseInterceptors(FileInterceptor('chunk'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Tek bir chunk yükler' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                uploadId: { type: 'string' },
                chunkIndex: { type: 'number' },
                chunkHash: { type: 'string', nullable: true },
                chunk: { type: 'string', format: 'binary' }
            }
        }
    })
    async uploadChunk(
        @UploadedFile() file: MulterFile,
        @Body() body: any, // FormData string olarak gelir
        @User() user: CurrentUser
    ) {
        if (!file) throw new BadRequestException('Chunk dosyası gerekli');
        
        // FormData'dan gelen değerleri parse et
        const dto: UploadChunkDto = {
            uploadId: body.uploadId,
            chunkIndex: parseInt(body.chunkIndex, 10),
            chunkHash: body.chunkHash || undefined
        };

        // Validation
        if (!dto.uploadId) throw new BadRequestException('uploadId gerekli');
        if (isNaN(dto.chunkIndex)) throw new BadRequestException('chunkIndex geçerli bir sayı olmalı');
        if (dto.chunkIndex < 0) throw new BadRequestException('chunkIndex 0 veya daha büyük olmalı');

        return this.arModelService.uploadChunk(dto, file, user.id);
    }

    @Post('complete-chunked-upload')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Parçalı upload tamamlar ve dosyayı birleştirir' })
    @ApiBody({ type: CompleteChunkedUploadDto })
    async completeChunkedUpload(
        @Body() dto: CompleteChunkedUploadDto,
        @User() user: CurrentUser
    ) {
        return this.arModelService.completeChunkedUpload(dto, user.id);
    }

    @Get('chunked-upload-status/:uploadId')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Parçalı upload durumunu getirir (resume için)' })
    async getChunkedUploadStatus(
        @Param('uploadId') uploadId: string,
        @User() user: CurrentUser
    ) {
        return this.arModelService.getChunkedUploadStatus(uploadId, user.id);
    }

    @Post('cancel-chunked-upload/:uploadId')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Parçalı upload iptal eder' })
    async cancelChunkedUpload(
        @Param('uploadId') uploadId: string,
        @User() user: CurrentUser
    ) {
        return this.arModelService.cancelChunkedUpload(uploadId, user.id);
    }
    // ==================== CHUNKED UPLOAD END ====================
    
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
                companyId: { type: 'number', description: 'Sadece Super Admin başka şirkeye yüklerse gerekir' },
                modelName: { type: 'string', nullable: true },
                isPrivate: { type: 'boolean', default: false },
                categoryId: { type: 'number', nullable: true },
                seriesId: { type: 'number', nullable: true },
                thumbnail: { type: 'string', format: 'binary' },
            },
            required: ['tempId']
        }
    })
    async finalize(
        @Body() body: { tempId: string, companyId?: string, modelName?: string, isPrivate?: string | boolean, categoryId?: string, seriesId?: string },
        @UploadedFile() thumbnail: MulterFile,
        @User() user: CurrentUser
    ) {
        const { tempId, modelName } = body;

        const isPrivate = body.isPrivate === 'true';
        
        let targetCompanyId = user.companyId;
        if (user.role === Role.SUPER_ADMIN && body.companyId) {
            targetCompanyId = Number(body.companyId);
        }

        if (!targetCompanyId) {
            throw new BadRequestException('Şirket bilgisi bulunamadı.');
        }

        // Parse optional relations safely
        const categoryId = body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== ''
            ? Number(body.categoryId)
            : undefined;
        const seriesId = body.seriesId !== undefined && body.seriesId !== null && body.seriesId !== ''
            ? Number(body.seriesId)
            : undefined;

        if (categoryId !== undefined && Number.isNaN(categoryId)) {
            throw new BadRequestException('Geçersiz categoryId');
        }
        if (seriesId !== undefined && Number.isNaN(seriesId)) {
            throw new BadRequestException('Geçersiz seriesId');
        }

        return this.arModelService.finalizeTempModel(
            tempId,
            targetCompanyId,
            user.id,
            modelName,
            thumbnail,
            isPrivate,
            categoryId,
            seriesId
        );
    }

    // ----------------------------------------------------------------
    // 5. YÖNETİM VE PAYLAŞIM
    // ----------------------------------------------------------------

    @Post(':id/update') // veya PATCH ':id'
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Modelin adını veya gizlilik durumunu günceller' })
    async updateModel(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string, isPrivate?: boolean, categoryId?: number | null, seriesId?: number | null },
        @User() user: CurrentUser
    ) {
        return this.arModelService.updateModel(id, user, body);
    }

    @Post(':id/share-token')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Model için paylaşılabilir public link (token) oluşturur' })
    async generateShareToken(
        @Param('id', ParseIntPipe) id: number, 
        @User() user: CurrentUser,
        @Req() req: Request
    ) {
        const result = await this.arModelService.generateShareToken(id, user);        
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers.host; 

        const fullUrl = `${protocol}://${host}/view/${result.shareToken}`;

        return {
            shareToken: result.shareToken,
            url: fullUrl
        };
    }

    @Post(':id/revoke-token')
    @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
    @ApiOperation({ summary: 'Paylaşım linkini iptal eder' })
    async revokeShareToken(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
        return this.arModelService.revokeShareToken(id, user);
    }

}