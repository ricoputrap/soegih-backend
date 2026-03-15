import { Test } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../services/transaction.service';

const mockService = {
  findMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const fakeUser = { id: 'u1', email: 'a@b.com' };

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: mockService }],
    }).compile();
    controller = module.get(TransactionController);
    jest.clearAllMocks();
  });

  it('findAll passes user id and query to service', async () => {
    const paginated = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, total_pages: 0 },
    };
    mockService.findMany.mockResolvedValueOnce(paginated);
    const result = await controller.findAll(fakeUser, { page: 1, limit: 20 });
    expect(mockService.findMany).toHaveBeenCalledWith('u1', {
      page: 1,
      limit: 20,
    });
    expect(result.meta).toBeDefined();
  });

  it('create calls service with user id', async () => {
    const fakeEvent = { id: 'tx1' };
    mockService.create.mockResolvedValueOnce(fakeEvent);
    await controller.create(fakeUser, {
      type: 'expense' as any,
      amount: 50,
      occurred_at: new Date().toISOString(),
      wallet_id: 'w1',
    });
    expect(mockService.create).toHaveBeenCalledWith('u1', expect.any(Object));
  });
});
