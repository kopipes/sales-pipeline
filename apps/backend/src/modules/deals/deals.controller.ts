import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDealDto } from './dto/create-deal.dto';

@Controller('deals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get()
  @RequirePermissions({ resource: 'deals', action: 'read' })
  async findAll(
    @CurrentUser() user: any,
    @Query('stageId') stageId?: string,
    @Query('dealTypeId') dealTypeId?: string,
    @Query('search') search?: string,
  ) {
    return this.dealsService.findAll(user, { stageId, dealTypeId, search });
  }

  @Get('at-risk')
  @RequirePermissions({ resource: 'deals', action: 'read' })
  async atRisk(@CurrentUser() user: any) {
    return this.dealsService.atRisk(user);
  }

  @Get('types')
  @RequirePermissions({ resource: 'deals', action: 'read' })
  async getDealTypes() {
    return this.dealsService.getDealTypes();
  }

  @Get('stages')
  @RequirePermissions({ resource: 'deals', action: 'read' })
  async getStages() {
    return this.dealsService.getStages();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'deals', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'deals', action: 'create' })
  async create(@CurrentUser() user: any, @Body() data: CreateDealDto) {
    return this.dealsService.create(user, data);
  }

  @Post(':id/change-stage')
  @RequirePermissions({ resource: 'deals', action: 'update' })
  async changeStage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { toStageId: string; note?: string },
  ) {
    return this.dealsService.changeStage(user, id, body.toStageId, body.note);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'deals', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.dealsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'deals', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
