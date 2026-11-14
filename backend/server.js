const { env } = require('./config/env');
const { prisma, disconnectDb } = require('./config/db');
const { createApp } = require('./app');

async function startServer() {
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`Sweety API server running on http://localhost:${env.port}`);
  });

  async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down Sweety API server...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  startServer().catch(async (err) => {
    console.error('Failed to start Sweety API server:', err.message);
    await disconnectDb();
    process.exit(1);
  });
}

module.exports = { startServer };
