import { Injectable } from '@nestjs/common';
import { Prisma, TransactionEvent, TransactionType } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';
import { TransactionQueryDto } from '../dtos/transaction-query.dto';

export interface PaginatedTransactions {
  data: TransactionEvent[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUser(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<PaginatedTransactions> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'occurred_at',
      sort_order = 'desc',
      search,
      month,
    } = query;
    const skip = (page - 1) * limit;

    const userWalletFilter: Prisma.TransactionEventWhereInput = {
      deleted_at: null,
      postings: {
        some: {
          deleted_at: null,
          wallet: { user_id: userId, deleted_at: null },
        },
      },
    };

    if (search) {
      userWalletFilter.note = { contains: search, mode: 'insensitive' };
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      userWalletFilter.occurred_at = { gte: start, lt: end };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transactionEvent.findMany({
        where: userWalletFilter,
        include: {
          postings: { where: { deleted_at: null }, include: { wallet: true } },
          category: true,
        },
        orderBy:
          sort_by !== 'amount'
            ? { [sort_by]: sort_order }
            : { occurred_at: sort_order },
        skip,
        take: limit,
      }),
      this.prisma.transactionEvent.count({ where: userWalletFilter }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  findOneByUser(id: string, userId: string): Promise<TransactionEvent | null> {
    return this.prisma.transactionEvent.findFirst({
      where: {
        id,
        deleted_at: null,
        postings: {
          some: {
            deleted_at: null,
            wallet: { user_id: userId, deleted_at: null },
          },
        },
      },
      include: {
        postings: { where: { deleted_at: null }, include: { wallet: true } },
        category: true,
      },
    });
  }

  async create(dto: CreateTransactionDto): Promise<TransactionEvent> {
    const postings = this.buildPostings(dto);

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.transactionEvent.create({
        data: {
          type: dto.type,
          note: dto.note,
          category_id: dto.category_id,
          occurred_at: new Date(dto.occurred_at),
          postings: { create: postings },
        },
        include: {
          postings: { include: { wallet: true } },
          category: true,
        },
      });

      // Update wallet balances atomically
      for (const posting of event.postings) {
        await tx.wallet.update({
          where: { id: posting.wallet_id },
          data: { balance: { increment: posting.amount } },
        });
      }

      return event;
    });
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionEvent> {
    return this.prisma.transactionEvent.update({
      where: { id },
      data: {
        note: dto.note,
        category_id: dto.category_id,
        occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : undefined,
      },
      include: {
        postings: { where: { deleted_at: null }, include: { wallet: true } },
        category: true,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const event = await tx.transactionEvent.findFirst({
        where: { id, deleted_at: null },
        include: { postings: { where: { deleted_at: null } } },
      });

      if (!event) return;

      // Reverse wallet balances
      for (const posting of event.postings) {
        await tx.wallet.update({
          where: { id: posting.wallet_id },
          data: { balance: { decrement: posting.amount } },
        });
      }

      const now = new Date();
      await tx.transactionEvent.update({
        where: { id },
        data: { deleted_at: now },
      });
      await tx.posting.updateMany({
        where: { event_id: id },
        data: { deleted_at: now },
      });
    });
  }

  private buildPostings(
    dto: CreateTransactionDto,
  ): Prisma.PostingCreateWithoutEventInput[] {
    const amount = new Prisma.Decimal(dto.amount);

    if (dto.type === TransactionType.expense) {
      return [
        {
          wallet: { connect: { id: dto.wallet_id! } },
          amount: amount.negated(),
        },
      ];
    }

    if (dto.type === TransactionType.income) {
      return [{ wallet: { connect: { id: dto.wallet_id! } }, amount }];
    }

    // transfer
    return [
      {
        wallet: { connect: { id: dto.from_wallet_id! } },
        amount: amount.negated(),
      },
      { wallet: { connect: { id: dto.to_wallet_id! } }, amount },
    ];
  }
}
