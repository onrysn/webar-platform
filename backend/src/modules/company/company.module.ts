import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module'; 

@Module({
  imports: [
    ActivityLogModule 
  ],
  controllers: [CompanyController],
  providers: [CompanyService], 
})
export class CompanyModule {}