import { Test } from '@nestjs/testing';
import { CategoryType } from '../../../../generated/prisma/client';
import { CategoryController } from './category.controller';
import { CategoryService } from '../services/category.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const fakeUser = { id: 'u1', email: 'a@b.com' };
const fakeCategory = { id: 'c1', userId: 'u1', name: 'Food' };

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockService }],
    }).compile();
    controller = module.get(CategoryController);
    jest.clearAllMocks();
  });

  it('findAll calls service with user id', async () => {
    mockService.findAll.mockResolvedValueOnce([fakeCategory]);
    const result = await controller.findAll(fakeUser);
    expect(mockService.findAll).toHaveBeenCalledWith('u1');
    expect(result).toHaveLength(1);
  });

  it('create calls service with user id and dto', async () => {
    mockService.create.mockResolvedValueOnce(fakeCategory);
    await controller.create(fakeUser, {
      name: 'Food',
      type: CategoryType.expense,
    });
    expect(mockService.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Food' }),
    );
  });

  it('remove calls service with category id and user id', async () => {
    mockService.remove.mockResolvedValueOnce(undefined);
    await controller.remove('c1', fakeUser);
    expect(mockService.remove).toHaveBeenCalledWith('c1', 'u1');
  });
});
