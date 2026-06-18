// hooks/useDebounce.ts - Retrasa la actualización de un valor.
// Útil para no disparar una petición de red en cada pulsación de tecla;
// en su lugar, espera a que el usuario deje de escribir.

import { useState, useEffect } from 'react';

/**
 * Devuelve el valor actualizado, pero solo después de que ha pasado
 * `retrasoMs` milisegundos sin que `valor` cambie.
 */
export function useDebounce<T>(valor: T, retrasoMs: number): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);

  useEffect(() => {
    const timer = setTimeout(() => setValorDebounced(valor), retrasoMs);
    // Si el valor cambia antes de que el timer dispare, lo cancelamos y
    // empezamos de nuevo. Así solo se actualiza cuando el usuario "pausa".
    return () => clearTimeout(timer);
  }, [valor, retrasoMs]);

  return valorDebounced;
}
