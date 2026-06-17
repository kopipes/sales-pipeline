import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../../common/utils/scope.util';
import { DashboardService } from './dashboard.service';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private dashboard: DashboardService,
  ) {}

  private rupiah(n: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  }

  /**
   * Export deals list as Excel buffer.
   */
  async exportDeals(
    user: ScopedUser,
    filters: { stageId?: string; dealTypeId?: string; search?: string } = {},
  ): Promise<Buffer> {
    const { buildScopeWhere } = await import('../../common/utils/scope.util');
    const where: any = { ...buildScopeWhere(user, 'salesRepId') };
    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.dealTypeId) where.dealTypeId = filters.dealTypeId;
    if (filters.search) where.dealName = { contains: filters.search };

    const deals = await this.prisma.deal.findMany({
      where,
      include: {
        company: { select: { name: true } },
        stage: { select: { name: true } },
        dealType: { select: { name: true } },
        division: { select: { name: true } },
        salesRep: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const rows = deals.map((d) => ({
      'Nama Deal': d.dealName,
      'Company': d.company?.name ?? '',
      'Divisi': d.division?.name ?? '',
      'Sales Rep': d.salesRep?.fullName ?? '',
      'Deal Type': d.dealType?.name ?? '',
      'Stage': d.stage?.name ?? '',
      'Est. Value (Rp)': Number(d.estimatedValue),
      'Probabilitas (%)': d.probabilityPct,
      'Weighted Value (Rp)': Math.round((Number(d.estimatedValue) * d.probabilityPct) / 100),
      'Expected Closing': d.expectedClosingDate ? new Date(d.expectedClosingDate).toLocaleDateString('id-ID') : '',
      'Actual Closing': d.actualClosingDate ? new Date(d.actualClosingDate).toLocaleDateString('id-ID') : '',
      'IP Asset': d.ipAssetName ?? '',
      'Billing Type': d.billingType ?? '',
      'Dibuat': new Date(d.createdAt).toLocaleDateString('id-ID'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deals');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  /**
   * Export jobs / P&L as Excel buffer.
   */
  async exportJobs(
    user: ScopedUser,
    filters: { periodYear?: string } = {},
  ): Promise<Buffer> {
    const { buildScopeWhere } = await import('../../common/utils/scope.util');
    const where: any = { ...buildScopeWhere(user, 'picId') };
    if (filters.periodYear) where.periodYear = parseInt(filters.periodYear, 10);

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        company: { select: { name: true } },
        division: { select: { name: true } },
        jobCategory: { select: { name: true } },
        pic: { select: { fullName: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    const rows = jobs.map((j) => {
      const sales = Number(j.salesAmount);
      const cogs = Number(j.cogsAmount);
      const op = sales - cogs;
      const opPct = sales > 0 ? Math.round((op / sales) * 10000) / 100 : 0;
      return {
        'Bulan': j.periodMonth,
        'Tahun': j.periodYear,
        'Job Title': j.jobTitle,
        'Client': j.company?.name ?? '',
        'Divisi': j.division?.name ?? '',
        'Kategori': j.jobCategory?.name ?? '',
        'Billing Type': j.billingType,
        'PIC': j.pic?.fullName ?? '',
        'Status': j.jobStatus,
        'Sales Amount (Rp)': sales,
        'COGS (Rp)': cogs,
        'Operating Profit (Rp)': op,
        'OP Margin (%)': opPct,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs P&L');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  /**
   * Export dashboard KPI summary + funnel as Excel.
   */
  async exportDashboard(
    user: ScopedUser,
    filters: { startDate?: string; endDate?: string; divisionId?: string } = {},
  ): Promise<Buffer> {
    const [kpis, funnel] = await Promise.all([
      this.dashboard.kpis(user, filters),
      this.dashboard.funnel(user, filters),
    ]);

    const kpiRows = [
      { Metrik: 'Total Pipeline Value', Nilai: kpis.totalPipelineValue },
      { Metrik: 'Weighted Pipeline', Nilai: kpis.weightedPipeline },
      { Metrik: 'Won Revenue', Nilai: kpis.wonRevenue },
      { Metrik: 'Target Revenue', Nilai: kpis.targetRevenue },
      { Metrik: 'Target Achievement (%)', Nilai: kpis.targetAchievementPct },
      { Metrik: 'Forecasted Revenue', Nilai: kpis.forecastedRevenue },
      { Metrik: 'Deals at Risk (count)', Nilai: kpis.dealsAtRisk.count },
      { Metrik: 'Deals at Risk (value)', Nilai: kpis.dealsAtRisk.value },
    ];

    const funnelRows = funnel.stages.map((s: any) => ({
      Stage: s.name,
      'Jumlah Deal': s.count,
      'Total Value (Rp)': s.value,
      'Conversion Rate (%)': s.conversionRate ?? '',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'KPIs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(funnelRows), 'Funnel');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
