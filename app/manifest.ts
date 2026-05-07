import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Milasty Admin",
    short_name: "Milasty",
    description: "Milasty premium artisan cookies admin dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#1E0D04",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/api/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
