import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import type { DetalleVehiculoAdmin, DatosComprobante, PagoAdmin } from '../../types';
import ModalComprobante from '../ModalComprobante';

interface Props {
  detalle: DetalleVehiculoAdmin | null;
  cargando: boolean;
  onCerrar: () => void;
}

export default function DetalleVehiculo({ detalle, cargando, onCerrar }: Props) {
  const [pagoAbierto, setPagoAbierto] = useState<DatosComprobante | null>(null);

  function abrirComprobante(pago: PagoAdmin) {
    if (!detalle) return;
    setPagoAbierto({
      referencia:    pago.referencia,
      placa:         detalle.vehiculo.placa,
      propietario:   detalle.vehiculo.propietario,
      anios_pagados: JSON.parse(pago.vigencias_pagadas) as number[], // vigencias_pagadas es JSON.stringify(number[]) en BD
      monto_total:   pago.monto_total,
      metodo_pago:   pago.metodo_pago,
      fecha_pago:    pago.fecha_pago,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCerrar}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl
                      bg-white shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4
                        border-b border-stone-200 bg-white sticky top-0 z-10">
          <h2 className="font-display text-xl text-navy-900">
            {cargando || !detalle
              ? 'Cargando...'
              : `${detalle.vehiculo.marca} ${detalle.vehiculo.linea}`}
          </h2>
          <button
            onClick={onCerrar}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500
                       transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {cargando && (
            <div className="flex items-center justify-center py-20 text-stone-400">
              <Loader2 size={28} className="animate-spin mr-3" />
              <span>Cargando detalle...</span>
            </div>
          )}

          {!cargando && detalle && (
            <>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider
                               text-stone-500 mb-3">
                  Datos del vehículo
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Placa', detalle.vehiculo.placa],
                    ['Clase', detalle.vehiculo.clase],
                    ['Marca', detalle.vehiculo.marca],
                    ['Línea', detalle.vehiculo.linea],
                    ['Modelo', String(detalle.vehiculo.modelo)],
                    ['Servicio', detalle.vehiculo.tipo_servicio],
                    ['Capacidad', detalle.vehiculo.capacidad],
                    ['Avalúo', formatCurrency(detalle.vehiculo.avaluo)],
                    ['Propietario', detalle.vehiculo.propietario],
                    ['Documento', detalle.vehiculo.documento_propietario],
                  ].map(([etiqueta, valor]) => (
                    <div key={etiqueta}>
                      <p className="text-xs text-stone-500">{etiqueta}</p>
                      <p className="text-sm font-medium text-navy-900 mt-0.5">
                        {valor}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider
                               text-stone-500 mb-3">
                  Vigencias ({detalle.vigencias.length})
                </h3>
                {detalle.vigencias.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin vigencias registradas</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                          {['Año', 'Valor', 'Descuento', 'Estado', 'Vencimiento', 'Fecha pago'].map(
                            (h) => (
                              <th
                                key={h}
                                className="text-left py-2 px-3 font-semibold
                                           text-stone-600 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {detalle.vigencias.map((v) => (
                          <tr key={v.id}>
                            <td className="py-2 px-3 font-mono font-semibold">
                              {v.anio}
                            </td>
                            <td className="py-2 px-3">{formatCurrency(v.valor)}</td>
                            <td className="py-2 px-3">
                              {v.descuento > 0 ? formatCurrency(v.descuento) : '—'}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  v.estado === 'pagado'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-coral-100 text-coral-700'
                                }`}
                              >
                                {v.estado}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-stone-500">
                              {formatDate(v.fecha_vencimiento)}
                            </td>
                            <td className="py-2 px-3 text-stone-500">
                              {formatDate(v.fecha_pago)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider
                               text-stone-500 mb-3">
                  Pagos registrados ({detalle.pagos.length})
                </h3>
                {detalle.pagos.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin pagos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {detalle.pagos.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-stone-200 px-4 py-3
                                   cursor-pointer hover:bg-stone-50 transition-colors"
                        onClick={() => abrirComprobante(p)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-mono text-xs font-semibold text-navy-700">
                            {p.referencia}
                          </span>
                          <span className="text-sm font-bold text-navy-900">
                            {formatCurrency(p.monto_total)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-stone-500">
                          <span>{p.metodo_pago}</span>
                          <span>{formatDate(p.fecha_pago)}</span>
                          <span className="capitalize">{p.estado}</span>
                          <span className="ml-auto text-navy-600 font-medium">
                            Ver comprobante →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Cabecera navy: pago ya registrado, no un pago recién procesado */}
      {pagoAbierto && (
        <ModalComprobante
          comprobante={pagoAbierto}
          onCerrar={() => setPagoAbierto(null)}
          modoInline
        />
      )}
    </div>
  );
}
