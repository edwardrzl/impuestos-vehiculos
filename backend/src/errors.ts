// errors.ts - Errores de negocio compartidos por todo el backend.
//
// Los SERVICES lanzan estos errores cuando algo falla a nivel de dominio:
// no se encontró un recurso, o los datos recibidos no son válidos.
// Los CONTROLLERS los atrapan y los traducen a códigos HTTP (404, 400).
//
// La gracia es que el service NO sabe nada de HTTP: solo habla el idioma
// del negocio ("esto no existe", "estos datos son inválidos"). Quién decide
// que "no existe" = 404 es el controller. Así el service es reutilizable
// aunque mañana lo llame algo que no sea una API REST.

export class ErrorDeNegocio extends Error {
  constructor(
    // Texto que irá en el campo "error" del JSON de respuesta.
    public readonly textoError: string,
    // Texto opcional que irá en el campo "message" (algunas respuestas no lo tienen).
    public readonly detalle?: string
  ) {
    super(textoError);
  }
}

// El recurso pedido no existe -> el controller lo traduce a 404.
export class RecursoNoEncontrado extends ErrorDeNegocio {}

// Los datos recibidos no son válidos -> el controller lo traduce a 400.
export class DatosInvalidos extends ErrorDeNegocio {}

// Las credenciales de autenticación son incorrectas -> el controller lo traduce a 401.
// Usamos un mensaje GENÉRICO a propósito: no queremos revelar si el usuario existe
// o si la contraseña es la que falla (eso facilitaría ataques de enumeración).
export class CredencialesInvalidas extends ErrorDeNegocio {}
