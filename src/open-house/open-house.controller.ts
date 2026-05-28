import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { OpenHouseService } from './open-house.service';
import { CreateOpenHouseDto } from './dto/create-open-house.dto';
import { RsvpOpenHouseDto } from './dto/rsvp-open-house.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('open-house')
@Controller('open-house')
export class OpenHouseController {
  constructor(private readonly openHouseService: OpenHouseService) {}

  @Post()
  @ApiOperation({ summary: 'Create an open house event' })
  create(@Body() dto: CreateOpenHouseDto) {
    return this.openHouseService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get open house details' })
  findOne(@Param('id') id: string) {
    return this.openHouseService.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an open house event' })
  cancel(@Param('id') id: string) {
    return this.openHouseService.cancel(id);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to an open house' })
  rsvp(@Param('id') id: string, @Body() dto: RsvpOpenHouseDto) {
    return this.openHouseService.rsvp(id, dto);
  }
}
