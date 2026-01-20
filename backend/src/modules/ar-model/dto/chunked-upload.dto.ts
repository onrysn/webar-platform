// chunked-upload.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateChunkedUploadDto {
  @ApiProperty({ description: 'Dosya adı', example: 'model.glb' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Dosya boyutu (bytes)', example: 104857600 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ description: 'Dosya tipi', enum: ['glb', 'usdz', 'fbx', 'step'] })
  @IsNotEmpty()
  @IsIn(['glb', 'usdz', 'fbx', 'step'])
  fileType: 'glb' | 'usdz' | 'fbx' | 'step';

  @ApiProperty({ description: 'Chunk boyutu (bytes)', example: 5242880, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1024 * 1024) // Minimum 1MB
  chunkSize?: number;

  @ApiProperty({ description: 'Toplam chunk sayısı', example: 20 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({ description: 'Dosya hash (MD5 veya SHA256)', example: 'abc123...', required: false })
  @IsOptional()
  @IsString()
  fileHash?: string;

  @ApiProperty({ description: 'Mevcut tempId (varsa)', required: false })
  @IsOptional()
  @IsString()
  tempId?: string;

  @ApiProperty({ description: 'Şirket ID (Super Admin için)', required: false })
  @IsOptional()
  @IsNumber()
  companyId?: number;
}

export class UploadChunkDto {
  @ApiProperty({ description: 'Upload session ID' })
  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @ApiProperty({ description: 'Chunk numarası (0-based)', example: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @ApiProperty({ description: 'Chunk hash (MD5)', required: false })
  @IsOptional()
  @IsString()
  chunkHash?: string;
}

export class CompleteChunkedUploadDto {
  @ApiProperty({ description: 'Upload session ID' })
  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @ApiProperty({ description: 'Dosya hash (doğrulama için)', required: false })
  @IsOptional()
  @IsString()
  fileHash?: string;
}

export interface ChunkedUploadSession {
  uploadId: string;
  userId: number;
  companyId?: number;
  fileName: string;
  fileSize: number;
  fileType: 'glb' | 'usdz' | 'fbx' | 'step';
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  tempId?: string;
  fileHash?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  error?: string;
}

export interface ChunkUploadProgress {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  progress: number; // 0-100
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  canResume: boolean;
  error?: string;
}
