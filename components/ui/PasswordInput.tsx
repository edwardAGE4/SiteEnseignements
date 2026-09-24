"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "type">;

/** Champ mot de passe avec un bouton pour afficher / masquer la saisie. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn(className, "pr-12")} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink-500 hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-navy-900"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1 1 0 0 1 0-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18a1 1 0 0 1 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.22A10.48 10.48 0 0 0 2.04 12c1.38 4.17 5.32 7.5 9.96 7.5 1.63 0 3.17-.39 4.53-1.08M6.23 6.23A10.45 10.45 0 0 1 12 4.5c4.64 0 8.57 3.01 9.96 7.18-.51 1.54-1.33 2.94-2.39 4.12M6.23 6.23 3 3m3.23 3.23 3.65 3.65m7.89 7.89L21 21m-3.23-3.23-3.65-3.65m0 0a3 3 0 1 0-4.24-4.24m4.24 4.24L9.88 9.88" />
    </svg>
  );
}
