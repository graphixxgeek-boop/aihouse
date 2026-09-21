// circle-process-guardian.mjs (2026-09-22) — vérifie mécaniquement que le processus complet de la
// Ronde CIRCLE-TASKS a bien été suivi, tel que documenté dans docs/circle-process-detail.txt
// (Parties 5 et 7). JAMAIS un second calcul divergent : réutilise findOrphanReportFiles()/
// findRegistriesMissingFromCircle() déjà écrites, CIRCLE_ITEMS/CIRCLE_REPORT_FOLDERS déjà réels,
// jamais une liste recopiée à la main (Article 24).
//
// Portée honnête : certains faits (la question AUTO/PRIME/GOAT a bien été posée, quels items ont
// réellement été cochés en conversation, le nombre de points trouvés par l'analyse) ne sont PAS
// observables depuis le code seul — l'agent qui pilote doit les fournir explicitement. Ce module
// ne devine jamais ces faits, il les VÉRIFIE quand ils sont fournis, et signale honnêtement leur
// absence plutôt que de les supposer vrais.
//
// Jamais une correction automatique (cf. Article 20/circle-process-detail.txt : « signaler
// seulement, comme tout le reste de ce paysage d'outils »).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { CIRCLE_ITEMS, CIRCLE_REPORT_FOLDERS, loadLastRun, findRegistriesMissingFromCircle } from "./circle-tasks.mjs";
import { findOrphanReportFiles, REGISTRIES } from "./doc-report.mjs";
import { walkDocsPaths, sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Un item produit-il bien un fichier daté d'AUJOURD'HUI dans son dossier ? Réutilise le même
// motif de nom que recordCircleItemReport()/recordSnapshotIfChanged() (circle-signal-*/snapshot-*),
// jamais un second format de nom de fichier inventé ici.
export function hasFreshReportFile(itemId, { folders = CIRCLE_REPORT_FOLDERS, now = Date.now(), listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []) } = {}) {
  const folder = folders[itemId];
  if (!folder) return undefined; // cassandra-rh-signal notamment : jamais ce mécanisme, cf. son propre `execute`.
  const todayLabel = new Date(now).toISOString().slice(0, 10);
  const files = listDirImpl(join(ROOT, folder));
  return files.some((f) => (f.startsWith("circle-signal-") || f.startsWith("snapshot-")) && f.includes(todayLabel));
}

// verifyRondeProcess() — le point d'entrée unique. `checkedItemIds`/`executedItemIds` et les
// signaux de l'Étape 5 (recapHtml, analysisPointsFound, questionsAsked, reportsDeliveredBeforeAnalysis)
// sont fournis par l'agent qui pilote, jamais déduits — cf. portée honnête ci-dessus.
export function verifyRondeProcess({
  autoPrimeGoatAsked,
  nightAutonomousMode = false,
  checkedItemIds,
  executedItemIds,
  recapHtml,
  analysisPointsFound,
  questionsAsked,
  reportsDeliveredBeforeAnalysis,
  now = Date.now(),
  circleItems = CIRCLE_ITEMS,
  reportFolders = CIRCLE_REPORT_FOLDERS,
  hasFreshReportFileImpl = hasFreshReportFile,
  findOrphanReportFilesImpl = findOrphanReportFiles,
  findRegistriesMissingFromCircleImpl = findRegistriesMissingFromCircle,
  existingPaths,
  shImpl = sh,
  loadLastRunImpl = loadLastRun,
} = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

  // 1. AUTO/PRIME/GOAT
  if (!nightAutonomousMode && autoPrimeGoatAsked !== true) add("auto-prime-goat", "La question AUTO/PRIME/GOAT n'a pas été confirmée comme posée avant l'exécution de la Ronde.");

  // 3. Items cochés vs réellement exécutés
  if (checkedItemIds && executedItemIds) {
    const missing = checkedItemIds.filter((id) => !executedItemIds.includes(id));
    if (missing.length) add("checked-vs-executed", `${missing.length} item(s) coché(s) jamais exécuté(s) : ${missing.join(", ")}.`);
  } else {
    add("checked-vs-executed", "La liste réelle des items cochés et/ou exécutés n'a pas été fournie — ce fait n'est jamais déductible du code seul.");
  }

  // 4. Chaque item exécuté avec producesReport:true a bien laissé un fichier daté d'aujourd'hui.
  if (executedItemIds) {
    const reportItems = circleItems.filter((i) => i.producesReport && executedItemIds.includes(i.id) && reportFolders[i.id]);
    for (const item of reportItems) {
      const fresh = hasFreshReportFileImpl(item.id, { folders: reportFolders, now });
      if (fresh === false) add("missing-report-artifact", `L'item "${item.id}" (producesReport:true) n'a laissé aucun fichier daté d'aujourd'hui dans ${reportFolders[item.id]}.`);
    }
  }

  // 5/5bis/5ter. Récapitulatif HTML, analyse mise en évidence, séquence et questions forcées.
  if (recapHtml !== undefined) {
    if (!/<!DOCTYPE html>/i.test(recapHtml)) add("recap-format", "Le récapitulatif fourni n'est pas un vrai document HTML.");
    if ((analysisPointsFound ?? 0) > 0 && !/class="highlight"/.test(recapHtml)) add("recap-highlight", "Des points ont été trouvés mais le récapitulatif ne porte aucun bloc d'analyse mis en évidence (class=\"highlight\").");
  }
  if (reportsDeliveredBeforeAnalysis === false) add("sequence-order", "La séquence stricte de l'Étape 5 n'a pas été respectée : les rapports doivent être livrés AVANT que l'agent ne construise son analyse.");
  if ((analysisPointsFound ?? 0) > 0) {
    const expectedMin = Math.min(5, analysisPointsFound);
    if ((questionsAsked ?? 0) < expectedMin) add("forced-questions", `${analysisPointsFound} point(s) trouvé(s) mais seulement ${questionsAsked ?? 0} question(s) à choix forcé posée(s) — attendu au moins ${expectedMin} (jamais zéro question sur une analyse à plusieurs problèmes).`);
    if ((questionsAsked ?? 0) > 10) add("forced-questions", `${questionsAsked} questions posées pour ${analysisPointsFound} point(s) trouvé(s) — au-delà de la fourchette 5-10 attendue, jamais une question par détail insignifiant.`);
  }

  // 6. record-run — le compteur de fraîcheur doit être retombé à (quasi) 0 juste après la Ronde :
  // au plus 1 commit d'écart toléré (le commit du record-run lui-même, souvent le dernier geste de
  // la Ronde) — jamais un second calcul de comptage divergent de celui déjà utilisé ailleurs.
  try {
    const commitCount = Number(shImpl("git rev-list --count HEAD", { cwd: ROOT.replace(/\/$/, "") }).trim());
    const { lastRunCommitCount } = loadLastRunImpl();
    if (Number.isFinite(commitCount) && Number.isFinite(lastRunCommitCount)) {
      const commitsSinceLastRun = commitCount - lastRunCommitCount;
      if (commitsSinceLastRun > 1) add("record-run", `record-run() n'a pas été appelé à la fin de cette Ronde : ${commitsSinceLastRun} commit(s) d'écart avec le dernier passage enregistré.`);
    } else {
      add("record-run", "record-run() n'a jamais été appelé une seule fois (aucun état local trouvé).");
    }
  } catch { /* best-effort, jamais bloquant */ }

  // 7. findOrphanReportFiles() — aucun fichier ARGUS (ou futur registre "un fichier par passage") orphelin.
  const orphans = findOrphanReportFilesImpl();
  if (orphans.length) add("orphan-reports", `${orphans.length} registre(s) avec des rapports jamais indexés : ${orphans.map((o) => o.slug).join(", ")}.`);

  // 8. findRegistriesMissingFromCircle() — aucun registre orphelin.
  const realExistingPaths = existingPaths ?? walkDocsPaths("docs", "");
  const missingFromCircle = findRegistriesMissingFromCircleImpl(realExistingPaths);
  if (missingFromCircle.length) add("registries-missing-from-circle", `${missingFromCircle.length} registre(s) réel(s) sans entrée CIRCLE_ITEMS ni exclusion documentée : ${missingFromCircle.join(", ")}.`);

  return { ok: findings.length === 0, findings };
}

function main() {
  recordCliUsage("circle-process-guardian");
  console.log("=== circle-process-guardian — vérification mécanique du processus de Ronde ===\n");
  console.log("Ce script ne peut vérifier seul que les faits observables depuis le disque (Parties 4/7/8 de");
  console.log("docs/circle-process-detail.txt) — les faits de conversation (question AUTO/PRIME/GOAT, items");
  console.log("réellement cochés, séquence de l'Étape 5) doivent être fournis par l'agent qui pilote via");
  console.log("verifyRondeProcess(), jamais devinés. Lancé sans argument, il ne vérifie donc que 7/8 : \n");
  const result = verifyRondeProcess({});
  for (const f of result.findings) console.log(`- [${f.check}] ${f.message}`);
  console.log(result.ok ? "\nAucun écart mécaniquement détectable." : `\n${result.findings.length} écart(s) trouvé(s) — jamais une correction automatique, signaler seulement à l'agent qui pilote.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
