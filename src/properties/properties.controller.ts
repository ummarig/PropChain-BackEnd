import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { TransitionPropertyStatusDto } from './dto/transition-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserPayload } from '../auth/types/auth-user.type';
import { PropertyStatus, UserRole } from '../types/prisma.types';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: AuthUserPayload) {
    return this.propertiesService.create(createPropertyDto, user.sub);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  /**
   * Advanced property search.
   * Supports filters: price range (minPrice/maxPrice), location
   * (city/state/zipCode/country or free-text `location`), propertyType,
   * bedrooms (exact or min/max), bathrooms (exact or min/max), plus status,
   * pagination (page, limit) and sorting (sortBy, sortOrder).
   *
   * Defined before `:id` so the static path is matched first.
   */
  @Get('search')
  search(@Query() searchDto: SearchPropertiesDto) {
    return this.propertiesService.searchProperties(searchDto);
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

  /**
   * Transition a property's lifecycle status.
   * Workflow: DRAFT → PENDING → ACTIVE → UNDER_CONTRACT → SOLD
   * (plus a few additional reasonable transitions — see
   * `property-status.constants.ts`).
   *
   * Allowed for the property's owner, AGENT, or ADMIN.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionPropertyStatusDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.propertiesService.transitionStatus(
      id,
      dto.status as PropertyStatus,
      user.sub,
      user.role,
    );
  }
}
