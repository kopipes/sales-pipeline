import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, User, Trash2 } from 'lucide-react';
import { contactsApi } from '../../api/contacts';
import Spinner from '../../components/ui/Spinner';
import ContactForm from './ContactForm';

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => contactsApi.getAll({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{contacts?.length ?? 0} contact</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tambah Contact
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Cari contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari contact"
        />
      </div>

      {showForm && (
        <ContactForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['contacts'] }); }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 font-medium text-gray-600">Jabatan</th>
                <th className="px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(contacts ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.fullName}</p>
                        {c.isPrimary && <span className="badge bg-blue-50 text-blue-600">Primary</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.jobTitle ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? '-'}</td>
                  <td className="px-3 py-3">
                    <button
                      className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => { if (confirm(`Hapus ${c.fullName}?`)) deleteMutation.mutate(c.id); }}
                      aria-label={`Hapus ${c.fullName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {(contacts ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Belum ada contact.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
