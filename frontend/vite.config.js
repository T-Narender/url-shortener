import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/shorten": "http://localhost:3000",
      "/all": "http://localhost:3000"
    }
  }
})
