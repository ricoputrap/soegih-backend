import { Test } from '@nestjs/testing';
import { WalletRepository } from './wallet.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  wallet: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
};

describe('WalletRepository', () => {
  let repo: WalletRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    repo = module.get(WalletRepository);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('queries wallets scoped to userId with deletedAt: null', async () => {
      mockPrisma.wallet.findMany.mockResolvedValueOnce([]);
      await repo.findAllByUser('user-1');
      expect(mockPrisma.wallet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', deletedAt: null },
        }),
      );
    });
  });

  describe('findOneByUser', () => {
    it('queries a single wallet by id and userId', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValueOnce(null);
      await repo.findOneByUser('wallet-1', 'user-1');
      expect(mockPrisma.wallet.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wallet-1', userId: 'user-1', deletedAt: null },
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and suffixes name with Unix timestamp', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'wallet-1',
        name: 'Cash',
      });
      mockPrisma.wallet.update.mockResolvedValueOnce({});
      await repo.softDelete('wallet-1');
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wallet-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            name: expect.stringMatching(/^Cash_\d+$/),
          }),
        }),
      );
    });
  });
});
