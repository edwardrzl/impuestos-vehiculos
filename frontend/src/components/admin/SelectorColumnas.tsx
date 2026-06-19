import type { ColumnaConfig } from '../../pages/Admin';

interface Props {
  columnas: ColumnaConfig[];
  onToggle: (clave: string) => void;
}

export default function SelectorColumnas({ columnas, onToggle }: Props) {
  // Excluimos 'placa': es el identificador de fila y siempre debe estar visible.
  const columnasToggleables = columnas.filter((c) => c.clave !== 'placa');

  return (
    <div className="card px-4 py-3 mb-4">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 shrink-0">
          Columnas
        </span>
        {columnasToggleables.map((col) => (
          <label
            key={col.clave}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => onToggle(col.clave)}
              className="w-3.5 h-3.5 accent-navy-700 cursor-pointer"
            />
            <span className="text-sm text-navy-800">{col.etiqueta}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
