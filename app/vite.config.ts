import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 0G SDKs may reference Node globals; provide light polyfills as needed.
export default defineConfig({
  plugins: [react()],
  define: { global: "globalThis" },
  resolve: { alias: { buffer: "buffer/" } },
  optimizeDeps: { esbuildOptions: { define: { global: "globalThis" } } },
});
