import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { ReconcileCreditCardDto } from './dto/reconcile-credit-card.dto';

describe('CreditCardsController', () => {
  let controller: CreditCardsController;
  const mockService = {
    getBankCatalog: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    reconcile: jest.fn(),
  };

  const mockReq = { user: { id: 'user-uuid-1' } } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CreditCardsController],
      providers: [{ provide: CreditCardsService, useValue: mockService }],
    }).compile();

    controller = module.get(CreditCardsController);
    jest.clearAllMocks();
  });

  it('uses a JWT guard at controller level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CreditCardsController);
    expect(guards).toHaveLength(1);
  });

  it('delegates getBankCatalog to service', () => {
    mockService.getBankCatalog.mockReturnValue([{ bankCode: 'vcb' }]);
    const result = controller.getBankCatalog();
    expect(result).toEqual([{ bankCode: 'vcb' }]);
    expect(mockService.getBankCatalog).toHaveBeenCalled();
  });

  it('delegates create to service', async () => {
    const dto: CreateCreditCardDto = { bankCode: 'vcb' } as any;
    mockService.create.mockResolvedValue({ id: 'card-1' });

    const result = await controller.create(mockReq, dto);

    expect(result).toEqual({ id: 'card-1' });
    expect(mockService.create).toHaveBeenCalledWith('user-uuid-1', dto);
  });

  it('delegates findAll to service', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'card-1' }]);

    const result = await controller.findAll(mockReq);

    expect(result).toEqual([{ id: 'card-1' }]);
    expect(mockService.findAll).toHaveBeenCalledWith('user-uuid-1');
  });

  it('delegates findOne to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'card-1' });

    const result = await controller.findOne(mockReq, 'card-1');

    expect(result).toEqual({ id: 'card-1' });
    expect(mockService.findOne).toHaveBeenCalledWith('card-1', 'user-uuid-1');
  });

  it('delegates update to service', async () => {
    const dto: UpdateCreditCardDto = { cardName: 'New' } as any;
    mockService.update.mockResolvedValue({ id: 'card-1' });

    const result = await controller.update(mockReq, 'card-1', dto);

    expect(result).toEqual({ id: 'card-1' });
    expect(mockService.update).toHaveBeenCalledWith('card-1', 'user-uuid-1', dto);
  });

  it('delegates softDelete to service', async () => {
    mockService.softDelete.mockResolvedValue({ message: 'Deleted' });

    const result = await controller.softDelete(mockReq, 'card-1');

    expect(result).toEqual({ message: 'Deleted' });
    expect(mockService.softDelete).toHaveBeenCalledWith('card-1', 'user-uuid-1');
  });

  it('delegates restore to service', async () => {
    mockService.restore.mockResolvedValue({ id: 'card-1' });

    const result = await controller.restore(mockReq, 'card-1');

    expect(result).toEqual({ id: 'card-1' });
    expect(mockService.restore).toHaveBeenCalledWith('card-1', 'user-uuid-1');
  });

  it('delegates reconcile to service', async () => {
    const dto: ReconcileCreditCardDto = { availableCredit: '50000000' } as any;
    mockService.reconcile.mockResolvedValue({ id: 'card-1' });

    const result = await controller.reconcile(mockReq, 'card-1', dto);

    expect(result).toEqual({ id: 'card-1' });
    expect(mockService.reconcile).toHaveBeenCalledWith('card-1', 'user-uuid-1', dto);
  });
});
