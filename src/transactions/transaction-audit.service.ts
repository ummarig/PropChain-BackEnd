import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TransactionAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    transactionId: string,
    action: string,
    previousData: object | null,
    newData: object | null,
    ctx: AuditContext = {},
  ) {
    return this.prisma.transactionAuditLog.create({
      data: {
        transactionId,
        action,
        previousData: previousData ?? undefined,
        newData: newData ?? undefined,
        actorId: ctx.actorId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });
  }

  async findByTransaction(transactionId: string) {
    return this.prisma.transactionAuditLog.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        previousData: true,
        newData: true,
        ipAddress: true,
        createdAt: true,
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
