// Garde-fou du système de profil utilisateur (2026-09-19, cf. docs/profil-utilisateur/index.md et
// docs/regles-de-travail.md §9 « Historisation du profil »). Une fiche d'observation créée dans
// docs/profil-utilisateur/observations/ doit toujours avoir une ligne correspondante dans la table
// de docs/profil-utilisateur/index.md, et inversement — jamais une fiche orpheline (créée mais
// jamais indexée, donc invisible pour un futur agent qui ne consulterait que l'index) ni une ligne
// d'index qui pointe vers un fichier disparu. Gratuit, zéro appel réseau, même patron que
// scripts/check-suivi-fidelity.mjs.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const INDEX_PATH = join(ROOT, "docs/profil-utilisateur/index.md");
const OBSERVATIONS_DIR = join(ROOT, "docs/profil-utilisateur/observations");

// Extrait chaque nom de fichier référencé par un lien markdown "(observations/xxx.md)" dans la
// table de l'index — jamais un motif qui dépendrait de l'ordre exact des colonnes, pour rester
// robuste si la table évolue.
export function extractLinkedFiles(indexText) {
  const matches = indexText.matchAll(/\(observations\/([^)]+\.md)\)/g);
  return [...matches].map((m) => m[1]);
}

// Compare les fiches réellement présentes sur disque aux fiches référencées par l'index — les deux
// écarts possibles sont signalés séparément, jamais fusionnés (ils appellent une correction
// différente : ajouter une ligne à l'index, ou retrouver/supprimer un lien mort).
export function findOrphanedObservations(indexText, observationFiles) {
  const linked = new Set(extractLinkedFiles(indexText));
  const onDisk = new Set(observationFiles);
  return {
    missingFromIndex: observationFiles.filter((f) => !linked.has(f)),
    missingFromDisk: [...linked].filter((f) => !onDisk.has(f)),
  };
}

function main() {
  // L'AVERTISSEMENT DE MARGE, DIT ET PAS SEULEMENT DÉCLARÉ (2026-09-25, tâche #653 → #808) :
  // sa nature heuristique était écrite dans TOOL_RELIABILITY et aucun chemin de ce script ne la
  // prononçait — une protection écrite qui ne sort jamais, le fil rouge de ce projet.
  printReliabilityNotice("check-profil-utilisateur");
  console.log("=== Garde-fou système de profil utilisateur (docs/profil-utilisateur/) ===\n");
  if (!existsSync(INDEX_PATH)) {
    console.log("Aucun index trouvé — le système n'a peut-être jamais été utilisé cette session-ci.");
    return;
  }
  const indexText = readFileSync(INDEX_PATH, "utf8");
  const observationFiles = existsSync(OBSERVATIONS_DIR)
    ? readdirSync(OBSERVATIONS_DIR).filter((f) => f.endsWith(".md"))
    : [];
  const { missingFromIndex, missingFromDisk } = findOrphanedObservations(indexText, observationFiles);
  if (!missingFromIndex.length && !missingFromDisk.length) {
    console.log(`OK — ${observationFiles.length} fiche(s) sur disque, toutes référencées dans l'index, aucun lien mort.`);
    return;
  }
  for (const f of missingFromIndex) console.log(`⚠️ Fiche présente mais jamais indexée : observations/${f}`);
  for (const f of missingFromDisk) console.log(`⚠️ Lien mort dans l'index, fichier introuvable : observations/${f}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
