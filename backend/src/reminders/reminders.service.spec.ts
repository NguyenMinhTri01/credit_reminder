import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { PrismaService } from '@/prisma/prisma.service';

const mockPrismaService = {
  reminder: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('RemindersService', () => {
  let service: RemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a reminder', async () => {
      const dto = {
        title: 'Test Reminder',
        amount: 100000,
        nextTriggerDate: '2025-12-31T00:00:00.000Z',
      };
      const expected = { id: '1', ...dto, userId: 'user-1' };
      mockPrismaService.reminder.create.mockResolvedValue(expected);

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(expected);
      expect(mockPrismaService.reminder.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a reminder by id', async () => {
      const expected = { id: '1', title: 'Test' };
      mockPrismaService.reminder.findUnique.mockResolvedValue(expected);

      const result = await service.findOne('1');
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException if reminder not found', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated reminders', async () => {
      const items = [{ id: '1', title: 'Test' }];
      mockPrismaService.reminder.findMany.mockResolvedValue(items);
      mockPrismaService.reminder.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toEqual(items);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should delete a reminder', async () => {
      const expected = { id: '1', title: 'Test' };
      mockPrismaService.reminder.findUnique.mockResolvedValue(expected);
      mockPrismaService.reminder.delete.mockResolvedValue(expected);

      const result = await service.remove('1');
      expect(result).toEqual(expected);
    });
  });
});
