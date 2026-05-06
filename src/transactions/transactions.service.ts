import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  RecordTransactionOnChainDto,
  TransactionResponseDto,
  TransactionListQueryDto,
  TransactionStatusDto,
  TransactionTypeDto,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Create a new transaction
   */
  async create(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    try {
      // Validate that property and users exist
      const [property, buyer, seller] = await Promise.all([
        this.prisma.property.findUnique({ where: { id: dto.propertyId } }),
        this.prisma.user.findUnique({ where: { id: dto.buyerId } }),
        this.prisma.user.findUnique({ where: { id: dto.sellerId } }),
      ]);

      if (!property) {
        throw new NotFoundException('Property not found');
      }
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }
      if (!seller) {
        throw new NotFoundException('Seller not found');
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          propertyId: dto.propertyId,
          buyerId: dto.buyerId,
          sellerId: dto.sellerId,
          amount: dto.amount,
          type: dto.type as any,
          status: 'PENDING',
          notes: dto.notes,
        },
      });

      this.logger.log(`Transaction created: ${transaction.id}`);
      return this.toResponseDto(transaction);
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all transactions with filtering and pagination
   */
  async findAll(query: TransactionListQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (query.propertyId) where.propertyId = query.propertyId;
      if (query.buyerId) where.buyerId = query.buyerId;
      if (query.sellerId) where.sellerId = query.sellerId;
      if (query.status) where.status = query.status;
      if (query.type) where.type = query.type;

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          include: {
            property: { select: { id: true, title: true, address: true } },
            buyer: { select: { id: true, email: true, firstName: true, lastName: true } },
            seller: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return {
        total,
        page,
        limit,
        items: transactions.map((t) => this.toResponseDto(t)),
      };
    } catch (error) {
      this.logger.error(`Failed to list transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a single transaction by ID
   */
  async findOne(id: string): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
        include: {
          property: { select: { id: true, title: true, address: true } },
          buyer: { select: { id: true, email: true, firstName: true, lastName: true } },
          seller: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return this.toResponseDto(transaction);
    } catch (error) {
      this.logger.error(
        `Failed to find transaction ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a transaction
   */
  async update(
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      const updated = await this.prisma.transaction.update({
        where: { id },
        data: {
          status: dto.status as any,
          notes: dto.notes,
        },
      });

      this.logger.log(`Transaction updated: ${id}`);
      return this.toResponseDto(updated);
    } catch (error) {
      this.logger.error(
        `Failed to update transaction ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Record transaction on blockchain
   */
  async recordOnBlockchain(
    id: string,
    dto: RecordTransactionOnChainDto,
  ): Promise<any> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
        include: {
          buyer: true,
          seller: true,
          property: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.blockchainHash) {
        throw new BadRequestException('Transaction already recorded on blockchain');
      }

      // Get wallet addresses - use provided or fallback to placeholder
      const buyerAddress =
        dto.buyerAddress ||
        `0x${transaction.buyerId.substring(0, 40)}`;

      const sellerAddress =
        dto.sellerAddress ||
        `0x${transaction.sellerId.substring(0, 40)}`;

      // Validate addresses
      if (
        !this.blockchainService.isValidAddress(buyerAddress) ||
        !this.blockchainService.isValidAddress(sellerAddress)
      ) {
        this.logger.warn(
          `Invalid addresses for transaction ${id}. Using fallback hashing.`,
        );
      }

      // Record on blockchain
      const blockchainRecord = await this.blockchainService.recordTransactionOnBlockchain(
        {
          transactionId: id,
          propertyId: transaction.propertyId,
          buyerAddress,
          sellerAddress,
          amount: transaction.amount.toNumber(),
          metadata: {
            transactionType: transaction.type,
            propertyAddress: transaction.property?.address,
          },
        },
      );

      // Update transaction with blockchain data
      const updated = await this.prisma.transaction.update({
        where: { id },
        data: {
          blockchainHash: blockchainRecord.blockchainHash,
          contractAddress: blockchainRecord.contractAddress,
        },
      });

      this.logger.log(
        `Transaction ${id} recorded on blockchain: ${blockchainRecord.blockchainHash}`,
      );

      return {
        transaction: this.toResponseDto(updated),
        blockchain: blockchainRecord,
      };
    } catch (error) {
      this.logger.error(
        `Failed to record transaction on blockchain: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyOnBlockchain(id: string): Promise<any> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (!transaction.blockchainHash) {
        throw new BadRequestException('Transaction not recorded on blockchain');
      }

      const verification = await this.blockchainService.verifyBlockchainTransaction(
        {
          transactionHash: transaction.blockchainHash,
        },
      );

      // Update transaction status if verified and not already completed
      if (verification.verified && verification.status === 'success') {
        await this.prisma.transaction.update({
          where: { id },
          data: {
            status: 'COMPLETED',
          },
        });
      }

      this.logger.log(
        `Transaction ${id} verification result: ${verification.verified}`,
      );

      return verification;
    } catch (error) {
      this.logger.error(
        `Failed to verify transaction on blockchain: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get blockchain statistics for transactions
   */
  async getBlockchainStats() {
    return this.blockchainService.getBlockchainStats();
  }

  /**
   * Convert transaction to response DTO
   */
  private toResponseDto(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      propertyId: transaction.propertyId,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      amount: transaction.amount,
      type: transaction.type as TransactionTypeDto,
      status: transaction.status as TransactionStatusDto,
      blockchainHash: transaction.blockchainHash,
      contractAddress: transaction.contractAddress,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
