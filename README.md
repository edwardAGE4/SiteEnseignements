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

## Documentation

Voir [`docs/GUIDE-ADMINISTRATEUR.md`](./docs/GUIDE-ADMINISTRATEUR.md).

## Contenu à compléter avant mise en production

- Textes de la page À propos et photo (Admin > Paramètres).
- Présentation courte et réseaux sociaux (Admin > Paramètres).
- Mentions légales et politique de confidentialité définitives.
