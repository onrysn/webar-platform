import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateCompanyDto {
  @ApiProperty({ example: 'Koçak Park' })
  @IsNotEmpty()
  name: string;
  
  @ApiProperty({ example: 'kocakPark' })
  @IsNotEmpty()
  domain: string;
  
}