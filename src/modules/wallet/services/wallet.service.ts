import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Wallet } from '../../../../generated/prisma/client';
import { WalletRepository } from '../repositories/wallet.repository';
import { CreateWalletDto } from '../dtos/create-wallet.dto';
import { UpdateWalletDto } from '../dtos/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly repo: WalletRepository,
    @Optional()
    @InjectPinoLogger(WalletService.name)
    private readonly logger?: PinoLogger,
  ) {}

  async findAll(userId: string): Promise<Wallet[]> {
    return this.repo.findAllByUser(userId);
  }

  async findOne(id: string, userId: string): Promise<Wallet> {
    const wallet = await this.repo.findOneByUser(id, userId);
    if (!wallet) throw new NotFoundException(`Wallet ${id} not found`);
    return wallet;
  }

  async create(userId: string, dto: CreateWalletDto): Promise<Wallet> {
    const wallet = await this.repo.create(userId, dto);
    this.logger?.info(
      { user_id: userId, wallet_id: wallet.id },
      'wallet created',
    );
    return wallet;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet> {
    await this.findOne(id, userId);
    const wallet = await this.repo.update(id, dto);
    this.logger?.info({ user_id: userId, wallet_id: id }, 'wallet updated');
    return wallet;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.repo.softDelete(id);
    this.logger?.info({ user_id: userId, wallet_id: id }, 'wallet deleted');
  }
}
