// hooks/useVehiculo.ts - Custom hook que encapsula la lógica de
// cargar un vehículo, manejar loading/error y permitir refrescar.
//
// Beneficios:
//   - El componente que lo usa queda mucho más limpio.
//   - Si en el futuro otra pantalla necesita un vehículo, reusa este hook.
//   - La lógica de fetch + estados está en un solo lugar.

import { useEffect, useState, useCallback } from 'react';
import { consultarVehiculo } from '../api/client';
import type { VehiculoConVigencias } from '../types';

interface UseVehiculoResult {
  datos: VehiculoConVigencias | null;
  cargando: boolean;
  error: string | null;
  refrescar: () => void;
}

export function useVehiculo(placa: string | null): UseVehiculoResult {
  const [datos, setDatos] = useState<VehiculoConVigencias | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contador que se incrementa cada vez que queremos refrescar.
  // Lo agregamos a las dependencias del useEffect.
  const [refreshKey, setRefreshKey] = useState(0);

  // useCallback "estabiliza" la función entre renders para evitar
  // que componentes hijos se rerendericen innecesariamente.
  const refrescar = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!placa) {
      setDatos(null);
      return;
    }

    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const resultado = await consultarVehiculo(placa!);
        // Si el componente se desmontó o cambió la placa antes de
        // que llegara la respuesta, descartamos el resultado.
        if (!cancelado) {
          setDatos(resultado);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'Error al consultar');
          setDatos(null);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargar();

    // Función de limpieza: se ejecuta antes de la siguiente ejecución
    // del effect o cuando el componente se desmonta.
    return () => {
      cancelado = true;
    };
  }, [placa, refreshKey]);

  return { datos, cargando, error, refrescar };
}
