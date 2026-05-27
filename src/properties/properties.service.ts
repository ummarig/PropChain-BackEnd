import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { FraudService } from '../fraud/fraud.service';

interface FindAllParams {
  skip?: number;
  take?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface PaginatedPropertiesResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudService: FraudService,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, ownerId: string) {
    const { price, squareFeet, lotSize, ...rest } = createPropertyDto;

    const property = await this.prisma.property.create({
      data: {
        ...rest,
        price: new Decimal(price.toString()),
        squareFeet: squareFeet ? new Decimal(squareFeet.toString()) : null,
        lotSize: lotSize ? new Decimal(lotSize.toString()) : null,
        owner: {
          connect: { id: ownerId },
        },
      },
    });

    await this.fraudService.evaluatePropertyCreated(property.id);

    return property;
  }

  async findAll(params?: FindAllParams) {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.property.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: true,
      },
    });
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const { price, squareFeet, lotSize, ...rest } = updatePropertyDto;

    return this.prisma.property.update({
      where: { id },
      data: {
        ...rest,
        price: price ? new Decimal(price.toString()) : undefined,
        squareFeet: squareFeet ? new Decimal(squareFeet.toString()) : undefined,
        lotSize: lotSize ? new Decimal(lotSize.toString()) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.property.delete({
      where: { id },
    });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Advanced property search with filters, pagination and sorting.
   * Returns a paginated result so clients can render result counts and pages.
   */
  async searchProperties(dto: SearchPropertiesDto): Promise<PaginatedPropertiesResult> {
    const where = this.buildSearchWhereClause(dto);

    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 20;
    const skip = (page - 1) * limit;
    const sortBy = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  /**
   * Build a Prisma `where` clause from a SearchPropertiesDto.
   * Exposed as private and used only by `searchProperties`.
   */
  private buildSearchWhereClause(dto: SearchPropertiesDto): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    // Price range
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      const priceFilter: Record<string, Decimal> = {};
      if (dto.minPrice !== undefined) {
        priceFilter.gte = new Decimal(dto.minPrice.toString());
      }
      if (dto.maxPrice !== undefined) {
        priceFilter.lte = new Decimal(dto.maxPrice.toString());
      }
      where.price = priceFilter;
    }

    // Location: granular fields (case-insensitive equality)
    if (dto.city) {
      where.city = { equals: dto.city, mode: 'insensitive' };
    }
    if (dto.state) {
      where.state = { equals: dto.state, mode: 'insensitive' };
    }
    if (dto.zipCode) {
      where.zipCode = dto.zipCode;
    }
    if (dto.country) {
      where.country = { equals: dto.country, mode: 'insensitive' };
    }

    // Location: free-text fallback (matches across address/city/state/zipCode)
    if (dto.location) {
      where.OR = [
        { address: { contains: dto.location, mode: 'insensitive' } },
        { city: { contains: dto.location, mode: 'insensitive' } },
        { state: { contains: dto.location, mode: 'insensitive' } },
        { zipCode: { contains: dto.location, mode: 'insensitive' } },
      ];
    }

    // Property type (case-insensitive)
    if (dto.propertyType) {
      where.propertyType = { equals: dto.propertyType, mode: 'insensitive' };
    }

    // Bedrooms: exact takes precedence over range
    if (dto.bedrooms !== undefined) {
      where.bedrooms = dto.bedrooms;
    } else if (dto.minBedrooms !== undefined || dto.maxBedrooms !== undefined) {
      const bedroomsFilter: Record<string, number> = {};
      if (dto.minBedrooms !== undefined) bedroomsFilter.gte = dto.minBedrooms;
      if (dto.maxBedrooms !== undefined) bedroomsFilter.lte = dto.maxBedrooms;
      where.bedrooms = bedroomsFilter;
    }

    // Bathrooms: stored as Decimal — wrap accordingly
    if (dto.bathrooms !== undefined) {
      where.bathrooms = new Decimal(dto.bathrooms.toString());
    } else if (dto.minBathrooms !== undefined || dto.maxBathrooms !== undefined) {
      const bathroomsFilter: Record<string, Decimal> = {};
      if (dto.minBathrooms !== undefined) {
        bathroomsFilter.gte = new Decimal(dto.minBathrooms.toString());
      }
      if (dto.maxBathrooms !== undefined) {
        bathroomsFilter.lte = new Decimal(dto.maxBathrooms.toString());
      }
      where.bathrooms = bathroomsFilter;
    }

    // Optional status filter
    if (dto.status) {
      where.status = dto.status;
    }

    return where;
  }
}
