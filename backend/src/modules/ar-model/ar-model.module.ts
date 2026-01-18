import { Module } from '@nestjs/common';
import { ARModelController } from './ar-model.controller';
import { ARModelService } from './ar-model.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ARModelSharedController } from './ar-model-shared.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        ActivityLogModule,
        BullModule.registerQueue({ name: 'model-convert' })
    ],
    controllers: [
        ARModelController,
        ARModelSharedController
    ],
    providers: [ARModelService],
    exports: [ARModelService]
})
export class ARModelModule { }
