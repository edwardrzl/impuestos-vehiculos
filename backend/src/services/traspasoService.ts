// traspasoService.ts - Solicitudes de traspaso con validación de foto por IA.
//
// Flujo de solicitarTraspaso:
//   1. Validaciones de forma (tamaño/tipo) — NO cuentan como intento IA.
//   2. Límite de 5 validaciones IA por usuario+placa en 24 h (429 si se supera).
//   3. Guardado de la foto en uploads/traspasos/.
//   4. Validación con IA (Gemini multimodal, respuesta estructurada).
//   5. Reglas de negocio sobre la respuesta estructurada (las aplica este código,
//      no la IA): es tarjeta, placa coincide, cédula coincide, legibilidad.
//   6. Registro del intento y creación de la solicitud si todo pasó.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import * as solicitudRepository from '../repositories/solicitudTraspasoRepository.js';
import * as intentoRepository from '../repositories/intentoValidacionTraspasoRepository.js';
import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import * as ciudadanoRepository from '../repositories/ciudadanoRepository.js';
import {
  DatosInvalidos,
  RecursoNoEncontrado,
  ConflictoRecurso,
  LimiteExcedido,
  ServicioNoDisponible,
  ErrorPasarela,
} from '../errors.js';
import { GEMINI_VALIDATION_API_KEY, GEMINI_VALIDATION_MODEL } from '../config.js';
import type {
  ResultadoValidacionIA,
  SolicitudTraspaso,
  SolicitudTraspasoAdmin,
  EstadoSolicitudTraspaso,
} from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raíz del backend: src/services → src → backend/. Las rutas guardadas en BD
// son relativas a esta raíz (p. ej. "uploads/traspasos/1_170000_ABC123.jpg").
const backendRoot = path.join(__dirname, '../..');
const carpetaTraspasos = path.join(backendRoot, 'uploads', 'traspasos');
fs.mkdirSync(carpetaTraspasos, { recursive: true });

const TAMANO_MINIMO_BYTES = 50 * 1024;
const MAX_INTENTOS_IA = 5;

const MIMETYPES_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Lo que llega de multer (memoryStorage). */
export interface ArchivoSubido {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export type ResultadoSolicitud =
  | { aprobada: true; id: number; estado: 'PENDIENTE_REVISION_ADMIN'; mensaje: string }
  | { aprobada: false; razon: string };

// Quita espacios para comparar documentos de forma tolerante.
function normalizarDocumento(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\s+/g, '');
}

// Mayúsculas y sin separadores para comparar placas de forma tolerante.
function normalizarPlaca(valor: string | null | undefined): string {
  return (valor ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// ─── Validación IA (Gemini multimodal con structured output) ─────────────────
// La IA SOLO extrae y evalúa la imagen; no conoce ni compara los datos del
// usuario (eso es aplicarReglasNegocio). Falla con ServicioNoDisponible /
// ErrorPasarela, que el flujo trata como "no cuenta intento".

const TIMEOUT_GEMINI_MS = 20_000;

const PROMPT_SISTEMA_VALIDACION = `Eres un asistente especializado en analizar fotos de tarjetas de propiedad vehicular colombianas (licencias de tránsito).

Tu tarea con cada imagen:
- Evaluar si es efectivamente una tarjeta de propiedad vehicular colombiana.
- Evaluar la legibilidad general de la imagen: alta, media o baja.
- Extraer la placa del vehículo y el número de cédula del propietario, si son legibles.

Reglas:
- Responde SIEMPRE con el JSON del esquema exacto, aunque la imagen sea ilegible o no sea una tarjeta.
- Si la imagen no es una tarjeta de propiedad: esTarjetaDePropiedad en false, campos extraídos en null y una breve explicación en observaciones.
- Si es una tarjeta pero está muy borrosa: esTarjetaDePropiedad en true, legibilidad "baja", extrae lo que puedas y deja en null lo que no puedas leer.
- No inventes datos: si no ves la placa con claridad, placaExtraida debe ser null; lo mismo con la cédula.
- placaExtraida en mayúsculas, sin espacios ni guiones. cedulaPropietarioExtraida solo los dígitos.
- No hagas suposiciones morales ni éticas: solo describe lo que ves.`;

const SCHEMA_VALIDACION: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    esTarjetaDePropiedad: {
      type: SchemaType.BOOLEAN,
      description: 'true solo si la imagen es una tarjeta de propiedad vehicular colombiana',
    },
    legibilidad: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['alta', 'media', 'baja'],
      description: 'Qué tan legible es la imagen en general',
    },
    placaExtraida: {
      type: SchemaType.STRING,
      nullable: true,
      description: 'Placa que aparece en la tarjeta, en mayúsculas sin separadores; null si no es legible',
    },
    cedulaPropietarioExtraida: {
      type: SchemaType.STRING,
      nullable: true,
      description: 'Cédula del propietario que aparece en la tarjeta, solo dígitos; null si no es legible',
    },
    observaciones: {
      type: SchemaType.STRING,
      description: 'Explicación breve de lo observado, para logs',
    },
  },
  required: [
    'esTarjetaDePropiedad',
    'legibilidad',
    'placaExtraida',
    'cedulaPropietarioExtraida',
    'observaciones',
  ],
};

async function validarConIA(archivo: ArchivoSubido): Promise<ResultadoValidacionIA> {
  if (!GEMINI_VALIDATION_API_KEY) {
    throw new ServicioNoDisponible(
      'La validación automática de documentos no está disponible en este momento.'
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_VALIDATION_API_KEY);
  const model = genAI.getGenerativeModel(
    {
      model: GEMINI_VALIDATION_MODEL,
      systemInstruction: PROMPT_SISTEMA_VALIDACION,
      // Temperatura baja: extracción consistente, no creatividad.
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA_VALIDACION,
      },
    },
    { timeout: TIMEOUT_GEMINI_MS }
  );

  let texto: string;
  try {
    const result = await model.generateContent([
      { inlineData: { data: archivo.buffer.toString('base64'), mimeType: archivo.mimetype } },
      'Analiza esta imagen.',
    ]);
    texto = result.response.text();
  } catch (error: unknown) {
    console.error('Error llamando a Gemini (validación de traspaso):', error);
    const status = (error as { status?: number }).status;
    // 429 (cuota) y 503 (sobrecarga) son transitorios; el resto (timeout, red)
    // también se reporta amigable. Nada de esto cuenta como intento del usuario.
    if (status === 429 || status === 503) {
      throw new ServicioNoDisponible(
        'El servicio de validación no está disponible temporalmente, por favor intenta en unos minutos.'
      );
    }
    throw new ErrorPasarela('No pudimos validar la imagen en este momento. Intenta de nuevo.');
  }

  try {
    const crudo = JSON.parse(texto) as Record<string, unknown>;
    return {
      esTarjetaDePropiedad: crudo.esTarjetaDePropiedad === true,
      legibilidad: ['alta', 'media', 'baja'].includes(crudo.legibilidad as string)
        ? (crudo.legibilidad as 'alta' | 'media' | 'baja')
        : 'baja',
      placaExtraida:
        typeof crudo.placaExtraida === 'string' && crudo.placaExtraida.trim()
          ? crudo.placaExtraida
          : null,
      cedulaPropietarioExtraida:
        typeof crudo.cedulaPropietarioExtraida === 'string' && crudo.cedulaPropietarioExtraida.trim()
          ? crudo.cedulaPropietarioExtraida
          : null,
      observaciones: typeof crudo.observaciones === 'string' ? crudo.observaciones : '',
    };
  } catch {
    // Con responseSchema no debería pasar; si pasa, es un fallo del servicio.
    console.error('Respuesta de Gemini no parseable (validación):', texto.slice(0, 300));
    throw new ErrorPasarela('No pudimos validar la imagen en este momento. Intenta de nuevo.');
  }
}

// ─── Reglas de negocio ────────────────────────────────────────────────────────
// Devuelve la razón de rechazo, o null si la solicitud puede crearse.
// El orden importa: primero lo categórico (no es tarjeta), después la calidad
// (para no acusar "placa distinta" cuando en realidad no se pudo leer), y al
// final las comparaciones contra los datos del usuario.
function aplicarReglasNegocio(
  ia: ResultadoValidacionIA,
  placaUsuario: string,
  cedulaUsuario: string
): string | null {
  if (!ia.esTarjetaDePropiedad) {
    return 'La imagen no parece ser una tarjeta de propiedad de vehículo.';
  }

  const placaExtraida = normalizarPlaca(ia.placaExtraida);
  const cedulaExtraida = normalizarDocumento(ia.cedulaPropietarioExtraida);

  if (ia.legibilidad === 'baja' && (!placaExtraida || !cedulaExtraida)) {
    return 'La foto no es lo suficientemente clara. Por favor toma una foto mejor iluminada y enfocada.';
  }

  if (placaExtraida !== normalizarPlaca(placaUsuario)) {
    return `La placa en la tarjeta no coincide con la placa ingresada (${ia.placaExtraida ?? 'ilegible'} vs ${placaUsuario}).`;
  }

  if (cedulaExtraida !== normalizarDocumento(cedulaUsuario)) {
    return 'La cédula del propietario en la tarjeta no coincide con la cédula del usuario autenticado.';
  }

  return null;
}

// ─── Flujo principal ──────────────────────────────────────────────────────────

export async function solicitarTraspaso(datos: {
  ciudadanoId: number;
  placa: string;
  archivo: ArchivoSubido;
}): Promise<ResultadoSolicitud> {
  const placa = normalizarPlaca(datos.placa);
  const { archivo } = datos;

  // 1. Validaciones de forma: fallan ANTES de tocar la IA y no cuentan intento.
  const extension = MIMETYPES_PERMITIDOS[archivo.mimetype];
  if (!extension) {
    throw new DatosInvalidos('Formato no soportado', 'Solo se permiten imágenes JPEG, PNG o WEBP');
  }
  if (archivo.size < TAMANO_MINIMO_BYTES) {
    throw new DatosInvalidos(
      'Imagen demasiado pequeña',
      'La imagen debe pesar al menos 50 KB. Toma la foto con la cámara del teléfono, no una miniatura.'
    );
  }

  const vehiculo = vehiculoRepository.buscarPorPlaca(placa);
  if (!vehiculo) {
    throw new RecursoNoEncontrado(
      'Vehículo no encontrado',
      `No se encontró ningún vehículo con la placa ${placa}`
    );
  }

  // El middleware garantiza el id, pero la cédula vive en la BD, no en el JWT.
  const ciudadano = ciudadanoRepository.buscarPorId(datos.ciudadanoId);
  if (!ciudadano) {
    throw new RecursoNoEncontrado('Usuario no encontrado');
  }

  // 2. Límite de intentos IA por usuario+placa.
  const intentos = intentoRepository.contarIntentosVigentes(datos.ciudadanoId, placa);
  if (intentos >= MAX_INTENTOS_IA) {
    throw new LimiteExcedido(
      'Límite de intentos alcanzado',
      `Alcanzaste el límite de ${MAX_INTENTOS_IA} intentos de validación para esta placa. Intenta de nuevo mañana.`
    );
  }

  // 3. Guardar la foto antes de validar (la solicitud aprobada la referencia).
  const nombreArchivo = `${datos.ciudadanoId}_${Date.now()}_${placa}.${extension}`;
  const rutaAbsoluta = path.join(carpetaTraspasos, nombreArchivo);
  fs.writeFileSync(rutaAbsoluta, archivo.buffer);
  const fotoPath = `uploads/traspasos/${nombreArchivo}`;

  // 4. Validación IA. Si el servicio falla (cuota, timeout, red), la foto no
  //    queda huérfana y el fallo NO cuenta como intento del usuario.
  let resultadoIA: ResultadoValidacionIA;
  try {
    resultadoIA = await validarConIA(archivo);
  } catch (error) {
    fs.rmSync(rutaAbsoluta, { force: true });
    throw error;
  }

  // 5. Reglas de negocio (las aplica el backend, no la IA).
  const razonRechazo = aplicarReglasNegocio(resultadoIA, placa, ciudadano.documento);

  // 6. Registrar el intento (cuenta contra el límite, aprobado o no).
  intentoRepository.registrarIntento({
    ciudadano_id: datos.ciudadanoId,
    placa,
    resultado: razonRechazo ? 'rechazado' : 'aprobado',
    razon_rechazo: razonRechazo,
  });

  if (razonRechazo) {
    // La foto rechazada no queda referenciada por nadie: se elimina.
    fs.rmSync(rutaAbsoluta, { force: true });
    return { aprobada: false, razon: razonRechazo };
  }

  const id = solicitudRepository.crearSolicitud({
    ciudadano_id: datos.ciudadanoId,
    placa,
    foto_path: fotoPath,
  });

  return {
    aprobada: true,
    id,
    estado: 'PENDIENTE_REVISION_ADMIN',
    mensaje:
      "Tu solicitud fue enviada y está en revisión por un administrador. Puedes ver su estado en 'Mis solicitudes'.",
  };
}

export function listarMisSolicitudes(ciudadanoId: number): SolicitudTraspaso[] {
  return solicitudRepository.listarPorCiudadano(ciudadanoId);
}

// ─── Funciones del panel de administración ────────────────────────────────────
/*

*/
export function listarSolicitudesAdmin(filtro?: EstadoSolicitudTraspaso): SolicitudTraspasoAdmin[] {
  return solicitudRepository.listarAdmin(filtro);
}

export function resolverSolicitud(datos: {
  id: number;
  estado: 'APROBADO' | 'RECHAZADO';
  comentario_admin: string | null;
}): SolicitudTraspaso {
  const solicitud = solicitudRepository.buscarPorId(datos.id);
  if (!solicitud) {
    throw new RecursoNoEncontrado(`Solicitud #${datos.id} no encontrada.`);
  }
  if (solicitud.estado !== 'PENDIENTE_REVISION_ADMIN') {
    throw new ConflictoRecurso('Esta solicitud ya fue resuelta.');
  }

  solicitudRepository.resolverSolicitud(datos);

  // Traspaso efectivo: al aprobar, el ciudadano solicitante pasa a ser el
  // propietario registrado del vehículo. Único lugar donde se materializa.
  if (datos.estado === 'APROBADO') {
    const ciudadano = ciudadanoRepository.buscarPorId(solicitud.ciudadano_id);
    if (ciudadano) {
      vehiculoRepository.actualizarPropietario({
        placa: solicitud.placa,
        propietario: ciudadano.nombre,
        documento_propietario: ciudadano.documento,
      });
    }
  }

  return solicitudRepository.buscarPorId(datos.id)!;
}

