import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user shopping cart' })
  getCart(@CurrentUser() user: UserPayload) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product item to shopping cart' })
  addToCart(@CurrentUser() user: UserPayload, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateQuantity(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(user.id, id, dto.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove an item from cart' })
  removeFromCart(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.cartService.removeFromCart(user.id, id);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Empty shopping cart' })
  clearCart(@CurrentUser() user: UserPayload) {
    return this.cartService.clearCart(user.id);
  }
}
