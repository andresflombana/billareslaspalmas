import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// En desarrollo, el frontend llama a la API con rutas relativas `/api/...` y Vite
// las reenvía al backend (quitando el prefijo /api). En producción (Sprint 12)
// Nginx hace exactamente lo mismo: http://billares.local/api/* → Node.js.
// Así el código del frontend es idéntico en ambos entornos y funciona también
// desde los otros dos PCs de la LAN (http://IP-DEL-PC-BILLAR:5173).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = env.API_URL_DESARROLLO || 'http://localhost:4000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
          rewrite: (ruta) => ruta.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      // Librerías en paquetes propios: el navegador las guarda en caché entre
      // versiones de la app, y Three.js solo se descarga al abrir el detalle de una mesa.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
            nextui: ['@nextui-org/react', 'framer-motion'],
            three: ['three', '@react-three/fiber'],
          },
        },
      },
      // NextUI ocupa ~700 kB minificado; en una LAN y con caché no es un problema.
      chunkSizeWarningLimit: 1000,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
          rewrite: (ruta) => ruta.replace(/^\/api/, ''),
        },
      },
    },
  };
});
