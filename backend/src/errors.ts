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
