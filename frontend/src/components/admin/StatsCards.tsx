import { Car, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import type { StatsAdmin } from '../../types';

interface Props {
  stats: StatsAdmin;
}

interface TarjetaConfig {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  colorIcono: string;
}

export default function StatsCards({ stats }: Props) {
  const tarjetas: TarjetaConfig[] = [
    {
      titulo: 'Total vehículos',
      valor: stats.total_vehiculos.toLocaleString('es-CO'),
      icono: <Car size={20} />,
      colorIcono: 'text-navy-600 bg-navy-50',
    },
    {
      titulo: 'Vigencias pendientes',
      valor: stats.vigencias_pendientes.toLocaleString('es-CO'),
      icono: <Clock size={20} />,
      colorIcono: 'text-coral-600 bg-coral-50',
    },
    {
      titulo: 'Vigencias pagadas',
      valor: stats.vigencias_pagadas.toLocaleString('es-CO'),
      icono: <CheckCircle size={20} />,
      colorIcono: 'text-green-600 bg-green-50',
    },
    {
      titulo: 'Monto recaudado',
      valor: formatCurrency(stats.monto_recaudado),
      icono: <DollarSign size={20} />,
      colorIcono: 'text-navy-600 bg-navy-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {tarjetas.map((t) => (
        <div key={t.titulo} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
              {t.titulo}
            </p>
            <span className={`p-1.5 rounded-lg ${t.colorIcono}`}>{t.icono}</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{t.valor}</p>
        </div>
      ))}
    </div>
  );
}
