import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID to add' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ default: 1, minimum: 1, description: 'Quantity to add' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1, description: 'Updated quantity' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
