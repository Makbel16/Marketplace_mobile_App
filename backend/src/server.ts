import app from './app';
import { config } from './config/environment';

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`=========================================`);
  console.log(` Artisan Marketplace API`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Server listening on http://${HOST}:${PORT}`);
  console.log(` Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
