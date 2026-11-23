// Perfetto website: Astro + React islands + Tailwind.
// GitHub Actions builds this into site/dist and publishes it to GitHub Pages
// (.github/workflows/deploy-site.yml) whenever site/ changes on main.
// When the site moves to its own domain, change `site` and set `base: "/"`.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://aik-data.github.io",
  base: "/Restaurant",
  build: { format: "file" }, // keeps the familiar order.html / events.html addresses
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
