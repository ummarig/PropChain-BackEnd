import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { TransactionCancellationService } from './transaction-cancellation.service';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth-user.type';
import { UserRole } from '../types/prisma.types';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly cancellationService: TransactionCancellationService) {}

  /** POST /transactions/:id/cancel */
  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelTransactionDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.cancellationService.cancel(id, dto, user.sub);
  }

  /** POST /transactions/:id/refund — admin/agent only */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Post(':id/refund')
  processRefund(@Param('id') id: string) {
    return this.cancellationService.processRefund(id);
  }
}
