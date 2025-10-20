import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'define' block is the key to fixing the deployment error.
  // It tells Vite to replace `process.env.API_KEY` in the code
  // with the value of the `VITE_API_KEY` environment variable during the build.
  // This makes the code compatible with both the Gemini API guidelines and Vercel's environment.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
})
