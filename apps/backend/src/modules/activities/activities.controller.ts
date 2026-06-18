import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @RequirePermissions({ resource: 'activities', action: 'read' })
  async findAll(
    @CurrentUser() user: any,
    @Query('companyId') companyId?: string,
    @Query('dealId') dealId?: string,
    @Query('search') search?: string,
    @Query('medium') medium?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activitiesService.findAll(user, { companyId, dealId, search, medium, dateFrom, dateTo });
  }

  @Get(':id')
  @RequirePermissions({ resource: 'activities', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'activities', action: 'create' })
  async create(@CurrentUser() user: any, @Body() data: CreateActivityDto) {
    return this.activitiesService.create(user, data);
  }

  @Post(':id/promote-to-deal')
  @RequirePermissions({ resource: 'deals', action: 'create' })
  async promoteToDeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.activitiesService.promoteToDeal(user, id, data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'activities', action: 'update' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    return this.activitiesService.update(user, id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'activities', action: 'delete' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.activitiesService.remove(user, id);
  }
}
