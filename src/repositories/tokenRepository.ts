import type { AppDatabase } from "../db/database";

/**
 * Lista de tokens revocados (logout). Como los JWT son sin estado, para
 * cerrar sesión guardamos el identificador único del token (jti) y el
 * middleware de autenticación rechaza cualquier token revocado.
 */
export class TokenRepository {
  constructor(private readonly db: AppDatabase) {}

  revoke(jti: string, expiresAt: number): void {
    this.db
      .prepare(
        "INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)",
      )
      .run(jti, expiresAt);
  }

  isRevoked(jti: string): boolean {
    const row = this.db
      .prepare("SELECT 1 AS ok FROM revoked_tokens WHERE jti = ?")
      .get(jti) as { ok: number } | undefined;
    return row !== undefined;
  }
}
