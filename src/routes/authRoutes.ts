import { Router } from "express";
import { createAuthController } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import type { AuthService } from "../services/authService";

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();
  const controller = createAuthController(authService);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/logout", requireAuth(authService), controller.logout);

  return router;
}
