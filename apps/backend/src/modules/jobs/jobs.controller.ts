import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  @RequirePermissions({ resource: 'jobs', action: 'read' })
  async findAll(
    @CurrentUser() user: any,
    @Query('periodYear') periodYear?: string,
    @Query('periodMonth') periodMonth?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.jobsService.findAll(user, { periodYear, periodMonth, companyId });
  }

  @Get('summary')
  @RequirePermissions({ resource: 'jobs', action: 'read' })
  async summary(@CurrentUser() user: any, @Query('periodYear') periodYear?: string) {
    return this.jobsService.summary(user, periodYear);
  }

  @Get('categories')
  @RequirePermissions({ resource: 'jobs', action: 'read' })
  async getCategories() {
    return this.jobsService.getCategories();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'jobs', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'jobs', action: 'create' })
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.jobsService.create(user, data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'jobs', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.jobsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'jobs', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
