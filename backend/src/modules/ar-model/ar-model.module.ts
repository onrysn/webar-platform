import { Module } from '@nestjs/common';
import { ARModelController } from './ar-model.controller';
import { ARModelService } from './ar-model.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ARModelSharedController } from './ar-model-shared.controller';

@Module({
    imports: [
        ActivityLogModule
    ],
    controllers: [
        ARModelController,
        ARModelSharedController
    ],
    providers: [ARModelService],
    exports: [ARModelService]
})
export class ARModelModule { }
