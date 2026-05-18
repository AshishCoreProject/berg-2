import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  cacheDir: path.resolve(__dirname, '../../node_modules/.vite/storefront'),
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@berg/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
      '@berg/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@berg/layout': path.resolve(__dirname, '../../packages/layout/src/index.ts'),
      '@berg/blocks': path.resolve(__dirname, '../../packages/blocks/src/index.ts'),
      // One React instance only: file-linked cart plugin can nest react@19 from its dev toolchain.
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  server: { port: 5174 },
});
