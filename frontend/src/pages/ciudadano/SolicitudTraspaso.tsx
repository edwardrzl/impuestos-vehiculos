import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Loader2, ImageIcon, CheckCircle2, AlertTriangle, ArrowLeft, Clock,
} from 'lucide-react';
import { crearSolicitudTraspaso, listarMisSolicitudes } from '../../api/client';
import type { SolicitudTraspasoResponse, SolicitudTraspasoHistorial, EstadoSolicitud } from '../../types';

const BADGE_ESTADO: Record<EstadoSolicitud, string> = {
  aprobado: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  rechazado: 'bg-coral-100 text-coral-700',
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function SolicitudTraspaso() {
  const navigate = useNavigate();

  const [placa, setPlaca]       = useState('');
  const [archivo, setArchivo]   = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<SolicitudTraspasoResponse | null>(null);

  const [historial, setHistorial]       = useState<SolicitudTraspasoHistorial[]>([]);
  const [cargandoHist, setCargandoHist] = useState(true);

  async function cargarHistorial() {
    try {
      setHistorial(await listarMisSolicitudes());
    } catch {
      // Silencioso: el historial es secundario; no debe romper la página.
    } finally {
      setCargandoHist(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setArchivo(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!placa.trim() || !archivo) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setEnviando(true);
    try {
      const datos = new FormData();
      datos.append('placa', placa.trim());
      datos.append('foto_tarjeta', archivo);

      const respuesta = await crearSolicitudTraspaso(datos);
      setResultado(respuesta);
      cargarHistorial(); // refrescar el historial con la nueva solicitud
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 400) {
        setError('Por favor completa todos los campos.');
      } else if (status === 502 || status === 503) {
        setError(err instanceof Error ? err.message : 'El servicio de validación no está disponible.');
      } else if (status) {
        setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud.');
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper px-6 py-12">
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-navy-900">Solicitar traspaso vehicular</h1>
          <p className="text-stone-500 text-sm mt-1">
            Sube la foto de la tarjeta de propiedad para iniciar el trámite.
          </p>
        </div>

        {/* Estado de carga: la validación con IA puede tardar varios segundos */}
        {enviando && !resultado && (
          <div className="card p-10 flex flex-col items-center text-center gap-4">
            <Loader2 size={36} className="animate-spin text-navy-700" />
            <p className="font-medium text-navy-900">Analizando documento...</p>
            <p className="text-sm text-stone-500">
              Estamos verificando la tarjeta de propiedad. Esto puede tardar unos segundos.
            </p>
          </div>
        )}

        {/* Resultado: reemplaza el formulario tras un envío exitoso */}
        {resultado && (
          <div className="card p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  resultado.validacion_db ? 'bg-green-100' : 'bg-amber-100'
                }`}
              >
                {resultado.validacion_db ? (
                  <CheckCircle2 size={24} className="text-green-600" />
                ) : (
                  <AlertTriangle size={24} className="text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-navy-900">{resultado.mensaje}</p>
                <p className="text-sm text-stone-500 mt-3">
                  Número de solicitud:{' '}
                  <span className="font-mono font-semibold text-navy-800">#{resultado.id}</span>
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  Puedes cerrar esta página. Te notificaremos sobre el resultado.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/ciudadano/portal')}
              className="btn-primary w-full mt-6"
            >
              <ArrowLeft size={16} />
              Volver al portal
            </button>
          </div>
        )}

        {/* Formulario */}
        {!enviando && !resultado && (
          <div className="card p-6 md:p-8">
            <form onSubmit={manejarEnvio} className="space-y-5">
              <div>
                <label htmlFor="placa" className="block text-sm font-medium text-navy-800 mb-1.5">
                  Placa del vehículo a traspasar
                </label>
                <input
                  id="placa"
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300
                             font-mono tracking-wider text-navy-900 placeholder:font-sans placeholder:text-stone-400
                             focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                             transition-shadow"
                  placeholder="ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  Foto de la tarjeta de propiedad
                </label>
                <label
                  htmlFor="foto_tarjeta"
                  className="flex flex-col items-center gap-2 w-full px-4 py-4 rounded-lg border-2 border-dashed
                             border-stone-300 cursor-pointer hover:border-navy-400 hover:bg-navy-50/50
                             transition-colors text-center"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vista previa de la tarjeta"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <ImageIcon size={28} className="text-stone-400" />
                      <span className="text-sm text-stone-500">
                        Haz clic para seleccionar una imagen (JPG o PNG, máx. 5 MB)
                      </span>
                    </>
                  )}
                  {archivo && <span className="text-xs text-stone-400 mt-1">{archivo.name}</span>}
                </label>
                <input
                  id="foto_tarjeta"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={manejarArchivo}
                  className="sr-only"
                />
              </div>

              {error && (
                <p className="text-sm text-coral-600 bg-coral-50 px-4 py-3 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={enviando} className="btn-primary w-full">
                <FileText size={16} />
                Enviar solicitud
              </button>
            </form>
          </div>
        )}

        {/* Historial de solicitudes anteriores */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4">
            Mis solicitudes anteriores
          </h2>

          {cargandoHist ? (
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <Loader2 size={15} className="animate-spin" />
              Cargando...
            </div>
          ) : historial.length === 0 ? (
            <p className="text-sm text-stone-500">Aún no tienes solicitudes.</p>
          ) : (
            <ul className="space-y-2">
              {historial.map((s) => (
                <li
                  key={s.id}
                  className="card px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-stone-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-navy-900 text-sm">{s.placa}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock size={11} />
                        {formatearFecha(s.fecha_solicitud)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${BADGE_ESTADO[s.estado]}`}
                  >
                    {s.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
