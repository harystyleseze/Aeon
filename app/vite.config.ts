import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// The 0G SDKs (compute broker + storage) reference Node globals/builtins
// (process, Buffer, stream, events, util, …). Polyfill those for the browser.
// They also use Node-only subpath imports (node:fs/promises, stream/promises)
// inside file/stream code paths we never call in-browser — alias those to an
// empty shim so the bundler doesn't choke on them.
const emptyNode = fileURLToPath(new URL("./src/lib/empty-node.ts", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "node:fs/promises": emptyNode,
      "fs/promises": emptyNode,
      "node:stream/promises": emptyNode,
      "stream/promises": emptyNode,
    },
  },
});
