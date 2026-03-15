import { IsEnum, IsNumber, IsString, Min, MinLength } from 'class-validator';
import { WalletType } from '../../../../generated/prisma/client';

export class CreateWalletDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(WalletType)
  type: WalletType;

  @IsNumber()
  @Min(0)
  balance: number;
}
