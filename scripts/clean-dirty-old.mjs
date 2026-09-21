// CLEAN-DIRTY-OLD — code ancien et peu retouché, jamais retesté ni relu depuis longtemps
// (2026-09-19, cf. docs/clean-dirty-old-blueprint.md et docs/referentiel/clean-dirty-old.md). Né
// pendant le calibrage de cet outil, d'une question directe de l'utilisateur qui a fait naître
// AXA-CHECK en cours de route : « comment sait-on si une zone du code est couverte ou pas par un
// test ? ».
//
// Rôle : REPÉRER, jamais JUGER. Un fichier stagnant n'est pas un bug — il peut être stable et
// correct depuis toujours. CLEAN-DIRTY-OLD ne répond donc à aucune des trois vraies questions
// (encore utile ? encore à jour ? profiterait d'une refonte ?) : il pointe, pour chaque zone
// signalée, vers l'outil qui SAIT déjà y répondre (ARGUS, HARMONIA, ALWAYS-NEW-CODE) — jamais une
// réimplémentation de leur jugement (règle anti-doublon, docs/regles-de-travail.md §7ter).
//
// Garde-fou le plus important, hérité directement de la leçon trottoirGranted (cf.
// docs/argus/index.md) : un fichier stagnant peut très bien être une décision assumée et
// documentée ailleurs (Article 19) — jamais qualifié de "dette" avant d'avoir vérifié ce point.
// CLEAN-DIRTY-OLD ne le vérifie jamais lui-même (c'est un raisonnement, pas un calcul) : il se
// contente de le rappeler dans son rapport.

import { existsSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh } from "./lib-shell.mjs";
import { dataRows, numericColumn } from "./lib-markdown-table.mjs";
import { SENSITIVE_NODES } from "./check-level-target.mjs";
import { LIB_MAP, FILE_TO_ZONES, collectCoverage, robustnessScore } from "./axa-check.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const INDEX_PATH = join(ROOT, "docs/clean-dirty-old/index.md");

// --- Stagnation RELATIVE, jamais un seuil de date fixe inventé ------------------------------

// Décision de conception explicite (cf. blueprint) : "ancien" n'a de sens que RELATIVEMENT à
// l'activité du reste du projet, jamais un nombre de jours absolu choisi arbitrairement — un
// projet jeune et très actif rendrait un seuil fixe de "6 mois" absurde (rien n'aurait cet âge),
// un projet ancien et calme le rendrait trivial (tout le dépasserait). Un fichier est "stagnant"
// s'il est À LA FOIS nettement plus ancien que la médiane du reste (signal relatif) ET vieux d'au
// moins un mois en absolu (garde-fou anti-bruit : sur un projet tout jeune, un facteur relatif seul
// flaguerait le moindre écart d'un jour).
const MIN_ABSOLUTE_DAYS = 30;
const RELATIVE_FACTOR = 2.5;

// lastTouchDaysByFile : { fichier: joursDepuisLeDernierCommit | undefined (jamais commité) }.
// Moins de deux fichiers avec un historique réel = aucun signal RELATIF possible, jamais un calcul
// inventé sur une seule donnée (honnête absence, comme le reste des outils de ce projet).
export function relativeStaleness(lastTouchDaysByFile) {
  const values = Object.values(lastTouchDaysByFile).filter((v) => typeof v === "number" && Number.isFinite(v));
  const result = {};
  if (values.length < 2) {
    for (const file of Object.keys(lastTouchDaysByFile)) result[file] = { days: lastTouchDaysByFile[file], stale: false, ratioToMedian: undefined };
    return result;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  for (const [file, days] of Object.entries(lastTouchDaysByFile)) {
    if (typeof days !== "number" || !Number.isFinite(days)) { result[file] = { days, stale: false, ratioToMedian: undefined }; continue; }
    const ratio = median > 0 ? days / median : undefined;
    const stale = days >= MIN_ABSOLUTE_DAYS && (ratio === undefined ? days > 0 : ratio >= RELATIVE_FACTOR);
    result[file] = { days, stale, ratioToMedian: ratio, medianDays: median };
  }
  return result;
}

// --- Priorisation : proximité d'un nœud sensible HARMONIA d'abord (calibrage explicite) -----

export function prioritizeStaleFiles(staleEntries, sensitiveNodes = SENSITIVE_NODES) {
  const isSensitive = (file) => sensitiveNodes.some((n) => n.files.includes(file));
  return [...staleEntries].sort((a, b) => {
    const bySensitivity = (isSensitive(b.file) ? 1 : 0) - (isSensitive(a.file) ? 1 : 0);
    if (bySensitivity !== 0) return bySensitivity;
    return (b.days ?? 0) - (a.days ?? 0);
  });
}

// --- Délégation explicite, jamais une réponse fabriquée --------------------------------------

export function delegationQuestions(file) {
  const zones = FILE_TO_ZONES[file] ?? [];
  const zoneNote = zones.length ? ` (zone${zones.length > 1 ? "s" : ""} concernée${zones.length > 1 ? "s" : ""} : ${zones.join(", ")})` : "";
  return [
    `Ce code sert-il encore à quelque chose${zoneNote} ? → ARGUS (champs jamais lus, absences).`,
    `Sa documentation est-elle encore synchronisée avec son comportement réel ? → HARMONIA (frictions doc/code).`,
    `Profiterait-il d'une restructuration à la lumière de ce que le projet a appris depuis ? → ALWAYS-NEW-CODE (zoom profond).`,
  ];
}

// --- KPI, suivi dès le premier passage (calibrage explicite du 2026-09-19) -------------------

// Même mécanique que alwaysNewCodePerformance()/checkpointPerformance() : absence honnête tant
// qu'aucun passage n'a été enregistré, jamais un 0% déguisé.
export function cleanDirtyOldPerformance(indexText) {
  const counts = numericColumn(dataRows(indexText, "Zone signalée"), 3);
  if (!counts.length) return undefined;
  const passages = counts.length;
  const totalFindings = counts.reduce((a, b) => a + b, 0);
  return { passages, totalFindings, findingsPerPassage: totalFindings / passages };
}

// --- Orchestration réelle ---------------------------------------------------------------------

// Exportée pour que LE-COORDINATEUR puisse calculer le même signal sans reshell check-house.mjs.
export function lastTouchDays(file) {
  const out = sh(`git log -1 --format=%ct -- ${file}`, { cwd: ROOT }).trim();
  if (!out) return undefined;
  const commitSeconds = Number(out);
  if (!Number.isFinite(commitSeconds)) return undefined;
  return (Date.now() / 1000 - commitSeconds) / 86400;
}

function main() {
  recordCliUsage("clean-dirty-old");
  console.log("=== CLEAN-DIRTY-OLD — code ancien et peu retouché (repérage seul, jamais un jugement) ===\n");

  const files = Object.values(LIB_MAP);
  const lastTouchByFile = Object.fromEntries(files.map((f) => [f, lastTouchDays(f)]));
  const staleness = relativeStaleness(lastTouchByFile);

  const covDir = mkdtempSync(join(tmpdir(), "clean-dirty-old-cov-"));
  sh("node scripts/check-house.mjs", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const perFileCoverage = collectCoverage(covDir);
  rmSync(covDir, { recursive: true, force: true });

  const staleEntries = files
    .filter((f) => staleness[f]?.stale)
    .map((f) => ({
      file: f,
      days: Math.round(staleness[f].days),
      ratioToMedian: staleness[f].ratioToMedian !== undefined ? Math.round(staleness[f].ratioToMedian * 10) / 10 : undefined,
      coverageScore: robustnessScore(perFileCoverage[f]),
    }));

  if (!staleEntries.length) {
    console.log("Aucune zone signalée cette fois — rien n'est nettement plus ancien que le reste du projet en ce moment.");
    return;
  }

  const prioritized = prioritizeStaleFiles(staleEntries);
  const sensitiveFiles = new Set(SENSITIVE_NODES.flatMap((n) => n.files));

  for (const entry of prioritized) {
    const sensitiveTag = sensitiveFiles.has(entry.file) ? " [proche d'un nœud sensible HARMONIA]" : "";
    const coverageTag = entry.coverageScore === undefined ? "" : ` — couverture de test ${Math.round(entry.coverageScore)}%${entry.coverageScore < 60 ? " (renforce le signal : faiblement testé en plus d'être ancien)" : ""}`;
    console.log(`${entry.file}${sensitiveTag} : ${entry.days} jour(s) sans modification (${entry.ratioToMedian ?? "?"}× la médiane du projet)${coverageTag}`);
    for (const q of delegationQuestions(entry.file)) console.log(`   - ${q}`);
  }

  console.log("\nRappel avant d'agir sur l'une de ces zones (Article 19) : vérifier d'abord que ce n'est pas déjà une");
  console.log("décision assumée et documentée ailleurs (docs/referentiel/parametres.md, points-fragiles.md) — un code");
  console.log("stagnant n'est pas automatiquement de la dette, la leçon trottoirGranted (docs/argus/index.md) le rappelle.");

  if (existsSync(INDEX_PATH)) {
    const perf = cleanDirtyOldPerformance(readFileSync(INDEX_PATH, "utf8"));
    console.log(perf
      ? `\nPerformance de l'outil (KPI, suivi dès le premier passage) : ${perf.passages} passage(s) consigné(s) · ${perf.totalFindings} trouvaille(s) confirmée(s) · ${perf.findingsPerPassage.toFixed(1)}/passage.`
      : "\nPerformance de l'outil : aucun passage encore consigné dans l'index — ce signal apparaîtra une fois qu'une trouvaille confirmée y sera enregistrée.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
