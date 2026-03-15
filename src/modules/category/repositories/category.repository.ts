import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOneByUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
      },
    });
  }

  update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.description !== undefined) data.description = dto.description;
    return this.prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Category> {
    const { name } = await this.prisma.category.findUniqueOrThrow({
      where: { id },
    });
    return this.prisma.category.update({
      where: { id },
      data: {
        name: `${name}_${Date.now()}`,
        deletedAt: new Date(),
      },
    });
  }
}
