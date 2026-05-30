import { TransactionFeesService } from './transaction-fees.service';

describe('TransactionFeesService', () => {
  let service: TransactionFeesService;

  beforeEach(() => {
    service = new TransactionFeesService();
  });

  it('calculates fees correctly for a standard amount', () => {
    const result = service.calculateFees(100_000);

    expect(result.transactionAmount).toBe(100_000);
    expect(result.platformFee).toBe(1_500); // 1.5%
    expect(result.platformFeeRate).toBe(0.015);
    expect(result.agentCommission).toBe(3_000); // 3%
    expect(result.agentCommissionRate).toBe(0.03);
    // tax = (100000 + 1500 + 3000) * 0.08 = 8360
    expect(result.tax).toBe(8_360);
    expect(result.taxRate).toBe(0.08);
    expect(result.totalFees).toBe(12_860);
    expect(result.totalAmount).toBe(112_860);
  });

  it('uses custom agent commission rate when provided', () => {
    const result = service.calculateFees(100_000, 0.05);

    expect(result.agentCommission).toBe(5_000);
    expect(result.agentCommissionRate).toBe(0.05);
  });

  it('returns zero fees for zero amount', () => {
    const result = service.calculateFees(0);

    expect(result.platformFee).toBe(0);
    expect(result.agentCommission).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.totalFees).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = service.calculateFees(333.33);

    expect(result.platformFee).toBe(5); // 333.33 * 0.015 = 4.99995 → 5
    expect(Number.isInteger(result.platformFee * 100)).toBe(true);
  });
});
