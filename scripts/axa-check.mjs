// AXA-CHECK — robustesse et fragilité par fonction (2026-09-19, cf. docs/axa-check-blueprint.md et
// docs/referentiel/axa-check.md). Né d'une question directe de l'utilisateur pendant le calibrage
// de CLEAN-DIRTY-OLD : « comment sait-on si une zone du code est couverte ou pas par un test ? » —
// aucun outil ne répondait à ça avant ce jour. Spin-off en outil à part (pas une brique interne de
// CLEAN-DIRTY-OLD) sur décision explicite de l'utilisateur, pour que tout le réseau (CLEAN-DIRTY-OLD,
// ALWAYS-NEW-CODE, HYPER-SCAN-CHECKPOINT) le consulte plutôt que chacun réinvente sa propre mesure
// de couverture — exactement la règle anti-doublon de docs/regles-de-travail.md §7ter.
//
// Mécanique centrale, zéro nouvelle dépendance : Node expose déjà une vraie couverture V8
// (NODE_V8_COVERAGE) pour N'IMPORTE QUEL processus, et check-house.mjs transpile déjà lib/*.ts
// avec le vrai compilateur TypeScript (ts.transpileModule), qui préserve les numéros de ligne —
// la couverture obtenue sur les fichiers transpilés (.sites-runtime/test-*.mjs) se réaligne donc
// fiablement avec le code source réel, sans avoir besoin d'un outil de couverture tiers.
//
// Limite honnête, comme toujours : une ligne EXÉCUTÉE par un test n'est pas une ligne PROUVÉE
// juste. AXA-CHECK mesure un signal de robustesse, jamais une garantie de correction.

import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh } from "./lib-shell.mjs";
import { SENSITIVE_NODES } from "./check-level-target.mjs";
import { THEME_PRIMARY_FILE, parseNumstat, churnSignal } from "./always-new-code.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// --- Couverture réelle par fonction, extraite d'un relevé V8 -------------------------------

// Le premier élément de functions[] de V8 est toujours le pseudo-appel "script entier" (nom vide)
// — jamais une vraie fonction nommée, toujours exclu (granularité "par fonction", décision
// explicite de l'utilisateur). Une fonction anonyme/fléchée non nommée par V8 est honnêtement
// exclue elle aussi plutôt que rapportée sous un nom vide trompeur — limite connue, cf. blueprint.
export function functionCoverageFromV8(covEntry, sourceText) {
  if (!covEntry?.functions) return [];
  const lineOf = (offset) => sourceText.slice(0, offset).split("\n").length;
  return covEntry.functions
    .filter((f) => f.functionName)
    .map((f) => ({
      name: f.functionName,
      line: lineOf(f.ranges[0].startOffset),
      covered: f.ranges[0].count > 0,
    }));
}

export function robustnessScore(functions) {
  if (!functions || !functions.length) return undefined;
  const covered = functions.filter((f) => f.covered).length;
  return (covered / functions.length) * 100;
}

// --- Fragilité enrichie, jamais un simple miroir de la robustesse (décision explicite) ------

export function fragileFunctions(functions, file, sensitiveNodes = SENSITIVE_NODES, churn) {
  const sensitiveNode = sensitiveNodes.find((n) => n.files.includes(file));
  const churnFlag = churnSignal(churn);
  return functions
    .filter((f) => !f.covered)
    .map((f) => {
      const reasons = ["jamais exécutée par un test"];
      let confidence = "à surveiller";
      if (sensitiveNode) { reasons.push(`proche du nœud sensible "${sensitiveNode.node}"`); confidence = "probable"; }
      if (churnFlag) { reasons.push(`historique d'accumulation (${churnFlag})`); confidence = "probable"; }
      return { name: f.name, line: f.line, confidence, reasons };
    });
}

// --- Seconde preuve : corroboration par les simulations archivées (zone, pas fonction) ------

// Limite honnête, à ne jamais masquer : docs/simulations/*_actions.txt ne trace que des
// événements discrets (bonus, déplacements, révélation, jardin, preuves) — jamais un appel de
// fonction précis. La corroboration se fait donc au niveau ZONE (les mêmes thèmes qu'ALWAYS-NEW-
// CODE/HARMONIA), jamais au niveau fonction — plus grossier, mais honnête sur ce qu'il prouve
// réellement.
// Format réel d'une ligne d'événement (scripts/summarize-simulation-log.mjs::formatSummary) :
// "  [round N] TYPE — détail" ou "  [round N] TYPE" sans détail — jamais un "type: X" explicite.
// Bug réel trouvé et corrigé le jour même : la première version de ces motifs cherchait un mot
// "type" qui n'apparaît nulle part dans le vrai texte, donnant 0 corroboration partout, y compris
// sur des simulations où l'événement s'est bien produit — vérifié en confrontant le motif au vrai
// fichier archivé, jamais supposé correct sur la seule lecture du code qui l'a écrit.
const ZONE_EVENT_HINTS = {
  "Bonus roulette": /\]\s*bonus\b/i,
  "Enquête": /\]\s*evidence\b/i,
  "Dossier retourné": /Dossier retourné rempli : oui/i,
  "Déplacements/espace": /\]\s*move\b/i,
};

export function corroboratedByArchivedSimulations(zone, actionFilesContents) {
  const hint = ZONE_EVENT_HINTS[zone];
  if (!hint || !actionFilesContents?.length) return undefined;
  return actionFilesContents.filter((text) => hint.test(text)).length;
}

// --- Orchestration : lit un dossier NODE_V8_COVERAGE déjà produit, mappe vers le vrai code ---

// La liste complète des fichiers transpilés par check-house.mjs lui-même (Article 13 : cette liste
// doit rester synchronisée avec celle de check-house.mjs, jamais recopiée une fois puis laissée
// dériver — un fichier absent d'ici serait invisible pour AXA-CHECK sans jamais un avertissement,
// exactement le genre d'angle mort silencieux que ce projet refuse).
export const LIB_MAP = Object.fromEntries([
  "house", "simulation", "relationship", "dialogue", "story", "lia", "world", "turn", "life",
  "drama", "perception", "visual-events", "stock", "presentation", "playback", "evidence",
  "reference", "update-audit", "gemini-keys", "daynight", "quality-metrics",
].map((name) => [`test-${name}.mjs`, `lib/${name}.ts`]));
LIB_MAP["test-route.mjs"] = "app/api/lia/route.ts";

// Lit un dossier de relevés NODE_V8_COVERAGE déjà produit — par AXA-CHECK lui-même, ou par
// kpi-report.mjs qui lance déjà check-house.mjs pour ses propres métriques et peut réutiliser CE
// MÊME lancement plutôt que d'en payer un second (règle anti-doublon, §7ter). N'efface jamais le
// dossier lui-même — à la charge de l'appelant, qui sait s'il en a encore besoin.
export function collectCoverage(covDir, { readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8") } = {}) {
  const covFiles = existsSync(covDir) ? readDir(covDir) : [];
  const perFile = {};
  for (const covFile of covFiles) {
    let data;
    try { data = JSON.parse(readFile(join(covDir, covFile))); } catch { continue; }
    for (const entry of data.result ?? []) {
      const base = Object.keys(LIB_MAP).find((k) => entry.url.includes(k));
      if (!base) continue;
      const libFile = LIB_MAP[base];
      if (perFile[libFile]) continue; // déjà vu dans un autre relevé de process
      let source;
      try { source = readFileSync(join(ROOT, libFile), "utf8"); } catch { continue; }
      perFile[libFile] = functionCoverageFromV8(entry, source);
    }
  }
  return perFile;
}

// Inversion de THEME_PRIMARY_FILE (zone → fichier) en fichier → zone, pour ne jamais tenir une
// seconde carte séparée (règle anti-doublon, §7ter) — un fichier peut appartenir à plusieurs zones.
// Exportée pour que CLEAN-DIRTY-OLD la réutilise telle quelle plutôt que de la reconstruire une
// seconde fois (même règle).
export const FILE_TO_ZONES = {};
for (const [zone, file] of Object.entries(THEME_PRIMARY_FILE)) {
  (FILE_TO_ZONES[file] ??= []).push(zone);
}

function loadArchivedSimulationActions() {
  const dir = join(ROOT, "docs/simulations");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith("_actions.txt"))
    .map((f) => readFileSync(join(dir, f), "utf8"));
}

function main() {
  const covDir = mkdtempSync(join(tmpdir(), "axa-check-"));
  sh("node scripts/check-house.mjs", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const perFile = collectCoverage(covDir);
  rmSync(covDir, { recursive: true, force: true });
  const archivedActions = loadArchivedSimulationActions();

  console.log("=== AXA-CHECK — robustesse et fragilité par fonction (zéro coût additionnel) ===\n");
  let totalFn = 0, totalCovered = 0;
  for (const [file, functions] of Object.entries(perFile)) {
    const score = robustnessScore(functions);
    totalFn += functions.length;
    totalCovered += functions.filter((f) => f.covered).length;
    console.log(`${file} : ${score === undefined ? "N/A" : Math.round(score) + "%"} (${functions.length} fonction(s))`);
    const numstat = sh(`git log --numstat --pretty=format:"" -- ${file}`, { cwd: ROOT });
    const fragile = fragileFunctions(functions, file, SENSITIVE_NODES, parseNumstat(numstat));
    for (const f of fragile) console.log(`   [${f.confidence}] ${f.name} (ligne ${f.line}) — ${f.reasons.join(", ")}`);
    if (fragile.length) {
      for (const zone of FILE_TO_ZONES[file] ?? []) {
        const n = corroboratedByArchivedSimulations(zone, archivedActions);
        if (n !== undefined) console.log(`   → zone "${zone}" : corroborée par ${n} simulation(s) archivée(s) réellement observée(s) (seconde preuve, moins précise que la couverture par test, cf. limite honnête).`);
      }
    }
  }
  console.log(`\nRobustesse globale (fonctions couvertes) : ${totalFn ? Math.round((totalCovered / totalFn) * 100) + "%" : "N/A"} sur ${totalFn} fonction(s) analysée(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
