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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  IAuthenticatedUser,
  IPaginatedResponse,
  ITransaction,
  TRANSACTION_MESSAGES,
} from '@/shared';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  DeleteTransactionResponseDto,
  TransactionResponseDto,
  TransactionsPageResponseDto,
} from './dto/transaction-response.dto';
import { TransactionsPaginationDto } from './dto/transactions-pagination.dto';
import { TransactionsService } from './transactions.service';

interface AuthenticatedRequest extends Request {
  user: IAuthenticatedUser;
}

@ApiTags(TRANSACTION_MESSAGES.SWAGGER_TAG)
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('credit-cards/:cardId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: TRANSACTION_MESSAGES.SWAGGER_CREATE })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: TRANSACTION_MESSAGES.SWAGGER_TAG,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: TRANSACTION_MESSAGES.CARD_NOT_FOUND,
  })
  create(
    @Param('cardId') cardId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ): Promise<ITransaction> {
    return this.transactionsService.create(cardId, request.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: TRANSACTION_MESSAGES.SWAGGER_LIST })
  @ApiOkResponse({ type: TransactionsPageResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: TRANSACTION_MESSAGES.SWAGGER_TAG,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: TRANSACTION_MESSAGES.CARD_NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: TRANSACTION_MESSAGES.LIMIT_INVALID,
  })
  findAll(
    @Param('cardId') cardId: string,
    @Req() request: AuthenticatedRequest,
    @Query() query: TransactionsPaginationDto,
  ): Promise<IPaginatedResponse<ITransaction>> {
    return this.transactionsService.findAllByCard(cardId, request.user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: TRANSACTION_MESSAGES.SWAGGER_UPDATE })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: TRANSACTION_MESSAGES.SWAGGER_TAG,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: TRANSACTION_MESSAGES.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: TRANSACTION_MESSAGES.PRE_RECONCILIATION_EDIT,
  })
  update(
    @Param('cardId') cardId: string,
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateTransactionDto,
  ): Promise<ITransaction> {
    return this.transactionsService.update(cardId, id, request.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: TRANSACTION_MESSAGES.SWAGGER_DELETE })
  @ApiOkResponse({ type: DeleteTransactionResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: TRANSACTION_MESSAGES.SWAGGER_TAG,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: TRANSACTION_MESSAGES.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: TRANSACTION_MESSAGES.PRE_RECONCILIATION_DELETE,
  })
  delete(
    @Param('cardId') cardId: string,
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.transactionsService.delete(cardId, id, request.user.id);
  }
}
