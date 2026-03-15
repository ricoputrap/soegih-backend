import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Category } from '../../../../generated/prisma/client';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly repo: CategoryRepository,
    @Optional()
    @InjectPinoLogger(CategoryService.name)
    private readonly logger?: PinoLogger,
  ) {}

  findAll(userId: string): Promise<Category[]> {
    return this.repo.findAllByUser(userId);
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.repo.findOneByUser(id, userId);
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = await this.repo.create(userId, dto);
    this.logger?.info(
      { user_id: userId, category_id: category.id },
      'category created',
    );
    return category;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findOne(id, userId);
    const category = await this.repo.update(id, dto);
    this.logger?.info({ user_id: userId, category_id: id }, 'category updated');
    return category;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.softDelete(id);
    this.logger?.info({ user_id: userId, category_id: id }, 'category deleted');
  }
}
