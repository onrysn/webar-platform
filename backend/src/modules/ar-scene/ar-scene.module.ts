import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ARSceneController } from './ar-scene.controller';
import { ARSceneService } from './ar-scene.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ARSceneSharedController } from './ar-scene.shared.controller';

@Module({
    imports: [
        ActivityLogModule
    ], 
    controllers: [
            ARSceneController,
            ARSceneSharedController
        ],
    providers: [ARSceneService],
})
export class ARSceneModule { }
