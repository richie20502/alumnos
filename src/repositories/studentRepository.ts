import type { AppDatabase } from "../db/database";

export interface StudentRow {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/** Estudiante sin datos sensibles (para respuestas de la API). */
export type PublicStudent = Omit<StudentRow, "password_hash">;

export interface StudentInput {
  nombre: string;
  apellido: string;
  matricula: string;
  email: string;
  passwordHash: string;
}

export function toPublicStudent(row: StudentRow): PublicStudent {
  const { password_hash: _omit, ...rest } = row;
  return rest;
}

export class StudentRepository {
  constructor(private readonly db: AppDatabase) {}

  findAll(): StudentRow[] {
    return this.db
      .prepare("SELECT * FROM students ORDER BY id ASC")
      .all() as unknown as StudentRow[];
  }

  findById(id: number): StudentRow | undefined {
    return this.db
      .prepare("SELECT * FROM students WHERE id = ?")
      .get(id) as StudentRow | undefined;
  }

  findByEmail(email: string): StudentRow | undefined {
    return this.db
      .prepare("SELECT * FROM students WHERE email = ?")
      .get(email) as StudentRow | undefined;
  }

  create(input: StudentInput): StudentRow {
    const stmt = this.db.prepare(
      `INSERT INTO students (nombre, apellido, matricula, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const info = stmt.run(
      input.nombre,
      input.apellido,
      input.matricula,
      input.email,
      input.passwordHash,
    );
    return this.findById(Number(info.lastInsertRowid))!;
  }

  update(id: number, input: StudentInput): StudentRow {
    this.db
      .prepare(
        `UPDATE students
         SET nombre = ?, apellido = ?, matricula = ?, email = ?,
             password_hash = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        input.nombre,
        input.apellido,
        input.matricula,
        input.email,
        input.passwordHash,
        id,
      );
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    const info = this.db
      .prepare("DELETE FROM students WHERE id = ?")
      .run(id);
    return info.changes > 0;
  }
}
