import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";
import type { AppDatabase } from "./db/database";
import { UserRepository } from "./repositories/userRepository";
import { StudentRepository } from "./repositories/studentRepository";
import { TokenRepository } from "./repositories/tokenRepository";
import { AuthService } from "./services/authService";
import { createAuthRouter } from "./routes/authRoutes";
import { createStudentRouter } from "./routes/studentRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/**
 * Construye la aplicación Express con todas las dependencias inyectadas
 * a partir de una base de datos. Permite crear apps aisladas en pruebas.
 */
export function createApp(db: AppDatabase): Express {
  const users = new UserRepository(db);
  const students = new StudentRepository(db);
  const tokens = new TokenRepository(db);
  const authService = new AuthService(users, tokens);

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Documentación Swagger / OpenAPI
  app.get("/api-docs.json", (_req, res) => {
    res.json(openapiSpec);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "API de Estudiantes — Documentación",
    }),
  );

  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/students", createStudentRouter(students, authService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
