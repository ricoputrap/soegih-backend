import { Test } from '@nestjs/testing';
import { CategoryRepository } from './category.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
};

describe('CategoryRepository', () => {
  let repo: CategoryRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    repo = module.get(CategoryRepository);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('queries categories scoped to userId with deletedAt: null', async () => {
      mockPrisma.category.findMany.mockResolvedValueOnce([]);
      await repo.findAllByUser('user-1');
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', deletedAt: null },
        }),
      );
    });
  });

  describe('findOneByUser', () => {
    it('queries a single category by id and userId', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      await repo.findOneByUser('cat-1', 'user-1');
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1', userId: 'user-1', deletedAt: null },
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and suffixes name with Unix timestamp', async () => {
      mockPrisma.category.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Food',
      });
      mockPrisma.category.update.mockResolvedValueOnce({});
      await repo.softDelete('cat-1');
      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            name: expect.stringMatching(/^Food_\d+$/),
          }),
        }),
      );
    });
  });
});
