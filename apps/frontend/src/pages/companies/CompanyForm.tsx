import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { companiesApi } from '../../api/companies';
import { api } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import type { Company } from '../../types';

interface Props {
  company?: Company | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompanyForm({ company, onClose, onSuccess }: Props) {
  const isEdit = !!company;

  const [form, setForm] = useState({
    name: company?.name ?? '',
    industryId: (company as any)?.industry?.id ?? '',
    channelType: company?.channelType ?? 'Direct',
    website: company?.website ?? '',
    notes: company?.notes ?? '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        industryId: (company as any)?.industry?.id ?? '',
        channelType: company.channelType,
        website: company.website ?? '',
        notes: company.notes ?? '',
      });
    }
  }, [company]);

  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: () => api.get('/companies/industries').then((r) => r.data).catch(() => []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? companiesApi.update(company!.id, data) : companiesApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setError('Nama company wajib diisi'); return; }
    mutation.mutate({
      name: form.name,
      industryId: form.industryId || null,
      channelType: form.channelType,
      website: form.website || null,
      notes: form.notes || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Company' : 'Tambah Company'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? `Edit: ${company!.name}` : 'Tambah Company'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Nama Company *</label>
            <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Danone" />
          </div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={form.industryId} onChange={(e) => set('industryId', e.target.value)}>
              <option value="">Pilih industri...</option>
              {(industries ?? []).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Channel Type</label>
            <select className="input" value={form.channelType} onChange={(e) => set('channelType', e.target.value)}>
              <option value="Direct">Direct</option>
              <option value="Agency">Agency</option>
              <option value="In-Direct">In-Direct</option>
            </select>
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : (isEdit ? 'Simpan Perubahan' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
