import { Module } from '@nestjs/common';
import { ProductSeriesController } from './product-series.controller';
import { ProductSeriesService } from './product-series.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [ProductSeriesController],
  providers: [ProductSeriesService],
  exports: [ProductSeriesService]
})
export class ProductSeriesModule {}
