import { PrismaService } from '@/prisma/prisma.service';
import { AUTH_MESSAGES, BCRYPT_SALT_ROUNDS, RESET_TOKEN_EXPIRY_HOURS } from '@/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async register(dto: RegisterDto): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
      },
    });

    const tokens = await this.generateTokens({ sub: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens({ sub: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async googleAuth(
    dto: GoogleAuthDto,
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    const googleUser = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.sub },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            fullName: googleUser.name ?? null,
            googleId: googleUser.sub,
          },
        });
      }
    }

    const tokens = await this.generateTokens({ sub: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS };
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link containing resetToken

    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_RESET_TOKEN);
    }

    const passwordHash = await hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS };
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload },
        {
          secret,
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { ...payload },
        {
          secret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyGoogleToken(
    idToken: string,
  ): Promise<{ sub: string; email: string; name?: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException(AUTH_MESSAGES.GOOGLE_INVALID_TOKEN);
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.GOOGLE_AUTH_FAILED);
    }
  }

  private sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
    const { passwordHash, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}
