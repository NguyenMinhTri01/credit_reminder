import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DashboardController } from './dashboard.controller';
import { DashboardModule } from './dashboard.module';
import { DashboardService } from './dashboard.service';
import { DashboardSnapshotDto } from './dto/dashboard-response.dto';

describe('DashboardModule', () => {
  it('registers the dashboard controller and service', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, DashboardModule)).toContain(
      DashboardController,
    );
    expect(Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DashboardModule)).toContain(
      DashboardService,
    );
  });

  it('generates a Swagger response schema for the endpoint', async () => {
    expect(DashboardSnapshotDto).toBeDefined();
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: { getSnapshot: jest.fn() } }],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());

    expect(document.paths['/dashboard']?.get?.responses?.['200']).toBeDefined();
    expect(document.components?.schemas?.DashboardSnapshotDto).toBeDefined();
    expect(document.components?.schemas?.DashboardCardDto).toEqual(
      expect.objectContaining({
        required: expect.arrayContaining(['creditLimit', 'nextDueDate']),
      }),
    );
    await app.close();
  });
});
