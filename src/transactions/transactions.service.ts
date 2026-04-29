import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { TransactionFeesService } from './transaction-fees.service';
import { TransactionAuditService, AuditContext } from './transaction-audit.service';
import { CreateTransactionDto, UpdateTransactionDto, CalculateFeesDto } from './dto/transaction.dto';

const INCLUDE_RELATIONS = {
  property: { select: { id: true, title: true, address: true } },
  buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
  seller: { select: { id: true, firstName: true, lastName: true, email: true } },
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feesService: TransactionFeesService,
    private readonly auditService: TransactionAuditService,
  ) {}

  calculateFees(dto: CalculateFeesDto) {
    return this.feesService.calculateFees(dto.amount, dto.agentCommissionRate);
  }

  async create(dto: CreateTransactionDto, ctx: AuditContext = {}) {
    const { amount, propertyId, buyerId, sellerId, type, notes, blockchainHash, contractAddress } = dto;

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: new Decimal(amount.toString()),
        type,
        notes,
        blockchainHash,
        contractAddress,
        property: { connect: { id: propertyId } },
        buyer: { connect: { id: buyerId } },
        seller: { connect: { id: sellerId } },
      },
      include: INCLUDE_RELATIONS,
    });

    await this.auditService.log(transaction.id, 'CREATED', null, dto, ctx);
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto, ctx: AuditContext = {}) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: dto,
      include: INCLUDE_RELATIONS,
    });

    const action = dto.status && dto.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED';
    await this.auditService.log(id, action, existing, dto, ctx);
    return updated;
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_RELATIONS,
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async findWithFees(id: string) {
    const transaction = await this.findOne(id);
    const fees = this.feesService.calculateFees(Number(transaction.amount));
    return { ...transaction, fees };
  }

  getAuditLog(transactionId: string) {
    return this.auditService.findByTransaction(transactionId);
  }
}
