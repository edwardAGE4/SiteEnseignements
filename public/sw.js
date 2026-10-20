// Service worker du site (enregistre en production uniquement, voir lib/pwa/update.ts).
// - Rend le site installable et met en cache les fichiers statiques versionnes
//   de Next (/_next/static, noms uniques par contenu) et les icones.
// - Les pages et l'API passent toujours par le reseau : le contenu publie
//   depuis l'administration n'est jamais servi perime.
// - Une nouvelle version attend l'accord de l'utilisateur (bandeau « Mettre a
//   jour ») avant de s'activer : aucune page n'est rechargee sans prevenir.

// Ligne mise a jour par scripts/version.js, ne pas modifier a la main.
const APP_VERSION = "0.1.0";

const CACHE_PREFIX = "jmg-static-";
const CACHE_NAME = CACHE_PREFIX + APP_VERSION;

self.addEventListener("install", () => {
  // Pas de skipWaiting() ici : la nouvelle version attend l'accord de l'utilisateur.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "GET_VERSION" && event.ports[0]) {
    event.ports[0].postMessage({ version: APP_VERSION });
  } else if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheable(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isCacheable(url)) return; // reseau normal

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })(),
  );
});
