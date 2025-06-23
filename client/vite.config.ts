import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Custom plugin to copy _redirects after build
function copyRedirects(): any {
  return {
    name: 'copy-redirects',
    closeBundle() {
      const from = path.resolve(__dirname, 'public/_redirects');
      const to = path.resolve(__dirname, 'dist/_redirects');
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        console.log('✅ Copied _redirects to dist/');
      } else {
        console.warn('⚠️ _redirects file not found in public/');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyRedirects()],
  base: process.env.VITE_BASE_PATH || '/',
  optimizeDeps: {
    include: ['@react-three/fiber', '@react-three/drei'],
  },
});