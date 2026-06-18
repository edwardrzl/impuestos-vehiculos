// components/admin/CargaCSV.tsx
// Sección de carga masiva de vehículos desde un archivo CSV.
// Muestra un input de archivo, un botón para enviar, y el resumen del resultado.

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, SkipForward, TriangleAlert } from 'lucide-react';
import { cargarCSVVehiculos } from '../../api/client';
import type { ResultadoCargaCSV } from '../../types';

interface Props {
  onCargaExitosa: () => void; // llamado cuando insertados > 0; refresca la tabla de vehículos
}

export default function CargaCSV({ onCargaExitosa }: Props) {
  const [archivo,   setArchivo]   = useState<File | null>(null);
  const [cargando,  setCargando]  = useState(false);
  const [resultado, setResultado] = useState<ResultadoCargaCSV | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArchivo(file);
    setResultado(null);
    setError(null);
  }

  async function cargar() {
    if (!archivo) return;
    setCargando(true);
    setResultado(null);
    setError(null);

    try {
      const res = await cargarCSVVehiculos(archivo);
      setResultado(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al cargar el archivo');
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setArchivo(null);
    setResultado(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="card p-6 md:p-8 space-y-6">
      <div>
        <h2 className="font-semibold text-navy-900 mb-1">Cargar vehículos desde CSV</h2>
        <p className="text-sm text-stone-500">
          El archivo debe tener los encabezados: <span className="font-mono text-xs bg-stone-100 px-1 rounded">NRO PLACA</span>,{' '}
          <span className="font-mono text-xs bg-stone-100 px-1 rounded">CLASE</span>,{' '}
          <span className="font-mono text-xs bg-stone-100 px-1 rounded">MARCA</span>,{' '}
          <span className="font-mono text-xs bg-stone-100 px-1 rounded">MODELO</span>,{' '}
          <span className="font-mono text-xs bg-stone-100 px-1 rounded">TIPO DE SERVICIO</span>.
          Tamaño máximo: 5 MB.
        </p>
      </div>

      {/* Selector de archivo */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="flex-1">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed
                       border-stone-300 hover:border-navy-400 cursor-pointer transition-colors
                       bg-stone-50 hover:bg-navy-50"
          >
            <Upload size={18} className="text-stone-400 shrink-0" />
            <span className="text-sm text-stone-600 truncate">
              {archivo ? archivo.name : 'Seleccionar archivo .csv'}
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={seleccionarArchivo}
          />
        </label>

        <button
          onClick={cargar}
          disabled={!archivo || cargando}
          className="btn-primary shrink-0"
        >
          {cargando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Upload size={16} />
              Cargar
            </>
          )}
        </button>
      </div>

      {/* Error de red o de servidor */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-coral-700
                        bg-coral-50 border border-coral-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Resumen del resultado */}
      {resultado && (
        <div className="space-y-4">
          {/* Contadores principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200
                            rounded-xl px-4 py-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
                  Cargados
                </p>
                <p className="font-display text-2xl text-emerald-800">
                  {resultado.insertados}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200
                            rounded-xl px-4 py-3">
              <SkipForward size={20} className="text-stone-500 shrink-0" />
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                  Omitidos
                </p>
                <p className="font-display text-2xl text-stone-700">
                  {resultado.omitidos}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción textual */}
          <div className="text-sm text-stone-600 space-y-1">
            {resultado.insertados > 0 && (
              <p>✅ {resultado.insertados} vehículo{resultado.insertados !== 1 ? 's' : ''} cargado{resultado.insertados !== 1 ? 's' : ''} correctamente.</p>
            )}
            {resultado.omitidos > 0 && (
              <p>⏭️ {resultado.omitidos} vehículo{resultado.omitidos !== 1 ? 's' : ''} omitido{resultado.omitidos !== 1 ? 's' : ''} (la placa ya existía en la base de datos).</p>
            )}
          </div>

          {/* Advertencias (clases no reconocidas) */}
          {resultado.advertencias.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <TriangleAlert size={13} />
                Advertencias
              </p>
              <ul className="text-sm text-amber-800 space-y-0.5 list-disc list-inside">
                {resultado.advertencias.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores por fila */}
          {resultado.errores.length > 0 && (
            <div className="bg-coral-50 border border-coral-200 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-coral-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} />
                Errores en {resultado.errores.length} fila{resultado.errores.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {resultado.errores.map((e, i) => (
                  <p key={i} className="text-xs text-coral-800 font-mono">
                    Fila {e.fila}{e.placa ? ` (${e.placa})` : ''}: {e.motivo}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Acciones post-carga */}
          <div className="flex gap-3 pt-2">
            {resultado.insertados > 0 && (
              <button
                onClick={() => { reiniciar(); onCargaExitosa(); }}
                className="btn-primary"
              >
                Actualizar tabla
              </button>
            )}
            <button onClick={reiniciar} className="btn-ghost">
              Cargar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
