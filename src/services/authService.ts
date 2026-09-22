import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { config } from "../config/env";
import { conflict, unauthorized } from "../errors/httpError";
import type { UserRepository } from "../repositories/userRepository";
import type { TokenRepository } from "../repositories/tokenRepository";
import type { StudentRepository } from "../repositories/studentRepository";

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
    private readonly students: StudentRepository,
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
    // Se puede iniciar sesión con una cuenta de usuario (registro) o con
    // las credenciales de un estudiante (email + password).
    const user = this.users.findByEmail(email);
    const student = user ? undefined : this.students.findByEmail(email);
    const account = user
      ? { id: user.id, email: user.email, hash: user.password_hash, kind: "user" }
      : student
        ? {
            id: student.id,
            email: student.email,
            hash: student.password_hash,
            kind: "student",
          }
        : undefined;

    if (!account || account.hash === "") {
      throw unauthorized("Credenciales inválidas");
    }

    const ok = await bcrypt.compare(password, account.hash);
    if (!ok) throw unauthorized("Credenciales inválidas");

    const options: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
      jwtid: randomUUID(),
    };
    const token = jwt.sign(
      { sub: String(account.id), email: account.email, kind: account.kind },
      config.jwtSecret,
      options,
    );
    return { token, user: { id: account.id, email: account.email } };
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
