import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Res,
  StreamableFile,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth-user.type';
import { UserRole } from '../types/prisma.types';
import { PropertyReportService } from './report/property-report.service';
import { Response } from 'express';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly propertyReportService: PropertyReportService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: AuthUserPayload) {
    return this.propertiesService.create(createPropertyDto, user.sub);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/report')
  async generateReport(@Param('id') id: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.propertyReportService.generatePropertyReport(id);

      // Set response headers for PDF download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="property-report-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      // Handle errors appropriately
      if (error.message.includes('not found')) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: error.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Failed to generate property report' });
    }
  }
}
