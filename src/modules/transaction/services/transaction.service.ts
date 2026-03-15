import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  TransactionRepository,
  PaginatedTransactions,
} from '../repositories/transaction.repository';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';
import { TransactionQueryDto } from '../dtos/transaction-query.dto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly repo: TransactionRepository,
    @Optional()
    @InjectPinoLogger(TransactionService.name)
    private readonly logger?: PinoLogger,
  ) {}

  findMany(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<PaginatedTransactions> {
    return this.repo.findManyByUser(userId, query);
  }

  async findOne(id: string, userId: string) {
    const event = await this.repo.findOneByUser(id, userId);
    if (!event) throw new NotFoundException(`Transaction ${id} not found`);
    return event;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const event = await this.repo.create(dto);
    this.logger?.info(
      { user_id: userId, transaction_id: event.id },
      'transaction created',
    );
    return event;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    await this.findOne(id, userId);
    const event = await this.repo.update(id, dto);
    this.logger?.info(
      { user_id: userId, transaction_id: id },
      'transaction updated',
    );
    return event;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.softDelete(id);
    this.logger?.info(
      { user_id: userId, transaction_id: id },
      'transaction deleted',
    );
  }
}
