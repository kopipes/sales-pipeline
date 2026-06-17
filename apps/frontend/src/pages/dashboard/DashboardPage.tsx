import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Activity, Award } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import Spinner from '../../components/ui/Spinner';
import { formatRupiahCompact, formatRupiah, timeAgo } from '../../utils/format';
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

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
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

  const { data: activities } = useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(),
  });

  if (kLoading || fLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  // Funnel data for bar chart (exclude Lost)
  const funnelBars = (funnel?.stages ?? []).filter((s) => !s.isLost);

  // Pie data for win/loss
  const winLossData = [
    { name: 'Won', value: winLoss?.won ?? 0, color: '#10B981' },
    { name: 'Lost', value: winLoss?.lost ?? 0, color: '#EF4444' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time sales pipeline overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Pipeline"
          value={formatRupiahCompact(kpis?.totalPipelineValue ?? 0)}
          sub={`${kpis?.activeDealCount ?? 0} deal aktif`}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          label="Weighted Pipeline"
          value={formatRupiahCompact(kpis?.weightedPipeline ?? 0)}
          sub="Estimasi × Probabilitas"
          icon={Target}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <KpiCard
          label="Won Revenue"
          value={formatRupiahCompact(kpis?.wonRevenue ?? 0)}
          sub={`${kpis?.wonDealCount ?? 0} deal won`}
          icon={Award}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Forecasted Revenue"
          value={formatRupiahCompact(kpis?.forecastedRevenue ?? 0)}
          sub="Won + Weighted aktif"
          icon={DollarSign}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Target Achievement"
          value={`${kpis?.targetAchievementPct ?? 0}%`}
          sub={kpis?.targetRevenue ? `Target: ${formatRupiahCompact(kpis.targetRevenue)}` : 'Belum ada target'}
          icon={TrendingUp}
          iconColor={kpis?.targetAchievementPct ?? 0 >= 100 ? 'text-emerald-600' : 'text-amber-600'}
          iconBg={kpis?.targetAchievementPct ?? 0 >= 100 ? 'bg-emerald-50' : 'bg-amber-50'}
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={funnelBars} layout="vertical" margin={{ left: 8, right: 32 }}>
                <XAxis type="number" tickFormatter={(v) => formatRupiahCompact(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), 'Value']}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelBars.map((entry) => (
                    <Cell key={entry.stageId} fill={STAGE_COLORS[entry.name] ?? '#94A3B8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Belum ada deal
            </div>
          )}
          {/* Stage stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {funnelBars.map((s) => (
              <div key={s.stageId} className="text-center">
                <div className="text-sm font-semibold text-gray-800">{s.count}</div>
                <div className="text-xs text-gray-400">{s.name}</div>
                {s.conversionRate != null && (
                  <div className="text-xs text-blue-600">{s.conversionRate}%</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            Overall conversion: <span className="font-medium text-gray-600">{funnel?.overallConversionRate ?? 0}%</span>
          </div>
        </div>

        {/* Pipeline by Division */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline by Divisi</h2>
          {(pipelineByDiv?.length ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pipelineByDiv}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {pipelineByDiv!.map((entry) => (
                      <Cell key={entry.divisionId} fill={entry.colorTag ?? '#94A3B8'} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {pipelineByDiv!.map((d) => (
                  <div key={d.divisionId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: d.colorTag ?? '#94A3B8' }}
                      />
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
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Belum ada data
            </div>
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
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Belum ada data
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Aktivitas Terbaru</h2>
            <Activity size={15} className="text-gray-400" />
          </div>
          {(activities?.length ?? 0) > 0 ? (
            <ul className="divide-y divide-gray-100">
              {activities!.map((act) => (
                <li key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-500">
                    {act.salesRep?.fullName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{act.objective}</p>
                    <p className="text-xs text-gray-400">
                      {act.company?.name} · {act.salesRep?.fullName} · {act.medium}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(act.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Belum ada aktivitas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
