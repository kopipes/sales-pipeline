import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions({ resource: 'companies', action: 'read' })
  async findAll(
    @Query('search') search?: string,
    @Query('industryId') industryId?: string,
  ) {
    return this.companiesService.findAll(search, industryId);
  }

  @Get('industries')
  @RequirePermissions({ resource: 'companies', action: 'read' })
  async getIndustries() {
    return this.companiesService.getIndustries();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'companies', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'companies', action: 'create' })
  async create(@Body() data: any) {
    return this.companiesService.create(data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'companies', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.companiesService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'companies', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
