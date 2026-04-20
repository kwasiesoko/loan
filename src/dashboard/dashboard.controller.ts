import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getMetrics(@Req() req: any) {
    if (req.user.role === 'ADMIN') {
        return this.dashboardService.getAdminDashboardMetrics();
    } else {
        return this.dashboardService.getOfficerDashboardMetrics(req.user.id);
    }
  }
}
