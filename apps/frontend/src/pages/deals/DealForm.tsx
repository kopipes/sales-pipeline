import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { dealsApi } from '../../api/deals';
import { companiesApi } from '../../api/companies';
import { api } from '../../api/client';
import Spinner from '../../components/ui/Spinner';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DealForm({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    dealName: '',
    companyId: '',
    dealTypeId: '',
    estimatedValue: '',
    probabilityPct: '50',
    expectedClosingDate: '',
    remarks: '',
    // IP Licensing
    ipAssetName: '',
    royaltyPct: '',
    minimumGuarantee: '',
    // Job/Project
    jobCategoryId: '',
    billingType: 'Direct',
  });
  const [error, setError] = useState('');

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.getAll(),
  });

  const { data: dealTypes } = useQuery({
    queryKey: ['deal-types'],
    queryFn: () => api.get('/deals/types').then((r) => r.data).catch(() => [
      { id: '', name: '' },
    ]),
  });

  const { data: jobCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => api.get('/jobs/categories').then((r) => r.data).catch(() => []),
  });

  const { data: stages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => api.get('/deals/stages').then((r) => r.data).catch(() => []),
  });

  const selectedDealType = (dealTypes ?? []).find((dt: any) => dt.id === form.dealTypeId);
  const isIPLicensing = selectedDealType?.name?.includes('IP Licensing');
  const isJobProject = selectedDealType?.name?.includes('Job');

  const mutation = useMutation({
    mutationFn: (data: any) => dealsApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.dealName || !form.companyId || !form.dealTypeId) {
      setError('Deal name, company, dan deal type wajib diisi');
      return;
    }
    mutation.mutate({
      ...form,
      estimatedValue: form.estimatedValue ? parseInt(form.estimatedValue.replace(/\D/g, ''), 10) : 0,
      probabilityPct: parseInt(form.probabilityPct, 10),
      minimumGuarantee: form.minimumGuarantee ? parseInt(form.minimumGuarantee.replace(/\D/g, ''), 10) : null,
      royaltyPct: form.royaltyPct ? parseFloat(form.royaltyPct) : null,
      expectedClosingDate: form.expectedClosingDate || null,
      ipAssetName: form.ipAssetName || null,
      jobCategoryId: form.jobCategoryId || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Tambah Deal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Tambah Deal Baru</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Deal Name */}
          <div>
            <label className="label">Nama Deal *</label>
            <input className="input" required value={form.dealName} onChange={(e) => set('dealName', e.target.value)} placeholder="Contoh: Watsons - One Piece Run" />
          </div>

          {/* Company */}
          <div>
            <label className="label">Company *</label>
            <select className="input" required value={form.companyId} onChange={(e) => set('companyId', e.target.value)}>
              <option value="">Pilih company...</option>
              {(companies ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Deal Type */}
          <div>
            <label className="label">Deal Type *</label>
            <select className="input" required value={form.dealTypeId} onChange={(e) => set('dealTypeId', e.target.value)}>
              <option value="">Pilih tipe...</option>
              {(dealTypes ?? []).map((dt: any) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
          </div>

          {/* Estimated Value & Probability */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Estimated Value (Rp)</label>
              <input className="input" type="text" inputMode="numeric" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} placeholder="2000000000" />
            </div>
            <div>
              <label className="label">Probabilitas (%)</label>
              <input className="input" type="number" min="0" max="100" value={form.probabilityPct} onChange={(e) => set('probabilityPct', e.target.value)} />
            </div>
          </div>

          {/* Expected Closing */}
          <div>
            <label className="label">Expected Closing Date</label>
            <input className="input" type="date" value={form.expectedClosingDate} onChange={(e) => set('expectedClosingDate', e.target.value)} />
          </div>

          {/* IP Licensing Fields */}
          {isIPLicensing && (
            <fieldset className="border border-blue-200 rounded-lg px-4 py-3 space-y-3">
              <legend className="text-xs font-medium text-blue-600 px-1">IP Licensing / Sponsorship</legend>
              <div>
                <label className="label">IP Asset Name</label>
                <input className="input" value={form.ipAssetName} onChange={(e) => set('ipAssetName', e.target.value)} placeholder="One Piece Run" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Royalty (%)</label>
                  <input className="input" type="number" step="0.01" value={form.royaltyPct} onChange={(e) => set('royaltyPct', e.target.value)} />
                </div>
                <div>
                  <label className="label">Minimum Guarantee (Rp)</label>
                  <input className="input" type="text" inputMode="numeric" value={form.minimumGuarantee} onChange={(e) => set('minimumGuarantee', e.target.value)} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Job/Project Fields */}
          {isJobProject && (
            <fieldset className="border border-purple-200 rounded-lg px-4 py-3 space-y-3">
              <legend className="text-xs font-medium text-purple-600 px-1">Job / Project</legend>
              <div>
                <label className="label">Job Category</label>
                <select className="input" value={form.jobCategoryId} onChange={(e) => set('jobCategoryId', e.target.value)}>
                  <option value="">Pilih kategori...</option>
                  {(jobCategories ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Billing Type</label>
                <select className="input" value={form.billingType} onChange={(e) => set('billingType', e.target.value)}>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
            </fieldset>
          )}

          {/* Remarks */}
          <div>
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Catatan tambahan..." />
          </div>

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Actions */}
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
