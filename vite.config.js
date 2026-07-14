// vite.config.js
// Build/dev-server configuration for the "Orbit Drift" static project.
// NOTE: This file is loaded automatically by the Vite CLI (dev/build/preview
// scripts in package.json) — it is a tooling config, not an application
// module, so it is intentionally never imported from index.html/script.js.
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
});
// [FL:DONE]