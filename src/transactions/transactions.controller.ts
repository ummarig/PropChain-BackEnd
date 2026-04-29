import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, CalculateFeesDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth-user.type';
import { UserRole } from '../types/prisma.types';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /** POST /transactions/fees/calculate */
  @Post('fees/calculate')
  calculateFees(@Body() dto: CalculateFeesDto) {
    return this.transactionsService.calculateFees(dto);
  }

  /** POST /transactions */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: AuthUserPayload,
    @Req() req: Request,
  ) {
    return this.transactionsService.create(dto, {
      actorId: user.sub,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /** GET /transactions (admin only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  /** GET /transactions/:id */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  /** GET /transactions/:id/fees */
  @UseGuards(JwtAuthGuard)
  @Get(':id/fees')
  findWithFees(@Param('id') id: string) {
    return this.transactionsService.findWithFees(id);
  }

  /** PATCH /transactions/:id */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: AuthUserPayload,
    @Req() req: Request,
  ) {
    return this.transactionsService.update(id, dto, {
      actorId: user.sub,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /** GET /transactions/:id/audit-log */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Get(':id/audit-log')
  getAuditLog(@Param('id') id: string) {
    return this.transactionsService.getAuditLog(id);
  }
}
