import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AUTH_MESSAGES, SWAGGER_DESCRIPTIONS } from '@/shared';

@ApiTags(SWAGGER_DESCRIPTIONS.AUTH_TAG)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: SWAGGER_DESCRIPTIONS.REGISTER })
  @ApiResponse({ status: HttpStatus.CREATED, description: AUTH_MESSAGES.REGISTER_SUCCESS })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: SWAGGER_DESCRIPTIONS.LOGIN })
  @ApiResponse({ status: HttpStatus.OK, description: AUTH_MESSAGES.LOGIN_SUCCESS })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: AUTH_MESSAGES.INVALID_CREDENTIALS })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: SWAGGER_DESCRIPTIONS.GOOGLE_LOGIN })
  @ApiResponse({ status: HttpStatus.OK, description: AUTH_MESSAGES.GOOGLE_LOGIN_SUCCESS })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: AUTH_MESSAGES.GOOGLE_AUTH_FAILED })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: SWAGGER_DESCRIPTIONS.FORGOT_PASSWORD })
  @ApiResponse({ status: HttpStatus.OK, description: AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: SWAGGER_DESCRIPTIONS.RESET_PASSWORD })
  @ApiResponse({ status: HttpStatus.OK, description: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: AUTH_MESSAGES.INVALID_RESET_TOKEN })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
