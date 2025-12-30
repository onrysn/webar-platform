import { Module } from '@nestjs/common';
import { ARModelController } from './ar-model.controller';
import { ARModelService } from './ar-model.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
    imports: [
        ActivityLogModule
    ], 
    controllers: [ARModelController],
    providers: [ARModelService],
})
export class ARModelModule { }
