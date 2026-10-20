"use client";

import { useSyncExternalStore } from "react";

/**
 * Service d'installation de l'application (PWA), partage par la popup
 * (InstallPrompt) et les boutons « Installer l'application ».
 * - Chrome / Edge / Samsung Internet : garde l'evenement `beforeinstallprompt`
 *   pour ouvrir la fenetre native au bon moment (utilisable une seule fois).
 * - iPhone / iPad : aucune API, la popup affiche la marche a suivre.
 * - Jamais propose si l'application est deja installee ; « Plus tard » ou
 *   « J'ai compris » : pas de nouvelle proposition automatique pendant 7 jours.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};


/** Navigateur, pour adapter les explications de la popup. */
export type InstallPlatform = "ios-safari" | "ios-other" | "ios-inapp" | "other";

export type InstallState = {
  /** Ouverte en tant qu'application installee (ou installee pendant la visite). */
  installed: boolean;
  /** Une fenetre d'installation native est disponible (Chrome, Edge...). */
  canPrompt: boolean;
  platform: InstallPlatform;
  popupOpen: boolean;
};

const SNOOZE_KEY = "pwa-install-snoozed-at";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const IOS_DELAY_MS = 2500;

// Etat au rendu serveur : bouton masque (« installe ») tant que le navigateur n'a pas repondu.
const SERVER_STATE: InstallState = { installed: true, canPrompt: false, platform: "other", popupOpen: false };

// Garde la proposition d'installation si Chrome / Edge l'emet avant le montage
// des composants (ecoute posee des le chargement du module, sans script en
// ligne : compatible avec la CSP stricte de l'administration).
let earlyPrompt: InstallPromptEvent | null = null;
function keepEarlyPrompt(event: Event) {
  event.preventDefault();
  earlyPrompt = event as InstallPromptEvent;
}
if (typeof window !== "undefined") window.addEventListener("beforeinstallprompt", keepEarlyPrompt);

let state: InstallState = SERVER_STATE;
let deferredPrompt: InstallPromptEvent | null = null;
let started = false;
const listeners = new Set<() => void>();

function setState(patch: Partial<InstallState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIos) return "other";
  if (/FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|LinkedInApp|GSA\//.test(ua)) return "ios-inapp";
  if (/CriOS|EdgiOS|FxiOS|OPiOS/.test(ua)) return "ios-other";
  if (!/Safari/.test(ua)) return "ios-inapp";
  return "ios-safari";
}

function isSnoozed() {
  try {
    const at = Number(localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false; // stockage indisponible (navigation privee) : on ne bloque pas
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  } catch {
    // stockage indisponible : la popup pourra reapparaitre a la prochaine visite
  }
}

function markInstalled() {
  deferredPrompt = null;
  setState({ installed: true, canPrompt: false, popupOpen: false });
}

function capturePrompt(event: InstallPromptEvent) {
  deferredPrompt = event;
  setState({ canPrompt: true });
  if (!state.installed && !isSnoozed()) setState({ popupOpen: true });
}

/** Branche les ecouteurs (une seule fois, cote navigateur). */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  state = { installed: isStandalone(), canPrompt: false, platform: detectPlatform(), popupOpen: false };

  window.removeEventListener("beforeinstallprompt", keepEarlyPrompt);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    capturePrompt(event as InstallPromptEvent);
  });
  window.addEventListener("appinstalled", markInstalled);
  window.matchMedia("(display-mode: standalone)").addEventListener("change", (event) => {
    if (event.matches) markInstalled();
  });

  if (state.installed) return;

  // Evenement survenu avant le montage des composants
  if (earlyPrompt) {
    const early = earlyPrompt;
    earlyPrompt = null;
    capturePrompt(early);
  }

  // iOS : aucun evenement, on propose les explications apres quelques secondes
  if (state.platform !== "other" && !isSnoozed()) {
    window.setTimeout(() => {
      if (!state.installed && !isSnoozed()) setState({ popupOpen: true });
    }, IOS_DELAY_MS);
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

/** Bouton « Installer l'application » : fenetre native si possible, sinon la popup d'explications. */
export async function requestInstall() {
  if (deferredPrompt) {
    await promptInstall();
  } else {
    setState({ popupOpen: true });
  }
}

/** Ouvre la fenetre native ; un refus vaut « Plus tard ». */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return;
  // l'evenement ne sert qu'une fois
  deferredPrompt = null;
  setState({ canPrompt: false, popupOpen: false });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") markInstalled();
    else snooze();
  } catch {
    snooze();
  }
}

/** « Plus tard » ou « J'ai compris » : ne pas reproposer pendant 7 jours. */
export function postponeInstall() {
  snooze();
  setState({ popupOpen: false });
}
