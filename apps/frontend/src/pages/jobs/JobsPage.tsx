import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { formatRupiahCompact, formatRupiah, MONTHS } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import JobForm from './JobForm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import clsx from 'clsx';

const STATUS_BADGE: Record<string, string> = {
  Planning: 'bg-blue-100 text-blue-700',
  Ongoing: 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function JobsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const year = String(new Date().getFullYear());

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.getAll({ periodYear: year }),
  });

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['jobs', 'summary', year],
    queryFn: () => jobsApi.getSummary(year),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const monthlyChart = (summary?.monthly ?? []).filter((m: any) => m.salesAmount > 0 || m.cogsAmount > 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jobs & P&L</h1>
          <p className="text-sm text-gray-500">{jobs?.length ?? 0} job di {year}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Job
        </button>
      </div>

      {/* P&L Summary cards */}
      {!sumLoading && summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total Sales" value={formatRupiahCompact(summary.totals.salesAmount)} sub={`${summary.totals.jobCount} job`} />
          <SummaryCard label="Total COGS" value={formatRupiahCompact(summary.totals.cogsAmount)} variant="warn" />
          <SummaryCard
            label="Operating Profit"
            value={formatRupiahCompact(summary.totals.operatingProfit)}
            variant={summary.totals.operatingProfit >= 0 ? 'good' : 'bad'}
          />
          <SummaryCard
            label="OP Margin"
            value={`${summary.totals.operatingProfitPct}%`}
            variant={summary.totals.operatingProfitPct >= 20 ? 'good' : summary.totals.operatingProfitPct >= 0 ? 'warn' : 'bad'}
          />
        </div>
      )}

      {/* Monthly chart */}
      {monthlyChart.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sales & COGS per Bulan ({year})</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart} margin={{ left: 8, right: 8 }}>
              <XAxis dataKey="month" tickFormatter={(m) => MONTHS[m]} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatRupiahCompact(v)} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatRupiah(value),
                  name === 'salesAmount' ? 'Sales' : name === 'cogsAmount' ? 'COGS' : 'Op. Profit',
                ]}
                labelFormatter={(m) => MONTHS[m] ?? m}
              />
              <Bar dataKey="salesAmount" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Sales" />
              <Bar dataKey="cogsAmount" fill="#F97316" radius={[3, 3, 0, 0]} name="COGS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showForm && (
        <JobForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['jobs'] }); }}
        />
      )}

      {/* Job table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Job</th>
                <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 font-medium text-gray-600">Periode</th>
                <th className="px-4 py-3 font-medium text-gray-600">Sales</th>
                <th className="px-4 py-3 font-medium text-gray-600">COGS</th>
                <th className="px-4 py-3 font-medium text-gray-600">Op. Profit</th>
                <th className="px-4 py-3 font-medium text-gray-600">Margin</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(jobs ?? []).map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">{j.jobTitle}</p>
                    <p className="text-xs text-gray-400">{j.jobCategory?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{j.company?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{MONTHS[j.periodMonth]} {j.periodYear}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{formatRupiahCompact(j.salesAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatRupiahCompact(j.cogsAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={j.operatingProfit >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                      {j.operatingProfit >= 0 ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                      {formatRupiahCompact(j.operatingProfit)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'font-medium text-sm',
                      j.operatingProfitPct >= 20 ? 'text-emerald-600' : j.operatingProfitPct >= 0 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {j.operatingProfitPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', STATUS_BADGE[j.jobStatus] ?? 'bg-gray-100 text-gray-600')}>
                      {j.jobStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => { if (confirm(`Hapus job "${j.jobTitle}"?`)) deleteMutation.mutate(j.id); }}
                      aria-label={`Hapus ${j.jobTitle}`}
                    >
                      <span className="text-xs">x</span>
                    </button>
                  </td>
                </tr>
              ))}
              {(jobs ?? []).length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Belum ada job di tahun ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, variant = 'neutral' }: { label: string; value: string; sub?: string; variant?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors = { good: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-red-600', neutral: 'text-blue-600' };
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={clsx('text-2xl font-bold mt-1', colors[variant])}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
