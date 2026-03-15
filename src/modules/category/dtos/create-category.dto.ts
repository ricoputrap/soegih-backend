import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../../generated/prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  @IsString()
  description?: string;
}
