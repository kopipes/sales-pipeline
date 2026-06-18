import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, User, TrendingUp, Briefcase, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { formatRupiahCompact } from '../../utils/format';
import clsx from 'clsx';

function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => api.get('/dashboard/search', { params: { q: query } }).then((r) => r.data),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  });
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data } = useGlobalSearch(query);

  const hasResults =
    data &&
    (data.companies?.length || data.contacts?.length || data.deals?.length || data.jobs?.length);

  // Open on Cmd/Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  function close() { setOpen(false); setQuery(''); }

  function go(path: string) { navigate(path); close(); }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        aria-label="Buka pencarian global"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Cari...</span>
        <kbd className="hidden sm:inline text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 font-mono">⌘K</kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-10 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari company, deal, job..."
              className="flex-1 text-sm outline-none placeholder-gray-400"
              aria-label="Pencarian global"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600" aria-label="Hapus pencarian">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {query.length < 2 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Ketik minimal 2 karakter untuk mencari</p>
            )}

            {query.length >= 2 && !hasResults && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Tidak ada hasil untuk "{query}"</p>
            )}

            {/* Companies */}
            {(data?.companies?.length ?? 0) > 0 && (
              <Section label="Companies">
                {data!.companies.map((c: any) => (
                  <ResultRow
                    key={c.id}
                    icon={<Building2 size={13} />}
                    primary={c.name}
                    secondary={c.industry?.name}
                    onClick={() => go('/companies')}
                  />
                ))}
              </Section>
            )}

            {/* Contacts */}
            {(data?.contacts?.length ?? 0) > 0 && (
              <Section label="Contacts">
                {data!.contacts.map((c: any) => (
                  <ResultRow
                    key={c.id}
                    icon={<User size={13} />}
                    primary={c.fullName}
                    secondary={`${c.jobTitle ?? ''} · ${c.company?.name ?? ''}`}
                    onClick={() => go('/contacts')}
                  />
                ))}
              </Section>
            )}

            {/* Deals */}
            {(data?.deals?.length ?? 0) > 0 && (
              <Section label="Deals">
                {data!.deals.map((d: any) => (
                  <ResultRow
                    key={d.id}
                    icon={<TrendingUp size={13} />}
                    primary={d.dealName}
                    secondary={`${d.stage?.name} · ${d.company?.name} · ${formatRupiahCompact(d.estimatedValue)}`}
                    onClick={() => go('/deals')}
                  />
                ))}
              </Section>
            )}

            {/* Jobs */}
            {(data?.jobs?.length ?? 0) > 0 && (
              <Section label="Jobs">
                {data!.jobs.map((j: any) => (
                  <ResultRow
                    key={j.id}
                    icon={<Briefcase size={13} />}
                    primary={j.jobTitle}
                    secondary={`${j.company?.name} · ${j.periodMonth}/${j.periodYear} · ${j.jobStatus}`}
                    onClick={() => go('/jobs')}
                  />
                ))}
              </Section>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t px-4 py-2 flex gap-3 text-xs text-gray-400">
            <span><kbd className="font-mono bg-gray-100 px-1 rounded">↵</kbd> pilih</span>
            <span><kbd className="font-mono bg-gray-100 px-1 rounded">Esc</kbd> tutup</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({
  icon,
  primary,
  secondary,
  onClick,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
    >
      <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{primary}</p>
        {secondary && <p className="text-xs text-gray-400 truncate">{secondary}</p>}
      </div>
    </button>
  );
}
