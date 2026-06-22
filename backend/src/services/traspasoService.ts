import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// undici (el cliente fetch interno de Node.js) no lee HTTPS_PROXY / HTTP_PROXY
// automáticamente. Configuramos el dispatcher global aquí para que todas las
// peticiones outbound (incluidas las del SDK de Gemini) pasen por el proxy.
const _proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
if (_proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(_proxyUrl));
}
import * as solicitudRepository from '../repositories/solicitudTraspasoRepository.js';
import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import * as ciudadanoRepository from '../repositories/ciudadanoRepository.js';
import { ErrorPasarela, ServicioNoDisponible, RecursoNoEncontrado, ConflictoRecurso } from '../errors.js';
import { GEMINI_API_KEY } from '../config.js';
import type { ResultadoIA, SolicitudTraspaso, SolicitudTraspasoAdmin } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raíz del backend: src/services → src → backend/. Las rutas guardadas en la BD
// son relativas a esta raíz (p. ej. "uploads/tarjetas/123-foto.png").
const backendRoot = path.join(__dirname, '../..');

const PROMPT_SISTEMA =
  'Eres un sistema de validación documental para Colombia. Analizas imágenes de documentos vehiculares y extraes información de forma precisa. Siempre respondes ÚNICAMENTE con JSON válido, sin texto adicional ni backticks.';

const PROMPT_USUARIO = `Analiza esta imagen y determina si es una tarjeta de propiedad vehicular colombiana. Si lo es, extrae la placa y el número de documento del propietario actual.

Responde SOLO con este JSON:
{
  "es_tarjeta_propiedad": true/false,
  "placa_extraida": "ABC123" o null,
  "documento_extraido": "12345678" o null,
  "confianza": "alta"/"media"/"baja",
  "observaciones": "texto breve"
}

- es_tarjeta_propiedad: true solo si el documento tiene la estructura típica de una tarjeta de propiedad colombiana (RUNT, datos del vehículo, propietario).
- placa_extraida: la placa en mayúsculas sin espacios, null si no se puede leer con certeza.
- documento_extraido: solo los dígitos del número de cédula o NIT del propietario actual, null si no se puede leer.
- confianza: alta si los datos son claramente legibles, media si hay dudas menores, baja si la imagen es ilegible o el documento es sospechoso.`;

// Quita todo espacio en blanco para comparar documentos de forma tolerante.
function normalizar(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\s+/g, '');
}

// Resultado neutro cuando la IA no devuelve un JSON interpretable.
const RESULTADO_ILEGIBLE: ResultadoIA = {
  es_tarjeta_propiedad: false,
  placa_extraida: null,
  documento_extraido: null,
  confianza: 'baja',
  observaciones: 'No se pudo interpretar la respuesta de la IA.',
};

async function analizarConIA(rutaAbsoluta: string): Promise<ResultadoIA> {
  // PASO 1: Gemini recibe imágenes como inlineData (base64 + mimeType) dentro del
  // cuerpo de la petición, igual que Anthropic. Leemos el archivo y lo codificamos.
  const base64 = fs.readFileSync(rutaAbsoluta).toString('base64');
  const extension = path.extname(rutaAbsoluta).toLowerCase();
  const mimeType: 'image/jpeg' | 'image/png' =
    extension === '.png' ? 'image/png' : 'image/jpeg';

  // PASO 2: inicializar el cliente de Gemini y llamar al modelo de visión.
  // PROMPT_SISTEMA se pasa como systemInstruction para mantener la misma
  // separación de roles que tenía la implementación con Claude.
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: PROMPT_SISTEMA,
  });

  const imagePart = {
    inlineData: {
      data: base64,
      mimeType,
    },
  };

  let textoRespuesta: string;
  try {
    const result = await model.generateContent([PROMPT_USUARIO, imagePart]);
    textoRespuesta = result.response.text();
  } catch (error: unknown) {
    console.error('Error llamando a la API de Gemini:', error);
    // 429: cuota agotada → el usuario debe esperar unos segundos.
    const status = (error as { status?: number }).status;
    if (status === 429) {
      throw new ServicioNoDisponible(
        'El servicio de validación está ocupado en este momento. Espera unos segundos y vuelve a intentarlo.'
      );
    }
    throw new ErrorPasarela('Error al procesar la imagen con IA. Intenta de nuevo.');
  }

  // PASO 3: parsear el JSON. Gemini puede devolver bloques de código markdown
  // (```json ... ```) aunque el prompt lo prohíba, por lo que limpiamos primero.
  try {
    const limpio = textoRespuesta.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    return JSON.parse(limpio) as ResultadoIA;
  } catch {
    return RESULTADO_ILEGIBLE;
  }
}

export async function crearSolicitud(datos: {
  placa: string;
  ciudadano_id: number;
  foto_tarjeta_path: string;
}): Promise<{
  id: number;
  estado: 'pendiente';
  validacion_ia: {
    es_tarjeta_propiedad: boolean;
    placa_extraida: string | null;
    confianza: string;
    observaciones: string;
  };
  validacion_db: boolean;
  mensaje: string;
}> {
  // 503 inmediato si no hay clave: no tiene sentido intentar la llamada a la IA.
  if (!GEMINI_API_KEY) {
    throw new ServicioNoDisponible(
      'La validación automática de documentos no está disponible en este momento.'
    );
  }

  const rutaAbsoluta = path.join(backendRoot, datos.foto_tarjeta_path);
  const resultado = await analizarConIA(rutaAbsoluta);

  // PASO 4: validación contra la BD.
  // IMPORTANTE: la placa que escribió el ciudadano (datos.placa) NO se usa aquí.
  // La verificación se hace con lo que la IA extrajo de la imagen (placa_extraida);
  // así, un ciudadano no puede "colar" una placa ajena escribiéndola a mano: el cruce
  // depende de lo que realmente aparece en la tarjeta. La placa ingresada se guarda
  // solo como referencia de a qué vehículo dice querer hacer el traspaso.
  let validacionDb = 0;
  if (resultado.es_tarjeta_propiedad && resultado.placa_extraida) {
    const vehiculo = vehiculoRepository.buscarPorPlaca(resultado.placa_extraida);
    if (vehiculo) {
      const docCoincide =
        resultado.documento_extraido != null &&
        normalizar(resultado.documento_extraido) === normalizar(vehiculo.documento_propietario);
      validacionDb = docCoincide ? 1 : 0;
    }
  }

  // PASO 5: persistir. resultado_ia se guarda como JSON string para auditoría/admin.
  const id = solicitudRepository.crearSolicitud({
    placa: datos.placa,
    ciudadano_id: datos.ciudadano_id,
    foto_tarjeta_path: datos.foto_tarjeta_path,
    resultado_ia: JSON.stringify(resultado),
    validacion_db: validacionDb,
  });

  // PASO 6: armar el mensaje legible (informativo, no alarmante).
  let mensaje: string;
  if (validacionDb === 1) {
    mensaje =
      'Solicitud recibida. La documentación fue verificada exitosamente. Un administrador revisará tu solicitud en breve.';
  } else if (resultado.es_tarjeta_propiedad && resultado.confianza !== 'baja') {
    mensaje =
      'Solicitud recibida, pero no pudimos verificar automáticamente que el documento corresponde al vehículo. Un administrador revisará manualmente.';
  } else {
    mensaje =
      'Solicitud recibida, pero la imagen no pudo ser reconocida como tarjeta de propiedad. Un administrador la revisará manualmente.';
  }

  return {
    id,
    estado: 'pendiente',
    validacion_ia: {
      es_tarjeta_propiedad: resultado.es_tarjeta_propiedad,
      placa_extraida: resultado.placa_extraida,
      confianza: resultado.confianza,
      observaciones: resultado.observaciones,
    },
    validacion_db: validacionDb === 1,
    mensaje,
  };
}

export function listarSolicitudesCiudadano(ciudadano_id: number): Array<
  Omit<SolicitudTraspaso, 'resultado_ia'> & { resultado_ia: ResultadoIA | null }
> {
  const solicitudes = solicitudRepository.listarPorCiudadano(ciudadano_id);
  return solicitudes.map((s) => ({
    ...s,
    resultado_ia: s.resultado_ia ? (JSON.parse(s.resultado_ia) as ResultadoIA) : null,
  }));
}

// ─── Funciones del panel de administración ────────────────────────────────────

export function listarSolicitudes(
  filtro?: 'pendiente' | 'aprobado' | 'rechazado'
): Array<Omit<SolicitudTraspasoAdmin, 'resultado_ia'> & { resultado_ia: ResultadoIA | null }> {
  const solicitudes = solicitudRepository.listarSolicitudes(filtro);
  return solicitudes.map((s) => ({
    ...s,
    resultado_ia: s.resultado_ia ? (JSON.parse(s.resultado_ia) as ResultadoIA) : null,
  }));
}

export function resolverSolicitud(datos: {
  id: number;
  estado: 'aprobado' | 'rechazado';
  admin_notas: string | null;
  adminId: number;
}): SolicitudTraspaso {
  const solicitud = solicitudRepository.buscarPorId(datos.id);
  if (!solicitud) {
    throw new RecursoNoEncontrado(`Solicitud #${datos.id} no encontrada.`);
  }
  if (solicitud.estado !== 'pendiente') {
    throw new ConflictoRecurso('Esta solicitud ya fue resuelta.');
  }

  solicitudRepository.resolverSolicitud({
    id: datos.id,
    estado: datos.estado,
    admin_notas: datos.admin_notas,
  });

  // Traspaso efectivo: al aprobar, los datos del ciudadano solicitante se
  // convierten en los del nuevo propietario registrado en la tabla vehiculos.
  // Es el único lugar donde el traspaso se materializa en la BD.
  if (datos.estado === 'aprobado') {
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
