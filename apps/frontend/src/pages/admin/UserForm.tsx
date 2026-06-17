import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { usersApi } from '../../api/users';
import { adminApi } from '../../api/admin';
import Spinner from '../../components/ui/Spinner';
import type { User } from '../../types';

interface Props {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({ user, onClose, onSuccess }: Props) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    password: '',
    phone: user?.phone ?? '',
    jobTitle: user?.jobTitle ?? '',
    divisionId: (user as any)?.division?.id ?? '',
    roleId: (user as any)?.role?.id ?? '',
    managerId: (user as any)?.manager?.id ?? '',
  });
  const [error, setError] = useState('');

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles(),
  });

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => adminApi.getDivisions(),
  });

  const { data: managers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Keep form in sync when editing a different user
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        email: user.email,
        password: '',
        phone: user.phone ?? '',
        jobTitle: user.jobTitle ?? '',
        divisionId: (user as any).division?.id ?? '',
        roleId: (user as any).role?.id ?? '',
        managerId: (user as any).manager?.id ?? '',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? usersApi.update(user!.id, data) : usersApi.create(data),
    onSuccess,
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Terjadi kesalahan'),
  });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.divisionId || !form.roleId) {
      setError('Nama, email, divisi, dan role wajib diisi');
      return;
    }
    if (!isEdit && !form.password) {
      setError('Password wajib diisi untuk user baru');
      return;
    }
    const payload: any = {
      fullName: form.fullName,
      email: form.email,
      divisionId: form.divisionId,
      roleId: form.roleId,
      phone: form.phone || null,
      jobTitle: form.jobTitle || null,
      managerId: form.managerId || null,
    };
    if (form.password) payload.password = form.password;
    mutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit User' : 'Tambah User'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Tutup"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Budi Santoso" />
          </div>

          <div>
            <label className="label">Email *</label>
            <input className="input" required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="budi@provaliant.com" disabled={isEdit} />
          </div>

          <div>
            <label className="label">{isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={isEdit ? 'Isi untuk ganti password' : '••••••••'}
              required={!isEdit}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08xx" />
            </div>
            <div>
              <label className="label">Jabatan</label>
              <input className="input" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Business Development" />
            </div>
          </div>

          <div>
            <label className="label">Divisi *</label>
            <select className="input" required value={form.divisionId} onChange={(e) => set('divisionId', e.target.value)}>
              <option value="">Pilih divisi...</option>
              {(divisions ?? []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Role *</label>
            <select className="input" required value={form.roleId} onChange={(e) => set('roleId', e.target.value)}>
              <option value="">Pilih role...</option>
              {(roles ?? []).map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Manager (Atasan Langsung)</label>
            <select className="input" value={form.managerId} onChange={(e) => set('managerId', e.target.value)}>
              <option value="">Tidak ada / pilih manager...</option>
              {(managers ?? []).filter((m: any) => m.id !== user?.id).map((m: any) => (
                <option key={m.id} value={m.id}>{m.fullName} ({(m as any).role?.name})</option>
              ))}
            </select>
          </div>

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : (isEdit ? 'Simpan Perubahan' : 'Tambah User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
