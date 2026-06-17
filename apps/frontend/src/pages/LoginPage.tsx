import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const { login, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (token) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Email atau password salah.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Provaliant Sales OS</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@provaliant.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? <Spinner size="sm" /> : 'Masuk'}
            </button>
          </form>

          {/* Dev hint */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Akun demo:</p>
            <div className="space-y-1">
              {[
                ['Admin', 'admin@provaliant.com'],
                ['Corporate', 'reynaldo@provaliant.com'],
                ['Manager', 'andi@provaliant.com'],
                ['User', 'sinta@provaliant.com'],
              ].map(([role, em]) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => { setEmail(em); setPassword('password123'); }}
                  className="block w-full text-left text-xs text-blue-600 hover:underline"
                >
                  {role}: {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
