import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOpenHouseDto } from './dto/create-open-house.dto';
import { RsvpOpenHouseDto } from './dto/rsvp-open-house.dto';

@Injectable()
export class OpenHouseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOpenHouseDto) {
    return this.prisma.openHouse.create({
      data: {
        propertyId: dto.propertyId,
        title: dto.title,
        description: dto.description,
        startAt: dto.startAt,
        endAt: dto.endAt,
      },
    });
  }

  async findOne(id: string) {
    const openHouse = await this.prisma.openHouse.findUnique({
      where: { id },
      include: { rsvps: true, property: true },
    });
    if (!openHouse) {
      throw new NotFoundException('Open house not found');
    }
    return openHouse;
  }

  async cancel(id: string) {
    return this.prisma.openHouse.update({
      where: { id },
      data: { isCancelled: true, cancelledAt: new Date() },
    });
  }

  async rsvp(openHouseId: string, dto: RsvpOpenHouseDto) {
    // Upsert RSVP for the user
    return this.prisma.openHouseRsvp.upsert({
      where: { openHouseId_userId: { openHouseId, userId: dto.userId } },
      update: { status: dto.status },
      create: {
        openHouseId,
        userId: dto.userId,
        status: dto.status,
      },
    });
  }
}
