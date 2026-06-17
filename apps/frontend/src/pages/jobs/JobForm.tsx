import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { companiesApi } from '../../api/companies';
import { api } from '../../api/client';
import Spinner from '../../components/ui/Spinner';

interface Props { onClose: () => void; onSuccess: () => void; }

export default function JobForm({ onClose, onSuccess }: Props) {
  const now = new Date();
  const [form, setForm] = useState({
    companyId: '', jobTitle: '', jobCategoryId: '',
    periodMonth: String(now.getMonth() + 1),
    periodYear: String(now.getFullYear()),
    salesAmount: '', cogsAmount: '',
    billingType: 'Direct', jobStatus: 'Planning', notes: '',
  });
  const [error, setError] = useState('');

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.getAll() });
  const { data: jobCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => api.get('/jobs/categories').then((r) => r.data).catch(() => []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => jobsApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyId || !form.jobTitle || !form.jobCategoryId) {
      setError('Company, judul job, dan kategori wajib diisi');
      return;
    }
    mutation.mutate({
      companyId: form.companyId,
      jobTitle: form.jobTitle,
      jobCategoryId: form.jobCategoryId,
      periodMonth: parseInt(form.periodMonth, 10),
      periodYear: parseInt(form.periodYear, 10),
      salesAmount: form.salesAmount ? parseInt(form.salesAmount.replace(/\D/g, ''), 10) : 0,
      cogsAmount: form.cogsAmount ? parseInt(form.cogsAmount.replace(/\D/g, ''), 10) : 0,
      billingType: form.billingType,
      jobStatus: form.jobStatus,
      notes: form.notes || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Tambah Job">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Tambah Job / P&L</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Client *</label>
            <select className="input" required value={form.companyId} onChange={(e) => set('companyId', e.target.value)}>
              <option value="">Pilih client...</option>
              {(companies ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job Title *</label>
            <input className="input" required value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Isi Piringku" />
          </div>
          <div>
            <label className="label">Job Category *</label>
            <select className="input" required value={form.jobCategoryId} onChange={(e) => set('jobCategoryId', e.target.value)}>
              <option value="">Pilih kategori...</option>
              {(jobCategories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bulan</label>
              <select className="input" value={form.periodMonth} onChange={(e) => set('periodMonth', e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tahun</label>
              <input className="input" type="number" value={form.periodYear} onChange={(e) => set('periodYear', e.target.value)} min="2020" max="2030" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sales Amount (Rp)</label>
              <input className="input" type="text" inputMode="numeric" value={form.salesAmount} onChange={(e) => set('salesAmount', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">COGS (Rp)</label>
              <input className="input" type="text" inputMode="numeric" value={form.cogsAmount} onChange={(e) => set('cogsAmount', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Billing Type</label>
              <select className="input" value={form.billingType} onChange={(e) => set('billingType', e.target.value)}>
                <option value="Direct">Direct</option>
                <option value="Agency">Agency</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.jobStatus} onChange={(e) => set('jobStatus', e.target.value)}>
                <option value="Planning">Planning</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
