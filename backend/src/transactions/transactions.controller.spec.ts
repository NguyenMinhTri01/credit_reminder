import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  const mockService = {
    create: jest.fn(),
    findAllByCard: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockReq = { user: { id: 'user-uuid-1' } } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockService }],
    }).compile();

    controller = module.get(TransactionsController);
    jest.clearAllMocks();
  });

  it('uses a JWT guard at controller level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TransactionsController);
    expect(guards).toHaveLength(1);
  });

  it('delegates create to service', async () => {
    const dto: CreateTransactionDto = {
      type: 'EXPENSE',
      amount: '50000',
      transactionDate: '2026-09-05',
    } as any;
    mockService.create.mockResolvedValue({ id: 'tx-1' });

    const result = await controller.create('card-1', mockReq, dto);

    expect(result).toEqual({ id: 'tx-1' });
    expect(mockService.create).toHaveBeenCalledWith('card-1', 'user-uuid-1', dto);
  });

  it('delegates findAll to service with parsed pagination params', async () => {
    mockService.findAllByCard.mockResolvedValue({ items: [], meta: {} });

    const result = await controller.findAll('card-1', mockReq, '2', '15');

    expect(result).toEqual({ items: [], meta: {} });
    expect(mockService.findAllByCard).toHaveBeenCalledWith('card-1', 'user-uuid-1', {
      page: 2,
      limit: 15,
    });
  });

  it('delegates findAll to service with default undefined pagination params', async () => {
    mockService.findAllByCard.mockResolvedValue({ items: [], meta: {} });

    await controller.findAll('card-1', mockReq);

    expect(mockService.findAllByCard).toHaveBeenCalledWith('card-1', 'user-uuid-1', {
      page: undefined,
      limit: undefined,
    });
  });

  it('delegates update to service', async () => {
    const dto: UpdateTransactionDto = { amount: '70000' } as any;
    mockService.update.mockResolvedValue({ id: 'tx-1' });

    const result = await controller.update('card-1', 'tx-1', mockReq, dto);

    expect(result).toEqual({ id: 'tx-1' });
    expect(mockService.update).toHaveBeenCalledWith('card-1', 'tx-1', 'user-uuid-1', dto);
  });

  it('delegates delete to service', async () => {
    mockService.delete.mockResolvedValue({ message: 'Deleted' });

    const result = await controller.delete('card-1', 'tx-1', mockReq);

    expect(result).toEqual({ message: 'Deleted' });
    expect(mockService.delete).toHaveBeenCalledWith('card-1', 'tx-1', 'user-uuid-1');
  });
});
