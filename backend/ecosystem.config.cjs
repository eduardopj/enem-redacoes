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

      // Cluster mode: one worker per CPU core (auto-detected)
      // Adjust to a fixed number (e.g. instances: 2) if OpenAI rate limits become an issue
      instances: 'max',
      exec_mode: 'cluster',

      // Restart if memory exceeds 500 MB (catches memory leaks)
      max_memory_restart: '500M',

      // Give the graceful shutdown handler time to drain the correction queue
      kill_timeout: 160000,

      // Wait for process.send('ready') before marking as online
      wait_ready: true,
      listen_timeout: 15000,

      // Merge all worker logs into a single file (easier to read with pm2 logs)
      merge_logs: true,

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
