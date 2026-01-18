import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ARModelService } from '../ar-model/ar-model.service';
import * as fs from 'fs';
import * as path from 'path';

@Processor('model-convert')
@Injectable()
export class UploadQueueProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private arModelService: ARModelService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tempId, type, inputPath, userId, companyId } = job.data as {
      tempId: string;
      type: 'fbx' | 'step';
      inputPath: string;
      userId?: number;
      companyId?: number;
    };

    await (this.prisma as any).modelUploadJob.update({
      where: { tempId },
      data: { status: 'CONVERTING', progress: 5 },
    });

    try {
      const tempDir = path.dirname(inputPath);

      let glbPath: string;
      if (type === 'fbx') {
        const fake = { originalname: path.basename(inputPath), path: inputPath } as any;
        glbPath = await this.arModelService.convertCadToGlb(fake);
      } else {
        glbPath = await this.arModelService.convertStepToGlb(inputPath);
      }

      await (this.prisma as any).modelUploadJob.update({
        where: { tempId },
        data: { progress: 60 },
      });

      // USDZ dönüştürme
      const glbFile = {
        originalname: path.basename(glbPath),
        path: glbPath,
      } as any;
      // Tekrar eden kodu kullanmak yerine mevcut helper'ı yeniden kullanalım
      // GLB->USDZ için arModelService.convertGlbToUsdzTemp bekliyor MulterFile + userId
      const glbBuffer = fs.readFileSync(glbPath);
      const tmpId = tempId;
      const tmpRoot = path.join(process.cwd(), 'uploads', 'temp', tmpId);
      if (!fs.existsSync(tmpRoot)) fs.mkdirSync(tmpRoot, { recursive: true });
      const finalGlbPath = path.join(tmpRoot, path.basename(glbPath));
      if (glbPath !== finalGlbPath) fs.copyFileSync(glbPath, finalGlbPath);

      const formGlb: any = {
        originalname: path.basename(glbPath),
        buffer: glbBuffer,
      };

      const converted = await this.arModelService.convertGlbToUsdzTemp(formGlb as any, userId, tempId);

      await (this.prisma as any).modelUploadJob.update({
        where: { tempId },
        data: {
          status: 'CONVERTED',
          progress: 100,
          glbPath: finalGlbPath,
          usdzPath: converted.usdz.path,
          message: 'Dönüştürme tamamlandı, onay bekleniyor',
        },
      });

      return { tempId, glb: converted.glb, usdz: converted.usdz };
    } catch (err: any) {
      await (this.prisma as any).modelUploadJob.update({
        where: { tempId },
        data: { status: 'ERROR', progress: 100, message: String(err?.message || err) },
      });
      throw new InternalServerErrorException(err?.message || 'Conversion failed');
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    // Placeholder for future notifications
  }
}
