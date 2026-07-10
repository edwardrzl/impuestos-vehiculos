// Falla al arrancar si JWT_SECRET no está definida: mejor error temprano que fallo silencioso.
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error(
    'JWT_SECRET no está definido.\n' +
    'Crea el archivo backend/.env con:\n' +
    '  JWT_SECRET=un-secreto-largo-y-aleatorio'
  );
}

export const JWT_SECRET: string = secret;
export const JWT_EXPIRACION = '8h' as const;

// Opcional a propósito: el servidor debe arrancar aunque falte. El endpoint
// del chat responde 503 si se intenta usar el asistente sin esta clave.
export const GEMINI_API_KEY: string | undefined = process.env.GEMINI_API_KEY;

// Modelo del asistente de chat. Configurable por env porque las cuotas del tier
// gratuito cambian por modelo: si una se agota, se cambia aquí sin tocar código.
// Lite: cuota diaria gratuita mucho mayor que los flash completos.
export const GEMINI_CHAT_MODEL: string = process.env.GEMINI_CHAT_MODEL ?? 'gemini-3.1-flash-lite';

// ─── Validación de fotos de traspaso ─────────────────────────────────────────
// Clave y modelo PROPIOS de la validación, independientes del chat: cada
// feature maneja su cuota y puede apuntar a otro proyecto de Google sin
// tocar a la otra. Opcionales: sin clave, el endpoint responde 503.
export const GEMINI_VALIDATION_API_KEY: string | undefined = process.env.GEMINI_VALIDATION_API_KEY;
export const GEMINI_VALIDATION_MODEL: string =
  process.env.GEMINI_VALIDATION_MODEL ?? 'gemini-3.1-flash-lite';
