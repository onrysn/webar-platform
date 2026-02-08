import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SCENE_EXPORT_QUEUE,
  SceneExportJobData,
  SceneExportJobResult,
} from './scene-export.processor';

export interface ExportJobStatus {
  jobId: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  progress: number;
  progressMessage?: string;
  result?: SceneExportJobResult;
  error?: string;
  createdAt?: number;
  finishedAt?: number;
}

@Injectable()
export class SceneExportQueueService {
  private readonly logger = new Logger(SceneExportQueueService.name);

  constructor(
    @InjectQueue(SCENE_EXPORT_QUEUE)
    private readonly exportQueue: Queue<SceneExportJobData, SceneExportJobResult>,
  ) {}

  /**
   * Export işini kuyruğa ekler ve jobId döner.
   * Aynı token için aktif bir iş varsa onu döner (duplicate önleme).
   */
  async enqueue(
    token: string,
    sceneName: string,
    convertToUsdz: boolean,
  ): Promise<{ jobId: string }> {
    // Duplicate kontrolü: aynı token için bekleyen/aktif iş var mı?
    const existingJob = await this.findActiveJobForToken(token);
    if (existingJob) {
      this.logger.log(
        `Mevcut aktif job bulundu: ${existingJob.id} (token=${token})`,
      );
      return { jobId: existingJob.id! };
    }

    const job = await this.exportQueue.add(
      'export',
      { token, sceneName, convertToUsdz },
      {
        removeOnComplete: { age: 3600 }, // 1 saat sonra temizle
        removeOnFail: { age: 1800 },     // 30 dk sonra temizle
        attempts: 1,                      // Tekrar deneme yok (export idempotent değil)
      },
    );

    this.logger.log(
      `Export job eklendi: ${job.id} (token=${token}, scene="${sceneName}")`,
    );

    return { jobId: job.id! };
  }

  /**
   * Job durumunu sorgular.
   */
  async getJobStatus(jobId: string): Promise<ExportJobStatus> {
    const job = await this.exportQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Export job bulunamadı: ${jobId}`);
    }

    const state = await job.getState();
    const rawProgress = job.progress;
    const progress =
      typeof rawProgress === 'object' && rawProgress !== null
        ? (rawProgress as any).percent ?? 0
        : typeof rawProgress === 'number'
          ? rawProgress
          : 0;
    const progressMessage =
      typeof rawProgress === 'object' && rawProgress !== null
        ? (rawProgress as any).message ?? ''
        : '';

    const result: ExportJobStatus = {
      jobId: job.id!,
      status: this.mapState(state),
      progress,
      progressMessage,
      createdAt: job.timestamp,
      finishedAt: job.finishedOn,
    };

    if (state === 'completed' && job.returnvalue) {
      result.result = job.returnvalue as SceneExportJobResult;
    }

    if (state === 'failed') {
      result.error = job.failedReason || 'Bilinmeyen hata';
    }

    return result;
  }

  /**
   * Aynı token için bekleyen veya aktif bir job var mı?
   */
  private async findActiveJobForToken(
    token: string,
  ): Promise<any | null> {
    // Waiting + active job'ları kontrol et
    const waiting = await this.exportQueue.getJobs(['waiting', 'delayed']);
    const active = await this.exportQueue.getJobs(['active']);
    const allJobs = [...waiting, ...active];

    for (const job of allJobs) {
      if (job?.data?.token === token) {
        return job;
      }
    }
    return null;
  }

  private mapState(
    state: string,
  ): 'queued' | 'active' | 'completed' | 'failed' {
    switch (state) {
      case 'waiting':
      case 'delayed':
      case 'prioritized':
        return 'queued';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'queued';
    }
  }
}
