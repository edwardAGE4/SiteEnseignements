import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "warning";

const VARIANTS: Record<AlertVariant, { box: string; icon: string; symbol: string }> = {
  success: { box: "border-emerald-600 bg-emerald-50 text-emerald-800", icon: "bg-emerald-600", symbol: "✓" },
  error: { box: "border-red-600 bg-red-50 text-red-800", icon: "bg-red-600", symbol: "!" },
  warning: { box: "border-orange-500 bg-orange-50 text-orange-800", icon: "bg-orange-500", symbol: "!" },
};

/** Message encadre : vert (succes), rouge (erreur), orange (avertissement). */
export function Alert({
  variant,
  children,
  className,
}: {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const style = VARIANTS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm", style.box, className)}
    >
      <span
        aria-hidden
        className={cn("mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", style.icon)}
      >
        {style.symbol}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export type FormFeedback = { error?: string; success?: string; warnings?: string[] } | undefined;

/** Affiche les messages de retour d'une action de formulaire. */
export function FormAlerts({ state }: { state: FormFeedback }) {
  if (!state) return null;

  return (
    <div className="space-y-2">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}
      {state.warnings?.map((warning) => (
        <Alert key={warning} variant="warning">
          {warning}
        </Alert>
      ))}
    </div>
  );
}
