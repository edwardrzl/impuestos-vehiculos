import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { loginAdmin } from '../api/client';
import { guardarToken } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const token = await loginAdmin(usuario, password);
      guardarToken(token);
      navigate('/admin');
    } catch {
      // No propagamos el error original para no filtrar detalles técnicos al usuario.
      setError('Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 rounded-2xl mb-4">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="font-display text-3xl text-navy-900">
            Acceso de administrador
          </h1>
        </div>

        <div className="card p-6 md:p-8">
          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label
                htmlFor="usuario"
                className="block text-sm font-medium text-navy-800 mb-1.5"
              >
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="admin"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-navy-800 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-coral-600 bg-coral-50 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
