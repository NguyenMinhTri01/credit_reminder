import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

describe('Module instantiation', () => {
  it('AppModule should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('AuthModule should be defined', () => {
    expect(AuthModule).toBeDefined();
  });

  it('HealthModule should be defined', () => {
    expect(HealthModule).toBeDefined();
  });

  it('PrismaModule should be defined', () => {
    expect(PrismaModule).toBeDefined();
  });
});
