import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ProductSortOption } from './dto/query-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockProduct = {
    id: 'prod-123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A product for testing',
    price: 100000,
    stock: 10,
    imageUrl: 'http://example.com/img.jpg',
    images: [],
    isFeatured: false,
    categoryId: 'cat-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products and metadata', async () => {
      mockPrisma.product.findMany.mockResolvedValueOnce([mockProduct]);
      mockPrisma.product.count.mockResolvedValueOnce(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'Test',
        sort: ProductSortOption.NEWEST,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return product when found', async () => {
      mockPrisma.product.findFirst.mockResolvedValueOnce(mockProduct);

      const result = await service.findOne('prod-123');
      expect(result.id).toBe(mockProduct.id);
    });
  });
});
