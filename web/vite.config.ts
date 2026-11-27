import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tiny-mark.svg'],
      manifest: {
        name: 'Tiny — teacher workspace',
        short_name: 'Tiny',
        description: 'Offline-first teacher workspace for rural primary schools.',
        theme_color: '#1d5b47',
        background_color: '#f7f1e5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/tiny-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
  build: { target: 'es2022' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    css: false,
  },
});
