// chatTools.ts - Tools que el asistente de chat expone a Gemini.
// Las declaraciones describen CUÁNDO debe llamarse cada función; el ejecutor
// las conecta directamente con los services existentes (sin fetch interno).

import { SchemaType, type FunctionDeclarationsTool } from '@google/generative-ai';
import * as vehiculoService from './vehiculoService.js';
import * as pagoService from './pagoService.js';
import { ErrorDeNegocio } from '../errors.js';

export const declaracionesTools: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: 'consultar_impuestos_pendientes',
      description:
        'Consulta los impuestos de un vehículo por su placa: años pendientes, valor, descuento, ' +
        'fecha de vencimiento y total adeudado. Úsala cuando el usuario quiera saber qué debe, ' +
        'el estado de sus impuestos, o antes de iniciar un pago. Si el usuario aún no ha dado ' +
        'la placa, pídesela en lugar de llamar esta función.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          placa: {
            type: SchemaType.STRING,
            description: 'Placa del vehículo, por ejemplo ABC123.',
          },
        },
        required: ['placa'],
      },
    },
    {
      name: 'iniciar_pago_impuesto',
      description:
        'Inicia el pago de impuestos pendientes de un vehículo: valida que haya deuda y devuelve ' +
        'el enlace de la página del portal donde el usuario completa el pago. Llámala únicamente ' +
        'después de que el usuario haya confirmado explícitamente que quiere pagar y qué vehículo; ' +
        'nunca la llames sin esa confirmación.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          placa: {
            type: SchemaType.STRING,
            description: 'Placa del vehículo cuyos impuestos se van a pagar.',
          },
          anios: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
            description:
              'Años de las vigencias que el usuario quiere pagar. Opcional: si se omite, ' +
              'el usuario elige en la página de pago entre todas las pendientes.',
          },
        },
        required: ['placa'],
      },
    },
    {
      name: 'buscar_comprobantes',
      description:
        'Busca los comprobantes de pagos anteriores de un vehículo por su placa, opcionalmente ' +
        'filtrando por el año pagado. Úsala cuando el usuario quiera ver su historial de pagos, ' +
        'recuperar la referencia de un pago o los datos de un comprobante.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          placa: {
            type: SchemaType.STRING,
            description: 'Placa del vehículo.',
          },
          anio: {
            type: SchemaType.NUMBER,
            description: 'Año pagado por el que filtrar, por ejemplo 2024. Opcional.',
          },
        },
        required: ['placa'],
      },
    },
  ],
};

// Gemini puede mandar la placa con guiones, espacios o en minúsculas.
function normalizarPlaca(valor: unknown): string {
  return String(valor ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function consultarImpuestosPendientes(placa: string): Record<string, unknown> {
  const datos = vehiculoService.obtenerVehiculoConVigencias(placa);
  const pendientes = datos.vigencias
    .filter((v) => v.estado === 'pendiente')
    .map((v) => ({
      anio: v.anio,
      valor: v.valor,
      descuento: v.descuento,
      valor_a_pagar: v.valor - v.descuento,
      fecha_vencimiento: v.fecha_vencimiento,
    }));

  // Sin propietario ni avalúo: el asistente no los necesita para sus tareas.
  const { placa: placaVehiculo, marca, linea, modelo, clase } = datos.vehiculo;
  return {
    vehiculo: { placa: placaVehiculo, marca, linea, modelo, clase },
    impuestos_pendientes: pendientes,
    total_deuda: datos.resumen.total_deuda,
    estado_general: datos.resumen.estado_general,
  };
}

function iniciarPagoImpuesto(placa: string, anios?: number[]): Record<string, unknown> {
  const datos = vehiculoService.obtenerVehiculoConVigencias(placa);
  const pendientes = datos.vigencias.filter((v) => v.estado === 'pendiente');

  if (pendientes.length === 0) {
    return { error: `El vehículo ${placa} no tiene impuestos pendientes; no hay nada que pagar.` };
  }

  let aPagar = pendientes;
  if (anios && anios.length > 0) {
    const pendientesPorAnio = new Set(pendientes.map((v) => v.anio));
    const noDisponibles = anios.filter((a) => !pendientesPorAnio.has(a));
    if (noDisponibles.length > 0) {
      return {
        error:
          `Los años ${noDisponibles.join(', ')} no están pendientes de pago para ${placa}. ` +
          `Años pendientes: ${pendientes.map((v) => v.anio).join(', ')}.`,
      };
    }
    aPagar = pendientes.filter((v) => anios.includes(v.anio));
  }

  return {
    url_pago: `/vehiculo/${placa}`,
    vigencias_a_pagar: aPagar.map((v) => ({ anio: v.anio, valor_a_pagar: v.valor - v.descuento })),
    total: aPagar.reduce((sum, v) => sum + v.valor - v.descuento, 0),
    instruccion:
      'El pago se completa en la página del portal, no en el chat. Comparte el enlace url_pago ' +
      'e indícale al usuario que haga clic en él para seleccionar las vigencias y pagar.',
  };
}

function buscarComprobantes(placa: string, anio?: number): Record<string, unknown> {
  const comprobantes = pagoService.buscarComprobantes(placa, anio).map((c) => ({
    referencia: c.referencia,
    anios_pagados: c.anios_pagados,
    monto_total: c.monto_total,
    metodo_pago: c.metodo_pago,
    fecha_pago: c.fecha_pago,
  }));

  if (comprobantes.length === 0) {
    return {
      comprobantes: [],
      mensaje: anio
        ? `No hay pagos registrados para ${placa} con vigencias del año ${anio}.`
        : `No hay pagos registrados para el vehículo ${placa}.`,
    };
  }
  return { comprobantes };
}

/**
 * Ejecuta la tool solicitada por Gemini. Nunca lanza: los errores se devuelven
 * como { error } para que el modelo se los explique al usuario en lenguaje claro.
 */
export function ejecutarTool(
  nombre: string,
  args: Record<string, unknown>
): Record<string, unknown> {
  try {
    switch (nombre) {
      case 'consultar_impuestos_pendientes':
        return consultarImpuestosPendientes(normalizarPlaca(args.placa));
      case 'iniciar_pago_impuesto':
        return iniciarPagoImpuesto(
          normalizarPlaca(args.placa),
          Array.isArray(args.anios) ? args.anios.map(Number) : undefined
        );
      case 'buscar_comprobantes':
        return buscarComprobantes(
          normalizarPlaca(args.placa),
          args.anio === undefined ? undefined : Number(args.anio)
        );
      default:
        return { error: `Función desconocida: ${nombre}` };
    }
  } catch (error) {
    if (error instanceof ErrorDeNegocio) {
      return { error: error.detalle ?? error.textoError };
    }
    console.error(`Error inesperado ejecutando la tool ${nombre}:`, error);
    return { error: 'Ocurrió un error inesperado al consultar el sistema. Intenta de nuevo.' };
  }
}
