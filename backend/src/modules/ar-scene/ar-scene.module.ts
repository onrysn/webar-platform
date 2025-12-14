import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ARSceneController } from './ar-scene.controller';
import { ARSceneService } from './ar-scene.service';

@Module({
    controllers: [ARSceneController],
    providers: [ARSceneService, PrismaService],
})
export class ARSceneModule { }
