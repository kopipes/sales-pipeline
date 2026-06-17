import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DivisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.division.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            deals: true,
            jobs: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            deals: true,
            jobs: true,
          },
        },
      },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return division;
  }

  async create(data: any) {
    return this.prisma.division.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const division = await this.prisma.division.findUnique({ where: { id } });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return this.prisma.division.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const division = await this.prisma.division.findUnique({ where: { id } });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    // Soft delete
    return this.prisma.division.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
