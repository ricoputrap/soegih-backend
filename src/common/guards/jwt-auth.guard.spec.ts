import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockGetUser: jest.Mock;
  let mockSupabaseClient: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    mockGetUser = jest.fn();
    mockSupabaseClient = {
      auth: { getUser: mockGetUser },
    };
    guard = new JwtAuthGuard(reflector, mockSupabaseClient);
  });

  it('allows public routes without a token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const request: any = { headers: {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws UnauthorizedException when no token provided', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const request: any = { headers: {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Supabase returns error', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('invalid'),
    });
    const request: any = { headers: { authorization: 'Bearer invalid-token' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user to request when token is valid', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const fakeUser = { id: 'user-uuid', email: 'a@b.com' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });
    const request: any = { headers: { authorization: 'Bearer valid-token' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(request.user).toEqual(fakeUser);
  });
});
