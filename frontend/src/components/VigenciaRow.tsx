import { Check, Lock } from 'lucide-react';
import type { Vigencia } from '../types';
import { formatCurrency } from '../utils/format';

interface VigenciaRowProps {
  vigencia: Vigencia;
  seleccionada: boolean;
  onClick: () => void;
}

export default function VigenciaRow({ vigencia, seleccionada, onClick }: VigenciaRowProps) {
  const esPendiente = vigencia.estado === 'pendiente';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!esPendiente}
      className={`
        w-full px-5 py-4 flex items-center gap-4 text-left
        transition-all duration-150
        ${
          seleccionada
            ? 'bg-coral-50 border-l-4 border-coral-500'
            : esPendiente
            ? 'border-l-4 border-transparent hover:bg-stone-50 cursor-pointer'
            : 'border-l-4 border-transparent cursor-default opacity-60'
        }
      `}
    >
      <span className="font-display text-3xl text-navy-900 w-16">
        {vigencia.anio}
      </span>

      <span
        className={`flex-1 text-sm font-medium ${
          esPendiente ? 'text-coral-600' : 'text-stone-500'
        }`}
      >
        {esPendiente ? 'Con deuda pendiente' : 'Pagado'}
        {vigencia.fecha_pago && (
          <span className="block text-xs text-stone-400 font-normal mt-0.5">
            Pagado en {new Date(vigencia.fecha_pago).toLocaleDateString('es-CO')}
          </span>
        )}
        {(vigencia.fecha_vencimiento) &&
        (new Date(vigencia.fecha_vencimiento) > new Date()) &&(
          <>
          <span className="block text-xs text-stone-400 font-normal mt-0.5">
            Descuento disponible de {formatCurrency(vigencia.descuento)} hasta el {new Date(vigencia.fecha_vencimiento).toLocaleDateString('es-CO')}.
          </span>
          <span className="block text-xs text-stone-400 font-normal mt-0.5">
            Sin descuento: {formatCurrency(vigencia.valor)}
          </span>
          </>
        )}
      </span>

      <span className="font-semibold text-navy-900 w-32 text-right tabular-nums">
        {formatCurrency(vigencia.valor - vigencia.descuento)}
      </span>

      <span className="w-7 flex justify-center">
        {seleccionada ? (
          <span className="w-6 h-6 bg-coral-500 rounded-md flex items-center justify-center shadow-sm">
            <Check className="text-white" size={14} strokeWidth={3} />
          </span>
        ) : esPendiente ? (
          <span className="w-5 h-5 rounded-md border-2 border-stone-300" />
        ) : (
          <Lock className="text-stone-300" size={16} />
        )}
      </span>
    </button>
  );
}
