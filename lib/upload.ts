/**
 * Envoie un fichier vers une route d'upload en suivant la progression
 * (fetch ne permet pas de connaitre l'avancement d'un envoi).
 */
export function uploadWithProgress<T>(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: (T & { error?: string }) | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // reponse non JSON (erreur serveur)
      }
      if (xhr.status >= 200 && xhr.status < 300 && data) resolve(data);
      else reject(new Error(data?.error ?? `Echec de l'envoi (erreur ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Connexion au serveur impossible pendant l'envoi."));

    xhr.open("POST", url);
    xhr.send(formData);
  });
}
