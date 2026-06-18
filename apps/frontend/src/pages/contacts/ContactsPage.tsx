import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Pencil, Phone, Mail, Building2 } from 'lucide-react';
import { contactsApi } from '../../api/contacts';
import Spinner from '../../components/ui/Spinner';
import ContactForm from './ContactForm';
import Pagination, { paginate } from '../../components/ui/Pagination';
import type { Contact } from '../../types';

const PAGE_SIZE = 10;

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => contactsApi.getAll({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const totalItems = contacts?.length ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paged = paginate(contacts ?? [], page, PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{totalItems} contact</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditContact(null); setShowForm(true); }}>
          <Plus size={15} /> Tambah Contact
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Cari contact..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Cari contact"
        />
      </div>

      {showForm && (
        <ContactForm
          contact={editContact ?? undefined}
          onClose={() => { setShowForm(false); setEditContact(null); }}
          onSuccess={() => { setShowForm(false); setEditContact(null); qc.invalidateQueries({ queryKey: ['contacts'] }); }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-blue-600" /></div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
                      {c.fullName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.fullName}</p>
                      <p className="text-xs text-gray-400">{c.jobTitle ?? 'No title'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.isPrimary && (
                      <span className="badge bg-blue-50 text-blue-600 text-xs">Primary</span>
                    )}
                    <button
                      className="p-1.5 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded-lg transition-colors"
                      onClick={() => { setEditContact(c); setShowForm(true); }}
                      aria-label={`Edit ${c.fullName}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => { if (confirm(`Hapus ${c.fullName}?`)) deleteMutation.mutate(c.id); }}
                      aria-label={`Hapus ${c.fullName}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {(c as any).company?.name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{(c as any).company.name}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={12} className="text-gray-400 flex-shrink-0" />
                      <a href={`tel:${c.phone}`} className="hover:text-blue-600 transition-colors truncate">{c.phone}</a>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${c.email}`} className="hover:text-blue-600 transition-colors truncate">{c.email}</a>
                    </div>
                  )}
                  {!c.phone && !c.email && (
                    <p className="text-xs text-gray-300 italic">Tidak ada kontak info</p>
                  )}
                </div>
              </div>
            ))}
            {paged.length === 0 && (
              <p className="col-span-3 text-center py-12 text-gray-400">Belum ada contact.</p>
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
