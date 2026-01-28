import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core'; // <-- 1. BU EKLENDİ

import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ARModelModule } from './modules/ar-model/ar-model.module';
import { ARSceneModule } from './modules/ar-scene/ar-scene.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { CategoryModule } from './modules/category/category.module';
import { ProductSeriesModule } from './modules/product-series/product-series.module';
import { ShapeModule } from './modules/shape/shape.module';
import { UploadQueueModule } from './modules/upload-queue/upload-queue.module';
import { QuoteRequestModule } from './modules/quote-request/quote-request.module';
import { PbrTextureModule } from './modules/pbr-texture/pbr-texture.module';

@Module({
  imports: [
    // --- STATİK DOSYA AYARI BAŞLANGIÇ ---
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'temp'),
      serveRoot: '/temp',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'thumbnails'),
      serveRoot: '/app/uploads/thumbnails',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'logo'),
      serveRoot: '/uploads/logo',
    }),
    // --- STATİK DOSYA AYARI BİTİŞ ---

    PrismaModule,
    AuthModule,
    UserModule,
    CompanyModule,
    ARModelModule,
    ARSceneModule,
    DashboardModule,
    CategoryModule,
    ProductSeriesModule,
    ShapeModule,
    UploadQueueModule,
    QuoteRequestModule,
    PbrTextureModule
  ],
  // --- 3. PROVIDERS KISMI EKLENDİ ---
  providers: [
    {
      provide: APP_GUARD,      // Bu token, NestJS'e bunun global bir guard olduğunu söyler
      useClass: JwtAuthGuard,  // Hangi class'ı kullanacağını belirtiyoruz
    },
  ],
})
export class AppModule { }