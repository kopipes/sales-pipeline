import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronRight, ArrowRight } from 'lucide-react';
import { activitiesApi } from '../../api/activities';
import { formatDate, timeAgo } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import ActivityForm from './ActivityForm';
import PromoteToDealForm from './PromoteToDealForm';
import type { Activity } from '../../types';

const MEDIUM_BADGE: Record<string, string> = {
  'Offline Meeting': 'bg-blue-100 text-blue-700',
  'Online Meeting': 'bg-purple-100 text-purple-700',
  WA: 'bg-green-100 text-green-700',
  Call: 'bg-yellow-100 text-yellow-700',
  Email: 'bg-gray-100 text-gray-700',
};

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', search],
    queryFn: () => activitiesApi.getAll({ search: search || undefined }),
  });

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
          <p className="text-sm text-gray-500">{activities?.length ?? 0} aktivitas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Aktivitas
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Cari aktivitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari aktivitas"
        />
      </div>

      {showForm && (
        <ActivityForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['activities'] }); }}
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
              {(activities ?? []).map((a) => (
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
                      <button
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-gray-400 transition-colors"
                        onClick={() => { if (confirm('Hapus aktivitas ini?')) deleteMutation.mutate(a.id); }}
                        aria-label="Hapus"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(activities ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Belum ada aktivitas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
