import type { Express } from "express";
import request from "supertest";
import { createApp } from "../src/app";
import { createDatabase } from "../src/db/database";

export function buildTestApp(): Express {
  const db = createDatabase(":memory:");
  return createApp(db);
}

/** Registra un usuario, inicia sesión y devuelve el token JWT. */
export async function authenticate(
  app: Express,
  email = "user@test.com",
  password = "secret123",
): Promise<string> {
  await request(app).post("/api/auth/register").send({ email, password });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.token as string;
}
