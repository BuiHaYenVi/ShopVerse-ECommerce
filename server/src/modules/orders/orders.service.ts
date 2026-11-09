import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    let itemsToProcess: { productId: string; quantity: number }[] = [];

    if (dto.items && dto.items.length > 0) {
      itemsToProcess = dto.items;
    } else {
      // Checkout from current user's cart
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
      });

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestException('Your shopping cart is empty');
      }

      itemsToProcess = cartItems.map((ci) => ({
        productId: ci.productId,
        quantity: ci.quantity,
      }));
    }

    // Generate unique order code (SV-TIMESTAMP-RANDOM)
    const orderCode = `SV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Execute atomic transaction for inventory deduction and order creation
    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: {
        productId: string;
        productName: string;
        productPrice: number;
        quantity: number;
      }[] = [];

      for (const item of itemsToProcess) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID '${item.productId}' not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Product '${product.name}' is out of stock. Available: ${product.stock}, requested: ${item.quantity}`,
          );
        }

        // Deduct inventory atomically
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          productPrice: Number(product.price),
          quantity: item.quantity,
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          userId,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          note: dto.note,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData.map((oi) => ({
              productId: oi.productId,
              productName: oi.productName,
              productPrice: oi.productPrice,
              quantity: oi.quantity,
            })),
          },
          payment: {
            create: {
              amount: totalAmount,
              method: dto.paymentMethod || PaymentMethod.VNPAY,
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      // Clear purchased items from cart
      const productIds = itemsToProcess.map((i) => i.productId);
      await tx.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: productIds },
        },
      });

      return newOrder;
    });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { imageUrl: true, slug: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderIdOrCode: string, userId?: string, role?: Role) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrCode }, { orderCode: orderIdOrCode }],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role !== Role.ADMIN && userId && order.userId !== userId) {
      throw new BadRequestException('Access denied to this order');
    }

    return order;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If order was cancelled and was not already cancelled, restore stock
    if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
        });

        if (order.payment) {
          await tx.paymentTransaction.update({
            where: { id: order.payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }
      });

      return this.getOrderById(id);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true, payment: true },
    });
  }
}
