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
        // Strip browser headers that push Vercel Dev over Node's 16KB header limit (431 error)
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("cookie");
            proxyReq.removeHeader("if-none-match");
          });
        },
      },
    },
  },
});
