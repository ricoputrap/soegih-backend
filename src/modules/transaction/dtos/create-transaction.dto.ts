import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsISO8601()
  occurred_at: string;

  // For expense and income only
  @ValidateIf((o) => o.type !== TransactionType.transfer)
  @IsUUID()
  category_id?: string;

  @ValidateIf((o) => o.type !== TransactionType.transfer)
  @IsUUID()
  wallet_id?: string;

  // For transfer only
  @ValidateIf((o) => o.type === TransactionType.transfer)
  @IsUUID()
  from_wallet_id?: string;

  @ValidateIf((o) => o.type === TransactionType.transfer)
  @IsUUID()
  to_wallet_id?: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
