import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsISO8601()
  occurred_at?: string;
}
