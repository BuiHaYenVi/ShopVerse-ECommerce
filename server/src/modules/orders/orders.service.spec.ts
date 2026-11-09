import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn(),
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should throw BadRequestException if cart is empty and no items provided', async () => {
      mockPrisma.cartItem.findMany.mockResolvedValueOnce([]);

      await expect(
        service.createOrder('user-1', {
          shippingAddress: '123 Test St',
          recipientName: 'Test Buyer',
          recipientPhone: '0987654321',
          paymentMethod: PaymentMethod.VNPAY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when product stock is insufficient', async () => {
      mockPrisma.$transaction.mockImplementationOnce(async (cb) => {
        const txMock = {
          product: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'prod-1',
              name: 'iPhone 16 Pro Max',
              price: 30000000,
              stock: 2, // only 2 in stock
            }),
          },
        };
        return cb(txMock);
      });

      await expect(
        service.createOrder('user-1', {
          shippingAddress: '123 Test St',
          recipientName: 'Test Buyer',
          recipientPhone: '0987654321',
          paymentMethod: PaymentMethod.VNPAY,
          items: [{ productId: 'prod-1', quantity: 5 }], // requested 5
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process order and deduct stock in database transaction', async () => {
      const mockCreatedOrder = {
        id: 'order-1',
        orderCode: 'SV-12345',
        totalAmount: 60000000,
        status: 'PENDING',
      };

      mockPrisma.$transaction.mockImplementationOnce(async (cb) => {
        const txMock = {
          product: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'prod-1',
              name: 'iPhone 16 Pro Max',
              price: 30000000,
              stock: 10,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            create: jest.fn().mockResolvedValue(mockCreatedOrder),
          },
          cartItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(txMock);
      });

      const result = await service.createOrder('user-1', {
        shippingAddress: '123 Test St',
        recipientName: 'Test Buyer',
        recipientPhone: '0987654321',
        paymentMethod: PaymentMethod.VNPAY,
        items: [{ productId: 'prod-1', quantity: 2 }],
      });

      expect(result.id).toBe('order-1');
      expect(result.orderCode).toBe('SV-12345');
    });
  });
});
