/**
 * Responsive photos. Originals live in src/assets/img; Astro turns each one
 * into WebP files at the widths a layout asks for. Call these from .astro
 * files (build time) and pass the result to React islands as plain props.
 */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

// Loaded on demand, so photos that no page uses never end up in the build
const files = import.meta.glob<{ default: ImageMetadata }>("../assets/img/*.{jpg,jpeg,png,webp}");

export type Pic = { src: string; srcset: string; width: number; height: number };

/** "img/hero-pasta.jpg" (the paths used in menu-data.js) -> the original image */
export async function original(path: string): Promise<ImageMetadata> {
  const name = path.split("/").pop();
  const hit = Object.entries(files).find(([key]) => key.endsWith("/" + name));
  if (!hit) throw new Error(`Image not found in src/assets/img: ${path}`);
  return (await hit[1]()).default;
}

/** WebP srcset at the given widths (never wider than the original) */
export async function pic(path: string, widths: number[] = [640, 960, 1400], quality = 74, format: "webp" | "jpg" = "webp"): Promise<Pic> {
  const meta = await original(path);
  const ws = Array.from(new Set(widths.map((w) => Math.min(w, meta.width)))).sort((a, b) => a - b);
  const img = await getImage({ src: meta, widths: ws, format, quality });
  return { src: img.src, srcset: img.srcSet.attribute, width: meta.width, height: meta.height };
}
