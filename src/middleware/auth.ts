import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../errors/httpError";
import type { AuthService } from "../services/authService";

/**
 * Middleware que exige un JWT válido en el header
 * `Authorization: Bearer <token>`. Adjunta el payload a `req.auth`.
 */
export function requireAuth(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw unauthorized("Falta el token de autenticación (Bearer)");
    }
    req.auth = authService.verify(token);
    next();
  };
}
