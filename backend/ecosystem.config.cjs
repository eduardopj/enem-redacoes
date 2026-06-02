/**
 * PM2 Ecosystem Config
 *
 * Deploy commands:
 *   First time : pm2 start ecosystem.config.cjs
 *   Update     : pm2 reload ecosystem.config.cjs --update-env
 *   Status     : pm2 status
 *
 * Cluster mode distributes requests across all CPU cores.
 * kill_timeout is set to 160s so in-flight OpenAI corrections (130s max)
 * finish gracefully before PM2 force-kills the process.
 */
module.exports = {
  apps: [
    {
      name: 'enem-backend',
      script: './src/server.js',
      // tsx ESM loader resolves TypeScript imports in src/trpc/ at runtime
      interpreter_args: '--import tsx/esm',

      // Fork mode: reliable with interpreter_args + tsx.
      // On multi-core servers, run multiple instances (e.g. instances: 4) and
      // place Nginx upstream in front — each instance listens on the same port
      // via SO_REUSEPORT (Linux kernel balances requests across forks).
      // On this single-vCPU Droplet, instances: 1 is correct.
      instances: 1,
      exec_mode: 'fork',

      // Restart if memory exceeds 500 MB (catches memory leaks)
      max_memory_restart: '500M',

      // Give the graceful shutdown handler time to drain the correction queue
      kill_timeout: 160000,

      // Retry policy: up to 10 restarts with exponential backoff
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,

      // Wait for process.send('ready') before marking as online
      wait_ready: true,
      listen_timeout: 15000,

      // Merge all worker logs into a single file (easier to read with pm2 logs)
      merge_logs: true,
      error_file: '/var/log/enem-backend/error.log',
      out_file: '/var/log/enem-backend/out.log',

      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
    },
  ],
};
