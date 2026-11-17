import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Subruta de despliegue. El manifest y el service worker heredan este valor.
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt': el service worker nuevo espera hasta que el usuario acepte recargar.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'PWA Template',
        short_name: 'PWA',
        description: 'Plantilla mínima de React, TypeScript y Vite como PWA.',
        lang: 'es',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precaché: todo lo que genera el build. Las navegaciones caen en index.html (SPA).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
});
