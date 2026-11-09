import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ minimum: 1, description: 'Quantity' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '123 Nguyen Hue, District 1, Ho Chi Minh City' })
  @IsString()
  @IsNotEmpty({ message: 'Shipping address is required' })
  shippingAddress: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty({ message: 'Recipient name is required' })
  recipientName: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty({ message: 'Recipient phone is required' })
  recipientPhone: string;

  @ApiPropertyOptional({ example: 'Giao trong gio hanh chinh' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.VNPAY })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.VNPAY;

  @ApiPropertyOptional({
    type: [OrderItemDto],
    description: 'Items to purchase. If omitted, orders all items currently in cart.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
