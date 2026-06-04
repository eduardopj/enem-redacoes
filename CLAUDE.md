# ENEM IA — Documentação Técnica Completa

> Guia definitivo para desenvolvimento, arquitetura e evolução do produto.
> Atualizado em 04/06/2026 — Avaliação arquitetural v5 (nota 9.1/10)

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Setup do Ambiente](#5-setup-do-ambiente)
6. [Backend — Express + PostgreSQL](#6-backend--express--postgresql)
7. [Frontend — Expo + Zustand](#7-frontend--expo--zustand)
8. [CI/CD e Deploy](#8-cicd-e-deploy)
9. [Padrões de Desenvolvimento](#9-padrões-de-desenvolvimento)
10. [Histórico de Evolução](#10-histórico-de-evolução)
11. [Tudo que foi feito](#11-tudo-que-foi-feito)
12. [O que falta e roadmap nacional](#12-o-que-falta-e-roadmap-nacional)

---

## 1. Visão Geral do Produto

**ENEM IA** é uma plataforma mobile-first de correção de redações do ENEM com inteligência artificial. Professores fotografam redações manuscritas dos alunos, a IA avalia nas 5 competências oficiais do ENEM e entrega feedback detalhado em segundos.

### Público-alvo
- **Professores** — corrigem redações, acompanham evolução da turma, identificam alunos com dificuldade
- **Alunos** — acessam seus resultados, evolução histórica e ranking da turma

### Proposta de valor
| Situação atual | Com ENEM IA |
|---|---|
| Correção manual: 15–30 min/redação | Correção por IA: 30–60 segundos |
| Feedback genérico | Feedback por competência (C1–C5) + transcrição |
| Sem histórico estruturado | Evolução visual com sparklines |
| Sem visibilidade da turma | Dashboard pedagógico com insights |

### Modelo de negócio
SaaS B2B para escolas e redes de ensino. Receita por turma/mês ou por correção.

---

## 2. Stack Tecnológica

### Frontend
| Tecnologia | Versão | Papel |
|---|---|---|
| Expo | 54 | Framework mobile (managed workflow) |
| React Native | 0.81 | Renderização nativa iOS/Android |
| Expo Router | 6 | Roteamento file-based |
| Zustand | 5 | Estado global + persistência AsyncStorage |
| TypeScript | 5.x | Tipos end-to-end |
| tRPC | latest | Contrato tipado frontend↔backend |
| React Native Reanimated | 4.x | Animações nativas |
| expo-notifications | 0.32 | Push + lock screen notifications |
| expo-navigation-bar | 5.x | Cor da barra de navegação Android |
| expo-quick-actions | 6.x | App shortcuts (pressão longa no ícone) |

### Backend
| Tecnologia | Versão | Papel |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | HTTP server |
| TypeScript + tsx | — | Tipagem full-stack, sem build step |
| PostgreSQL | 16 | Banco de dados principal (produção) |
| better-sqlite3 | 12.x | Banco local (desenvolvimento/fallback) |
| OpenAI SDK | latest | Correção via GPT-4.1-mini Vision |
| Zod | 3.x | Validação de input em todas as rotas |
| Redis (ioredis) | — | Rate limiting distribuído |
| PM2 | — | Process manager em produção |

### Infraestrutura
| Serviço | Uso |
|---|---|
| DigitalOcean Droplet | Servidor backend (134.209.38.46) |
| PostgreSQL 16 (local) | Banco de dados |
| Redis | Rate limiting persistente |
| Nginx | Proxy reverso + TLS |
| GitHub Actions | CI/CD automatizado |
| EAS Build | Build e deploy mobile (Expo) |
| Sentry | Monitoramento de erros + performance |

---

## 3. Arquitetura do Sistema

### Visão macro

```
┌─────────────────────────────────────────────────────────┐
│                    DISPOSITIVO MÓVEL                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Expo / React Native App               │   │
│  │                                                   │   │
│  │  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │  │  Telas   │  │   Zustand  │  │   tRPC      │  │   │
│  │  │ (Router) │←→│  + AsyncSt │←→│   Client    │  │   │
│  │  └──────────┘  └────────────┘  └──────┬──────┘  │   │
│  └─────────────────────────────────────── │ ────────┘   │
└────────────────────────────────────────── │ ────────────┘
                                            │ HTTPS
                        ┌───────────────────▼──────────────────┐
                        │         BACKEND (DigitalOcean)        │
                        │                                        │
                        │  ┌─────────┐  ┌─────────────────┐    │
                        │  │ Express │  │   OpenAI API    │    │
                        │  │ + Zod   │→ │  GPT-4.1-mini   │    │
                        │  └────┬────┘  └─────────────────┘    │
                        │       │                                │
                        │  ┌────▼──────────────┐               │
                        │  │   db-client.ts    │               │
                        │  │  (dual-mode)      │               │
                        │  └────┬──────────────┘               │
                        │       │                                │
                        │  ┌────▼────┐  ┌──────────┐          │
                        │  │ PostGre │  │  Redis   │          │
                        │  │ SQL 16  │  │(rate lim)│          │
                        │  └─────────┘  └──────────┘          │
                        └────────────────────────────────────────┘
```

### Fluxo de correção

```
1. Professor fotografa redação no app
2. App cria Essay local (AsyncStorage via Zustand)
3. correction.slice.ts inicia evaluateEssayWithOpenAI()
4. correction-executor.ts → POST /v1/openai/correct (backend)
5. Backend: valida via Zod → chama GPT-4.1-mini Vision
6. GPT retorna JSON estruturado (5 competências + feedbacks)
7. Backend responde → frontend atualiza estado
8. Lock screen notification: "Redação corrigida! ✅"
9. Fire-and-forget: POST /v1/sync/essays (backup no PostgreSQL)
```

### Arquitetura local-first

O app é **local-first**: dados vivem no dispositivo (AsyncStorage) e são sincronizados com o backend de forma assíncrona. O app funciona offline para consulta; apenas a correção requer conexão.

```
AsyncStorage (Zustand persist)   ← fonte da verdade primária
       ↕ sync (fire-and-forget)
PostgreSQL (backend)             ← backup secundário + analytics
```

### db-client.ts — Driver Dual

O backend suporta SQLite (desenvolvimento) e PostgreSQL (produção) via variável de ambiente:

```typescript
// DATABASE_URL definido → PostgreSQL
// DATABASE_URL ausente  → SQLite

function getDriver(): Promise<DbDriver> {
  return env.databaseUrl ? makePgDriver(env.databaseUrl) : makeSqliteDriver();
}
```

O `toPgSql()` converte automaticamente a sintaxe SQLite para PostgreSQL:
- `?` → `$1, $2, ...`
- `camelCase` → `"camelCase"` (identificadores quoted)
- `datetime('now')` → `CURRENT_TIMESTAMP`

---

## 4. Estrutura de Diretórios

```
enem-redacoes/
├── app/                          # Telas (Expo Router file-based)
│   ├── _layout.tsx               # Root layout: Sentry, notificações, QuickActions
│   ├── index.tsx                 # Tela inicial (escolha professor/aluno)
│   ├── login.tsx                 # Login do professor
│   ├── signup.tsx                # Cadastro do professor
│   ├── dashboard.tsx             # Dashboard principal (orquestrador)
│   ├── nova-redacao.tsx          # Wizard de nova redação (orquestrador)
│   ├── ranking.tsx               # Ranking de alunos e turmas (orquestrador)
│   ├── redacoes.tsx              # Lista de redações
│   ├── correcoes.tsx             # Fila de correções
│   ├── alunos.tsx                # Lista de alunos
│   ├── temas.tsx                 # Lista de temas
│   ├── turmas.tsx                # Lista de turmas
│   ├── analytics.tsx             # Análise pedagógica
│   ├── resultado/[id].tsx        # Resultado de uma redação
│   ├── redacao/[id].tsx          # Detalhe de redação em correção
│   ├── student/                  # Área do aluno
│   │   ├── login.tsx             # Login do aluno
│   │   ├── home.tsx              # Dashboard do aluno
│   │   ├── redacoes.tsx          # Redações do aluno
│   │   ├── evolucao.tsx          # Evolução histórica
│   │   └── ranking.tsx           # Ranking da turma
│   └── ...
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Componentes base reutilizáveis
│   │   │   ├── AppFooter.tsx     # Footer global (nav + footer simples)
│   │   │   ├── BottomNav.tsx     # Navegação inferior professor
│   │   │   ├── StudentBottomNav.tsx
│   │   │   ├── ScreenContainer.tsx # Wrapper padrão de telas
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Sparkline.tsx     # Gráfico SVG de evolução
│   │   │   ├── FlashList (via @shopify/flash-list)
│   │   │   └── ...
│   │   ├── dashboard/            # Sub-componentes do dashboard
│   │   ├── nova-redacao/         # Steps do wizard
│   │   ├── ranking/              # Componentes de ranking
│   │   └── auth/
│   │
│   ├── hooks/                    # Custom hooks de lógica de tela
│   │   ├── useDashboardData.ts   # Estado + memos do dashboard
│   │   ├── useNovaRedacaoForm.ts # Estado + handlers do wizard
│   │   ├── useRankingData.ts     # Dados de ranking calculados
│   │   └── useOfflineSync.ts     # Detecção de rede + retry queue
│   │
│   ├── store/
│   │   ├── app-store.ts          # Store central (Zustand)
│   │   ├── store.types.ts        # Tipos do store
│   │   └── slices/
│   │       ├── auth.slice.ts     # Autenticação do professor
│   │       ├── essays.slice.ts   # CRUD de redações
│   │       ├── correction.slice.ts # Pipeline de correção IA
│   │       ├── students.slice.ts
│   │       ├── themes.slice.ts
│   │       ├── turmas.slice.ts
│   │       └── sync.slice.ts     # Sincronização com backend
│   │
│   ├── repositories/
│   │   ├── IEssayRepository.ts   # Interface do repositório
│   │   └── BackendEssayRepository.ts # Implementação HTTP
│   │
│   ├── services/
│   │   ├── api.ts                # HTTP client base
│   │   ├── auth/                 # Auth com backend
│   │   ├── correction/           # Pipeline de correção
│   │   │   └── correction-executor.ts
│   │   ├── sync/                 # Sincronização de dados
│   │   │   └── sync-essays.ts
│   │   ├── openai/               # Chamadas à OpenAI
│   │   ├── notifications/        # Push notifications
│   │   └── research/             # Salvamento para pesquisa
│   │
│   ├── types/
│   │   ├── app.ts                # Tipos principais (Essay, Student, Teacher...)
│   │   ├── api.ts                # Tipos de resposta da API
│   │   └── enums.ts              # EssayStatus, EssayInputMode, ConfidenceLevel
│   │
│   ├── utils/
│   │   ├── analytics.ts          # Funções de cálculo estatístico
│   │   ├── id.ts                 # Geração de IDs únicos
│   │   └── crypto.ts             # Hash de senha (client-side)
│   │
│   └── theme/
│       ├── index.ts              # Paleta de cores light/dark
│       └── ThemeContext.tsx      # Provider de tema
│
├── backend/
│   ├── src/
│   │   ├── app.ts                # Express app + middlewares
│   │   ├── server.ts             # HTTP server + graceful shutdown
│   │   ├── config/env.ts         # Variáveis de ambiente tipadas
│   │   ├── routes/               # Rotas Express (TS + JS)
│   │   │   ├── auth.routes.ts    # POST /register, /login, /logout
│   │   │   ├── sync.routes.ts    # GET/POST /essays, /turmas
│   │   │   ├── openai.routes.ts  # POST /correct
│   │   │   └── research.routes.ts
│   │   ├── services/
│   │   │   ├── db-client.ts      # Dual-mode DB adapter
│   │   │   ├── database.ts       # SQLite singleton (dev)
│   │   │   ├── auth.service.ts   # PBKDF2 + tokens
│   │   │   ├── sync.service.ts   # Upsert de redações
│   │   │   ├── openai.service.ts # Chamada GPT-4.1-mini
│   │   │   ├── email.service.ts  # SMTP (recuperação de senha)
│   │   │   └── backup.scheduler.ts # Backup diário SQLite
│   │   ├── repositories/         # Camada de acesso ao banco
│   │   │   ├── essay.repository.ts
│   │   │   ├── teacher.repository.ts
│   │   │   └── turma.repository.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # Validação de token Bearer
│   │   │   └── request-id.ts     # UUID por requisição (correlation ID)
│   │   ├── validators/           # Schemas Zod
│   │   └── trpc/                 # tRPC router tipado
│   │       ├── router.ts
│   │       └── procedures/
│   └── migrations/
│       ├── 001_initial.pg.sql    # Schema PostgreSQL (CREATE TABLE IF NOT EXISTS)
│       └── migrate-sqlite-to-pg.js # Migração one-shot SQLite→PG
│
├── e2e/                          # Testes E2E (Detox)
│   ├── jest.config.js
│   ├── teacher-login.e2e.js
│   ├── essay-correction.e2e.js
│   └── student-flow.e2e.js
│
├── .github/workflows/
│   ├── ci.yml                    # Backend tests + Frontend tests (gate)
│   ├── deploy.yml                # Deploy automático para o droplet
│   └── e2e.yml                   # Detox Android (emulador API 34)
│
├── .detoxrc.js                   # Configuração Detox (debug + release)
├── CLAUDE.md                     # Este arquivo
└── package.json                  # Frontend deps + Jest config
```

---

## 5. Setup do Ambiente

### Pré-requisitos
- Node.js 20 LTS
- Expo CLI (`npm install -g expo`)
- EAS CLI (`npm install -g eas-cli`)
- Conta Expo (expo.dev)
- Chave de API OpenAI

### Frontend

```bash
# Instalar dependências
npm install

# Rodar no Expo Go (desenvolvimento)
npx expo start

# Rodar no Android (emulador)
npx expo start --android

# Build de produção (EAS)
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
# Preencher: OPENAI_API_KEY, PORT, DATA_DIR

# Rodar em desenvolvimento (SQLite automático)
npm run dev

# Rodar testes
npm test

# Verificar tipos
npm run typecheck
```

### Variáveis de Ambiente (Backend)

```env
# Obrigatório
OPENAI_API_KEY=sk-...
PORT=3333
DATA_DIR=/opt/enem-ia/backend/data

# Banco de dados (opcional — sem DATABASE_URL usa SQLite)
DATABASE_URL=postgres://enem:senha@localhost:5432/enem_redacoes

# Redis (opcional — sem REDIS_URL usa rate limiter in-memory)
REDIS_URL=redis://localhost:6379

# E-mail para recuperação de senha
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Backup S3 (opcional)
BACKUP_S3_BUCKET=enem-ia-backups
BACKUP_S3_REGION=us-east-1

# Sentry (opcional)
SENTRY_DSN=https://...
```

### Variáveis de Ambiente (Frontend)

```env
EXPO_PUBLIC_BACKEND_URL=https://134-209-38-46.nip.io
EXPO_PUBLIC_SENTRY_DSN=https://...
EXPO_PUBLIC_APP_PEPPER=...   # Prefixo de hash de senha (defesa em profundidade)
```

---

## 6. Backend — Express + PostgreSQL

### Autenticação

O sistema usa **tokens Bearer** gerados no registro/login:

1. Cliente envia `SHA-256(PEPPER + senha)` — hash feito no dispositivo
2. Backend aplica `PBKDF2-SHA512` (100.000 iterações) sobre o hash recebido
3. Token de 64 chars é armazenado e retornado
4. Todas as rotas protegidas verificam `Authorization: Bearer <token>`

```
Dispositivo: senha → SHA-256(PEPPER + senha) → envia para backend
Backend: recebe hash → PBKDF2(hash, salt, 100k iter) → armazena
```

### Rate Limiting

```typescript
// Rotas de auth: 10 req/15min por IP
authLimiter → POST /auth/register, /auth/login

// Lookup de turma (público): 30 req/min por IP
turmaLookupLimiter → GET /sync/turmas/by-code/:code
```

Persiste via Redis quando `REDIS_URL` está definido. Fallback in-memory.

### Rotas da API

```
POST /v1/auth/register          Criar/recuperar conta de professor
POST /v1/auth/login             Login com credenciais
POST /v1/auth/logout            Revogar token
POST /v1/auth/push-token        Registrar token de push notification
POST /v1/auth/reset-password    Solicitar recuperação de senha

POST /v1/openai/correct         Corrigir redação com GPT-4.1-mini

GET  /v1/sync/essays            Listar redações do professor (paginado)
POST /v1/sync/essays            Upsert de redação (sync do dispositivo)
GET  /v1/sync/essays/:id        Detalhe de uma redação
PUT  /v1/sync/essays/:id/teacher-eval  Avaliação do professor
POST /v1/sync/turmas            Registrar turma
GET  /v1/sync/turmas/by-code/:code  Buscar turma por código

GET  /health                    Health check (inclui status do DB)
GET  /openapi.json              Schema OpenAPI 3.0
GET  /docs                      Swagger UI
```

### Camada de Repositório

Cada tabela tem um repositório com funções assíncronas:

```typescript
// essay.repository.ts
findEssayById(id)
findEssaysByTeacher(teacherId, { cursor, limit })
upsertEssayRow(data)
updateEssayTeacherEval(id, score, note)
deleteEssaysByTeacher(teacherId)

// teacher.repository.ts
findTeacherByEmail(email)
findTeacherByToken(token)
createTeacher(params)
revokeTeacherToken(token)
saveTeacherPushToken(teacherId, token)
deleteTeacherCascade(teacherId)  // transação atômica

// turma.repository.ts
upsertTurmaRow(params)
findTurmaByCode(code)
deleteTurmasByTeacher(teacherId)
```

### PostgreSQL em Produção

```bash
# URL de conexão
DATABASE_URL=postgres://enem:SENHA@localhost:5432/enem_redacoes

# O servidor auto-cria as tabelas no startup (idempotente)
# Schema: backend/migrations/001_initial.pg.sql

# Migração one-shot (SQLite → PostgreSQL)
DATABASE_URL=postgres://... DATA_DIR=/data node backend/migrations/migrate-sqlite-to-pg.js
```

---

## 7. Frontend — Expo + Zustand

### Store (Zustand)

O estado global é dividido em slices combinados em `app-store.ts`:

```
AppState = AuthSlice + EssaysSlice + CorrectionSlice + StudentsSlice
         + ThemesSlice + TurmasSlice + SyncSlice
```

**Persistência**: `zustand/middleware/persist` com AsyncStorage. O store é hidratado no startup do app.

**Seletores shallow**: todos os componentes usam `useShallow` para evitar re-renders desnecessários.

### Pipeline de Correção

```
correction.slice.ts
  └── evaluateEssayWithOpenAI(essayId)
        ├── Marca essay como "processando"
        ├── Auto-register se sem token (sessão padrão)
        ├── correction-executor.ts → POST /v1/openai/correct
        │     ├── ETAPA 1/4: lendo a imagem
        │     ├── ETAPA 2/4: transcrevendo
        │     ├── ETAPA 3/4: avaliando competências
        │     └── ETAPA 4/4: gerando feedback
        ├── Atualiza essay com resultado (status → "corrigida")
        ├── Dispara lock screen notification
        ├── Fire-and-forget: saveEssayForResearch()
        └── Fire-and-forget: backendEssayRepository.push()
```

**Retry automático**: falhas de rede → `RETRY_DELAYS = [8s, 20s]` → `addToRetryQueue()`.
**Retry no reconectar**: `useOfflineSync` detecta reconexão → `processRetryQueue()`.

### Padrão de Telas (Hooks de Lógica)

As telas principais são orquestradores finos. Toda lógica fica nos hooks:

```typescript
// app/dashboard.tsx — 234 linhas
export default function DashboardScreen() {
  const { colors, hasHydrated, correctedEssays, ... } = useDashboardData();
  return <ProtectedRoute>...</ProtectedRoute>;
}

// src/hooks/useDashboardData.ts — toda a lógica
export function useDashboardData() {
  // useAppStore, useAppTheme, useMemo x8, router
  return { colors, classStats, contextualAction, ... };
}
```

### Competências do ENEM

O sistema avalia nas 5 competências oficiais:

| Comp. | Nome | Peso/Nota máx. |
|---|---|---|
| C1 | Domínio da Norma Culta | 200 |
| C2 | Compreensão e aplicação do tema | 200 |
| C3 | Seleção e organização de informações | 200 |
| C4 | Coesão textual | 200 |
| C5 | Proposta de intervenção | 200 |
| **Total** | | **1000** |

### Sistema de Notificações

```typescript
// Lock screen: ao término de cada correção
Notifications.scheduleNotificationAsync({
  content: {
    title: 'Redação corrigida! ✅',
    body: `${studentName} — ${score} pts`,
    data: { essayId },  // deep link para resultado
  },
  trigger: null,  // imediato
});

// Push: quando aluno envia redação
sendExpoPush(pushToken, { title, body, data: { essayId } });
```

### Offline Banner

`useOfflineSync` monitora conectividade via `@react-native-community/netinfo`:
- Queda → exibe `OfflineBanner` animado
- Reconexão → `processRetryQueue()` automático

---

## 8. CI/CD e Deploy

### GitHub Actions

**`ci.yml`** — roda em todo push:
```yaml
jobs:
  test-backend:   # node --import tsx/esm --test src/**/*.test.js
  test-frontend:  # jest --testPathPattern (com coverage 70%)
```

**`deploy.yml`** — roda em push para main (após CI):
```yaml
steps:
  - Snapshot: cp backend/ backend.previous
  - git pull + npm ci
  - pm2 restart enem-backend
  - Health check: curl /health
  - Rollback automático se health check falhar
```

**`e2e.yml`** — roda em push/PR para main:
```yaml
steps:
  - expo prebuild --platform android
  - Gradle: assembleDebug
  - Android emulator (Pixel 7, API 34)
  - detox test --configuration android.emu.debug
```

### Deploy Manual

```bash
# SSH no servidor
ssh -i ~/.ssh/github-actions-deploy root@134.209.38.46

# Estrutura do servidor
/opt/enem-ia/
├── backend/          # Código atual
├── backend.previous/ # Snapshot para rollback
└── backend/data/
    ├── essays.db          # SQLite (mantido como backup)
    ├── essays.db.bak-*    # Backups datados
    └── research/          # Dados de pesquisa (essays.ndjson + imagens)
```

### Rollback

```bash
# Em caso de problema grave:
pm2 stop enem-backend
cp -r backend.previous backend
pm2 start enem-backend

# Ou via git tag (restore point pré-mudança):
git checkout pre-dt01-restore
```

---

## 9. Padrões de Desenvolvimento

### TypeScript

- **Zero `any`** em tipos de negócio — apenas em adaptadores de bibliotecas
- **Tipos centralizados** em `src/types/app.ts` e `src/types/enums.ts`
- `tsc --noEmit` deve passar sem erros antes de qualquer commit
- Backend: `tsconfig.json` estrito, `tsx` como loader (sem build step)

### SQL (Backend)

- Toda SQL escrita em dialeto SQLite com `?` placeholders
- `toPgSql()` converte automaticamente para PostgreSQL em produção
- Nunca usar `db.prepare()` diretamente — sempre via `db-client.ts`
- Transações atômicas via `transaction([...ops])` do db-client

### Convenções de Commits

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
design: mudança visual / UX
docs: documentação
test: adição/correção de testes
```

### Testes

```bash
# Frontend (Jest)
npm test                              # store slices + utils + components
npm run test:store                    # só slices

# Backend (node:test)
cd backend && npm test               # todos os testes

# E2E (Detox) — requer prebuild
npm run e2e:android                  # emulador android
```

**Coverage**: threshold de 70% em lines para os arquivos cobertos pelos testes de unidade.

### Segurança

- Nunca commitar `.env` — usar EAS Secrets para variáveis de produção
- `EXPO_PUBLIC_*` são públicas no bundle — não colocar segredos reais
- O `PEPPER` da senha é público por design (defesa em profundidade, não segredo)
- Todas as rotas protegidas usam `requireAuth` middleware
- Path traversal protegido em `/images/:id`

---

## 10. Histórico de Evolução

### v1 — Produto mínimo (Abril 2025)
- Correção básica com GPT-4 Vision
- Estado global em Zustand
- Layout simples, sem design system

### v2 — Design + Alunos (Maio 2025 — Round 1)
- Design system completo: paleta, tipografia, tokens
- Modo aluno com acesso por QR Code / código
- Ranking de turma
- Push notifications (professor ← aluno)

### v3 — Segurança + Testes + Observabilidade (Maio 2025)
- Autenticação PBKDF2-SHA512 end-to-end
- Rate limiting (in-memory)
- 51 testes backend, 43 testes frontend
- Structured logging JSON com correlation ID
- Repository Layer (frontend + backend)
- tRPC, OpenAPI/Swagger
- Redis instalado (sem REDIS_URL configurado)
- PostgreSQL DDL criado (sem migração)
- E2E Detox (arquivos de teste, sem CI)
- Sentry Performance

**Nota v3: 8.4**

### v4 — Escalabilidade + TypeScript Full-Stack (Junho 2025)
- Backend migrado para 35 arquivos `.ts` (zero erros tsc)
- Redis ativo em produção (rate limiting persistente)
- FlashList em 3 telas críticas
- Splash animada, App Shortcuts, Lock screen notifications
- Offline Banner com retry automático
- Rollback real no deploy (snapshot + restore)
- Staging environment (docker-compose)
- PostgreSQL instalado, migration pronto (não executado)

**Nota v4: 8.9**

### v5 — PostgreSQL em Produção + DTs Eliminadas (Junho 2026)
- **DT-02**: PostgreSQL migrado em produção (SPOF eliminado)
- **DT-01**: Telas extensas → hooks dedicados (91-234 linhas)
- **DT-03**: E2E Detox no CI (GitHub Actions workflow)
- **DT-06**: analytics.test.ts completo (170 testes)
- **DT-07**: Coverage report 70% threshold
- **DT-04**: IEssayRepository (confirmado e documentado)
- 3 deprecation warnings SDK 54 eliminados
- Design global: zona accentSoft em todas as telas (iOS + Android)
- expo-navigation-bar para barra nativa Android

**Nota v5: 9.1**

---

## 11. Tudo que foi feito

### Produto
- [x] Correção de redações manuscritas (foto) via GPT-4.1-mini Vision
- [x] Avaliação nas 5 competências oficiais do ENEM (C1–C5)
- [x] Transcrição automática da redação manuscrita
- [x] Feedback por competência + pontos fortes/fracos + sugestões
- [x] Score de confiabilidade (alta/média/baixa)
- [x] Nível de legibilidade e adequação ao tema
- [x] Modo de texto (redação digitada, sem foto)
- [x] Multi-turma por professor
- [x] Sistema de alunos com código de acesso e QR Code
- [x] Área do aluno (notas, evolução, ranking)
- [x] Sparkline de evolução (professor e aluno)
- [x] Dashboard pedagógico (alunos com dificuldade, melhorando, baixa confiança)
- [x] Ranking de alunos e turmas
- [x] Analytics detalhado por competência
- [x] Inbox de revisão (redações de alunos corrigidas pela IA)
- [x] Avaliação manual do professor (nota + observação)
- [x] Relatório por aluno

### Técnico — Backend
- [x] Express + TypeScript full-stack (35 arquivos .ts)
- [x] PBKDF2-SHA512 (100k iterações) para senhas
- [x] Tokens Bearer com revogação
- [x] Rate limiting Redis (persistente entre restarts)
- [x] PostgreSQL 16 em produção com auto-schema
- [x] db-client dual-mode (SQLite dev / PostgreSQL prod)
- [x] toPgSql() shim (zero mudança nas queries dos repositórios)
- [x] Repository layer completo (essay, teacher, turma)
- [x] Backup automático diário + upload S3 (código pronto)
- [x] Structured logging JSON com correlation ID (AsyncLocalStorage)
- [x] OpenAPI 3.0 + Swagger UI em /docs
- [x] tRPC router tipado com 10+ procedures
- [x] Graceful shutdown com drain da correction queue
- [x] PM2 em fork mode (sem EADDRINUSE)
- [x] Rollback automático por health check no deploy
- [x] Staging environment (docker-compose.staging.yml)
- [x] Sentry Performance (transaction spans + metrics)
- [x] Path traversal protegido nas imagens

### Técnico — Frontend
- [x] Zustand 5 + AsyncStorage (local-first)
- [x] Expo Router 6 file-based routing
- [x] tRPC client tipado
- [x] IEssayRepository + BackendEssayRepository
- [x] correction-executor.ts (pipeline de 4 etapas)
- [x] Retry automático com backoff (8s, 20s)
- [x] processRetryQueue no reconectar
- [x] Push notifications (professor ← aluno)
- [x] Lock screen notifications com deep link
- [x] App Shortcuts (press longo no ícone)
- [x] Offline Banner animado
- [x] FlashList em 3 telas (virtualização)
- [x] Splash screen animada (spring + fade)
- [x] Custom hooks: useDashboardData, useNovaRedacaoForm, useRankingData
- [x] ProtectedRoute (guard de autenticação)
- [x] expo-navigation-bar (barra nativa Android)
- [x] Design system completo: paleta, tipografia, dark mode

### CI/CD
- [x] GitHub Actions: CI (backend + frontend) + Deploy + E2E
- [x] Coverage threshold 70% como gate obrigatório
- [x] analytics.test.ts completo (170 testes, 10 suites)
- [x] E2E Detox: 3 arquivos de teste + workflow Android CI
- [x] Rollback automatizado por snapshot

---

## 12. O que falta e roadmap nacional

### Gaps técnicos imediatos

| Gap | Esforço | Impacto |
|---|---|---|
| `BACKUP_S3_BUCKET` configurar no servidor | 30 min | Alto — elimina risco de perda de dados |
| `CLAUDE.md` — **este arquivo** | ✅ Feito | Alto — onboarding de novos devs |
| Sentry `uploadSourceMaps: true` | 1h | Médio — stack traces legíveis |
| E2E Detox: validar execução real no CI | 2h | Alto — garantia de fluxos críticos |
| Widget Android/iOS | Fora do escopo Expo managed | Baixo |

### Roadmap de produto para escala nacional

#### Fase 1 — Multi-escola (0–3 meses)
- [ ] **Plano de acesso por escola** — admin da escola cria professores
- [ ] **Onboarding white-label** — personalização por escola (logo, nome)
- [ ] **Relatório por escola** — analytics agregado para gestores
- [ ] **Exportação de dados** — CSV/PDF de resultados da turma
- [ ] **Correção em lote** — enviar múltiplas redações de uma vez

#### Fase 2 — Escalabilidade técnica (1–4 meses)
- [ ] **pgBouncer** — connection pooling para PostgreSQL
- [ ] **Read replicas** — PostgreSQL em modo read replica para analytics
- [ ] **CDN de imagens** — S3 + CloudFront para imagens das redações
- [ ] **Queue assíncrona** — BullMQ para processar correções em fila (sem bloqueio)
- [ ] **Cache Redis** — cache de resultados de correção já processados
- [ ] **Multi-instância** — Nginx load balancer + PM2 cluster

#### Fase 3 — Monetização e distribuição (2–6 meses)
- [ ] **Pagamento in-app** — Stripe para planos por turma/mês
- [ ] **Trial gratuito** — 10 correções grátis por professor
- [ ] **Planos** — Básico (1 turma), Pro (ilimitado), Escola (multi-professor)
- [ ] **App Store + Google Play** — submissão (base técnica já pronta)
- [ ] **Landing page** — site de vendas para escolas
- [ ] **Painel do administrador web** — gestão de escolas sem app mobile

#### Fase 4 — Produto avançado (3–12 meses)
- [ ] **IA própria** — fine-tuning de modelo para contexto brasileiro
- [ ] **Banco de temas ENEM** — temas dos últimos 10 anos com estatísticas
- [ ] **Plano de estudos personalizado** — recomendações por competência fraca
- [ ] **Simulado integrado** — redação com tempo cronometrado
- [ ] **Comparativo nacional** — benchmark contra médias nacionais do ENEM
- [ ] **API pública** — integração com sistemas de gestão escolar (ERP)
- [ ] **Versão web** — acesso sem instalação do app

### Arquitetura para escala nacional

Para suportar 10.000+ escolas e 1M+ correções/mês:

```
                    ┌──────────────────────────────┐
                    │         CloudFlare CDN        │
                    └───────────────┬──────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │              Load Balancer (Nginx)          │
              └───┬─────────────────┬──────────────────┬───┘
                  │                 │                  │
          ┌───────▼──┐    ┌─────────▼──┐    ┌─────────▼──┐
          │ API Node │    │  API Node  │    │  API Node  │
          │  (PM2)   │    │   (PM2)    │    │   (PM2)    │
          └───────┬──┘    └─────────┬──┘    └─────────┬──┘
                  │                 │                  │
          ┌───────▼─────────────────▼──────────────────▼───┐
          │              pgBouncer (pool)                    │
          └───────────────────────┬──────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    PostgreSQL Primary        │
                    └──────────────┬──────────────┘
                                   │ replicação
                    ┌──────────────▼──────────────┐
                    │    PostgreSQL Read Replica   │
                    │    (analytics queries)       │
                    └──────────────────────────────┘
```

```
Fila de correção (BullMQ + Redis):
  App → POST /v1/openai/correct → enfileira job
  Worker 1, 2, 3... → processam em paralelo
  Webhook → notifica app via push notification
```

---

## Documentação complementar

| Documento | Conteúdo |
|---|---|
| [docs/uml-e-padroes.md](docs/uml-e-padroes.md) | Diagramas UML completos (casos de uso, classes, sequência, estados, ER, componentes, deploy, atividades) + 10 padrões de projeto explicados |
| [docs/manual-usuario.html](docs/manual-usuario.html) | Manual completo do usuário (abrir no browser → Ctrl+P → PDF) |

---

## Contato e Referências

- **Repositório**: github.com/eduardopj/enem-redacoes
- **Backend produção**: https://134-209-38-46.nip.io
- **Swagger UI**: https://134-209-38-46.nip.io/docs
- **Health check**: https://134-209-38-46.nip.io/health
- **Developer**: Eduardo Pinheiro Júnior (dudu.juni0r@gmail.com)
