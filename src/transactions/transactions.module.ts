import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionAuditService } from './transaction-audit.service';
import { PrismaModule } from '../database/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [PrismaModule, BlockchainModule, NotificationsModule, CommissionsModule],
  providers: [TransactionsService, TransactionAuditService],
  controllers: [TransactionsController],
  exports: [TransactionsService, TransactionAuditService],
})
export class TransactionsModule {}
