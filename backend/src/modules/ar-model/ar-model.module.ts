import { Module } from '@nestjs/common';
import { ARModelController } from './ar-model.controller';
import { ARModelService } from './ar-model.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [ARModelController],
    providers: [ARModelService, PrismaService],
})
export class ARModelModule { }
