export class ErrorDeNegocio extends Error {
  constructor(
    public readonly textoError: string,
    public readonly detalle?: string
  ) {
    super(textoError);
  }
}

export class RecursoNoEncontrado extends ErrorDeNegocio {}
export class DatosInvalidos extends ErrorDeNegocio {}

// Mensaje genérico intencional: no revelar si falla el usuario o la contraseña (enumeración).
export class CredencialesInvalidas extends ErrorDeNegocio {}

export class ConflictoRecurso extends ErrorDeNegocio {}

// 429: el cliente superó un límite de uso (p. ej. intentos de validación IA).
export class LimiteExcedido extends ErrorDeNegocio {}

// 502: una dependencia externa (la API de IA) falló al procesar la petición.
export class ErrorPasarela extends ErrorDeNegocio {}

// 503: una dependencia externa no está configurada/disponible (p. ej. falta la API key).
export class ServicioNoDisponible extends ErrorDeNegocio {}
