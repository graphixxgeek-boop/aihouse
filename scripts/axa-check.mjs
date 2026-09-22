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

import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sh, printReliabilityNotice } from "./lib-shell.mjs";
import { SENSITIVE_NODES, LEVEL_ORDER } from "./check-level-target.mjs";
import { THEME_PRIMARY_FILE, parseNumstat, churnSignal } from "./always-new-code.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

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

// --- Profondeur de vérification par les outils (2026-09-19, demande explicite de l'utilisateur :
// « les zones couvertes par les outils + par des tests sont 100% safe le cas échéant ; les zones
// non couvertes ni par outils ni par tests sont à surveiller/à risque ; le degré des outils
// influence l'évaluation, la note maximale étant réservée aux checks approfondis (machine de
// guerre, ligne par ligne, maximal) »). Reprend l'échelle de CHECK-LEVEL-TARGET telle quelle
// (LEVEL_ORDER importé), jamais une seconde échelle inventée à côté (§7ter) — "aucun" est le seul
// palier ajouté ici, en dessous de "leger", pour représenter une zone jamais vérifiée par personne.
//
// Calibré explicitement avec l'utilisateur (2026-09-19) : c'est l'agent qui DÉCLARE lui-même, à
// chaque enregistrement, s'il vient de vérifier tout le fichier ou seulement une liste précise de
// fonctions — jamais un calcul automatique à partir d'un simple ratio, qui se tromperait sur des
// cas limites (ex. un petit fichier vraiment lu en entier mais dont seules les fonctions notables
// sont citées en exemple). Un garde-fou automatique rattrape seulement une déclaration "fichier
// entier" manifestement incohérente (moins de la moitié des fonctions réelles du fichier citées),
// pour ne jamais laisser une erreur gonfler artificiellement un niveau de confiance affiché.
export const DEPTH_ORDER = ["aucun", ...LEVEL_ORDER];
export const LEDGER_PATH = join(ROOT, "docs/axa-check/depth-checks.json");

export function loadDepthChecks(readFile = (f) => readFileSync(f, "utf8")) {
  try {
    const data = JSON.parse(readFile(LEDGER_PATH));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function saveDepthChecks(ledger) {
  mkdirSync(join(ROOT, "docs/axa-check"), { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

// Arbitrage fichier/portion : voir le commentaire de section ci-dessus pour le principe complet.
// `declaredScope` est ce que l'agent affirme avoir fait ("file" ou "functions") ; le garde-fou ne
// peut agir que s'il connaît à la fois la liste précise citée ET le total réel de fonctions du
// fichier — sans ces deux informations, la déclaration de l'agent reste seule source de vérité.
export function chooseCheckScope(declaredScope, reviewedFunctionNames, allFunctionsInFile) {
  if (declaredScope !== "file") return { granularity: "functions", functions: reviewedFunctionNames ?? [] };
  if (!reviewedFunctionNames?.length || !allFunctionsInFile?.length) return { granularity: "file" };
  const ratio = reviewedFunctionNames.length / allFunctionsInFile.length;
  // Seuil généreux (50%) : n'attrape qu'une incohérence flagrante, jamais un agent qui a réellement
  // tout lu mais n'a listé que quelques fonctions notables en exemple.
  if (ratio < 0.5) return { granularity: "functions", functions: reviewedFunctionNames, corrected: true };
  return { granularity: "file" };
}

// Enregistre une vérification réellement effectuée — jamais appelé automatiquement par un autre
// outil (Article 3/13 : seul un vrai passage humain/agent doit pouvoir alimenter ce registre).
export function recordCheck(file, depth, { declaredScope = "file", functions, allFunctionsInFile, note } = {}, shImpl = sh) {
  if (!DEPTH_ORDER.slice(1).includes(depth)) throw new Error(`Profondeur inconnue : "${depth}" (attendu : ${DEPTH_ORDER.slice(1).join("|")})`);
  const scope = chooseCheckScope(declaredScope, functions, allFunctionsInFile);
  const commit = shImpl(`git log -1 --format=%H -- ${file}`, { cwd: ROOT }).trim() || undefined;
  const record = { file, depth, granularity: scope.granularity, functions: scope.granularity === "functions" ? scope.functions : undefined, commit, date: new Date().toISOString(), note, corrected: scope.corrected || undefined };
  const ledger = loadDepthChecks();
  ledger.push(record);
  saveDepthChecks(ledger);
  return record;
}

// Péremption (2026-09-19, calibré explicitement : "caduque dès la prochaine modification") : un
// enregistrement ne reste valable que tant que le fichier n'a reçu aucun commit depuis — comparaison
// au commit RÉEL le plus récent touchant ce fichier précis (jamais HEAD global, qui avancerait pour
// des raisons sans rapport). Sans information de commit (ex. environnement de test), on fait
// confiance à l'enregistrement plutôt que de l'invalider à tort.
export function isRecordStillValid(record, shImpl = sh) {
  if (!record.commit) return true;
  const currentCommit = shImpl(`git log -1 --format=%H -- ${record.file}`, { cwd: ROOT }).trim();
  return currentCommit === record.commit;
}

// Profondeur actuellement valable pour une fonction donnée (ou "aucun") : le plus haut niveau
// encore valide parmi les enregistrements couvrant tout le fichier ou nommant explicitement cette
// fonction.
export function currentDepthFor(file, functionName, ledger, shImpl = sh) {
  const relevant = ledger.filter((r) => r.file === file && (r.granularity === "file" || (r.functions ?? []).includes(functionName)) && isRecordStillValid(r, shImpl));
  return relevant.reduce((best, r) => (DEPTH_ORDER.indexOf(r.depth) > DEPTH_ORDER.indexOf(best) ? r.depth : best), "aucun");
}

// Note combinée honnête (2026-09-19, calibré explicitement : jamais littéralement "100% safe", une
// réserve reste toujours visible dans le libellé — cf. la limite honnête déjà documentée en tête de
// ce fichier : une ligne exécutée ou relue n'est jamais une preuve absolue de correction). La note
// maximale n'est jamais donnée à un test seul ni à une vérification profonde seule : les deux axes
// doivent être réunis, et le niveau "exceptionnel" (machine de guerre/ligne par ligne/maximal) est
// seul à donner la toute meilleure note, "approfondi" donnant un palier juste en dessous.
export function safetyRating(covered, depth, { sensitiveNode = false, churnFlag = false } = {}) {
  if (covered && depth === "exceptionnel") return { tier: "confiance-maximale", label: "Confiance maximale — vérifié en profondeur et testé" };
  if (covered && depth === "approfondi") return { tier: "fiable", label: "Fiable — vérifié et testé" };
  if (covered) return { tier: "testé", label: "Testé, jamais vérifié en profondeur" };
  if (depth === "approfondi" || depth === "exceptionnel") return { tier: "à-surveiller", label: "À surveiller — vérifié en profondeur mais sans preuve de test automatique" };
  if (sensitiveNode || churnFlag) return { tier: "à-risque", label: `À risque — jamais vérifié (ni test ni contrôle), et ${sensitiveNode ? "proche d'un nœud sensible" : "sujet à une accumulation de code"}` };
  return { tier: "à-surveiller", label: "À surveiller — jamais vérifié par un test ni un contrôle" };
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

// Extension aux scripts/*.mjs des ~14 outils à badge (tâche #218, 2026-09-21, demande explicite de
// l'utilisateur : AXA-CHECK ne mesurait jusqu'ici que lib/*.ts+route.ts, jamais les outils de
// travail eux-mêmes). Calibrage explicite : information affichée à côté du badge, jamais une
// condition qui pourrait le faire perdre (checkAgentOnboarding() reste inchangé pour le badge
// lui-même). Contrairement à LIB_MAP (qui doit passer par l'indirection test-X.mjs des fichiers
// TypeScript transpilés par check-house.mjs), un script est déjà du JS pur, directement importé par
// check-house.mjs — son entrée V8 porte directement son vrai chemin, jamais un fichier intermédiaire
// à retrouver. Nommage non uniforme constaté (ARGUS → check-argus.mjs, THE-SCREENER →
// the-screener-capture.mjs) : une correspondance explicite, jamais déduite d'un slug.
export const AGENT_SCRIPT_FILES = {
  argus: "scripts/check-argus.mjs",
  harmonia: "scripts/check-harmonia.mjs",
  "smart-conso-api": "scripts/smart-conso-api.mjs",
  "check-level-target": "scripts/check-level-target.mjs",
  "hyper-scan-checkpoint": "scripts/hyper-scan-checkpoint.mjs",
  "always-new-code": "scripts/always-new-code.mjs",
  "axa-check": "scripts/axa-check.mjs",
  "clean-dirty-old": "scripts/clean-dirty-old.mjs",
  "el-professor": "scripts/el-professor.mjs",
  "the-screener": "scripts/the-screener-capture.mjs",
  "the-final-judge": "scripts/the-final-judge.mjs",
  "the-deep-reader": "scripts/the-deep-reader.mjs",
  "smart-conso-token": "scripts/smart-conso-token.mjs",
  "check-tasks-details": "scripts/check-tasks-details.mjs",
  "clone-hunter": "scripts/clone-hunter.mjs",
  // 6 entrées ajoutées le 2026-09-21 par le nouveau garde-fou findScriptsMissingFromAgentFiles()
  // (audit d'évolutivité) : ces Agents réels de la table maîtresse étaient invisibles à la
  // couverture AXA-CHECK et à la stagnation CASSANDRA-RH depuis leur construction, sans qu'aucun
  // signal ne le détecte — exactement le gap que ce garde-fou existe désormais pour prévenir.
  "the-king": "scripts/the-king.mjs",
  "ines-official": "scripts/ines-official.mjs",
  "memory-audit": "scripts/memento.mjs",
  "find-booster": "scripts/find-booster.mjs",
  "objectifs-vs-resultats": "scripts/objectifs-vs-resultats.mjs",
  "cassandra-rh": "scripts/cassandra-rh.mjs",
  "ecotoken": "scripts/ecotoken.mjs",
  // Smart Breaker (2026-09-22) : rejoint la couverture le jour où il est devenu un vrai Agent
  // certifié. Signalé instantanément par findScriptsMissingFromAgentFiles() dès le changement de
  // statut — le garde-fou de l'Article 24 faisant exactement ce pour quoi il a été écrit.
  // Point d'entrée réel de l'ensemble (4 fichiers), jamais un second chemin inventé.
  "smart-breaker": "scripts/check-gemini-quota.mjs",
  // Nom donné par l'utilisateur (« process.simulation.guardian »), d'où le slug en tirets qui en
  // dérive ; le fichier, lui, garde l'ordre habituel des noms de scripts de ce dépôt.
  "process-simulation-guardian": "scripts/process-simulation-guardian.mjs",
};

export function collectScriptCoverage(covDir, { readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8") } = {}) {
  const covFiles = existsSync(covDir) ? readDir(covDir) : [];
  const perSlug = {};
  for (const covFile of covFiles) {
    let data;
    try { data = JSON.parse(readFile(join(covDir, covFile))); } catch { continue; }
    for (const entry of data.result ?? []) {
      const match = Object.entries(AGENT_SCRIPT_FILES).find(([, path]) => entry.url.endsWith(path));
      if (!match) continue;
      const [slug, scriptPath] = match;
      if (perSlug[slug]) continue; // déjà vu dans un autre relevé de process
      let source;
      try { source = readFileSync(join(ROOT, scriptPath), "utf8"); } catch { continue; }
      perSlug[slug] = functionCoverageFromV8(entry, source);
    }
  }
  return perSlug;
}

export function scriptRobustnessScore(slug, perSlug) {
  const functions = perSlug?.[slug];
  if (!functions) return undefined;
  return robustnessScore(functions);
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
  printReliabilityNotice("axa-check");
  recordCliUsage("axa-check");
  const args = process.argv.slice(2);
  if (args[0] === "record-check") {
    const [, file, depth, ...functionNames] = args;
    if (!file || !DEPTH_ORDER.slice(1).includes(depth)) {
      console.log(`Usage: node scripts/axa-check.mjs record-check <fichier> <${DEPTH_ORDER.slice(1).join("|")}> [fonction1 fonction2 ...]`);
      console.log("Sans nom de fonction : déclare le fichier entier vérifié à cette profondeur. Avec des noms : déclare seulement ces fonctions précises.");
      process.exit(1);
    }
    const record = recordCheck(file, depth, { declaredScope: functionNames.length ? "functions" : "file", functions: functionNames.length ? functionNames : undefined });
    const scopeText = record.granularity === "functions" ? `sur : ${record.functions.join(", ")}` : "sur le fichier entier";
    console.log(`Enregistré : ${file} — profondeur "${depth}" ${scopeText}.`);
    if (record.corrected) console.log(`⚠️  Déclaration "fichier entier" ramenée à "fonctions listées" par le garde-fou : la liste fournie couvrait moins de la moitié des fonctions réelles du fichier.`);
    return;
  }

  const covDir = mkdtempSync(join(tmpdir(), "axa-check-"));
  sh("node scripts/check-house.mjs", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const perFile = collectCoverage(covDir);
  rmSync(covDir, { recursive: true, force: true });
  const archivedActions = loadArchivedSimulationActions();
  const ledger = loadDepthChecks();

  console.log("=== AXA-CHECK — robustesse et fragilité par fonction (zéro coût additionnel) ===\n");
  let totalFn = 0, totalCovered = 0;
  for (const [file, functions] of Object.entries(perFile)) {
    const score = robustnessScore(functions);
    totalFn += functions.length;
    totalCovered += functions.filter((f) => f.covered).length;
    console.log(`${file} : ${score === undefined ? "N/A" : Math.round(score) + "%"} (${functions.length} fonction(s))`);
    const numstat = sh(`git log --numstat --pretty=format:"" -- ${file}`, { cwd: ROOT });
    const churn = parseNumstat(numstat);
    const sensitiveNode = Boolean(SENSITIVE_NODES.find((n) => n.files.includes(file)));
    const churnFlag = Boolean(churnSignal(churn));
    // Note combinée (test réel + profondeur de vérification enregistrée) : silencieuse pour une
    // fonction simplement testée sans historique de vérification (déjà dite par le score ci-dessus),
    // affichée pour toute fonction non couverte OU couverte par un vrai audit approfondi enregistré.
    for (const f of functions) {
      const depth = currentDepthFor(file, f.name, ledger);
      if (depth === "aucun" && f.covered) continue;
      const rating = safetyRating(f.covered, depth, { sensitiveNode, churnFlag });
      console.log(`   [${rating.tier}] ${f.name} (ligne ${f.line}) — ${rating.label}`);
    }
    const fragile = fragileFunctions(functions, file, SENSITIVE_NODES, churn);
    for (const f of fragile) console.log(`   [détail] ${f.name} : ${f.reasons.join(", ")}`);
    if (fragile.length) {
      for (const zone of FILE_TO_ZONES[file] ?? []) {
        const n = corroboratedByArchivedSimulations(zone, archivedActions);
        if (n !== undefined) console.log(`   → zone "${zone}" : corroborée par ${n} simulation(s) archivée(s) réellement observée(s) (seconde preuve, moins précise que la couverture par test, cf. limite honnête).`);
      }
    }
  }
  console.log(`\nRobustesse globale (fonctions couvertes) : ${totalFn ? Math.round((totalCovered / totalFn) * 100) + "%" : "N/A"} sur ${totalFn} fonction(s) analysée(s).`);
  console.log(`\nPour enregistrer un audit approfondi réellement effectué : node scripts/axa-check.mjs record-check <fichier> <leger|standard|approfondi|exceptionnel> [fonctions...]`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
