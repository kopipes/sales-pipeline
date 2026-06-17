import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere, ScopedUser } from '../../common/utils/scope.util';

const RISK_DAYS = 7; // PRD 7.7: deal stuck > N days (default 7) without follow-up

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  private withWeighted<T extends { estimatedValue: number; probabilityPct: number }>(
    deal: T,
  ): T & { weightedValue: number } {
    return {
      ...deal,
      weightedValue: Math.round((deal.estimatedValue * deal.probabilityPct) / 100),
    };
  }

  async findAll(
    user: ScopedUser,
    filters: { stageId?: string; dealTypeId?: string; search?: string } = {},
  ) {
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };

    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.dealTypeId) where.dealTypeId = filters.dealTypeId;
    if (filters.search) where.dealName = { contains: filters.search };

    const deals = await this.prisma.deal.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        stage: true,
        dealType: { select: { id: true, name: true } },
        division: { select: { id: true, name: true, code: true, colorTag: true } },
        salesRep: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return deals.map((d) => this.withWeighted(d));
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        stage: true,
        dealType: true,
        division: { select: { id: true, name: true, code: true } },
        salesRep: { select: { id: true, fullName: true } },
        activities: { orderBy: { activityDate: 'desc' } },
        stageHistory: {
          include: {
            fromStage: { select: { name: true } },
            toStage: { select: { name: true } },
            user: { select: { fullName: true } },
          },
          orderBy: { changedAt: 'desc' },
        },
        jobs: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.withWeighted(deal);
  }

  async create(user: ScopedUser, data: any) {
    const stage = data.stageId
      ? await this.prisma.pipelineStage.findUnique({ where: { id: data.stageId } })
      : await this.prisma.pipelineStage.findFirst({ orderBy: { sortOrder: 'asc' } });

    if (!stage) {
      throw new BadRequestException('No pipeline stage available');
    }

    const deal = await this.prisma.deal.create({
      data: {
        dealName: data.dealName,
        companyId: data.companyId,
        divisionId: data.divisionId ?? user.divisionId,
        salesRepId: data.salesRepId ?? user.id,
        dealTypeId: data.dealTypeId,
        stageId: stage.id,
        estimatedValue: data.estimatedValue ?? 0,
        probabilityPct: data.probabilityPct ?? 0,
        expectedClosingDate: data.expectedClosingDate
          ? new Date(data.expectedClosingDate)
          : null,
        remarks: data.remarks ?? null,
        ipAssetName: data.ipAssetName ?? null,
        royaltyPct: data.royaltyPct ?? null,
        minimumGuarantee: data.minimumGuarantee ?? null,
        jobCategoryId: data.jobCategoryId ?? null,
        billingType: data.billingType ?? null,
      },
    });

    await this.prisma.dealStageHistory.create({
      data: {
        dealId: deal.id,
        fromStageId: null,
        toStageId: stage.id,
        changedBy: user.id,
        note: 'Deal created',
      },
    });

    return this.withWeighted(deal);
  }

  async update(id: string, data: any) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const payload: any = { ...data };
    // Stage changes go through changeStage() to keep history + approval rules
    delete payload.stageId;
    if (data.expectedClosingDate) payload.expectedClosingDate = new Date(data.expectedClosingDate);

    const updated = await this.prisma.deal.update({ where: { id }, data: payload });
    return this.withWeighted(updated);
  }

  /**
   * Move a deal to a new stage (PRD 7.7).
   * - Won/Lost requires Manager/Admin approval (scopeLevel division/all).
   * - Won auto-creates a Job execution record.
   */
  async changeStage(user: ScopedUser, id: string, toStageId: string, note?: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const toStage = await this.prisma.pipelineStage.findUnique({ where: { id: toStageId } });

    if (!toStage) {
      throw new BadRequestException('Target stage not found');
    }

    // Approval rule: only Manager (division) or Admin/Corporate (all) may set Won/Lost
    const canApprove = user.scopeLevel === 'all' || user.scopeLevel === 'division';
    if ((toStage.isWon || toStage.isLost) && !canApprove) {
      throw new ForbiddenException(
        'Moving a deal to Won/Lost requires Manager approval',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          stageId: toStageId,
          stageChangedAt: new Date(),
          actualClosingDate: toStage.isWon || toStage.isLost ? new Date() : deal.actualClosingDate,
        },
      });

      await tx.dealStageHistory.create({
        data: {
          dealId: id,
          fromStageId: deal.stageId,
          toStageId,
          changedBy: user.id,
          note: note ?? `Stage changed to ${toStage.name}`,
        },
      });

      // Auto-create a Job when the deal is Won (PRD 7.5)
      let job: any = null;
      if (toStage.isWon) {
        const existingJob = await tx.job.findFirst({ where: { dealId: id } });
        if (!existingJob) {
          const now = new Date();
          job = await tx.job.create({
            data: {
              dealId: id,
              companyId: deal.companyId,
              divisionId: deal.divisionId,
              jobTitle: deal.dealName,
              jobCategoryId:
                deal.jobCategoryId ??
                (await tx.jobCategory.findFirst())?.id ??
                '',
              periodMonth: now.getMonth() + 1,
              periodYear: now.getFullYear(),
              salesAmount: deal.estimatedValue,
              cogsAmount: 0,
              billingType: deal.billingType ?? 'Direct',
              jobStatus: 'Planning',
              picId: deal.salesRepId,
            },
          });
        }
      }

      return { deal: updated, job };
    });

    return { ...this.withWeighted(result.deal), createdJob: result.job };
  }

  async remove(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.deal.delete({ where: { id } });
  }

  /**
   * Deals at risk (PRD 7.7):
   * (a) no activity/update in N days, or
   * (b) expected closing date passed but not Won/Lost.
   */
  async atRisk(user: ScopedUser) {
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };

    const deals = await this.prisma.deal.findMany({
      where: {
        ...where,
        stage: { isWon: false, isLost: false },
      },
      include: {
        company: { select: { id: true, name: true } },
        stage: { select: { name: true } },
        salesRep: { select: { id: true, fullName: true } },
      },
    });

    const now = Date.now();
    const cutoff = RISK_DAYS * 24 * 60 * 60 * 1000;

    const atRisk = deals
      .map((d) => {
        const reasons: string[] = [];
        const stale = now - new Date(d.stageChangedAt).getTime();
        if (stale > cutoff) {
          reasons.push(
            `${Math.floor(stale / (24 * 60 * 60 * 1000))} hari tanpa perubahan`,
          );
        }
        if (d.expectedClosingDate && new Date(d.expectedClosingDate).getTime() < now) {
          reasons.push('Melewati expected closing date');
        }
        return { deal: d, reasons };
      })
      .filter((x) => x.reasons.length > 0)
      .map((x) => ({
        id: x.deal.id,
        dealName: x.deal.dealName,
        company: x.deal.company,
        stage: x.deal.stage.name,
        salesRep: x.deal.salesRep,
        estimatedValue: x.deal.estimatedValue,
        reasons: x.reasons,
      }));

    return {
      count: atRisk.length,
      totalValue: atRisk.reduce((s, d) => s + d.estimatedValue, 0),
      deals: atRisk,
    };
  }
}
