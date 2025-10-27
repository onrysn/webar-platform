import { IsInt, IsOptional, IsIn } from 'class-validator';

export class ManageUserDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsIn(['admin', 'editor', 'member'])
  role?: 'admin' | 'editor' | 'member';
}