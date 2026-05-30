import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface RecordViewInput {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  sessionId?: string | null;
}

export interface ViewHistoryParams {
  skip?: number;
  take?: number;
  since?: Date;
}

export interface PopularQueryParams {
  take?: number;
  since?: Date;
}

@Injectable()
export class PropertyViewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a view event and atomically increment the property's view counter.
   */
  async recordView(propertyId: string, input: RecordViewInput) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    const [view, updated] = await this.prisma.$transaction([
      this.prisma.propertyView.create({
        data: {
          propertyId,
          userId: input.userId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          referrer: input.referrer ?? null,
          sessionId: input.sessionId ?? null,
        },
      }),
      this.prisma.property.update({
        where: { id: propertyId },
        data: { viewCount: { increment: 1 } },
        select: { id: true, viewCount: true },
      }),
    ]);

    return { view, viewCount: updated.viewCount };
  }

  /**
   * Total view count for a property (denormalized counter).
   */
  async getViewCount(propertyId: string): Promise<number> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { viewCount: true },
    });
    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }
    return property.viewCount;
  }

  /**
   * Unique visitor count = distinct authenticated users + distinct anonymous IPs.
   * Optionally bounded by a `since` timestamp.
   */
  async getUniqueVisitorCount(
    propertyId: string,
    since?: Date,
  ): Promise<{
    total: number;
    authenticatedUsers: number;
    anonymousIps: number;
  }> {
    const baseWhere = {
      propertyId,
      ...(since ? { viewedAt: { gte: since } } : {}),
    };

    const [authGroups, anonGroups] = await Promise.all([
      this.prisma.propertyView.groupBy({
        by: ['userId'],
        where: { ...baseWhere, userId: { not: null } },
      }),
      this.prisma.propertyView.groupBy({
        by: ['ipAddress'],
        where: { ...baseWhere, userId: null, ipAddress: { not: null } },
      }),
    ]);

    const authenticatedUsers = authGroups.length;
    const anonymousIps = anonGroups.length;

    return {
      total: authenticatedUsers + anonymousIps,
      authenticatedUsers,
      anonymousIps,
    };
  }

  /**
   * Paginated raw view history for a property.
   */
  async getViewHistory(propertyId: string, params: ViewHistoryParams = {}) {
    const skip = params.skip ?? 0;
    const take = params.take ?? 20;
    const where = {
      propertyId,
      ...(params.since ? { viewedAt: { gte: params.since } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.propertyView.findMany({
        where,
        skip,
        take,
        orderBy: { viewedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.propertyView.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /**
   * Most-viewed properties. When `since` is provided we aggregate raw events
   * within the window; otherwise we use the denormalized lifetime counter.
   */
  async getPopularProperties(params: PopularQueryParams = {}) {
    const take = params.take ?? 10;

    if (params.since) {
      const grouped = await this.prisma.propertyView.groupBy({
        by: ['propertyId'],
        where: { viewedAt: { gte: params.since } },
        _count: { propertyId: true },
        orderBy: { _count: { propertyId: 'desc' } },
        take,
      });

      const ids = grouped.map((g) => g.propertyId);
      if (ids.length === 0) {
        return [];
      }

      const properties = await this.prisma.property.findMany({
        where: { id: { in: ids } },
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

      const byId = new Map(properties.map((p) => [p.id, p]));
      return grouped
        .map((g) => {
          const property = byId.get(g.propertyId);
          if (!property) return null;
          return { property, viewsInWindow: g._count.propertyId };
        })
        .filter(
          (entry): entry is { property: (typeof properties)[number]; viewsInWindow: number } =>
            entry !== null,
        );
    }

    const properties = await this.prisma.property.findMany({
      orderBy: { viewCount: 'desc' },
      take,
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

    return properties.map((property) => ({
      property,
      viewsInWindow: property.viewCount,
    }));
  }
}
