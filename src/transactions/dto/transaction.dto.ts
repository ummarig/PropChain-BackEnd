import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDecimal,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionTypeDto {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatusDto {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'Buyer user ID' })
  @IsString()
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Seller user ID' })
  @IsString()
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: 'Transaction amount in currency' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: TransactionTypeDto })
  @IsEnum(TransactionTypeDto)
  type: TransactionTypeDto;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: TransactionStatusDto })
  @IsOptional()
  @IsEnum(TransactionStatusDto)
  status?: TransactionStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordTransactionOnChainDto {
  @ApiPropertyOptional({ description: 'Buyer wallet address' })
  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @ApiPropertyOptional({ description: 'Seller wallet address' })
  @IsOptional()
  @IsString()
  sellerAddress?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: TransactionTypeDto })
  type: TransactionTypeDto;

  @ApiProperty({ enum: TransactionStatusDto })
  status: TransactionStatusDto;

  @ApiPropertyOptional()
  blockchainHash?: string;

  @ApiPropertyOptional()
  contractAddress?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TransactionListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ enum: TransactionStatusDto })
  @IsOptional()
  @IsEnum(TransactionStatusDto)
  status?: TransactionStatusDto;

  @ApiPropertyOptional({ enum: TransactionTypeDto })
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
