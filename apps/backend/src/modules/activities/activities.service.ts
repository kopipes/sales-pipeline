import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere, ScopedUser } from '../../common/utils/scope.util';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    user: ScopedUser,
    filters: { companyId?: string; dealId?: string; search?: string; medium?: string; dateFrom?: string; dateTo?: string } = {},
  ) {
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.dealId) where.dealId = filters.dealId;
    if (filters.medium) where.medium = filters.medium;
    if (filters.dateFrom || filters.dateTo) {
      where.activityDate = {};
      if (filters.dateFrom) where.activityDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.activityDate.lte = to;
      }
    }
    if (filters.search) {
      where.OR = [
        { objective: { contains: filters.search } },
        { company: { name: { contains: filters.search } } },
        { resultNotes: { contains: filters.search } },
      ];
    }

    return this.prisma.activity.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, fullName: true } },
        salesRep: { select: { id: true, fullName: true } },
        division: { select: { id: true, name: true, code: true } },
      },
      orderBy: { activityDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, fullName: true } },
        salesRep: { select: { id: true, fullName: true } },
        division: { select: { id: true, name: true } },
        deal: { select: { id: true, dealName: true } },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async create(user: ScopedUser, data: any) {
    // Default the sales rep and division to the current user when not provided
    return this.prisma.activity.create({
      data: {
        ...data,
        salesRepId: data.salesRepId ?? user.id,
        divisionId: data.divisionId ?? user.divisionId,
        activityDate: data.activityDate ? new Date(data.activityDate) : new Date(),
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
      },
      include: {
        company: { select: { id: true, name: true } },
        salesRep: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(user: ScopedUser, id: string, data: any) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Admin (scopeLevel = all) can edit any activity; others can only edit their own
    if (user.scopeLevel !== 'all' && activity.salesRepId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengedit aktivitas ini');
    }

    const payload: any = { ...data };
    if (data.activityDate) payload.activityDate = new Date(data.activityDate);
    if (data.nextActionDate) payload.nextActionDate = new Date(data.nextActionDate);
    // Prevent escalation: never let caller override salesRepId unless admin
    if (user.scopeLevel !== 'all') delete payload.salesRepId;

    return this.prisma.activity.update({ where: { id }, data: payload });
  }

  async remove(user: ScopedUser, id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Admin (scopeLevel = all) can delete any activity; others can only delete their own
    if (user.scopeLevel !== 'all' && activity.salesRepId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus aktivitas ini');
    }

    return this.prisma.activity.delete({ where: { id } });
  }

  /**
   * Promote an activity into a new Deal (PRD 7.6 Flow A step 3).
   * Creates a Deal on the first pipeline stage and links the activity to it.
   */
  async promoteToDeal(user: ScopedUser, id: string, data: any) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const dealType = data.dealTypeId
      ? await this.prisma.dealType.findUnique({ where: { id: data.dealTypeId } })
      : await this.prisma.dealType.findFirst();

    if (!dealType) {
      throw new NotFoundException('No deal type available');
    }

    // Use requested stage or the first stage by sort order (Lead)
    const stage = data.stageId
      ? await this.prisma.pipelineStage.findUnique({ where: { id: data.stageId } })
      : await this.prisma.pipelineStage.findFirst({ orderBy: { sortOrder: 'asc' } });

    if (!stage) {
      throw new NotFoundException('No pipeline stage available');
    }

    const deal = await this.prisma.deal.create({
      data: {
        dealName: data.dealName ?? `${activity.objective} - Deal`,
        companyId: activity.companyId,
        divisionId: activity.divisionId,
        salesRepId: activity.salesRepId,
        dealTypeId: dealType.id,
        stageId: stage.id,
        estimatedValue: data.estimatedValue ?? 0,
        probabilityPct: data.probabilityPct ?? 0,
        ipAssetName: data.ipAssetName ?? null,
        jobCategoryId: data.jobCategoryId ?? null,
        billingType: data.billingType ?? null,
      },
    });

    // Record initial stage history
    await this.prisma.dealStageHistory.create({
      data: {
        dealId: deal.id,
        fromStageId: null,
        toStageId: stage.id,
        changedBy: user.id,
        note: 'Created from activity',
      },
    });

    // Link the activity to the new deal
    await this.prisma.activity.update({
      where: { id },
      data: { dealId: deal.id },
    });

    return deal;
  }
}
