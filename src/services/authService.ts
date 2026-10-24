import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { config } from "../config/env";
import { conflict, unauthorized } from "../errors/httpError";
import type { UserRepository } from "../repositories/userRepository";
import type { TokenRepository } from "../repositories/tokenRepository";
import type { StudentRepository } from "../repositories/studentRepository";
import type { RefreshTokenRepository } from "../repositories/refreshTokenRepository";

export interface PublicUser {
  id: number;
  email: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  jti: string;
  exp: number;
  iat: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 días en segundos

  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenRepository,
    private readonly students: StudentRepository,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async register(email: string, password: string): Promise<PublicUser> {
    if (this.users.findByEmail(email)) {
      throw conflict("Ya existe un usuario con ese correo electrónico");
    }
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const user = this.users.create(email, hash);
    return { id: user.id, email: user.email };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    // Se puede iniciar sesión con una cuenta de usuario (registro) o con
    // las credenciales de un estudiante (email + password).
    const user = this.users.findByEmail(email);
    const student = user ? undefined : this.students.findByEmail(email);
    const account = user
      ? { id: user.id, email: user.email, hash: user.password_hash, kind: "user" as const }
      : student
        ? {
            id: student.id,
            email: student.email,
            hash: student.password_hash,
            kind: "student" as const,
          }
        : undefined;

    if (!account || account.hash === "") {
      throw unauthorized("Credenciales inválidas");
    }

    const ok = await bcrypt.compare(password, account.hash);
    if (!ok) throw unauthorized("Credenciales inválidas");

    // Generar access token
    const accessToken = this.generateAccessToken(account.id, account.email, account.kind);
    
    // Generar refresh token
    const refreshTokenRecord = this.refreshTokens.create(
      account.id,
      account.kind,
      this.refreshTokenExpiry,
    );

    return { 
      accessToken, 
      refreshToken: refreshTokenRecord.token, 
      user: { id: account.id, email: account.email } 
    };
  }

  /**
   * Refresca el access token usando un refresh token válido
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verificar refresh token
    const validation = this.refreshTokens.isValid(refreshToken);
    
    if (!validation.valid || !validation.userId || !validation.userKind) {
      throw unauthorized("Refresh token inválido o expirado");
    }

    // Eliminar el refresh token anterior (rotación)
    this.refreshTokens.delete(refreshToken);

    // Obtener datos del usuario/estudiante
    const user = validation.userKind === "user" 
      ? this.users.findById(validation.userId)
      : null;
    const student = validation.userKind === "student"
      ? this.students.findById(validation.userId)
      : null;
    
    const account = user || student;
    
    if (!account) {
      throw unauthorized("Usuario no encontrado");
    }

    // Generar nuevos tokens
    const accessToken = this.generateAccessToken(
      account.id, 
      account.email, 
      validation.userKind
    );
    
    const refreshTokenRecord = this.refreshTokens.create(
      account.id,
      validation.userKind,
      this.refreshTokenExpiry,
    );

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }

  /**
   * Genera un access token JWT
   */
  private generateAccessToken(userId: number, email: string, kind: "user" | "student"): string {
    const options: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
      jwtid: randomUUID(),
    };
    return jwt.sign(
      { sub: String(userId), email, kind },
      config.jwtSecret,
      options,
    );
  }

  /** Revoca el token actual (logout) usando su jti y expiración. */
  logout(payload: TokenPayload, refreshToken?: string): void {
    // Revocar access token
    this.tokens.revoke(payload.jti, payload.exp);
    
    // Eliminar refresh token si se proporciona
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      if (!decoded.jti) throw new Error("token sin jti");
      if (this.tokens.isRevoked(decoded.jti)) {
        throw unauthorized("La sesión ha sido cerrada");
      }
      return decoded;
    } catch (err) {
      if (err instanceof Error && err.name === "HttpError") throw err;
      throw unauthorized("Token inválido o expirado");
    }
  }
}