import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


// vite.config.ts

// Puertos canónicos del proyecto (fijos, no negociables):
//   5173 → desarrollo con HMR   (npm run dev:client)
//   4173 → preview del build    (npm run preview)
//   3001 → Express autoritativo (npm run dev:server)
const API_TARGET = 'http://localhost:3001';
const proxy = { '/api': API_TARGET };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // si 5173 está ocupado, falla en vez de migrar a 5174
    proxy,
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy, // el preview también reenvía /api a Express (mismo contrato que dev)
  },
});





