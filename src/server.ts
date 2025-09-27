import http from 'http';
import { app } from './app';
import { appConfig } from './config/env';

const server = http.createServer(app);

const startServer = () => {
  const port = appConfig.port;
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 NewsApp server berjalan di http://localhost:${port}`);
  });
};

const gracefulShutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`Menerima sinyal ${signal}. Menutup server secara bertahap...`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server berhasil ditutup.');
    process.exit(0);
  });

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.warn('Shutdown paksa setelah timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
