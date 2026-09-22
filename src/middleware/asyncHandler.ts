import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve un handler async para que los errores rechazados lleguen al
 * middleware de manejo de errores (Express 4 no captura promesas por sí mismo).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
