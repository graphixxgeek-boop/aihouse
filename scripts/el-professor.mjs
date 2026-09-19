// EL-PROFESSOR — partie mécanique et gratuite (2026-09-19, cf. docs/el-professor-blueprint.md et
// docs/referentiel/el-professor.md). La notation elle-même (une vraie lecture qualitative contre
// la charte) ne peut pas être mécanisée — ce script ne fait qu'une chose, zéro appel réseau,
// zéro coût : comparer la liste des simulations archivées (docs/simulations/index.md) à celles
// qui ont déjà reçu une note (docs/el-professor/index.md), et signaler toute simulation archivée
// sans note — jamais une omission silencieuse (même logique que la partie mécanique d'ARGUS).

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

// Extrait les identifiants de simulation (première colonne d'un tableau markdown, ex.
// "full_sim (sim1)" → "full_sim", "full_sim9" → "full_sim9") depuis un registre au format
// docs/simulations/index.md ou docs/el-professor/index.md — les deux partagent la même colonne
// d'identifiant en première position. Toujours le texte brut (jamais un lien markdown) dans cette
// colonne pour que la regex reste fiable — le lien vers le rapport détaillé va dans une colonne
// séparée (cf. docs/el-professor/index.md).
export function extractSimIds(markdown) {
  const ids = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^\|\s*(full_sim\S*)/);
    if (m) ids.push(m[1]);
  }
  return [...new Set(ids)];
}

export function findMissingNotes(simIndexContent, elProfessorIndexContent) {
  const archived = extractSimIds(simIndexContent);
  const noted = new Set(extractSimIds(elProfessorIndexContent));
  return archived.filter((id) => !noted.has(id));
}

// Symétrique de findMissingNotes : une note qui existe sans simulation archivée correspondante
// (faute de frappe dans un identifiant, entrée orpheline après un renommage) est un signal tout
// aussi réel qu'une simulation jamais notée — jamais ignoré silencieusement.
export function findOrphanNotes(simIndexContent, elProfessorIndexContent) {
  const archived = new Set(extractSimIds(simIndexContent));
  const noted = extractSimIds(elProfessorIndexContent);
  return noted.filter((id) => !archived.has(id));
}

function main() {
  const simIndex = readFileSync(join(ROOT, "docs/simulations/index.md"), "utf8");
  const elProfessorIndex = readFileSync(join(ROOT, "docs/el-professor/index.md"), "utf8");
  const missing = findMissingNotes(simIndex, elProfessorIndex);
  const orphans = findOrphanNotes(simIndex, elProfessorIndex);

  console.log("=== EL-PROFESSOR — partie mécanique (couverture des notes) ===\n");
  if (!missing.length) {
    console.log("Toutes les simulations archivées ont une note EL-PROFESSOR à jour.");
  } else {
    console.log(`${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR :`);
    for (const id of missing) console.log(`  - ${id}`);
    console.log("\nÀ noter avant de considérer la couverture complète (cf. docs/referentiel/el-professor.md).");
  }
  if (orphans.length) {
    console.log(`\n${orphans.length} note(s) EL-PROFESSOR sans simulation archivée correspondante (identifiant orphelin) :`);
    for (const id of orphans) console.log(`  - ${id}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
