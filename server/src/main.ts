import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Pipes & Interceptors & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('ShopVerse E-Commerce REST API')
    .setDescription(
      'Enterprise-grade E-Commerce API built with NestJS, Prisma ORM, PostgreSQL & VNPAY Payment Gateway.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System health status')
    .addTag('Auth', 'Authentication & Authorization endpoints')
    .addTag('Users', 'User management & Profile')
    .addTag('Products', 'Product catalog, search, filter & pagination')
    .addTag('Categories', 'Product categories')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order processing and lifecycle')
    .addTag('Payments', 'VNPAY payment gateway integration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ShopVerse API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 ShopVerse API Server running at http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
