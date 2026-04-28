#!/bin/bash
# Roda toda vez que fizer deploy de uma nova versão.
# Uso: bash update-droplet.sh
set -e

cd /opt/enem-ia/app
git pull

cd backend
npm install --omit=dev

pm2 restart enem-backend
pm2 status

echo "Deploy concluído."
echo "Teste: curl http://146.190.47.67:3333/health"
