import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static'; // EKLENDİ
import { join } from 'path'; // EKLENDİ
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ARModelModule } from './modules/ar-model/ar-model.module';

@Module({
  imports: [
    // --- STATİK DOSYA AYARI BAŞLANGIÇ ---
    // 1. Temp klasörü için (Servisiniz previewUrl olarak '/temp/...' dönüyor)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'temp'),
      serveRoot: '/temp',
    }),
    // 2. Genel uploads klasörü için (Thumbnail'ler veya diğer dosyalar için)
    ServeStaticModule.forRoot({
      // Ana 'uploads' klasörünü değil, sadece içindeki 'thumbnails'i gösteriyoruz
      rootPath: join(process.cwd(), 'uploads', 'thumbnails'),

      // URL'i de buna göre spesifik yapıyoruz.
      // Artık sadece http://.../app/thumbnails/resim.png olarak erişilebilir.
      serveRoot: '/app/uploads/thumbnails',
    }),
    // --- STATİK DOSYA AYARI BİTİŞ ---

    PrismaModule,
    AuthModule,
    UserModule,
    ProductModule,
    CompanyModule,
    ARModelModule
  ],
})
export class AppModule { }