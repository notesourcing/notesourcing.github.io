import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // Correct for a root domain on GitHub Pages
  plugins: [react()],
});
