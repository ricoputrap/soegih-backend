import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

const mockAuthService = {
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('signup delegates to AuthService', async () => {
    mockAuthService.signup.mockResolvedValueOnce({
      token: 'jwt',
      user: { id: '1', email: 'a@b.com' },
    });
    const result = await controller.signup({
      email: 'a@b.com',
      password: 'pass12345',
    });
    expect(mockAuthService.signup).toHaveBeenCalled();
    expect(result.token).toBe('jwt');
  });

  it('login delegates to AuthService', async () => {
    mockAuthService.login.mockResolvedValueOnce({
      token: 'jwt',
      user: { id: '1', email: 'a@b.com' },
    });
    const result = await controller.login({
      email: 'a@b.com',
      password: 'pass12345',
    });
    expect(result.token).toBe('jwt');
  });

  it('logout calls AuthService with user_id', async () => {
    mockAuthService.logout.mockResolvedValueOnce(undefined);
    await controller.logout({ id: 'user-1', email: 'a@b.com' });
    expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
  });
});
