// OpenAPI 3.0 specification derived from Zod validators and route handlers.
// Update this file when adding/changing endpoints or request/response shapes.

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ENEM IA — Backend API',
    version: '1.0.0',
    description: 'API para correção de redações ENEM com IA. Todos os endpoints autenticados exigem Bearer token obtido via /v1/auth/register ou /v1/auth/login.',
    contact: { email: 'dudu.juni0r@gmail.com' },
  },
  servers: [
    { url: '/v1', description: 'Produção (versão atual)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Token de 64 caracteres hex gerado no registro/login.',
      },
    },
    schemas: {
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          requestId: { type: 'string', format: 'uuid' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INVALID_CREDENTIALS' },
              message: { type: 'string', example: 'E-mail ou senha incorretos.' },
            },
          },
        },
      },
      Essay: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          teacherId: { type: 'string' },
          studentId: { type: 'string' },
          studentName: { type: 'string', nullable: true },
          turmaId: { type: 'string', nullable: true },
          turmaName: { type: 'string', nullable: true },
          themeTitle: { type: 'string', nullable: true },
          inputMode: { type: 'string', enum: ['manuscrita', 'digitada', 'upload'] },
          essayText: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pendente', 'processando', 'corrigida', 'precisa_revisao', 'baixa_confiabilidade'] },
          totalScore: { type: 'integer', minimum: 0, maximum: 1000, nullable: true },
          teacherScore: { type: 'integer', minimum: 0, maximum: 1000, nullable: true },
          teacherNote: { type: 'string', nullable: true },
          correctionJson: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          correctedAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
          syncedAt: { type: 'string', format: 'date-time', nullable: true },
          submittedByStudent: { type: 'integer', enum: [0, 1] },
        },
      },
      Turma: {
        type: 'object',
        properties: {
          joinCode: { type: 'string' },
          teacherId: { type: 'string' },
          teacherName: { type: 'string' },
          teacherEmail: { type: 'string' },
          turmaId: { type: 'string' },
          turmaName: { type: 'string' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Token ausente ou inválido.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Acesso negado (teacherId do body não confere com o token).',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso não encontrado.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      RateLimited: {
        description: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registra/autentica um professor',
        description: 'Cria uma conta se não existir. Se já existir, valida senha e renova token se necessário.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teacherId', 'teacherName'],
                properties: {
                  teacherId: { type: 'string', maxLength: 100, example: 'firebase-uid-abc123' },
                  teacherEmail: { type: 'string', maxLength: 254, example: 'prof@escola.com' },
                  teacherName: { type: 'string', minLength: 1, maxLength: 200, example: 'Professora Ana' },
                  passwordHash: { type: 'string', length: 64, description: 'SHA-256 hex da senha (gerado no client)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token gerado ou renovado.',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/Success' }, { properties: { data: { properties: { token: { type: 'string', length: 64 } } } } }] } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login com e-mail e senha',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'passwordHash'],
                properties: {
                  email: { type: 'string', format: 'email', maxLength: 254 },
                  passwordHash: { type: 'string', length: 64, description: 'SHA-256 hex da senha' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login bem-sucedido.',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/Success' }, { properties: { data: { properties: { token: { type: 'string' }, teacherId: { type: 'string' } } } } }] } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerra sessão (revoga token)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logout bem-sucedido.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/push-token': {
      post: {
        tags: ['Auth'],
        summary: 'Salva push token Expo do professor',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['pushToken'], properties: { pushToken: { type: 'string', example: 'ExponentPushToken[xxxxxx]' } } } } },
        },
        responses: {
          200: { description: 'Push token salvo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicita código de redefinição de senha por e-mail',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: {
          200: { description: 'Retorna 200 sempre (previne enumeração de e-mails).', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          503: { description: 'SMTP não configurado no servidor.' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Redefine senha com código de 6 dígitos',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'newPasswordHash'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string', pattern: '^\\d{6}$', description: 'Código de 6 dígitos enviado por e-mail' },
                  newPasswordHash: { type: 'string', length: 64, description: 'SHA-256 hex da nova senha' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Senha redefinida.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          400: { description: 'Código inválido ou expirado (15 min TTL).', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/account': {
      delete: {
        tags: ['Auth'],
        summary: 'Exclui conta do professor e todos os dados associados (GDPR)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conta excluída.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Sync — Essays ─────────────────────────────────────────────────────────
    '/sync/essays': {
      post: {
        tags: ['Sync'],
        summary: 'Sincroniza (upsert) uma redação',
        description: 'Idempotente por `id`. Ignora se `updatedAt` do servidor for ≥ o enviado. Suporta upload de imagem em base64.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'teacherId', 'studentId'],
                properties: {
                  id: { type: 'string' },
                  teacherId: { type: 'string' },
                  studentId: { type: 'string' },
                  studentName: { type: 'string', nullable: true },
                  turmaId: { type: 'string', nullable: true },
                  turmaName: { type: 'string', nullable: true },
                  themeTitle: { type: 'string', nullable: true },
                  inputMode: { type: 'string', enum: ['manuscrita', 'digitada', 'upload'], default: 'manuscrita' },
                  essayText: { type: 'string', maxLength: 20000, nullable: true },
                  status: { type: 'string', enum: ['pendente', 'processando', 'corrigida', 'precisa_revisao', 'baixa_confiabilidade'], default: 'corrigida' },
                  totalScore: { type: 'integer', minimum: 0, maximum: 1000, nullable: true },
                  teacherScore: { type: 'integer', minimum: 0, maximum: 1000, nullable: true },
                  teacherNote: { type: 'string', maxLength: 5000, nullable: true },
                  correctionJson: { type: 'object', nullable: true },
                  createdAt: { type: 'string', format: 'date-time', nullable: true },
                  correctedAt: { type: 'string', format: 'date-time', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time', nullable: true },
                  imageBase64: { type: 'string', maxLength: 15000000, nullable: true, description: 'Base64 da imagem (máx ~10MB antes da codificação)' },
                  imageMimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'], nullable: true },
                  submittedByStudent: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Upsert realizado ou ignorado (conflito de versão).',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/Success' }, { properties: { data: { properties: { ok: { type: 'boolean' }, skipped: { type: 'boolean' } } } } }] } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Sync'],
        summary: 'Lista redações do professor (paginação por cursor)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'syncedAt da última redação recebida (exclusivo)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
        ],
        responses: {
          200: {
            description: 'Página de redações.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/Essay' } },
                        hasMore: { type: 'boolean' },
                        nextCursor: { type: 'string', format: 'date-time', nullable: true },
                      },
                    },
                  ],
                },
              },
            },
          },
          304: { description: 'Não modificado (ETag match).' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/sync/essays/{id}': {
      get: {
        tags: ['Sync'],
        summary: 'Busca uma redação pelo ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Redação encontrada.', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/Success' }, { properties: { data: { $ref: '#/components/schemas/Essay' } } }] } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sync/essays/{id}/teacher-eval': {
      put: {
        tags: ['Sync'],
        summary: 'Adiciona/atualiza avaliação do professor',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  teacherScore: { type: 'integer', minimum: 0, maximum: 1000, nullable: true },
                  teacherNote: { type: 'string', maxLength: 5000, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Avaliação salva.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sync/images/{id}': {
      get: {
        tags: ['Sync'],
        summary: 'Serve imagem WebP da redação (backup no servidor)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Imagem WebP.', content: { 'image/webp': {} } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Sync — Turmas ─────────────────────────────────────────────────────────
    '/sync/turmas': {
      post: {
        tags: ['Sync'],
        summary: 'Cria/atualiza turma e seu código de ingresso',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['joinCode', 'teacherId', 'turmaId'],
                properties: {
                  joinCode: { type: 'string', minLength: 6, maxLength: 20, description: 'Normalizado para maiúsculas' },
                  teacherId: { type: 'string' },
                  teacherName: { type: 'string', maxLength: 200 },
                  teacherEmail: { type: 'string', format: 'email' },
                  turmaId: { type: 'string' },
                  turmaName: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Turma salva.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/sync/turmas/by-code/{code}': {
      get: {
        tags: ['Sync'],
        summary: 'Busca turma por código (público — alunos sem token)',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string', minLength: 6 } }],
        responses: {
          200: { description: 'Turma encontrada.', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/Success' }, { properties: { data: { $ref: '#/components/schemas/Turma' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },

    // ── Health ────────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check do servidor',
        responses: {
          200: { description: 'Servidor saudável.' },
          503: { description: 'Banco de dados inacessível.' },
        },
      },
    },
  },
};
