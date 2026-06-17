import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Spinner from '../../components/ui/Spinner';
import DivisionForm from './DivisionForm';

export default function DivisionsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: divisions, isLoading } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => adminApi.getDivisions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDivision(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['divisions'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{divisions?.length ?? 0} divisi</p>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={15} /> Tambah Divisi
        </button>
      </div>

      {(showForm || editing) && (
        <DivisionForm
          division={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['divisions'] }); }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(divisions ?? []).map((d: any) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-10 rounded-full flex-shrink-0"
                    style={{ background: d.colorTag ?? '#94A3B8' }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{d.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => { setEditing(d); setShowForm(true); }}
                    aria-label={`Edit ${d.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    onClick={() => { if (confirm(`Nonaktifkan divisi ${d.name}?`)) deleteMutation.mutate(d.id); }}
                    aria-label={`Hapus ${d.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {/* Stats */}
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>{d._count?.users ?? 0} users</span>
                <span>{d._count?.deals ?? 0} deals</span>
                <span>{d._count?.jobs ?? 0} jobs</span>
              </div>
            </div>
          ))}
          {(divisions ?? []).length === 0 && (
            <p className="col-span-3 text-center py-12 text-gray-400">Belum ada divisi.</p>
          )}
        </div>
      )}
    </div>
  );
}
