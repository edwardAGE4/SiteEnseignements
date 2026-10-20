import { SITE_NAME } from "@/lib/site";

/**
 * Textes de l'application (installation, mises a jour, page « À propos »).
 * Le site est en francais uniquement : pour ajouter une langue, dupliquer
 * l'objet `fr` avec la meme structure et choisir le dictionnaire dans `messages`.
 * Les variables s'ecrivent {nom} et sont remplacees par `format()`.
 */
const fr = {
  about: {
    navLabel: "À propos",
    metaTitle: "À propos de l'application",
    logoAlt: "Logo de {app}",
    description:
      "L'espace média de Jean-Marc GNALI : des ressources gratuites en audio, vidéo, livres et fichiers pratiques, administrées depuis cet espace.",
    versionBadge: "Version {version}",
    checkUpdate: "Rechercher une mise à jour",
    checking: "Recherche en cours…",
    upToDate: "Vous utilisez la dernière version.",
    updateFound: "Une nouvelle version a été trouvée : elle vous sera proposée dans quelques secondes.",
    checkFailed: "La vérification a échoué. Vérifiez votre connexion puis réessayez.",
    solutioneLogoAlt: "Solutione, création d'applications",
    solutioneLogoLink: "Site de Solutione (nouvel onglet)",
    solutioneTitle: "Vous avez un projet d'application ?",
    solutioneText:
      "Ce site a été conçu et développé par Solutione. Vous souhaitez que nous développions une application pour votre structure, votre association ou votre entreprise ? Rendez-vous sur notre site.",
    solutioneButton: "Découvrir Solutione",
    newTab: "(nouvel onglet)",
    footer: "© {year} {app} · Réalisé par",
  },
  install: {
    button: "Installer l'application",
    title: "Installer {app}",
    intro: "Ajoutez {app} à votre écran d'accueil pour l'ouvrir comme une application, en un geste.",
    later: "Plus tard",
    install: "Installer",
    understood: "J'ai compris",
    close: "Fermer",
    iosSafariSteps: [
      "Touchez le bouton Partager {share} en bas de l'écran",
      "Choisissez « Sur l'écran d'accueil »",
      "Touchez « Ajouter »",
    ],
    iosOtherSteps: [
      "Touchez le bouton Partager {share} en haut à droite, près de l'adresse",
      "Choisissez « Sur l'écran d'accueil »",
      "Touchez « Ajouter »",
    ],
    iosInApp:
      "Pour installer {app}, ouvrez cette page dans Safari : touchez ⋯ ou le bouton de partage, puis « Ouvrir dans Safari ».",
    otherBrowser:
      "Ouvrez le menu de votre navigateur (⋮ ou ⋯), puis choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
  },
  update: {
    available: "La version {next} de {app} est disponible (vous utilisez la {current}).",
    availableUnknown: "Une nouvelle version de {app} est disponible (vous utilisez la {current}).",
    later: "Plus tard",
    update: "Mettre à jour",
  },
};

export type Messages = typeof fr;

const messages: Record<string, Messages> = { fr };

/** Langue du site (voir <html lang> dans app/layout.tsx). */
export const t: Messages = messages.fr;

/** Remplace les variables {nom} ; {app} vaut par defaut le nom du site. */
export function format(template: string, vars: Record<string, string | number> = {}) {
  const values: Record<string, string | number> = { app: SITE_NAME, ...vars };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
