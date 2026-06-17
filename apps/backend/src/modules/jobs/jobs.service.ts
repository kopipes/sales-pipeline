import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere, ScopedUser } from '../../common/utils/scope.util';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  private withPnl<T extends { salesAmount: number; cogsAmount: number }>(job: T) {
    const operatingProfit = job.salesAmount - job.cogsAmount;
    // null-safe operating profit % (PRD 7.5 - corrects #DIV/0! in old file)
    const operatingProfitPct =
      job.salesAmount > 0
        ? Math.round((operatingProfit / job.salesAmount) * 10000) / 100
        : 0;
    return { ...job, operatingProfit, operatingProfitPct };
  }

  async findAll(
    user: ScopedUser,
    filters: { periodYear?: string; periodMonth?: string; companyId?: string } = {},
  ) {
    const where: any = { ...buildScopeWhere(user, 'picId') };

    if (filters.periodYear) where.periodYear = parseInt(filters.periodYear, 10);
    if (filters.periodMonth) where.periodMonth = parseInt(filters.periodMonth, 10);
    if (filters.companyId) where.companyId = filters.companyId;

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        jobCategory: { select: { id: true, name: true } },
        division: { select: { id: true, name: true, code: true, colorTag: true } },
        pic: { select: { id: true, fullName: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    return jobs.map((j) => this.withPnl(j));
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        jobCategory: true,
        division: { select: { id: true, name: true } },
        pic: { select: { id: true, fullName: true } },
        deal: { select: { id: true, dealName: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.withPnl(job);
  }

  async create(user: ScopedUser, data: any) {
    const job = await this.prisma.job.create({
      data: {
        dealId: data.dealId ?? null,
        companyId: data.companyId,
        divisionId: data.divisionId ?? user.divisionId,
        jobTitle: data.jobTitle,
        jobCategoryId: data.jobCategoryId,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        salesAmount: data.salesAmount ?? 0,
        cogsAmount: data.cogsAmount ?? 0,
        billingType: data.billingType ?? 'Direct',
        jobStatus: data.jobStatus ?? 'Planning',
        picId: data.picId ?? user.id,
        notes: data.notes ?? null,
      },
    });

    return this.withPnl(job);
  }

  async update(id: string, data: any) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const updated = await this.prisma.job.update({ where: { id }, data });
    return this.withPnl(updated);
  }

  async remove(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.job.delete({ where: { id } });
  }

  /**
   * P&L summary aggregation (PRD 8.11) - replaces manual Total/1Q-4Q/FY rows.
   * Returns monthly breakdown plus yearly totals for the given year.
   */
  async summary(user: ScopedUser, periodYear?: string) {
    const year = periodYear ? parseInt(periodYear, 10) : new Date().getFullYear();
    const where: any = { ...buildScopeWhere(user, 'picId'), periodYear: year };

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        jobCategory: { select: { name: true } },
        division: { select: { id: true, name: true, code: true } },
      },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      salesAmount: 0,
      cogsAmount: 0,
      operatingProfit: 0,
      jobCount: 0,
    }));

    const byCategory: Record<string, any> = {};
    const byDivision: Record<string, any> = {};
    let totalSales = 0;
    let totalCogs = 0;

    for (const job of jobs) {
      const op = job.salesAmount - job.cogsAmount;
      totalSales += job.salesAmount;
      totalCogs += job.cogsAmount;

      const m = monthly[job.periodMonth - 1];
      if (m) {
        m.salesAmount += job.salesAmount;
        m.cogsAmount += job.cogsAmount;
        m.operatingProfit += op;
        m.jobCount += 1;
      }

      const catName = job.jobCategory?.name ?? 'Uncategorized';
      byCategory[catName] = byCategory[catName] ?? {
        name: catName,
        salesAmount: 0,
        cogsAmount: 0,
        operatingProfit: 0,
      };
      byCategory[catName].salesAmount += job.salesAmount;
      byCategory[catName].cogsAmount += job.cogsAmount;
      byCategory[catName].operatingProfit += op;

      const divName = job.division?.name ?? 'Unknown';
      byDivision[divName] = byDivision[divName] ?? {
        name: divName,
        salesAmount: 0,
        cogsAmount: 0,
        operatingProfit: 0,
      };
      byDivision[divName].salesAmount += job.salesAmount;
      byDivision[divName].cogsAmount += job.cogsAmount;
      byDivision[divName].operatingProfit += op;
    }

    const totalProfit = totalSales - totalCogs;

    // Quarterly aggregation
    const quarters = [1, 2, 3, 4].map((q) => {
      const months = monthly.slice((q - 1) * 3, q * 3);
      const sales = months.reduce((s, m) => s + m.salesAmount, 0);
      const cogs = months.reduce((s, m) => s + m.cogsAmount, 0);
      return {
        quarter: q,
        salesAmount: sales,
        cogsAmount: cogs,
        operatingProfit: sales - cogs,
      };
    });

    return {
      year,
      monthly,
      quarters,
      byCategory: Object.values(byCategory),
      byDivision: Object.values(byDivision),
      totals: {
        salesAmount: totalSales,
        cogsAmount: totalCogs,
        operatingProfit: totalProfit,
        operatingProfitPct:
          totalSales > 0 ? Math.round((totalProfit / totalSales) * 10000) / 100 : 0,
        jobCount: jobs.length,
      },
    };
  }
}
