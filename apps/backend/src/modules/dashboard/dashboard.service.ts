import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere, ScopedUser } from '../../common/utils/scope.util';

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private dealWhere(user: ScopedUser, filters: DashboardFilters) {
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };
    if (filters.divisionId) where.divisionId = filters.divisionId;
    return where;
  }

  private dateRange(filters: DashboardFilters) {
    const range: any = {};
    if (filters.startDate) range.gte = new Date(filters.startDate);
    if (filters.endDate) range.lte = new Date(filters.endDate);
    return Object.keys(range).length ? range : undefined;
  }

  /** PRD 8.2 - KPI cards */
  async kpis(user: ScopedUser, filters: DashboardFilters) {
    const baseWhere = this.dealWhere(user, filters);
    const closingRange = this.dateRange(filters);

    const deals = await this.prisma.deal.findMany({
      where: baseWhere,
      include: { stage: true },
    });

    const activeDeals = deals.filter((d) => !d.stage.isWon && !d.stage.isLost);
    const wonDeals = deals.filter((d) => {
      if (!d.stage.isWon) return false;
      if (closingRange && d.actualClosingDate) {
        const t = new Date(d.actualClosingDate).getTime();
        if (closingRange.gte && t < closingRange.gte.getTime()) return false;
        if (closingRange.lte && t > closingRange.lte.getTime()) return false;
      }
      return true;
    });

    const totalPipeline = activeDeals.reduce((s, d) => s + Number(d.estimatedValue), 0);
    const weightedPipeline = activeDeals.reduce(
      (s, d) => s + Math.round((Number(d.estimatedValue) * d.probabilityPct) / 100),
      0,
    );
    const wonRevenue = wonDeals.reduce((s, d) => s + Number(d.actualRevenue ?? d.estimatedValue), 0);

    // Target achievement (PRD 8.2)
    const year = filters.endDate
      ? new Date(filters.endDate).getFullYear()
      : new Date().getFullYear();
    const targetWhere: any = { periodYear: year };
    if (filters.divisionId) targetWhere.divisionId = filters.divisionId;
    const targets = await this.prisma.target.findMany({ where: targetWhere });
    const targetRevenue = targets.reduce((s, t) => s + Number(t.targetRevenue), 0);

    const forecastedRevenue = wonRevenue + weightedPipeline;

    // Deals at risk reuse logic
    const now = Date.now();
    const cutoff = 7 * 24 * 60 * 60 * 1000;
    const atRisk = activeDeals.filter((d) => {
      const stale = now - new Date(d.stageChangedAt).getTime() > cutoff;
      const overdue =
        d.expectedClosingDate && new Date(d.expectedClosingDate).getTime() < now;
      return stale || overdue;
    });

    return {
      totalPipelineValue: totalPipeline,
      weightedPipeline,
      wonRevenue,
      targetRevenue,
      targetAchievementPct:
        targetRevenue > 0 ? Math.round((wonRevenue / targetRevenue) * 10000) / 100 : 0,
      forecastedRevenue,
      dealsAtRisk: { count: atRisk.length, value: atRisk.reduce((s, d) => s + Number(d.estimatedValue), 0) },
      activeDealCount: activeDeals.length,
      wonDealCount: wonDeals.length,
    };
  }

  /** PRD 8.3 - Sales funnel overview with conversion rates, avg days, avg value */
  async funnel(user: ScopedUser, filters: DashboardFilters) {
    const baseWhere = this.dealWhere(user, filters);

    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const deals = await this.prisma.deal.findMany({
      where: baseWhere,
      include: { stageHistory: { orderBy: { changedAt: 'asc' } } },
    });

    const now = Date.now();

    const stageData = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stageId === stage.id);

      // Average days in current stage
      const daysInStage = stageDeals.map((d) => {
        const entry = d.stageHistory.find((h) => h.toStageId === stage.id);
        const from = entry ? new Date(entry.changedAt).getTime() : new Date(d.stageChangedAt).getTime();
        return Math.round((now - from) / (1000 * 60 * 60 * 24));
      });
      const avgDaysInStage =
        daysInStage.length > 0
          ? Math.round(daysInStage.reduce((a, b) => a + b, 0) / daysInStage.length)
          : 0;

      const totalValue = stageDeals.reduce((s, d) => s + Number(d.estimatedValue), 0);
      const avgValue = stageDeals.length > 0 ? Math.round(totalValue / stageDeals.length) : 0;

      return {
        stageId: stage.id,
        name: stage.name,
        sortOrder: stage.sortOrder,
        isWon: stage.isWon,
        isLost: stage.isLost,
        count: stageDeals.length,
        value: totalValue,
        avgValue,
        avgDaysInStage,
        conversionRate: null as number | null,
      };
    });

    // Conversion rate between consecutive non-lost stages
    const flow = stageData.filter((s) => !s.isLost);
    for (let i = 0; i < flow.length; i++) {
      const prev = flow[i - 1];
      flow[i].conversionRate =
        prev && prev.count > 0
          ? Math.round((flow[i].count / prev.count) * 10000) / 100
          : null;
    }

    const leadStage = stageData.find((s) => s.sortOrder === 1);
    const wonStage = stageData.find((s) => s.isWon);
    const overallConversion =
      leadStage && leadStage.count > 0 && wonStage
        ? Math.round((wonStage.count / leadStage.count) * 10000) / 100
        : 0;

    return { stages: stageData, overallConversionRate: overallConversion };
  }

  /** PRD 8.4 - Pipeline by business unit (donut) */
  async pipelineByDivision(user: ScopedUser, filters: DashboardFilters) {
    const baseWhere = this.dealWhere(user, filters);

    const deals = await this.prisma.deal.findMany({
      where: { ...baseWhere, stage: { isWon: false, isLost: false } },
      include: { division: { select: { id: true, name: true, colorTag: true } } },
    });

    const map: Record<string, any> = {};
    let total = 0;
    for (const d of deals) {
      const key = d.divisionId;
      map[key] = map[key] ?? {
        divisionId: key,
        name: d.division.name,
        colorTag: d.division.colorTag,
        value: 0,
      };
      map[key].value += Number(d.estimatedValue);
      total += Number(d.estimatedValue);
    }

    return Object.values(map).map((d: any) => ({
      ...d,
      percentage: total > 0 ? Math.round((d.value / total) * 10000) / 100 : 0,
    }));
  }

  /** PRD 8.8 - Win/Loss */
  async winLoss(user: ScopedUser, filters: DashboardFilters) {
    const baseWhere = this.dealWhere(user, filters);
    const deals = await this.prisma.deal.findMany({
      where: baseWhere,
      include: { stage: true },
    });

    const won = deals.filter((d) => d.stage.isWon).length;
    const lost = deals.filter((d) => d.stage.isLost).length;
    const total = won + lost;

    return {
      won,
      lost,
      winRate: total > 0 ? Math.round((won / total) * 10000) / 100 : 0,
    };
  }

  /** PRD 8.7 - Recent activities with pagination */
  async recentActivities(user: ScopedUser, filters: DashboardFilters & { limit?: number; offset?: number }) {
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };
    if (filters.divisionId) where.divisionId = filters.divisionId;

    const limit = filters.limit ?? 5;
    const offset = filters.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          company: { select: { name: true } },
          salesRep: { select: { fullName: true } },
        },
        orderBy: { activityDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /** Lead source analysis - breakdown by channelType of companies */
  async leadSource(user: ScopedUser, filters: DashboardFilters) {
    const baseWhere = this.dealWhere(user, filters);

    const deals = await this.prisma.deal.findMany({
      where: { ...baseWhere, stage: { isWon: false, isLost: false } },
      include: { company: { select: { channelType: true } } },
    });

    const map: Record<string, { source: string; count: number; value: number }> = {};
    let total = 0;
    for (const d of deals) {
      const source = d.company?.channelType || 'Unknown';
      map[source] = map[source] ?? { source, count: 0, value: 0 };
      map[source].count++;
      map[source].value += Number(d.estimatedValue);
      total++;
    }

    return Object.values(map)
      .map((s) => ({
        ...s,
        percentage: total > 0 ? Math.round((s.count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /** Revenue forecast grouped by expected closing month */
  async revenueForecast(user: ScopedUser, filters: DashboardFilters & { month?: string; year?: string }) {
    const baseWhere = this.dealWhere(user, filters);
    const yearNum = filters.year ? parseInt(filters.year, 10) : new Date().getFullYear();

    const deals = await this.prisma.deal.findMany({
      where: {
        ...baseWhere,
        stage: { isWon: false, isLost: false },
        expectedClosingDate: { not: null },
      },
      include: { stage: true },
    });

    // Group by month
    const monthly: Record<number, { month: number; count: number; estimatedValue: number; weightedValue: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthly[m] = { month: m, count: 0, estimatedValue: 0, weightedValue: 0 };
    }

    for (const d of deals) {
      const dt = new Date(d.expectedClosingDate!);
      if (dt.getFullYear() !== yearNum) continue;
      if (filters.month && dt.getMonth() + 1 !== parseInt(filters.month, 10)) continue;
      const m = dt.getMonth() + 1;
      monthly[m].count++;
      monthly[m].estimatedValue += Number(d.estimatedValue);
      monthly[m].weightedValue += Math.round((Number(d.estimatedValue) * d.probabilityPct) / 100);
    }

    return {
      year: yearNum,
      monthly: Object.values(monthly).filter((m) => m.count > 0 || !filters.month),
    };
  }

  /** Aggregate all dashboard data in one call */
  async overview(user: ScopedUser, filters: DashboardFilters) {
    const [kpis, funnel, pipelineByDivision, winLoss, recentActivities] =
      await Promise.all([
        this.kpis(user, filters),
        this.funnel(user, filters),
        this.pipelineByDivision(user, filters),
        this.winLoss(user, filters),
        this.recentActivities(user, filters),
      ]);

    return { kpis, funnel, pipelineByDivision, winLoss, recentActivities };
  }
}
