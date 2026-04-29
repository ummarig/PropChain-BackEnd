import { Module } from '@nestjs/common';
import { TransactionDocumentsService } from './transaction-documents.service';
import { TransactionDocumentsController } from './transaction-documents.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TransactionDocumentsController],
  providers: [TransactionDocumentsService],
  exports: [TransactionDocumentsService],
})
export class TransactionsModule {}
