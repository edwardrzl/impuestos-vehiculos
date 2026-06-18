// config.ts - Variables de entorno validadas al arrancar el servidor.
//
// IMPORTANTE: este módulo se importa DESPUÉS de 'dotenv/config' en server.ts,
// garantizando que el archivo .env ya fue cargado cuando este código corre.
// Si JWT_SECRET no está definida, el proceso termina con un mensaje claro:
// es mejor fallar al arrancar que fallar silenciosamente en la primera petición.

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error(
    'JWT_SECRET no está definido.\n' +
    'Crea el archivo backend/.env con:\n' +
    '  JWT_SECRET=un-secreto-largo-y-aleatorio'
  );
}

// Lo exportamos como string (no string | undefined) porque ya validamos arriba.
export const JWT_SECRET: string = secret;

// Tiempo de vida del token. '8h' significa que expira a las 8 horas de ser firmado.
export const JWT_EXPIRACION = '8h' as const;
