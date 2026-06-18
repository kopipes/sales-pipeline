import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowRight, Pencil, Trash2, Filter } from 'lucide-react';
import { activitiesApi } from '../../api/activities';
import { formatDate } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import ActivityForm from './ActivityForm';
import PromoteToDealForm from './PromoteToDealForm';
import Pagination, { paginate } from '../../components/ui/Pagination';
import type { Activity } from '../../types';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 10;

const MEDIUM_BADGE: Record<string, string> = {
  'Offline Meeting': 'bg-blue-100 text-blue-700',
  'Online Meeting': 'bg-purple-100 text-purple-700',
  WA: 'bg-green-100 text-green-700',
  Call: 'bg-yellow-100 text-yellow-700',
  Email: 'bg-gray-100 text-gray-700',
};

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [medium, setMedium] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const MEDIUMS = ['Offline Meeting', 'Online Meeting', 'WA', 'Call', 'Email'];
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', search, medium, dateFrom, dateTo],
    queryFn: () => activitiesApi.getAll({
      search: search || undefined,
      medium: medium || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  const totalItems = activities?.length ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paged = paginate(activities ?? [], page, PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });

  const activityToPromote = promotingId
    ? activities?.find((a) => a.id === promotingId)
    : null;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aktivitas / Canvassing</h1>
          <p className="text-sm text-gray-500">{totalItems} aktivitas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Aktivitas
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Cari aktivitas atau company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari aktivitas"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            className="input pl-8 pr-4"
            value={medium}
            onChange={(e) => { setMedium(e.target.value); setPage(1); }}
            aria-label="Filter medium"
          >
            <option value="">Semua Medium</option>
            {MEDIUMS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <input
            type="date"
            className="text-sm text-gray-700 outline-none bg-transparent"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            aria-label="Tanggal dari"
          />
          <span className="text-xs text-gray-400 flex-shrink-0">s/d</span>
          <input
            type="date"
            className="text-sm text-gray-700 outline-none bg-transparent"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            aria-label="Tanggal sampai"
          />
        </div>
        {(medium || dateFrom || dateTo) && (
          <button
            className="btn-secondary text-xs"
            onClick={() => { setMedium(''); setDateFrom(''); setDateTo(''); setPage(1); }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {showForm && (
        <ActivityForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['activities'] }); }}
        />
      )}

      {editingActivity && (
        <ActivityForm
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSuccess={() => { setEditingActivity(null); qc.invalidateQueries({ queryKey: ['activities'] }); }}
        />
      )}

      {promotingId && activityToPromote && (
        <PromoteToDealForm
          activity={activityToPromote}
          onClose={() => setPromotingId(null)}
          onSuccess={() => {
            setPromotingId(null);
            qc.invalidateQueries({ queryKey: ['activities'] });
            qc.invalidateQueries({ queryKey: ['deals'] });
          }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Aktivitas</th>
                <th className="px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 font-medium text-gray-600">Medium</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="px-4 py-3 font-medium text-gray-600">Sales Rep</th>
                <th className="px-4 py-3 font-medium text-gray-600">Follow-up</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{a.objective}</p>
                    {a.resultNotes && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{a.resultNotes}</p>
                    )}
                    {a.deal && (
                      <span className="text-xs text-blue-600">Deal: {a.deal.dealName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.company?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${MEDIUM_BADGE[a.medium] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.medium}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(a.activityDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{a.salesRep?.fullName}</td>
                  <td className="px-4 py-3">
                    {a.nextActionDate ? (
                      <span className="text-xs text-amber-600">{formatDate(a.nextActionDate)}</span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {!a.dealId && (
                        <button
                          className="btn-secondary text-xs py-1 px-2"
                          onClick={() => setPromotingId(a.id)}
                          title="Promote ke Deal"
                        >
                          <ArrowRight size={12} /> Deal
                        </button>
                      )}
                      {/* Edit: admin bisa edit semua, user hanya edit miliknya */}
                      {(isAdmin || a.salesRep?.id === user?.id) && (
                        <button
                          className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          onClick={() => setEditingActivity(a)}
                          aria-label={`Edit aktivitas ${a.objective}`}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {/* Delete: admin bisa hapus semua, user hanya hapus miliknya */}
                      {(isAdmin || a.salesRep?.id === user?.id) && (
                        <button
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                          onClick={() => { if (confirm('Hapus aktivitas ini?')) deleteMutation.mutate(a.id); }}
                          aria-label={`Hapus aktivitas ${a.objective}`}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Belum ada aktivitas.
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
