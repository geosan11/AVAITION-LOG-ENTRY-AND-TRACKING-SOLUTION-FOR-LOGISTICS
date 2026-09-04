import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'AeroLogistics Cloud Suite',
        short_name: 'AeroLogistics',
        description: 'Aviation Log Entry, AWB Tagging & Cargo Tracking Solution',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react':    ['react', 'react-dom'],
          // Supabase client (large)
          'vendor-supabase': ['@supabase/supabase-js'],
          // Offline database
          'vendor-dexie':    ['dexie'],
          // Icon library — split separately so it can be cached independently
          'vendor-lucide':   ['lucide-react'],
        },
      },
    },
    // Raise warn threshold slightly — 600 kB total is fine with chunk splitting
    chunkSizeWarningLimit: 600,
  },
});
