import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Адрес API для dev-сервера. Если порт 3001 занят, задайте VITE_API_PROXY в client/.env.local (файл не коммитится).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': env.VITE_API_PROXY || 'http://localhost:3001',
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
    },
  };
});
