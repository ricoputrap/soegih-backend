import { Module } from '@nestjs/common';
import { WalletController } from './controllers/wallet.controller';
import { WalletService } from './services/wallet.service';
import { WalletRepository } from './repositories/wallet.repository';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
})
export class WalletModule {}
