import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('divisions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DivisionsController {
  constructor(private divisionsService: DivisionsService) {}

  @Get()
  @RequirePermissions({ resource: 'divisions', action: 'read' })
  async findAll() {
    return this.divisionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'divisions', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.divisionsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'divisions', action: 'create' })
  async create(@Body() data: any) {
    return this.divisionsService.create(data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'divisions', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.divisionsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'divisions', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.divisionsService.remove(id);
  }
}
