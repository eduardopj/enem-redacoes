#!/bin/bash
# Manual deploy — used when GitHub Actions CI/CD is not available.
# Usage from your machine:
#   scp backend-deploy.tar.gz root@<DROPLET_IP>:/opt/enem-ia/
#   ssh root@<DROPLET_IP> "cd /opt/enem-ia && bash backend/update-droplet.sh"
set -e

cd /opt/enem-ia

echo "=== Extracting new code ==="
tar -xzf backend-deploy.tar.gz

cd backend

echo "=== Installing dependencies ==="
npm ci --omit=dev

echo "=== Reloading PM2 (zero-downtime) ==="
# pm2 reload does a rolling restart: new workers start before old ones stop
# Falls back to start if the app isn't running yet
pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs

echo "=== Health check ==="
for i in 1 2 3 4 5; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/health)
  if [ "$STATUS" = "200" ]; then
    echo "Health check passed (attempt $i)"
    break
  fi
  if [ $i -eq 5 ]; then
    echo "Health check FAILED — check: pm2 logs enem-backend"
    exit 1
  fi
  echo "Attempt $i: HTTP $STATUS — retrying in 5s..."
  sleep 5
done

pm2 status
echo ""
DOMAIN=$(grep -oP 'EXPO_PUBLIC_BACKEND_URL=\K\S+' /opt/enem-ia/backend/.env 2>/dev/null || echo "<your-domain>")
echo "Deploy complete. Endpoint: $DOMAIN/health"
