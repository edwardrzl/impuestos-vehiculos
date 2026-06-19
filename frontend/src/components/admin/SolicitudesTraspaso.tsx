import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, CheckCircle2, AlertTriangle, XCircle, X, ChevronRight,
} from 'lucide-react';
import { listarSolicitudesTraspaso, resolverSolicitudAdmin } from '../../api/client';
import type { SolicitudTraspasoAdmin, EstadoSolicitud } from '../../types';

type FiltroUI = 'todas' | 'pendiente' | 'resueltas';

const BADGE_ESTADO: Record<EstadoSolicitud, string> = {
  aprobado: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  rechazado: 'bg-red-100 text-red-700',
};

function formatearFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function BadgeVerificacion({ s }: { s: SolicitudTraspasoAdmin }) {
  if (s.validacion_db === 1) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Verificado
      </span>
    );
  }
  if (s.resultado_ia?.es_tarjeta_propiedad) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        Sin verificar
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      No reconocido
    </span>
  );
}

function DatoFila({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-sm font-medium text-navy-900 mt-0.5 break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

interface ModalProps {
  solicitud: SolicitudTraspasoAdmin;
  notas: string;
  onNotasChange: (v: string) => void;
  procesando: boolean;
  error: string;
  onResolver: (estado: 'aprobado' | 'rechazado') => void;
  onCerrar: () => void;
}

function ModalDetalle({
  solicitud: s, notas, onNotasChange, procesando, error, onResolver, onCerrar,
}: ModalProps) {
  // foto_tarjeta_path es relativo a la raíz del backend: "uploads/tarjetas/123.jpg"
  // express.static sirve /uploads, así que la URL pública es "/uploads/tarjetas/123.jpg".
  const fotoUrl = `/${s.foto_tarjeta_path.replace(/\\/g, '/')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl
                      bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-stone-200 bg-white sticky top-0 z-10">
          <h2 className="font-display text-xl text-navy-900">
            Solicitud <span className="text-stone-500">#{s.id}</span>{' '}
            — <span className="font-mono">{s.placa}</span>
          </h2>
          <button
            onClick={onCerrar}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos del ciudadano solicitante */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Ciudadano solicitante
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <DatoFila label="Nombre"          value={s.ciudadano_nombre} />
              <DatoFila label="Documento"       value={s.ciudadano_documento} mono />
              <DatoFila label="Email"           value={s.ciudadano_email} />
              <DatoFila label="Placa solicitada" value={s.placa} mono />
              <DatoFila label="Fecha solicitud"  value={formatearFecha(s.fecha_solicitud)} />
            </div>
          </section>

          {/* Foto de la tarjeta subida por el ciudadano */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Tarjeta de propiedad
            </h3>
            <img
              src={fotoUrl}
              alt="Tarjeta de propiedad vehicular"
              className="w-full max-h-64 object-contain rounded-xl border border-stone-200 bg-stone-50"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </section>

          {/* Resultado del análisis de IA */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Análisis por IA
            </h3>
            {s.resultado_ia ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DatoFila
                  label="¿Es tarjeta de propiedad?"
                  value={s.resultado_ia.es_tarjeta_propiedad ? 'Sí' : 'No'}
                />
                <DatoFila label="Confianza" value={s.resultado_ia.confianza} />
                <DatoFila
                  label="Placa extraída"
                  value={s.resultado_ia.placa_extraida ?? '—'}
                  mono
                />
                <DatoFila
                  label="Documento extraído"
                  value={s.resultado_ia.documento_extraido ?? '—'}
                  mono
                />
                <div className="col-span-2">
                  <DatoFila label="Observaciones" value={s.resultado_ia.observaciones} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400">Sin resultado de IA disponible.</p>
            )}
          </section>

          {/* Resultado de la comparación contra la BD */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Verificación automática
            </h3>
            {s.validacion_db === 1 ? (
              <div className="flex items-start gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm">
                  ✓ Placa y documento coinciden con el registro del vehículo.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm">
                  ✗ No fue posible verificar automáticamente.
                </span>
              </div>
            )}
          </section>

          {/* Datos actuales del vehículo en la BD para comparación visual */}
          {(s.vehiculo_marca || s.vehiculo_propietario) && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Vehículo registrado — propietario actual
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {s.vehiculo_marca && (
                  <DatoFila
                    label="Vehículo"
                    value={`${s.vehiculo_marca} ${s.vehiculo_linea ?? ''} ${s.vehiculo_modelo ?? ''}`.trim()}
                  />
                )}
                {s.vehiculo_propietario && (
                  <DatoFila label="Propietario actual" value={s.vehiculo_propietario} />
                )}
                {s.vehiculo_documento_propietario && (
                  <DatoFila
                    label="Documento actual"
                    value={s.vehiculo_documento_propietario}
                    mono
                  />
                )}
              </div>
            </section>
          )}

          {/* Acciones (solo si está pendiente) o estado final */}
          {s.estado === 'pendiente' ? (
            <section className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Resolución
              </h3>
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  Notas del administrador (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => onNotasChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 resize-none
                             focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  placeholder="Observaciones para el ciudadano..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => onResolver('aprobado')}
                  disabled={procesando}
                  className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white
                             text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                             flex items-center justify-center gap-2"
                >
                  {procesando
                    ? <Loader2 size={15} className="animate-spin" />
                    : <CheckCircle2 size={15} />}
                  Aprobar traspaso
                </button>
                <button
                  onClick={() => onResolver('rechazado')}
                  disabled={procesando}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white
                             text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                             flex items-center justify-center gap-2"
                >
                  {procesando
                    ? <Loader2 size={15} className="animate-spin" />
                    : <XCircle size={15} />}
                  Rechazar
                </button>
              </div>
            </section>
          ) : (
            <section className="pt-2 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Estado final
              </h3>
              <div
                className={`rounded-lg px-4 py-3 ${
                  s.estado === 'aprobado'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <p className="font-semibold capitalize">{s.estado}</p>
                <p className="text-xs mt-1 opacity-75">
                  Resuelto el {formatearFecha(s.fecha_resolucion)}
                </p>
                {s.estado === 'aprobado' && (
                  <p className="text-xs mt-2">
                    El vehículo fue transferido al nuevo propietario.
                  </p>
                )}
              </div>
              {s.admin_notas && (
                <div>
                  <p className="text-xs text-stone-500 mb-1">Notas del administrador</p>
                  <p className="text-sm text-navy-900 bg-stone-50 rounded-lg px-4 py-3">
                    {s.admin_notas}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  onPendientesChange?: (n: number) => void;
}

export default function SolicitudesTraspaso({ onPendientesChange }: Props) {
  const [solicitudes, setSolicitudes]     = useState<SolicitudTraspasoAdmin[]>([]);
  const [cargando, setCargando]           = useState(true);
  const [filtro, setFiltro]               = useState<FiltroUI>('pendiente');
  const [seleccionada, setSeleccionada]   = useState<SolicitudTraspasoAdmin | null>(null);
  const [notas, setNotas]                 = useState('');
  const [procesando, setProcesando]       = useState(false);
  const [errorModal, setErrorModal]       = useState('');

  async function cargar() {
    setCargando(true);
    try {
      const todas = await listarSolicitudesTraspaso();
      setSolicitudes(todas);
      onPendientesChange?.(todas.filter((s) => s.estado === 'pendiente').length);
    } catch {
      // El historial es secundario; no debe romper el panel.
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const solicitudesFiltradas = useMemo(() => {
    if (filtro === 'pendiente')  return solicitudes.filter((s) => s.estado === 'pendiente');
    if (filtro === 'resueltas')  return solicitudes.filter((s) => s.estado !== 'pendiente');
    return solicitudes;
  }, [solicitudes, filtro]);

  async function resolver(estado: 'aprobado' | 'rechazado') {
    if (!seleccionada) return;
    const msg = estado === 'aprobado'
      ? `¿Aprobar el traspaso de la placa ${seleccionada.placa}? Esto actualizará el propietario en la base de datos.`
      : `¿Rechazar la solicitud de traspaso de la placa ${seleccionada.placa}?`;
    if (!window.confirm(msg)) return;

    setProcesando(true);
    setErrorModal('');
    try {
      await resolverSolicitudAdmin(seleccionada.id, {
        estado,
        admin_notas: notas || undefined,
      });
      setSeleccionada(null);
      setNotas('');
      await cargar();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setErrorModal('Esta solicitud ya fue resuelta previamente.');
      } else {
        setErrorModal(err instanceof Error ? err.message : 'Error al procesar la solicitud.');
      }
    } finally {
      setProcesando(false);
    }
  }

  function abrirModal(s: SolicitudTraspasoAdmin) {
    setSeleccionada(s);
    setNotas('');
    setErrorModal('');
  }

  function cerrarModal() {
    setSeleccionada(null);
    setNotas('');
    setErrorModal('');
  }

  return (
    <div>
      {/* Filtros / tabs */}
      <div className="flex gap-2 mb-5">
        {(['todas', 'pendiente', 'resueltas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-navy-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'pendiente' ? 'Pendientes' : 'Resueltas'}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-stone-400 py-12">
          <Loader2 size={18} className="animate-spin" />
          Cargando solicitudes...
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <p className="text-sm text-stone-500 py-12 text-center">
          No hay solicitudes para este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {['Fecha', 'Ciudadano', 'Documento', 'Email', 'Placa', 'Verif. IA', 'Estado', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs font-semibold uppercase
                                 tracking-wider text-stone-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {solicitudesFiltradas.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-stone-50 cursor-pointer transition-colors"
                  onClick={() => abrirModal(s)}
                >
                  <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                    {formatearFecha(s.fecha_solicitud)}
                  </td>
                  <td className="py-3 px-4 font-medium text-navy-900">{s.ciudadano_nombre}</td>
                  <td className="py-3 px-4 font-mono text-xs text-stone-600">
                    {s.ciudadano_documento}
                  </td>
                  <td className="py-3 px-4 text-xs text-stone-600">{s.ciudadano_email}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-navy-800">{s.placa}</td>
                  <td className="py-3 px-4"><BadgeVerificacion s={s} /></td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        BADGE_ESTADO[s.estado]
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-400">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionada && (
        <ModalDetalle
          solicitud={seleccionada}
          notas={notas}
          onNotasChange={setNotas}
          procesando={procesando}
          error={errorModal}
          onResolver={resolver}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  );
}
