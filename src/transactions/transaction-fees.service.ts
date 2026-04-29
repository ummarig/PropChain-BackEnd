import { Injectable } from '@nestjs/common';
import { FeeBreakdown } from './dto/transaction.dto';

const PLATFORM_FEE_RATE = 0.015;
const DEFAULT_AGENT_COMMISSION_RATE = 0.03;
const TAX_RATE = 0.08;

@Injectable()
export class TransactionFeesService {
  calculateFees(amount: number, agentCommissionRate?: number): FeeBreakdown {
    const commissionRate = agentCommissionRate ?? DEFAULT_AGENT_COMMISSION_RATE;
    const platformFee = this.round(amount * PLATFORM_FEE_RATE);
    const agentCommission = this.round(amount * commissionRate);
    const tax = this.round((amount + platformFee + agentCommission) * TAX_RATE);
    const totalFees = this.round(platformFee + agentCommission + tax);

    return {
      transactionAmount: amount,
      platformFee,
      platformFeeRate: PLATFORM_FEE_RATE,
      agentCommission,
      agentCommissionRate: commissionRate,
      tax,
      taxRate: TAX_RATE,
      totalFees,
      totalAmount: this.round(amount + totalFees),
    };
  }

  private round(v: number) {
    return Math.round(v * 100) / 100;
  }
}
