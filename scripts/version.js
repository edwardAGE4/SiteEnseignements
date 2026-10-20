#!/usr/bin/env node
// Propage la version de package.json (source de verite unique) :
// - lib/version.ts, lu par l'application (page À propos, menu, bandeau de mise a jour) ;
// - public/sw.js, pour que le service worker change d'octets a chaque version
//   (c'est ce qui declenche l'annonce d'une nouvelle version chez les visiteurs).
// Lance automatiquement par predev, prebuild, prestart et `npm version`.
// Aucune date de build n'est ecrite : le depot Git reste propre entre deux builds.

/* eslint-disable @typescript-eslint/no-require-imports -- script Node (CommonJS), hors de l'application */

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

if (!/^\d+\.\d+\.\d+([-+][\w.-]+)?$/.test(version)) {
  console.error(`[version] version invalide dans package.json : « ${version} »`);
  process.exit(1);
}

function writeIfChanged(file, content) {
  const target = path.join(root, file);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current !== content) {
    fs.writeFileSync(target, content);
    console.log(`[version] ${file} -> ${version}`);
  }
}

// 1. Fichier lu par l'application
writeIfChanged(
  "lib/version.ts",
  `// Fichier généré par scripts/version.js, ne pas modifier.\n` +
    `// Pour changer de version : npm version patch | minor | major\n` +
    `export const APP_VERSION = "${version}";\n`,
);

// 2. Configuration du service worker
const swFile = "public/sw.js";
const sw = fs.readFileSync(path.join(root, swFile), "utf8");
const versionLine = /^const APP_VERSION = ".*";$/m;
if (!versionLine.test(sw)) {
  console.error(`[version] ligne « const APP_VERSION = "..."; » introuvable dans ${swFile}`);
  process.exit(1);
}
writeIfChanged(swFile, sw.replace(versionLine, `const APP_VERSION = "${version}";`));
