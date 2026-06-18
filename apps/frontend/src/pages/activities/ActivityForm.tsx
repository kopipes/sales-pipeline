import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { activitiesApi } from '../../api/activities';
import { contactsApi } from '../../api/contacts';
import CompanySelect from '../../components/ui/CompanySelect';
import Spinner from '../../components/ui/Spinner';
import type { Activity } from '../../types';

const MEDIUMS = ['Offline Meeting', 'Online Meeting', 'WA', 'Call', 'Email'];

interface Props {
  activity?: Activity | null; // present when editing
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivityForm({ activity, onClose, onSuccess }: Props) {
  const isEdit = !!activity;

  const [form, setForm] = useState({
    companyId: activity?.companyId ?? '',
    contactId: (activity as any)?.contactId ?? '',
    activityDate: activity?.activityDate
      ? new Date(activity.activityDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    medium: activity?.medium ?? 'Offline Meeting',
    objective: activity?.objective ?? '',
    resultNotes: activity?.resultNotes ?? '',
    nextAction: activity?.nextAction ?? '',
    nextActionDate: activity?.nextActionDate
      ? new Date(activity.nextActionDate).toISOString().split('T')[0]
      : '',
  });
  const [error, setError] = useState('');

  // Re-sync when activity prop changes (e.g. opening edit for a different row)
  useEffect(() => {
    if (activity) {
      setForm({
        companyId: activity.companyId,
        contactId: (activity as any).contactId ?? '',
        activityDate: new Date(activity.activityDate).toISOString().split('T')[0],
        medium: activity.medium,
        objective: activity.objective,
        resultNotes: activity.resultNotes ?? '',
        nextAction: activity.nextAction ?? '',
        nextActionDate: activity.nextActionDate
          ? new Date(activity.nextActionDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [activity]);

  const { data: contacts } = useQuery({
    queryKey: ['contacts', form.companyId],
    queryFn: () => contactsApi.getAll({ companyId: form.companyId }),
    enabled: !!form.companyId,
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? activitiesApi.update(activity!.id, data) : activitiesApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.companyId || !form.objective || !form.activityDate) {
      setError('Company, tanggal, dan tujuan wajib diisi');
      return;
    }
    mutation.mutate({
      ...form,
      contactId: form.contactId || null,
      nextActionDate: form.nextActionDate || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Aktivitas' : 'Tambah Aktivitas'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Aktivitas' : 'Tambah Aktivitas'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Company *</label>
            <CompanySelect
              value={form.companyId}
              onChange={(id) => set('companyId', id)}
              required
            />
          </div>

          {form.companyId && (
            <div>
              <label className="label">Contact (PIC klien)</label>
              <select className="input" value={form.contactId} onChange={(e) => set('contactId', e.target.value)}>
                <option value="">Pilih contact...</option>
                {(contacts ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.fullName} ({c.jobTitle})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal *</label>
              <input className="input" type="date" required value={form.activityDate} onChange={(e) => set('activityDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Medium *</label>
              <select className="input" value={form.medium} onChange={(e) => set('medium', e.target.value)}>
                {MEDIUMS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Meeting Objective *</label>
            <input className="input" required value={form.objective} onChange={(e) => set('objective', e.target.value)} placeholder="Perkenalan / Presentasi produk..." />
          </div>

          <div>
            <label className="label">Hasil Meeting</label>
            <textarea className="input" rows={2} value={form.resultNotes} onChange={(e) => set('resultNotes', e.target.value)} placeholder="Ringkasan hasil meeting..." />
          </div>

          <div>
            <label className="label">Rencana Follow-up</label>
            <input className="input" value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Kirim proposal, follow-up WA..." />
          </div>

          <div>
            <label className="label">Tanggal Follow-up</label>
            <input className="input" type="date" value={form.nextActionDate} onChange={(e) => set('nextActionDate', e.target.value)} />
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
