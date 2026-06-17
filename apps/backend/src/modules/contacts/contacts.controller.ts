import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @RequirePermissions({ resource: 'contacts', action: 'read' })
  async findAll(
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.contactsService.findAll(search, companyId);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'contacts', action: 'read' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ resource: 'contacts', action: 'create' })
  async create(@Body() data: any) {
    return this.contactsService.create(data);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'contacts', action: 'update' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.contactsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'contacts', action: 'delete' })
  async remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
