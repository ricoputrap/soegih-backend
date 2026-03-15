import { Test } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from '../services/wallet.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const fakeUser = { id: 'u1', email: 'a@b.com' };
const fakeWallet = { id: 'w1', userId: 'u1', name: 'Cash' };

describe('WalletController', () => {
  let controller: WalletController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: mockService }],
    }).compile();
    controller = module.get(WalletController);
    jest.clearAllMocks();
  });

  it('findAll calls service with user id', async () => {
    mockService.findAll.mockResolvedValueOnce([fakeWallet]);
    const result = await controller.findAll(fakeUser);
    expect(mockService.findAll).toHaveBeenCalledWith('u1');
    expect(result).toHaveLength(1);
  });

  it('create calls service with user id and dto', async () => {
    mockService.create.mockResolvedValueOnce(fakeWallet);
    await controller.create(fakeUser, {
      name: 'Cash',
      type: 'cash' as any,
      balance: 0,
    });
    expect(mockService.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Cash' }),
    );
  });

  it('remove calls service with wallet id and user id', async () => {
    mockService.remove.mockResolvedValueOnce(undefined);
    await controller.remove('w1', fakeUser);
    expect(mockService.remove).toHaveBeenCalledWith('w1', 'u1');
  });
});
