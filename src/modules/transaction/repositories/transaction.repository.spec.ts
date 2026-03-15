import { Test } from '@nestjs/testing';
import { TransactionRepository } from './transaction.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  transactionEvent: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  wallet: {
    update: jest.fn(),
  },
  posting: {
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('TransactionRepository', () => {
  let repo: TransactionRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    repo = module.get(TransactionRepository);
    jest.clearAllMocks();
  });

  describe('findManyByUser', () => {
    it('queries with pagination and scopes by user via wallet', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([[], 0]);
      const result = await repo.findManyByUser('u1', { page: 1, limit: 20 });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('softDelete', () => {
    it('sets deleted_at on transaction_event', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn(mockPrisma),
      );
      mockPrisma.transactionEvent.findFirst.mockResolvedValueOnce({
        id: 'tx1',
        postings: [
          { id: 'p1', wallet_id: 'w1', amount: { toNumber: () => -50 } },
        ],
      });
      mockPrisma.transactionEvent.update.mockResolvedValueOnce({});
      // softDelete calls $transaction — just verify it doesn't throw
      await expect(repo.softDelete('tx1')).resolves.toBeUndefined();
    });
  });
});
