import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(scopeLevel: string, divisionId?: string) {
    const where: any = {};

    if (scopeLevel === 'division' && divisionId) {
      where.divisionId = divisionId;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        jobTitle: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        jobTitle: true,
        avatarUrl: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            scopeLevel: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      select: { id: true, name: true, scopeLevel: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash: hashedPassword,
        password: undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting status to inactive
    return this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
