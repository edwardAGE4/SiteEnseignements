"use client";

import { useSyncExternalStore } from "react";

/**
 * Service de mise a jour de l'application : enregistre le service worker
 * (public/sw.js, en production uniquement) et detecte les nouvelles versions
 * au demarrage, toutes les 30 minutes et a chaque retour sur l'onglet.
 * Ne recharge jamais la page sans l'accord de l'utilisateur : la nouvelle
 * version attend le clic sur « Mettre a jour » (bandeau UpdateBanner).
 */

export type UpdateState = {
  /** Service worker actif : le bouton « Rechercher une mise a jour » est utile. */
  enabled: boolean;
  /** Une nouvelle version est prete et doit etre proposee. */
  available: boolean;
  /** Numero de la nouvelle version (lu dans le service worker), null si inconnu. */
  version: string | null;
};

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const INITIAL_STATE: UpdateState = { enabled: false, available: false, version: null };

let state: UpdateState = INITIAL_STATE;
let registration: ServiceWorkerRegistration | null = null;
let started = false;
let reloading = false;
const listeners = new Set<() => void>();

function setState(patch: Partial<UpdateState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

/** Demande son numero de version au service worker en attente. */
function readVersion(worker: ServiceWorker): Promise<string | null> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), 3000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timer);
      resolve(typeof event.data?.version === "string" ? event.data.version : null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

/** Nouvelle version installee et en attente : on la propose (sauf premiere installation). */
async function offer(worker: ServiceWorker) {
  if (!navigator.serviceWorker.controller) return;
  const version = await readVersion(worker);
  setState({ available: true, version });
}

function watchInstalling(worker: ServiceWorker) {
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed") void offer(worker);
  });
}

async function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

  try {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    return; // navigateur sans service worker exploitable : le site fonctionne normalement
  }
  setState({ enabled: true });

  if (registration.waiting) void offer(registration.waiting);
  if (registration.installing) watchInstalling(registration.installing);
  registration.addEventListener("updatefound", () => {
    if (registration?.installing) watchInstalling(registration.installing);
  });

  // Rechargement uniquement apres « Mettre a jour »
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) window.location.reload();
  });

  // Les verifications periodiques tournent hors du rendu React
  window.setInterval(checkInBackground, CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkInBackground();
  });
  checkInBackground();
}

function subscribe(listener: () => void) {
  void start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUpdateState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL_STATE,
  );
}

/** Verification en arriere-plan : une erreur reseau (hors ligne) est ignoree. */
function checkInBackground() {
  verifier().catch(() => {});
}

/**
 * Cherche une nouvelle version. Renvoie true si une mise a jour a ete trouvee
 * (le bandeau s'affiche alors des que la version est prete). Leve une erreur
 * si le serveur est injoignable.
 */
export async function verifier(): Promise<boolean> {
  if (!registration) return false;
  await registration.update();
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return false;
  // En cours d'installation : « updatefound » proposera la version une fois prete.
  // Deja prete : « Plus tard » avait masque le bandeau, on la repropose.
  if (worker === registration.waiting) void offer(worker);
  return true;
}

/** Active la nouvelle version puis recharge la page. */
export function mettreAJour() {
  const worker = registration?.waiting;
  if (!worker) {
    window.location.reload();
    return;
  }
  reloading = true;
  worker.postMessage({ type: "SKIP_WAITING" });
}

/** « Plus tard » : masque le bandeau jusqu'a la prochaine verification. */
export function reporter() {
  setState({ available: false });
}
