import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { contactsApi } from '../../api/contacts';
import CompanySelect from '../../components/ui/CompanySelect';
import Spinner from '../../components/ui/Spinner';
import type { Contact } from '../../types';

interface Props {
  contact?: Contact;  // if provided, form is in edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactForm({ contact, onClose, onSuccess }: Props) {
  const isEdit = !!contact;

  const [form, setForm] = useState({
    companyId: contact?.companyId ?? '',
    fullName: contact?.fullName ?? '',
    jobTitle: contact?.jobTitle ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    isPrimary: contact?.isPrimary ?? false,
    notes: (contact as any)?.notes ?? '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? contactsApi.update(contact!.id, data) : contactsApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string | boolean) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyId || !form.fullName) { setError('Company dan nama wajib diisi'); return; }
    mutation.mutate({
      ...form,
      phone: form.phone || null,
      email: form.email || null,
      jobTitle: form.jobTitle || null,
      notes: form.notes || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Contact' : 'Tambah Contact'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Contact' : 'Tambah Contact'}</h2>
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
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Alpha" />
          </div>
          <div>
            <label className="label">Jabatan</label>
            <input className="input" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Brand Marketing" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08xx" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[72px] resize-y"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Catatan tambahan..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isPrimary"
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => set('isPrimary', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPrimary" className="text-sm text-gray-700">Tandai sebagai kontak utama</label>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : isEdit ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
