import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSeriesDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
