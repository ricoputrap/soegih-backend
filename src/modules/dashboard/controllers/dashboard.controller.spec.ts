import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../services/dashboard.service';

const mockService = { getDashboard: jest.fn() };
const fakeUser = { id: 'u1', email: 'a@b.com' };

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();
    controller = module.get(DashboardController);
    jest.clearAllMocks();
  });

  it('getDashboard calls service with user id and optional month', async () => {
    mockService.getDashboard.mockResolvedValueOnce({
      month: '2026-03',
      net_worth: 0,
      monthly_income: 0,
      monthly_expense: 0,
      expense_by_category: [],
    });
    await controller.getDashboard(fakeUser, { month: '2026-03' });
    expect(mockService.getDashboard).toHaveBeenCalledWith('u1', '2026-03');
  });
});
