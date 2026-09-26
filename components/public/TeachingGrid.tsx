import { TeachingCard } from "@/components/public/TeachingCard";
import { EmptyState } from "@/components/ui/EmptyState";

type TeachingCardData = Parameters<typeof TeachingCard>[0]["teaching"];

export function TeachingGrid({ teachings }: { teachings: TeachingCardData[] }) {
  if (teachings.length === 0) {
    return (
      <EmptyState
        title="Aucun enseignement trouvé"
        description="Essayez d'ajuster votre recherche ou vos filtres."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {teachings.map((teaching) => (
        <TeachingCard key={teaching.slug} teaching={teaching} />
      ))}
    </div>
  );
}
