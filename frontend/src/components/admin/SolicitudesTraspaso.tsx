// SolicitudesTraspaso.tsx - Pestaña del panel admin para revisar solicitudes
// de traspaso: lista con filtro por estado, foto de la tarjeta visualizable,
// y resolución (aprobar/rechazar) con comentario opcional.

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle, X } from 'lucide-react';
import { listarSolicitudesTraspaso, resolverSolicitudAdmin, urlArchivo } from '../../api/client';
import type { SolicitudTraspasoAdmin, EstadoSolicitudTraspaso } from '../../types';

const BADGE_ESTADO: Record<EstadoSolicitudTraspaso, { clase: string; texto: string }> = {
  PENDIENTE_REVISION_ADMIN: { clase: 'bg-amber-100 text-amber-700', texto: 'Pendiente' },
  APROBADO: { clase: 'bg-green-100 text-green-700', texto: 'Aprobado' },
  RECHAZADO: { clase: 'bg-coral-100 text-coral-700', texto: 'Rechazado' },
};

const FILTROS: Array<{ valor: EstadoSolicitudTraspaso | ''; etiqueta: string }> = [
  { valor: 'PENDIENTE_REVISION_ADMIN', etiqueta: 'Pendientes' },
  { valor: 'APROBADO', etiqueta: 'Aprobadas' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazadas' },
  { valor: '', etiqueta: 'Todas' },
];

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  onPendientesChange?: (pendientes: number) => void;
}

export default function SolicitudesTraspaso({ onPendientesChange }: Props) {
  const [filtro, setFiltro] = useState<EstadoSolicitudTraspaso | ''>('PENDIENTE_REVISION_ADMIN');
  const [solicitudes, setSolicitudes] = useState<SolicitudTraspasoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState<SolicitudTraspasoAdmin | null>(null);
  const [comentario, setComentario] = useState('');
  const [resolviendo, setResolviendo] = useState(false);
  const [errorResolver, setErrorResolver] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await listarSolicitudesTraspaso(filtro || undefined);
      setSolicitudes(lista);
      if (filtro === 'PENDIENTE_REVISION_ADMIN') onPendientesChange?.(lista.length);
    } catch {
      // Silencioso: la tabla muestra el estado vacío.
    } finally {
      setCargando(false);
    }
  }, [filtro, onPendientesChange]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function resolver(estado: 'APROBADO' | 'RECHAZADO') {
    if (!detalle || resolviendo) return;
    setResolviendo(true);
    setErrorResolver(null);
    try {
      await resolverSolicitudAdmin(detalle.id, {
        estado,
        comentario_admin: comentario.trim() || undefined,
      });
      cerrarDetalle();
      cargar();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setErrorResolver(
        status === 409
          ? 'Esta solicitud ya fue resuelta por otro administrador.'
          : err instanceof Error ? err.message : 'Error al resolver la solicitud'
      );
    } finally {
      setResolviendo(false);
    }
  }

  function cerrarDetalle() {
    setDetalle(null);
    setComentario('');
    setErrorResolver(null);
  }

  return (
    <div>
      {/* Filtros por estado */}
      <div className="flex gap-1.5 mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.etiqueta}
            onClick={() => setFiltro(f.valor)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${filtro === f.valor
                          ? 'bg-navy-800 text-white'
                          : 'text-navy-700 hover:bg-navy-50 border border-stone-200'}`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-stone-500 text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Cargando solicitudes…
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="card p-8 text-center text-stone-500 text-sm">
          No hay solicitudes {FILTROS.find((f) => f.valor === filtro)?.etiqueta.toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {solicitudes.map((s) => (
            <button
              key={s.id}
              onClick={() => setDetalle(s)}
              className="card w-full p-4 flex items-center justify-between gap-4 text-left
                         hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={urlArchivo(s.foto_path)}
                  alt={`Tarjeta de ${s.placa}`}
                  className="w-16 h-11 object-cover rounded-md border border-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-navy-900">
                    {s.placa}
                    <span className="font-sans font-normal text-stone-500 text-sm ml-2">
                      {s.vehiculo_marca ?? ''} {s.vehiculo_linea ?? ''}
                    </span>
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    Solicita: {s.ciudadano_nombre} (C.C. {s.ciudadano_documento}) · {formatearFecha(s.creado_en)}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${BADGE_ESTADO[s.estado].clase}`}>
                {BADGE_ESTADO[s.estado].texto}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal de detalle y resolución */}
      {detalle && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/50 flex items-center justify-center p-4"
          onClick={cerrarDetalle}
        >
          <div
            className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-xl text-navy-900">
                  Solicitud #{detalle.id} — {detalle.placa}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{formatearFecha(detalle.creado_en)}</p>
              </div>
              <button onClick={cerrarDetalle} aria-label="Cerrar detalle" className="p-1.5 rounded-lg hover:bg-stone-100">
                <X size={18} />
              </button>
            </div>

            <img
              src={urlArchivo(detalle.foto_path)}
              alt={`Tarjeta de propiedad de ${detalle.placa}`}
              className="w-full rounded-lg border border-stone-200 mb-4"
            />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
              <div>
                <dt className="text-stone-500 text-xs">Solicitante</dt>
                <dd className="text-navy-900">{detalle.ciudadano_nombre}</dd>
              </div>
              <div>
                <dt className="text-stone-500 text-xs">Cédula solicitante</dt>
                <dd className="text-navy-900">{detalle.ciudadano_documento}</dd>
              </div>
              <div>
                <dt className="text-stone-500 text-xs">Vehículo</dt>
                <dd className="text-navy-900">
                  {detalle.vehiculo_marca ?? '—'} {detalle.vehiculo_linea ?? ''} {detalle.vehiculo_modelo ?? ''}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500 text-xs">Propietario actual</dt>
                <dd className="text-navy-900">
                  {detalle.vehiculo_propietario ?? '—'}
                  {detalle.vehiculo_documento_propietario ? ` (C.C. ${detalle.vehiculo_documento_propietario})` : ''}
                </dd>
              </div>
            </dl>

            {detalle.estado === 'PENDIENTE_REVISION_ADMIN' ? (
              <>
                <label htmlFor="comentario" className="block text-sm font-medium text-navy-900 mb-1.5">
                  Comentario (opcional)
                </label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  placeholder="Visible para el ciudadano"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 mb-3
                             focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
                />
                {errorResolver && (
                  <p className="text-sm text-coral-700 mb-3">{errorResolver}</p>
                )}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => resolver('APROBADO')}
                    disabled={resolviendo}
                    className="btn flex-1 bg-green-600 text-white hover:bg-green-700 shadow-sm"
                  >
                    {resolviendo ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Aprobar traspaso
                  </button>
                  <button
                    onClick={() => resolver('RECHAZADO')}
                    disabled={resolviendo}
                    className="btn-accent flex-1"
                  >
                    {resolviendo ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                    Rechazar
                  </button>
                </div>
              </>
            ) : (
              <div className={`p-3 rounded-lg text-sm ${BADGE_ESTADO[detalle.estado].clase}`}>
                Solicitud {BADGE_ESTADO[detalle.estado].texto.toLowerCase()}
                {detalle.comentario_admin ? ` — "${detalle.comentario_admin}"` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
