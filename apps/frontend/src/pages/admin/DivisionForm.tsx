import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Spinner from '../../components/ui/Spinner';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

interface Props {
  division?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DivisionForm({ division, onClose, onSuccess }: Props) {
  const isEdit = !!division;
  const [form, setForm] = useState({
    name: division?.name ?? '',
    code: division?.code ?? '',
    colorTag: division?.colorTag ?? PRESET_COLORS[0],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (division) {
      setForm({ name: division.name, code: division.code, colorTag: division.colorTag ?? PRESET_COLORS[0] });
    }
  }, [division]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? adminApi.updateDivision(division!.id, data) : adminApi.createDivision(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) { setError('Nama dan kode divisi wajib diisi'); return; }
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Divisi' : 'Tambah Divisi'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Divisi' : 'Tambah Divisi'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Nama Divisi *</label>
            <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="IP Licensing" />
          </div>
          <div>
            <label className="label">Kode *</label>
            <input className="input" required value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="IPL" maxLength={6} />
          </div>
          <div>
            <label className="label">Warna Identitas</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full transition-transform ${
                    form.colorTag === c ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                  onClick={() => set('colorTag', c)}
                  aria-label={`Pilih warna ${c}`}
                />
              ))}
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : (isEdit ? 'Simpan' : 'Tambah')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
