# Diagramas UML e Padrões de Projeto — ENEM IA

> Documentação arquitetural completa. Os diagramas usam sintaxe Mermaid,
> renderizados automaticamente pelo GitHub. Para visualizar localmente,
> use a extensão "Markdown Preview Mermaid Support" no VS Code.

---

## Índice

1. [Diagrama de Casos de Uso](#1-diagrama-de-casos-de-uso)
2. [Diagrama de Classes (Domínio)](#2-diagrama-de-classes-domínio)
3. [Diagrama de Classes (Backend — Repositórios)](#3-diagrama-de-classes-backend--repositórios)
4. [Diagrama de Sequência — Fluxo de Correção](#4-diagrama-de-sequência--fluxo-de-correção)
5. [Diagrama de Sequência — Autenticação](#5-diagrama-de-sequência--autenticação)
6. [Diagrama de Estados — Ciclo da Redação](#6-diagrama-de-estados--ciclo-da-redação)
7. [Diagrama de Componentes](#7-diagrama-de-componentes)
8. [Diagrama de Implantação (Deploy)](#8-diagrama-de-implantação-deploy)
9. [Diagrama ER — Banco de Dados](#9-diagrama-er--banco-de-dados)
10. [Diagrama de Atividades — Pipeline de Correção](#10-diagrama-de-atividades--pipeline-de-correção)
11. [Padrões de Projeto](#11-padrões-de-projeto)

---

## 1. Diagrama de Casos de Uso

O diagrama de casos de uso descreve **o que o sistema faz** do ponto de vista dos usuários (atores), sem entrar em detalhes de implementação. Cada elipse é um caso de uso — uma funcionalidade com valor para o ator.

```mermaid
flowchart TB
    Professor(["👨‍🏫\nProfessor"])
    Aluno(["🎓\nAluno"])
    IA(["🤖\nIA - OpenAI"])

    subgraph Sistema["🏛️  ENEM IA — Sistema"]
        direction TB

        subgraph GestaoConteudo["📚 Gestão de Conteúdo"]
            UC1["Cadastrar aluno"]
            UC2["Cadastrar turma"]
            UC3["Cadastrar tema"]
            UC4["Compartilhar QR Code da turma"]
        end

        subgraph Correcao["✏️ Fluxo de Correção"]
            UC5["Enviar redação por foto"]
            UC6["Enviar redação por texto"]
            UC7["Acompanhar progresso da correção"]
            UC8["Ver resultado completo (C1–C5)"]
            UC9["Adicionar avaliação manual"]
        end

        subgraph Analise["📊 Análise e Acompanhamento"]
            UC10["Ver dashboard pedagógico"]
            UC11["Ver ranking de alunos"]
            UC12["Ver analytics da turma"]
            UC13["Receber notificação de correção"]
        end

        subgraph AreaAluno["🎓 Área do Aluno"]
            UC14["Acessar via QR Code"]
            UC15["Acessar via código pessoal"]
            UC16["Ver próprias redações e notas"]
            UC17["Ver evolução histórica"]
            UC18["Ver ranking da turma"]
            UC19["Enviar redação (aluno)"]
        end

        subgraph Conta["🔐 Gestão de Conta"]
            UC20["Criar conta de professor"]
            UC21["Fazer login / logout"]
            UC22["Recuperar senha por e-mail"]
        end

        UC5 -.->|"inclui"| UC7
        UC6 -.->|"inclui"| UC7
        UC7 -.->|"inclui"| UC8
        UC5 -.->|"usa"| IA
        UC6 -.->|"usa"| IA
    end

    Professor --> UC1 & UC2 & UC3 & UC4
    Professor --> UC5 & UC6 & UC8 & UC9
    Professor --> UC10 & UC11 & UC12 & UC13
    Professor --> UC20 & UC21 & UC22

    Aluno --> UC14 & UC15
    Aluno --> UC16 & UC17 & UC18 & UC19
```

### Explicação dos atores

| Ator | Descrição |
|---|---|
| **Professor** | Usuário principal. Cadastra alunos, envia redações, recebe correções, analisa turma. Tem conta própria (e-mail + senha). |
| **Aluno** | Usuário secundário. Acessa com código gerado pelo professor. Não cria conta. Vê apenas seus próprios dados. |
| **IA (OpenAI)** | Ator externo. Recebe a imagem da redação e retorna avaliação estruturada em JSON. |

### Relacionamentos

- **`inclui` (<<include>>)**: o caso de uso base sempre executa o incluído (enviar redação *inclui* acompanhar progresso)
- **`usa`**: o sistema delega para a IA a avaliação das competências

---

## 2. Diagrama de Classes (Domínio)

O diagrama de classes representa as **entidades do negócio** e seus relacionamentos. É a espinha dorsal do modelo de dados compartilhado entre frontend e backend.

```mermaid
classDiagram
    direction TB

    class Teacher {
        +String id
        +String name
        +String email
        +String? state
    }

    class Turma {
        +String id
        +String teacherId
        +String name
        +String? period
        +String? year
        +String? subject
        +String? joinCode
        +String createdAt
    }

    class Student {
        +String id
        +String teacherId
        +String? turmaId
        +String name
        +String className
        +String? accessCode
        +String? state
        +String? birthDate
    }

    class ThemeItem {
        +String id
        +String? teacherId
        +String title
        +String category
    }

    class Essay {
        +String id
        +String teacherId
        +String studentId
        +String themeTitle
        +EssayStatus status
        +EssayInputMode? inputMode
        +String? essayText
        +String? imageUri
        +Number? totalScore
        +Number? teacherScore
        +String? teacherNote
        +Boolean? submittedByStudent
        +String? createdAt
        +String? correctedAt
    }

    class EssayCorrection {
        +String? transcription
        +ConfidenceLevel? transcriptionConfidence
        +Competencies? competencies
        +CompetencyFeedbacks? competencyFeedbacks
        +String[]? strengths
        +String[]? weaknesses
        +String[]? improvements
        +ScoreReliability? scoreReliability
        +Legibility? legibility
        +ThemeAdequacy? themeAdequacy
        +String? generalObservation
        +String? studentDirectMessage
    }

    class Competencies {
        +Number c1
        +Number c2
        +Number c3
        +Number c4
        +Number c5
    }

    class EssayStatus {
        <<enumeration>>
        pendente
        processando
        corrigida
        precisa_revisao
        baixa_confiabilidade
    }

    class EssayInputMode {
        <<enumeration>>
        manuscrita
        digitada
        upload
    }

    class ConfidenceLevel {
        <<enumeration>>
        alta
        media
        baixa
    }

    Teacher "1" --> "0..*" Turma : possui
    Teacher "1" --> "0..*" Student : gerencia
    Teacher "1" --> "0..*" ThemeItem : cadastra
    Teacher "1" --> "0..*" Essay : corrige

    Turma "1" --> "0..*" Student : agrupa
    Student "1" --> "0..*" Essay : tem

    Essay --> EssayStatus : tem status
    Essay --> EssayInputMode : tem modo
    Essay --|> EssayCorrection : extende (intersect type)
    EssayCorrection --> Competencies : contém
    EssayCorrection --> ConfidenceLevel : classifica
```

### Por que esse modelo?

O tipo `Essay` é uma **interseção** de `EssayBase` com `EssayCorrection` (TypeScript intersection type). Isso separa claramente:
- **`EssayBase`**: dados que existem antes da correção (studentId, imageUri, status)
- **`EssayCorrection`**: dados que só existem após a correção (competencies, feedbacks, transcription)

Permite que a tela de lista de redações use apenas `EssayBase` sem carregar dados pesados de correção.

---

## 3. Diagrama de Classes (Backend — Repositórios)

Este diagrama mostra a arquitetura da **camada de repositório** do backend, implementando o padrão Repository sobre um driver de banco de dados dual (SQLite/PostgreSQL).

```mermaid
classDiagram
    direction LR

    class DbDriver {
        <<interface>>
        +query(sql, params) Promise~T[]~
        +queryOne(sql, params) Promise~T|null~
        +execute(sql, params) Promise~void~
        +transaction(ops) Promise~void~
    }

    class SqliteDriver {
        -db: Database
        +query(sql, params) Promise~T[]~
        +queryOne(sql, params) Promise~T|null~
        +execute(sql, params) Promise~void~
        +transaction(ops) Promise~void~
    }

    class PostgresDriver {
        -sql: PgSql
        +query(sql, params) Promise~T[]~
        +queryOne(sql, params) Promise~T|null~
        +execute(sql, params) Promise~void~
        +transaction(ops) Promise~void~
        -toPgSql(sql) String
    }

    class DbClient {
        <<module>>
        -driverPromise: Promise~DbDriver~
        +getDriver() Promise~DbDriver~
        +query(sql, params) Promise~T[]~
        +queryOne(sql, params) Promise~T|null~
        +execute(sql, params) Promise~void~
        +transaction(ops) Promise~void~
    }

    class EssayRepository {
        <<module>>
        +findEssayById(id) Promise~Essay|null~
        +findEssaysByTeacher(teacherId, opts) Promise~EssayPage~
        +upsertEssayRow(data) Promise~void~
        +checkEssayConflict(id) Promise~Conflict~
        +updateEssayTeacherEval(id, score, note) Promise~void~
        +findImagePathsByTeacher(teacherId) Promise~String[]~
        +deleteEssaysByTeacher(teacherId) Promise~void~
    }

    class TeacherRepository {
        <<module>>
        +findTeacherById(id) Promise~Teacher|null~
        +findTeacherByEmail(email) Promise~Teacher|null~
        +findTeacherByToken(token) Promise~Teacher|null~
        +createTeacher(params) Promise~void~
        +revokeTeacherToken(token) Promise~void~
        +saveTeacherPushToken(id, token) Promise~void~
        +deleteTeacherCascade(id) Promise~String[]~
    }

    class TurmaRepository {
        <<module>>
        +upsertTurmaRow(params) Promise~void~
        +findTurmaByCode(code) Promise~Turma|null~
        +deleteTurmasByTeacher(id) Promise~void~
    }

    DbDriver <|.. SqliteDriver : implementa
    DbDriver <|.. PostgresDriver : implementa
    DbClient --> DbDriver : usa (lazy init)
    DbClient ..> SqliteDriver : cria se sem DATABASE_URL
    DbClient ..> PostgresDriver : cria se com DATABASE_URL

    EssayRepository --> DbClient : usa
    TeacherRepository --> DbClient : usa
    TurmaRepository --> DbClient : usa
```

---

## 4. Diagrama de Sequência — Fluxo de Correção

O diagrama de sequência mostra a **interação entre objetos ao longo do tempo**. Este é o fluxo mais crítico do sistema: do toque do professor em "Enviar" até a notificação de conclusão.

```mermaid
sequenceDiagram
    actor Prof as 👨‍🏫 Professor
    participant App as 📱 App (React Native)
    participant Slice as correction.slice
    participant Executor as correction-executor
    participant Backend as 🖥️ Backend Express
    participant GPT as 🤖 OpenAI GPT-4.1-mini
    participant Notif as 🔔 Notifications

    Prof->>App: Toca "Enviar e corrigir"
    App->>Slice: evaluateEssayWithOpenAI(essayId)

    Slice->>Slice: setState(status: 'processando')
    Slice->>Slice: verifica/renova backendToken

    Slice->>Executor: executeCorrection(input, onProgress)

    Note over Executor,Backend: Etapa 1/4 — Lendo a imagem
    Executor->>Backend: POST /v1/openai/correct { imageBase64, themeTitle }
    Executor-->>Slice: onProgress("ETAPA 1/4 - lendo a imagem")
    App-->>Prof: CorrectionProgress exibe etapa 1

    Backend->>Backend: Valida JWT token (requireAuth)
    Backend->>Backend: Valida body (Zod schema)

    Note over Backend,GPT: Chamada à API OpenAI
    Backend->>GPT: Chat completion (image + prompt estruturado)
    GPT-->>Backend: JSON { competencies, feedbacks, transcription... }

    Backend->>Backend: Parseia e valida resposta
    Backend-->>Executor: { totalScore, competencies, feedbacks, ... }

    Note over Executor,Slice: Etapas 2-4 via callbacks
    Executor-->>Slice: onProgress("ETAPA 2/4 - transcrevendo")
    Executor-->>Slice: onProgress("ETAPA 3/4 - avaliando")
    Executor-->>Slice: onProgress("ETAPA 4/4 - gerando feedback")
    Executor-->>Slice: resultado final completo

    Slice->>Slice: setState(status: 'corrigida', totalScore, competencies...)

    par Notificação
        Slice->>Notif: scheduleNotificationAsync({ essayId, score })
        Notif-->>Prof: 🔔 Lock screen: "Redação corrigida! ✅ — 760 pts"
    and Sincronização (fire-and-forget)
        Slice->>Backend: POST /v1/sync/essays (backup no PostgreSQL)
    and Pesquisa
        Slice->>Backend: POST /research/save-essay (dados anônimos)
    end

    Prof->>Notif: Toca na notificação
    Notif->>App: router.push('/resultado/' + essayId)
    App-->>Prof: Tela de resultado com notas C1–C5
```

### Pontos de atenção no fluxo

- **Par (paralelo)**: após a correção, três ações acontecem simultaneamente (notificação, sync, pesquisa). Nenhuma bloqueia a UI.
- **Fire-and-forget**: sync e pesquisa usam `.catch(() => {})` — falhas não afetam o usuário.
- **onProgress callbacks**: permitem atualizar a barra de progresso em tempo real sem esperar a resposta final.

---

## 5. Diagrama de Sequência — Autenticação

```mermaid
sequenceDiagram
    actor Prof as 👨‍🏫 Professor
    participant App as 📱 App
    participant AuthSlice as auth.slice
    participant BackendAuth as 🖥️ /v1/auth
    participant DB as 🗄️ PostgreSQL

    Note over Prof,App: Fluxo de cadastro
    Prof->>App: Preenche nome, e-mail, senha
    App->>App: SHA-256(PEPPER + senha) → clientHash
    App->>AuthSlice: signup(name, email, password)
    AuthSlice->>BackendAuth: POST /register { teacherName, teacherEmail, passwordHash: clientHash }
    BackendAuth->>BackendAuth: PBKDF2-SHA512(clientHash, salt, 100k iter)
    BackendAuth->>DB: INSERT INTO teachers (passwordHash=...)
    BackendAuth-->>AuthSlice: { token: "abc123...", teacherId }
    AuthSlice->>AuthSlice: setState(currentTeacher, backendToken)
    AuthSlice-->>App: redirect → /dashboard

    Note over Prof,App: Fluxo de login (sessão seguinte)
    Prof->>App: Digite e-mail e senha
    App->>App: SHA-256(PEPPER + senha) → clientHash
    App->>AuthSlice: login(email, password)
    AuthSlice->>BackendAuth: POST /login { teacherEmail, passwordHash: clientHash }
    BackendAuth->>DB: SELECT teacher WHERE email = ?
    BackendAuth->>BackendAuth: verifyStoredPasswordHash(clientHash, storedHash)
    alt Hash válido
        BackendAuth->>DB: UPDATE token, expiresAt
        BackendAuth-->>AuthSlice: { token, teacherId }
        AuthSlice-->>App: redirect → /dashboard
    else Hash inválido
        BackendAuth-->>AuthSlice: 401 Unauthorized
        AuthSlice-->>App: exibe erro "Credenciais incorretas"
    end

    Note over Prof,App: Toda requisição autenticada
    App->>BackendAuth: GET /essays { Authorization: Bearer token }
    BackendAuth->>DB: SELECT * FROM teachers WHERE token = ? AND revokedAt IS NULL
    alt Token válido e não revogado
        BackendAuth-->>App: 200 + dados
    else Token inválido
        BackendAuth-->>App: 401 → App faz logout automático
    end
```

---

## 6. Diagrama de Estados — Ciclo da Redação

O diagrama de estados modela os **possíveis estados de uma redação** e as transições entre eles. É essencial para entender a lógica de retry e a fila offline.

```mermaid
stateDiagram-v2
    [*] --> pendente : addEssay()

    pendente --> processando : evaluateEssayWithOpenAI()\n[rede disponível]
    pendente --> pendente : [sem rede]\n→ addToRetryQueue()

    processando --> corrigida : GPT responde com sucesso\n+ confiança alta/média
    processando --> baixa_confiabilidade : GPT responde\n+ confiança baixa
    processando --> precisa_revisao : GPT detecta\nproblemas graves
    processando --> pendente : erro de rede\n(tentativas 1 e 2 falharam)\n→ addToRetryQueue()
    processando --> processando : falha recuperável\n→ retry em 8s / 20s

    corrigida --> corrigida : professor adiciona\navaliação manual\n(teacherScore, teacherNote)

    baixa_confiabilidade --> corrigida : professor revisa\ne confirma

    precisa_revisao --> corrigida : professor revisa\ne confirma

    state pendente {
        [*] --> aguardando_correcao
        aguardando_correcao --> na_fila_retry : falha de rede
        na_fila_retry --> aguardando_correcao : reconecta\n→ processRetryQueue()
    }

    note right of processando
        correctionAttempts: 1, 2, 3
        RETRY_DELAYS: [8s, 20s]
        MAX_ATTEMPTS: 3
    end note

    note right of baixa_confiabilidade
        confidenceLevel = 'baixa'
        reviewRequired = true
        Aparece no Painel Pedagógico
    end note
```

### Estados e seu significado

| Estado | Descrição | Ação do usuário |
|---|---|---|
| `pendente` | Criada, aguardando correção | Professor pode iniciar correção manualmente |
| `processando` | IA está avaliando | Aguardar (progresso mostrado na tela) |
| `corrigida` | Correção concluída com sucesso | Ver resultado |
| `baixa_confiabilidade` | IA teve dificuldade (foto ruim, letra ilegível) | Professor revisa e confirma |
| `precisa_revisao` | IA detectou problema grave no texto | Professor revisa e confirma |

---

## 7. Diagrama de Componentes

Mostra os **módulos do sistema e suas dependências**. Cada componente é uma unidade deployável ou um subsistema lógico coeso.

```mermaid
flowchart TB
    subgraph Mobile["📱 Aplicativo Mobile (Expo)"]
        direction TB
        subgraph UI["Camada de Apresentação"]
            Screens["Telas\n(Expo Router)"]
            Components["Componentes UI\n(ScreenContainer, Card...)"]
            Hooks["Custom Hooks\n(useDashboardData\nuseNovaRedacaoForm\nuseRankingData)"]
        end
        subgraph State["Camada de Estado"]
            Store["Zustand Store\n(app-store.ts)"]
            Slices["Slices\n(auth, essays,\ncorrection, students...)"]
            Persist["AsyncStorage\n(persistência local)"]
        end
        subgraph Services["Camada de Serviços"]
            CorrExec["correction-executor"]
            SyncEssays["sync-essays"]
            BackendAuth["backend-auth"]
            Notifications["push-notifications"]
        end
        subgraph Repo["Repositório (Frontend)"]
            IRepo["IEssayRepository\n(interface)"]
            BackendRepo["BackendEssayRepository\n(implementação HTTP)"]
        end
    end

    subgraph Backend["🖥️ Backend (Express + Node.js)"]
        direction TB
        subgraph Routes["Rotas"]
            AuthRoutes["auth.routes\n/v1/auth"]
            SyncRoutes["sync.routes\n/v1/sync"]
            OpenAIRoutes["openai.routes\n/v1/openai"]
        end
        subgraph BackendServices["Serviços"]
            AuthSvc["auth.service\n(PBKDF2, tokens)"]
            SyncSvc["sync.service\n(upsert essays)"]
            OpenAISvc["openai.service\n(GPT-4.1-mini)"]
            BackupSvc["backup.scheduler\n(diário 3am)"]
        end
        subgraph Repos["Repositórios (Backend)"]
            EssayRepo["essay.repository"]
            TeacherRepo["teacher.repository"]
            TurmaRepo["turma.repository"]
        end
        DBClient["db-client\n(dual: SQLite / PostgreSQL)"]
        Zod["Validators\n(Zod schemas)"]
    end

    subgraph External["☁️ Externos"]
        OpenAI["OpenAI API\nGPT-4.1-mini Vision"]
        PG["PostgreSQL 16"]
        Redis["Redis\n(rate limiting)"]
        Expo["Expo Push\nNotifications"]
    end

    Screens --> Hooks
    Screens --> Components
    Hooks --> Store
    Store --> Slices
    Slices --> Persist
    Slices --> Services
    Services --> Repo
    Repo --> IRepo
    BackendRepo -.->|"implementa"| IRepo

    BackendRepo -->|"HTTPS"| SyncRoutes
    CorrExec -->|"HTTPS"| OpenAIRoutes
    BackendAuth -->|"HTTPS"| AuthRoutes
    Notifications --> Expo

    AuthRoutes --> AuthSvc & Zod
    SyncRoutes --> SyncSvc & Zod
    OpenAIRoutes --> OpenAISvc & Zod

    AuthSvc --> TeacherRepo
    SyncSvc --> EssayRepo & TurmaRepo
    OpenAISvc --> OpenAI

    EssayRepo & TeacherRepo & TurmaRepo --> DBClient
    DBClient --> PG
    DBClient -.->|"fallback dev"| SQLite["SQLite\n(development)"]

    AuthRoutes & SyncRoutes --> Redis
```

---

## 8. Diagrama de Implantação (Deploy)

Mostra como os **componentes de software são distribuídos em hardware/infraestrutura**.

```mermaid
flowchart TB
    subgraph Devices["📱 Dispositivos dos Usuários"]
        iOS["iPhone\n(iOS 16+)"]
        Android["Android\n(API 26+)"]
    end

    subgraph GitHub["🐙 GitHub"]
        Repo2["Repositório\ngithub.com/eduardopj/enem-redacoes"]
        Actions["GitHub Actions\nci.yml / deploy.yml / e2e.yml"]
    end

    subgraph EAS["☁️ Expo Application Services"]
        EASBuild["EAS Build\n(iOS + Android APK/AAB)"]
        Stores["App Store\nGoogle Play"]
    end

    subgraph DigitalOcean["🌊 DigitalOcean Droplet (Ubuntu)"]
        direction TB
        subgraph Apps["Processos"]
            PM2["PM2 (fork mode)\nenem-backend process"]
            Node["Node.js 22\n+ tsx ESM loader"]
        end
        subgraph Nginx2["Nginx"]
            TLS["TLS (HTTPS)\n134-209-38-46.nip.io"]
            Proxy["Proxy reverso\n→ localhost:3333"]
        end
        subgraph Data["Dados"]
            PGLocal["PostgreSQL 16\nDATABASE_URL local"]
            RedisLocal["Redis\nRATE_LIMIT store"]
            SQLiteB["SQLite\nessays.db (backup)"]
            DataDir["data/\nessays.db.bak-*\nresearch/"]
        end
        EnvFile[".env\n(secrets locais)"]
    end

    subgraph ExternalSvcs["☁️ Serviços Externos"]
        OpenAI2["OpenAI API\napi.openai.com"]
        ExpoPush["Expo Push\nNotification Service"]
        Sentry2["Sentry.io\n(erros + performance)"]
    end

    iOS & Android -->|"HTTPS"| TLS
    TLS --> Proxy --> PM2 --> Node

    Node --> PGLocal & RedisLocal
    Node -->|"HTTP"| OpenAI2
    Node --> ExpoPush

    iOS & Android --> Sentry2
    Node --> Sentry2

    Repo2 --> Actions
    Actions -->|"SSH deploy"| PM2
    Actions --> EASBuild --> Stores --> iOS & Android

    EnvFile -.->|"lido em runtime"| Node
```

### Fluxo de deploy

```
1. git push origin main
2. GitHub Actions: ci.yml (testes backend + frontend)
3. Se testes passam: deploy.yml
   a. SSH no droplet
   b. cp -r backend/ backend.previous  ← snapshot
   c. git pull / npm ci
   d. pm2 restart enem-backend
   e. curl /health → verifica DB + servidor
   f. Se health falha: restaura backend.previous
```

---

## 9. Diagrama ER — Banco de Dados

O diagrama entidade-relacionamento mostra a **estrutura do banco de dados PostgreSQL** em produção e as chaves de relacionamento entre tabelas.

```mermaid
erDiagram
    TEACHERS {
        text teacherId PK "UUID do professor"
        text teacherEmail "E-mail (único)"
        text teacherName "Nome completo"
        text token "Token Bearer (único)"
        text passwordHash "PBKDF2-SHA512"
        timestamptz expiresAt "Expiração do token"
        timestamptz revokedAt "Revogação (logout)"
        text pushToken "Token Expo para push"
        text resetToken "Hash do código de reset"
        timestamptz resetTokenExpiresAt "Expiração do código de reset"
        timestamptz createdAt "Data de criação"
    }

    TURMAS {
        text joinCode PK "Código de acesso (ex: ABC123)"
        text teacherId FK "Ref teachers.teacherId"
        text teacherName "Desnormalizado (performance)"
        text teacherEmail "Desnormalizado"
        text turmaId "UUID da turma"
        text turmaName "Nome da turma"
        timestamptz createdAt "Data de criação"
    }

    ESSAYS {
        text id PK "UUID da redação"
        text teacherId FK "Ref teachers.teacherId"
        text studentId "UUID do aluno (local)"
        text studentName "Nome desnormalizado"
        text turmaId "UUID da turma (local)"
        text turmaName "Nome desnormalizado"
        text themeTitle "Título do tema"
        text inputMode "manuscrita | digitada | upload"
        text essayText "Texto (se digitada)"
        text status "pendente | processando | corrigida..."
        int totalScore "Nota total (0-1000)"
        int teacherScore "Nota manual do professor"
        text teacherNote "Observação do professor"
        text correctionJson "JSON completo da correção IA"
        text imagePath "Caminho local da imagem"
        text imageS3Key "Chave S3 (futuro)"
        int submittedByStudent "0=professor, 1=aluno"
        timestamptz createdAt "Criação"
        timestamptz correctedAt "Conclusão da correção"
        timestamptz updatedAt "Última atualização"
        timestamptz syncedAt "Última sincronização"
    }

    TEACHERS ||--o{ TURMAS : "possui"
    TEACHERS ||--o{ ESSAYS : "corrige"
```

### Decisões de design do banco

**Desnormalização deliberada**: `studentName`, `turmaName`, `teacherName` são copiados para `essays` e `turmas`. Evita JOINs custosos em consultas frequentes de listagem. Os dados de alunos vivem no AsyncStorage do dispositivo, não no servidor.

**`correctionJson` como TEXT**: o resultado completo da IA é armazenado como JSON serializado. Isso evita dezenas de colunas para campos opcionais e permite evolução do schema da IA sem migrations de banco.

**`syncedAt` para paginação**: o cursor de paginação usa `syncedAt DESC` — o índice `idx_essays_teacher_synced` cobre exatamente essa query, tornando-a O(log n) mesmo com milhões de redações.

---

## 10. Diagrama de Atividades — Pipeline de Correção

O diagrama de atividades mostra o **fluxo algorítmico** com decisões, paralelismo e condições de erro. É mais detalhado que o de sequência — foca no COMO, não no QUEM.

```mermaid
flowchart TD
    Start([Início: evaluateEssayWithOpenAI]) --> CheckEssay{Essay existe\nno store?}
    CheckEssay -->|Não| Throw([Lança erro: não encontrada])
    CheckEssay -->|Sim| CheckImage{Tem imagem\nou texto?}
    CheckImage -->|Não| Throw2([Lança erro: sem arquivo])
    CheckImage -->|Sim| SetProcessing[status → 'processando'\nattempts++]

    SetProcessing --> CheckToken{Tem\nbackendToken?}
    CheckToken -->|Não| AutoRegister[Auto-register\nno backend]
    AutoRegister --> SaveToken[salva token no store]
    SaveToken --> CallExecutor
    CheckToken -->|Sim| CallExecutor[correction-executor\nexecuteCorrection]

    CallExecutor --> Progress1[onProgress: ETAPA 1/4\nlendo a imagem]
    Progress1 --> BackendCall[POST /v1/openai/correct\n{ imageBase64 ou texto }]

    BackendCall --> BackendValidate{Zod\nvalida input?}
    BackendValidate -->|Inválido| Return400[400 Bad Request]
    BackendValidate -->|Válido| CheckAuth{Token\nválido?}
    CheckAuth -->|Inválido| Return401[401 Unauthorized]
    CheckAuth -->|Válido| GPTCall[OpenAI GPT-4.1-mini\nVision API]

    GPTCall --> Progress2[onProgress: ETAPA 2/4\ntranscrevendo]
    Progress2 --> Progress3[onProgress: ETAPA 3/4\navaliando]
    Progress3 --> Progress4[onProgress: ETAPA 4/4\ngerando feedback]
    Progress4 --> ParseResult[Parseia JSON da resposta]

    ParseResult --> UpdateStore[store: status → 'corrigida'\ntotalScore, competencies, feedbacks...]

    UpdateStore --> par1{Paralelismo}
    par1 --> Notif[scheduleNotificationAsync\nlock screen notification]
    par1 --> SyncBackend[backendEssayRepository.push\nsinc com PostgreSQL]
    par1 --> Research[saveEssayForResearch\ndados anônimos]

    Notif & SyncBackend & Research --> End([Fim: correção concluída])

    BackendCall -->|Erro| ErrorHandler{Tipo\ndo erro}
    ErrorHandler -->|Rate limit 429| SetError[status → 'pendente'\nerrorMessage: aguarde]
    ErrorHandler -->|Rede| CheckAttempts{attempts\n< MAX = 3?}
    ErrorHandler -->|Outro| SetError2[status → 'pendente'\nerrorMessage: mensagem]

    CheckAttempts -->|Sim| RetryDelay[setTimeout\n8s ou 20s]
    RetryDelay --> CallExecutor
    CheckAttempts -->|Não| AddRetryQueue[addToRetryQueue\n→ fila offline]
    AddRetryQueue --> SetError2

    style Start fill:#7C3AED,color:#fff
    style End fill:#16A34A,color:#fff
    style Throw fill:#DC2626,color:#fff
    style Throw2 fill:#DC2626,color:#fff
    style Return400 fill:#DC2626,color:#fff
    style Return401 fill:#DC2626,color:#fff
```

---

## 11. Padrões de Projeto

Os padrões de projeto são **soluções reutilizáveis para problemas recorrentes** de design de software. Abaixo estão os padrões utilizados no ENEM IA, com localização exata no código, motivação e benefícios.

---

### 11.1 Repository Pattern

**Categoria**: Arquitetural (Data Access)

**O que é**: Define uma interface que abstrai o acesso a dados. O código de negócio depende da interface, não da implementação concreta. Isso permite trocar o banco de dados sem alterar os serviços.

**Onde está no código**:
```
Backend:
  src/repositories/essay.repository.ts    ← implementação
  src/repositories/teacher.repository.ts
  src/repositories/turma.repository.ts

Frontend:
  src/repositories/IEssayRepository.ts    ← interface
  src/repositories/BackendEssayRepository.ts ← implementação HTTP
```

**Diagrama**:
```mermaid
classDiagram
    class IEssayRepository {
        <<interface>>
        +fetchByTeacher(teacherId, token, cursor, limit) Promise~FetchEssaysResult~
        +fetchDetail(essayId, token) Promise~BackendEssay|null~
        +push(essay, studentName, turmaId, turmaName, token) Promise~void~
        +pushTeacherEval(essayId, score, note, token) Promise~void~
    }

    class BackendEssayRepository {
        +fetchByTeacher(...) Promise~FetchEssaysResult~
        +fetchDetail(...) Promise~BackendEssay|null~
        +push(...) Promise~void~
        +pushTeacherEval(...) Promise~void~
    }

    class MockEssayRepository {
        +fetchByTeacher(...) Promise~FetchEssaysResult~
        +fetchDetail(...) Promise~BackendEssay|null~
        +push(...) Promise~void~
        +pushTeacherEval(...) Promise~void~
    }

    IEssayRepository <|.. BackendEssayRepository : implementa
    IEssayRepository <|.. MockEssayRepository : implementa (testes)

    class CorrectionSlice {
        -repo: IEssayRepository
        +evaluateEssayWithOpenAI(essayId)
    }

    CorrectionSlice --> IEssayRepository : usa
```

**Por que usar**:
- **Testabilidade**: nos testes, troca `BackendEssayRepository` por `MockEssayRepository` sem alterar o slice
- **Flexibilidade**: se migrar para tRPC puro, só cria `TRPCEssayRepository`
- **Inversão de dependência**: o slice depende de abstração, não de implementação concreta (SOLID - D)

---

### 11.2 Adapter Pattern (toPgSql)

**Categoria**: Estrutural

**O que é**: Converte a interface de uma classe para outra interface esperada pelo cliente. Permite que classes com interfaces incompatíveis trabalhem juntas.

**Onde está no código**:
```
backend/src/services/db-client.ts → função toPgSql()
```

**Problema**: os repositórios escrevem SQL em dialeto SQLite (`?` placeholders, `datetime('now')`, identificadores camelCase sem aspas). O PostgreSQL usa `$1/$2`, `CURRENT_TIMESTAMP` e exige aspas em identificadores case-sensitive.

**Solução**:
```typescript
// Adapter: converte SQLite SQL → PostgreSQL SQL
function toPgSql(sql: string): string {
  // 1. datetime('now') → CURRENT_TIMESTAMP
  sql = sql.replace(/datetime\s*\(\s*'now'\s*\)/gi, 'CURRENT_TIMESTAMP');
  // 2. ? → $1, $2, ...
  let n = 0;
  sql = sql.replace(/\?/g, () => `$${++n}`);
  // 3. camelCase → "camelCase"
  sql = sql.replace(/\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\b/g, '"$1"');
  return sql;
}
```

**Por que usar**:
- **Zero mudança nos repositórios**: os 3 repositórios continuam escrevendo SQL natural
- **Transparente**: o adapter age no nível do driver, invisível para quem usa `query()`, `execute()`, etc.
- **Manutenção centralizada**: qualquer evolução do dialeto SQL fica em um lugar só

---

### 11.3 Strategy Pattern (Dual-Mode DB)

**Categoria**: Comportamental

**O que é**: Define uma família de algoritmos, encapsula cada um e os torna intercambiáveis. O cliente usa o algoritmo sem conhecer sua implementação.

**Onde está no código**:
```
backend/src/services/db-client.ts
  → makeSqliteDriver() ← estratégia desenvolvimento
  → makePgDriver()     ← estratégia produção
```

**Diagrama**:
```mermaid
classDiagram
    class DbDriver {
        <<interface - Estratégia>>
        +query(sql, params)
        +queryOne(sql, params)
        +execute(sql, params)
        +transaction(ops)
    }
    class SqliteDriver {
        <<Estratégia Concreta A>>
        -db: Database (better-sqlite3)
        +query() Promise~sync wrapped~
    }
    class PostgresDriver {
        <<Estratégia Concreta B>>
        -sql: postgres client
        +query() Promise~async~
    }
    class DbClient {
        <<Contexto>>
        -driverPromise: Promise~DbDriver~
        +getDriver(): seleciona estratégia\nbased on DATABASE_URL
    }
    DbDriver <|.. SqliteDriver
    DbDriver <|.. PostgresDriver
    DbClient --> DbDriver : usa
```

**Seleção da estratégia**:
```typescript
// A estratégia é selecionada em runtime por variável de ambiente
driverPromise = env.databaseUrl
  ? makePgDriver(env.databaseUrl)   // produção
  : makeSqliteDriver();              // desenvolvimento
```

**Por que usar**:
- **DX (Developer Experience)**: desenvolvedor roda com SQLite sem instalar PostgreSQL
- **CI/CD**: testes rodam com SQLite (rápido, sem infraestrutura)
- **Produção**: PostgreSQL em produção sem alterar uma linha nos repositórios
- **Rollback seguro**: se remover `DATABASE_URL` do `.env`, volta para SQLite imediatamente

---

### 11.4 Factory Pattern

**Categoria**: Criacional

**O que é**: Define uma interface para criar objetos, mas deixa as subclasses decidirem qual classe instanciar. Encapsula a lógica de criação de objetos complexos.

**Onde está no código**:
```
backend/src/services/db-client.ts
  → makePgDriver(url)     ← Factory A: cria driver PostgreSQL
  → makeSqliteDriver()    ← Factory B: cria driver SQLite

backend/src/config/env.ts
  → env object            ← Factory de configuração tipada
```

**Código**:
```typescript
// Factory: cria e configura o driver PostgreSQL completo
async function makePgDriver(databaseUrl: string): Promise<DbDriver> {
  const postgres = await import('postgres');  // lazy import
  const sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},  // suprime NOTICEs de índices existentes
  });

  await sql.unsafe(PG_SCHEMA);  // auto-cria tabelas (idempotente)

  return {
    query: async (sql, params) => ...,
    queryOne: async (sql, params) => ...,
    execute: async (sql, params) => ...,
    transaction: async (ops) => ...,
  };
}
```

**Por que usar**:
- **Encapsulamento**: quem usa `getDriver()` não sabe como o driver foi criado
- **Lazy initialization**: o driver só é criado na primeira query (economiza recursos)
- **Auto-schema**: a factory PostgreSQL inicializa o banco automaticamente — zero step manual de setup

---

### 11.5 Observer Pattern (Zustand)

**Categoria**: Comportamental

**O que é**: Define uma dependência um-para-muitos entre objetos. Quando um objeto muda de estado, todos os seus dependentes são notificados automaticamente.

**Onde está no código**:
```
src/store/app-store.ts  ← Subject (observable)
Componentes React       ← Observers
useAppStore(selector)   ← subscrição seletiva
```

**Como funciona no Zustand**:
```typescript
// Subject: o store notifica observers quando muda
const useAppStore = create(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createEssaysSlice(...args),
      ...createCorrectionSlice(...args),
    }),
    { name: 'app-store', storage: AsyncStorage }
  )
);

// Observer A: componente React
function DashboardScreen() {
  // Subscreve APENAS essays (não re-renderiza quando teacher muda)
  const essays = useAppStore(state => state.essays);
  return <Text>{essays.length}</Text>;
}

// Observer B: outro componente
function KpiCard() {
  const count = useAppStore(state => state.students.length);
}
```

**useShallow — otimização de observadores**:
```typescript
// Sem useShallow: re-renderiza toda vez que o store muda
const { essays, students } = useAppStore(state => ({
  essays: state.essays,
  students: state.students,
}));

// Com useShallow: só re-renderiza se essays ou students mudaram (shallow equal)
const { essays, students } = useAppStore(
  useShallow(state => ({ essays: state.essays, students: state.students }))
);
```

**Por que usar**:
- **Reatividade**: UI atualiza automaticamente quando o estado muda, sem `setState` manual
- **Performance**: `useShallow` e seletores granulares evitam re-renders desnecessários
- **Persistência**: o pattern se integra com `AsyncStorage` transparentemente

---

### 11.6 Command Queue Pattern (Fila de Correção)

**Categoria**: Comportamental

**O que é**: Encapsula requisições como objetos em uma fila. Permite enfileirar, desfazer e reexecutar operações de forma controlada, com concorrência limitada.

**Onde está no código**:
```
src/services/correction/correction-executor.ts
  → p-queue (biblioteca de fila de promises)
src/store/slices/correction.slice.ts
  → retryQueue: string[]  ← IDs na fila de retry offline
```

**Diagrama**:
```mermaid
flowchart LR
    subgraph App
        R1[Redação 1]
        R2[Redação 2]
        R3[Redação 3]
    end

    subgraph Queue["p-queue (concurrency: 3)"]
        direction LR
        Q1[Job 1]
        Q2[Job 2]
        Q3[Job 3: aguardando]
    end

    subgraph Workers
        W1[Worker 1\n→ OpenAI]
        W2[Worker 2\n→ OpenAI]
    end

    subgraph RetryQueue["retryQueue (offline)"]
        RQ1[Essay ID offline 1]
        RQ2[Essay ID offline 2]
    end

    R1 --> Q1 --> W1
    R2 --> Q2 --> W2
    R3 --> Q3

    Q3 -.->|"worker livre"| W1

    W1 -->|"sem rede"| RetryQueue
    RetryQueue -->|"reconecta"| processRetryQueue
```

**Por que usar**:
- **Controle de concorrência**: evita sobrecarregar a API da OpenAI com muitas requisições simultâneas
- **Retry resiliente**: redações que falham por rede ficam em `retryQueue` e são reprocessadas ao reconectar
- **UX fluida**: o professor pode continuar usando o app enquanto as correções processam em background

---

### 11.7 Facade Pattern (API Service)

**Categoria**: Estrutural

**O que é**: Fornece uma interface simplificada para um subsistema complexo. Esconde a complexidade interna atrás de uma API de alto nível.

**Onde está no código**:
```
src/services/api.ts  ← Facade sobre fetch() do browser
```

**Problema**: cada chamada HTTP precisaria de: URL base, headers de auth, tratamento de 401, serialização de body, parsing de resposta.

**Facade**:
```typescript
// Facade: esconde toda a complexidade do HTTP
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBackendUrl()}${endpoint}`;
  const token = getStoredToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Trigger logout automático via handler global
    unauthorizedHandler?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Uso simples (consumidor não conhece a complexidade):
const essays = await apiRequest<BackendEssay[]>('/v1/sync/essays');
```

**Por que usar**:
- **DRY**: lógica de auth, URL base e error handling em um lugar
- **Manutenção**: para mudar o endpoint base ou adicionar um header global, muda um arquivo
- **Testabilidade**: fácil de mockar nas suites de teste

---

### 11.8 Singleton Pattern (Database + Store)

**Categoria**: Criacional

**O que é**: Garante que uma classe tenha apenas uma instância e fornece um ponto global de acesso a ela.

**Onde está no código**:
```
backend/src/services/database.ts  ← Singleton SQLite
src/store/app-store.ts            ← Singleton Zustand store
```

**Database singleton**:
```typescript
// database.ts — criado uma vez, importado em todos os repositórios JS
const db = new Database(join(DATA_DIR, 'essays.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Todas as migrations idempotentes
try { db.exec(`ALTER TABLE teachers ADD COLUMN expiresAt TEXT`); } catch (_) {}

export default db;  // mesmo objeto em toda a aplicação
```

**Por que usar**:
- **Conexão única**: banco de dados não suporta múltiplas conexões de escrita simultâneas (SQLite especialmente)
- **WAL mode**: Journal mode WAL ativado uma vez na inicialização → melhora performance de leitura
- **Estado global**: o store Zustand é singleton por design — todos os componentes acessam o mesmo estado

---

### 11.9 Slice Pattern (Zustand)

**Categoria**: Arquitetural (State Management)

**O que é**: Divide o estado global em fatias (slices) independentes, cada uma responsável por um domínio. Os slices são combinados em um único store.

**Onde está no código**:
```
src/store/slices/
  auth.slice.ts       ← professor, token, consentimento Sentry
  essays.slice.ts     ← CRUD de redações
  correction.slice.ts ← pipeline de correção + retry queue
  students.slice.ts   ← alunos
  themes.slice.ts     ← temas
  turmas.slice.ts     ← turmas
  sync.slice.ts       ← sincronização com backend
```

**Composição**:
```typescript
// app-store.ts — combina todos os slices
const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createEssaysSlice(...args),
      ...createCorrectionSlice(...args),
      ...createStudentsSlice(...args),
      ...createThemesSlice(...args),
      ...createTurmasSlice(...args),
      ...createSyncSlice(...args),
    }),
    { name: 'enem-ia-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

**Por que usar**:
- **SRP (Single Responsibility)**: cada slice tem uma responsabilidade única
- **Escalabilidade**: adicionar um novo domínio = criar um novo slice sem tocar nos existentes
- **Testabilidade**: cada slice pode ser testado isoladamente (como visto em `essays.slice.test.ts`)
- **Colocação**: estado e lógica relacionados ficam juntos (vs. espalhados em Context API)

---

### 11.10 Retry + Exponential Backoff

**Categoria**: Resiliência

**O que é**: Quando uma operação falha, tenta novamente após um delay crescente. Evita sobrecarregar sistemas instáveis com retries imediatos.

**Onde está no código**:
```
src/store/slices/correction.slice.ts
  → RETRY_DELAYS = [8_000, 20_000]
  → MAX_ATTEMPTS = 3
```

**Implementação**:
```typescript
const RETRY_DELAYS = [8_000, 20_000];  // 8s, 20s
const MAX_ATTEMPTS = 3;

// Attempt 1: falha → aguarda 8s → Attempt 2
// Attempt 2: falha → aguarda 20s → Attempt 3
// Attempt 3: falha → status 'pendente' + addToRetryQueue()

const canRetry = !isRateLimited && isRetriableError(error) && currentAttempts < MAX_ATTEMPTS;
const retryDelay = RETRY_DELAYS[currentAttempts - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];

if (canRetry) {
  setTimeout(() => {
    get().evaluateEssayWithOpenAI(essayId).catch(() => {});
  }, retryDelay);
} else {
  if (isNetworkError(message)) get().addToRetryQueue(essayId);
}
```

**Por que usar**:
- **Resiliência**: instabilidades temporárias da API da OpenAI não resultam em erro permanente
- **Rate limiting**: delays crescentes respeitam os limites da API
- **UX**: o professor vê "Tentativa 2/3, tentando em 20s..." em vez de erro imediato
- **Offline-first**: redações que falham por rede são retomadas automaticamente na reconexão

---

## Resumo dos Padrões

| Padrão | Categoria | Onde | Benefício principal |
|---|---|---|---|
| Repository | Arquitetural | `*Repository.ts` | Abstração do banco de dados |
| Adapter | Estrutural | `toPgSql()` | SQLite SQL funciona no PostgreSQL |
| Strategy | Comportamental | `db-client.ts` | SQLite dev, PostgreSQL prod |
| Factory | Criacional | `makePgDriver()` | Criação encapsulada de drivers |
| Observer | Comportamental | Zustand store | UI reativa ao estado |
| Command Queue | Comportamental | `p-queue`, `retryQueue` | Controle de concorrência |
| Facade | Estrutural | `apiRequest()` | HTTP simplificado |
| Singleton | Criacional | `database.ts`, store | Instância única compartilhada |
| Slice | Arquitetural | Zustand slices | Estado modular e testável |
| Retry + Backoff | Resiliência | `correction.slice.ts` | Tolerância a falhas temporárias |
