import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ARSceneController } from './ar-scene.controller';
import { ARSceneService } from './ar-scene.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ARSceneSharedController } from './ar-scene.shared.controller';
import { ARModelModule } from '../ar-model/ar-model.module';
import { SceneExportService } from './scene-export.service';
import { SceneExportProcessor, SCENE_EXPORT_QUEUE } from './scene-export.processor';
import { SceneExportQueueService } from './scene-export-queue.service';

@Module({
    imports: [
        ActivityLogModule,
        ARModelModule,
        BullModule.registerQueue({ name: SCENE_EXPORT_QUEUE }),
    ], 
    controllers: [
            ARSceneController,
            ARSceneSharedController
        ],
    providers: [ARSceneService, SceneExportService, SceneExportProcessor, SceneExportQueueService],
})
export class ARSceneModule { }
