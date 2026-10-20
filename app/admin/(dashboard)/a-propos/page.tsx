import type { Metadata } from "next";
import { buttonClassName } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/Icons";
import { CheckUpdateButton } from "@/components/admin/CheckUpdateButton";
import { SolutioneLogo } from "@/components/admin/SolutioneLogo";
import { format, t } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { APP_VERSION } from "@/lib/version";

const SOLUTIONE_URL = "https://solutione.com";

export const metadata: Metadata = {
  title: t.about.metaTitle,
  robots: { index: false, follow: false },
};

/**
 * À propos de l'application : identite et version, encart « Réalisé par
 * Solutione ». Protegee comme le reste de l'espace admin (layout + proxy).
 */
export default function AdminAboutPage() {
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6">
      {/* Carte d'identite */}
      <section className="flex flex-col items-center rounded-2xl border border-ink-900/10 bg-ivory-50 p-6 text-center sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- icone statique de l'application */}
        <img src="/icons/icon-192.png" alt={format(t.about.logoAlt)} width={96} height={96} className="h-24 w-24 rounded-2xl" />
        <h1 className="mt-5 font-display text-2xl font-medium text-navy-900">{SITE_NAME}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-700">{t.about.description}</p>
        <span className="mt-4 inline-flex items-center rounded-full border border-ink-900/10 bg-navy-100 px-3 py-1 font-data text-xs font-medium text-navy-900">
          {format(t.about.versionBadge, { version: APP_VERSION })}
        </span>
        <div className="mt-5">
          <CheckUpdateButton />
        </div>
      </section>

      {/* Encadre Solutione */}
      <section className="flex flex-col items-center gap-6 rounded-2xl border border-ink-900/10 bg-ivory-50 p-6 text-center min-[600px]:flex-row min-[600px]:items-center min-[600px]:p-8 min-[600px]:text-left">
        <a
          href={SOLUTIONE_URL}
          target="_blank"
          rel="noopener"
          aria-label={t.about.solutioneLogoLink}
          className="block w-40 shrink-0 min-[600px]:w-44"
        >
          <SolutioneLogo alt={t.about.solutioneLogoAlt} className="w-full" />
        </a>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium text-navy-900">{t.about.solutioneTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{format(t.about.solutioneText)}</p>
          <a
            href={SOLUTIONE_URL}
            target="_blank"
            rel="noopener"
            className={buttonClassName({ size: "sm", className: "mt-5 w-full min-[600px]:w-auto" })}
          >
            {t.about.solutioneButton}
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">{t.about.newTab}</span>
          </a>
        </div>
      </section>

      <p className="text-center font-data text-xs text-ink-500">
        {format(t.about.footer, { year })}{" "}
        <a href={SOLUTIONE_URL} target="_blank" rel="noopener" className="font-medium text-navy-900 underline-offset-4 hover:underline">
          Solutione
          <span className="sr-only"> {t.about.newTab}</span>
        </a>
      </p>
    </div>
  );
}
