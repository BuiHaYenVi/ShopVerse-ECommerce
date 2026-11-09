import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@shopverse.com',
    password: '$2a$10$hashedpasswordstring',
    name: 'Test User',
    role: Role.CUSTOMER,
    hashedRefreshToken: '$2a$10$hashedrefreshtoken',
    phone: '0123456789',
    address: '123 Test St',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mocked.jwt.token'),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_ACCESS_SECRET':
          return 'test_access_secret';
        case 'JWT_REFRESH_SECRET':
          return 'test_refresh_secret';
        case 'JWT_ACCESS_EXPIRES_IN':
          return '15m';
        case 'JWT_REFRESH_EXPIRES_IN':
          return '7d';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email is already in use', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(
        service.register({
          email: 'test@shopverse.com',
          password: 'Password123!',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create user and return tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        phone: mockUser.phone,
        address: mockUser.address,
        createdAt: mockUser.createdAt,
      });
      mockPrismaService.user.update.mockResolvedValueOnce(mockUser);

      const result = await service.register({
        email: 'test@shopverse.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mocked.jwt.token');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'unknown@shopverse.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(false));

      await expect(
        service.login({
          email: 'test@shopverse.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully log in and return tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(true));
      mockPrismaService.user.update.mockResolvedValueOnce(mockUser);

      const result = await service.login({
        email: 'test@shopverse.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens.accessToken).toBe('mocked.jwt.token');
    });
  });

  describe('logout', () => {
    it('should clear user hashedRefreshToken', async () => {
      mockPrismaService.user.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.logout('user-uuid-123');
      expect(result.message).toBe('Logged out successfully');
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123', hashedRefreshToken: { not: null } },
        data: { hashedRefreshToken: null },
      });
    });
  });
});
