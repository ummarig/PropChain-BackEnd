import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionFeesService } from './transaction-fees.service';
import { TransactionAuditService } from './transaction-audit.service';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionFeesService, TransactionAuditService],
  exports: [TransactionsService, TransactionFeesService, TransactionAuditService],
})
export class TransactionsModule {}
