import type { NextConfig } from "next";
import { publicCsp } from "./lib/security/csp";

const securityHeaders = [
  // HTTPS obligatoire pendant 2 ans (ignore par les navigateurs en HTTP local)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // isole la fenetre du site des fenetres ouvertes par d'autres sites
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), browsing-topics=(), fullscreen=(self \"https://www.youtube-nocookie.com\" \"https://www.youtube.com\" \"https://player.vimeo.com\")",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // ne revele pas la technologie du serveur (en-tete X-Powered-By)
  poweredByHeader: false,
  // Autorise l'acces au serveur de developpement depuis le reseau local
  // (ex: http://192.168.1.5:3000 depuis un telephone). Sans cela, Next bloque
  // ses ressources de dev et l'interface ne devient jamais interactive.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // CSP du site public ; l'admin recoit la sienne, avec nonce, depuis proxy.ts
        source: "/:path((?!admin(?:/|$)).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp() }],
      },
      {
        // service worker : toujours revalide, pour detecter les nouvelles versions
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // l'administration ne doit jamais etre indexee
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      // anciennes URL de la bibliotheque, desormais recherche transversale
      // (les parametres q, categorie... sont conserves)
      { source: "/enseignements", destination: "/recherche", permanent: true },
    ];
  },
};

export default nextConfig;
