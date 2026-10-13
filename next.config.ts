import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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
