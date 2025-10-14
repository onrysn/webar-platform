import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { userModule } from './modules/user/user.module';
import { productModule } from './modules/product/product.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, userModule, productModule],
})
export class AppModule {}
