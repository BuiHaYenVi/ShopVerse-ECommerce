import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-url/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate VNPAY sandbox payment URL with HMAC-SHA512 checksum' })
  async createPaymentUrl(
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '127.0.0.1';
    return this.paymentsService.createPaymentUrl(orderId, ipAddress);
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPAY Return URL after customer finishes checkout' })
  async handleReturn(@Query() query: Record<string, any>, @Res() res: Response) {
    const result = await this.paymentsService.verifyPaymentReturn(query);
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
    
    // Redirect to frontend order success/failure page
    const redirectUrl = `${clientUrl}/order-result?isSuccess=${result.isSuccess}&orderCode=${result.orderCode}&amount=${result.amount}&message=${encodeURIComponent(result.message)}`;
    return res.redirect(redirectUrl);
  }

  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPAY Server-to-Server IPN (Instant Payment Notification) Webhook' })
  async handleIpn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleIpnWebhook(query);
  }
}
