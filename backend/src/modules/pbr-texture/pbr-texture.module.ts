import { Module } from '@nestjs/common';
import { PbrTextureController } from './pbr-texture.controller';
import { PbrTextureService } from './pbr-texture.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PbrTextureController],
  providers: [PbrTextureService],
  exports: [PbrTextureService],
})
export class PbrTextureModule {}
