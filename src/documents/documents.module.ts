import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SignedUrlService } from './signed-url/signed-url.service';
import { NotConfiguredSignedUrlProvider } from './signed-url/not-configured.signed-url-provider';
import { DocumentsDownloadController } from './documents-download.controller';

export const SIGNED_URL_PROVIDER_TOKEN = 'SIGNED_URL_PROVIDER_TOKEN';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DocumentsController, DocumentsDownloadController],
  providers: [
    DocumentsService,
    SignedUrlService,
    {
      provide: SIGNED_URL_PROVIDER_TOKEN,
      useClass: NotConfiguredSignedUrlProvider,
    },
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}



