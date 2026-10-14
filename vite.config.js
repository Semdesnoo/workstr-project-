import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { pages, file } from "./scripts/site-pages.mjs";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, "app.html"),
        ...Object.fromEntries(pages.map(([id, path]) => [id, resolve(import.meta.dirname, file(path))])),
      },
    },
  },
});
