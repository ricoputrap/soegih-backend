import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.categoryService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.categoryService.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.categoryService.remove(id, user.id);
  }
}
