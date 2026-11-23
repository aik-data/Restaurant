// Tailwind class merging (clsx + tailwind-merge in one), same helper the shadcn components use
export { cn } from "cn";

/** Prefix a public file path with the site's base URL (GitHub Pages serves under /Restaurant/). */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + "/" + path.replace(/^\//, "");
}
