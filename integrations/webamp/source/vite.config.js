import { defineConfig } from "vite";
import { streamProxy } from "./server/streamProxy.js";

export default defineConfig({
  base: "./",
  plugins: [streamProxy()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    // webamp-modern derives element tags, CSS hooks and MAKI getClassName()
    // from class names (Button, Layer, Text...): they must survive minifying.
    rolldownOptions: { output: { keepNames: true } }
  },
  server: {
    host: true
  }
});
