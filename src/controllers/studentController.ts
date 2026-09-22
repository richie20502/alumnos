import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseBody } from "../middleware/validate";
import { badRequest, notFound } from "../errors/httpError";
import { studentSchema } from "../schemas/schemas";
import {
  toPublicStudent,
  type StudentInput,
  type StudentRepository,
} from "../repositories/studentRepository";
import { config } from "../config/env";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("El id debe ser un entero positivo");
  }
  return id;
}

async function toInput(body: unknown): Promise<StudentInput> {
  const data = parseBody(studentSchema, body);
  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
  return {
    nombre: data.nombre,
    apellido: data.apellido,
    matricula: data.matricula,
    email: data.email,
    passwordHash,
  };
}

export function createStudentController(students: StudentRepository) {
  const list = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: students.findAll().map(toPublicStudent) });
  });

  const getOne = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const student = students.findById(id);
    if (!student) throw notFound("Estudiante no encontrado");
    res.json({ data: toPublicStudent(student) });
  });

  const create = asyncHandler(async (req: Request, res: Response) => {
    const input = await toInput(req.body);
    const student = students.create(input);
    res.status(201).json({ data: toPublicStudent(student) });
  });

  const update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!students.findById(id)) throw notFound("Estudiante no encontrado");
    const input = await toInput(req.body);
    res.json({ data: toPublicStudent(students.update(id, input)) });
  });

  const remove = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!students.delete(id)) throw notFound("Estudiante no encontrado");
    res.status(204).send();
  });

  return { list, getOne, create, update, remove };
}
