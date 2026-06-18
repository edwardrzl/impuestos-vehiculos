// pages/VehicleDetail.tsx - Pantalla principal del proyecto.
// Muestra la información del vehículo, la lista de vigencias,
// y permite seleccionar y pagar las pendientes.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Car,
} from 'lucide-react';

import { useVehiculo } from '../hooks/useVehiculo';
import { procesarPago } from '../api/client';
import { formatCurrency } from '../utils/format';
import type { DatosComprobante } from '../types';

import VigenciaRow from '../components/VigenciaRow';
import BarraPago from '../components/BarraPago';
import ModalPasarela from '../components/ModalPasarela';
import ModalComprobante from '../components/ModalComprobante';

export default function VehicleDetail() {
  const { placa = '' } = useParams<{ placa: string }>();
  const navigate = useNavigate();

  // Hook custom: encapsula loading, error, datos y refresh.
  const { datos, cargando, error, refrescar } = useVehiculo(placa);

  // === ESTADO LOCAL DE LA PÁGINA ===
  const [seleccionadas,   setSeleccionadas]   = useState<number[]>([]);
  const [mostrarPasarela, setMostrarPasarela] = useState(false);
  const [comprobante,     setComprobante]     = useState<DatosComprobante | null>(null);

  // === HANDLERS ===

  function toggleVigencia(id: number) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function seleccionarTodasPendientes() {
    if (!datos) return;
    const idsPendientes = datos.vigencias
      .filter((v) => v.estado === 'pendiente')
      .map((v) => v.id);
    setSeleccionadas(idsPendientes);
  }

  // Llamado desde ModalPasarela tras el delay simulado. Lanza si el backend falla
  // (el modal captura el error y lo muestra en pantalla sin alertas nativas).
  async function ejecutarPago(): Promise<void> {
    const resultado = await procesarPago({
      placa,
      vigenciasIds: seleccionadas,
      metodoPago: 'TARJETA_CREDITO',
    });
    setComprobante({
      referencia:    resultado.referencia,
      placa:         resultado.placa,
      propietario:   resultado.propietario,
      anios_pagados: resultado.vigencias.map((v) => v.anio),
      monto_total:   resultado.monto_total,
      metodo_pago:   resultado.metodo_pago,
      fecha_pago:    resultado.fecha_pago,
    });
    setMostrarPasarela(false);
  }

  function cerrarComprobante() {
    setComprobante(null);
    setSeleccionadas([]);
    refrescar(); // Trae los datos actualizados (con las vigencias ya pagadas)
  }

  // === RENDERIZADO POR ESTADO ===

  if (cargando && !datos) {
    return <PantallaCargando />;
  }

  if (error && !datos) {
    return <PantallaError mensaje={error} onVolver={() => navigate('/')} />;
  }

  if (!datos) return null;

  const { vehiculo, vigencias, resumen } = datos;
  const totalSeleccionado = vigencias
    .filter((v) => seleccionadas.includes(v.id))
    .reduce((sum, v) => sum + v.valor - v.descuento, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper pb-32">
      {/* === Sub-navegación === */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-14 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-navy-700 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <span className="mx-3 text-stone-300">/</span>
          <span className="text-sm text-stone-600">Detalle del vehículo</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* === COLUMNA IZQUIERDA: Info y vigencias === */}
          <div className="lg:col-span-2 space-y-5">
            {/* Cabecera del vehículo */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-navy-50 rounded-xl flex items-center justify-center">
                  <Car className="text-navy-700" size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap mb-1">
                    <h1 className="font-display text-4xl text-navy-900 leading-none">
                      {vehiculo.placa}
                    </h1>
                    <BadgeEstado estado={resumen.estado_general} />
                  </div>
                  <p className="text-sm text-stone-700">
                    {vehiculo.clase} {vehiculo.marca}{' '}
                    <span className="text-stone-500">{vehiculo.linea}</span>
                    {' · '}Modelo {vehiculo.modelo}
                    {' · '}
                    {vehiculo.tipo_servicio}
                  </p>
                  <p className="text-xs text-stone-500 mt-2">
                    Propietario:{' '}
                    <span className="font-medium text-stone-700">
                      {vehiculo.propietario}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de vigencias */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-navy-900">
                    Vigencias del impuesto
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {resumen.vigencias_pendientes > 0
                      ? `Selecciona las vigencias que deseas pagar`
                      : `Todas las vigencias están al día`}
                  </p>
                </div>

                {resumen.vigencias_pendientes > 1 && (
                  <button
                    onClick={seleccionarTodasPendientes}
                    className="text-xs font-semibold text-navy-700 hover:text-coral-600 transition-colors"
                  >
                    Seleccionar todas
                  </button>
                )}
              </div>

              <div className="divide-y divide-stone-100">
                {vigencias.map((vigencia) => (
                  <VigenciaRow
                    key={vigencia.id}
                    vigencia={vigencia}
                    seleccionada={seleccionadas.includes(vigencia.id)}
                    onClick={() => toggleVigencia(vigencia.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* === COLUMNA DERECHA: Resumen / Liquidación === */}
          <aside className="space-y-5">
            <div className="card p-6 lg:sticky lg:top-6">
              <h3 className="font-semibold text-navy-900 mb-4">
                Resumen del vehículo
              </h3>

              <dl className="space-y-3 text-sm">
                <FilaResumen label="Clase" value={vehiculo.clase} />
                <FilaResumen label="Marca / Línea" value={`${vehiculo.marca} ${vehiculo.linea}`} />
                <FilaResumen label="Capacidad" value={vehiculo.capacidad} />
                <FilaResumen
                  label="Avalúo comercial"
                  value={formatCurrency(vehiculo.avaluo)}
                />
                <FilaResumen
                  label="Total vigencias"
                  value={resumen.total_vigencias.toString()}
                />
                <FilaResumen
                  label="Vigencias pendientes"
                  value={resumen.vigencias_pendientes.toString()}
                  destacado={resumen.vigencias_pendientes > 0}
                />
              </dl>

              {resumen.total_deuda > 0 && (
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">
                    Deuda total
                  </p>
                  <p className="font-display text-4xl text-coral-600 tabular-nums">
                    {formatCurrency(resumen.total_deuda)}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-stone-500 leading-relaxed mt-6 pt-6 border-t border-stone-200">
                Si los datos no corresponden a las características de tu
                vehículo, comunícate con la entidad correspondiente para
                actualizarlos.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* === BARRA INFERIOR DE PAGO === */}
      {seleccionadas.length > 0 && !comprobante && !mostrarPasarela && (
        <BarraPago
          cantidad={seleccionadas.length}
          total={totalSeleccionado}
          procesando={false}
          onPagar={() => setMostrarPasarela(true)}
        />
      )}

      {/* === PASARELA DE PAGO === */}
      {mostrarPasarela && !comprobante && (
        <ModalPasarela
          total={totalSeleccionado}
          cantidad={seleccionadas.length}
          onConfirmar={ejecutarPago}
          onCancelar={() => setMostrarPasarela(false)}
        />
      )}

      {/* === MODAL DE COMPROBANTE === */}
      {comprobante && (
        <ModalComprobante
          comprobante={comprobante}
          onCerrar={cerrarComprobante}
        />
      )}
    </div>
  );
}

// === SUB-COMPONENTES PRIVADOS DEL ARCHIVO ===
// Como solo se usan aquí, no vale la pena ponerlos en archivos separados.

function PantallaCargando() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-600">
        <Loader2 className="animate-spin text-navy-700" size={32} />
        <p className="text-sm">Consultando vehículo...</p>
      </div>
    </div>
  );
}

function PantallaError({
  mensaje,
  onVolver,
}: {
  mensaje: string;
  onVolver: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="inline-flex w-14 h-14 bg-coral-50 text-coral-600 rounded-full items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="font-display text-2xl text-navy-900 mb-2">
          Vehículo no encontrado
        </h2>
        <p className="text-sm text-stone-600 mb-6">{mensaje}</p>
        <button onClick={onVolver} className="btn-primary">
          <ArrowLeft size={16} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: 'al_dia' | 'con_deuda' }) {
  if (estado === 'al_dia') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
        <CheckCircle2 size={12} />
        Al día
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-coral-50 text-coral-700 rounded-full text-xs font-semibold">
      <AlertCircle size={12} />
      Con deuda
    </span>
  );
}

function FilaResumen({
  label,
  value,
  destacado = false,
}: {
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <dt className="text-stone-500 text-xs uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={`font-medium text-right ${
          destacado ? 'text-coral-600' : 'text-navy-900'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
