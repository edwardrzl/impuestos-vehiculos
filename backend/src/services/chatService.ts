// El proxy corporativo (HTTPS_PROXY) ya queda configurado globalmente en
// traspasoService.ts vía setGlobalDispatcher; server.ts siempre lo importa,
// así que las llamadas de este módulo a Gemini también pasan por él.
import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_CHAT_MODEL } from '../config.js';
import { DatosInvalidos, ErrorPasarela, ServicioNoDisponible } from '../errors.js';
import { declaracionesTools, ejecutarTool } from './chatTools.js';

// Límites defensivos: /api/chat es público y consume la cuota gratuita de Gemini.
const MAX_MENSAJES = 30;
const MAX_CHARS_POR_MENSAJE = 4000;

// Tope de rondas de tools por turno para evitar loops infinitos.
const MAX_ITERACIONES = 5;

const PROMPT_SISTEMA = `Eres el asistente virtual de Prisma, el portal de consulta y pago de impuestos vehiculares en Colombia.

Tu rol:
- Ayudar a consultar los impuestos pendientes de un vehículo, iniciar su pago y buscar comprobantes de pagos anteriores.
- Tono amable, claro y profesional. Respuestas breves por defecto.

Reglas:
- Responde únicamente consultas relacionadas con impuestos vehiculares de este sistema. Si te preguntan otra cosa, redirige amablemente al tema.
- No inventes datos: si te falta información (por ejemplo la placa), pídesela al usuario.
- Las placas colombianas tienen el formato de 3 letras seguidas de 3 números (ejemplo: ABC123).
- Si algo falla, explícalo en lenguaje claro, sin términos técnicos.
- Responde siempre en español.
- Responde en texto plano, sin formato Markdown (nada de asteriscos, almohadillas ni tablas). Para enumerar, usa guiones.

Uso de las funciones:
- Usa las funciones disponibles siempre que necesites datos reales: nunca inventes placas, valores, referencias ni comprobantes.
- Si te falta la placa u otro dato necesario, pídeselo al usuario antes de llamar la función.
- Antes de llamar iniciar_pago_impuesto, confirma explícitamente con el usuario qué vehículo (y qué años, si aplica) quiere pagar, y espera a que lo confirme en su siguiente mensaje. Nunca inicies un pago que el usuario no confirmó.
- Cuando el usuario confirme el pago, LLAMA a la función iniciar_pago_impuesto. No respondas como si ya la hubieras llamado.
- El pago NO se realiza dentro del chat: cuando iniciar_pago_impuesto devuelva un enlace, compártelo e indícale al usuario que haga clic en él para ir a la página de pago. Escribe el enlace tal cual te lo devuelve la función, en una línea propia. No digas "ábrelo en tu navegador": el usuario ya está navegando el portal.
- El ÚNICO enlace de pago válido es el valor url_pago que devuelve iniciar_pago_impuesto (siempre tiene la forma /vehiculo/PLACA). NUNCA escribas un enlace que la función no te haya devuelto ni inventes rutas como /pago/... — un enlace inventado deja al usuario sin poder pagar.
- Si una función devuelve un error, explícaselo al usuario en lenguaje claro y sugiere qué hacer.
- Los montos están en pesos colombianos: formatéalos de forma legible, por ejemplo $1.234.567.`;

/** Cuerpo esperado en POST /api/chat. El historial usa el formato del SDK de Gemini. */
export interface SolicitudChat {
  historial: Content[];
}

// Valida la forma del historial antes de enviarlo a Gemini: roles permitidos,
// parts con texto y límites de tamaño. Lanza DatosInvalidos (→ 400).
function validarHistorial(historial: unknown): Content[] {
  if (!Array.isArray(historial) || historial.length === 0) {
    throw new DatosInvalidos('Datos inválidos', 'Se requiere un historial de mensajes no vacío');
  }
  if (historial.length > MAX_MENSAJES) {
    throw new DatosInvalidos(
      'Conversación demasiado larga',
      'Cierra el chat y empieza una conversación nueva'
    );
  }

  for (const mensaje of historial) {
    const { role, parts } = (mensaje ?? {}) as Partial<Content>;
    if (role !== 'user' && role !== 'model') {
      throw new DatosInvalidos('Datos inválidos', 'Cada mensaje debe tener rol "user" o "model"');
    }
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new DatosInvalidos('Datos inválidos', 'Cada mensaje debe tener contenido');
    }
    for (const part of parts) {
      if (typeof (part as { text?: unknown }).text !== 'string') {
        throw new DatosInvalidos('Datos inválidos', 'Solo se admiten mensajes de texto');
      }
      if ((part as { text: string }).text.length > MAX_CHARS_POR_MENSAJE) {
        throw new DatosInvalidos('Mensaje demasiado largo', 'Escribe un mensaje más corto');
      }
    }
  }

  const ultimo = historial[historial.length - 1] as Content;
  if (ultimo.role !== 'user') {
    throw new DatosInvalidos('Datos inválidos', 'El último mensaje debe ser del usuario');
  }

  return historial as Content[];
}

export async function conversar(datos: SolicitudChat): Promise<{ respuesta: string }> {
  if (!GEMINI_API_KEY) {
    throw new ServicioNoDisponible('El asistente no está disponible en este momento.');
  }

  const historial = validarHistorial(datos?.historial);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: PROMPT_SISTEMA,
    tools: [declaracionesTools],
  });

  // Copia local: las rondas de tools se agregan aquí y NO vuelven al cliente,
  // que solo conserva los mensajes de texto usuario/asistente.
  const contents: Content[] = [...historial];

  try {
    let result = await model.generateContent({ contents });

    let iteraciones = 0;
    while (iteraciones < MAX_ITERACIONES) {
      const llamadas = result.response.functionCalls();
      if (!llamadas || llamadas.length === 0) break;

      // ejecutarTool nunca lanza: los errores viajan como { error } a Gemini.
      const respuestasTools: Part[] = llamadas.map((llamada) => ({
        functionResponse: {
          name: llamada.name,
          response: ejecutarTool(llamada.name, llamada.args as Record<string, unknown>),
        },
      }));

      contents.push(result.response.candidates![0].content);
      contents.push({ role: 'function', parts: respuestasTools });

      result = await model.generateContent({ contents });
      iteraciones++;
    }

    const texto = result.response.text().trim();
    return {
      respuesta:
        texto || 'No pude completar la operación. Intenta formular tu solicitud de nuevo.',
    };
  } catch (error: unknown) {
    // No loggear el historial completo: puede contener datos del usuario.
    console.error('Error llamando a la API de Gemini (chat):', error);
    const status = (error as { status?: number }).status;
    // 429: cuota del tier gratuito agotada. 503: modelo sobrecargado en Google.
    // Ambos son transitorios: el usuario debe reintentar en unos segundos.
    if (status === 429 || status === 503) {
      throw new ServicioNoDisponible(
        'El asistente está recibiendo muchas consultas. Espera unos segundos y vuelve a intentarlo.'
      );
    }
    throw new ErrorPasarela(
      'El asistente no está disponible en este momento, intenta de nuevo en unos segundos.'
    );
  }
}
