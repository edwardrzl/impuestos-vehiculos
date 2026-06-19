import { useNavigate } from 'react-router-dom';
import { FileText, LogOut } from 'lucide-react';
import { obtenerCiudadano, cerrarSesionCiudadano } from '../../auth/session';

export default function PortalCiudadano() {
  const navigate = useNavigate();
  const ciudadano = obtenerCiudadano();

  function cerrarSesion() {
    cerrarSesionCiudadano();
    navigate('/ciudadano/login');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm text-stone-500 mb-1">Bienvenido</p>
          <h1 className="font-display text-3xl text-navy-900">{ciudadano?.nombre ?? 'Ciudadano'}</h1>
          <p className="text-stone-500 text-sm mt-1">{ciudadano?.email}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/ciudadano/traspaso')}
            className="card w-full p-5 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center
                              group-hover:bg-navy-900 transition-colors">
                <FileText size={20} className="text-navy-700 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">Solicitar traspaso vehicular</p>
                <p className="text-sm text-stone-500">Inicia el proceso de cambio de propietario</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={cerrarSesion}
          className="mt-6 flex items-center gap-2 text-sm text-stone-500 hover:text-coral-600 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
