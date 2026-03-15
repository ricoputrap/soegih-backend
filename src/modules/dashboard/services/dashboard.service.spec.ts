import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  wallet: { aggregate: jest.fn() },
  $queryRaw: jest.fn(),
  transactionEvent: { findMany: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getDashboard returns structured data with current month default', async () => {
    mockPrisma.wallet.aggregate.mockResolvedValueOnce({
      _sum: { balance: '500000' },
    });
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: '200000' }]); // monthly income
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: '50000' }]); // monthly expense
    mockPrisma.$queryRaw.mockResolvedValueOnce([]); // expense by category

    const result = await service.getDashboard('u1');

    expect(result).toHaveProperty('net_worth');
    expect(result).toHaveProperty('monthly_income');
    expect(result).toHaveProperty('monthly_expense');
    expect(result).toHaveProperty('expense_by_category');
    expect(result).toHaveProperty('month');
  });
});
