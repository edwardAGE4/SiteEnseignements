import { startTransition, type FormEvent } from "react";

/**
 * Soumet un formulaire vers une action sans passer par `<form action>`.
 * React reinitialise automatiquement les champs d'un `<form action>` apres
 * chaque envoi, ce qui vide la saisie meme en cas d'erreur de validation.
 * Le bouton utilise (name/value, ex. intent=draft) est inclus dans l'envoi.
 * `beforeSubmit` peut annuler l'envoi (validation cote navigateur).
 */
export function submitWithoutReset(
  action: (formData: FormData) => void,
  beforeSubmit?: (formData: FormData) => boolean,
) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    if (beforeSubmit && !beforeSubmit(formData)) return;
    startTransition(() => action(formData));
  };
}
