// ar-model.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards, Query, Get, Param, Res, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ARModelService } from './ar-model.service';
import { modelUploadConfig } from 'src/config/multer/ar-model-upload.config';
import { File as MulterFile } from 'multer';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiQuery, ApiBody } from '@nestjs/swagger';
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

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', modelUploadConfig))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                companyId: { type: 'number' },
            },
            required: ['file', 'companyId'],
        },
    })
    async uploadModel(
        @UploadedFile() file: MulterFile,
        @Body('companyId') companyId: number,
        @Req() req: any
    ) {
        const userId = req.user.userId;
        return this.arModelService.uploadModel(file, +companyId, userId);
    }


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
            },
        });

        return models;
    }

}
