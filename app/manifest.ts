import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

// Rend le site installable comme application web (bouton « Installer
// l'application » de la page d'accueil, ou menu du navigateur).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Espace média`,
    short_name: SITE_NAME,
    description:
      "L'espace média de Jean-Marc GNALI : des ressources gratuites en audio, vidéo, livres et fichiers pratiques.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#14263d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
