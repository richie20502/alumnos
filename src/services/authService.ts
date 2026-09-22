import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { config } from "../config/env";
import { conflict, unauthorized } from "../errors/httpError";
import type { UserRepository } from "../repositories/userRepository";
import type { TokenRepository } from "../repositories/tokenRepository";

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

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenRepository,
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
  ): Promise<{ token: string; user: PublicUser }> {
    const user = this.users.findByEmail(email);
    if (!user) throw unauthorized("Credenciales inválidas");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw unauthorized("Credenciales inválidas");

    const options: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
      jwtid: randomUUID(),
    };
    const token = jwt.sign(
      { sub: String(user.id), email: user.email },
      config.jwtSecret,
      options,
    );
    return { token, user: { id: user.id, email: user.email } };
  }

  /** Revoca el token actual (logout) usando su jti y expiración. */
  logout(payload: TokenPayload): void {
    this.tokens.revoke(payload.jti, payload.exp);
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
