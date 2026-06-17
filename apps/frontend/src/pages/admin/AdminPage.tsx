import { useState } from 'react';
import UsersTab from './UsersTab';
import DivisionsTab from './DivisionsTab';
import clsx from 'clsx';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'divisions', label: 'Divisi' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('users');

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Administrasi</h1>
        <p className="text-sm text-gray-500">Kelola user, role, dan divisi</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'divisions' && <DivisionsTab />}
    </div>
  );
}
