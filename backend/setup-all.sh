#!/bin/bash
# Setup completo do zero: Node.js, PM2, UFW, nginx, HTTPS via nip.io
# Uso: bash /opt/enem-ia/backend/setup-all.sh
# Ubuntu 24.04 LTS — roda UMA VEZ no droplet novo.
set -e

BACKEND_PORT=3333
EMAIL="dudu.juni0r@gmail.com"

# ── Detecta IP público automaticamente ───────────────────────────────────────
IP=$(curl -4 -s https://ifconfig.me 2>/dev/null || curl -4 -s https://api.ipify.org)
DOMAIN="${IP//./-}.nip.io"

echo ""
echo "================================================="
echo " IP detectado : $IP"
echo " Domínio HTTPS: $DOMAIN"
echo "================================================="
echo ""

# ── 1. Node.js 20 ─────────────────────────────────────────────────────────────
echo "=== 1. Node.js 20 ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

# ── 2. PM2 ────────────────────────────────────────────────────────────────────
echo "=== 2. PM2 ==="
npm install -g pm2

# ── 3. Diretórios ─────────────────────────────────────────────────────────────
echo "=== 3. Diretórios ==="
mkdir -p /opt/enem-ia/data

# ── 4. Dependências do backend ────────────────────────────────────────────────
echo "=== 4. Dependências do backend ==="
cd /opt/enem-ia/backend
npm ci --omit=dev

# ── 5. nginx + certbot ────────────────────────────────────────────────────────
echo "=== 5. nginx e certbot ==="
apt-get update -y
apt-get install -y nginx certbot

# ── 6. Firewall — SSH PRIMEIRO, nunca bloquear o próprio acesso ───────────────
echo "=== 6. Firewall ==="
ufw allow 22/tcp    # SSH  — OBRIGATÓRIO antes de qualquer ufw enable
ufw allow 80/tcp    # HTTP — necessário para o desafio do Let's Encrypt
ufw allow 443/tcp   # HTTPS — tráfego do app
# porta 3333 NÃO exposta: o nginx faz proxy internamente
ufw --force enable
ufw status verbose

# ── 7. Certificado SSL (standalone — nginx parado durante o desafio) ───────────
echo "=== 7. Certificado SSL ==="
systemctl stop nginx || true
certbot certonly --standalone \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL"

# ── 8. Config nginx ───────────────────────────────────────────────────────────
echo "=== 8. nginx config ==="
cat > /etc/nginx/sites-available/enem-backend << NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Suporta imagens base64 de redações (~10 MB binário → ~14 MB base64)
    client_max_body_size 25M;

    location / {
        proxy_pass         http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        # Timeout > 130s da chamada OpenAI
        proxy_read_timeout    150s;
        proxy_send_timeout    150s;
        proxy_connect_timeout 10s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/enem-backend /etc/nginx/sites-enabled/enem-backend
rm -f /etc/nginx/sites-enabled/default
nginx -t

# ── 9. Inicia e habilita nginx ────────────────────────────────────────────────
echo "=== 9. nginx start ==="
systemctl start nginx
systemctl enable nginx

# ── 10. Renovação automática do certificado ───────────────────────────────────
echo "=== 10. Auto-renovação SSL ==="
echo "0 3 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" \
  > /etc/cron.d/certbot-renew

# ── 11. Backup automático do banco de dados ────────────────────────────────────
echo "=== 11. Backup automático do banco ==="
# Roda todo dia às 2h da manhã e guarda os últimos 7 backups
echo "0 2 * * * root cd /opt/enem-ia/backend && node src/utils/backup-db.js >> /opt/enem-ia/data/logs/backup.log 2>&1" \
  > /etc/cron.d/enem-backup

# ── 11b. Retenção de imagens ───────────────────────────────────────────────────
echo "=== 11b. Retenção de imagens ==="
# Roda todo dia às 4h da manhã: remove órfãs e aplica quota por professor
echo "0 4 * * * root cd /opt/enem-ia/backend && node src/utils/image-retention.js >> /opt/enem-ia/data/logs/retention.log 2>&1" \
  > /etc/cron.d/enem-retention

# ── 12. Backend com PM2 (cluster mode) ────────────────────────────────────────
echo "=== 12. Backend PM2 ==="
cd /opt/enem-ia/backend
pm2 delete enem-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "================================================="
echo " TUDO PRONTO!"
echo ""
echo " URL HTTPS : https://$DOMAIN"
echo " Health    : curl https://$DOMAIN/health"
echo ""
echo " Atualize o .env do app com:"
echo " EXPO_PUBLIC_BACKEND_URL=https://$DOMAIN"
echo "================================================="
pm2 status
