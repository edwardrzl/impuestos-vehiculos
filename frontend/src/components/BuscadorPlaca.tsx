// components/BuscadorPlaca.tsx - Input + botón para buscar por placa.
// Maneja su propio estado interno (lo que el usuario tipea) y
// expone una sola prop: onBuscar(placa), que se llama cuando
// el usuario confirma la búsqueda.

import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

interface BuscadorPlacaProps {
  onBuscar: (placa: string) => void;
  cargando?: boolean;
}

export default function BuscadorPlaca({ onBuscar, cargando = false }: BuscadorPlacaProps) {
  const [placa, setPlaca] = useState('');
  const [errorLocal, setErrorLocal] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const limpia = placa.toUpperCase().trim().replace(/\s/g, '');

    if (limpia.length < 5 || limpia.length > 7) {
      setErrorLocal('La placa debe tener entre 5 y 7 caracteres');
      return; 
    }

    setErrorLocal('');
    onBuscar(limpia);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="placa"
        className="block text-xs uppercase tracking-wider text-navy-700 font-semibold mb-2"
      >
        Placa del vehículo
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="placa"
          type="text"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={7}
          autoComplete="off"
          autoFocus
          className="flex-1 px-5 py-4 text-2xl font-mono font-semibold tracking-[0.2em]
                     bg-white border border-stone-300 rounded-xl
                     placeholder:text-stone-300 placeholder:tracking-[0.2em]
                     focus:outline-none focus:ring-4 focus:ring-navy-100
                     focus:border-navy-700 transition-all"
        />
        <button
          type="submit"
          disabled={!placa.trim() || cargando}
          className="btn-primary px-8 text-base"
        >
          <Search size={18} />
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {errorLocal && (
        <p className="mt-3 text-sm text-coral-600 animate-slide-down">
          {errorLocal}
        </p>
      )}
    </form>
  );
}
