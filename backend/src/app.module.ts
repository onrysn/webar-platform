import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { authModule } from './modules/auth/auth.module';
import { userModule } from './modules/user/user.module';
import { productModule } from './modules/product/product.module';

@Module({
  imports: [PrismaModule, authModule, userModule, productModule],
})
export class AppModule {}
