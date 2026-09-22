/**
 * Error con código HTTP asociado. Lo captura el middleware de manejo de
 * errores para responder con el status correcto.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = "No autorizado") =>
  new HttpError(401, message);
export const notFound = (message = "Recurso no encontrado") =>
  new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
