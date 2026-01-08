import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using (process as any).cwd() to bypass "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Use the key from env
  const apiKey = env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Correctly replace process.env.API_KEY with the actual value during build
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
    }
  };
});