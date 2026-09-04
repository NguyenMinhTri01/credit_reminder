// Mocks must be declared before importing main.ts so jest can hoist them.
const mockApp = {
  get: jest.fn().mockReturnValue({
    get: jest.fn((key: string, fallback?: unknown) => fallback ?? 'value'),
  }),
  useGlobalPipes: jest.fn(),
  enableCors: jest.fn(),
  setGlobalPrefix: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue(mockApp),
  },
}));

jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');
  return {
    ...actual,
    DocumentBuilder: class {
      setTitle = jest.fn().mockReturnThis();
      setDescription = jest.fn().mockReturnThis();
      setVersion = jest.fn().mockReturnThis();
      addBearerAuth = jest.fn().mockReturnThis();
      build = jest.fn().mockReturnValue({});
    },
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

// Suppress console.log from bootstrap during test.
jest.spyOn(console, 'log').mockImplementation(() => undefined);

// Importing main.ts triggers bootstrap() automatically.
import './main';

describe('main.ts bootstrap', () => {
  it('should bootstrap the application without errors', async () => {
    // Allow the async bootstrap to flush.
    await new Promise((resolve) => setImmediate(resolve));

    const { NestFactory } = await import('@nestjs/core');
    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.listen).toHaveBeenCalled();
  });
});
