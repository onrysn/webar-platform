import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { SceneExportService } from './scene-export.service';

export interface SceneExportJobData {
  token: string;
  sceneName: string;
  convertToUsdz: boolean;
}

export interface SceneExportJobResult {
  exportId: string;
  sceneName: string;
  glb?: { fileName: string; url: string; size: number; sizeFormatted: string };
  usdz?: { fileName: string; url: string; size: number; sizeFormatted: string };
  usdzError?: string;
}

export const SCENE_EXPORT_QUEUE = 'scene-export';

@Processor(SCENE_EXPORT_QUEUE, {
  concurrency: 2, // Aynı anda max 2 export
})
@Injectable()
export class SceneExportProcessor extends WorkerHost {
  private readonly logger = new Logger(SceneExportProcessor.name);

  constructor(private readonly sceneExportService: SceneExportService) {
    super();
  }

  async process(job: Job<SceneExportJobData>): Promise<SceneExportJobResult> {
    const { token, sceneName, convertToUsdz } = job.data;

    this.logger.log(
      `[Job ${job.id}] Export başlatılıyor: "${sceneName}" (usdz=${convertToUsdz})`,
    );

    await job.updateProgress(10);

    try {
      // Sahneyi oluştur (GLB build + merge + draco + optional USDZ)
      // Progress callback ile her adımda durum güncellenir
      const result = await this.sceneExportService.exportScene(token, {
        sceneName,
        convertToUsdz,
        onProgress: async (progress: number, message: string) => {
          await job.updateProgress({ percent: progress, message });
          this.logger.debug(`[Job ${job.id}] %${progress} - ${message}`);
        },
      });

      await job.updateProgress({ percent: 100, message: 'Tamamlandı!' });

      const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };

      const jobResult: SceneExportJobResult = {
        exportId: result.exportId,
        sceneName: result.sceneName,
        glb: result.glb
          ? {
              ...result.glb,
              url: `/api${result.glb.url}`,
              sizeFormatted: formatSize(result.glb.size),
            }
          : undefined,
        usdz: result.usdz
          ? {
              ...result.usdz,
              url: `/api${result.usdz.url}`,
              sizeFormatted: formatSize(result.usdz.size),
            }
          : undefined,
        usdzError: result.usdzError,
      };

      this.logger.log(
        `[Job ${job.id}] Export tamamlandı: GLB=${jobResult.glb?.sizeFormatted}${jobResult.usdz ? ` USDZ=${jobResult.usdz.sizeFormatted}` : ''}`,
      );

      return jobResult;
    } catch (err) {
      this.logger.error(`[Job ${job.id}] Export hatası:`, err);
      throw err;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`[Job ${job.id}] Tamamlandı`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[Job ${job.id}] Başarısız: ${error.message}`);
  }
}
