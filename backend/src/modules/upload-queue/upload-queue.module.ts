import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadQueueProcessor } from './upload-queue.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { ARModelModule } from '../ar-model/ar-model.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    BullModule.registerQueue({ name: 'model-convert' }),
    PrismaModule,
    ARModelModule,
  ],
  providers: [UploadQueueProcessor],
  exports: [],
})
export class UploadQueueModule {}
