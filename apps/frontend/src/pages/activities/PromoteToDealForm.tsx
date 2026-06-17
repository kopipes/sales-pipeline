import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { activitiesApi } from '../../api/activities';
import { api } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import type { Activity } from '../../types';

interface Props {
  activity: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromoteToDealForm({ activity, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    dealName: `${activity.company?.name ?? ''} - ${activity.objective}`,
    dealTypeId: '',
    estimatedValue: '',
    probabilityPct: '30',
    ipAssetName: '',
    jobCategoryId: '',
    billingType: 'Direct',
  });
  const [error, setError] = useState('');

  const { data: dealTypes } = useQuery({
    queryKey: ['deal-types'],
    queryFn: () => api.get('/deals/types').then((r) => r.data),
  });

  const { data: jobCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => api.get('/jobs/categories').then((r) => r.data),
  });

  const selectedType = (dealTypes ?? []).find((dt: any) => dt.id === form.dealTypeId);
  const isIPLicensing = selectedType?.name?.includes('IP Licensing');
  const isJobProject = selectedType?.name?.includes('Job');

  const mutation = useMutation({
    mutationFn: (data: any) => activitiesApi.promoteToDeal(activity.id, data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.dealTypeId) { setError('Pilih deal type'); return; }
    mutation.mutate({
      dealName: form.dealName,
      dealTypeId: form.dealTypeId,
      estimatedValue: form.estimatedValue ? parseInt(form.estimatedValue.replace(/\D/g, ''), 10) : 0,
      probabilityPct: parseInt(form.probabilityPct, 10),
      ipAssetName: form.ipAssetName || null,
      jobCategoryId: form.jobCategoryId || null,
      billingType: form.billingType || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Promote ke Deal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">Promote ke Deal</h2>
            <p className="text-xs text-gray-400">Dari aktivitas: {activity.objective}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Nama Deal</label>
            <input className="input" value={form.dealName} onChange={(e) => set('dealName', e.target.value)} />
          </div>

          <div>
            <label className="label">Deal Type *</label>
            <select className="input" required value={form.dealTypeId} onChange={(e) => set('dealTypeId', e.target.value)}>
              <option value="">Pilih tipe...</option>
              {(dealTypes ?? []).map((dt: any) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Estimated Value (Rp)</label>
              <input className="input" type="text" inputMode="numeric" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} placeholder="500000000" />
            </div>
            <div>
              <label className="label">Probabilitas (%)</label>
              <input className="input" type="number" min="0" max="100" value={form.probabilityPct} onChange={(e) => set('probabilityPct', e.target.value)} />
            </div>
          </div>

          {isIPLicensing && (
            <div>
              <label className="label">IP Asset Name</label>
              <input className="input" value={form.ipAssetName} onChange={(e) => set('ipAssetName', e.target.value)} placeholder="One Piece Run" />
            </div>
          )}

          {isJobProject && (
            <>
              <div>
                <label className="label">Job Category</label>
                <select className="input" value={form.jobCategoryId} onChange={(e) => set('jobCategoryId', e.target.value)}>
                  <option value="">Pilih...</option>
                  {(jobCategories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Billing Type</label>
                <select className="input" value={form.billingType} onChange={(e) => set('billingType', e.target.value)}>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
            </>
          )}

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : 'Promote ke Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
