import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [{
    name: "copy-runtime-game-assets",
    closeBundle() {
      cpSync(resolve("assets"), resolve("dist/assets"), { recursive: true });
    }
  }],
  server: {
    port: 5173,
    host: "0.0.0.0"
  },
  build: {
    target: "es2020",
    outDir: "dist"
  }
});
