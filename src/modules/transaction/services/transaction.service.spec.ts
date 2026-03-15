import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TransactionService } from './transaction.service';
import { TransactionRepository } from '../repositories/transaction.repository';

const mockRepo = {
  findManyByUser: jest.fn(),
  findOneByUser: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};
const mockLogger = { setContext: jest.fn(), info: jest.fn() };

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: TransactionRepository, useValue: mockRepo },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(TransactionService);
    jest.clearAllMocks();
  });

  it('findMany delegates to repository', async () => {
    const paginated = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, total_pages: 0 },
    };
    mockRepo.findManyByUser.mockResolvedValueOnce(paginated);
    const result = await service.findMany('u1', { page: 1, limit: 20 });
    expect(result.meta.total).toBe(0);
  });

  it('findOne throws NotFoundException when not found', async () => {
    mockRepo.findOneByUser.mockResolvedValueOnce(null);
    await expect(service.findOne('tx-missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create delegates to repository', async () => {
    const fakeEvent = { id: 'tx1', type: 'expense', postings: [] };
    mockRepo.create.mockResolvedValueOnce(fakeEvent);
    const dto = {
      type: 'expense' as any,
      amount: 50,
      occurred_at: new Date().toISOString(),
      wallet_id: 'w1',
    };
    const result = await service.create('u1', dto);
    expect(result.id).toBe('tx1');
  });
});
