import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export const TRANSACTION_TYPE_ENUM = ['SALE', 'PURCHASE', 'TRANSFER'] as const;

export class CreateTransactionDto {
  @IsString()
  propertyId: string;

  @IsString()
  buyerId: string;

  @IsString()
  sellerId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsIn(TRANSACTION_TYPE_ENUM)
  type: (typeof TRANSACTION_TYPE_ENUM)[number];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  blockchainHash?: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;
}

export class CalculateFeesDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsIn(TRANSACTION_TYPE_ENUM)
  type?: (typeof TRANSACTION_TYPE_ENUM)[number];

  /** Agent commission rate override (0–1). Defaults to 0.03 */
  @IsOptional()
  @IsNumber()
  agentCommissionRate?: number;
}

export class FeeBreakdown {
  transactionAmount: number;
  platformFee: number;
  platformFeeRate: number;
  agentCommission: number;
  agentCommissionRate: number;
  tax: number;
  taxRate: number;
  totalFees: number;
  totalAmount: number;
}
