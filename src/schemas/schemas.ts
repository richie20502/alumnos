import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email("El correo electrónico no es válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const studentSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  matricula: z.string().trim().min(1, "La matrícula es obligatoria"),
  email: z.string().trim().email("El correo electrónico no es válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type StudentPayload = z.infer<typeof studentSchema>;
