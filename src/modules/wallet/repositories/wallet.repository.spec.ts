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
  posting: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  transactionEvent: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
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
    beforeEach(() => {
      // Mock $transaction to pass through the callback
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
    });

    it('wallet with no transactions only soft-deletes the wallet', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'wallet-1',
        name: 'Cash',
      });
      mockPrisma.posting.findMany.mockResolvedValueOnce([]);
      mockPrisma.wallet.update.mockResolvedValueOnce({
        id: 'wallet-1',
        name: 'Cash_12345',
        deletedAt: expect.any(Date),
      });

      await repo.softDelete('wallet-1');

      expect(mockPrisma.posting.findMany).toHaveBeenCalledWith({
        where: { walletId: 'wallet-1', deletedAt: null },
      });
      expect(mockPrisma.transactionEvent.update).not.toHaveBeenCalled();
      expect(mockPrisma.posting.updateMany).not.toHaveBeenCalled();
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

    it('wallet with expense transaction reverses balance and cascades soft-delete', async () => {
      const walletId = 'wallet-1';
      const eventId = 'tx-1';
      const posting = { id: 'posting-1', walletId, eventId, amount: -50n };

      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValueOnce({
        id: walletId,
        name: 'Cash',
      });
      mockPrisma.posting.findMany.mockResolvedValueOnce([posting]);
      mockPrisma.posting.findMany.mockResolvedValueOnce([posting]);
      mockPrisma.wallet.update.mockResolvedValue({});
      mockPrisma.transactionEvent.update.mockResolvedValue({});
      mockPrisma.posting.updateMany.mockResolvedValue({});
      mockPrisma.wallet.update.mockResolvedValueOnce({
        id: walletId,
        name: 'Cash_12345',
        deletedAt: expect.any(Date),
      });

      await repo.softDelete(walletId);

      // Verify balance was reversed (decrement -50 = increment 50)
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: walletId },
          data: { balance: { decrement: -50n } },
        }),
      );

      // Verify event was soft-deleted
      expect(mockPrisma.transactionEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: eventId },
          data: { deletedAt: expect.any(Date) },
        }),
      );

      // Verify postings were soft-deleted
      expect(mockPrisma.posting.updateMany).toHaveBeenCalledWith({
        where: { eventId },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify wallet was soft-deleted
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: walletId },
          data: expect.objectContaining({
            name: expect.stringMatching(/^Cash_\d+$/),
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('wallet with transfer transaction reverses balances for both wallets', async () => {
      const sourceWalletId = 'wallet-1';
      const destWalletId = 'wallet-2';
      const eventId = 'tx-transfer';
      const sourcePosting = {
        id: 'posting-1',
        walletId: sourceWalletId,
        eventId,
        amount: -100n,
      };
      const destPosting = {
        id: 'posting-2',
        walletId: destWalletId,
        eventId,
        amount: 100n,
      };

      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValueOnce({
        id: sourceWalletId,
        name: 'Cash',
      });
      // First call: wallet postings
      mockPrisma.posting.findMany.mockResolvedValueOnce([sourcePosting]);
      // Second call: event postings (both source and dest)
      mockPrisma.posting.findMany.mockResolvedValueOnce([
        sourcePosting,
        destPosting,
      ]);
      mockPrisma.wallet.update.mockResolvedValue({});
      mockPrisma.transactionEvent.update.mockResolvedValue({});
      mockPrisma.posting.updateMany.mockResolvedValue({});
      mockPrisma.wallet.update.mockResolvedValueOnce({
        id: sourceWalletId,
        name: 'Cash_12345',
        deletedAt: expect.any(Date),
      });

      await repo.softDelete(sourceWalletId);

      // Verify both wallet balances were reversed
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: sourceWalletId },
          data: { balance: { decrement: -100n } },
        }),
      );
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: destWalletId },
          data: { balance: { decrement: 100n } },
        }),
      );

      // Verify event and postings were soft-deleted
      expect(mockPrisma.transactionEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: eventId },
          data: { deletedAt: expect.any(Date) },
        }),
      );
      expect(mockPrisma.posting.updateMany).toHaveBeenCalledWith({
        where: { eventId },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
