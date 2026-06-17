import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async overview(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.overview(user, { startDate, endDate, divisionId });
  }

  @Get('kpis')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async kpis(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.kpis(user, { startDate, endDate, divisionId });
  }

  @Get('funnel')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async funnel(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.funnel(user, { startDate, endDate, divisionId });
  }

  @Get('pipeline-by-division')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async pipelineByDivision(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.pipelineByDivision(user, { startDate, endDate, divisionId });
  }

  @Get('win-loss')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async winLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.winLoss(user, { startDate, endDate, divisionId });
  }

  @Get('recent-activities')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async recentActivities(
    @CurrentUser() user: any,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.recentActivities(user, { divisionId });
  }
}
