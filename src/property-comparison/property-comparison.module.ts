import { Module } from '@nestjs/common';
import { PropertyComparisonController } from './property-comparison.controller';
import { PropertyComparisonService } from './property-comparison.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertyComparisonController],
  providers: [PropertyComparisonService],
  exports: [PropertyComparisonService],
})
export class PropertyComparisonModule {}
