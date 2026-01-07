import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Remplace process.env.API_KEY par la valeur de l'environnement au moment du build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Evite l'erreur "process is not defined" dans le navigateur
    'process.env': {}
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});