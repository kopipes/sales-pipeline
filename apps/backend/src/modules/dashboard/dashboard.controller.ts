import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { SearchService } from './search.service';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private searchService: SearchService,
    private exportService: ExportService,
  ) {}

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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.dashboardService.recentActivities(user, {
      divisionId,
      limit: limit ? parseInt(limit, 10) : 5,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('lead-source')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async leadSource(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.leadSource(user, { startDate, endDate, divisionId });
  }

  @Get('revenue-forecast')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async revenueForecast(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.dashboardService.revenueForecast(user, { year, month, divisionId });
  }

  @Get('search')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  async search(
    @CurrentUser() user: any,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.globalSearch(
      user,
      q ?? '',
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get('export/deals')
  @RequirePermissions({ resource: 'deals', action: 'export' })
  async exportDeals(
    @CurrentUser() user: any,
    @Query('stageId') stageId?: string,
    @Query('dealTypeId') dealTypeId?: string,
    @Query('search') search?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportService.exportDeals(user, { stageId, dealTypeId, search });
    const filename = `deals-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.end(buffer);
  }

  @Get('export/jobs')
  @RequirePermissions({ resource: 'jobs', action: 'export' })
  async exportJobs(
    @CurrentUser() user: any,
    @Query('periodYear') periodYear?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportService.exportJobs(user, { periodYear });
    const filename = `jobs-pnl-${periodYear ?? new Date().getFullYear()}.xlsx`;
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.end(buffer);
  }

  @Get('export/dashboard')
  @RequirePermissions({ resource: 'dashboard', action: 'export' })
  async exportDashboard(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('divisionId') divisionId?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.exportService.exportDashboard(user, { startDate, endDate, divisionId });
    const filename = `dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.end(buffer);
  }
}
