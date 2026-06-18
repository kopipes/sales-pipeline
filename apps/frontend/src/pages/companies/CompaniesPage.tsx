import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2, Trash2, Pencil } from 'lucide-react';
import { companiesApi } from '../../api/companies';
import Spinner from '../../components/ui/Spinner';
import CompanyForm from './CompanyForm';
import Pagination, { paginate } from '../../components/ui/Pagination';
import type { Company } from '../../types';

const PAGE_SIZE = 15;

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => companiesApi.getAll({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  const totalItems = companies?.length ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paged = paginate(companies ?? [], page, PAGE_SIZE);

  function onSuccess() {
    setShowForm(false);
    setEditingCompany(null);
    qc.invalidateQueries({ queryKey: ['companies'] });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500">{totalItems} company</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Company
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Cari company..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Cari company"
        />
      </div>

      {showForm && (
        <CompanyForm onClose={() => setShowForm(false)} onSuccess={onSuccess} />
      )}

      {editingCompany && (
        <CompanyForm
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={onSuccess}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{(c as any).industry?.name ?? '-'} &middot; {c.channelType}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="p-1.5 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded-lg transition-colors"
                      onClick={() => setEditingCompany(c)}
                      aria-label={`Edit ${c.name}`}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => { if (confirm(`Hapus ${c.name}?`)) deleteMutation.mutate(c.id); }}
                      aria-label={`Hapus ${c.name}`}
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2 block">{c.website}</a>
                )}
                {c.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.notes}</p>}
              </div>
            ))}
            {paged.length === 0 && (
              <p className="col-span-3 text-center py-12 text-gray-400">Belum ada company.</p>
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
