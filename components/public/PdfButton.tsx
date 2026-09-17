import { Button } from "@/components/ui/Button";

export function PdfButton({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/10 bg-ivory-50 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-lg font-semibold text-navy-900">Document PDF</p>
        <p className="text-sm text-ink-500">Retrouvez cet enseignement au format ecrit.</p>
      </div>
      <Button href={`/api/enseignements/${slug}/telecharger`} variant="primary">
        Telecharger le PDF
      </Button>
    </div>
  );
}
