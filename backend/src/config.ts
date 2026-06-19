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
