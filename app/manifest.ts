import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Rend le site installable comme application web (popup d'installation,
// bouton « Installer l'application », ou menu du navigateur).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    // nom affiche sous l'icone installee
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "L'espace média de Jean-Marc GNALI : des ressources gratuites en audio, vidéo, livres et fichiers pratiques.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#14263d",
    icons: [
      ...ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      // contenu centre sur fond plein : utilisable tel quel en icone adaptative
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
