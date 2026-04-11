import { Test, TestingModule } from '@nestjs/testing';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

const mockRemindersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RemindersController', () => {
  let controller: RemindersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemindersController],
      providers: [{ provide: RemindersService, useValue: mockRemindersService }],
    }).compile();

    controller = module.get<RemindersController>(RemindersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated reminders', async () => {
      const expected = { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockRemindersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });
});
