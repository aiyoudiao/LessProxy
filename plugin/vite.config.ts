import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({
      outDir: "release",
      outFileName: `crx-${name}-${version}.zip`,
    }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },

  // ✅ 重点：仅在生产环境移除 console.log / debugger
  esbuild:
    mode === "production"
      ? {
          drop: ["console", "debugger"],
        }
      : {},
}));
