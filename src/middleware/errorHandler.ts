import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/httpError";

/** Traduce errores conocidos (incluidas violaciones UNIQUE) a respuestas HTTP. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
    const field = /students\.(\w+)|users\.(\w+)/.exec(err.message);
    const name = field ? (field[1] ?? field[2]) : "campo";
    res.status(409).json({ error: `Ya existe un registro con ese ${name}` });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Ruta no encontrada" });
}
