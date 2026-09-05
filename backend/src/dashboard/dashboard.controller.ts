import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IAuthenticatedUser, IDashboardSnapshot } from '@/shared';
import { DashboardSnapshotDto } from './dto/dashboard-response.dto';
import { DashboardService } from './dashboard.service';

interface AuthenticatedRequest extends Request {
  user: IAuthenticatedUser;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user dashboard snapshot' })
  @ApiOkResponse({ type: DashboardSnapshotDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getDashboard(@Req() request: AuthenticatedRequest): Promise<IDashboardSnapshot> {
    return this.dashboardService.getSnapshot(request.user.id);
  }
}
