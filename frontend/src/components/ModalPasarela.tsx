// components/ModalPasarela.tsx - Formulario de tarjeta simulado.
// Valida los campos en el frontend, simula un delay de pasarela de 2-3 s y
// llama a onConfirmar() (que dispara el endpoint real de pago).

import { useState, useEffect } from 'react';
import { CreditCard, Lock, Loader2, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface Props {
  total: number;
  cantidad: number;
  // Función async que llama al endpoint de pago. Lanza si falla.
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}

interface ErroresCampos {
  numero?: string;
  nombre?: string;
  vencimiento?: string;
  cvv?: string;
}

// Agrupa en bloques de 4 separados por espacio. Ej: "4111111111111111" → "4111 1111 1111 1111"
function formatearNumero(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 16);
  return digitos.replace(/(.{4})/g, '$1 ').trim();
}

// Inserta "/" después de los dos primeros dígitos. Ej: "1226" → "12/26"
function formatearVencimiento(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

// La tarjeta es válida si el primer día del mes SIGUIENTE al vencimiento es futuro.
function vencimientoEsValido(valor: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(valor)) return false;
  const mes = parseInt(valor.slice(0, 2), 10);
  const anio = 2000 + parseInt(valor.slice(3), 10);
  if (mes < 1 || mes > 12) return false;
  return new Date(anio, mes, 1) > new Date();
}

export default function ModalPasarela({ total, cantidad, onConfirmar, onCancelar }: Props) {
  const [numero,      setNumero]      = useState('');
  const [nombre,      setNombre]      = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv,         setCvv]         = useState('');
  const [errores,     setErrores]     = useState<ErroresCampos>({});
  const [procesando,  setProcesando]  = useState(false);
  const [errorPago,   setErrorPago]   = useState<string | null>(null);

  // Escape cierra el modal (solo si no está procesando)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !procesando) onCancelar();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [procesando, onCancelar]);

  function validar(): ErroresCampos {
    const errs: ErroresCampos = {};
    if (numero.replace(/\s/g, '').length !== 16) errs.numero      = 'Debe tener exactamente 16 dígitos';
    if (!nombre.trim())                           errs.nombre      = 'Campo obligatorio';
    if (!vencimientoEsValido(vencimiento))        errs.vencimiento = 'Fecha inválida o vencida';
    if (!/^\d{3,4}$/.test(cvv))                   errs.cvv         = 'Debe tener 3 o 4 dígitos';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }

    setErrores({});
    setErrorPago(null);
    setProcesando(true);

    try {
      // Delay que simula el tiempo de respuesta de una pasarela real
      await new Promise<void>((r) => setTimeout(r, 2000 + Math.random() * 1000));
      await onConfirmar();
      // Si llega aquí sin error, VehicleDetail mostrará el comprobante y
      // desmontará este modal — no necesitamos hacer nada más.
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : 'Error al procesar el pago');
      setProcesando(false);
    }
  }

  // Clase dinámica para inputs: resalta en coral si tiene error
  function claseInput(campo: keyof ErroresCampos) {
    return `w-full px-4 py-2.5 rounded-lg border text-navy-900 placeholder:text-stone-400
            focus:outline-none focus:ring-2 focus:border-transparent transition-shadow
            ${errores[campo]
              ? 'border-coral-400 focus:ring-coral-400'
              : 'border-stone-300 focus:ring-navy-500'
            }`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
      onClick={() => { if (!procesando) onCancelar(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-navy-800 to-navy-900 text-white">
          {!procesando && (
            <button
              type="button"
              onClick={onCancelar}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              aria-label="Cancelar pago"
            >
              <X size={20} />
            </button>
          )}
          <div className="inline-flex w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
            <CreditCard size={34} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-3xl">Datos de pago</h2>
          <p className="text-sm mt-1 text-navy-200">
            {cantidad === 1 ? '1 vigencia' : `${cantidad} vigencias`}
            {' · '}
            {formatCurrency(total)}
          </p>
        </div>

        <div className="p-6">
          {/* Estado de procesamiento: reemplaza el formulario */}
          {procesando ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={40} className="animate-spin text-navy-700" />
              <p className="text-sm font-medium text-stone-700">Procesando pago...</p>
              <p className="text-xs text-stone-400">Por favor espera, no cierres la ventana</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Número de tarjeta */}
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={numero}
                  maxLength={19} // 16 dígitos + 3 espacios
                  onChange={(e) => {
                    setNumero(formatearNumero(e.target.value));
                    if (errores.numero) setErrores((p) => ({ ...p, numero: undefined }));
                  }}
                  className={claseInput('numero')}
                />
                {errores.numero && (
                  <p className="text-xs text-coral-600 mt-1">{errores.numero}</p>
                )}
              </div>

              {/* Nombre del titular */}
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  placeholder="Como aparece en la tarjeta"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value.toUpperCase());
                    if (errores.nombre) setErrores((p) => ({ ...p, nombre: undefined }));
                  }}
                  className={claseInput('nombre')}
                />
                {errores.nombre && (
                  <p className="text-xs text-coral-600 mt-1">{errores.nombre}</p>
                )}
              </div>

              {/* Vencimiento + CVV en la misma fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-800 mb-1.5">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={vencimiento}
                    maxLength={5} // "MM/AA"
                    onChange={(e) => {
                      setVencimiento(formatearVencimiento(e.target.value));
                      if (errores.vencimiento) setErrores((p) => ({ ...p, vencimiento: undefined }));
                    }}
                    className={claseInput('vencimiento')}
                  />
                  {errores.vencimiento && (
                    <p className="text-xs text-coral-600 mt-1">{errores.vencimiento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-800 mb-1.5">
                    CVV
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="•••"
                    value={cvv}
                    maxLength={4}
                    onChange={(e) => {
                      setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (errores.cvv) setErrores((p) => ({ ...p, cvv: undefined }));
                    }}
                    className={claseInput('cvv')}
                  />
                  {errores.cvv && (
                    <p className="text-xs text-coral-600 mt-1">{errores.cvv}</p>
                  )}
                </div>
              </div>

              {/* Error que vino del backend */}
              {errorPago && (
                <div className="flex items-start gap-2.5 text-sm text-coral-700
                                bg-coral-50 border border-coral-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {errorPago}
                </div>
              )}

              {/* Indicador de seguridad */}
              <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
                <Lock size={12} />
                <span>Conexión cifrada. Tus datos están protegidos.</span>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Pagar {formatCurrency(total)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
