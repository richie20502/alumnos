import { Router } from "express";
import { createStudentController } from "../controllers/studentController";
import { requireAuth } from "../middleware/auth";
import type { AuthService } from "../services/authService";
import type { StudentRepository } from "../repositories/studentRepository";

/** Todas las rutas de estudiantes están protegidas por JWT. */
export function createStudentRouter(
  students: StudentRepository,
  authService: AuthService,
): Router {
  const router = Router();
  const controller = createStudentController(students);
  const auth = requireAuth(authService);

  // Crear estudiante es público (sin token) por requerimiento del proyecto.
  router.post("/", controller.create);

  // El resto de operaciones requieren token JWT.
  router.get("/", auth, controller.list);
  router.get("/:id", auth, controller.getOne);
  router.put("/:id", auth, controller.update);
  router.delete("/:id", auth, controller.remove);

  return router;
}
