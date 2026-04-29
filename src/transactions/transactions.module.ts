import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionFeesService } from './transaction-fees.service';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionFeesService],
  exports: [TransactionsService, TransactionFeesService],
})
export class TransactionsModule {}
