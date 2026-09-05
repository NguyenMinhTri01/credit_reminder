import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  googleAuth: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register', async () => {
    const dto = { email: 'test@example.com', password: 'StrongP@ss1', fullName: 'Test' };
    mockAuthService.register.mockResolvedValue({ user: {}, tokens: {} });

    await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('should call login', async () => {
    const dto = { email: 'test@example.com', password: 'StrongP@ss1' };
    mockAuthService.login.mockResolvedValue({ user: {}, tokens: {} });

    await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should call googleAuth', async () => {
    const dto = { idToken: 'google-id-token' };
    mockAuthService.googleAuth.mockResolvedValue({ user: {}, tokens: {} });

    await controller.googleAuth(dto);
    expect(mockAuthService.googleAuth).toHaveBeenCalledWith(dto);
  });

  it('should call forgotPassword', async () => {
    const dto = { email: 'test@example.com' };
    mockAuthService.forgotPassword.mockResolvedValue({ message: 'ok' });

    await controller.forgotPassword(dto);
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('should call resetPassword', async () => {
    const dto = { token: 'token', newPassword: 'NewP@ss123' };
    mockAuthService.resetPassword.mockResolvedValue({ message: 'ok' });

    await controller.resetPassword(dto);
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
  });

  it('should call refreshToken', async () => {
    const dto = { refreshToken: 'my-refresh-token' };
    mockAuthService.refreshToken.mockResolvedValue({ accessToken: 'new', refreshToken: 'new-r' });

    await controller.refresh(dto);
    expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto.refreshToken);
  });

  it('should return req.user from getMe', async () => {
    const user = { id: '1', email: 'test@example.com', fullName: 'Test' };
    const req = { user } as never;

    const result = await controller.getMe(req);
    expect(result).toBe(user);
  });
});
