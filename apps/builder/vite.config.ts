import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  cacheDir: path.resolve(__dirname, '../../node_modules/.vite/builder'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@berg/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
      '@berg/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: { port: 5173 },
});
