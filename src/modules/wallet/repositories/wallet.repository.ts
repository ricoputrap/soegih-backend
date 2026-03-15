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
    const { name } = await this.prisma.wallet.findUniqueOrThrow({
      where: { id },
    });
    return this.prisma.wallet.update({
      where: { id },
      data: {
        name: `${name}_${Date.now()}`,
        deletedAt: new Date(),
      },
    });
  }
}
