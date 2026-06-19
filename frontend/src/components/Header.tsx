import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, ShieldCheck, LogOut } from 'lucide-react';
import { estaAutenticado, borrarToken } from '../auth/session';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [autenticado, setAutenticado] = useState(estaAutenticado);

  // useLocation() cambia en cada navegación; re-sincroniza el estado de sesión
  // para que el header refleje login/logout sin necesidad de contexto global.
  useEffect(() => {
    setAutenticado(estaAutenticado());
  }, [location]);

  function cerrarSesion() {
    borrarToken();
    navigate('/');
  }

  return (
    <header className="bg-navy-900 text-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="font-display italic text-navy-900 text-2xl leading-none">
                P
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display italic text-lg leading-tight">
                Prisma
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-navy-200">
                Portal de impuestos
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <button
              className="px-3 py-2 rounded-lg flex items-center gap-1.5
                         text-navy-100 hover:bg-navy-800 transition-colors"
            >
              <HelpCircle size={16} />
              <span className="hidden sm:inline">Ayuda</span>
            </button>

            {autenticado ? (
              <>
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg flex items-center gap-1.5
                             text-navy-100 hover:bg-navy-800 transition-colors"
                >
                  <ShieldCheck size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
                <button
                  onClick={cerrarSesion}
                  className="px-3 py-2 rounded-lg flex items-center gap-1.5
                             text-navy-100 hover:bg-navy-800 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg flex items-center gap-1.5
                           text-navy-100 hover:bg-navy-800 transition-colors"
              >
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
