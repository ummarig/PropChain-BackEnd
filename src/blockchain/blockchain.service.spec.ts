import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { PrismaService } from '../database/prisma.service';
import {
  RecordTransactionOnBlockchainDto,
  BlockchainNetwork,
  VerifyBlockchainTransactionDto,
} from './dto/blockchain.dto';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        BLOCKCHAIN_ENABLED: 'true',
        BLOCKCHAIN_NETWORK: BlockchainNetwork.SEPOLIA,
        BLOCKCHAIN_RPC_URL: 'https://sepolia.infura.io/v3/test',
        BLOCKCHAIN_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
        BLOCKCHAIN_PRIVATE_KEY: 'test-private-key',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockPrismaService = {
    transaction: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBlockchainHash', () => {
    it('should generate a consistent keccak256-like hash', () => {
      const data = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xBuyer',
        sellerAddress: '0xSeller',
        amount: 1000,
      };

      const hash1 = service.generateBlockchainHash(data);
      const hash2 = service.generateBlockchainHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different data', () => {
      const data1 = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xBuyer',
        sellerAddress: '0xSeller',
        amount: 1000,
      };

      const data2 = {
        transactionId: 'tx-124',
        propertyId: 'prop-456',
        buyerAddress: '0xBuyer',
        sellerAddress: '0xSeller',
        amount: 1000,
      };

      const hash1 = service.generateBlockchainHash(data1);
      const hash2 = service.generateBlockchainHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle address normalization', () => {
      const data1 = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xBUYER',
        sellerAddress: '0xSELLER',
        amount: 1000,
      };

      const data2 = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xbuyer',
        sellerAddress: '0xseller',
        amount: 1000,
      };

      const hash1 = service.generateBlockchainHash(data1);
      const hash2 = service.generateBlockchainHash(data2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateDocumentHash', () => {
    it('should generate SHA256 hash for documents', () => {
      const content = 'test document content';
      const hash = service.generateDocumentHash(content);

      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate consistent hashes for same content', () => {
      const content = 'test document content';
      const hash1 = service.generateDocumentHash(content);
      const hash2 = service.generateDocumentHash(content);

      expect(hash1).toBe(hash2);
    });
  });

  describe('recordTransactionOnBlockchain', () => {
    it('should record transaction and update database', async () => {
      const dto: RecordTransactionOnBlockchainDto = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xBuyer',
        sellerAddress: '0xSeller',
        amount: 1000,
      };

      mockPrismaService.transaction.update.mockResolvedValue({
        id: dto.transactionId,
        blockchainHash: expect.any(String),
      });

      const result = await service.recordTransactionOnBlockchain(dto);

      expect(result).toHaveProperty('transactionHash');
      expect(result).toHaveProperty('blockchainHash');
      expect(result).toHaveProperty('explorerUrl');
      expect(result.status).toBe('pending');
      expect(mockPrismaService.transaction.update).toHaveBeenCalled();
    });

    it('should generate explorer URL for transaction', async () => {
      const dto: RecordTransactionOnBlockchainDto = {
        transactionId: 'tx-123',
        propertyId: 'prop-456',
        buyerAddress: '0xBuyer',
        sellerAddress: '0xSeller',
        amount: 1000,
      };

      mockPrismaService.transaction.update.mockResolvedValue({
        id: dto.transactionId,
        blockchainHash: expect.any(String),
      });

      const result = await service.recordTransactionOnBlockchain(dto);

      expect(result.explorerUrl).toContain('sepolia.etherscan.io');
      expect(result.explorerUrl).toContain('/tx/');
    });
  });

  describe('verifyBlockchainTransaction', () => {
    it('should verify transaction and return result', async () => {
      const dto: VerifyBlockchainTransactionDto = {
        transactionHash: '0x123abc',
        network: BlockchainNetwork.SEPOLIA,
      };

      const result = await service.verifyBlockchainTransaction(dto);

      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('transactionHash');
      expect(result).toHaveProperty('blockNumber');
      expect(result).toHaveProperty('status');
    });
  });

  describe('getBlockchainStats', () => {
    it('should retrieve blockchain statistics', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        {
          blockchainHash: '0xhash1',
          amount: { toNumber: () => 1000 },
          status: 'COMPLETED',
        },
        {
          blockchainHash: '0xhash2',
          amount: { toNumber: () => 2000 },
          status: 'PENDING',
        },
      ]);

      const stats = await service.getBlockchainStats();

      expect(stats).toHaveProperty('totalTransactions');
      expect(stats).toHaveProperty('confirmedTransactions');
      expect(stats).toHaveProperty('pendingTransactions');
      expect(stats).toHaveProperty('totalValue');
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalled();
    });
  });

  describe('generateExplorerLink', () => {
    it('should generate transaction explorer link', () => {
      const hash = '0x123abc';
      const link = service.generateExplorerLink(hash, 'transaction');

      expect(link).toContain('sepolia.etherscan.io');
      expect(link).toContain('/tx/');
      expect(link).toContain(hash);
    });

    it('should generate address explorer link', () => {
      const address = '0xaddress123';
      const link = service.generateExplorerLink(address, 'address');

      expect(link).toContain('sepolia.etherscan.io');
      expect(link).toContain('/address/');
      expect(link).toContain(address);
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(service.isValidAddress(validAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(service.isValidAddress('invalid')).toBe(false);
      expect(service.isValidAddress('0x123')).toBe(false);
      expect(service.isValidAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(
        false,
      );
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus();

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('network');
      expect(status).toHaveProperty('contractAddress');
      expect(status).toHaveProperty('explorerUrl');
      expect(status.enabled).toBe(true);
      expect(status.network).toBe(BlockchainNetwork.SEPOLIA);
    });
  });

  describe('getCurrentNetwork', () => {
    it('should return current blockchain network', () => {
      const network = service.getCurrentNetwork();

      expect(network).toBe(BlockchainNetwork.SEPOLIA);
    });
  });
});
