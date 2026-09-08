import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  IAuthenticatedUser,
  ICardScheduleConfig,
  ICreditCard,
  IBankCatalogEntry,
  CREDIT_CARD_MESSAGES,
} from '@/shared';
import { CreditCardResponseDto, DeleteResponseDto } from './dto/credit-card-response.dto';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { ReconcileCreditCardDto } from './dto/reconcile-credit-card.dto';
import { CreditCardsService } from './credit-cards.service';

interface AuthenticatedRequest extends Request {
  user: IAuthenticatedUser;
}

@ApiTags(CREDIT_CARD_MESSAGES.SWAGGER_TAG)
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  /**
   * Return the supported bank catalog.
   * Must be declared BEFORE /:id routes so it is matched first.
   */
  @Get('banks')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_BANKS })
  @ApiOkResponse({ description: CREDIT_CARD_MESSAGES.BANK_CATALOG_SUCCESS })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  getBankCatalog(): ReadonlyArray<IBankCatalogEntry> {
    return this.creditCardsService.getBankCatalog();
  }

  /** Return the backend configuration used for client-side schedule previews. */
  @Get('schedule-config')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_SCHEDULE_CONFIG })
  @ApiOkResponse({ description: CREDIT_CARD_MESSAGES.SWAGGER_SCHEDULE_CONFIG })
  getScheduleConfig(): ICardScheduleConfig {
    return this.creditCardsService.getScheduleConfig();
  }

  @Post()
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_CREATE })
  @ApiCreatedResponse({ type: CreditCardResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: CREDIT_CARD_MESSAGES.INVALID_BANK_CODE,
  })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCreditCardDto,
  ): Promise<ICreditCard> {
    return this.creditCardsService.create(request.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_LIST })
  @ApiOkResponse({ type: CreditCardResponseDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  findAll(@Req() request: AuthenticatedRequest): Promise<ICreditCard[]> {
    return this.creditCardsService.findAll(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_FIND_ONE })
  @ApiOkResponse({ type: CreditCardResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: CREDIT_CARD_MESSAGES.NOT_FOUND })
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<ICreditCard> {
    return this.creditCardsService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_UPDATE })
  @ApiOkResponse({ type: CreditCardResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: CREDIT_CARD_MESSAGES.NOT_FOUND })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: CREDIT_CARD_MESSAGES.INVALID_BANK_CODE,
  })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ): Promise<ICreditCard> {
    return this.creditCardsService.update(id, request.user.id, dto);
  }

  /**
   * Soft-delete a card. Returns 200 JSON so apiClient can always call response.json().
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_DELETE })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: CREDIT_CARD_MESSAGES.NOT_FOUND })
  softDelete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.creditCardsService.softDelete(id, request.user.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_RESTORE })
  @ApiOkResponse({ type: CreditCardResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: CREDIT_CARD_MESSAGES.NOT_FOUND })
  restore(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<ICreditCard> {
    return this.creditCardsService.restore(id, request.user.id);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: CREDIT_CARD_MESSAGES.SWAGGER_RECONCILE })
  @ApiOkResponse({ type: CreditCardResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: CREDIT_CARD_MESSAGES.SWAGGER_TAG })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: CREDIT_CARD_MESSAGES.NOT_FOUND })
  reconcile(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReconcileCreditCardDto,
  ): Promise<ICreditCard> {
    return this.creditCardsService.reconcile(id, request.user.id, dto);
  }
}
