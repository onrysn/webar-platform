import { PartialType } from '@nestjs/swagger';
import { CreatePbrTextureDto } from './create-pbr-texture.dto';

export class UpdatePbrTextureDto extends PartialType(CreatePbrTextureDto) {}
