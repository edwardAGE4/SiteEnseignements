# Espace média de Jean-Marc GNALI

Site éditorial pour découvrir gratuitement des ressources multiformats —
**audios, vidéos, livres et fichiers pratiques** — avec un back-office complet
pour les gérer sans toucher au code.

## Stack technique

- **Framework** : Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Style** : Tailwind CSS v4 (thème CSS-first), polices Fraunces (titres) et Manrope (texte)
- **Base de données** : PostgreSQL + Prisma 7 (client généré avec `@prisma/adapter-pg`)
- **Authentification** : Auth.js (NextAuth v5), Credentials + sessions JWT, rôles ADMIN / EDITOR
- **Stockage des fichiers** : Vercel Blob (principal), S3 / Supabase (secours), dossier local en développement

## Rubriques publiques

| URL                              | Contenu                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `/`                              | Accueil : présentation, 4 familles de ressources, nouveautés |
| `/a-propos`                      | Présentation de Jean-Marc GNALI (administrable)          |
| `/audios`, `/audios/[slug]`      | Bibliothèque audio, lecteur HTML5 et/ou Spotify          |
| `/videos`, `/videos/[slug]`      | Bibliothèque vidéo, lecteur YouTube / Vimeo              |
| `/livres`, `/livres/[slug]`      | Livres et publications                                   |
| `/fichiers-pratiques`, `/[slug]` | Documents consultables / téléchargeables                 |
| `/recherche`                     | Recherche transversale (titre, description, mot-clé, catégorie, format) |
| `/categories`, `/categories/[slug]` | Parcours par thématique                               |

Les anciennes URL sont conservées : `/enseignements` redirige vers
`/recherche` et `/enseignements/[slug]` vers la fiche de la ressource dans sa
rubrique (redirections permanentes).

## Modèle de données

Le modèle historique `Teaching` (table `teachings`) est devenu le modèle
unifié des ressources, sans perte de données :

- `type` : `AUDIO`, `VIDEO`, `BOOK`, `FILE` (déduit des médias existants lors de la migration) ;
- champs communs : titre, slug, description courte/longue, image, catégories, mots-clés,
  statut (`DRAFT`, `PUBLISHED`, `ARCHIVED`), mise en avant, date de publication, SEO ;
- audio : `audioUrl`, `spotifyUrl`, durée, série ; vidéo : `videoUrl` (YouTube/Vimeo, colonne
  historique `youtubeUrl`) ; livre : sous-titre, auteur, ISBN, formats, liens de lecture/achat ;
- fichiers joints (`teaching_documents`) avec type MIME et taille, politique de téléchargement.

Migration : `prisma/migrations/20261013120000_media_resources` (ajouts uniquement).

## Démarrage rapide

```bash
npm install
cp .env.example .env          # renseignez DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
docker compose up -d          # PostgreSQL local (optionnel)
npm run db:migrate            # applique le schéma
ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run db:create-admin   # crée un administrateur
npm run dev
```

Données de démonstration (développement uniquement, refusé en production) :

```bash
SEED_DEMO_PASSWORD="un-mot-de-passe-long" npm run db:seed
```

Site public : <http://localhost:3000> — back-office : <http://localhost:3000/admin/connexion>.

## Scripts

| Commande                  | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Serveur de développement                        |
| `npm run build`           | Build de production (génère le client Prisma)   |
| `npm run vercel-build`    | Build Vercel : génération + `migrate deploy` + build |
| `npm run lint`            | ESLint                                          |
| `npm run db:migrate`      | Migrations Prisma en développement              |
| `npm run db:deploy`       | Migrations Prisma en production                 |
| `npm run db:seed`         | Données de démonstration (dev uniquement)       |

## Stockage des fichiers

Types acceptés (contrôle de l'extension, du type MIME, de la taille et de la
signature binaire réelle) :

| Type     | Formats                                              | Taille max |
| -------- | ---------------------------------------------------- | ---------- |
| Images   | JPEG, PNG, WebP                                      | 8 Mo       |
| Audios   | MP3, M4A, AAC, OGG, WAV                              | 200 Mo     |
| Fichiers | PDF, DOCX, XLSX, PPTX, ODT, ODS, ODP, EPUB, TXT, CSV | 50 Mo      |

En production, les fichiers partent directement du navigateur vers Vercel
Blob (le store doit être **public**), avec bascule automatique sur S3 si le
store est plein. Les fichiers des ressources en brouillon ou archivées ne sont
jamais servis par la route `/api/enseignements/[slug]/telecharger`.

## Sécurité

- **En-têtes HTTP** (`next.config.ts`) : HSTS, CSP, `X-Frame-Options: DENY`,
  `nosniff`, COOP, Permissions-Policy restrictive, pas de `X-Powered-By`.
- **Content-Security-Policy** (`lib/security/csp.ts`) : site public avec une
  liste blanche stricte (aucun script externe, ni `eval`) ; administration avec
  un nonce par requête et `strict-dynamic` (`proxy.ts`). Un nouveau service
  externe (lecteur, stockage…) doit y être ajouté, sinon le navigateur le bloque.
- **Connexion** (`lib/auth.ts`) : compte verrouillé 15 min après 5 échecs,
  limite par adresse IP, réponse identique que le compte existe ou non,
  session de 8 h, compte revérifié en base chaque minute. Changer le mot de
  passe, le rôle ou désactiver un compte ferme ses sessions ouvertes.
- **Mots de passe** : 12 caractères minimum.
- **Routes publiques qui écrivent** (j'aime, vues) : refusées si appelées depuis un autre site.
- **Dépendances** : `npm audit --omit=dev` doit rester à 0 ; mettre `next` à
  jour dès qu'un correctif de sécurité est publié.

## Application installable et versions

Le site s'installe sur l'écran d'accueil (manifeste `app/manifest.ts`,
service worker `public/sw.js`, actif en production uniquement). Une popup
propose l'installation (Chrome / Edge / Samsung Internet : fenêtre native ;
iPhone / iPad : marche à suivre), ainsi que le bouton « Installer
l'application » de l'en-tête admin et de l'accueil mobile.

La version vient **uniquement** du champ `version` de `package.json`.
`scripts/version.js` la recopie dans `lib/version.ts` (fichier généré) et dans
`public/sw.js` ; il est lancé automatiquement avant `dev`, `build`,
`vercel-build` et `start`. Elle s'affiche dans le menu admin et sur la page
`/admin/a-propos`.

### Publier une nouvelle version

```bash
npm version patch   # correction
npm version minor   # nouvelle fonctionnalité
npm version major   # changement important
git push --follow-tags   # puis déployer (Vercel déploie au push)
```

`npm version` met à jour `package.json`, `lib/version.ts` et `public/sw.js`,
puis crée le commit et le tag (l'arbre Git doit être propre avant).

Les utilisateurs voient le bandeau « La version X est disponible » à leur
prochaine visite, ou au plus tard 30 minutes après. La page n'est rechargée
que s'ils cliquent sur « Mettre à jour ». Un déploiement **sans** changement de
version n'est pas annoncé (le contenu reste à jour : les pages ne sont jamais
servies depuis le cache).

## Documentation

Voir [`docs/GUIDE-ADMINISTRATEUR.md`](./docs/GUIDE-ADMINISTRATEUR.md).

## Contenu à compléter avant mise en production

- Textes de la page À propos et photo (Admin > Paramètres).
- Présentation courte et réseaux sociaux (Admin > Paramètres).
- Mentions légales et politique de confidentialité définitives.
