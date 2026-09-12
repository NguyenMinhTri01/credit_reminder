import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CardType } from '@prisma/client';
import { CreateCreditCardDto } from './create-credit-card.dto';
import { UpdateCreditCardDto } from './update-credit-card.dto';
import { ReconcileCreditCardDto } from './reconcile-credit-card.dto';
import { CREDIT_CARD_MESSAGES } from '@/shared';

describe('CreditCard DTOs', () => {
  describe('CreateCreditCardDto', () => {
    it('validates a valid DTO', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        cardType: CardType.VISA,
        lastFourDigits: '1234',
        creditLimit: '50000000.00',
        availableCredit: '50000000.00',
        statementDay: 25,
        paymentDueDaysAfterStatement: 20,
        expiryMonth: 12,
        expiryYear: 2028,
        cardName: 'My Card',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each(Object.values(CardType))('accepts supported card type %s', async (cardType) => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        cardType,
        lastFourDigits: '1234',
        creditLimit: '50000000.00',
        availableCredit: '50000000.00',
        statementDay: 25,
        paymentDueDaysAfterStatement: 20,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each([
      ['missing', undefined, CREDIT_CARD_MESSAGES.CARD_TYPE_REQUIRED],
      ['empty', '', CREDIT_CARD_MESSAGES.CARD_TYPE_REQUIRED],
      ['null', null, CREDIT_CARD_MESSAGES.CARD_TYPE_REQUIRED],
      ['unsupported', 'DISCOVER', CREDIT_CARD_MESSAGES.CARD_TYPE_INVALID],
    ])('returns one accurate card type error for %s input', async (_label, cardType, message) => {
      const input: Record<string, unknown> = {
        bankCode: 'vietcombank',
        lastFourDigits: '1234',
        creditLimit: '50000000.00',
        availableCredit: '50000000.00',
        statementDay: 25,
        paymentDueDaysAfterStatement: 20,
      };
      if (cardType !== undefined) input.cardType = cardType;

      const errors = await validate(plainToInstance(CreateCreditCardDto, input));
      const cardTypeErrors = errors.filter((error) => error.property === 'cardType');

      expect(cardTypeErrors).toHaveLength(1);
      expect(cardTypeErrors[0].constraints).toEqual({ isEnum: message });
    });

    it('rejects invalid fields and non-positive credit limit', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: '',
        lastFourDigits: '12',
        creditLimit: '-500',
        availableCredit: 'abc',
        statementDay: 35,
        paymentDueDaysAfterStatement: 0,
        expiryMonth: 15,
        expiryYear: 2020,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects non-numeric string or non-string for creditLimit', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vcb',
        lastFourDigits: '1234',
        creditLimit: 'invalid',
        availableCredit: '500',
        statementDay: 10,
        paymentDueDaysAfterStatement: 15,
      });
      const errors = await validate(dto);
      const limitError = errors.find((e) => e.property === 'creditLimit');
      expect(limitError).toBeDefined();
    });

    it('handles non-string value in custom validator', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vcb',
        lastFourDigits: '1234',
        creditLimit: 12345 as any,
        availableCredit: '500',
        statementDay: 10,
        paymentDueDaysAfterStatement: 15,
      });
      const errors = await validate(dto);
      const limitError = errors.find((e) => e.property === 'creditLimit');
      expect(limitError).toBeDefined();
    });

    it('rejects money values outside DECIMAL(15,2) precision', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        cardType: CardType.VISA,
        lastFourDigits: '1234',
        creditLimit: '10000000000000.00',
        availableCredit: '0.001',
        statementDay: 10,
        paymentDueDaysAfterStatement: 15,
      });

      const errors = await validate(dto);
      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['creditLimit', 'availableCredit']),
      );
    });

    it('evaluates expiry year against the current year at validation time', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-12-31T12:00:00.000Z'));

      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        cardType: CardType.VISA,
        lastFourDigits: '1234',
        creditLimit: '500',
        availableCredit: '500',
        statementDay: 10,
        paymentDueDaysAfterStatement: 15,
        expiryYear: 2026,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);

      jest.setSystemTime(new Date('2027-01-01T12:00:00.000Z'));
      const expiredErrors = await validate(dto);
      expect(expiredErrors.find((error) => error.property === 'expiryYear')).toBeDefined();

      jest.useRealTimers();
    });

    it('rejects schedule and expiry integers outside supported bounds', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        lastFourDigits: '1234',
        creditLimit: '500',
        availableCredit: '500',
        statementDay: 10,
        paymentDueDaysAfterStatement: 367,
        expiryYear: 10000,
      });

      const errors = await validate(dto);

      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['paymentDueDaysAfterStatement', 'expiryYear']),
      );
    });

    it('reports a single upper-bound error for an expiry year over the maximum', async () => {
      const dto = plainToInstance(CreateCreditCardDto, {
        bankCode: 'vietcombank',
        lastFourDigits: '1234',
        creditLimit: '500',
        availableCredit: '500',
        statementDay: 10,
        paymentDueDaysAfterStatement: 15,
        expiryYear: 10000,
      });

      const errors = await validate(dto);
      const expiryErrors = errors.filter((error) => error.property === 'expiryYear');

      expect(expiryErrors).toHaveLength(1);
      expect(expiryErrors[0].constraints).toEqual({
        max: CREDIT_CARD_MESSAGES.EXPIRY_YEAR_MAX,
      });
    });
  });

  describe('UpdateCreditCardDto', () => {
    it('validates a valid partial update DTO', async () => {
      const dto = plainToInstance(UpdateCreditCardDto, {
        creditLimit: '60000000.00',
        statementDay: 20,
        paymentDueDaysAfterStatement: 25,
        expiryMonth: 6,
        expiryYear: 2029,
        cardName: 'Updated Name',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts and rejects card type updates at the API boundary', async () => {
      const validDto = plainToInstance(UpdateCreditCardDto, { cardType: CardType.JCB });
      const invalidDto = plainToInstance(UpdateCreditCardDto, { cardType: 'DISCOVER' });

      expect(await validate(validDto)).toHaveLength(0);
      expect(
        (await validate(invalidDto)).find((error) => error.property === 'cardType'),
      ).toBeDefined();
    });

    it('rejects negative or non-string creditLimit in update', async () => {
      const dto = plainToInstance(UpdateCreditCardDto, {
        creditLimit: '-100',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);

      const nonStringDto = plainToInstance(UpdateCreditCardDto, {
        creditLimit: 9999 as any,
      });
      const nonStringErrors = await validate(nonStringDto);
      expect(nonStringErrors).toHaveLength(1);
    });

    it('does not skip creditLimit validators when the value is null', async () => {
      const dto = plainToInstance(UpdateCreditCardDto, { creditLimit: null });

      const errors = await validate(dto);
      expect(errors.find((error) => error.property === 'creditLimit')).toBeDefined();
    });

    it('rejects null for required persisted update fields', async () => {
      const dto = plainToInstance(UpdateCreditCardDto, { cardName: null });

      const errors = await validate(dto);
      expect(errors.find((error) => error.property === 'cardName')).toBeDefined();
    });
  });

  describe('ReconcileCreditCardDto', () => {
    it('validates a valid reconcile DTO', async () => {
      const dto = plainToInstance(ReconcileCreditCardDto, {
        availableCredit: '45000000.00',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects empty or invalid availableCredit', async () => {
      const dto = plainToInstance(ReconcileCreditCardDto, {
        availableCredit: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects reconcile amounts outside DECIMAL(15,2) precision', async () => {
      const dto = plainToInstance(ReconcileCreditCardDto, {
        availableCredit: '10000000000000.001',
      });

      const errors = await validate(dto);
      expect(errors.find((error) => error.property === 'availableCredit')).toBeDefined();
    });
  });
});
