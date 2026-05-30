import { NotFoundException } from '@nestjs/common';
import { TransactionDocumentsService } from './transaction-documents.service';

const mockDoc = {
  id: 'doc-1',
  transactionId: 'tx-1',
  versions: [{ versionNumber: 1 }],
};

const mockPrisma = {
  transaction: { findUnique: jest.fn() },
  document: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  documentVersion: { create: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
};

describe('TransactionDocumentsService', () => {
  let service: TransactionDocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionDocumentsService(mockPrisma as any);
  });

  describe('attach', () => {
    it('throws NotFoundException when transaction does not exist', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);
      await expect(
        service.attach(
          'bad-tx',
          {
            documentType: 'CONTRACT',
            fileName: 'f.pdf',
            fileUrl: 'url',
            fileSize: 100,
            mimeType: 'application/pdf',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates document and initial version', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.document.create.mockResolvedValue(mockDoc);
      mockPrisma.documentVersion.create.mockResolvedValue({ versionNumber: 1 });

      const result = await service.attach(
        'tx-1',
        {
          documentType: 'CONTRACT',
          fileName: 'contract.pdf',
          fileUrl: 'http://url',
          fileSize: 1024,
          mimeType: 'application/pdf',
          changeNote: 'Initial',
        },
        'user-1',
      );

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ transactionId: 'tx-1' }) }),
      );
      expect(mockPrisma.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ versionNumber: 1 }) }),
      );
      expect(result).toBe(mockDoc);
    });
  });

  describe('addVersion', () => {
    it('creates next version number and updates document', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.document.findFirst.mockResolvedValue(mockDoc); // has 1 version
      const newVersion = { versionNumber: 2 };
      mockPrisma.$transaction.mockResolvedValue([newVersion, {}]);

      const result = await service.addVersion(
        'tx-1',
        'doc-1',
        { fileUrl: 'url2', fileName: 'v2.pdf', fileSize: 2048 },
        'user-1',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()]),
      );
      expect(result).toBe(newVersion);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when document not in transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.findOne('tx-1', 'bad-doc')).rejects.toThrow(NotFoundException);
    });
  });
});
