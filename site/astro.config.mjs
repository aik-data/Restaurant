// Perfetto website: Astro + React islands + Tailwind.
// Builds straight into ../docs, which GitHub Pages publishes.
// When the site moves to its own domain, change `site` and set `base: "/"`.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://aik-data.github.io",
  base: "/Restaurant",
  outDir: "../docs",
  build: { format: "file" }, // keeps the familiar order.html / events.html addresses
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
