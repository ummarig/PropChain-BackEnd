import { TransactionAuditService } from './transaction-audit.service';

const mockPrisma = {
  transactionHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('TransactionAuditService', () => {
  let service: TransactionAuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionAuditService(mockPrisma as any);
  });

  it('creates an audit log entry with correct fields', async () => {
    mockPrisma.transactionHistory.create.mockResolvedValue({ id: 'log-1' });

    await service.log(
      'tx-1',
      'CREATED',
      null,
      { amount: 100 },
      { actorId: 'user-1', ipAddress: '127.0.0.1' },
    );

    expect(mockPrisma.transactionHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transactionId: 'tx-1',
        status: 'CREATED',
        actorId: 'user-1',
        notes: expect.any(String),
        metadata: expect.objectContaining({
          ipAddress: '127.0.0.1',
        }),
      }),
    });
  });

  it('creates a log with null actor for system actions', async () => {
    mockPrisma.transactionHistory.create.mockResolvedValue({ id: 'log-2' });

    await service.log('tx-1', 'UPDATED', { status: 'PENDING' }, { status: 'COMPLETED' });

    expect(mockPrisma.transactionHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: undefined }),
    });
  });

  it('returns audit logs ordered by createdAt asc', async () => {
    const logs = [{ id: 'log-1', status: 'CREATED' }];
    mockPrisma.transactionHistory.findMany.mockResolvedValue(logs);

    const result = await service.findByTransaction('tx-1');

    expect(mockPrisma.transactionHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: 'tx-1' },
        orderBy: { createdAt: 'asc' },
      }),
    );
    expect(result).toBe(logs);
  });
});
