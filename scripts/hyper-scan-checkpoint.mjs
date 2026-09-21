// HYPER-SCAN-CHECKPOINT — vérification approfondie exceptionnelle (2026-09-19, cf.
// docs/hyper-scan-checkpoint-blueprint.md et docs/referentiel/hyper-scan-checkpoint.md).
// Reconstruit à partir de cinq vrais prompts historiques de l'utilisateur (16-19 septembre),
// retrouvés dans l'historique complet de la session à sa demande explicite.
//
// Rôle : ORCHESTRATEUR, jamais un réimplémenteur. Version LÉGÈRE (celle-ci, zéro appel réseau) :
// agrège tout ce qu'ARGUS, HARMONIA, AXA-CHECK, CLEAN-DIRTY-OLD, CLONE-HUNTER (les 5 Gardiens
// sacrés du code, Article 20 — cf. docs/referentiel/organisation-agence.md §3), ALWAYS-NEW-CODE
// (préparation — zone recommandée + indices mécaniques, jamais le vrai zoom profond, un
// raisonnement que seul l'agent peut faire), check-house.mjs, kpi-report.mjs et tous les
// registres/historiques déjà accumulés savent dire
// MÉCANIQUEMENT, détermine ce qui a changé depuis le dernier passage (mémoire automatique via
// docs/hyper-scan-checkpoint/index.md, jamais un fichier d'état séparé), puis produit une
// CHECKLIST explicite des vérifications qui restent du ressort du raisonnement (fidélité aux
// consignes passées, combinaisons non pensées, comparaison humaine de deux transcripts, le zoom
// ALWAYS-NEW-CODE) — jamais prétendre que ces dernières sont automatisées alors qu'elles ne le
// sont pas (cf. blueprint, "Ce que ce patron n'est pas").
//
// La version COMPLÈTE (check-spirit.mjs, check-profile.mjs, mini-simulations plafonnées, double
// perspective via un second agent indépendant) n'est jamais lancée par ce script seul : elle
// nécessite une vraie consultation de Smart Conso API et l'orchestration d'un second agent, deux
// choses que seul l'agent appelant (pas un script isolé) peut réellement faire.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sh as shBase } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const INDEX_PATH = join(ROOT, "docs/hyper-scan-checkpoint/index.md");

function sh(cmd) {
  return shBase(cmd, { cwd: ROOT, verbose: true });
}

// Lit le dernier commit couvert par un passage précédent, directement depuis l'index archivé —
// jamais un second fichier d'état séparé qui pourrait diverger (Article 3, déjà appliqué à
// Smart Conso API pour l'historique brut partagé avec Smart Breaker).
export function lastCheckpointCommit(indexText) {
  const dataRows = indexText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Commit couvert"));
  for (let i = dataRows.length - 1; i >= 0; i--) {
    const m = dataRows[i].match(/`([0-9a-f]{7,40})`/);
    if (m) return m[1];
  }
  return undefined;
}

// KPI central de l'outil (2026-09-19, demande explicite de l'utilisateur : « ce qui m'intéresse
// dans ces prompts, c'est le résultat qu'ils ont obtenu : la mise en évidence de bugs non
// identifiés [...] assure-toi de ses performances, qui doivent être suivies dans les KPI aussi »).
// Le succès de cet outil ne se mesure JAMAIS à "a-t-il tourné sans erreur" (ARGUS/HARMONIA/
// check-house.mjs le garantissent déjà chacun de leur côté) mais à sa vraie vocation : combien de
// passages ont réellement fait remonter un bug ou un oubli qu'aucun autre outil n'avait vu — le
// cas réel du 2026-09-18 (`negotiationLog` jamais câblé malgré une demande explicite) est la
// référence. Colonne "Trouvailles" de l'index = nombre de trouvailles CONFIRMÉES (jamais des
// candidats non vérifiés) pour ce passage précis.
export function checkpointPerformance(indexText) {
  const dataRows = indexText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Commit couvert"));
  const counts = dataRows
    .map((row) => row.split("|").map((c) => c.trim()))
    .filter((cols) => cols.length >= 5 && /^\d+$/.test(cols[4]))
    .map((cols) => Number(cols[4]));
  if (!counts.length) return undefined;
  const passages = counts.length;
  const totalFindings = counts.reduce((a, b) => a + b, 0);
  const passagesAvecTrouvaille = counts.filter((n) => n > 0).length;
  return {
    passages,
    totalFindings,
    findingsPerPassage: totalFindings / passages,
    hitRate: (passagesAvecTrouvaille / passages) * 100,
  };
}

export function summarizeArgusOutput(output) {
  const dead = (output.match(/\[(confirmé|probable)\]/g) || []).length;
  const todos = /Marqueurs TODO\/FIXME trouvés \((\d+)\)/.exec(output);
  return { candidatsDetectes: dead, todos: todos ? Number(todos[1]) : 0 };
}

export function summarizeHarmoniaOutput(output) {
  const m = /(\d+) friction\(s\) confirmée\(s\) sur (\d+) lien\(s\)/.exec(output);
  return m ? { frictions: Number(m[1]), liensVerifies: Number(m[2]) } : { frictions: undefined, liensVerifies: undefined };
}

function countOpenBullets(text) {
  return (text.match(/^- /gm) || []).length;
}

function main() {
  const now = new Date().toISOString();
  console.log("=== HYPER-SCAN-CHECKPOINT — version légère (zéro appel réseau) ===\n");

  const indexText = existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH, "utf8") : "";
  const lastCommit = lastCheckpointCommit(indexText);
  const headCommit = sh("git rev-parse HEAD").trim();
  let commitsSince = "premier passage — aucune référence antérieure, portée = tout l'historique récent visible.";
  if (lastCommit) {
    commitsSince = sh(`git log ${lastCommit}..HEAD --oneline`).trim() || "(aucun commit depuis le dernier passage)";
  }
  console.log(`Dernier passage couvrait jusqu'à : ${lastCommit ?? "(aucun — premier passage)"}`);
  console.log(`HEAD actuel : ${headCommit}`);
  console.log(`\n--- Commits depuis le dernier passage ---\n${commitsSince}\n`);

  console.log("--- ARGUS ---");
  const argusOut = sh("node scripts/check-argus.mjs");
  const argusSummary = summarizeArgusOutput(argusOut);
  console.log(`${argusSummary.candidatsDetectes} candidat(s) de trou signalé(s), ${argusSummary.todos} marqueur(s) TODO/FIXME.`);

  console.log("\n--- HARMONIA ---");
  const harmoniaOut = sh("node scripts/check-harmonia.mjs");
  const harmoniaSummary = summarizeHarmoniaOutput(harmoniaOut);
  console.log(`${harmoniaSummary.frictions ?? "?"} friction(s) confirmée(s) sur ${harmoniaSummary.liensVerifies ?? "?"} lien(s) vérifié(s).`);

  console.log("\n--- ALWAYS-NEW-CODE (préparation) ---");
  const alwaysNewCodeOut = sh("node scripts/always-new-code.mjs");
  console.log(alwaysNewCodeOut.trim());

  console.log("\n--- AXA-CHECK (robustesse/fragilité par fonction) ---");
  const axaCheckOut = sh("node scripts/axa-check.mjs");
  console.log(axaCheckOut.trim());

  console.log("\n--- CLEAN-DIRTY-OLD (code ancien et peu retouché, repérage seul) ---");
  const cleanDirtyOldOut = sh("node scripts/clean-dirty-old.mjs");
  console.log(cleanDirtyOldOut.trim());

  // CLONE-HUNTER (2026-09-22) : 5e Gardien sacré du code — gap réel trouvé le soir de sa promotion
  // (déjà câblé dans le post-commit hook et dans checkAgentOnboarding(), oublié ici) et corrigé le
  // même soir. Répertoire des fonctionnements partagés des Gardiens, point 5 :
  // docs/referentiel/organisation-agence.md §3.
  console.log("\n--- CLONE-HUNTER (blocs de code dupliqués, littéral + renommage bijectif) ---");
  const cloneHunterOut = sh("node scripts/clone-hunter.mjs");
  console.log(cloneHunterOut.trim());

  console.log("\n--- Suite de tests (check-house.mjs) ---");
  const testOut = sh("node scripts/check-house.mjs 2>&1");
  const testsOk = !/AssertionError|Error:/.test(testOut) || /ExperimentalWarning/.test(testOut.split("AssertionError")[0] || "");
  const realFailure = /AssertionError/.test(testOut);
  console.log(realFailure ? "ÉCHEC détecté dans la suite de tests — voir le rapport complet." : "Suite de tests verte.");

  console.log("\n--- Registres et historiques disponibles ---");
  const registries = [
    ["Points fragiles ouverts", "docs/referentiel/points-fragiles.md"],
    ["Suivi des tâches (index)", "docs/suivi/index.md"],
    ["ARGUS (index)", "docs/argus/index.md"],
    ["HARMONIA (index)", "docs/harmonia/index.md"],
    ["Smart Conso API (index)", "docs/smart-conso-api/index.md"],
    ["ALWAYS-NEW-CODE (index)", "docs/always-new-code/index.md"],
    ["CHECK-LEVEL-TARGET (index)", "docs/check-level-target/index.md"],
    ["AXA-CHECK (index)", "docs/axa-check/index.md"],
    ["CLEAN-DIRTY-OLD (index)", "docs/clean-dirty-old/index.md"],
    ["CLONE-HUNTER (index)", "docs/clone-hunter/index.md"],
  ];
  const registrySummary = [];
  for (const [label, relPath] of registries) {
    const full = join(ROOT, relPath);
    if (!existsSync(full)) { registrySummary.push(`${label} : fichier introuvable (${relPath})`); continue; }
    const text = readFileSync(full, "utf8");
    const bullets = countOpenBullets(text);
    const rows = (text.match(/^\|/gm) || []).length;
    registrySummary.push(`${label} : ${bullets} puce(s), ${rows} ligne(s) de tableau — ${relPath}`);
  }
  for (const line of registrySummary) console.log(line);

  console.log("\n--- Performance de l'outil lui-même (KPI central) ---");
  const perf = checkpointPerformance(indexText);
  if (!perf) {
    console.log("Aucun passage complet enregistré à ce jour (absence de donnée, jamais un faux 0%) — ce signal apparaîtra à partir du prochain passage dont la trouvaille est consignée dans l'index.");
  } else {
    console.log(`${perf.passages} passage(s) enregistré(s) · ${perf.totalFindings} trouvaille(s) confirmée(s) au total · ${perf.findingsPerPassage.toFixed(1)} en moyenne par passage · ${Math.round(perf.hitRate)}% des passages ont trouvé au moins une chose réelle.`);
  }

  console.log("\n--- Charte (CLAUDE.md) ---");
  const charter = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
  console.log(`${charter.length} caractères, ${charter.split("\n").length} lignes — relecture COMPLÈTE requise en aval (jamais un résumé de mémoire, décision explicite de l'utilisateur).`);

  const checklist = [
    "1. Relire CLAUDE.md EN ENTIER (le fichier vient d'être chargé ci-dessus ; cette étape reste un vrai raisonnement, jamais automatisable) — chaque Article est-il toujours respecté par le code actuel ?",
    "2. Reprendre CHAQUE consigne explicite formulée par l'utilisateur depuis le dernier passage (cf. commits ci-dessus) et confirmer, une par une, qu'elle a été précisément et entièrement honorée — pas seulement dans l'esprit.",
    "3. Balayer les COMBINAISONS de mécanismes récents entre eux et avec l'existant (ex. un mécanisme nouveau actif en même temps qu'un mécanisme ancien) — jamais couvert par un outil mécanique, une vraie réflexion à chaque fois.",
    "4. Identifier le code sensible/central touché récemment et resté sans test dédié — en écrire un si c'est le cas.",
    "5. Si une simulation complète existe depuis le dernier passage, comparer sa transcription à la précédente réplique par réplique, comme le ferait un humain — repérer les régressions de naturel, pas seulement les bugs.",
    "6. Distinguer explicitement, dans le rapport final : vrai oubli corrigé / déjà connu et sciemment reporté / question ouverte pour l'utilisateur.",
    "7. Sur la zone recommandée par ALWAYS-NEW-CODE ci-dessus (ou une autre zone explicitement demandée) : faire le vrai zoom profond \"page blanche\" — jamais mécanisable, cf. docs/referentiel/always-new-code.md.",
  ];
  console.log("\n--- Checklist qualitative restant à exécuter (raisonnement, jamais mécanisable) ---");
  for (const item of checklist) console.log(item);

  const outDir = join(ROOT, "docs/hyper-scan-checkpoint");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const runId = "scan-" + now.slice(0, 16).replace(/[:T]/g, "-");
  const reportPath = join(outDir, runId + ".txt");
  writeFileSync(reportPath, [
    `HYPER-SCAN-CHECKPOINT — version légère — ${now}`,
    `Dernier passage : ${lastCommit ?? "(aucun)"}  |  HEAD actuel : ${headCommit}`,
    "",
    "=== Commits depuis le dernier passage ===",
    commitsSince,
    "",
    "=== ARGUS ===",
    argusOut,
    "",
    "=== HARMONIA ===",
    harmoniaOut,
    "",
    "=== ALWAYS-NEW-CODE (préparation) ===",
    alwaysNewCodeOut,
    "",
    "=== AXA-CHECK (robustesse/fragilité par fonction) ===",
    axaCheckOut,
    "",
    "=== CLEAN-DIRTY-OLD (code ancien et peu retouché, repérage seul) ===",
    cleanDirtyOldOut,
    "",
    "=== CLONE-HUNTER (blocs de code dupliqués, littéral + renommage bijectif) ===",
    cloneHunterOut,
    "",
    "=== Suite de tests ===",
    realFailure ? "ÉCHEC — voir sortie complète ci-dessous." : "Verte.",
    testOut.slice(-4000),
    "",
    "=== Registres et historiques ===",
    ...registrySummary,
    "",
    "=== Performance de l'outil lui-même (KPI central) ===",
    perf ? `${perf.passages} passage(s) · ${perf.totalFindings} trouvaille(s) confirmée(s) · ${perf.findingsPerPassage.toFixed(1)}/passage · ${Math.round(perf.hitRate)}% de passages avec au moins une trouvaille réelle.` : "Absence de donnée (aucun passage complet encore consigné dans l'index) — jamais un faux 0%.",
    "",
    "=== Checklist qualitative restant à exécuter ===",
    ...checklist,
  ].join("\n") + "\n");
  console.log(`\nRapport archivé : docs/hyper-scan-checkpoint/${runId}.txt`);
  console.log("Ce fichier + la checklist qualitative ci-dessus doivent maintenant être traités par l'agent avant de considérer ce passage terminé (cf. docs/referentiel/hyper-scan-checkpoint.md).");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
