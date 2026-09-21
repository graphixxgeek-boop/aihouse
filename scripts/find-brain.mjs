// find-brain — cerveau unifié des deux outils de recherche dans le code (2026-09-21, demande
// explicite de l'utilisateur : « je veux un cerveau intelligent "find-brain" qui englobe les 2
// scripts find-booster et find-deep-booster pour plus d'efficacité dans les recherches [...] tu
// dois être pluggé en priorité à ce cerveau qui te rappelle d'utiliser ces 2 outils le plus souvent
// possible »).
//
// Surnom "find-deep-booster" pour route-booster.mjs (même demande) : SURNOM D'AFFICHAGE
// UNIQUEMENT, même patron que MEMENTO/Smart Conso API (tâche #172, « surnom vs renommage de
// fichier → surnom, fichier technique inchangé ») — le fichier reste scripts/route-booster.mjs,
// jamais renommé sur disque, jamais réimporté sous un autre nom.
//
// Ne réimplémente RIEN des deux outils : importe recommendFindBooster() de find-booster.mjs et
// proposeDecomposition() de route-booster.mjs telles quelles (Article 3 de CLAUDE.md, jamais un
// second calcul de poids ou de points de coupe). Son seul travail propre : un jugement DE PLUS —
// laquelle des deux recherches mérite d'être lancée sur CE fichier, ou les deux à la fois (jamais
// un choix exclusif : un gros monolithe peut être à la fois dense en concepts ET plein de points de
// coupe candidats).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { recommendFindBooster } from "./find-booster.mjs";
import { proposeDecomposition } from "./route-booster.mjs";
import { REGISTRIES } from "./doc-report.mjs";

// Racine du dépôt dérivée du fichier lui-même (jamais process.cwd(), qui dépendrait de l'endroit
// d'où node est lancé) — même patron que ROOT dans doc-report.mjs.
const ROOT = new URL("..", import.meta.url).pathname;

export const FIND_DEEP_BOOSTER_NICKNAME = "find-deep-booster";

// Seuils calibrés sur le cas réel qui a motivé route-booster (app/api/lia/route.ts, ~1665 lignes,
// plusieurs dizaines de points de coupe) — jamais des chiffres ronds arbitraires : un fichier
// mérite un vrai zoom "monolithe à découper" seulement s'il est à la fois long ET qu'il contient
// plusieurs candidats réels, jamais l'un sans l'autre (un fichier long mais déjà bien découpé n'a
// besoin que de find-booster pour y naviguer, jamais de find-deep-booster pour le redécouper).
export const MONOLITH_LINE_THRESHOLD = 500;
export const MIN_CUT_POINTS = 2;

// notFound : même correction et même raison que recommendFindBooster() (find-booster.mjs,
// 2026-09-21) — un ENOENT non catché ici plantait tout appelant direct sur un fichier pas encore
// créé, exactement le moment où on veut consulter l'outil avant d'écrire.
export function recommendFindDeepBooster(filePath, { lineThreshold = MONOLITH_LINE_THRESHOLD, minCutPoints = MIN_CUT_POINTS } = {}) {
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    return { lineCount: 0, cutPointCount: 0, worthwhile: false, notFound: true };
  }
  const lineCount = source.split("\n").length;
  const cutPointCount = proposeDecomposition(filePath).length;
  return { lineCount, cutPointCount, worthwhile: lineCount >= lineThreshold && cutPointCount >= minCutPoints };
}

// Même forme que flagFindBoosterCandidates() (doc-report.mjs) — un balayage des scripts RÉELS déjà
// enregistrés dans REGISTRIES, jamais une seconde liste de fichiers à maintenir à la main. Champs
// distincts (lineCount/cutPointCount, pas tokens/entryCount) : les deux outils mesurent des choses
// réellement différentes, jamais forcées dans un même vocabulaire pour paraître uniformes.
export function flagFindDeepBoosterCandidates(registries = REGISTRIES, recommendImpl = recommendFindDeepBooster) {
  const seen = new Set();
  const candidates = [];
  for (const r of registries) {
    if (!r.scriptPath || seen.has(r.scriptPath)) continue;
    seen.add(r.scriptPath);
    let verdict;
    try {
      verdict = recommendImpl(join(ROOT, r.scriptPath));
    } catch {
      continue; // absence honnête : script introuvable, jamais un faux positif fabriqué.
    }
    if (verdict?.worthwhile) candidates.push({ label: r.label, scriptPath: r.scriptPath, lineCount: verdict.lineCount, cutPointCount: verdict.cutPointCount });
  }
  return candidates;
}

// Le jugement unifié, pour UN fichier précis — jamais un tri-état exclusif (cf. commentaire des
// seuils ci-dessus). `recommend` liste les outils réellement utiles, dans cet ordre, jamais les
// deux nommés à égalité si un seul l'est vraiment.
export function recommendFindBrain(filePath) {
  const findBooster = recommendFindBooster(filePath);
  const findDeepBooster = recommendFindDeepBooster(filePath);
  const recommend = [];
  if (findBooster.worthwhile) recommend.push("find-booster");
  if (findDeepBooster.worthwhile) recommend.push(FIND_DEEP_BOOSTER_NICKNAME);
  return { findBooster, findDeepBooster, recommend };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.log("Usage : node scripts/find-brain.mjs <fichier>");
    return;
  }
  const { findBooster, findDeepBooster, recommend } = recommendFindBrain(target);
  console.log(`find-brain — ${target} :`);
  console.log(`  find-booster : ~${findBooster.tokens} tokens, ${findBooster.entryCount} entrée(s) — ${findBooster.worthwhile ? "recommandé" : "pas nécessaire"}`);
  console.log(`  ${FIND_DEEP_BOOSTER_NICKNAME} : ${findDeepBooster.lineCount} ligne(s), ${findDeepBooster.cutPointCount} point(s) de coupe — ${findDeepBooster.worthwhile ? "recommandé" : "pas nécessaire"}`);
  console.log(recommend.length ? `⚡ Utilise : ${recommend.join(" + ")} avant toute lecture intégrale.` : "Aucun des deux outils n'est nécessaire pour ce fichier — une lecture directe suffit.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
