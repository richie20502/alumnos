# API REST de Administración de Estudiantes

API REST **local** para administrar estudiantes con **CRUD completo** y
**autenticación JWT** (registro, login, logout). Los endpoints de estudiantes
están protegidos: requieren un token válido.

Stack: **Node.js + Express + TypeScript + SQLite** (SQLite integrado de Node,
`node:sqlite`, sin dependencias nativas).

## Requisitos

- Node.js **>= 22** (probado con Node 24). Usa el módulo integrado `node:sqlite`.

## Instalación

```bash
npm install
cp .env.example .env   # ajusta JWT_SECRET, PORT, etc. (en Windows: copy .env.example .env)
```

## Ejecución

```bash
npm run dev     # desarrollo con recarga (tsx watch)
npm run build   # compila TypeScript a dist/
npm start       # ejecuta la versión compilada (dist/server.js)
```

El servidor queda en `http://localhost:3000` (configurable con `PORT`).

## Pruebas

```bash
npm test        # ejecuta la suite (vitest) contra una base SQLite en memoria
```

## Modelo de datos

**Estudiante**: `nombre`, `apellido`, `matricula` (única), `email` (único y con
formato válido) y `password` (mínimo 6 caracteres; se guarda cifrada con bcrypt
y nunca se devuelve en las respuestas).

## Endpoints

| Método | Ruta | Protegido | Descripción |
|--------|------|-----------|-------------|
| GET | `/health` | No | Estado del servicio |
| POST | `/api/auth/register` | No | Registrar usuario (`email`, `password`) |
| POST | `/api/auth/login` | No | Iniciar sesión → devuelve `token` |
| POST | `/api/auth/logout` | Sí | Cerrar sesión (revoca el token actual) |
| GET | `/api/students` | Sí | Listar estudiantes |
| GET | `/api/students/:id` | Sí | Obtener un estudiante |
| POST | `/api/students` | No | Crear estudiante (público) |
| PUT | `/api/students/:id` | Sí | Actualizar estudiante |
| DELETE | `/api/students/:id` | Sí | Eliminar estudiante |

Autenticación: envía el token en el header `Authorization: Bearer <token>`.

## Ejemplos (curl)

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"secret123"}'

# Login (guarda el token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"secret123"}'

# Crear estudiante (público, no requiere token; incluye password)
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Pérez","matricula":"A001","email":"juan@alumnos.example","password":"secret123"}'

# Listar estudiantes
curl http://localhost:3000/api/students -H "Authorization: Bearer <TOKEN>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout -H "Authorization: Bearer <TOKEN>"
```

## Respuestas de error

Formato uniforme: `{ "error": "mensaje", "details": [...] }`. Códigos usados:
`400` (validación), `401` (no autenticado / credenciales inválidas), `404`
(no encontrado), `409` (matrícula o correo duplicado), `500` (error interno).

## Estructura

```
src/
  app.ts               # arma la app Express (inyección de dependencias)
  server.ts            # arranque del servidor
  config/env.ts        # configuración por entorno
  db/database.ts       # conexión SQLite + esquema
  repositories/        # acceso a datos (users, students, tokens revocados)
  services/            # lógica de autenticación (JWT + bcrypt)
  middleware/          # auth, validación, manejo de errores, async
  controllers/         # handlers de auth y estudiantes
  routes/              # definición de rutas
  schemas/             # validación con Zod
tests/                 # pruebas de integración (vitest + supertest)
```
