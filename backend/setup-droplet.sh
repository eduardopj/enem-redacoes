#!/bin/bash
# Roda UMA VEZ no droplet para configurar tudo.
# Uso: bash setup-droplet.sh
set -e

echo "=== 1. Atualizando pacotes ==="
apt-get update -y

echo "=== 2. Instalando Node.js 20 ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "=== 3. Instalando PM2 ==="
npm install -g pm2

echo "=== 4. Criando diretórios ==="
mkdir -p /opt/enem-ia/data
mkdir -p /opt/enem-ia/backend

echo "=== 5. Instalando dependências do backend ==="
cd /opt/enem-ia/backend
npm install --omit=dev

echo "=== 6. Verificando .env ==="
if [ ! -f /opt/enem-ia/backend/.env ]; then
  echo "ATENÇÃO: crie o arquivo /opt/enem-ia/backend/.env com:"
  echo "  OPENAI_API_KEY=sk-..."
  echo "  DATA_DIR=/opt/enem-ia/data"
  echo "  PORT=3333"
  exit 1
fi

echo "=== 7. Iniciando backend com PM2 ==="
cd /opt/enem-ia/backend
pm2 delete enem-backend 2>/dev/null || true
pm2 start src/server.js --name enem-backend
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo "=== 8. Abrindo porta 3333 no firewall ==="
ufw allow 3333/tcp
ufw --force enable

echo ""
echo "=== PRONTO ==="
echo "Teste: curl http://146.190.47.67:3333/health"
pm2 status
