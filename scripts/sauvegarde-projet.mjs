#!/usr/bin/env node
// SAUVEGARDE DU PROJET — le coffre et la notice
// ==============================================
// POURQUOI (2026-09-24, demande explicite de l'utilisateur, calibrée en fenêtres). Sa formulation :
// « si demain il y a un quelconque gros bug, ou que je n'ai plus du tout accès à toi ou à git, je
// veux avoir une copie qui me permette de continuer comme si rien ne s'était passé ». Ce n'est pas
// redondant avec le dépôt distant : une copie chez lui survit à un compte fermé, un dépôt purgé ou
// une branche écrasée.
//
// DEUX LIVRABLES, DEUX MÉTIERS OPPOSÉS, et les confondre était mon erreur de départ :
//   · LE COFFRE (.zip) — exhaustif et JAMAIS LU. Tout le dépôt suivi par git, arborescence intacte,
//     restaurable tel quel. Mesuré à 6,1 Mo : trop léger pour valoir un tri, et trier ferait courir
//     le risque d'écarter la mauvaise chose.
//   · LA NOTICE (.txt) — CHOISIE et lue. Une édition aplatie calibrée pour qu'une IA l'avale d'un
//     coup ET garde de la place pour travailler. Le dépôt entier aplati pèse ~4 millions de tokens,
//     soit une vingtaine de fois trop : une notice qui sature la mémoire de son lecteur ne sert à
//     rien, c'est exactement le piège à éviter.
//
// L'HISTORISATION NE DEMANDE RIEN DE PLUS, et c'est le point qui a levé son inquiétude sur les
// gigaoctets : le suivi des tâches, les simulations archivées et les registres des outils SONT des
// fichiers du dépôt. Le coffre d'aujourd'hui contient donc toute l'histoire jusqu'à aujourd'hui.
// Écraser ne perd rien — ce n'est pas une photo qui remplace une photo, c'est un livre qui remplace
// le même livre avec des chapitres en plus. On garde quand même les 3 derniers de chaque, parce
// qu'une sauvegarde unique et corrompue ne laisse rien derrière elle.
//
// GÉNÉRIQUE : rien ici ne connaît ce projet. Tout se dérive de git et du dossier réel.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { recordCliUsage } from "./tool-usage.mjs";

export const OUTIL = "sauvegarde-projet";
export const SCRIPT_PATH = "scripts/sauvegarde-projet.mjs";
export const DOSSIER = "docs/sauvegardes";
export const REGISTRE = join(DOSSIER, "index.md");
export const COPIES_GARDEES = 3;
// ~150 000 mots, le calibrage qu'il a choisi : assez pour tout comprendre, assez peu pour qu'une IA
// puisse encore travailler après l'avoir lu. Compté en caractères parce que c'est ce qu'on mesure
// sans ambiguïté ; le rapport de mots au caractère est stable en français comme en code.
export const CIBLE_CARACTERES = 1_000_000;

// L'ordre EST la décision : ce qui vient en premier est ce qu'une IA doit lire en premier pour
// reprendre le projet, et c'est aussi ce qui survit si la cible est atteinte avant la fin.
export const ORDRE_DE_LECTURE = [
  { motif: /^CLAUDE\.md$/, pourquoi: "LA CHARTE — la loi du projet. Elle prime sur tout le reste, y compris sur ce que le code fait." },
  { motif: /^docs\/carnet-de-bord\.md$/, pourquoi: "où en était le travail à l'instant de la sauvegarde" },
  { motif: /^docs\/referentiel\/(principes|parametres)\.md$/, pourquoi: "les deux sources de vérité : ce que le moteur FAIT, et avec quels chiffres" },
  { motif: /^lib\/(?!reference-history)/, pourquoi: "le moteur du jeu — perception, dialogue, drame, jauges, mémoire, histoire" },
  { motif: /^app\//, pourquoi: "les pages et l'orchestration des appels au modèle" },
  { motif: /^components\//, pourquoi: "le rendu 3D et l'interface" },
  { motif: /^docs\/regles-de-travail\.md$/, pourquoi: "la méthode de collaboration, distincte du contenu du jeu" },
  { motif: /^docs\/referentiel\/.+\.md$/, pourquoi: "le reste du référentiel" },
  { motif: /^(package\.json|tsconfig\.json|wrangler\.|drizzle\.)/, pourquoi: "de quoi reconstruire l'environnement" },
];

// CE QUI MANQUE SE DÉCLARE, toujours. Une notice tronquée en silence se lit exactement comme une
// notice complète, et son lecteur conclurait que le projet ne contient que ça — c'est le défaut que
// tout ce projet traque, appliqué à sa propre sauvegarde.
export function cequiManque(fichiers, retenus) {
  const dedans = new Set(retenus.map((r) => r.chemin));
  const absents = fichiers.filter((f) => !dedans.has(f));
  const parDossier = new Map();
  for (const f of absents) {
    const d = f.includes("/") ? f.slice(0, f.indexOf("/", f.indexOf("/") + 1) + 1 || f.indexOf("/") + 1) : "(racine)";
    parDossier.set(d, (parDossier.get(d) ?? 0) + 1);
  }
  return { total: absents.length, parDossier: [...parDossier].sort((a, b) => b[1] - a[1]) };
}


export function fichiersSuivis({ shImpl = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }) } = {}) {
  return shImpl("git ls-files").split("\n").filter(Boolean);
}

// Le classement est DÉRIVÉ de l'ordre de lecture, jamais une seconde liste de fichiers recopiée à
// la main qui divergerait au premier fichier ajouté (Article 24).
export function choisirPourLaNotice(fichiers, { cible = CIBLE_CARACTERES, tailleDe } = {}) {
  const retenus = [];
  let total = 0;
  let coupeA = null;
  for (const regle of ORDRE_DE_LECTURE) {
    for (const f of fichiers.filter((x) => regle.motif.test(x)).sort()) {
      if (retenus.some((r) => r.chemin === f)) continue;
      const taille = tailleDe(f);
      if (total + taille > cible) { coupeA ??= f; continue; }
      retenus.push({ chemin: f, taille, pourquoi: regle.pourquoi });
      total += taille;
    }
  }
  return { retenus, total, coupeA,
    // Déclarer la coupe plutôt que la taire : une notice tronquée en silence se lit exactement
    // comme une notice complète, et son lecteur conclurait que le projet ne contient que ça.
    pourquoi: coupeA
      ? `la cible de ${cible.toLocaleString("fr-FR")} caractères a été atteinte : la notice s'arrête avant « ${coupeA} ». Tout le reste est dans le coffre.`
      : `tout ce qui devait être lu tient dans la cible — rien n'a été coupé.` };
}

export function enTeteDeLaNotice({ date, commit, nbFichiersCoffre, nbFichiersNotice, pourquoiCoupe }) {
  return [
    "NOTICE DU PROJET — l'édition à donner à une IA pour qu'elle reprenne le travail",
    "=".repeat(78), "",
    `Produite le ${date}, sur l'état ${commit}.`, "",
    "CE QUE TU TIENS, ET CE QUE TU NE TIENS PAS",
    "-".repeat(42),
    `Ce fichier contient ${nbFichiersNotice} fichiers choisis, dans l'ordre où il faut les lire.`,
    `Le coffre (.zip) qui l'accompagne contient les ${nbFichiersCoffre} fichiers du projet, lui.`,
    "",
    "Les deux n'ont pas le même métier. Le COFFRE restaure : on le dézippe et le projet est là,",
    "entier, avec son historique de tâches, ses simulations archivées et ses registres. La NOTICE",
    "se LIT : elle est calibrée pour tenir dans la mémoire d'une IA et lui laisser de la place pour",
    "travailler ensuite. Une notice qui contiendrait tout saturerait son lecteur et ne servirait à",
    "rien.", "",
    `POURQUOI ELLE S'ARRÊTE OÙ ELLE S'ARRÊTE : ${pourquoiCoupe}`, "",
    "PAR OÙ COMMENCER, SI TU ES UNE IA QUI REPREND CE PROJET",
    "-".repeat(54),
    "1. Lis CLAUDE.md en entier. C'est la loi, et elle prime sur tout le reste de ce fichier.",
    "2. Lis docs/regles-de-travail.md : la méthode de collaboration, distincte du contenu.",
    "3. Lis docs/carnet-de-bord.md : où en était le travail au moment de cette sauvegarde.",
    "4. Le référentiel dit ce que le code FAIT ; le code dit comment. En cas de désaccord entre",
    "   les deux, c'est un bug à corriger, jamais un détail à ignorer.",
    "5. Ce qui n'est pas ici est dans le coffre. Rien n'a été perdu, seulement écarté de la lecture.",
    "", "=".repeat(78), "",
  ].join("\n");
}

export function construireNotice({ choix, lireFichier, date, commit, nbFichiersCoffre, manque = null }) {
  const parties = [enTeteDeLaNotice({ date, commit, nbFichiersCoffre,
    nbFichiersNotice: choix.retenus.length, pourquoiCoupe: choix.pourquoi })];
  parties.push("SOMMAIRE", "-".repeat(8));
  for (const r of choix.retenus) parties.push(`  ${r.chemin}`);
  parties.push("", "=".repeat(78), "");
  for (const r of choix.retenus) {
    parties.push("", "─".repeat(78), `FICHIER : ${r.chemin}`, `POURQUOI IL EST ICI : ${r.pourquoi}`, "─".repeat(78), "");
    parties.push(lireFichier(r.chemin));
  }
  if (manque) {
    parties.push("", "=".repeat(78), "", "CE QUI N'EST PAS DANS CETTE NOTICE", "-".repeat(34),
      `${manque.total} fichier(s) du projet ne sont pas reproduits ici. Ils sont TOUS dans le coffre (.zip)`,
      "qui accompagne cette notice — rien n'est perdu, seulement écarté de la lecture pour que ce",
      "fichier reste dans une taille qu'une IA peut avaler sans saturer.", "",
      "Répartition de ce qui manque :");
    for (const [dossier, n] of manque.parDossier) parties.push(`  ${String(n).padStart(4)} fichier(s)  ${dossier}`);
    parties.push("", "Si une question porte sur l'un d'eux, ouvre le coffre : il contient le dépôt entier,",
      "avec son historique de tâches, ses simulations archivées et les registres de tous les outils.");
  }
  return parties.join("\n");
}

// Garder les N derniers, jamais tous : le coffre le plus récent contient déjà ce que les anciens
// contenaient. Les deux précédents ne servent qu'au cas où le plus récent serait lui-même abîmé.
export function aSupprimer(fichiers, { garder = COPIES_GARDEES } = {}) {
  return [...fichiers].sort().reverse().slice(garder);
}

export function ligneDeRegistre({ date, commit, nbCoffre, tailleCoffre, nbNotice, tailleNotice }) {
  const mo = (o) => `${(o / 1_048_576).toFixed(1)} Mo`;
  return `| ${date} | ${commit} | ${nbCoffre} fichiers, ${mo(tailleCoffre)} | ${nbNotice} fichiers, ${mo(tailleNotice)} |`;
}

function main() {
  // LE PASSAGE S'ENREGISTRE (2026-09-26). Trouvé par un chemin détourné et c'est ce qui le rend
  // intéressant : cet outil venait de rejoindre le catalogue des prestations, donc le compteur
  // d'usage s'est mis à le regarder — et le verrou d'ouverture de Ronde a immédiatement refusé,
  // parce qu'il a une ligne de commande et n'enregistrait rien. Son zéro d'usage ne disait pas
  // « personne ne sauvegarde », il disait « personne ne compte », et les deux se ressemblent.
  recordCliUsage("sauvegarde-projet", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  mkdirSync(DOSSIER, { recursive: true });
  const commit = sh("git rev-parse --short HEAD").trim();
  const horodatage = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const fichiers = fichiersSuivis({ shImpl: sh });

  const coffre = join(DOSSIER, `projet-${horodatage}.zip`);
  sh(`git archive --format=zip -o ${coffre} HEAD`);

  const tailleDe = (f) => { try { return statSync(f).size; } catch { return Number.MAX_SAFE_INTEGER; } };
  const choix = choisirPourLaNotice(fichiers, { tailleDe });
  const notice = construireNotice({ choix, date: new Date().toISOString(), commit,
    nbFichiersCoffre: fichiers.length, manque: cequiManque(fichiers, choix.retenus),
    lireFichier: (f) => { try { return readFileSync(f, "utf8"); } catch (e) { return `[illisible : ${e.message}]`; } } });
  const noticeChemin = join(DOSSIER, `notice-${horodatage}.txt`);
  writeFileSync(noticeChemin, notice);

  const tous = readdirSync(DOSSIER);
  for (const vieux of [...aSupprimer(tous.filter((f) => f.endsWith(".zip"))), ...aSupprimer(tous.filter((f) => f.startsWith("notice-")))]) {
    unlinkSync(join(DOSSIER, vieux));
  }

  const ligne = ligneDeRegistre({ date: new Date().toISOString().slice(0, 16).replace("T", " "), commit,
    nbCoffre: fichiers.length, tailleCoffre: statSync(coffre).size,
    nbNotice: choix.retenus.length, tailleNotice: statSync(noticeChemin).size });
  const entete = existsSync(REGISTRE) ? readFileSync(REGISTRE, "utf8") :
    `# Registre des sauvegardes\n\n*(Produit par \`${SCRIPT_PATH}\`. Seules les ${COPIES_GARDEES} dernières sont gardées sur disque : le coffre le plus récent contient déjà tout ce que les précédents contenaient, puisque l'historique du projet est fait de fichiers du projet.)*\n\n| Date | État du code | Coffre (.zip) | Notice (.txt) |\n|---|---|---|---|\n`;
  writeFileSync(REGISTRE, entete + ligne + "\n");

  console.log(`Coffre : ${coffre}`);
  console.log(`Notice : ${noticeChemin} (${choix.retenus.length} fichiers, ${choix.total.toLocaleString("fr-FR")} car.)`);
  console.log(choix.pourquoi);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
