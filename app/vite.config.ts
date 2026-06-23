import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The 0G Node SDKs now run server-side (app/api/*), so the browser bundle only
// needs ethers + eciesjs — no Node polyfills required. The dev server proxies
// /api to the local Express API (app/server/dev.ts).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
