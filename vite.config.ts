import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    fs: { strict: false, allow: [".."], cachedChecks: false },
  },
  optimizeDeps: { esbuildOptions: { target: "es2020" } },
  build: { target: "es2020" },
});
