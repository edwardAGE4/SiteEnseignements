import { startTransition, type FormEvent } from "react";

/**
 * Soumet un formulaire vers une action sans passer par `<form action>`.
 * React reinitialise automatiquement les champs d'un `<form action>` apres
 * chaque envoi, ce qui vide la saisie meme en cas d'erreur de validation.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
