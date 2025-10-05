import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger yapılandırması
  const config = new DocumentBuilder()
    .setTitle('AR Platform API')
    .setDescription('Bu API, WebAR platformunun backend servislerini içerir.')
    .setVersion('1.0')
    .addBearerAuth() // Authorization: Bearer token desteği
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
