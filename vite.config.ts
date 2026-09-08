import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/WTS_Mentorship_2026/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
