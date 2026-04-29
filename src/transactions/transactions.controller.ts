import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth.types';
import { UserRole } from '../common/common.types';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  RecordTransactionOnChainDto,
  TransactionResponseDto,
  TransactionListQueryDto,
} from './dto/transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description: 'Create a new property transaction record',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  async create(@Body() dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    return this.transactionsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all transactions',
    description: 'Retrieve paginated list of transactions with optional filters',
  })
  @ApiQuery({ name: 'propertyId', required: false, type: 'string' })
  @ApiQuery({ name: 'buyerId', required: false, type: 'string' })
  @ApiQuery({ name: 'sellerId', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, type: 'string' })
  @ApiQuery({ name: 'type', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of transactions',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        items: { type: 'array', items: { $ref: '#/components/schemas/TransactionResponseDto' } },
      },
    },
  })
  async findAll(
    @Query() query: TransactionListQueryDto,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    items: TransactionResponseDto[];
  }> {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction details',
    description: 'Retrieve details of a specific transaction',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update transaction',
    description: 'Update transaction status and notes',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(id, dto);
  }

  @Post(':id/record-on-blockchain')
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record transaction on blockchain',
    description:
      'Record a transaction on the blockchain with hash generation and smart contract interaction',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction recorded on blockchain',
    schema: {
      type: 'object',
      properties: {
        transaction: { $ref: '#/components/schemas/TransactionResponseDto' },
        blockchain: {
          type: 'object',
          properties: {
            transactionHash: { type: 'string' },
            blockchainHash: { type: 'string' },
            contractAddress: { type: 'string' },
            status: { type: 'string' },
            explorerUrl: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  async recordOnBlockchain(
    @Param('id') id: string,
    @Body() dto: RecordTransactionOnChainDto,
  ): Promise<any> {
    return this.transactionsService.recordOnBlockchain(id, dto);
  }

  @Get(':id/verify-blockchain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify transaction on blockchain',
    description: 'Verify that a transaction has been recorded and confirmed on the blockchain',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction verification result',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        transactionHash: { type: 'string' },
        blockNumber: { type: 'number' },
        status: { type: 'string' },
        confirmations: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Transaction not recorded on blockchain' })
  async verifyOnBlockchain(@Param('id') id: string): Promise<any> {
    return this.transactionsService.verifyOnBlockchain(id);
  }

  @Get('blockchain/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get blockchain statistics',
    description: 'Retrieve blockchain transaction statistics and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Blockchain statistics',
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { type: 'number' },
        confirmedTransactions: { type: 'number' },
        pendingTransactions: { type: 'number' },
        failedTransactions: { type: 'number' },
        totalValue: { type: 'string' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  async getBlockchainStats(): Promise<any> {
    return this.transactionsService.getBlockchainStats();
  }
}
