import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  const snapshot = {
    generatedAt: '2026-09-04T00:00:00.000Z',
    summary: {
      cardCount: 0,
      totalCreditLimit: '0.00',
      totalCurrentBalance: '0.00',
      availableCredit: '0.00',
      utilizationPercent: null,
      hasUnknownLimits: false,
    },
    cards: [],
    upcomingReminders: [],
  };
  const dashboardService = { getSnapshot: jest.fn() };

  it('uses a JWT guard at controller level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, DashboardController);
    expect(guards).toHaveLength(1);
  });

  it('passes only the authenticated user id to the service', async () => {
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();
    dashboardService.getSnapshot.mockResolvedValue(snapshot);
    const controller = module.get(DashboardController);

    await expect(controller.getDashboard({ user: { id: 'user-1' } } as never)).resolves.toEqual(
      snapshot,
    );
    expect(dashboardService.getSnapshot).toHaveBeenCalledWith('user-1');
  });
});
