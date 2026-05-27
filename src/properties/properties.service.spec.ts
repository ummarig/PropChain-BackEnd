import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../database/prisma.service';
import { FraudService } from '../fraud/fraud.service';
import { PropertyStatus } from '../types/prisma.types';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    property: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockFraudService = {
    evaluatePropertyCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FraudService, useValue: mockFraudService },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bulkUpdatePropertyStatus', () => {
    it('should call updateMany with property ids and status', async () => {
      mockPrismaService.property.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkUpdatePropertyStatus(
        ['id-1', 'id-2', 'id-3'],
        PropertyStatus.ACTIVE,
      );

      expect(prisma.property.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['id-1', 'id-2', 'id-3'] } },
        data: { status: 'ACTIVE' },
      });
      expect(result).toEqual({ updatedCount: 3 });
    });

    it('should map DRAFT status correctly', async () => {
      mockPrismaService.property.updateMany.mockResolvedValue({ count: 1 });

      await service.bulkUpdatePropertyStatus(['id-1'], PropertyStatus.DRAFT);

      expect(prisma.property.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'DRAFT' } }),
      );
    });
  });

  describe('bulkDeleteProperties', () => {
    it('should call deleteMany and return deleted count and ids', async () => {
      mockPrismaService.property.deleteMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.bulkDeleteProperties(['id-1', 'id-2']);

      expect(prisma.property.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['id-1', 'id-2'] } },
      });
      expect(result).toEqual({
        deletedCount: 2,
        propertyIds: ['id-1', 'id-2'],
      });
    });
  });

  describe('bulkExportProperties', () => {
    it('should call findMany with property ids and return export data', async () => {
      const mockProperties = [
        {
          id: 'prop-1',
          title: 'Test Property',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          price: BigInt(500000),
          propertyType: 'HOUSE',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: BigInt(1500),
          lotSize: null,
          yearBuilt: 2020,
          status: 'ACTIVE',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          ownerId: 'owner-1',
          owner: {
            id: 'owner-1',
            email: 'owner@test.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '555-0100',
          },
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.bulkExportProperties(['prop-1']);

      expect(prisma.property.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['prop-1'] } },
        select: expect.any(Object),
      });
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('data');
      expect(result.total).toBe(1);
      expect(result.data[0]).toHaveProperty('ownerEmail', 'owner@test.com');
    });

    it('should apply title filter when provided', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);

      await service.bulkExportProperties(['prop-1'], 'test');

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ['prop-1'] },
            title: { contains: 'test', mode: 'insensitive' },
          },
        }),
      );
    });
  });
});
