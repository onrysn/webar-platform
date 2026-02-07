import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ARSceneController } from './ar-scene.controller';
import { ARSceneService } from './ar-scene.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ARSceneSharedController } from './ar-scene.shared.controller';
import { ARModelModule } from '../ar-model/ar-model.module';
import { SceneExportService } from './scene-export.service';

@Module({
    imports: [
        ActivityLogModule,
        ARModelModule
    ], 
    controllers: [
            ARSceneController,
            ARSceneSharedController
        ],
    providers: [ARSceneService, SceneExportService],
})
export class ARSceneModule { }
