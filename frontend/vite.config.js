import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.ngrok-free.dev',     // дозволяє всі ngrok піддомени
      'localhost',
      '127.0.0.1'
    ]
  }
})