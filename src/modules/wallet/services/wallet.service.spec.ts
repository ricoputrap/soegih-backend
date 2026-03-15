import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WalletService } from './wallet.service';
import { WalletRepository } from '../repositories/wallet.repository';

const mockRepo = {
  findAllByUser: jest.fn(),
  findOneByUser: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockLogger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };

const fakeWallet = {
  id: 'w1',
  userId: 'u1',
  name: 'Cash',
  type: 'cash',
  balance: '100',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: WalletRepository, useValue: mockRepo },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(WalletService);
    jest.clearAllMocks();
  });

  it('findAll returns wallet list', async () => {
    mockRepo.findAllByUser.mockResolvedValueOnce([fakeWallet]);
    const result = await service.findAll('u1');
    expect(result).toHaveLength(1);
  });

  it('findOne throws NotFoundException when wallet not found', async () => {
    mockRepo.findOneByUser.mockResolvedValueOnce(null);
    await expect(service.findOne('w-missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create delegates to repository', async () => {
    mockRepo.create.mockResolvedValueOnce(fakeWallet);
    const result = await service.create('u1', {
      name: 'Cash',
      type: 'cash' as any,
      balance: 100,
    });
    expect(mockRepo.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Cash' }),
    );
    expect(result.id).toBe('w1');
  });

  it('remove throws NotFoundException when wallet not found', async () => {
    mockRepo.findOneByUser.mockResolvedValueOnce(null);
    await expect(service.remove('w-missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
