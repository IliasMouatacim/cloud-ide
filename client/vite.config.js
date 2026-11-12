import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);

export default defineConfig({
  define: { __PREVIEW_LUCIDE_EXPORTS__: JSON.stringify(Object.keys(require('lucide-react'))) },
  resolve: { alias: {
    'preview-lucide-source?raw': path.join(path.dirname(require.resolve('lucide-react/package.json')), 'dist/umd/lucide-react.min.js') + '?raw',
    'preview-react-source?raw': path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.production.min.js') + '?raw',
    'preview-react-dom-source?raw': path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.production.min.js') + '?raw',
  } },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
});
