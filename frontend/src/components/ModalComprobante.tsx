import { useEffect } from 'react';
import { CheckCircle2, FileText, X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import type { DatosComprobante } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

interface Props {
  comprobante: DatosComprobante;
  onCerrar: () => void;
  modoInline?: boolean;
}

function generarPDF(comprobante: DatosComprobante) {
  const doc = new jsPDF();
  const margen = 20;
  const anchoUtil = 170; // 210 - 2*20
  let y = 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Comprobante de Pago — Prisma Impuestos', margen, y);

  y += 6;
  doc.setLineWidth(0.4);
  doc.setDrawColor(180, 180, 180);
  doc.line(margen, y, margen + anchoUtil, y);

  const campo = (etiqueta: string, valor: string) => {
    y += 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(etiqueta, margen, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, margen + 45, y);
  };

  campo('Referencia:', comprobante.referencia);
  campo('Placa:', comprobante.placa);
  campo('Propietario:', comprobante.propietario);
  campo('Vigencias pagadas:', comprobante.anios_pagados.join(', '));
  campo('Monto total:', formatCurrency(comprobante.monto_total));
  campo('Método de pago:', comprobante.metodo_pago);
  campo('Fecha de pago:', formatDateTime(comprobante.fecha_pago));

  y += 14;
  doc.line(margen, y, margen + anchoUtil, y);
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Este documento es válido como comprobante de pago.', margen, y);

  doc.save(`comprobante-${comprobante.referencia}.pdf`);
}

export default function ModalComprobante({ comprobante, onCerrar, modoInline = false }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCerrar]);

  const tarjeta = (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
      {/* Verde tras pago exitoso; navy al consultar un comprobante ya existente */}
      <div
        className={`relative px-6 pt-8 pb-6 text-center ${
          modoInline
            ? 'bg-gradient-to-br from-navy-800 to-navy-900'
            : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
        } text-white`}
      >
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 text-white/80 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="inline-flex w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
          {modoInline ? (
            <FileText size={36} strokeWidth={1.8} />
          ) : (
            <CheckCircle2 size={36} strokeWidth={2.5} />
          )}
        </div>

        <h2 className="font-display text-3xl">
          {modoInline ? 'Comprobante de pago' : '¡Pago exitoso!'}
        </h2>
        <p className={`text-sm mt-1 ${modoInline ? 'text-navy-200' : 'text-emerald-50'}`}>
          {modoInline
            ? 'Detalles de la transacción'
            : 'Tu transacción se procesó correctamente'}
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-stone-50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">
            Número de referencia
          </p>
          <p className="font-mono font-semibold text-navy-900 text-sm">
            {comprobante.referencia}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500 mb-0.5">Placa</dt>
            <dd className="font-semibold text-navy-900">{comprobante.placa}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500 mb-0.5">Propietario</dt>
            <dd className="font-medium text-navy-900 truncate" title={comprobante.propietario}>
              {comprobante.propietario}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wider text-stone-500 mb-0.5">
              Vigencias pagadas
            </dt>
            <dd className="font-medium text-navy-900">
              {comprobante.anios_pagados.join(', ')}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wider text-stone-500 mb-0.5">Fecha</dt>
            <dd className="text-navy-900">{formatDateTime(comprobante.fecha_pago)}</dd>
          </div>
        </dl>

        <div className="bg-navy-900 text-white rounded-xl px-5 py-4 text-center">
          <p className="text-xs uppercase tracking-wider text-navy-200 mb-1">Total pagado</p>
          <p className="font-display text-4xl tabular-nums">
            {formatCurrency(comprobante.monto_total)}
          </p>
        </div>

        <div className={`flex gap-3 ${modoInline ? 'flex-row' : 'flex-col'}`}>
          <button
            onClick={() => generarPDF(comprobante)}
            className="btn-ghost flex-1 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Descargar PDF
          </button>
          {!modoInline && (
            <button onClick={onCerrar} className="btn-primary w-full">
              Cerrar y continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // modoInline solo controla el estilo de cabecera; siempre renderiza con overlay.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onCerrar}
    >
      <div onClick={(e) => e.stopPropagation()}>{tarjeta}</div>
    </div>
  );
}
