import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, companyId?: string) {
    const where: any = {};

    if (search) {
      where.fullName = { contains: search };
    }

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async create(data: any) {
    return this.prisma.contact.create({
      data,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: any) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.update({
      where: { id },
      data,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.contact.delete({ where: { id } });
  }
}
