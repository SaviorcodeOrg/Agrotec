import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite 5+ rejects requests whose Host header it doesn't recognize
    // (DNS-rebinding protection). This stack fronts the dev server with a
    // Cloudflare Tunnel hostname, so the Host header is never "localhost".
    allowedHosts: ['agrotec.saviorcode.com', 'gui', 'localhost'],
  },
})
