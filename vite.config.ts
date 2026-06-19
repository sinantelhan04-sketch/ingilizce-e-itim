import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');
  
  // Try to get API_KEY from process.env first (system env), then from .env files
  // If not found, use the user-provided key as a fallback
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    }
  };
});