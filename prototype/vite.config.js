import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy API calls to vercel dev (run `npx vercel dev --yes --listen 3001` separately)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
