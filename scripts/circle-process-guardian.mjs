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
//
// Double communication (alerte console + rapport) — rappel permanent (2026-09-22) : par
// construction, chaque item de CIRCLE_ITEMS écrit dans son rapport (recordCircleItemReport())
// exactement le même texte qu'il annonce à l'oral (son `execute` le dit littéralement). Le vrai
// point de vigilance n'est donc jamais un bug de conception, mais la discipline d'exécution de
// l'agent qui pilote une vraie Ronde : suivre cette instruction à chaque item, sans jamais
// improviser un contenu de rapport différent de ce qui vient d'être annoncé en conversation. Ce
// commentaire EST une part du mécanisme de mémoire pour ce point (le fichier n'a aucune autre
// mémoire persistante) — jamais à retirer au prétexte qu'« il n'y a rien à vérifier mécaniquement » :
// verifyDoubleCommunication() ci-dessous rend le point réellement vérifiable dès que l'agent fournit
// les deux textes, jamais un simple rappel qui resterait sans prise sur un vrai manquement.

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

// verifyDoubleCommunication() (2026-09-22, point 3 réel du message de l'utilisateur : « Double
// communication (alerte console + rapport) [...] on parle de discipline d'execution »). Rend le
// point réellement vérifiable dès que l'agent qui pilote fournit les DEUX textes (jamais deviné) —
// une vraie comparaison mécanique, pas seulement un rappel écrit en commentaire (cf. ci-dessus).
// Comparaison volontairement stricte après un simple `trim()` (espaces de bord ignorés, jamais le
// fond) : une vraie divergence de fond entre les deux canaux est exactement ce que ce garde-fou doit
// attraper, jamais masquée par une tolérance approximative.
export function verifyDoubleCommunication(entries = []) {
  const findings = [];
  for (const { itemId, announcedText, recordedText } of entries) {
    if (announcedText == null || recordedText == null) {
      findings.push({ check: "double-communication", message: `Item "${itemId}" : le texte annoncé en conversation et/ou le texte réellement écrit via recordCircleItemReport() n'ont pas été fournis — comparaison impossible, jamais supposée conforme.` });
      continue;
    }
    if (String(announcedText).trim() !== String(recordedText).trim()) {
      findings.push({ check: "double-communication", message: `Item "${itemId}" : le texte annoncé en conversation diffère de celui écrit dans le rapport — la discipline "une seule chaîne, deux canaux" n'a pas été suivie.` });
    }
  }
  return { ok: findings.length === 0, findings };
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

// verifyHyperScanProcess() (2026-09-22, demande explicite : « l'outil process.circle doit aussi
// l'avoir en tete [HYPER-SCAN-CHECKPOINT], on parle de discipline d'execution, il est la pour ca »).
// HYPER-SCAN-CHECKPOINT n'est PAS un item de CIRCLE_ITEMS (cf. CIRCLE_EXCLUDED_REGISTRIES : « outil
// exceptionnel, jamais coché par défaut ni régulier ») — mais le mandat de ce module (discipline
// d'exécution d'un protocole à plusieurs étapes) s'applique tout aussi bien à SES PROPRES garde-fous
// (docs/referentiel/hyper-scan-checkpoint.md) qu'à ceux de la Ronde ci-dessus. Même portée honnête :
// aucun de ces faits n'est observable depuis le disque seul (la consultation de Smart Conso
// API/SMART-CONSO-TOKEN avant une version complète, la version légère lancée d'abord, le plafond de
// 3 tentatives respecté, la relecture complète de CLAUDE.md, la double perspective) — l'agent qui
// pilote doit les fournir explicitement, jamais devinés.
export function verifyHyperScanProcess({
  version, // "légère" | "complète" — quelle version a été demandée/exécutée
  claudeMdFullyReread,
  smartConsoApiConsulted,
  smartConsoTokenConsulted,
  lightVersionRanFirst,
  iterationsUsed,
  doublePerspectiveUsed,
  indexEntryRecorded,
} = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

  if (claudeMdFullyReread !== true) add("claude-md-reread", "La relecture complète et littérale de CLAUDE.md n'est pas confirmée — garde-fou non négociable, exigé même en version légère (docs/referentiel/hyper-scan-checkpoint.md).");

  if (version === "complète") {
    if (smartConsoApiConsulted !== true) add("smart-conso-api", "La version complète a été lancée sans confirmation que Smart Conso API a été consulté avant (Article 22).");
    if (smartConsoTokenConsulted !== true) add("smart-conso-token", "La version complète (double perspective = agent_subagent_spawn) a été lancée sans confirmation que SMART-CONSO-TOKEN a été consulté avant.");
    if (lightVersionRanFirst !== true) add("light-first", "La version légère doit toujours tourner avant la version complète — non confirmé ici.");
    if (typeof iterationsUsed === "number" && iterationsUsed > 3) add("iteration-cap", `${iterationsUsed} tentative(s) de mini-simulation utilisée(s) — dépasse le plafond non négociable de 3 (docs/referentiel/hyper-scan-checkpoint.md).`);
    if (doublePerspectiveUsed !== true) add("double-perspective", "La version complète doit inclure une double perspective (un second agent réellement séparé, qui ne voit pas les conclusions du premier) — non confirmée ici.");
  }

  if (indexEntryRecorded === false) add("index-entry", "Aucune ligne n'a été ajoutée à docs/hyper-scan-checkpoint/index.md après la checklist qualitative — la mémoire du prochain passage (depuis quel commit reprendre) serait faussée.");

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
