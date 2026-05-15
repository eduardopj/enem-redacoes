#!/bin/bash
# Primeiro deploy em um droplet novo.
# Roda na sua máquina local — empacota o backend, envia via SCP e dispara o setup.
#
# Pré-requisito: SSH configurado para o root do droplet sem senha (chave SSH).
# Uso:
#   bash backend/first-deploy.sh 134.209.38.46
#
set -e

DROPLET_IP="${1:?Uso: $0 <DROPLET_IP>}"
REMOTE_DIR="/opt/enem-ia"
PACKAGE="backend-deploy.tar.gz"

echo ""
echo "================================================="
echo " ENEM IA — Primeiro Deploy"
echo " Droplet : root@$DROPLET_IP"
echo " Destino : $REMOTE_DIR"
echo "================================================="
echo ""

# ── 1. Empacotar o backend ────────────────────────────────────────────────────
echo "=== 1. Empacotando backend ==="
tar -czf "$PACKAGE" \
  --exclude='backend/node_modules' \
  --exclude='backend/data' \
  --exclude='backend/*.tar.gz' \
  backend/

echo "    Pacote: $PACKAGE ($(du -sh $PACKAGE | cut -f1))"

# ── 2. Criar diretório e enviar pacote ────────────────────────────────────────
echo "=== 2. Enviando para o droplet ==="
ssh "root@$DROPLET_IP" "mkdir -p $REMOTE_DIR"
scp "$PACKAGE" "root@$DROPLET_IP:/tmp/"

# ── 3. Extrair no droplet ─────────────────────────────────────────────────────
echo "=== 3. Extraindo no droplet ==="
ssh "root@$DROPLET_IP" "tar -xzf /tmp/$PACKAGE -C $REMOTE_DIR && rm /tmp/$PACKAGE"

# ── 4. Criar .env de produção ─────────────────────────────────────────────────
echo "=== 4. Criando .env de produção ==="
echo ""
echo "    ⚠  Cole sua OPENAI_API_KEY abaixo quando solicitado."
echo "       Outras variáveis serão definidas com valores padrão."
echo ""
read -rsp "    OPENAI_API_KEY: " OPENAI_KEY
echo ""

ssh "root@$DROPLET_IP" bash << EOF
cat > $REMOTE_DIR/backend/.env << 'ENVEOF'
OPENAI_API_KEY=$OPENAI_KEY
OPENAI_MODEL=gpt-4.1-mini
PORT=3333
NODE_ENV=production
DATA_DIR=/opt/enem-ia/data
CORS_ORIGINS=https://${DROPLET_IP//./-}.nip.io
REQUEST_BODY_LIMIT=32mb
LOG_LEVEL=info
ENVEOF
echo "    .env criado em $REMOTE_DIR/backend/.env"
EOF

# ── 5. Rodar setup completo ───────────────────────────────────────────────────
echo "=== 5. Rodando setup-all.sh no droplet (Node, nginx, HTTPS, PM2...) ==="
echo "    Isso leva ~2-3 minutos."
echo ""
ssh "root@$DROPLET_IP" "bash $REMOTE_DIR/backend/setup-all.sh"

# ── 6. Limpar pacote local ────────────────────────────────────────────────────
rm -f "$PACKAGE"

echo ""
echo "================================================="
echo " Deploy concluído!"
echo " Acesse: https://${DROPLET_IP//./-}.nip.io/health"
echo ""
echo " Próximo passo — configure os GitHub Secrets:"
echo "   DROPLET_HOST = $DROPLET_IP"
echo "   DROPLET_USER = root"
echo "   DROPLET_SSH_KEY = <conteúdo da sua chave privada SSH>"
echo "================================================="
