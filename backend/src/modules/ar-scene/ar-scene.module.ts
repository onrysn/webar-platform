import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ARSceneController } from './ar-scene.controller';
import { ARSceneService } from './ar-scene.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
    imports: [
        ActivityLogModule
    ], 
    controllers: [ARSceneController],
    providers: [ARSceneService],
})
export class ARSceneModule { }
