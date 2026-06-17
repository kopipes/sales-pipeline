import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions({ resource: 'users', action: 'read' })
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.scopeLevel, user.divisionId);
  }

  @Get('roles')
  @RequirePermissions({ resource: 'users', action: 'read' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'users', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'users', action: 'create' })
  async create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'users', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'users', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
