import { Module } from '@nestjs/common';
import { QuoteRequestController } from './quote-request.controller';
import { QuoteRequestService } from './quote-request.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [QuoteRequestController],
  providers: [QuoteRequestService],
  exports: [QuoteRequestService],
})
export class QuoteRequestModule {}
