import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockSupabase = {
  admin: {
    auth: {
      createUser: jest.fn(),
    },
  },
  signInWithPassword: jest.fn(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
};

const mockLogger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('creates user in Supabase and syncs to local DB', async () => {
      const fakeUser = { id: 'supabase-uuid', email: 'a@b.com' };
      const fakeSession = { access_token: 'jwt-token' };
      mockSupabase.admin.auth.createUser.mockResolvedValueOnce({
        data: { user: fakeUser },
        error: null,
      });
      mockPrisma.user.create.mockResolvedValueOnce({
        id: fakeUser.id,
        email: fakeUser.email,
      });
      mockSupabase.signInWithPassword.mockResolvedValueOnce({
        data: { session: fakeSession },
        error: null,
      });

      const result = await service.signup({
        email: 'a@b.com',
        password: 'password123',
      });

      expect(mockSupabase.admin.auth.createUser).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'password123',
        email_confirm: true,
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.token).toBe('jwt-token');
    });

    it('throws ConflictException when Supabase returns user already registered', async () => {
      mockSupabase.admin.auth.createUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });
      await expect(
        service.signup({ email: 'a@b.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token and user on valid credentials', async () => {
      const fakeUser = { id: 'uuid', email: 'a@b.com' };
      const fakeSession = { access_token: 'jwt' };
      mockSupabase.signInWithPassword.mockResolvedValueOnce({
        data: { user: fakeUser, session: fakeSession },
        error: null,
      });
      mockPrisma.user.upsert.mockResolvedValueOnce({
        id: fakeUser.id,
        email: fakeUser.email,
      });

      const result = await service.login({
        email: 'a@b.com',
        password: 'pass',
      });

      expect(result.token).toBe('jwt');
      expect(result.user.id).toBe('uuid');
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      mockSupabase.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
