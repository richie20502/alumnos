/**
 * Especificación OpenAPI 3.0 de la API de estudiantes.
 * Se sirve como UI interactiva en `/api-docs` y como JSON en `/api-docs.json`.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API REST de Administración de Estudiantes",
    version: "1.0.0",
    description:
      "API local para administrar estudiantes (CRUD) con autenticación JWT " +
      "(registro, login, logout). Los endpoints de estudiantes están protegidos.",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
  tags: [
    { name: "Auth", description: "Registro, inicio y cierre de sesión" },
    { name: "Estudiantes", description: "CRUD de estudiantes (requiere token)" },
    { name: "Sistema", description: "Estado del servicio" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Envía el token como `Authorization: Bearer <token>`",
      },
    },
    schemas: {
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ana@test.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "ana@test.com" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
          user: { $ref: "#/components/schemas/PublicUser" },
        },
      },
      StudentInput: {
        type: "object",
        required: ["nombre", "apellido", "matricula", "email", "password"],
        properties: {
          nombre: { type: "string", example: "Juan" },
          apellido: { type: "string", example: "Pérez" },
          matricula: { type: "string", example: "A001" },
          email: { type: "string", format: "email", example: "juan@alumnos.test" },
          password: {
            type: "string",
            minLength: 6,
            example: "secret123",
            description: "Contraseña del estudiante (se guarda cifrada, nunca se devuelve)",
          },
        },
      },
      Student: {
        type: "object",
        description: "Estudiante devuelto por la API (sin la contraseña).",
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "Juan" },
          apellido: { type: "string", example: "Pérez" },
          matricula: { type: "string", example: "A001" },
          email: { type: "string", format: "email", example: "juan@alumnos.test" },
          created_at: { type: "string", example: "2026-09-22 12:00:00" },
          updated_at: { type: "string", example: "2026-09-22 12:00:00" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Datos de entrada inválidos" },
          details: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Estado del servicio",
        security: [],
        responses: {
          "200": {
            description: "Servicio operativo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar un usuario",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/PublicUser" } },
                },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "El correo ya existe", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Token emitido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "401": { description: "Credenciales inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión (revoca el token actual)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Sesión cerrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "Sesión cerrada" } },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/students": {
      get: {
        tags: ["Estudiantes"],
        summary: "Listar estudiantes",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de estudiantes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Student" } },
                  },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Estudiantes"],
        summary: "Crear estudiante (público, no requiere token)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Estudiante creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Student" } },
                },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Matrícula o correo duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/students/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
      ],
      get: {
        tags: ["Estudiantes"],
        summary: "Obtener un estudiante",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Estudiante encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Student" } },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Estudiantes"],
        summary: "Actualizar un estudiante",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Estudiante actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Student" } },
                },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Matrícula o correo duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Estudiantes"],
        summary: "Eliminar un estudiante",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Eliminado (sin contenido)" },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
} as const;
