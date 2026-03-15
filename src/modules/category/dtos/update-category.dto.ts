import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../../generated/prisma/client';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @IsOptional()
  @IsString()
  description?: string;
}
