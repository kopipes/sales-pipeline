import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, X, ChevronDown } from 'lucide-react';
import { companiesApi } from '../../api/companies';

interface Props {
  value: string;        // companyId
  onChange: (id: string, name: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function CompanySelect({ value, onChange, required, placeholder = 'Cari company...' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => companiesApi.getAll({ search: search || undefined }),
    staleTime: 30_000,
  });

  // Find selected company label
  const selectedCompany = companies.find((c) => c.id === value)
    ?? (value ? { id: value, name: '...' } : null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function openDropdown() {
    setOpen(true);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function selectCompany(id: string, name: string) {
    onChange(id, name);
    setOpen(false);
    setSearch('');
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('', '');
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={openDropdown}
        className="input flex items-center justify-between text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedCompany ? (
          <span className="flex items-center gap-2 truncate">
            <Building2 size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate text-gray-900">{selectedCompany.name}</span>
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <span className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => e.key === 'Enter' && clear(e as any)}
              className="p-0.5 hover:text-red-500 text-gray-300 transition-colors"
              aria-label="Hapus pilihan"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className="text-gray-400" />
        </span>
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none"
          onChange={() => {}}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          role="listbox"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama company..."
              className="flex-1 text-sm outline-none placeholder-gray-400"
              aria-label="Cari company"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600" aria-label="Hapus pencarian">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Results */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {companies.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {search ? `Tidak ada company "${search}"` : 'Belum ada company'}
              </li>
            ) : (
              companies.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === value}
                    onClick={() => selectCompany(c.id, c.name)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      c.id === value ? 'bg-blue-50 text-blue-700' : 'text-gray-800'
                    }`}
                  >
                    <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      {(c as any).industry?.name && (
                        <p className="text-xs text-gray-400">{(c as any).industry.name} · {c.channelType}</p>
                      )}
                    </div>
                    {c.id === value && (
                      <span className="ml-auto text-blue-600 text-xs font-medium">✓</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
