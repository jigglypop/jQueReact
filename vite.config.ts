import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import jquereactPlugin from './plugins/vite-plugin';

export default defineConfig({
  base: '',
  plugins: [
    react(),
    jquereactPlugin({
      include: ['src/legacy/**/*.jquery.js', 'src/legacy/**/*.jquery.html'],
      outputDir: 'src/components/generated',
    }),
  ],
  resolve: {
    alias: [],
  },
});
