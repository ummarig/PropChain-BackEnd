import { TransactionAuditService } from './transaction-audit.service';

const mockPrisma = {
  transactionAuditLog: {
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
    mockPrisma.transactionAuditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.log('tx-1', 'CREATED', null, { amount: 100 }, { actorId: 'user-1', ipAddress: '127.0.0.1' });

    expect(mockPrisma.transactionAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transactionId: 'tx-1',
        action: 'CREATED',
        previousData: undefined,
        newData: { amount: 100 },
        actorId: 'user-1',
        ipAddress: '127.0.0.1',
      }),
    });
  });

  it('creates a log with null actor for system actions', async () => {
    mockPrisma.transactionAuditLog.create.mockResolvedValue({ id: 'log-2' });

    await service.log('tx-1', 'UPDATED', { status: 'PENDING' }, { status: 'COMPLETED' });

    expect(mockPrisma.transactionAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: undefined }),
    });
  });

  it('returns audit logs ordered by createdAt asc', async () => {
    const logs = [{ id: 'log-1', action: 'CREATED' }];
    mockPrisma.transactionAuditLog.findMany.mockResolvedValue(logs);

    const result = await service.findByTransaction('tx-1');

    expect(mockPrisma.transactionAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: 'tx-1' },
        orderBy: { createdAt: 'asc' },
      }),
    );
    expect(result).toBe(logs);
  });
});
