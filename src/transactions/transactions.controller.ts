import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, CalculateFeesDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types/prisma.types';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Calculate fee breakdown for a given amount without creating a transaction.
   * POST /transactions/fees/calculate
   */
  @Post('fees/calculate')
  calculateFees(@Body() dto: CalculateFeesDto) {
    return this.transactionsService.calculateFees(dto);
  }

  /**
   * Create a new transaction.
   * POST /transactions
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  /**
   * List all transactions (admin only).
   * GET /transactions
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  /**
   * Get a single transaction by ID.
   * GET /transactions/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  /**
   * Get a transaction with its full fee breakdown.
   * GET /transactions/:id/fees
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/fees')
  findWithFees(@Param('id') id: string) {
    return this.transactionsService.findWithFees(id);
  }
}
