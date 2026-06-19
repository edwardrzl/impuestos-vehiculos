import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowRight, Receipt, Search, Loader2, AlertCircle } from 'lucide-react';
import BuscadorPlaca from '../components/BuscadorPlaca';
import ModalComprobante from '../components/ModalComprobante';
import { consultarPagoPorReferencia } from '../api/client';
import type { DatosComprobante } from '../types';

const PLACAS_PRUEBA = ['SLY29E', 'ABC123', 'XYZ789', 'MOT001', 'WXY456'];

export default function Home() {
  const navigate = useNavigate();

  const [referencia,    setReferencia]    = useState('');
  const [buscando,      setBuscando]      = useState(false);
  const [comprobante,   setComprobante]   = useState<DatosComprobante | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  function manejarBusqueda(placa: string) {
    navigate(`/vehiculo/${placa}`);
  }

  async function buscarPorReferencia() {
    const ref = referencia.trim().toUpperCase();
    if (!ref) return;

    setBuscando(true);
    setComprobante(null);
    setErrorBusqueda(null);

    try {
      const resultado = await consultarPagoPorReferencia(ref);
      setComprobante(resultado);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : '';
      if (
        mensaje.toLowerCase().includes('no encontrado') ||
        mensaje.toLowerCase().includes('not found')
      ) {
        setErrorBusqueda('No se encontró ningún pago con esa referencia.');
      } else {
        setErrorBusqueda('Error de conexión. Intenta de nuevo más tarde.');
      }
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper flex items-center">
      <div className="w-full max-w-3xl mx-auto px-6 py-12 lg:py-20">
        <div className="mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-coral-50 text-coral-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
            <Car size={14} />
            Servicio en línea
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-navy-900 leading-[1.05] mb-4">
            Consulta y paga el{' '}
            <em className="text-coral-500">impuesto</em> de tu vehículo
          </h1>

          <p className="text-lg text-stone-600 max-w-xl leading-relaxed">
            Ingresa la placa de tu vehículo para ver el estado de tus vigencias
            y realizar el pago de forma ágil y segura.
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <BuscadorPlaca onBuscar={manejarBusqueda} />

          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-3">
              Placas de prueba
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACAS_PRUEBA.map((placa) => (
                <button
                  key={placa}
                  onClick={() => manejarBusqueda(placa)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5
                             font-mono text-xs font-semibold tracking-wider
                             bg-stone-100 text-navy-800 rounded-lg
                             hover:bg-navy-900 hover:text-white
                             transition-colors"
                >
                  {placa}
                  <ArrowRight
                    size={12}
                    className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
              <Receipt size={13} />
              ¿Ya tienes una referencia de pago?
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="card p-5 md:p-6">
            <p className="text-sm text-stone-500 mb-4">
              Ingresa el número de referencia para consultar y descargar tu comprobante.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={referencia}
                onChange={(e) => {
                  setReferencia(e.target.value);
                  if (comprobante)   setComprobante(null);
                  if (errorBusqueda) setErrorBusqueda(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && buscarPorReferencia()}
                placeholder="Ej. PAG-1718000000000-AB1CD"
                className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300
                           text-sm font-mono placeholder:font-sans placeholder:text-stone-400
                           focus:outline-none focus:ring-2 focus:ring-navy-300
                           focus:border-navy-400 transition-colors"
              />
              <button
                onClick={buscarPorReferencia}
                disabled={buscando || !referencia.trim()}
                className="btn-primary px-4"
              >
                {buscando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                <span className="hidden sm:inline">
                  {buscando ? 'Buscando...' : 'Buscar'}
                </span>
              </button>
            </div>

            {errorBusqueda && (
              <div className="mt-4 flex items-start gap-2.5 text-sm text-coral-700
                              bg-coral-50 border border-coral-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {errorBusqueda}
              </div>
            )}
          </div>

          {/* Cabecera navy: comprobante consultado por referencia, no por pago reciente */}
          {comprobante && (
            <ModalComprobante
              comprobante={comprobante}
              onCerrar={() => setComprobante(null)}
              modoInline
            />
          )}
        </div>

        <p className="text-xs text-stone-500 text-center mt-8 max-w-md mx-auto">
          Este es un proyecto educativo. Las vigencias y datos de vehículos son
          de prueba y no corresponden a información real.
        </p>
      </div>
    </div>
  );
}
