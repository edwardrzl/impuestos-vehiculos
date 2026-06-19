import { Search, X } from 'lucide-react';
import type { FiltrosAdmin } from '../../types';

interface Props {
  filtros: FiltrosAdmin;
  onChange: (campo: keyof FiltrosAdmin, valor: string) => void;
}

const CLASES = ['AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA', 'CAMPERO', 'BUS', 'CAMION'];
const TIPOS_SERVICIO = ['PARTICULAR', 'PUBLICO', 'OFICIAL'];

export default function FiltrosVehiculos({ filtros, onChange }: Props) {
  const hayFiltrosActivos = Object.values(filtros).some((v) => v !== '');

  function limpiarFiltros() {
    (Object.keys(filtros) as (keyof FiltrosAdmin)[]).forEach((k) => onChange(k, ''));
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Placa
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={filtros.placa}
              onChange={(e) => onChange('placa', e.target.value)}
              placeholder="Ej. SLY29E"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-stone-300
                         focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                         font-mono"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Marca
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={filtros.marca}
              onChange={(e) => onChange('marca', e.target.value)}
              placeholder="Ej. Chevrolet"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-stone-300
                         focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Clase
          </label>
          <select
            value={filtros.clase}
            onChange={(e) => onChange('clase', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300
                       focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                       bg-white"
          >
            <option value="">Todas</option>
            {CLASES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[110px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Modelo
          </label>
          <input
            type="number"
            value={filtros.modelo}
            onChange={(e) => onChange('modelo', e.target.value)}
            placeholder="Año"
            min={1990}
            max={2030}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300
                       focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Servicio
          </label>
          <select
            value={filtros.tipo_servicio}
            onChange={(e) => onChange('tipo_servicio', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300
                       focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                       bg-white"
          >
            <option value="">Todos</option>
            {TIPOS_SERVICIO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Estado de pago
          </label>
          <select
            value={filtros.estado_pago}
            onChange={(e) => onChange('estado_pago', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300
                       focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
                       bg-white"
          >
            <option value="">Todos</option>
            <option value="pendiente">Con pendientes</option>
            <option value="al_dia">Al día</option>
          </select>
        </div>

        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="btn-ghost flex items-center gap-1.5 text-sm py-2"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
