import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy hace que las llamadas a /api desde el frontend
// se redirijan automáticamente al backend.
// Esto evita tener que escribir http://localhost:3001 en cada fetch
// y simplifica el manejo de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
