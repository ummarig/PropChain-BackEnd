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
    return this.prisma.transactionHistory.create({
      data: {
        transactionId,
        status: action as any,
        actorId: ctx.actorId,
        notes: JSON.stringify({ previousData, newData }),
        metadata: {
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      },
    });
  }

  async findByTransaction(transactionId: string) {
    return this.prisma.transactionHistory.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        notes: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
