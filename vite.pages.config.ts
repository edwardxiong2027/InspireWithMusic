import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "preview",
  publicDir: "../public",
  base: "/InspireWithMusic/",
  plugins: [react()],
  build: { outDir: "../out", emptyOutDir: true },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
