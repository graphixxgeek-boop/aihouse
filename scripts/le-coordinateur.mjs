// LE-COORDINATEUR — petit orchestrateur des vérifications gratuites déjà existantes (2026-09-19,
// nommé ainsi par l'utilisateur, calibré via l'Article 16 : « est-ce qu'il est possible de le
// créer à moindre coût, simplement comme un coordinateur de fonctions existantes ? juste là pour
// fiabiliser et fluidifier l'existant [...] assure-toi que le coordinateur est spécialement bien
// câblé avec tous les autres outils, qu'il a un accès facile et privilégié pour communiquer avec
// les autres outils, puisque son but est de fluidifier le processus. »
//
// Volontairement mince : il ne réimplémente AUCUNE logique de vérification lui-même. Il importe
// et appelle directement les fonctions pures déjà exportées par chaque outil (accès "privilégié"
// demandé explicitement) plutôt que de reparser leur sortie texte à l'aveugle une seconde fois —
// exactement la règle de mutualisation de docs/regles-de-travail.md §7ter :
//   - lib-shell.mjs::sh                              → lancer les scripts qui n'exposent pas
//     (encore) toute leur logique en fonctions pures (ARGUS, HARMONIA, ALWAYS-NEW-CODE).
//   - hyper-scan-checkpoint.mjs::summarizeArgusOutput / summarizeHarmoniaOutput → mêmes résumés
//     que HYPER-SCAN-CHECKPOINT utilise déjà, jamais une seconde regex réinventée à côté.
//   - axa-check.mjs::collectCoverage / robustnessScore → réutilise LE MÊME lancement de
//     check-house.mjs pour la couverture par fonction, jamais un second (règle anti-doublon).
//   - always-new-code.mjs::THEMES / parseCoverage / recommendZone → la même mémoire de rotation,
//     jamais une deuxième zone recommandée qui pourrait diverger de celle d'ALWAYS-NEW-CODE.
//   - clean-dirty-old.mjs::lastTouchDays / relativeStaleness → même calcul de stagnation relative,
//     jamais un second calcul divergent, et sans reshell check-house.mjs pour ce seul signal.
//   - check-level-target.mjs::classifyCheckLevel → exposé en passthrough (classifyRequest
//     ci-dessous) pour qu'un appelant puisse classer une demande sans réimporter le module lui-même,
//     jamais appelé automatiquement dans le passage périodique (il a besoin d'un texte de demande).
//
// Ce qu'il ne fait JAMAIS (cf. calibrage explicite du 2026-09-19, "Aucun de ces outils n'est
// autonome", docs/regles-de-travail.md) : il ne déclenche jamais, de sa propre initiative,
// HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — tout ce qui coûte
// un vrai appel API reste une décision explicite séparée de l'agent ou de l'utilisateur. Il ne
// décide rien sur le fond : il lance ce qui est déjà gratuit, agrège, et affiche un tableau très
// court — jamais un verdict qui remplacerait la lecture de la sortie complète de chaque outil.
//
// Contrairement aux autres outils de ce paysage, LE-COORDINATEUR n'a pas de blueprint/instanciation
// séparés ni de registre dédié : il n'a aucune connaissance propre au projet à documenter à part —
// sa seule valeur est de savoir appeler les autres. Documenté directement dans
// docs/regles-de-travail.md §7ter, à côté du reste du paysage.
//
// Déclenchement : automatique à chaque changement de code (même convention qu'ARGUS/HARMONIA —
// l'agent le relance en routine après un changement, pas un démon qui tourne en continu, Article 8).
// Doublon : si le commit HEAD n'a pas bougé depuis le dernier passage complet, le signale avant de
// relancer pour rien (jamais une fenêtre de temps, qui pourrait rater un vrai changement fait vite).

import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh } from "./lib-shell.mjs";
import { collectCoverage, robustnessScore, LIB_MAP } from "./axa-check.mjs";
import { summarizeArgusOutput, summarizeHarmoniaOutput } from "./hyper-scan-checkpoint.mjs";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";
import { classifyCheckLevel } from "./check-level-target.mjs";
import { lastTouchDays, relativeStaleness } from "./clean-dirty-old.mjs";
import { findUnconfirmedBursts } from "./smart-conso-api.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
// Best-effort, local, jamais committé — même statut que .gemini-key-health.json (mémoire de
// process/session, jamais une garantie inter-redémarrage, cf. CLAUDE.md section Smart Breaker).
const STATE_FILE = join(ROOT, ".le-coordinateur-last-run.json");
const ALWAYS_NEW_CODE_INDEX = join(ROOT, "docs/always-new-code/index.md");

export function currentHead() {
  return sh("git rev-parse HEAD", { cwd: ROOT }).trim() || undefined;
}

export function loadState(readFile = (f) => readFileSync(f, "utf8")) {
  try { return JSON.parse(readFile(STATE_FILE)); } catch { return {}; }
}

function saveState(state) {
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* best-effort, jamais bloquant */ }
}

// Un doublon n'est signalé que si RIEN n'a changé dans le dépôt depuis le dernier passage complet
// (même commit HEAD) — jamais une fenêtre de temps fixe, qui pourrait à tort couvrir un vrai
// changement fait vite, ou à l'inverse rater un vrai doublon si on relance après un long moment
// d'inactivité sans avoir touché au code.
export function isDuplicateRun(state, head) {
  return Boolean(state?.lastHead) && Boolean(head) && state.lastHead === head;
}

export function formatTable(rows) {
  const lines = ["| Outil | Résultat | Dernier passage |", "|---|---|---|"];
  for (const r of rows) lines.push(`| ${r.name} | ${r.result} | ${r.when} |`);
  return lines.join("\n");
}

// Passthrough vers CHECK-LEVEL-TARGET (accès "privilégié" direct, jamais une réimplémentation) —
// à appeler explicitement par l'agent pour classer UNE demande précise ; jamais invoqué tout seul
// dans runNetworkCheck() ci-dessous, qui n'a pas de texte de demande à classer. Même signature que
// classifyCheckLevel() elle-même (un seul paramètre) — la pression de registre et les nœuds
// sensibles récents restent la responsabilité de check-level-target.mjs (combineWithRegistryPressure/
// recentlyChangedSensitiveNodes), jamais dupliqués ici.
export function classifyRequest(requestText) {
  return classifyCheckLevel(requestText);
}

export function runNetworkCheck({ shImpl = sh } = {}) {
  const head = currentHead();
  const state = loadState();
  const duplicate = isDuplicateRun(state, head);
  const now = new Date().toISOString();
  const rows = [];

  // Un seul lancement de check-house.mjs, dont la couverture V8 nourrit AXA-CHECK — jamais un
  // second run (règle anti-doublon, §7ter), exactement le même principe que kpi-report.mjs.
  const covDir = mkdtempSync(join(tmpdir(), "coordinateur-cov-"));
  const testOut = shImpl("node scripts/check-house.mjs 2>&1", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const testsOk = !/AssertionError/.test(testOut);
  rows.push({ name: "check-house.mjs (suite de tests)", result: testsOk ? "ok" : "⚠️ à regarder", when: now });

  let coverageScore;
  try {
    const perFile = collectCoverage(covDir);
    coverageScore = robustnessScore(Object.values(perFile).flat());
  } finally {
    rmSync(covDir, { recursive: true, force: true });
  }
  rows.push({ name: "AXA-CHECK (couverture réelle par fonction)", result: coverageScore === undefined ? "N/A" : `${Math.round(coverageScore)}%`, when: now });

  const argusOut = shImpl("node scripts/check-argus.mjs", { cwd: ROOT });
  const argusSummary = summarizeArgusOutput(argusOut);
  rows.push({ name: "ARGUS (mécanique)", result: argusSummary.candidatsDetectes > 0 ? `à regarder (${argusSummary.candidatsDetectes} candidat(s))` : "ok", when: now });

  const harmoniaOut = shImpl("node scripts/check-harmonia.mjs", { cwd: ROOT });
  const harmoniaSummary = summarizeHarmoniaOutput(harmoniaOut);
  rows.push({ name: "HARMONIA (mécanique)", result: harmoniaSummary.frictions ? `à regarder (${harmoniaSummary.frictions} friction(s))` : "ok", when: now });

  const alwaysNewCodeIndexText = existsSync(ALWAYS_NEW_CODE_INDEX) ? readFileSync(ALWAYS_NEW_CODE_INDEX, "utf8") : "";
  const zone = recommendZone(THEMES, parseCoverage(alwaysNewCodeIndexText));
  rows.push({ name: "ALWAYS-NEW-CODE (préparation)", result: `zone recommandée : ${zone.zone}`, when: now });

  const lastTouchByFile = Object.fromEntries(Object.values(LIB_MAP).map((f) => [f, lastTouchDays(f)]));
  const staleness = relativeStaleness(lastTouchByFile);
  const staleCount = Object.values(staleness).filter((s) => s.stale).length;
  rows.push({ name: "CLEAN-DIRTY-OLD (repérage seul)", result: staleCount > 0 ? `à regarder (${staleCount} zone(s) stagnante(s))` : "ok", when: now });

  // Trouvaille réelle du 2026-09-19 : l'agent n'avait jamais consulté Smart Conso API avec
  // --confirm avant une action coûteuse. Ce garde-fou compare l'activité réelle déjà enregistrée
  // (.gemini-key-health.json) au carnet de session — sans dépendre de l'agent qui pense à le lancer.
  const healthPath = join(ROOT, ".gemini-key-health.json");
  const sessionPath = join(ROOT, ".smart-conso-session.json");
  const healthData = existsSync(healthPath) ? JSON.parse(readFileSync(healthPath, "utf8")) : { keys: {} };
  const sessionLog = existsSync(sessionPath) ? JSON.parse(readFileSync(sessionPath, "utf8")) : { actions: [] };
  const unconfirmedBursts = findUnconfirmedBursts(healthData, sessionLog);
  rows.push({ name: "Smart Conso API (salves jamais confirmées)", result: unconfirmedBursts.length > 0 ? `à regarder (${unconfirmedBursts.length} salve(s))` : "ok", when: now });

  saveState({ lastHead: head, lastWhen: now });
  return { duplicate, previousRun: state, rows };
}

function main() {
  const { duplicate, previousRun, rows } = runNetworkCheck();
  if (duplicate) {
    console.log(`⏭️  Aucun commit nouveau depuis le dernier passage complet (${previousRun.lastWhen}) — relancé quand même, purement informatif.\n`);
  }
  console.log("=== LE-COORDINATEUR — synthèse gratuite du réseau d'outils ===\n");
  console.log(formatTable(rows));
  console.log("\nCeci reste un tableau de synthèse, jamais un verdict : relire la sortie complète de l'outil concerné avant d'agir sur une ligne \"à regarder\" (cf. docs/regles-de-travail.md, aucun de ces outils n'est autonome).");
  console.log("Jamais déclenché ici : HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — toujours une décision explicite séparée, jamais une initiative du coordinateur.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
