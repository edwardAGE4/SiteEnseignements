import { Container } from "@/components/ui/Container";

/** Etat de chargement des pages publiques (bibliotheques, recherche, fiches). */
export default function Loading() {
  return (
    <Container className="py-14" >
      <div role="status" aria-live="polite" className="animate-pulse space-y-10">
        <span className="sr-only">Chargement en cours…</span>
        <div className="space-y-4">
          <div className="h-3 w-24 rounded-full bg-navy-900/10" />
          <div className="h-10 w-2/3 max-w-xl rounded-2xl bg-navy-900/10" />
          <div className="h-4 w-1/2 max-w-md rounded-full bg-navy-900/[0.07]" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-4 rounded-3xl bg-white p-3 ring-1 ring-navy-900/[0.05]">
              <div className="aspect-video rounded-[1.1rem] bg-navy-900/[0.07]" />
              <div className="space-y-2 px-3 pb-3">
                <div className="h-5 w-3/4 rounded-full bg-navy-900/10" />
                <div className="h-3 w-full rounded-full bg-navy-900/[0.07]" />
                <div className="h-3 w-2/3 rounded-full bg-navy-900/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
