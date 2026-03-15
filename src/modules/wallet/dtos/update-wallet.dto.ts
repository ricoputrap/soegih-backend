import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { WalletType } from '../../../../generated/prisma/client';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(WalletType)
  type?: WalletType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
