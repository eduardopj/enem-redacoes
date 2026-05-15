#!/bin/bash
# Configura HTTPS via nginx + Let's Encrypt usando sslip.io (sem precisar de domínio próprio).
# Uso (no droplet): bash /opt/enem-ia/backend/setup-https.sh
# Pré-requisito: backend já rodando com pm2 na porta 3333.
set -e

BACKEND_PORT=3333
EMAIL="dudu.juni0r@gmail.com"

# ── Auto-detect public IP ──────────────────────────────────────────────────────
IP=$(curl -4 -s https://ifconfig.me 2>/dev/null || curl -4 -s https://api.ipify.org)
DOMAIN="${IP//./-}.nip.io"

echo "IP detectado : $IP"
echo "Domínio HTTPS: $DOMAIN"

echo "=== 1. Pacotes ==="
apt-get update -y
apt-get install -y nginx certbot

echo "=== 2. Abrindo portas no firewall (incluindo SSH para não perder acesso) ==="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3333/tcp
ufw --force enable

echo "=== 3. Obtendo certificado SSL (certbot standalone) ==="
# Para o nginx se já estiver rodando para liberar a porta 80
systemctl stop nginx || true
certbot certonly --standalone \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL"

echo "=== 4. Configurando nginx como reverse proxy ==="
cat > /etc/nginx/sites-available/enem-backend << NGINX
server {
    listen 80;
    server_name $DOMAIN;
    # Redireciona tudo para HTTPS
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
        # Timeout maior que o da chamada OpenAI (130s) para não cortar antes
        proxy_read_timeout    150s;
        proxy_send_timeout    150s;
        proxy_connect_timeout 10s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/enem-backend /etc/nginx/sites-enabled/enem-backend
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "=== 5. Iniciando nginx ==="
systemctl start nginx
systemctl enable nginx

echo "=== 6. Renovação automática do certificado ==="
echo "0 3 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" \
  > /etc/cron.d/certbot-renew

echo ""
echo "================================================="
echo " HTTPS configurado com sucesso!"
echo " URL: https://$DOMAIN"
echo " Teste: curl https://$DOMAIN/health"
echo ""
echo " Atualize o .env do app (já feito no repositório):"
echo " EXPO_PUBLIC_BACKEND_URL=https://$DOMAIN"
echo "================================================="
