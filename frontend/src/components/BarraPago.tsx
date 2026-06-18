// components/BarraPago.tsx - Barra fija inferior que aparece cuando
// hay vigencias seleccionadas. Muestra el resumen y el botón para pagar.

import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface BarraPagoProps {
  cantidad: number;
  total: number;
  procesando: boolean;
  onPagar: () => void;
}

export default function BarraPago({
  cantidad,
  total,
  procesando,
  onPagar,
}: BarraPagoProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-navy-900 text-white
                 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-slide-up z-30"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Cantidad de vigencias seleccionadas */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coral-500 rounded-lg flex items-center justify-center font-semibold">
              {cantidad}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-200">
                {cantidad === 1 ? 'Vigencia seleccionada' : 'Vigencias seleccionadas'}
              </div>
              <div className="text-sm text-navy-100">
                Listo para procesar el pago
              </div>
              
            </div>
          </div>

          {/* Total a pagar */}
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-navy-200">
              Total a pagar
            </div>
            <div className="font-display text-3xl tabular-nums">
              {formatCurrency(total)}
            </div>
          </div>

          {/* Botón de pago */}
          <button
            onClick={onPagar}
            disabled={procesando}
            className="btn-accent px-8 py-3 text-base min-w-[180px]"
          >
            {procesando ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Procesando...
              </>
            ) : (
              <>Continuar al pago</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
