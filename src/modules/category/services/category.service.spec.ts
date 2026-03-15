import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CategoryType } from '../../../../generated/prisma/client';
import { CategoryService } from './category.service';
import { CategoryRepository } from '../repositories/category.repository';

const mockRepo = {
  findAllByUser: jest.fn(),
  findOneByUser: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockLogger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };

const fakeCategory = {
  id: 'c1',
  userId: 'u1',
  name: 'Food',
  type: CategoryType.expense,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryRepository, useValue: mockRepo },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(CategoryService);
    jest.clearAllMocks();
  });

  it('findAll returns category list', async () => {
    mockRepo.findAllByUser.mockResolvedValueOnce([fakeCategory]);
    const result = await service.findAll('u1');
    expect(result).toHaveLength(1);
  });

  it('findOne throws NotFoundException when category not found', async () => {
    mockRepo.findOneByUser.mockResolvedValueOnce(null);
    await expect(service.findOne('c-missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create delegates to repository', async () => {
    mockRepo.create.mockResolvedValueOnce(fakeCategory);
    const result = await service.create('u1', {
      name: 'Food',
      type: CategoryType.expense,
    });
    expect(mockRepo.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Food' }),
    );
    expect(result.id).toBe('c1');
  });

  it('remove throws NotFoundException when category not found', async () => {
    mockRepo.findOneByUser.mockResolvedValueOnce(null);
    await expect(service.remove('c-missing', 'u1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
