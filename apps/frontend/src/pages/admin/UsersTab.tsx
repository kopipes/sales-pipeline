import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { usersApi } from '../../api/users';
import Spinner from '../../components/ui/Spinner';
import UserForm from './UserForm';
import type { User } from '../../types';
import clsx from 'clsx';

const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-red-100 text-red-700',
  Corporate: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  User: 'bg-gray-100 text-gray-700',
};

export default function UsersTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersApi.update(id, { status } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users?.length ?? 0} user</p>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={15} /> Tambah User
        </button>
      </div>

      {(showForm || editing) && (
        <UserForm
          user={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['users'] }); }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">User</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Divisi</th>
                <th className="px-4 py-3 font-medium text-gray-600">Jabatan</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-3 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.fullName?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', ROLE_BADGE[(u as any).role?.name] ?? 'bg-gray-100 text-gray-600')}>
                      {(u as any).role?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(u as any).division?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.jobTitle ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                        onClick={() => { setEditing(u); setShowForm(true); }}
                        aria-label={`Edit ${u.fullName}`}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className={clsx(
                          'p-1.5 rounded-lg transition-colors',
                          u.status === 'active'
                            ? 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                            : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                        )}
                        onClick={() => toggleStatus.mutate({ id: u.id, status: u.status === 'active' ? 'inactive' : 'active' })}
                        aria-label={u.status === 'active' ? `Nonaktifkan ${u.fullName}` : `Aktifkan ${u.fullName}`}
                        title={u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Belum ada user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
