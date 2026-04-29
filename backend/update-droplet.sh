#!/bin/bash
# Roda toda vez que fizer deploy de uma nova versão.
# Uso (do seu computador):
#   scp backend-deploy.tar.gz root@146.190.47.67:/opt/enem-ia/
#   ssh root@146.190.47.67 "cd /opt/enem-ia && bash backend/update-droplet.sh"
set -e

cd /opt/enem-ia

# Extrair novo código (não sobrescreve node_modules nem .env)
tar -xzf backend-deploy.tar.gz

cd backend
npm install --omit=dev

pm2 restart enem-backend
pm2 status

echo "Deploy concluído."
echo "Teste: curl http://146.190.47.67:3333/health"
