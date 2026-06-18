import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronRight, AlertTriangle, Download, Pencil } from 'lucide-react';
import Pagination, { paginate } from '../../components/ui/Pagination';

const PAGE_SIZE = 10;
import { useAuth } from '../../context/AuthContext';
import { dealsApi } from '../../api/deals';
import { dashboardApi } from '../../api/dashboard';
import { formatRupiahCompact, formatDate } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import DealForm from './DealForm';
import DealDetail from './DealDetail';
import type { Deal } from '../../types';
import clsx from 'clsx';

const STAGE_COLORS: Record<string, string> = {
  Lead: 'bg-slate-100 text-slate-700',
  Qualified: 'bg-blue-100 text-blue-700',
  Discovery: 'bg-teal-100 text-teal-700',
  Proposal: 'bg-yellow-100 text-yellow-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Won: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-red-100 text-red-700',
};

export default function DealsPage() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selected, setSelected] = useState<Deal | null>(null);

  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals', search],
    queryFn: () => dealsApi.getAll({ search: search || undefined }),
  });

  const totalItems = deals?.length ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paged = paginate(deals ?? [], page, PAGE_SIZE);

  const { data: atRisk } = useQuery({
    queryKey: ['deals', 'at-risk'],
    queryFn: () => dealsApi.getAtRisk(),
  });

  const { data: funnel } = useQuery({
    queryKey: ['dashboard', 'funnel'],
    queryFn: () => dashboardApi.getFunnel(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); setSelected(null); },
  });

  if (selected) {
    return (
      <DealDetail
        deal={selected}
        stages={funnel?.stages ?? []}
        onBack={() => { setSelected(null); qc.invalidateQueries({ queryKey: ['deals'] }); }}
        onDelete={() => deleteMutation.mutate(selected.id)}
      />
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipeline / Deals</h1>
          <p className="text-sm text-gray-500">{totalItems} deal ditemukan</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/dashboard/export/deals" className="btn-secondary" download aria-label="Export deals ke Excel">
            <Download size={14} /> Export
          </a>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Tambah Deal
          </button>
        </div>
      </div>

      {/* At Risk Banner */}
      {(atRisk?.count ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">
            <strong>{atRisk.count} deal berisiko</strong> — tidak ada update atau melewati expected closing date.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Cari deal..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Cari deal"
        />
      </div>

      {/* Deal Form Modal - Tambah */}
      {showForm && (
        <DealForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['deals'] }); }}
        />
      )}

      {/* Deal Form Modal - Edit */}
      {editingDeal && (
        <DealForm
          deal={editingDeal}
          onClose={() => setEditingDeal(null)}
          onSuccess={() => { setEditingDeal(null); qc.invalidateQueries({ queryKey: ['deals'] }); }}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="px-4 py-3 font-medium text-gray-600">Deal</th>
                <th className="px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="px-4 py-3 font-medium text-gray-600">Nilai</th>
                <th className="px-4 py-3 font-medium text-gray-600">Weighted</th>
                <th className="px-4 py-3 font-medium text-gray-600">Closing</th>
                <th className="px-4 py-3 font-medium text-gray-600">Owner</th>
                 <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(deal)}>
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">{deal.dealName}</p>
                    <p className="text-xs text-gray-400">{deal.dealType?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 cursor-pointer" onClick={() => setSelected(deal)}>{deal.company?.name}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(deal)}>
                    <span className={clsx('badge', STAGE_COLORS[deal.stage?.name] ?? 'bg-gray-100 text-gray-600')}>
                      {deal.stage?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium cursor-pointer" onClick={() => setSelected(deal)}>
                    {formatRupiahCompact(deal.estimatedValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 cursor-pointer" onClick={() => setSelected(deal)}>
                    {formatRupiahCompact(deal.weightedValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 cursor-pointer" onClick={() => setSelected(deal)}>
                    {formatDate(deal.expectedClosingDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 cursor-pointer" onClick={() => setSelected(deal)}>{deal.salesRep?.fullName}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      {/* Edit: admin atau owner deal */}
                      {(isAdmin || deal.salesRep?.id === user?.id) && (
                        <button
                          className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          onClick={(e) => { e.stopPropagation(); setEditingDeal(deal); }}
                          aria-label={`Edit ${deal.dealName}`}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <ChevronRight
                        size={15}
                        className="text-gray-400 cursor-pointer"
                        onClick={() => setSelected(deal)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Belum ada deal. Klik "Tambah Deal" untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
