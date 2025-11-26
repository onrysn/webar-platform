import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ARModelModule } from './modules/ar-model/ar-model.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    UserModule, 
    ProductModule, 
    CompanyModule,
    ARModelModule
  ],
})
export class AppModule { }
