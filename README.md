# Plateforme des enseignements du Pasteur Jean-Marc GNALI

Plateforme editoriale premium pour decouvrir, rechercher et consulter les
enseignements du Pasteur Jean-Marc GNALI (video YouTube, audio Spotify,
documents PDF), avec un back-office complet pour gerer le contenu.

## Stack technique

- **Framework** : Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Style** : Tailwind CSS v4 (theme CSS-first), polices Nunito / Poppins / Quicksand / Manrope
- **Base de donnees** : PostgreSQL + Prisma 7 (client genere avec l'adaptateur `@prisma/adapter-pg`)
- **Authentification** : Auth.js (NextAuth v5), Credentials + sessions JWT, roles ADMIN/EDITOR
- **Stockage fichiers** : abstraction S3-compatible (AWS S3, Supabase Storage, ...), fallback local en developpement

## Demarrage rapide

### 1. Pre-requis

- Node.js 20.9+
- Une base PostgreSQL accessible

### 2. Installation

```bash
npm install
cp .env.example .env
# Renseignez DATABASE_URL, AUTH_SECRET (openssl rand -base64 32), etc.
```

### 3. Base de donnees

```bash
npm run db:migrate   # applique le schema Prisma
npm run db:seed      # cree des donnees de demonstration (comptes, categories, enseignements)
```

Comptes de demonstration crees par le seed :

| Role  | E-mail              | Mot de passe   |
| ----- | -------------------- | -------------- |
| ADMIN | admin@demo.local      | ChangeMoi123!  |
| EDITOR| editeur@demo.local    | ChangeMoi123!  |

**Ces comptes et ce contenu sont fictifs.** Changez les mots de passe et
remplacez le contenu de demonstration avant toute mise en production.

### 4. Lancer le serveur de developpement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour le site public et
[http://localhost:3000/admin/connexion](http://localhost:3000/admin/connexion)
pour le back-office.

## Scripts disponibles

| Commande             | Description                                   |
| --------------------- | ---------------------------------------------- |
| `npm run dev`          | Serveur de developpement                       |
| `npm run build`        | Build de production (genere le client Prisma) |
| `npm run start`        | Lance le build de production                  |
| `npm run lint`         | Verification ESLint                            |
| `npm run db:migrate`   | Applique les migrations Prisma en developpement |
| `npm run db:deploy`    | Applique les migrations Prisma en production   |
| `npm run db:seed`      | Charge les donnees de demonstration            |
| `npm run db:studio`    | Ouvre Prisma Studio                            |

## Structure du projet

```text
app/
  (public)/          Pages publiques (accueil, enseignements, categories, a-propos)
  admin/
    connexion/        Page de connexion (hors garde d'authentification)
    (dashboard)/       Back-office protege (tableau de bord, CRUD)
  api/                 Routes API (auth, uploads, vues, telechargements)
components/
  ui/                  Composants generiques reutilisables
  public/              Composants du site public
  admin/               Composants du back-office
lib/                   Acces donnees, validations, stockage, auth, utilitaires
prisma/                Schema, migrations, seed
docs/                  Documentation administrateur
```

## Stockage des fichiers

Par defaut (`STORAGE_PROVIDER=s3`), les images et PDF sont envoyes vers un
bucket compatible S3 (AWS S3, Supabase Storage, etc.) via les variables
`S3_*`. En developpement sans identifiants cloud, `STORAGE_PROVIDER=local`
ecrit les fichiers dans `public/uploads/` (a ne jamais utiliser en
production, ce dossier n'est pas suivi par git).

## Documentation

Voir [`docs/GUIDE-ADMINISTRATEUR.md`](./docs/GUIDE-ADMINISTRATEUR.md) pour
le guide d'utilisation du back-office destine a un administrateur non
technique.

## Contenu a completer avant mise en production

- Photographies authentiques du Pasteur Jean-Marc GNALI (le site utilise
  actuellement des emplacements reserves clairement identifies).
- Texte biographique de la page `/a-propos`.
- Mentions legales et politique de confidentialite definitives.
- Identifiants de stockage cloud (S3) et base de donnees de production.
