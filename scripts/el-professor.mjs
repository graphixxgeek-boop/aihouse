// EL-PROFESSOR — partie mécanique et gratuite (2026-09-19, cf. docs/el-professor-blueprint.md et
// docs/referentiel/el-professor.md). La notation elle-même (une vraie lecture qualitative contre
// la charte) ne peut pas être mécanisée — ce script ne fait qu'une chose, zéro appel réseau,
// zéro coût : comparer la liste des simulations archivées (docs/simulations/index.md) à celles
// qui ont déjà reçu une note (docs/el-professor/index.md), et signaler toute simulation archivée
// sans note — jamais une omission silencieuse (même logique que la partie mécanique d'ARGUS).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
// Copie de présentation jetable, jamais committée (même patron que KPI_HTML_PATH de
// kpi-report.mjs) — le registre `docs/el-professor/index.md` reste la seule version de travail.
export const EL_PROFESSOR_HTML_PATH = ".el-professor-coverage-latest.html";

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

// Rapport HTML (2026-09-20, tâche #144 — checkHtmlWiring() signalait cet outil comme jamais câblé
// malgré la règle « tous les rapports en HTML », cf. docs/regles-de-travail.md) : reprend la MÊME
// donnée déjà calculée par main() (missing/orphans), jamais un second calcul.
export function buildElProfessorCoverageHtml(missing, orphans) {
  const blocks = [];
  blocks.push(
    missing.length
      ? { type: "note", text: `${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR — à noter avant de considérer la couverture complète.` }
      : { type: "paragraph", text: "Toutes les simulations archivées ont une note EL-PROFESSOR à jour." },
  );
  if (missing.length) blocks.push({ type: "list", items: missing });
  if (orphans.length) {
    blocks.push({ type: "note", text: `${orphans.length} note(s) EL-PROFESSOR sans simulation archivée correspondante (identifiant orphelin).` });
    blocks.push({ type: "list", items: orphans });
  }
  return renderHtmlReport({
    title: "EL-PROFESSOR — couverture des notes",
    subtitle: "Partie mécanique et gratuite : compare docs/simulations/index.md à docs/el-professor/index.md, cf. docs/referentiel/el-professor.md.",
    dateLabel: new Date().toISOString(),
    blocks,
    footer: "EL-PROFESSOR — la notation qualitative elle-même reste une vraie lecture, jamais un calcul mécanique.",
  });
}

function main() {
  recordCliUsage("el-professor");
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
  writeFileSync(join(ROOT, EL_PROFESSOR_HTML_PATH), buildElProfessorCoverageHtml(missing, orphans));
  console.log(`\nCopie HTML : ${EL_PROFESSOR_HTML_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
