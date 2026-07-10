// SolicitudTraspaso.tsx - Solicitud de traspaso con validación de foto por IA.
// El usuario ingresa placa + foto de la tarjeta de propiedad; el backend valida
// con Gemini y crea la solicitud si pasa. Estados: idle → enviando → resultado.

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, ImageIcon, Loader2, AlertTriangle, XCircle,
} from 'lucide-react';
import { solicitarTraspaso, listarMisSolicitudes } from '../../api/client';
import type { SolicitudTraspaso as Solicitud, EstadoSolicitudTraspaso } from '../../types';

const BADGE_ESTADO: Record<EstadoSolicitudTraspaso, { clase: string; texto: string }> = {
  PENDIENTE_REVISION_ADMIN: { clase: 'bg-amber-100 text-amber-700', texto: 'En revisión' },
  APROBADO: { clase: 'bg-green-100 text-green-700', texto: 'Aprobado' },
  RECHAZADO: { clase: 'bg-coral-100 text-coral-700', texto: 'Rechazado' },
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fases de un envío: mientras espera, alterna el texto a "validando" pasado
// un momento (la validación IA es la parte lenta del request).
type FaseEnvio = 'idle' | 'enviando' | 'validando';

export default function SolicitudTraspaso() {
  const navigate = useNavigate();

  const [placa, setPlaca] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fase, setFase] = useState<FaseEnvio>('idle');

  const [exito, setExito] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 429: sin más intentos por hoy para esta placa → formulario deshabilitado.
  const [placaBloqueada, setPlacaBloqueada] = useState<string | null>(null);

  const [historial, setHistorial] = useState<Solicitud[]>([]);
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

  function manejarArchivo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setArchivo(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  const bloqueado = placaBloqueada !== null && placa.trim().toUpperCase() === placaBloqueada;

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!placa.trim() || !archivo || fase !== 'idle' || bloqueado) return;

    setExito(null);
    setRechazo(null);
    setError(null);
    setFase('enviando');
    const timer = setTimeout(() => setFase('validando'), 900);

    try {
      const resultado = await solicitarTraspaso(placa.trim().toUpperCase(), archivo);
      if (resultado.aprobada) {
        setExito(resultado.mensaje);
        setPlaca('');
        setArchivo(null);
        setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
        cargarHistorial();
      } else {
        setRechazo(resultado.razon);
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      const mensaje = err instanceof Error ? err.message : 'Error al enviar la solicitud';
      if (status === 429) {
        setPlacaBloqueada(placa.trim().toUpperCase());
      }
      setError(mensaje);
    } finally {
      clearTimeout(timer);
      setFase('idle');
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper px-6 py-10">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate('/ciudadano/portal')}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-navy-700 transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Volver al portal
        </button>

        <h1 className="font-display text-3xl text-navy-900 mb-1">Traspaso de vehículo</h1>
        <p className="text-stone-500 text-sm mb-8">
          Ingresa la placa y una foto clara de la tarjeta de propiedad. La validamos
          automáticamente y un administrador revisará tu solicitud.
        </p>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className="card p-6 space-y-5">
          <div>
            <label htmlFor="placa" className="block text-sm font-medium text-navy-900 mb-1.5">
              Placa del vehículo
            </label>
            <input
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 font-mono tracking-widest
                         focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="foto" className="block text-sm font-medium text-navy-900 mb-1.5">
              Foto de la tarjeta de propiedad
            </label>
            <label
              htmlFor="foto"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed
                         border-stone-300 rounded-xl p-6 cursor-pointer hover:border-navy-400
                         hover:bg-navy-50/40 transition-colors"
            >
              {preview ? (
                <img src={preview} alt="Vista previa de la tarjeta" className="max-h-52 rounded-lg shadow-sm" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-stone-400" />
                  <span className="text-sm text-stone-500">
                    Haz clic para elegir una imagen (JPG, PNG o WEBP, 50 KB – 8 MB)
                  </span>
                </>
              )}
            </label>
            <input
              id="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={manejarArchivo}
              className="hidden"
            />
          </div>

          {/* Resultados del envío */}
          {exito && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
              <span>{exito}</span>
            </div>
          )}
          {rechazo && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-coral-50 border border-coral-200 text-coral-800 text-sm">
              <XCircle size={17} className="shrink-0 mt-0.5" />
              <span>
                <b>La foto no pasó la validación:</b> {rechazo}
                <br />
                <span className="text-coral-700/80">Puedes corregir y volver a intentar.</span>
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!placa.trim() || !archivo || fase !== 'idle' || bloqueado}
            className="btn-primary w-full"
          >
            {fase === 'enviando' && <Loader2 size={16} className="animate-spin" />}
            {fase === 'validando' && <Loader2 size={16} className="animate-spin" />}
            {fase === 'idle' && (bloqueado ? 'Sin intentos disponibles para esta placa' : 'Enviar solicitud')}
            {fase === 'enviando' && 'Enviando…'}
            {fase === 'validando' && 'Validando la foto con IA…'}
          </button>
        </form>

        {/* Historial */}
        <h2 className="font-display text-xl text-navy-900 mt-10 mb-3">Mis solicitudes</h2>
        {cargandoHist ? (
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Loader2 size={15} className="animate-spin" /> Cargando…
          </div>
        ) : historial.length === 0 ? (
          <p className="text-sm text-stone-500">Todavía no tienes solicitudes de traspaso.</p>
        ) : (
          <ul className="space-y-2.5">
            {historial.map((s) => (
              <li key={s.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-semibold text-navy-900">{s.placa}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {formatearFecha(s.creado_en)}
                  </p>
                  {s.comentario_admin && (
                    <p className="text-xs text-stone-600 mt-1.5 italic">
                      Comentario del administrador: {s.comentario_admin}
                    </p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${BADGE_ESTADO[s.estado].clase}`}>
                  {BADGE_ESTADO[s.estado].texto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
