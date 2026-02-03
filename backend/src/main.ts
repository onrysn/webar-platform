import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  app.enableCors();
  
  // JSON body size limitini artır (logo base64 için)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,               // DTO’da olmayan alanları otomatik siler
    forbidNonWhitelisted: true,    // ekstra alan varsa hata fırlatır
    transform: true,               // DTO tip dönüşümü yapar
  }));

  // Swagger yapılandırması
  const config = new DocumentBuilder()
    .setTitle('AR Platform API')
    .setDescription('Bu API, WebAR platformunun backend servislerini içerir.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token', // Security name
    ) // Authorization: Bearer token desteği
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Bearer token kalıcı olsun
    },
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`📘 Swagger Docs: http://localhost:${process.env.PORT || 3000}/api/docs`);
}
bootstrap();
