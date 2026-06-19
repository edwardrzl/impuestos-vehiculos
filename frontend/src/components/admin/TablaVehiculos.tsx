import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import type { Vehiculo } from '../../types';
import type { ColumnaConfig } from '../../pages/Admin';

interface Props {
  vehiculos: Vehiculo[];
  columnas: ColumnaConfig[];       // incluye siempre 'placa' aunque esté oculta en config
  total: number;
  pagina: number;
  porPagina: number;
  cargando: boolean;
  onFilaClick: (placa: string) => void;
  onPaginaAnterior: () => void;
  onPaginaSiguiente: () => void;
}

function formatearCelda(clave: keyof Vehiculo, valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  if (clave === 'avaluo') return formatCurrency(valor as number);
  return String(valor);
}

export default function TablaVehiculos({
  vehiculos,
  columnas,
  total,
  pagina,
  porPagina,
  cargando,
  onFilaClick,
  onPaginaAnterior,
  onPaginaSiguiente,
}: Props) {
  // Placa siempre va primero, independientemente del orden en la config.
  const columnasMostrar = [
    columnas.find((c) => c.clave === 'placa')!,
    ...columnas.filter((c) => c.clave !== 'placa' && c.visible),
  ];

  const totalPaginas = Math.ceil(total / porPagina);
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {columnasMostrar.map((col) => (
                <th
                  key={col.clave}
                  className="text-left py-3 px-4 font-semibold text-stone-600
                             text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {col.etiqueta}
                </th>
              ))}
              <th className="text-left py-3 px-4 font-semibold text-stone-600
                             text-xs uppercase tracking-wider w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {cargando ? (
              <tr>
                <td
                  colSpan={columnasMostrar.length + 1}
                  className="py-16 text-center text-stone-400"
                >
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  <span className="text-sm">Cargando...</span>
                </td>
              </tr>
            ) : vehiculos.length === 0 ? (
              <tr>
                <td
                  colSpan={columnasMostrar.length + 1}
                  className="py-16 text-center text-stone-400 text-sm"
                >
                  No hay vehículos con los filtros actuales
                </td>
              </tr>
            ) : (
              vehiculos.map((v) => (
                <tr
                  key={v.placa}
                  onClick={() => onFilaClick(v.placa)}
                  className="hover:bg-navy-50 cursor-pointer transition-colors"
                >
                  {columnasMostrar.map((col) => (
                    <td
                      key={col.clave}
                      className="py-3 px-4 text-navy-900 whitespace-nowrap"
                    >
                      {col.clave === 'placa' ? (
                        <span className="font-mono font-semibold text-navy-700">
                          {v[col.clave]}
                        </span>
                      ) : (
                        formatearCelda(col.clave, v[col.clave])
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-stone-400 text-xs">›</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!cargando && total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50">
          <span className="text-xs text-stone-500">
            {desde}–{hasta} de {total} vehículos
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onPaginaAnterior}
              disabled={pagina <= 1}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-stone-600 px-2 font-medium">
              {pagina} / {totalPaginas}
            </span>
            <button
              onClick={onPaginaSiguiente}
              disabled={pagina >= totalPaginas}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
