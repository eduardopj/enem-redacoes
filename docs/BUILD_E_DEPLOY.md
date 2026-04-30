# Build e Deploy - ENEM Redações

Este guia assume:

- Frontend: Expo/Expo Router.
- Backend: Node.js/Express rodando no Droplet da DigitalOcean.
- Servidor atual: `146.190.47.67`.
- Backend na porta `3333`.
- A chave da OpenAI fica somente no backend.

## 1. Validação Local Antes Do Build

Na raiz do projeto:

```bash
npm install
npm run validate
```

No backend:

```bash
cd backend
npm install
npm test
cd ..
```

Valide também o bundle web/rotas:

```bash
npx expo export --platform web --clear
```

## 2. Teste Local No Expo Go

Na raiz do projeto:

```bash
npx expo start --clear
```

Abra no Expo Go e siga o checklist:

```text
docs/QA_ANDROID.md
```

## 3. Atualizar Backend No Droplet

O `.env` do backend já deve estar salvo no servidor. O deploy abaixo não deve sobrescrever esse arquivo.

### 3.1. Gerar pacote do backend

Na raiz do projeto:

```bash
npm run package:backend
```

Isso cria:

```text
backend-deploy.tar.gz
```

### 3.2. Enviar pacote para o Droplet

No PowerShell:

```powershell
scp .\backend-deploy.tar.gz root@146.190.47.67:/opt/enem-ia/
```

### 3.3. Entrar no servidor

```powershell
ssh root@146.190.47.67
```

### 3.4. Fazer backup rápido do `.env`

No servidor:

```bash
mkdir -p /opt/enem-ia/backup
cp /opt/enem-ia/backend/.env /opt/enem-ia/backup/backend.env.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
```

### 3.5. Extrair e reiniciar

No servidor:

```bash
cd /opt/enem-ia
tar -xzf backend-deploy.tar.gz
cd backend
npm install --omit=dev
pm2 restart enem-backend || pm2 start src/server.js --name enem-backend
pm2 save
```

### 3.6. Testar backend

No servidor ou no seu computador:

```bash
curl http://146.190.47.67:3333/health
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "ok": true
  }
}
```

## 4. Variáveis Do Backend No Servidor

Arquivo esperado:

```text
/opt/enem-ia/backend/.env
```

Exemplo:

```env
OPENAI_API_KEY=sk-...
PORT=3333
DATA_DIR=/opt/enem-ia/data
CORS_ORIGINS=*
REQUEST_BODY_LIMIT=18mb
MAX_IMAGE_BASE64_CHARS=18000000
OPENAI_MODEL=gpt-4.1-mini
```

Para produção, o ideal é trocar `CORS_ORIGINS=*` por domínios reais quando eles existirem.

## 5. Build Android APK

O `eas.json` já tem `preview` e `production` apontando para:

```text
http://146.190.47.67:3333
```

### 5.1. Login no Expo

```bash
npx eas-cli login
```

### 5.2. Gerar APK interno para teste

```bash
npx eas-cli build -p android --profile preview
```

Ao terminar, o EAS mostra um link para baixar o APK.

### 5.3. Gerar APK de produção

```bash
npx eas-cli build -p android --profile production
```

## 6. Depois De Instalar O APK

Teste no Android real:

- abrir app;
- entrar como professor;
- criar aluno;
- criar tema;
- criar redação com Tema Livre;
- anexar foto;
- salvar e corrigir;
- abrir resultado;
- abrir detalhe do aluno;
- abrir relatório do aluno;
- entrar como aluno;
- conferir home, redações, evolução e ranking.

## 7. Comandos Úteis No Servidor

Ver status:

```bash
pm2 status
```

Ver logs:

```bash
pm2 logs enem-backend
```

Reiniciar:

```bash
pm2 restart enem-backend
```

Ver `.env` sem mostrar chave completa:

```bash
cd /opt/enem-ia/backend
grep -E "PORT|DATA_DIR|CORS_ORIGINS|REQUEST_BODY_LIMIT|OPENAI_MODEL" .env
```

## 8. Se Algo Der Errado

### Backend não responde

```bash
pm2 logs enem-backend --lines 80
curl http://localhost:3333/health
```

### App não corrige redação

Confira:

- `EXPO_PUBLIC_BACKEND_URL` no `eas.json`;
- porta `3333` aberta no Droplet;
- `OPENAI_API_KEY` no backend;
- logs do PM2;
- resposta de `/health`.

### Botões cobertos no Android

Tire print da tela inteira com a barra de navegação visível e informe:

- modelo do aparelho;
- versão do Android;
- tela afetada;
- ação feita antes do problema.
