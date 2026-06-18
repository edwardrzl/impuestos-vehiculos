// components/admin/CrearVigencias.tsx
// Formulario de generación masiva de vigencias anuales.
// Envía los parámetros al endpoint POST /api/admin/vigencias/generar-anual
// y muestra el resumen de resultado (creadas / omitidas / errores).

import { useState, useEffect } from 'react';
import { CalendarPlus, Loader2, CheckCircle2, SkipForward, AlertCircle, TriangleAlert } from 'lucide-react';
import { generarVigenciasAnuales, obtenerAnioSiguiente } from '../../api/client';
import type { ResultadoGenerarVigencias } from '../../types';
import { formatCurrency } from '../../utils/format';

// Fallback mientras se resuelve el fetch inicial; el endpoint lo reemplaza con el valor real.
const ANIO_FALLBACK = 2027;

// Genera la fecha de vencimiento por defecto para un año dado (30 de junio).
function fechaVencimientoPorDefecto(anio: number): string {
  return `${anio}-06-30`;
}

export default function CrearVigencias() {
  // anioMinimo se inicializa con el fallback y se actualiza al montar con el valor de la BD.
  const [anioMinimo,        setAnioMinimo]        = useState(ANIO_FALLBACK);
  const [cargandoAnio,      setCargandoAnio]      = useState(true);
  const [anio,              setAnio]              = useState(ANIO_FALLBACK);
  const [tasaPct,           setTasaPct]           = useState(1);
  const [descuentoPct,      setDescuentoPct]      = useState(15);
  const [fechaVencimiento,  setFechaVencimiento]  = useState(fechaVencimientoPorDefecto(ANIO_FALLBACK));
  const [generando,         setGenerando]         = useState(false);
  const [resultado,         setResultado]         = useState<ResultadoGenerarVigencias | null>(null);
  const [error,             setError]             = useState<string | null>(null);

  // Reemplaza la constante estática ANIO_FALLBACK: al montar consulta el año siguiente
  // al último registrado en la BD para que el formulario siempre parta del año correcto.
  useEffect(() => {
    obtenerAnioSiguiente()
      .then(({ anio_siguiente }) => {
        setAnioMinimo(anio_siguiente);
        setAnio(anio_siguiente);
        setFechaVencimiento(fechaVencimientoPorDefecto(anio_siguiente));
      })
      .catch(() => { /* mantiene el fallback 2027 si el endpoint falla */ })
      .finally(() => setCargandoAnio(false));
  }, []);

  // Cuando el admin cambia el año manualmente, sincronizamos la fecha al 30/06
  // del nuevo año como sugerencia. El admin puede luego modificarla.
  useEffect(() => {
    setFechaVencimiento(fechaVencimientoPorDefecto(anio));
  }, [anio]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGenerando(true);
    setResultado(null);
    setError(null);

    try {
      const res = await generarVigenciasAnuales({
        anio,
        tasa_pct: tasaPct,
        descuento_pct: descuentoPct,
        fecha_vencimiento: fechaVencimiento,
      });
      setResultado(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al generar vigencias');
    } finally {
      setGenerando(false);
    }
  }

  // Calcula un ejemplo del valor para el preview usando un avalúo ficticio de referencia.
  // El avalúo real varía por vehículo; esto solo es ilustrativo para el admin.
  const ejemploAvaluo   = 20_000_000;
  const ejemploValor    = Math.round((ejemploAvaluo * tasaPct) / 100);
  const ejemploDescuento = Math.round((ejemploValor * descuentoPct) / 100);

  // Formatea la fecha de vencimiento como DD/MM/YYYY para mostrar en el preview.
  const fechaDisplay = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento)) return fechaVencimiento;
    const [y, m, d] = fechaVencimiento.split('-');
    return `${d}/${m}/${y}`;
  })();

  return (
    <div className="space-y-6">
      <div className="card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="font-semibold text-navy-900 mb-1">Generar vigencias anuales</h2>
          <p className="text-sm text-stone-500">
            Crea una vigencia de impuesto vehicular para cada vehículo registrado.
            Las vigencias existentes para el año seleccionado se omiten automáticamente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Fila: Año + Tasa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5 flex items-center gap-2">
                Año de la vigencia
                {cargandoAnio && <Loader2 size={12} className="animate-spin text-stone-400" />}
              </label>
              <input
                type="number"
                min={anioMinimo}
                step={1}
                value={anio}
                disabled={cargandoAnio}
                onChange={(e) => setAnio(Math.max(anioMinimo, parseInt(e.target.value, 10) || anioMinimo))}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-navy-900
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Tasa de impuesto (% del avalúo)
              </label>
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={tasaPct}
                onChange={(e) => setTasaPct(parseFloat(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-navy-900
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
              />
            </div>
          </div>

          {/* Fila: Descuento + Fecha vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Descuento por pronto pago (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={descuentoPct}
                onChange={(e) => setDescuentoPct(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-navy-900
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Fecha límite para descuento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-navy-900
                           focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                           transition-shadow"
              />
            </div>
          </div>

          {/* Preview reactivo — se actualiza con cada cambio en el formulario */}
          <div className="bg-navy-50 border border-navy-200 rounded-xl px-5 py-4 space-y-1.5">
            <p className="text-xs font-semibold text-navy-700 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarPlus size={13} />
              Vista previa
            </p>
            <p className="text-sm text-navy-800">
              Se crearán vigencias del año <strong>{anio}</strong> para todos los vehículos registrados.
            </p>
            <p className="text-sm text-navy-800">
              Valor: <strong>{tasaPct}%</strong> del avalúo de cada vehículo
              {' '}(ej. avalúo {formatCurrency(ejemploAvaluo)} → {formatCurrency(ejemploValor)}).
            </p>
            {descuentoPct > 0 ? (
              <p className="text-sm text-navy-800">
                Descuento: <strong>{descuentoPct}%</strong> del valor si se paga antes del <strong>{fechaDisplay}</strong>
                {' '}(ej. descuento de {formatCurrency(ejemploDescuento)}).
              </p>
            ) : (
              <p className="text-sm text-navy-800">Sin descuento por pronto pago.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={generando || cargandoAnio}
            className="btn-primary"
          >
            {generando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <CalendarPlus size={16} />
                Generar vigencias
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error de validación o de red */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-coral-700
                        bg-coral-50 border border-coral-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tarjeta de resultado */}
      {resultado && (
        <div className="card p-6 space-y-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Resultado — vigencias {resultado.anio}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {/* Creadas */}
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border
                            ${resultado.creadas > 0
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-stone-50 border-stone-200'
                            }`}>
              <CheckCircle2
                size={20}
                className={resultado.creadas > 0 ? 'text-emerald-600 shrink-0' : 'text-stone-400 shrink-0'}
              />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider
                               ${resultado.creadas > 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
                  Creadas
                </p>
                <p className={`font-display text-2xl
                               ${resultado.creadas > 0 ? 'text-emerald-800' : 'text-stone-700'}`}>
                  {resultado.creadas}
                </p>
              </div>
            </div>

            {/* Omitidas */}
            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <SkipForward size={20} className="text-stone-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Omitidas</p>
                <p className="font-display text-2xl text-stone-700">{resultado.omitidas}</p>
              </div>
            </div>

            {/* Errores */}
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border
                            ${resultado.errores > 0
                              ? 'bg-coral-50 border-coral-200'
                              : 'bg-stone-50 border-stone-200'
                            }`}>
              <AlertCircle
                size={20}
                className={resultado.errores > 0 ? 'text-coral-600 shrink-0' : 'text-stone-400 shrink-0'}
              />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider
                               ${resultado.errores > 0 ? 'text-coral-700' : 'text-stone-500'}`}>
                  Errores
                </p>
                <p className={`font-display text-2xl
                               ${resultado.errores > 0 ? 'text-coral-800' : 'text-stone-700'}`}>
                  {resultado.errores}
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje resumido */}
          <div className="text-sm text-stone-600 space-y-1">
            <p>Total de vehículos procesados: <strong>{resultado.total_vehiculos}</strong></p>
            {resultado.creadas === 0 && resultado.omitidas > 0 && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50
                              border border-amber-200 rounded-xl px-4 py-2.5 mt-2">
                <TriangleAlert size={15} className="shrink-0" />
                <span>Todas las vigencias ya existían para el año {resultado.anio}. No se creó ninguna nueva.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
