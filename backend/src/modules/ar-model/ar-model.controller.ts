// ar-model.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards, Query, Get, Param, Res, Body, BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ARModelService } from './ar-model.service';
import { modelUploadConfig } from 'src/config/multer/ar-model-upload.config';
import { File as MulterFile } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiQuery, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { Response } from 'express';
import * as path from 'path';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags('ar-model')
@Controller('ar-model')
export class ARModelController {
    constructor(private readonly arModelService: ARModelService, private prisma: PrismaService) { }

    @Get('download/:id')
    async downloadModel(@Param('id') id: number, @Res() res: Response) {
        const model = await this.prisma.aRModel.findUnique({ where: { id } });
        if (!model) return res.status(404).send('Model not found');

        const buffer = this.arModelService.decryptFile(model.filePath, model.iv, model.authTag);

        // filename uzantısı yoksa fileType'dan ekle
        let filename = model.fileName;
        if (!path.extname(filename) && model.fileType.startsWith('.')) {
            filename += model.fileType;
        }

        res.setHeader('Content-Type', model.fileType.startsWith('.') ? 'application/octet-stream' : model.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }

    @Get('list')
    @ApiQuery({
        name: 'companyId',
        required: false,
        type: Number,
        description: 'Şirket ID (opsiyonel). Eğer verilmezse kullanıcıya ait tüm modeller gelir.',
    })
    async listModels(
        @Query('companyId') companyId: number | null,
        @Req() req: any
    ) {
        const userId = req.user.userId;

        const whereClause: any = { uploadedBy: userId };
        if (companyId) {
            whereClause.companyId = +companyId;
        }

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

    // --------------------------
    // FBX upload -> backend does glb+usdz, returns tempId + preview urls
    // --------------------------
    @Post('upload-fbx')
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadFbx(@UploadedFile() file: MulterFile, @Req() req: any) {
        if (!file) throw new BadRequestException('File is required');
        const userId = req.user.userId;
        // convertFbxToTemp returns { tempId, glbUrl, usdzUrl, names... }
        return this.arModelService.convertFbxToTemp(file, userId);
    }

    // --------------------------
    // Manual GLB upload -> saved to tempId (if provided) or create new
    // --------------------------
    @Post('upload-glb')
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, tempId: { type: 'string', nullable: true } } } })
    async uploadGlb(@UploadedFile() file: MulterFile, @Body('tempId') tempId: string | undefined, @Req() req: any) {
        if (!file) throw new BadRequestException('File is required');
        const userId = req.user.userId;
        return this.arModelService.saveTempUploadedModel(file, 'glb', tempId, userId);
    }

    // --------------------------
    // Manual USDZ upload -> saved to same tempId (if provided) or create new
    // --------------------------
    @Post('upload-usdz')
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, tempId: { type: 'string', nullable: true } } } })
    async uploadUsdz(@UploadedFile() file: MulterFile, @Body('tempId') tempId: string | undefined, @Req() req: any) {
        if (!file) throw new BadRequestException('File is required');
        const userId = req.user.userId;
        return this.arModelService.saveTempUploadedModel(file, 'usdz', tempId, userId);
    }

    // --------------------------
    // Finalize -> tempId required, metadata e.g. companyId, thumbnail
    // --------------------------
    // ar-model.controller.ts

    @Post('finalize')
    @UseInterceptors(FileInterceptor('thumbnail'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Temp klasöründeki dosyaları şifreleyip kalıcı klasöre taşır ve DB kaydı oluşturur.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                tempId: { type: 'string' },
                companyId: { type: 'number' },
                modelName: { type: 'string', nullable: true },
                thumbnail: { type: 'string', format: 'binary', description: 'Thumbnail görsel dosyası' },
            },
            required: ['tempId', 'companyId']
        }
    })
    async finalize(
        @Body() body: { tempId: string, companyId: string, modelName?: string },
        @UploadedFile() thumbnail: MulterFile,
        @Req() req: any
    ) {
        const userId = req.user.userId;
        const { tempId, companyId, modelName } = body;

        return this.arModelService.finalizeTempModel(
            tempId,
            Number(companyId),
            userId,
            modelName,
            thumbnail
        );
    }


    // 1. DETAY EKRANI İÇİN DATA
    @Get(':id')
    @ApiOperation({ summary: 'Model detaylarını, dosya boyutlarını ve thumbnail bilgisini döner' })
    async getModelDetails(@Param('id') id: number) {
        const model = await this.prisma.aRModel.findUnique({
            where: { id: +id },
            include: {
                company: { select: { name: true } },
                user: { select: { name: true, email: true } }
            }
        });

        if (!model) throw new NotFoundException('Model bulunamadı');

        // Frontend'e temiz, kullanıma hazır bir obje dönüyoruz
        return {
            id: model.id,
            fileName: model.fileName,
            description: `${model.company.name} tarafından yüklendi.`,
            uploadedBy: model.user.name,
            createdAt: model.createdAt,
            // Thumbnail varsa statik path, yoksa null
            thumbnailUrl: model.thumbnailPath ? model.thumbnailPath : null,
            files: {
                glb: {
                    exists: true, // GLB her zaman ana dosya olduğu için true
                    size: model.fileSize, // Byte cinsinden
                    format: 'glb'
                },
                usdz: {
                    exists: !!model.usdzFilePath,
                    size: model.usdzFileSize || 0,
                    format: 'usdz'
                }
            }
        };
    }

    @Get(':id/file')
    @ApiOperation({ summary: 'Model dosyasını stream eder (Preview veya Download)' })
    @ApiQuery({ name: 'format', enum: ['glb', 'usdz'], required: false })
    @ApiQuery({ name: 'mode', enum: ['view', 'download'], required: false })
    async getModelFile(
        @Param('id') id: number,
        @Query('format') format: 'glb' | 'usdz' = 'glb',
        @Query('mode') mode: 'view' | 'download' = 'view',
        @Res({ passthrough: true }) res: Response // 2. passthrough: true ekliyoruz
    ): Promise<StreamableFile> { // 3. Dönüş tipi StreamableFile

        const model = await this.prisma.aRModel.findUnique({ where: { id: +id } });
        if (!model) throw new NotFoundException('Model bulunamadı');

        // Service'den decrypt edilmiş buffer'ı al
        const { buffer, mimeType, filename } = await this.arModelService.getModelFileBuffer(model, format);

        // Header ayarları
        res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            'Content-Disposition': `${mode === 'download' ? 'attachment' : 'inline'}; filename="${filename}"`,
            // Cache kontrolü eklemek performansı artırır (opsiyonel)
            'Cache-Control': 'private, max-age=3600'
        });

        // 4. NestJS StreamableFile ile buffer'ı dönüyoruz
        return new StreamableFile(buffer);
    }

    @Post('convert-glb-to-usdz')
    @ApiOperation({ summary: 'GLB yükler, converter servisi ile USDZ oluşturur ve temp bilgilerini döner.' })
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'Sadece .glb dosyası yükleyin' }
            }
        }
    })
    async convertGlbToUsdz(@UploadedFile() file: MulterFile, @Req() req: any) {
        if (!file) throw new BadRequestException('Dosya gereklidir.');

        // Basit bir uzantı kontrolü
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.glb') {
            throw new BadRequestException('Sadece .glb uzantılı dosyalar desteklenmektedir.');
        }

        const userId = req.user.userId;
        return this.arModelService.convertGlbToUsdzTemp(file, userId);
    }

}
