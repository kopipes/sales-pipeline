import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Activity, Award, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import Spinner from '../../components/ui/Spinner';
import { formatRupiahCompact, formatRupiah, timeAgo, MONTHS } from '../../utils/format';
import clsx from 'clsx';

const STAGE_COLORS: Record<string, string> = {
  Lead: '#94A3B8',
  Qualified: '#60A5FA',
  Discovery: '#34D399',
  Proposal: '#FBBF24',
  Negotiation: '#F97316',
  Won: '#10B981',
  Lost: '#EF4444',
};

const SOURCE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

function KpiCard({
  label, value, sub, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50',
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconColor?: string; iconBg?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-xl', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [actPage, setActPage] = useState(0); // offset-based, 5 per page
  const [forecastYear, setForecastYear] = useState(String(new Date().getFullYear()));
  const [forecastMonth, setForecastMonth] = useState('');
  const ACT_LIMIT = 5;

  const { data: kpis, isLoading: kLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKpis(),
  });

  const { data: funnel, isLoading: fLoading } = useQuery({
    queryKey: ['dashboard', 'funnel'],
    queryFn: () => dashboardApi.getFunnel(),
  });

  const { data: pipelineByDiv } = useQuery({
    queryKey: ['dashboard', 'pipeline-by-division'],
    queryFn: () => dashboardApi.getPipelineByDivision(),
  });

  const { data: winLoss } = useQuery({
    queryKey: ['dashboard', 'win-loss'],
    queryFn: () => dashboardApi.getWinLoss(),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['dashboard', 'recent-activities', actPage],
    queryFn: () => dashboardApi.getRecentActivities({ limit: ACT_LIMIT, offset: actPage * ACT_LIMIT }),
  });

  const { data: leadSource } = useQuery({
    queryKey: ['dashboard', 'lead-source'],
    queryFn: () => dashboardApi.getLeadSource(),
  });

  const { data: forecast } = useQuery({
    queryKey: ['dashboard', 'revenue-forecast', forecastYear, forecastMonth],
    queryFn: () => dashboardApi.getRevenueForecast({ year: forecastYear, month: forecastMonth || undefined }),
  });

  if (kLoading || fLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  const funnelBars = (funnel?.stages ?? []).filter((s) => !s.isLost);
  const winLossData = [
    { name: 'Won', value: winLoss?.won ?? 0, color: '#10B981' },
    { name: 'Lost', value: winLoss?.lost ?? 0, color: '#EF4444' },
  ];

  const actTotal = activitiesData?.total ?? 0;
  const actTotalPages = Math.ceil(actTotal / ACT_LIMIT);
  const activities = activitiesData?.items ?? [];

  const forecastData = (forecast?.monthly ?? []).map((m) => ({
    ...m,
    monthName: MONTHS[m.month] ?? String(m.month),
  }));

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time sales pipeline overview</p>
        </div>
        <a href="/api/dashboard/export/dashboard" className="btn-secondary" download aria-label="Export dashboard ke Excel">
          <Download size={14} /> Export Excel
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Pipeline"
          value={formatRupiahCompact(kpis?.totalPipelineValue ?? 0)}
          sub={`${kpis?.activeDealCount ?? 0} deal aktif`}
          icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50"
        />
        <KpiCard
          label="Weighted Pipeline"
          value={formatRupiahCompact(kpis?.weightedPipeline ?? 0)}
          sub="Estimasi x Probabilitas"
          icon={Target} iconColor="text-purple-600" iconBg="bg-purple-50"
        />
        <KpiCard
          label="Won Revenue"
          value={formatRupiahCompact(kpis?.wonRevenue ?? 0)}
          sub={`${kpis?.wonDealCount ?? 0} deal won`}
          icon={Award} iconColor="text-emerald-600" iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Forecasted Revenue"
          value={formatRupiahCompact(kpis?.forecastedRevenue ?? 0)}
          sub="Won + Weighted aktif"
          icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-50"
        />
        <KpiCard
          label="Target Achievement"
          value={`${kpis?.targetAchievementPct ?? 0}%`}
          sub={kpis?.targetRevenue ? `Target: ${formatRupiahCompact(kpis.targetRevenue)}` : 'Belum ada target'}
          icon={TrendingUp}
          iconColor={(kpis?.targetAchievementPct ?? 0) >= 100 ? 'text-emerald-600' : 'text-amber-600'}
          iconBg={(kpis?.targetAchievementPct ?? 0) >= 100 ? 'bg-emerald-50' : 'bg-amber-50'}
        />
        <KpiCard
          label="Deals at Risk"
          value={String(kpis?.dealsAtRisk?.count ?? 0)}
          sub={kpis?.dealsAtRisk?.count ? formatRupiahCompact(kpis.dealsAtRisk.value) : 'Semua deal sehat'}
          icon={AlertTriangle}
          iconColor={kpis?.dealsAtRisk?.count ? 'text-red-600' : 'text-gray-400'}
          iconBg={kpis?.dealsAtRisk?.count ? 'bg-red-50' : 'bg-gray-50'}
        />
      </div>

      {/* Funnel + Pipeline by Division */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Funnel chart */}
        <div className="card p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sales Funnel</h2>
          {funnelBars.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelBars} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <XAxis type="number" tickFormatter={(v) => formatRupiahCompact(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'value' ? formatRupiah(value) : value,
                      name === 'value' ? 'Total Value' : name,
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelBars.map((entry) => (
                      <Cell key={entry.stageId} fill={STAGE_COLORS[entry.name] ?? '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Stage detail table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">Stage</th>
                      <th className="pb-2 font-medium text-right">Deals</th>
                      <th className="pb-2 font-medium text-right">Value</th>
                      <th className="pb-2 font-medium text-right">Avg Value</th>
                      <th className="pb-2 font-medium text-right">Avg Hari</th>
                      <th className="pb-2 font-medium text-right">Konversi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {funnelBars.map((s) => (
                      <tr key={s.stageId}>
                        <td className="py-1.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[s.name] ?? '#94A3B8' }} />
                            {s.name}
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-gray-700 font-medium">{s.count}</td>
                        <td className="py-1.5 text-right text-gray-700">{formatRupiahCompact((s as any).value)}</td>
                        <td className="py-1.5 text-right text-gray-500">{formatRupiahCompact((s as any).avgValue ?? 0)}</td>
                        <td className="py-1.5 text-right">
                          <span className={clsx('font-medium', (s as any).avgDaysInStage > 14 ? 'text-red-500' : 'text-gray-600')}>
                            {(s as any).avgDaysInStage ?? 0}h
                          </span>
                        </td>
                        <td className="py-1.5 text-right">
                          {(s as any).conversionRate != null ? (
                            <span className="text-blue-600 font-medium">{(s as any).conversionRate}%</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-400 text-right">
                  Overall conversion: <span className="font-medium text-gray-600">{funnel?.overallConversionRate ?? 0}%</span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada deal</div>
          )}
        </div>

        {/* Pipeline by Division */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline by Divisi</h2>
          {(pipelineByDiv?.length ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pipelineByDiv} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {pipelineByDiv!.map((entry) => (
                      <Cell key={entry.divisionId} fill={entry.colorTag ?? '#94A3B8'} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {pipelineByDiv!.map((d) => (
                  <div key={d.divisionId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.colorTag ?? '#94A3B8' }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-800">{formatRupiahCompact(d.value)}</span>
                      <span className="text-xs text-gray-400 ml-1">({d.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Revenue Forecast + Lead Source */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Revenue Forecast */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Revenue Forecast</h2>
            <div className="flex items-center gap-2">
              <select
                className="input py-1 text-xs"
                value={forecastYear}
                onChange={(e) => setForecastYear(e.target.value)}
                aria-label="Filter tahun forecast"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              <select
                className="input py-1 text-xs"
                value={forecastMonth}
                onChange={(e) => setForecastMonth(e.target.value)}
                aria-label="Filter bulan forecast"
              >
                <option value="">Semua Bulan</option>
                {Object.entries(MONTHS).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={forecastData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatRupiahCompact(v)} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatRupiah(value),
                    name === 'estimatedValue' ? 'Estimasi' : 'Weighted',
                  ]}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend formatter={(v) => <span className="text-xs">{v === 'estimatedValue' ? 'Estimasi' : 'Weighted'}</span>} />
                <Line type="monotone" dataKey="estimatedValue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="weightedValue" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Tidak ada deal dengan expected closing date di periode ini
            </div>
          )}
          {forecastData.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
              {forecastData.map((m) => (
                <div key={m.month} className="text-center">
                  <p className="text-xs font-medium text-gray-700">{m.monthName}</p>
                  <p className="text-xs text-blue-600">{formatRupiahCompact(m.estimatedValue)}</p>
                  <p className="text-xs text-purple-500">{m.count} deal</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Source */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Lead Source</h2>
          {(leadSource?.length ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={leadSource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} label={({ source, percentage }) => `${source} ${percentage}%`} labelLine={false}>
                    {leadSource!.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {leadSource!.map((s, i) => (
                  <div key={s.source} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{s.source}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-800">{s.count} deals</span>
                      <span className="text-xs text-gray-400 ml-1">({s.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Win/Loss + Recent Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Win/Loss */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Win / Loss</h2>
          {(winLoss?.won ?? 0) + (winLoss?.lost ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={winLossData} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                    {winLossData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex justify-around text-center">
                <div>
                  <div className="text-xl font-bold text-emerald-600">{winLoss?.won}</div>
                  <div className="text-xs text-gray-400">Won</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">{winLoss?.lost}</div>
                  <div className="text-xs text-gray-400">Lost</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{winLoss?.winRate}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada data</div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Aktivitas Terbaru</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{actPage * ACT_LIMIT + 1}-{Math.min((actPage + 1) * ACT_LIMIT, actTotal)} dari {actTotal}</span>
              <button
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                onClick={() => setActPage((p) => p - 1)}
                disabled={actPage === 0}
                aria-label="Aktivitas sebelumnya"
              >
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              <button
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                onClick={() => setActPage((p) => p + 1)}
                disabled={actPage + 1 >= actTotalPages}
                aria-label="Aktivitas berikutnya"
              >
                <ChevronRight size={14} className="text-gray-500" />
              </button>
              <Activity size={15} className="text-gray-400" />
            </div>
          </div>
          {activities.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {activities.map((act) => (
                <li key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-500">
                    {act.salesRep?.fullName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{act.objective}</p>
                    <p className="text-xs text-gray-400">
                      {act.company?.name} &middot; {act.salesRep?.fullName} &middot; {act.medium}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(act.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada aktivitas</div>
          )}
        </div>
      </div>
    </div>
  );
}
