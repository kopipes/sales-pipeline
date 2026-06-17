import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, industryId?: string) {
    const where: any = {};

    if (search) {
      // SQLite does not support mode: 'insensitive', use plain contains
      where.name = { contains: search };
    }

    if (industryId) {
      where.industryId = industryId;
    }

    return this.prisma.company.findMany({
      where,
      include: {
        industry: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        industry: true,
        contacts: true,
        deals: {
          include: {
            stage: true,
            salesRep: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        jobs: {
          include: {
            jobCategory: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async getIndustries() {
    return this.prisma.industry.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.company.create({
      data,
      include: {
        industry: true,
      },
    });
  }

  async update(id: string, data: any) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id },
      data,
      include: {
        industry: true,
      },
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.delete({
      where: { id },
    });
  }
}
