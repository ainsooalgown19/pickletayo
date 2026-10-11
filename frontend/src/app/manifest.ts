import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PickleTayo",
    short_name: "PickleTayo",
    description: "Find courts, join your community, and play more pickleball.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#0a7e45",
    icons: [
      { src: "/brand/pickletayo-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/pickletayo-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/pickletayo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
