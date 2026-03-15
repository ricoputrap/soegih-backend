import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CategoryExpense {
  category_id: string;
  category_name: string;
  total: number;
}

export interface DashboardData {
  monthly_income: number;
  monthly_expense: number;
  net_worth: number;
  expense_by_category: CategoryExpense[];
  month: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, month?: string): Promise<DashboardData> {
    const targetMonth = month ?? this.currentMonth();
    const [year, mon] = targetMonth.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 1);

    const [netWorthResult, monthlyIncome, monthlyExpense, expenseByCategory] =
      await Promise.all([
        this.getNetWorth(userId),
        this.getMonthlyTotal(userId, 'income', startOfMonth, endOfMonth),
        this.getMonthlyTotal(userId, 'expense', startOfMonth, endOfMonth),
        this.getExpenseByCategory(userId, startOfMonth, endOfMonth),
      ]);

    return {
      monthly_income: monthlyIncome,
      monthly_expense: monthlyExpense,
      net_worth: netWorthResult,
      expense_by_category: expenseByCategory,
      month: targetMonth,
    };
  }

  private async getNetWorth(userId: string): Promise<number> {
    const result = await this.prisma.wallet.aggregate({
      where: { userId, deletedAt: null },
      _sum: { balance: true },
    });
    return Number(result._sum?.balance ?? 0);
  }

  private async getMonthlyTotal(
    userId: string,
    type: 'income' | 'expense',
    start: Date,
    end: Date,
  ): Promise<number> {
    type Row = { total: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT COALESCE(SUM(ABS(p.amount)), 0)::text AS total
      FROM postings p
      JOIN transaction_events te ON p.event_id = te.id
      JOIN wallets w ON p.wallet_id = w.id
      WHERE w.user_id = ${userId}
        AND te.type = ${type}::"transaction_type"
        AND te.occurred_at >= ${start}
        AND te.occurred_at < ${end}
        AND p.deleted_at IS NULL
        AND te.deleted_at IS NULL
        AND w.deleted_at IS NULL
    `;
    return Number(rows[0]?.total ?? 0);
  }

  private async getExpenseByCategory(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<CategoryExpense[]> {
    type Row = { category_id: string; category_name: string; total: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(SUM(ABS(p.amount)), 0)::text AS total
      FROM postings p
      JOIN transaction_events te ON p.event_id = te.id
      JOIN categories c ON te.category_id = c.id
      JOIN wallets w ON p.wallet_id = w.id
      WHERE w.user_id = ${userId}
        AND te.type = 'expense'::"transaction_type"
        AND te.occurred_at >= ${start}
        AND te.occurred_at < ${end}
        AND p.deleted_at IS NULL
        AND te.deleted_at IS NULL
        AND w.deleted_at IS NULL
        AND c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `;
    return rows.map((r) => ({
      category_id: r.category_id,
      category_name: r.category_name,
      total: Number(r.total),
    }));
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
