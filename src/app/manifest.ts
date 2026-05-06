import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WMS Pin NLMT",
    short_name: "WMS",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
  };
}
