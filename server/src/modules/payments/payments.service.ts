import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentUrl(orderId: string, ipAddress: string = '127.0.0.1') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order has already been paid');
    }

    const tmnCode = this.configService.get<string>('VNP_TMN_CODE') || 'SANDBOX_TMN';
    const secretKey = this.configService.get<string>('VNP_HASH_SECRET') || 'SANDBOX_SECRET';
    const vnpUrl = this.configService.get<string>('VNP_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl =
      this.configService.get<string>('VNP_RETURN_URL') || 'http://localhost:5173/payment/vnpay-return';

    const date = new Date();
    const createDate = this.formatDate(date);

    // VNPAY amount is integer in VND multiplied by 100
    const amount = Math.round(Number(order.totalAmount) * 100);
    const orderInfo = `Thanh toan don hang ShopVerse #${order.orderCode}`;

    let vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: order.orderCode,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount.toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddress.replace('::ffff:', ''),
      vnp_CreateDate: createDate,
    };

    vnpParams = this.sortObject(vnpParams);

    const signData = Object.keys(vnpParams)
      .map((key) => `${key}=${encodeURIComponent(vnpParams[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;

    const paymentUrl = `${vnpUrl}?${Object.keys(vnpParams)
      .map((key) => `${key}=${encodeURIComponent(vnpParams[key]).replace(/%20/g, '+')}`)
      .join('&')}`;

    // Update payment transaction ref
    if (order.payment) {
      await this.prisma.paymentTransaction.update({
        where: { id: order.payment.id },
        data: { vnpTxnRef: order.orderCode },
      });
    }

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      paymentUrl,
    };
  }

  async verifyPaymentReturn(query: Record<string, any>) {
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedParams = this.sortObject(query);
    const secretKey = this.configService.get<string>('VNP_HASH_SECRET') || 'SANDBOX_SECRET';

    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isSuccess = checkHash === secureHash && query['vnp_ResponseCode'] === '00';
    const orderCode = query['vnp_TxnRef'];

    if (isSuccess && orderCode) {
      const order = await this.prisma.order.findUnique({
        where: { orderCode },
        include: { payment: true },
      });

      if (order && order.status !== OrderStatus.PAID) {
        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
          }),
          this.prisma.paymentTransaction.update({
            where: { orderId: order.id },
            data: {
              status: PaymentStatus.SUCCESS,
              vnpTransactionNo: query['vnp_TransactionNo'] || null,
              vnpBankCode: query['vnp_BankCode'] || null,
              vnpCardType: query['vnp_CardType'] || null,
              vnpPayDate: query['vnp_PayDate'] || null,
              vnpResponseCode: query['vnp_ResponseCode'] || null,
            },
          }),
        ]);
      }
    }

    return {
      isSuccess,
      orderCode,
      responseCode: query['vnp_ResponseCode'],
      transactionNo: query['vnp_TransactionNo'],
      bankCode: query['vnp_BankCode'],
      amount: query['vnp_Amount'] ? Number(query['vnp_Amount']) / 100 : 0,
      message: isSuccess
        ? 'Giao dịch thanh toán thành công qua VNPAY'
        : 'Giao dịch không thành công hoặc đã bị hủy',
    };
  }

  async handleIpnWebhook(query: Record<string, any>) {
    try {
      const secureHash = query['vnp_SecureHash'];
      delete query['vnp_SecureHash'];
      delete query['vnp_SecureHashType'];

      const sortedParams = this.sortObject(query);
      const secretKey = this.configService.get<string>('VNP_HASH_SECRET') || 'SANDBOX_SECRET';

      const signData = Object.keys(sortedParams)
        .map((key) => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
        .join('&');

      const hmac = crypto.createHmac('sha512', secretKey);
      const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // 1. Verify Checksum
      if (checkHash !== secureHash) {
        return { RspCode: '97', Message: 'Checksum failed' };
      }

      // 2. Check Order Existence
      const orderCode = query['vnp_TxnRef'];
      const order = await this.prisma.order.findUnique({
        where: { orderCode },
        include: { payment: true },
      });

      if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // 3. Verify Amount
      const vnpAmount = Number(query['vnp_Amount']) / 100;
      if (Math.round(Number(order.totalAmount)) !== Math.round(vnpAmount)) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // 4. Check Order Status (Idempotency)
      if (order.status === OrderStatus.PAID) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // 5. Update Status
      if (query['vnp_ResponseCode'] === '00') {
        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
          }),
          this.prisma.paymentTransaction.update({
            where: { orderId: order.id },
            data: {
              status: PaymentStatus.SUCCESS,
              vnpTransactionNo: query['vnp_TransactionNo'] || null,
              vnpBankCode: query['vnp_BankCode'] || null,
              vnpCardType: query['vnp_CardType'] || null,
              vnpPayDate: query['vnp_PayDate'] || null,
              vnpResponseCode: query['vnp_ResponseCode'] || null,
            },
          }),
        ]);
      } else {
        await this.prisma.paymentTransaction.update({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.FAILED,
            vnpResponseCode: query['vnp_ResponseCode'] || null,
          },
        });
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error) {
      this.logger.error('Error handling VNPAY IPN webhook', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        sorted[key] = obj[key];
      }
    }
    return sorted;
  }
}
