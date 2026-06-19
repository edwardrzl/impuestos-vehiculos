import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { loginCiudadano } from '../../api/client';
import { guardarSesionCiudadano } from '../../auth/session';

export default function LoginCiudadano() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registroExitoso = searchParams.get('registro') === 'ok';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { token, ciudadano } = await loginCiudadano(email, password);
      guardarSesionCiudadano(token, ciudadano);
      navigate('/ciudadano/portal');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 rounded-2xl mb-4">
            <User className="text-white" size={28} />
          </div>
          <h1 className="font-display text-3xl text-navy-900">Portal ciudadano</h1>
          <p className="text-sm text-stone-500 mt-1">Inicia sesión para gestionar tus trámites</p>
        </div>

        {registroExitoso && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            Registro exitoso, ya puedes iniciar sesión.
          </div>
        )}

        <div className="card p-6 md:p-8">
          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-800 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                           text-navy-900 placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-800 mb-1.5">
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
              <p className="text-sm text-coral-600 bg-coral-50 px-4 py-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={cargando} className="btn-primary w-full">
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

        <p className="text-center text-sm text-stone-500 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/ciudadano/registro" className="text-navy-700 font-medium hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
