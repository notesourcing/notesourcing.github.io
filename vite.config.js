import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notesourcing.github.io/', // necessario per GitHub Pages
  plugins: [react()],
});
