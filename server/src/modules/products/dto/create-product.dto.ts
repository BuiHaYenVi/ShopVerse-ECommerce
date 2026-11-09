import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Apple MacBook Pro M3', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'apple-macbook-pro-m3', description: 'Product slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'High performance laptop with M3 chip', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 39900000, description: 'Product price in VND' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 25, description: 'Stock quantity available' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', description: 'Primary image URL' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.jpg'], description: 'Additional image gallery URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ default: false, description: 'Mark product as featured' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ description: 'Category ID that product belongs to' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
