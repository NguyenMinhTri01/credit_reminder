import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  googleAuth: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
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
});
