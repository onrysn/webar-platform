import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsInt, Min, IsString } from "class-validator";

export class CreateCompanyDto {
  @ApiProperty({ example: 'Koçak Park' })
  @IsNotEmpty()
  name: string;
  
  @ApiProperty({ example: 'kocakPark' })
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ required: false, description: 'Maksimum sahne sayısı', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScenes?: number;

  @ApiProperty({ required: false, description: 'Logo dosyası (base64)', example: 'data:image/png;base64,iVBORw0KGgoAAAANS...' })
  @IsOptional()
  @IsString()
  logoBase64?: string;
}