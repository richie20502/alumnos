import type { TokenPayload } from "../services/authService";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Presente cuando el token JWT fue validado por requireAuth. */
      auth?: TokenPayload;
    }
  }
}

export {};
