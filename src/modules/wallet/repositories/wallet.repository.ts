import { Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateWalletDto } from '../dtos/create-wallet.dto';
import { UpdateWalletDto } from '../dtos/update-wallet.dto';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Wallet[]> {
    return this.prisma.wallet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOneByUser(id: string, userId: string): Promise<Wallet | null> {
    return this.prisma.wallet.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  create(userId: string, dto: CreateWalletDto): Promise<Wallet> {
    return this.prisma.wallet.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        balance: new Prisma.Decimal(dto.balance),
      },
    });
  }

  update(id: string, dto: UpdateWalletDto): Promise<Wallet> {
    const data: Prisma.WalletUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.balance !== undefined)
      data.balance = new Prisma.Decimal(dto.balance);
    return this.prisma.wallet.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Wallet> {
    return this.prisma.$transaction(async (tx) => {
      const { name } = await tx.wallet.findUniqueOrThrow({
        where: { id },
      });

      // Find all active postings for this wallet
      const walletPostings = await tx.posting.findMany({
        where: { walletId: id, deletedAt: null },
      });

      // Derive unique eventIds
      const eventIds = Array.from(new Set(walletPostings.map((p) => p.eventId)));

      // For each event, reverse balances and soft-delete
      for (const eventId of eventIds) {
        // Get all active postings for this event (includes sibling wallets)
        const eventPostings = await tx.posting.findMany({
          where: { eventId, deletedAt: null },
        });

        // Reverse balance for each wallet in the event
        for (const posting of eventPostings) {
          await tx.wallet.update({
            where: { id: posting.walletId },
            data: { balance: { decrement: posting.amount } },
          });
        }

        // Soft-delete the transaction event
        const now = new Date();
        await tx.transactionEvent.update({
          where: { id: eventId },
          data: { deletedAt: now },
        });

        // Soft-delete all postings for this event
        await tx.posting.updateMany({
          where: { eventId },
          data: { deletedAt: now },
        });
      }

      // Soft-delete the wallet with name suffix
      return tx.wallet.update({
        where: { id },
        data: {
          name: `${name}_${Date.now()}`,
          deletedAt: new Date(),
        },
      });
    });
  }
}
