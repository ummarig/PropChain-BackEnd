import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionDocumentsService } from './transaction-documents.service';
import { AttachDocumentDto, AddVersionDto } from './dto/transaction-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth-user.type';

@UseGuards(JwtAuthGuard)
@Controller('transactions/:transactionId/documents')
export class TransactionDocumentsController {
  constructor(private readonly service: TransactionDocumentsService) {}

  /** POST /transactions/:transactionId/documents — attach a document */
  @Post()
  attach(
    @Param('transactionId') transactionId: string,
    @Body() dto: AttachDocumentDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.attach(transactionId, dto, user.sub);
  }

  /** GET /transactions/:transactionId/documents — list documents */
  @Get()
  list(@Param('transactionId') transactionId: string) {
    return this.service.list(transactionId);
  }

  /** GET /transactions/:transactionId/documents/:documentId — view a document */
  @Get(':documentId')
  findOne(@Param('transactionId') transactionId: string, @Param('documentId') documentId: string) {
    return this.service.findOne(transactionId, documentId);
  }

  /** DELETE /transactions/:transactionId/documents/:documentId — remove a document */
  @Delete(':documentId')
  remove(@Param('transactionId') transactionId: string, @Param('documentId') documentId: string) {
    return this.service.remove(transactionId, documentId);
  }

  /** GET /transactions/:transactionId/documents/:documentId/versions — version history */
  @Get(':documentId/versions')
  getVersions(
    @Param('transactionId') transactionId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.service.getVersions(transactionId, documentId);
  }

  /** POST /transactions/:transactionId/documents/:documentId/versions — add a new version */
  @Post(':documentId/versions')
  addVersion(
    @Param('transactionId') transactionId: string,
    @Param('documentId') documentId: string,
    @Body() dto: AddVersionDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.service.addVersion(transactionId, documentId, dto, user.sub);
  }
}
