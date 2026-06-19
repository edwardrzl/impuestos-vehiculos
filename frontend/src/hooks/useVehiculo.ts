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
  const [refreshKey, setRefreshKey] = useState(0);

  const refrescar = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!placa) {
      setDatos(null);
      return;
    }

    let cancelado = false; // descarta la respuesta si el componente se desmontó o cambió la placa

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const resultado = await consultarVehiculo(placa!);
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

    return () => {
      cancelado = true;
    };
  }, [placa, refreshKey]);

  return { datos, cargando, error, refrescar };
}
