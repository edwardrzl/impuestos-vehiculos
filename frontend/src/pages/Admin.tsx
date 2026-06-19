import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, List, Upload, CalendarPlus } from 'lucide-react';
import {
  obtenerStatsAdmin,
  listarVehiculosAdmin,
  obtenerDetalleVehiculoAdmin,
} from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import StatsCards from '../components/admin/StatsCards';
import FiltrosVehiculos from '../components/admin/FiltrosVehiculos';
import SelectorColumnas from '../components/admin/SelectorColumnas';
import TablaVehiculos from '../components/admin/TablaVehiculos';
import DetalleVehiculo from '../components/admin/DetalleVehiculo';
import CargaCSV from '../components/admin/CargaCSV';
import CrearVigencias from '../components/admin/CrearVigencias';
import type {
  StatsAdmin,
  ListaVehiculosAdmin,
  DetalleVehiculoAdmin,
  FiltrosAdmin,
} from '../types';
import type { Vehiculo } from '../types';

export interface ColumnaConfig {
  clave: keyof Vehiculo;
  etiqueta: string;
  visible: boolean;
}

const COLUMNAS_INICIAL: ColumnaConfig[] = [
  { clave: 'placa',                etiqueta: 'Placa',       visible: true  },
  { clave: 'clase',                etiqueta: 'Clase',       visible: true  },
  { clave: 'marca',                etiqueta: 'Marca',       visible: true  },
  { clave: 'linea',                etiqueta: 'Línea',       visible: true  },
  { clave: 'modelo',               etiqueta: 'Modelo',      visible: true  },
  { clave: 'tipo_servicio',        etiqueta: 'Servicio',    visible: false },
  { clave: 'capacidad',            etiqueta: 'Capacidad',   visible: false },
  { clave: 'avaluo',               etiqueta: 'Avalúo',      visible: true  },
  { clave: 'propietario',          etiqueta: 'Propietario', visible: true  },
  { clave: 'documento_propietario',etiqueta: 'Documento',   visible: false },
];

const FILTROS_INICIAL: FiltrosAdmin = {
  placa: '',
  marca: '',
  clase: '',
  modelo: '',
  tipo_servicio: '',
  estado_pago: '',
};

type Pestana = 'vehiculos' | 'carga_csv' | 'crear_vigencias';

export default function Admin() {
  const [pestana,         setPestana]         = useState<Pestana>('vehiculos');
  const [stats,           setStats]           = useState<StatsAdmin | null>(null);
  const [lista,           setLista]           = useState<ListaVehiculosAdmin | null>(null);
  const [detalle,         setDetalle]         = useState<DetalleVehiculoAdmin | null>(null);
  const [placaDetalle,    setPlacaDetalle]    = useState<string | null>(null);
  const [filtros,         setFiltros]         = useState<FiltrosAdmin>(FILTROS_INICIAL);
  const [pagina,          setPagina]          = useState(1);
  const [columnas,        setColumnas]        = useState<ColumnaConfig[]>(COLUMNAS_INICIAL);
  const [cargandoLista,   setCargandoLista]   = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [refrescarKey,    setRefrescarKey]    = useState(0);

  // Debounce de 350 ms: evita un fetch por cada tecla en los inputs de filtro.
  const filtrosDebounced = useDebounce(filtros, 350);

  // Detecta si cambiaron los filtros (vs. solo la página) para resetear a página 1.
  const filtrosPrevRef = useRef(filtrosDebounced);

  useEffect(() => {
    if (pestana !== 'vehiculos') return;
    obtenerStatsAdmin().then(setStats).catch(console.error);
  }, [refrescarKey, pestana]);

  useEffect(() => {
    if (pestana !== 'vehiculos') return;

    const filtrosCambiaron = filtrosPrevRef.current !== filtrosDebounced;
    filtrosPrevRef.current = filtrosDebounced;

    // Cuando cambian los filtros, usa página 1 sin esperar el re-render de setPagina.
    const paginaReal = filtrosCambiaron ? 1 : pagina;
    if (filtrosCambiaron && pagina !== 1) setPagina(1);

    setCargandoLista(true);
    listarVehiculosAdmin(filtrosDebounced, paginaReal)
      .then(setLista)
      .catch(console.error)
      .finally(() => setCargandoLista(false));
  }, [filtrosDebounced, pagina, refrescarKey, pestana]);

  useEffect(() => {
    if (!placaDetalle) { setDetalle(null); return; }

    setCargandoDetalle(true);
    obtenerDetalleVehiculoAdmin(placaDetalle)
      .then(setDetalle)
      .catch(console.error)
      .finally(() => setCargandoDetalle(false));
  }, [placaDetalle]);

  function actualizarFiltro(campo: keyof FiltrosAdmin, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleColumna(clave: string) {
    setColumnas((prev) =>
      prev.map((c) => (c.clave === clave ? { ...c, visible: !c.visible } : c))
    );
  }

  function alCargaExitosa() {
    setRefrescarKey((k) => k + 1);
    setPestana('vehiculos');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck size={22} className="text-navy-600" />
          <h1 className="font-display text-2xl text-navy-900">
            Panel de administración
          </h1>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          <TabButton
            activa={pestana === 'vehiculos'}
            onClick={() => setPestana('vehiculos')}
            icono={<List size={15} />}
          >
            Vehículos
          </TabButton>
          <TabButton
            activa={pestana === 'carga_csv'}
            onClick={() => setPestana('carga_csv')}
            icono={<Upload size={15} />}
          >
            Cargar CSV
          </TabButton>
          <TabButton
            activa={pestana === 'crear_vigencias'}
            onClick={() => setPestana('crear_vigencias')}
            icono={<CalendarPlus size={15} />}
          >
            Crear Vigencias
          </TabButton>
        </div>

        {pestana === 'vehiculos' && (
          <>
            {stats && <StatsCards stats={stats} />}
            <FiltrosVehiculos filtros={filtros} onChange={actualizarFiltro} />
            <SelectorColumnas columnas={columnas} onToggle={toggleColumna} />
            <TablaVehiculos
              vehiculos={lista?.vehiculos ?? []}
              columnas={columnas}
              total={lista?.total ?? 0}
              pagina={pagina}
              porPagina={lista?.por_pagina ?? 20}
              cargando={cargandoLista}
              onFilaClick={(placa) => setPlacaDetalle(placa)}
              onPaginaAnterior={() => setPagina((p) => Math.max(1, p - 1))}
              onPaginaSiguiente={() => setPagina((p) => p + 1)}
            />
          </>
        )}

        {pestana === 'carga_csv' && (
          <CargaCSV onCargaExitosa={alCargaExitosa} />
        )}

        {pestana === 'crear_vigencias' && (
          <CrearVigencias />
        )}
      </div>

      {placaDetalle && (
        <DetalleVehiculo
          detalle={detalle}
          cargando={cargandoDetalle}
          onCerrar={() => setPlacaDetalle(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  activa,
  onClick,
  icono,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                  border-b-2 transition-colors -mb-px
                  ${activa
                    ? 'border-navy-700 text-navy-900'
                    : 'border-transparent text-stone-500 hover:text-navy-700 hover:border-stone-300'
                  }`}
    >
      {icono}
      {children}
    </button>
  );
}
