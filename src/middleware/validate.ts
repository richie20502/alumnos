import type { ZodSchema } from "zod";
import { badRequest } from "../errors/httpError";

/** Valida y normaliza un objeto con un esquema Zod; lanza 400 si falla. */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join(".") || "(root)",
      message: i.message,
    }));
    throw badRequest("Datos de entrada inválidos", details);
  }
  return result.data;
}
