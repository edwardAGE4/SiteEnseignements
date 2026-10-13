"use client";

import { useEffect } from "react";

/**
 * Anime les sections [data-reveal] quand elles entrent dans l'ecran en descendant.
 * Une section repassee "par le haut" (on remonte au-dessus) est reinitialisee pour rejouer
 * l'effet a la prochaine descente. Sans JS, rien n'est masque (html[data-anim] absent).
 */
export function RevealOnScroll() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    // deja visibles au chargement : affichees tout de suite, sans clignotement
    for (const section of sections) {
      if (section.getBoundingClientRect().top < window.innerHeight) section.dataset.shown = "";
    }
    document.documentElement.dataset.anim = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = entry.target as HTMLElement;
          if (entry.isIntersecting) section.dataset.shown = "";
          else if (entry.boundingClientRect.top > 0) delete section.dataset.shown;
        }
      },
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.anim;
    };
  }, []);

  return null;
}
