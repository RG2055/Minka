// Library build of the embeddable player for Minka (RG):
//   dist-embed/webamp-radio.js        ES module, `import { mountWebampRadio }`
//   dist-embed/webamp-radio.css       the player's own styles
//   dist-embed/chunks/*.js            lazy chunks: webamp-modern engine,
//                                     butterchurn (AVS), jszip, hls.js —
//                                     fetched only when first needed
//   dist-embed/modern/assets/         engine runtime assets (Wasabi XUI)
//   dist-embed/skins/modern/          built-in Modern skins
//   dist-embed/data/minka/            station catalogue fallback (page demo)
//   dist-embed/precache.json          everything above, for the host's
//                                     service worker precache list
// Everything else (Webamp classic, Redux, the engine) is bundled. The IIFE
// build is gone: it cannot carry lazy chunks, and Minka loads ES modules.
import { defineConfig } from "vite";
import { cpSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const RUNTIME_DIRS = ["modern/assets", "skins", "data/minka"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (!name.startsWith(".")) out.push(p);
  }
  return out;
}

// Copies the runtime files next to the bundle and writes precache.json.
function copyRuntimeAssets() {
  return {
    name: "webamp-radio-runtime-assets",
    closeBundle() {
      const out = "dist-embed";
      for (const dir of RUNTIME_DIRS) {
        const from = join("public", dir);
        if (existsSync(from)) cpSync(from, join(out, dir), { recursive: true });
      }
      const files = walk(out)
        .map((p) => relative(out, p))
        .filter((p) => p !== "precache.json")
        .sort();
      writeFileSync(join(out, "precache.json"), JSON.stringify(files, null, 2) + "\n");
    }
  };
}

export default defineConfig({
  // No PWA shell assets in the library output; the runtime files are copied
  // explicitly above.
  publicDir: false,
  plugins: [copyRuntimeAssets()],
  build: {
    outDir: "dist-embed",
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500,
    // webamp-modern derives element tags, CSS hooks and MAKI getClassName()
    // from class names (Button, Layer, Text...): they must survive minifying.
    lib: {
      entry: "src/webamp-radio.js",
      formats: ["es"],
      fileName: () => "webamp-radio.js",
      cssFileName: "webamp-radio"
    },
    rolldownOptions: {
      output: {
        // webamp-modern derives element tags, CSS hooks and MAKI
        // getClassName() from class names (Button, Layer, Text...): they
        // must survive minifying.
        keepNames: true,
        assetFileNames: "webamp-radio[extname]",
        chunkFileNames: "chunks/[name]-[hash].js"
      }
    }
  }
});
