/** Reseaux sociaux administrables (Admin > Parametres). Aucun lien n'est affiche s'il n'est pas renseigne. */
export const SOCIAL_NETWORKS = [
  { key: "socialFacebook", label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { key: "socialInstagram", label: "Instagram", hosts: ["instagram.com"] },
  { key: "socialYoutube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { key: "socialSpotify", label: "Spotify", hosts: ["spotify.com"] },
  { key: "socialTiktok", label: "TikTok", hosts: ["tiktok.com"] },
  { key: "socialX", label: "X (Twitter)", hosts: ["x.com", "twitter.com"] },
  { key: "socialLinkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
] as const;

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]["key"];
