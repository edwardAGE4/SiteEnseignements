"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

/** Destination apres connexion : uniquement une page de l'administration (pas de redirection vers un autre site). */
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  const url = typeof value === "string" ? value : "";
  return /^\/admin(\/[\w\-/]*)?$/.test(url) ? url : "/admin";
}

export async function authenticate(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "E-mail ou mot de passe incorrect." };
      }
      return { error: "Une erreur est survenue. Veuillez réessayer." };
    }
    throw error;
  }
}
