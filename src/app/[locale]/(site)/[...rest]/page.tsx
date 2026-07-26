import { notFound } from "next/navigation";

// Catches any path under (site) that doesn't match a real route, so it
// renders the localized not-found.tsx (inside the Header/Footer chrome)
// instead of Next's unstyled default 404.
export default function CatchAllPage(): never {
  notFound();
}
