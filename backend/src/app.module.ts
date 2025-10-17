import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { userModule } from './modules/user/user.module';
import { productModule } from './modules/product/product.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';

@Module({
  imports: [PrismaModule, AuthModule, userModule, productModule, CompanyModule],
})
export class AppModule {}
