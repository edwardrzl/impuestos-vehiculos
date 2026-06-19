import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, List, Upload, CalendarPlus, ClipboardList, AlertCircle } from 'lucide-react';
import {
  obtenerStatsAdmin,
  listarVehiculosAdmin,
  obtenerDetalleVehiculoAdmin,
  listarSolicitudesTraspaso,
} from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import StatsCards from '../components/admin/StatsCards';
import FiltrosVehiculos from '../components/admin/FiltrosVehiculos';
import SelectorColumnas from '../components/admin/SelectorColumnas';
import TablaVehiculos from '../components/admin/TablaVehiculos';
import DetalleVehiculo from '../components/admin/DetalleVehiculo';
import CargaCSV from '../components/admin/CargaCSV';
import CrearVigencias from '../components/admin/CrearVigencias';
import SolicitudesTraspaso from '../components/admin/SolicitudesTraspaso';
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

type Pestana = 'vehiculos' | 'carga_csv' | 'crear_vigencias' | 'solicitudes_traspaso';

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

  // Contador de traspasos pendientes: se carga por separado de /stats porque
  // viene de un endpoint distinto (solicitudes-traspaso) y debe estar visible
  // incluso cuando la pestaña de solicitudes no está activa.
  const [pendientesTraspaso, setPendientesTraspaso] = useState<number | null>(null);

  // Debounce de 350 ms: evita un fetch por cada tecla en los inputs de filtro.
  const filtrosDebounced = useDebounce(filtros, 350);

  // Detecta si cambiaron los filtros (vs. solo la página) para resetear a página 1.
  const filtrosPrevRef = useRef(filtrosDebounced);

  // Carga el contador de traspasos pendientes al montar la página.
  useEffect(() => {
    listarSolicitudesTraspaso('pendiente')
      .then((lista) => setPendientesTraspaso(lista.length))
      .catch(() => { /* silencioso */ });
  }, []);

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
          <TabButton
            activa={pestana === 'solicitudes_traspaso'}
            onClick={() => setPestana('solicitudes_traspaso')}
            icono={<ClipboardList size={15} />}
            badge={pendientesTraspaso ?? undefined}
          >
            Solicitudes
          </TabButton>
        </div>

        {pestana === 'vehiculos' && (
          <>
            {stats && <StatsCards stats={stats} />}

            {/* Aviso de traspasos pendientes: se muestra solo si hay alguno,
                con enlace directo a la pestaña de solicitudes. */}
            {pendientesTraspaso != null && pendientesTraspaso > 0 && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg
                              bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  {pendientesTraspaso} solicitud
                  {pendientesTraspaso !== 1 ? 'es' : ''} de traspaso pendiente
                  {pendientesTraspaso !== 1 ? 's' : ''} de revisión.{' '}
                  <button
                    onClick={() => setPestana('solicitudes_traspaso')}
                    className="underline font-medium hover:text-amber-900 transition-colors"
                  >
                    Revisar
                  </button>
                </span>
              </div>
            )}

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

        {pestana === 'solicitudes_traspaso' && (
          <SolicitudesTraspaso
            onPendientesChange={(n) => setPendientesTraspaso(n)}
          />
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
  badge,
}: {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
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
      {badge != null && badge > 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white
                         text-[11px] font-bold leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
