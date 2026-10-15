import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

export interface RefreshTokenRecord {
  id: number;
  user_id: number;
  user_kind: "user" | "student";
  token: string;
  expires_at: number; // Unix timestamp
  created_at: number;
}

export class RefreshTokenRepository {
  constructor(private readonly db: DatabaseSync) {}

  /**
   * Crea un nuevo refresh token para un usuario
   */
  create(
    userId: number,
    userKind: "user" | "student",
    expiresInSeconds: number,
  ): { token: string; expiresAt: number } {
    const token = randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const stmt = this.db.prepare(`
      INSERT INTO refresh_tokens (user_id, user_kind, token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, userKind, token, expiresAt);

    return { token, expiresAt };
  }

  /**
   * Busca un refresh token por su valor
   */
  findByToken(token: string): RefreshTokenRecord | undefined {
    const stmt = this.db.prepare(`
      SELECT id, user_id, user_kind, token, expires_at, created_at
      FROM refresh_tokens
      WHERE token = ?
    `);
    return stmt.get(token) as RefreshTokenRecord | undefined;
  }

  /**
   * Elimina un refresh token (usado al hacer logout o refresh)
   */
  delete(token: string): boolean {
    const stmt = this.db.prepare("DELETE FROM refresh_tokens WHERE token = ?");
    const result = stmt.run(token);
    return result.changes > 0;
  }

  /**
   * Elimina todos los refresh tokens de un usuario
   */
  deleteByUser(userId: number, userKind: "user" | "student"): number {
    const stmt = this.db.prepare(`
      DELETE FROM refresh_tokens 
      WHERE user_id = ? AND user_kind = ?
    `);
    const result = stmt.run(userId, userKind);
    return result.changes;
  }

  /**
   * Elimina tokens expirados (limpieza periódica)
   */
  deleteExpired(): number {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare("DELETE FROM refresh_tokens WHERE expires_at < ?");
    const result = stmt.run(now);
    return result.changes;
  }

  /**
   * Verifica si un token es válido (existe y no ha expirado)
   */
  isValid(token: string): { valid: boolean; userId?: number; userKind?: "user" | "student" } {
    const record = this.findByToken(token);
    
    if (!record) {
      return { valid: false };
    }

    const now = Math.floor(Date.now() / 1000);
    if (record.expires_at < now) {
      // Token expirado, eliminarlo
      this.delete(token);
      return { valid: false };
    }

    return { 
      valid: true, 
      userId: record.user_id, 
      userKind: record.user_kind as "user" | "student"
    };
  }
}
