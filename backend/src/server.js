import { networkInterfaces } from 'os';
import { app } from './app.js';
import { env } from './config/env.js';

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

app.listen(env.port, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`Backend rodando em http://${ip}:${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/health`);
  console.log(`\n→ .env do app: EXPO_PUBLIC_BACKEND_URL=http://${ip}:${env.port}\n`);
});