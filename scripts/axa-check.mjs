// ICEBERG: membre
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
import { sh, printReliabilityNotice, scriptPourSlug } from "./lib-shell.mjs";
import { SENSITIVE_NODES, LEVEL_ORDER } from "./check-level-target.mjs";
import { THEME_PRIMARY_FILE, parseNumstat, churnSignal, churnSignalMesure } from "./always-new-code.mjs";
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";
import { mesurerCorpus, ligneCorpus } from "./corpus-mesure.mjs";

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

// ===========================================================================================
// LE TEST MODIFIÉ EN MÊME TEMPS QUE LE CODE QU'IL DEVAIT ATTRAPER  (2026-09-24)
// ===========================================================================================
//
// POURQUOI CE DÉTECTEUR EXISTE, et ce n'est pas une crainte théorique : le « trucage de test » est
// une faille DOCUMENTÉE des modèles de codage, y compris de la famille qui écrit ces lignes. Les
// formes observées sont toujours les mêmes — coder en dur la valeur attendue, ou modifier le
// fichier de test plutôt que de résoudre le problème. Le résultat passe au vert, et le vert est
// faux. C'est la même famille de défaut que les huit faux verts de la nuit du 2026-09-24, mais
// produit à l'envers : là on affichait un vert sans avoir regardé, ici on déplace la cible.
//
// LA RÈGLE DU PROJET EXISTAIT DÉJÀ — « jamais désactiver, sauter ou mettre en quarantaine un
// test » — et elle est exactement la bonne. Ce qui manquait, c'est qu'AUCUN mécanisme ne la
// vérifiait : elle reposait entièrement sur la mémoire de l'agent, ce que l'Article 27 interdit.
//
// CE QUE CE DÉTECTEUR N'AFFIRME JAMAIS. Modifier un test en même temps que le code est souvent
// parfaitement légitime : une fonctionnalité neuve arrive avec ses tests, un renommage touche les
// deux. Le signal est donc une QUESTION, jamais une accusation — et il ne se déclenche que sur le
// cas réellement suspect : le test a RÉTRÉCI (des assertions ont disparu) pendant que le code
// qu'il couvre changeait. Un test qui grossit avec son code est le comportement sain, et il ne
// dit rien. C'est la leçon L4 appliquée d'avance : un garde-fou qui accuse à tort cesse d'être lu.
export const MOTIF_ASSERTION = /\b(?:assert|expect)\s*[.(]/g;

export function compterAssertions(source = "") {
  return (String(source).match(MOTIF_ASSERTION) ?? []).length;
}

// Le rapport entre fichiers de test et fichiers de code est DÉRIVÉ du dépôt, jamais énuméré
// (Article 24) : un fichier est « de test » s'il porte le mot dans son nom ou s'il contient des
// assertions, et rien d'autre n'a besoin d'être déclaré pour qu'un test futur soit couvert.
export function estUnFichierDeTest(chemin = "", source = "") {
  return /(?:^|\/)(?:check-house|[\w.-]*\.?test|[\w.-]*\.?spec)[\w.-]*\.(?:mjs|js|ts|tsx)$/.test(chemin)
    || compterAssertions(source) >= 5;
}

// LE DÉTECTEUR. Il lit le DIFF du commit, jamais les fichiers entiers — et cette différence n'est
// pas un détail de performance : c'est la correction d'un faux positif trouvé au premier vrai
// passage (2026-09-24). Le premier jet lisait le contenu complet du fichier avant et après, puis
// comparait les comptes. Sur `check-house.mjs`, qui fait plus de dix mille lignes, la sortie de la
// commande est tronquée — et comme la version APRÈS est plus longue, elle perdait plus de contenu
// à la troncature. Résultat : l'outil a accusé un commit qui AJOUTAIT onze assertions d'en avoir
// supprimé cent vingt-quatre. Un faux positif parfait, et exactement le genre d'accusation à tort
// qui fait cesser de lire un garde-fou (leçon L4).
//
// Le diff, lui, ne contient que ce qui a changé : borné par construction, et il répond
// directement à la vraie question — combien d'assertions ce commit RETIRE-t-il, et combien
// ajoute-t-il.
export function findTestsAffaiblisAvecLeCode(commit = "HEAD", { shImpl = sh } = {}) {
  let fichiers = [];
  try {
    // `--first-parent` : sans lui, une FUSION rend zéro fichier et la fonction conclut « ce commit
    // ne touche aucun fichier de code lisible ». Honnête par accident — elle dit « pas mesurable »
    // plutôt que « rien trouvé » — mais faux quand même : les fichiers ÉTAIENT lisibles.
    fichiers = String(shImpl(`git show --name-only --format="" --first-parent ${commit}`) ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return { mesurable: false, cas: [],
      pourquoi: "le commit n'a pas pu être lu : sans son contenu, répondre « aucun test affaibli » serait affirmer une mesure qui n'a pas eu lieu" };
  }
  const sources = fichiers.filter((f) => /\.(?:mjs|js|ts|tsx)$/.test(f));
  if (!sources.length) {
    return { mesurable: false, cas: [],
      pourquoi: "ce commit ne touche aucun fichier de code lisible — rien à mesurer, ce qui n'est pas la même chose que rien à signaler" };
  }
  const tests = []; const codes = [];
  for (const f of sources) (/(?:^|\/)(?:check-house|[\w.-]*\.?test|[\w.-]*\.?spec)[\w.-]*\.(?:mjs|js|ts|tsx)$/.test(f) ? tests : codes).push(f);
  const cas = [];
  for (const f of tests) {
    let diff = "";
    try { diff = String(shImpl(`git show --format="" --unified=0 ${commit} -- ${f}`) ?? ""); } catch { continue; }
    let retirees = 0; let ajoutees = 0;
    for (const ligne of diff.split("\n")) {
      if (/^(?:\+\+\+|---)/.test(ligne)) continue;
      const n = compterAssertions(ligne.slice(1));
      if (ligne.startsWith("-")) retirees += n;
      else if (ligne.startsWith("+")) ajoutees += n;
    }
    if (retirees <= ajoutees) continue;   // un test qui grossit, ou qui se réécrit à l'identique, est le cas sain
    cas.push({ test: f, retirees, ajoutees, perdues: retirees - ajoutees,
      codeModifieEnMemeTemps: codes,
      question: codes.length
        ? `${f} retire ${retirees} assertion(s) pour n'en ajouter que ${ajoutees}, dans le même commit que ${codes.length} fichier(s) de code : suppression légitime, ou cible déplacée pour faire passer le vert ?`
        : `${f} retire ${retirees} assertion(s) pour n'en ajouter que ${ajoutees} : suppression légitime, ou garde-fou retiré ?` });
  }
  return { mesurable: true, cas, testsVus: tests.length, codesVus: codes.length,
    horsPortee: "je compte des assertions dans le diff, je ne lis aucune intention. Un test qui grossit ne dit rien ; seul un test qui retire plus qu'il n'ajoute pose la question. Et une suppression peut être parfaitement légitime — c'est une question, jamais une accusation." };
}

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
  // Dernier écrivain de registre à ne pas se déclarer, trouvé par findEcrivainsDeRegistreSansContribution()
  // le 2026-09-23 : le registre de couverture d'AXA-CHECK est relu à chaque Ronde et par CASSANDRA-RH.
  // L'écrire, c'est l'alimenter — le bénéficiaire se déduit du chemin, rien à nommer ici.
  recordRegistryWrite(LEDGER_PATH, { par: "axa-check" });
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
// `churnFlag` accepte désormais trois formes (2026-09-25, tâche #835) : une SÉVÉRITÉ
// (« probable » / « à surveiller »), `null` quand la mesure a été faite sans rien trouver ou n'a
// pas pu être faite, ou l'ancien booléen que ses appelants historiques passent encore. La sévérité
// est reprise telle quelle dans le libellé, au lieu d'être aplatie en « sujet à une accumulation ».
export function safetyRating(covered, depth, { sensitiveNode = false, churnFlag = false } = {}) {
  if (covered && depth === "exceptionnel") return { tier: "confiance-maximale", label: "Confiance maximale — vérifié en profondeur et testé" };
  if (covered && depth === "approfondi") return { tier: "fiable", label: "Fiable — vérifié et testé" };
  if (covered) return { tier: "testé", label: "Testé, jamais vérifié en profondeur" };
  if (depth === "approfondi" || depth === "exceptionnel") return { tier: "à-surveiller", label: "À surveiller — vérifié en profondeur mais sans preuve de test automatique" };
  if (sensitiveNode || churnFlag) {
    const cause = sensitiveNode
      ? "proche d'un nœud sensible"
      : `sujet à une accumulation de code${typeof churnFlag === "string" ? ` (${churnFlag})` : ""}`;
    return { tier: "à-risque", label: `À risque — jamais vérifié (ni test ni contrôle), et ${cause}` };
  }
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
// LE PARCOURS DES RELEVÉS V8, ÉCRIT UNE SEULE FOIS (2026-09-28, tâche #997). Les deux collectes —
// par fichier de lib, par slug d'outil — faisaient exactement la même chose à UNE ligne près : la
// façon de reconnaître, dans une entrée V8, ce qu'elle désigne. Tout le reste (lire le dossier,
// parser le JSON, ignorer un doublon de process, lire la source, mesurer) était dupliqué mot pour
// mot, et CLONE-HUNTER le signalait à chaque commit.
//
// CE QUI CHANGE ET CE QUI NE CHANGE PAS : la seule variable est `resoudre(entry)`, qui rend la CLÉ
// du résultat et le FICHIER à lire, ou null. Les deux comportements d'origine sont conservés à
// l'identique, y compris leurs deux façons différentes de reconnaître une URL — `includes` pour les
// libs (le chemin transpilé ne finit pas par le nom du fichier), `endsWith` pour les scripts. Les
// confondre aurait été une simplification qui change le résultat, donc pas une simplification.
export function collecterDepuisV8(covDir, resoudre, { readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8") } = {}) {
  const covFiles = existsSync(covDir) ? readDir(covDir) : [];
  const out = {};
  for (const covFile of covFiles) {
    let data;
    try { data = JSON.parse(readFile(join(covDir, covFile))); } catch { continue; }
    for (const entry of data.result ?? []) {
      const cible = resoudre(entry);
      if (!cible) continue;
      const { cle, fichier } = cible;
      if (out[cle]) continue; // déjà vu dans un autre relevé de process
      let source;
      try { source = readFileSync(join(ROOT, fichier), "utf8"); } catch { continue; }
      out[cle] = functionCoverageFromV8(entry, source);
    }
  }
  return out;
}

export function collectCoverage(covDir, options = {}) {
  return collecterDepuisV8(covDir, (entry) => {
    const base = Object.keys(LIB_MAP).find((k) => entry.url.includes(k));
    return base ? { cle: LIB_MAP[base], fichier: LIB_MAP[base] } : null;
  }, options);
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
export const SLUGS_COUVERTS_PAR_AXA = [
  "fils-de-discussion",
  "cout-de-la-refonte",
  "jesus-le-sauveur",
  "le-classificateur",
  "check-spirit",
  "check-suivi-fidelity",
  "circle-process-guardian",
  "safe-export",
  "tool-learning",
  "the-equalizer",
  "agent-des-noms",
  "agent-du-temps",
  "moise-tables-de-loi",
  "abraham-les-references",
  "filet-en-parts",
  "integration-outil",
  "argus",
  "harmonia",
  "smart-conso-api",
  "check-level-target",
  "hyper-scan-checkpoint",
  "always-new-code",
  "axa-check",
  "clean-dirty-old",
  "el-professor",
  "the-screener",
  "the-final-judge",
  "the-deep-reader",
  "smart-conso-token",
  "check-tasks-details",
  "clone-hunter",
  "the-king",
  "ines-official",
  "memory-audit",
  "find-booster",
  "objectifs-vs-resultats",
  "cassandra-rh",
  "ecotoken",
  "smart-breaker",
  "process-simulation-guardian",
  "angel-of-ia-process",
  "data-archangel",
];

// 2026-09-27, tâche #993 : la table était une MAP slug → chemin, recopiée entrée par entrée. Les
// chemins se DÉRIVENT désormais (`scriptPourSlug`, lib-shell) au lieu d'être écrits : sur les 68
// outils du registre de fiabilité, 57 ont pour script `scripts/<slug>.mjs`, et les 11 exceptions
// vivent à UN seul endroit, avec le garde-fou qui vérifie qu'elles pointent vers un fichier réel.
// Ce qui reste écrit ici est la seule chose propre à AXA-CHECK : la LISTE DES SLUGS, c'est-à-dire
// son PÉRIMÈTRE de mesure. Le dériver aussi reviendrait à décider tout seul que cet outil mesure
// désormais 68 scripts au lieu de 38 — un élargissement de ce qu'un Gardien sacré surveille, donc
// une décision qui revient à l'utilisateur, jamais à une factorisation.
// Vérifié : la dérivation reproduit les 38 chemins précédents à l'identique, aucun écart.
export const AGENT_SCRIPT_FILES = Object.fromEntries(SLUGS_COUVERTS_PAR_AXA.map((slug) => [slug, scriptPourSlug(slug)]));

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CE QUI NE POURRA JAMAIS ÊTRE EXERCÉ, ET POURQUOI (2026-09-28, tâche #994)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// CE REGISTRE PRÉPARE UNE DÉCISION QUI N'EST PAS LA MIENNE. Élargir le périmètre d'AXA-CHECK de 39 à
// 68 scripts est un élargissement de ce qu'un Gardien sacré surveille, donc une décision de
// l'utilisateur — le commentaire de SLUGS_COUVERTS_PAR_AXA le dit déjà, et il a raison. Ce qui EST
// de mon ressort, c'est de faire en sorte que cette décision, le jour où elle est prise, ne produise
// pas sept alertes indélogeables.
//
// LE DANGER MESURÉ : sur les 30 outils qui rejoindraient le périmètre, 23 sont réellement exercés
// par la suite de tests (gain immédiat) et 7 ne le sont JAMAIS. Sans ce registre, ces sept-là
// afficheraient une couverture manquante que AUCUN geste ne peut faire taire — le faux positif que
// la leçon L36 nomme, et qui transforme un garde-fou en décor (L6).
//
// QUATRE NE POURRONT JAMAIS L'ÊTRE, et la raison de chacun est écrite ici plutôt que sous-entendue,
// parce qu'une exemption sans raison n'est pas une décision, c'est un abandon déguisé (Article 28).
// Les trois autres sont des manques réels à combler, pas des exemptions : ils ne figurent pas ici.
export const JAMAIS_EXERCABLES = [
  { slug: "check-house", pourquoi: "c'est la suite de tests elle-même : elle ne peut pas s'exercer sous sa propre instrumentation sans se mesurer en train de se mesurer" },
  { slug: "sites-env", pourquoi: "il charge l'environnement du site ; l'exercer demanderait de démarrer le vrai runtime, ce qu'aucun test gratuit ne fait" },
  { slug: "run-framework", pourquoi: "il lance le PRODUIT, pas l'outillage — rang Hors Agence : le filet n'a rien à exercer chez lui" },
  { slug: "check-spirit", pourquoi: "chacun de ses passages envoie de vraies provocations au vrai modèle : l'exercer à chaque commit coûterait de vrais appels API (Articles 8 et 22). Et c'est précisément pour ça qu'il est resté CASSÉ du 2026-09-21 au 2026-09-27 sans que rien ne le dise — l'exemption est légitime, le trou qu'elle laisse est réel, et le déclarer EST la protection (Article 27)." },
  // AJOUTÉ LE 2026-09-29 (tâche #1215), et pour DEUX raisons qui tiennent chacune seule. D'abord
  // `check-gemini-quota.mjs` n'exporte RIEN : c'est un script à corps de premier niveau, ce que la
  // suite de tests documente déjà nommément ailleurs. Il n'y a littéralement aucune fonction à
  // importer, donc aucune à exercer — ce n'est pas un test qui manque, c'est une surface qui
  // n'existe pas. Ensuite son corps SONDE les clés pour de vrai : l'exercer coûterait des appels
  // API à chaque commit, exactement comme check-spirit juste au-dessus (Articles 8 et 22).
  //
  // LE TROU QU'ELLE LAISSE EST RÉEL, ET LE DIRE EST TOUTE LA PROTECTION (Article 27) : le jour de
  // la panne, cet outil est le premier qu'on lance, et rien ne garantit mécaniquement qu'il marche
  // encore. C'est précisément ce qui est arrivé à check-spirit, resté cassé six jours sans que rien
  // ne le dise. Deux gestes le couvrent malgré tout, et ils sont volontairement écrits ici plutôt
  // que supposés : la charte impose de le lancer à la main dès un blocage 429/503 répété, et sa
  // logique de fond — l'ordre des clés, la mémoire des échecs, la lecture des réponses — vit dans
  // gemini-key-health.mjs et api-providers.mjs, qui sont mesurés, eux.
  { slug: "smart-breaker", pourquoi: "check-gemini-quota.mjs n'exporte AUCUNE fonction (script à corps de premier niveau) et son corps sonde les clés pour de vrai : il n'y a rien à importer, et l'exercer coûterait des appels API à chaque commit. Le trou est réel — c'est l'outil du jour de la panne — et il est atténué par sa logique de fond, qui vit dans gemini-key-health.mjs et api-providers.mjs, mesurés eux" },
  // AJOUTÉ LE 2026-09-29 (tâche #1220). THE-SCREENER était l'outil le plus faiblement couvert du
  // paysage — 50 % — et le chiffre seul faisait lire « mal testé » là où la moitié non exercée est
  // `captureOnce()`, qui lance un vrai navigateur Chromium contre un serveur de développement qui
  // tourne. Aucun test gratuit ne fait ça, et l'exercer à chaque commit demanderait de démarrer le
  // produit. Sa moitié PURE, elle, est bien exerçable : elle vient de recevoir ses tests, sur les
  // trois branches de la page de capture.
  { slug: "the-screener", pourquoi: "sa moitié utile, captureOnce(), lance un vrai navigateur contre un serveur de développement qui tourne : aucun test gratuit ne fait ça, et l'exercer à chaque commit demanderait de démarrer le produit. Sa moitié pure — la page qui accompagne la capture, et l'arbitrage sur la fenêtre qu'on s'autorise à fermer — est exercée, elle" },
];

export function raisonDeNonExercice(slug, registre = JAMAIS_EXERCABLES) {
  return (registre.find((e) => e.slug === slug) ?? {}).pourquoi ?? null;
}

// TROIS ÉTATS, JAMAIS DEUX. « 0 % mesuré » dit que le code est exercé et mal couvert ; « jamais
// exercé » dit qu'on n'a rien pu mesurer. Les deux s'affichent pareil dans un tableau et appellent
// des gestes opposés — écrire un test, ou accepter une limite déclarée.
// LE GARDE-FOU DE LA LISTE TENUE À LA MAIN (Article 24). Elle est volontairement manuelle — savoir
// qu'un script ne PEUT pas être exercé demande de lire ce qu'il fait, et aucune sonde ne sait ça —
// mais une liste manuelle sans vérificateur se périme en silence : un slug renommé ou supprimé
// laisserait une exemption qui ne protège plus rien, et un jour réexemptera le mauvais fichier.
export function findExemptionsSansScript(registre = JAMAIS_EXERCABLES, { root = ROOT, existe = existsSync } = {}) {
  return registre
    .map((e) => ({ ...e, chemin: scriptPourSlug(e.slug) }))
    .filter((e) => !e.chemin || !existe(join(root, e.chemin)))
    .map((e) => ({ slug: e.slug, pourquoi: `« ${e.slug} » est exempté d'exercice mais aucun script ne porte ce nom : l'exemption ne protège plus rien et pourrait un jour couvrir le mauvais fichier` }));
}

// LE SECOND GARDE-FOU DE LA LISTE MANUELLE (2026-09-29, tâche #1215). Le premier vérifie que le
// script existe encore ; celui-ci vérifie que la RAISON tient encore. Une exemption qui s'appuie
// sur « ce script n'exporte aucune fonction » cesse d'être vraie le jour où quelqu'un y ajoute un
// export — et ce jour-là il y a une surface à tester, mais l'exemption continuerait de la couvrir
// en silence. Une raison qui se périme sans prévenir est pire qu'une absence de raison : elle a
// l'air d'une décision.
export const MOTIF_RAISON_SANS_EXPORT = /n'exporte AUCUNE fonction/i;
export const MOTIF_EXPORT_DE_FONCTION = /^export\s+(?:async\s+)?(?:function|const|let|class)\s/m;

export function findExemptionsDontLaRaisonADisparu(registre = JAMAIS_EXERCABLES, { root = ROOT, lireImpl = null } = {}) {
  const lire = lireImpl ?? ((c) => readFileSync(join(root, c), "utf8"));
  const out = [];
  for (const e of registre) {
    if (!MOTIF_RAISON_SANS_EXPORT.test(String(e.pourquoi ?? ""))) continue;
    const chemin = scriptPourSlug(e.slug);
    let source;
    try { source = lire(chemin); } catch { out.push({ slug: e.slug, pourquoi: `« ${e.slug} » est exempté au motif qu'il n'exporte rien, mais ${chemin} n'a pas pu être lu : la raison n'est ni confirmée ni démentie, et on ne la suppose pas` }); continue; }
    if (MOTIF_EXPORT_DE_FONCTION.test(source)) {
      out.push({ slug: e.slug, pourquoi: `« ${e.slug} » est exempté au motif qu'il n'exporte AUCUNE fonction — or ${chemin} en exporte désormais. Il y a une surface à tester, et l'exemption la couvrirait en silence` });
    }
  }
  return out;
}

export function etatDeCouverture(slug, perSlug, registre = JAMAIS_EXERCABLES) {
  const pct = scriptRobustnessScore(slug, perSlug);
  if (pct !== undefined) return { etat: "mesuré", pct };
  const raison = raisonDeNonExercice(slug, registre);
  if (raison) return { etat: "jamais exerçable", pct: null, pourquoi: raison };
  return { etat: "NON MESURÉ", pct: null, pourquoi: "aucun relevé de couverture ne l'a vu passer — ce n'est PAS une couverture de 0 %, c'est une absence de mesure, et les deux appellent des gestes opposés" };
}



export function collectScriptCoverage(covDir, options = {}) {
  return collecterDepuisV8(covDir, (entry) => {
    const match = Object.entries(AGENT_SCRIPT_FILES).find(([, path]) => entry.url.endsWith(path));
    return match ? { cle: match[0], fichier: match[1] } : null;
  }, options);
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
  // LA COUVERTURE DES OUTILS SE LIT DANS LE MÊME RELEVÉ, ET ELLE NE SE LISAIT NULLE PART
  // (2026-09-29, tâche #1189).
  //
  // LE DÉFAUT, EN DEUX TEMPS, ET AUCUN DES DEUX NE SE VOIT À LA LECTURE. Plus bas, la couverture
  // des outils était collectée depuis `.sites-runtime/axa-coverage` — un dossier que **rien dans
  // ce dépôt n'écrit** : une seule occurrence du chemin, celle qui le LIT. Et même en le pointant
  // vers le bon dossier, `covDir` était supprimé ici, cent lignes avant d'être relu.
  //
  // CONSÉQUENCE MESURÉE : « 39 outils NON MESURÉS sur 40 », à chaque passage, depuis la création de
  // cette mesure. Le commentaire de la section disait pourtant, exactement : « le relevé de
  // couverture est produit par le filet de sécurité sous NODE_V8_COVERAGE ». C'était vrai — et ce
  // relevé-là, produit trois lignes plus haut, personne n'allait le chercher. Un AUTRE dossier
  // était lu à sa place. C'est la leçon L2 dans un Gardien sacré : un mécanisme qu'on ne peut pas
  // alimenter n'existe pas, et son « NON MESURÉ » permanent finit par se lire comme du décor (L6).
  //
  // Le relevé V8 contient TOUT ce que le processus a chargé — `scripts/` autant que `lib/` — donc
  // la seconde collecte ne coûte pas un second lancement du filet : elle relit le même dossier.
  const perSlugOutils = collectScriptCoverage(covDir);
  rmSync(covDir, { recursive: true, force: true });
  const archivedActions = loadArchivedSimulationActions();
  const ledger = loadDepthChecks();

  printReportHeader({ tool: "axa-check", title: "AXA-CHECK — robustesse et fragilité par fonction (zéro coût additionnel)", scriptPath: "scripts/axa-check.mjs" });
  // LE CORPUS AVANT TOUT VERDICT (2026-09-25, chantier #206). Le cas d'AXA-CHECK est le plus
  // traître des sept, parce que son corpus n'est pas une liste de fichiers du dépôt mais le
  // résultat d'une EXÉCUTION : la couverture V8 produite en lançant check-house. Si ce lancement
  // échoue à moitié — un test qui plante tôt, un dossier de couverture incomplet — le rapport
  // continue de sortir, avec moins de fichiers et le même air d'être complet. Le nombre attendu
  // est donc déclaré à côté du nombre lu, pour qu'un corpus AMPUTÉ se voie au lieu de passer pour
  // un corpus propre.
  const fichiersCouverts = Object.keys(perFile);
  console.log(ligneCorpus(mesurerCorpus(fichiersCouverts, {
    quoi: "la couverture produite par l'exécution de check-house",
    // LIB_MAP SEUL, et l'erreur vaut d'être gardée : mon premier jet additionnait LIB_MAP (22) et
    // AGENT_SCRIPT_FILES (34), ce qui a produit « 22 analysés sur 56 attendus — le verdict ne
    // couvre pas les 34 manquants ». Un FAUX ROUGE, dans le module écrit pour empêcher les faux
    // verts. Les scripts d'Agents ont leur propre collecteur (`collectScriptCoverage`), donc ils
    // ne manquent pas ici : ils sont comptés ailleurs. Mesuré plutôt que supposé — 22 attendus,
    // 22 vus. Un dénominateur qui agrège deux populations collectées séparément est aussi faux
    // qu'un dénominateur absent, et il a l'air plus sérieux.
    attendus: Object.keys(LIB_MAP).length,
    pourquoiVide: "l'exécution de check-house n'a produit aucune donnée de couverture — tout verdict de robustesse porterait sur zéro fonction",
  }), { nomDuGardien: "AXA-CHECK" }));
  let totalFn = 0, totalCovered = 0;
  const fragilesTousFichiers = [];
  for (const [file, functions] of Object.entries(perFile)) {
    const score = robustnessScore(functions);
    totalFn += functions.length;
    totalCovered += functions.filter((f) => f.covered).length;
    console.log(`${file} : ${score === undefined ? "N/A" : Math.round(score) + "%"} (${functions.length} fonction(s))`);
    const numstat = sh(`git log --numstat --pretty=format:"" -- ${file}`, { cwd: ROOT });
    const churn = parseNumstat(numstat);
    const sensitiveNode = Boolean(SENSITIVE_NODES.find((n) => n.files.includes(file)));
    // TROIS ÉTATS, pas un booléen (2026-09-25, tâche #835). `Boolean(churnSignal(...))` écrasait
    // « probable », « à surveiller » ET « aucune donnée git » — le dernier devenant `false`,
    // c'est-à-dire indistinguable d'un « mesuré, rien trouvé ». Un faux vert de plus, dans l'outil
    // dont le métier est précisément de dire ce qui n'est pas vérifié.
    const churnMesure = churnSignalMesure(churn);
    const churnFlag = churnMesure.mesurable ? churnMesure.signal : null;
    if (!churnMesure.mesurable) console.log(`   ⚪ accumulation NON MESURÉE — ${churnMesure.pourquoi}`);
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
    for (const f of fragile) fragilesTousFichiers.push({ ...f, fichier: file });
    if (fragile.length) {
      for (const zone of FILE_TO_ZONES[file] ?? []) {
        const n = corroboratedByArchivedSimulations(zone, archivedActions);
        if (n !== undefined) console.log(`   → zone "${zone}" : corroborée par ${n} simulation(s) archivée(s) réellement observée(s) (seconde preuve, moins précise que la couverture par test, cf. limite honnête).`);
      }
    }
  }
  console.log(`\nRobustesse globale (fonctions couvertes) : ${totalFn ? Math.round((totalCovered / totalFn) * 100) + "%" : "N/A"} sur ${totalFn} fonction(s) analysée(s).`);
  // LE PLAN D'ACTION (2026-09-23, Article 28). AXA-CHECK est un Gardien sacré, donc son plan est
  // prioritaire par dérivation : une fonction fragile dans une zone sensible, c'est du code qui peut
  // casser sans qu'aucun test ne le dise.
  //
  // `fausseUneMesure: true`, et ce n'est pas un détail de forme : une fonction non couverte gonfle
  // silencieusement le score de robustesse global que TOUT le reste du paysage consulte comme un
  // fait. Ce n'est pas seulement du code fragile, c'est un indicateur faux.
  //
  // LE PREMIER USAGE RÉEL DE LA CONCORDANCE À DEUX OUTILS (2026-09-28, tâche #695, volet E). Une
  // fonction fragile PROCHE D'UN NŒUD SENSIBLE est le constat le plus grave que rend cet outil :
  // du code non testé, là où une casse se propage, et qui fausse en plus le score de robustesse que
  // tout le paysage consulte. C'est donc `critique`.
  //
  // ET LA SECONDE SOURCE EXISTE DÉJÀ, elle n'a pas été inventée pour l'occasion : la liste des
  // nœuds sensibles vient de `check-level-target`, qui la DÉRIVE de la carte d'HARMONIA et dont
  // l'écart est vérifié mécaniquement (`findSensitiveNodesDivergingFromHarmonia()`, 2026-09-21).
  // La gravité de ce constat est donc établie par un outil AUTRE que celui qui la rapporte —
  // exactement ce que le volet E demande, et la raison pour laquelle ce cas a été choisi comme
  // premier usage plutôt qu'un cas fabriqué pour faire tourner le mécanisme (leçon L2 : un
  // mécanisme qui ne sort pas du script est une intention ; un mécanisme câblé sur un cas inventé
  // est pire, il a l'air de marcher).
  const prochesDunNoeudSensible = (f) => (f?.reasons ?? []).some((r) => /nœud sensible/.test(String(r)));
  const planAxa = planDactionDepuisEcarts(fragilesTousFichiers, { toolSlug: "axa-check", fausseUneMesure: true,
    libelle: (f) => `${f.fichier} — ${f.name}() : ${f.reasons.join(", ")}`,
    critique: prochesDunNoeudSensible,
    corrobore: (f) => (prochesDunNoeudSensible(f)
      ? { outil: "harmonia", constat: "le nœud sensible qui rend ce constat grave vient de la carte HARMONIA, dérivée et vérifiée contre elle — jamais d'une liste tenue ici" }
      : null),
    tache: (f) => `écrire un test réel pour ${f.name}() dans ${f.fichier}, ou déclarer sa vérification via record-check si elle a été faite à la main` });
  imprimerPlanDaction(planAxa);

  // LES TROIS ÉTATS DE COUVERTURE DES OUTILS (2026-09-28, tâche #994), imprimés ici plutôt que
  // gardés en fonction exportée : un mécanisme que personne ne lance n'existe pas (leçon L2), et
  // `findDetecteursMuets` l'aurait signalé au commit suivant — à juste titre.
  {
    const etats = SLUGS_COUVERTS_PAR_AXA.map((slug) => ({ slug, ...etatDeCouverture(slug, perSlugOutils) }));
    const mesures = etats.filter((e) => e.etat === "mesuré");
    const exemptes = etats.filter((e) => e.etat === "jamais exerçable");
    const nonMesures = etats.filter((e) => e.etat === "NON MESURÉ");
    console.log(`\n--- Couverture des OUTILS : ${mesures.length} mesuré(s) · ${exemptes.length} jamais exerçable(s) · ${nonMesures.length} NON MESURÉ(s), sur ${etats.length} ---`);
    console.log("  Les trois ne se confondent jamais : « 0 % mesuré » dit que le code est exercé et mal couvert ; « jamais exerçable » dit qu'on ne pourra JAMAIS rien mesurer ; « NON MESURÉ » dit qu'on n'a rien mesuré cette fois, et c'est le seul des trois qui est un trou à combler.");
    for (const e of exemptes) console.log(`  ⬜ ${e.slug} — ${e.pourquoi}`);
    // LES MESURÉS N'ÉTAIENT IMPRIMÉS NULLE PART, et ça ne se voyait pas tant qu'il n'y en avait
    // AUCUN (2026-09-29, tâche #1189). La section ne montrait que les problèmes — parfaitement
    // raisonnable quand la mesure était vide, absurde le jour où elle marche : trente-neuf outils
    // mesurés produisaient zéro ligne, et la réparation restait invisible dans son propre rapport.
    // On imprime donc les PLUS FAIBLES d'abord, qui sont la seule information actionnable, et le
    // nombre total, qui dit que la mesure a bien eu lieu.
    if (mesures.length) {
      const parPct = [...mesures].sort((a, b) => a.pct - b.pct);
      console.log(`  ${mesures.length} outil(s) réellement mesuré(s). Les plus faiblement couverts d'abord — c'est la seule partie actionnable :`);
      for (const e of parPct.slice(0, 10)) {
        // UNE LIMITE DÉCLARÉE NE DISPARAÎT PAS SOUS UN CHIFFRE. `check-spirit` est déclaré
        // inexerçable parce que sa partie utile coûte de vrais appels API ; ses fonctions pures,
        // elles, sont bien exercées et se mesurent. Les deux sont vrais et disent deux choses
        // différentes : afficher le seul pourcentage ferait lire « mal couvert » là où une part du
        // code ne PEUT pas être couverte ici. Le nombre et la raison voyagent donc ensemble.
        const limite = raisonDeNonExercice(e.slug);
        console.log(`    ${String(Math.round(e.pct)).padStart(3)} %  ${e.slug}${limite ? ` — ⬜ part déclarée inexerçable : ${limite}` : ""}`);
      }
      if (parPct.length > 10) console.log(`    … et ${parPct.length - 10} autre(s), mieux couvert(s).`);
    }
    // AUCUNE MESURE DU TOUT N'EST UNE SEULE INFORMATION, jamais trente-huit. Le relevé de couverture
    // est produit par le filet de sécurité sous NODE_V8_COVERAGE ; lancé seul, cet outil n'en a
    // aucun, et lister alors tous les outils un par un donnerait l'impression de trente-huit trous
    // là où il n'y en a qu'un : le relevé manque. La cause est dite, pas la conséquence répétée.
    if (nonMesures.length === etats.length - exemptes.length) {
      console.log(`  ❓ AUCUN relevé de couverture n'a été lu : les ${nonMesures.length} restants sont NON MESURÉS pour une seule et même raison, pas pour ${nonMesures.length}. Le relevé se produit en lançant le filet sous NODE_V8_COVERAGE — ce n'est donc pas trente-huit trous, c'est une mesure absente.`);
    } else if (nonMesures.length) {
      console.log(`  ❓ NON MESURÉ : ${nonMesures.map((e) => e.slug).join(", ")}`);
    }
    const exemptionsMortes = findExemptionsSansScript();
    for (const x of exemptionsMortes) console.log(`  🚨 ${x.pourquoi}`);
    // La raison d'une exemption se périme aussi, pas seulement son fichier (2026-09-29, #1215).
    for (const x of findExemptionsDontLaRaisonADisparu()) console.log(`  🚨 ${x.pourquoi}`);
  }

  console.log(`\nPour enregistrer un audit approfondi réellement effectué : node scripts/axa-check.mjs record-check <fichier> <leger|standard|approfondi|exceptionnel> [fonctions...]`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
