import { Module } from '@nestjs/common';
import { TransactionCancellationService } from './transaction-cancellation.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [TransactionsController],
  providers: [TransactionCancellationService],
  exports: [TransactionCancellationService],
})
export class TransactionsModule {}
