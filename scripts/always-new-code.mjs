// ALWAYS-NEW-CODE — dette d'organisation (2026-09-19, cf. docs/always-new-code-blueprint.md et
// docs/referentiel/always-new-code.md). Rend concret l'Article 7 ("l'épreuve de la page blanche") :
// imaginer comment on reconstruirait une zone du projet en repartant de zéro, avec toute la
// connaissance qu'on a aujourd'hui, en s'intéressant d'abord aux GRANDS AXES — puis comparer
// point par point à la structure réelle pour repérer la dette d'organisation ("empilement" : du
// code qui marche mais qui a grandi par ajouts successifs plutôt que par conception).
//
// Distinct d'ARGUS (absences) et HARMONIA (frictions) : un troisième axe, la qualité
// d'organisation. Rôle de CE script : la rotation des zones, les indices mécaniques d'empilement,
// et le suivi KPI — jamais la couche "zoom profond" elle-même (imaginer une structure idéale est
// un raisonnement, seul l'agent appelant peut le faire, exactement comme la checklist qualitative
// d'HYPER-SCAN-CHECKPOINT).
//
// Limite honnête, comme pour tous les outils de raisonnement de ce projet (ARGUS, HARMONIA,
// CHECK-LEVEL-TARGET, HYPER-SCAN-CHECKPOINT) : jamais un résultat "exact à 100 %" — une
// proposition de restructuration est un jugement architectural, toujours rendu avec un palier de
// confiance (confirmé / probable / à surveiller), jamais une certitude absolue (confirmé
// explicitement avec l'utilisateur le 2026-09-19).

import { statSync, readFileSync, existsSync } from "node:fs";
import { dataRows, numericColumn } from "./lib-markdown-table.mjs";
import { join } from "node:path";
import { sh, printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const INDEX_PATH = join(ROOT, "docs/always-new-code/index.md");

// Les mêmes 8 grands thèmes que la carte de dépendances d'HARMONIA (docs/referentiel/harmonia.md)
// — réutilisés tels quels plutôt qu'un second découpage du projet (décision explicite de
// l'utilisateur, 2026-09-19 : « réutiliser les thèmes d'HARMONIA »). Toute évolution de cette
// liste doit rester synchronisée avec harmonia.md (Article 13).
export const THEMES = [
  "Fatigue",
  "Cycle jour/nuit",
  "Enquête",
  "Bonus roulette",
  "Appréciation de l'observateur",
  "Dossier retourné",
  "Déplacements/espace",
  "Relation Lia/Noé",
];

// Garde-fou de fraîcheur (2026-09-21, audit d'évolutivité demandé par l'utilisateur : « on a une
// liste copiée à la main, ça peut diverger sans qu'on le sache ») — le commentaire ci-dessus
// promettait une synchronisation avec harmonia.md depuis la création de THEMES (2026-09-19) sans
// qu'aucune vérification mécanique n'existe : exactement la même classe de bug que la dérive
// CLONE-HUNTER trouvée le même soir. `extractHarmoniaThemes()` relit tel quel le texte de
// harmonia.md (jamais un second découpage inventé), `findThemesDivergingFromHarmonia()` rapporte
// les deux sens de l'écart (un thème d'HARMONIA absent d'ici, ou l'inverse), jamais un seul sens
// silencieusement privilégié — même discipline que EL-PROFESSOR (missing/orphan) et HARMONIA
// (findRegistriesMissingFromCircle).
export function extractHarmoniaThemes(harmoniaMdText) {
  const text = String(harmoniaMdText ?? "");
  const start = text.indexOf("## La carte des dépendances, par grand thème");
  if (start === -1) return [];
  const rest = text.slice(start + 1);
  const nextHeading = rest.search(/\n## /);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const themes = [];
  for (const m of section.matchAll(/^- \*\*([^*]+)\*\*/gm)) themes.push(m[1].trim());
  return themes;
}

export function findThemesDivergingFromHarmonia(harmoniaMdText, themes = THEMES) {
  const harmoniaThemes = extractHarmoniaThemes(harmoniaMdText);
  const themeSet = new Set(themes);
  const harmoniaSet = new Set(harmoniaThemes);
  return {
    missingFromThemes: harmoniaThemes.filter((t) => !themeSet.has(t)),
    missingFromHarmonia: themes.filter((t) => !harmoniaSet.has(t)),
  };
}

// Un fichier principal par thème, pour l'indice git optionnel ci-dessous — approximatif et
// honnêtement incomplet (plusieurs fichiers touchent souvent le même thème) : à affiner avec
// l'usage réel, comme les signaux de CHECK-LEVEL-TARGET (jamais figé une fois pour toutes).
export const THEME_PRIMARY_FILE = {
  "Fatigue": "lib/simulation.ts",
  "Cycle jour/nuit": "lib/daynight.ts",
  "Enquête": "lib/evidence.ts",
  "Bonus roulette": "lib/life.ts",
  "Appréciation de l'observateur": "app/api/lia/route.ts",
  "Dossier retourné": "app/api/lia/route.ts",
  "Déplacements/espace": "lib/house.ts",
  "Relation Lia/Noé": "lib/relationship.ts",
};

// --- Mémoire de couverture (rotation intelligente) ------------------------------------------

// Lit le tableau de docs/always-new-code/index.md et retourne, pour chaque thème déjà passé en
// zoom profond, la date ISO de son dernier passage (la plus récente si plusieurs lignes). Un
// thème absent du tableau est honnêtement absent du résultat (jamais une date inventée) — c'est
// ce qui le rend prioritaire pour la rotation.
export function parseCoverage(indexText) {
  const coverage = {};
  const dataRows = indexText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Zone examinée"));
  for (const row of dataRows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    const [date, zone] = cells;
    if (!date || !zone) continue;
    if (!coverage[zone] || date > coverage[zone]) coverage[zone] = date;
  }
  return coverage;
}

// Choisit la zone à examiner : une demande explicite (si elle correspond à un thème connu) prime
// toujours sur la rotation automatique ; sinon, le thème jamais vu ou le plus ancien est proposé
// en premier. Une demande explicite qui ne correspond à AUCUN thème connu est signalée comme
// ambiguë plutôt que silencieusement ignorée ou acceptée à l'aveugle — c'est exactement le signal
// qui doit déclencher une question à l'utilisateur (cf. blueprint, consultation bidirectionnelle,
// docs/regles-de-travail.md §7ter).
// --- MISE À NIVEAU : L'OUTILLAGE AUSSI (2026-09-22) -----------------------------------------------
// Constat de l'utilisateur, fondé : cet outil ne regardait QUE le moteur du jeu (lib/app/components).
// Ses 8 zones sont les thèmes d'HARMONIA, tous narratifs — il n'avait littéralement aucune zone pour
// un script d'outillage, et dormait donc sur tout commit de `scripts/`. Or la dette d'empilement y
// est bien réelle : `scripts/ecotoken.mjs` dépasse les 1 500 lignes après une seule soirée.
//
// Les zones d'outillage ne sont PAS une nouvelle liste écrite à la main (Article 24) : elles se
// DÉRIVENT du croisement de deux tables déjà maintenues et déjà protégées par leur propre garde-fou
// — AGENT_SCRIPT_FILES (axa-check.mjs, gardé par findScriptsMissingFromAgentFiles) et
// AGENT_CATEGORIES (lib-shell.mjs). Un outil ajouté demain à l'équipe rejoint donc sa zone tout
// seul, sans qu'une ligne soit à recopier ici.
export function outillageZones(agentScriptFiles, agentCategories) {
  const suites = {};
  for (const [slug, fichier] of Object.entries(agentScriptFiles ?? {})) {
    const cat = agentCategories?.[slug] ?? "(sans catégorie)";
    const suite = (/—\s*(.+)$/.exec(cat) || [, cat])[1].trim();
    (suites[`Outillage · ${suite}`] ??= []).push(fichier);
  }
  // Le fichier principal d'une zone est le plus GROS de la suite : c'est là que l'empilement se voit.
  return Object.fromEntries(Object.entries(suites).map(([zone, fichiers]) => [
    zone,
    [...fichiers].sort((a, b) => (existsSync(a) ? statSync(a).size : 0) - (existsSync(b) ? statSync(b).size : 0)).pop(),
  ]));
}

export function recommendZone(themes, coverage, requestedZone, now = new Date()) {
  if (!themes.length) return undefined;
  if (requestedZone) {
    const match = themes.find((t) => t.toLowerCase() === requestedZone.toLowerCase());
    if (match) return { zone: match, source: "demande explicite" };
    return { zone: undefined, ambiguous: true, requestedZone };
  }
  let best, bestAge = -1;
  for (const theme of themes) {
    const last = coverage[theme];
    const age = last ? (now - new Date(last)) / 86400000 : Infinity;
    if (age > bestAge) { bestAge = age; best = theme; }
  }
  return { zone: best, source: "rotation", daysSinceLastPass: Number.isFinite(bestAge) ? Math.round(bestAge) : undefined };
}

// --- Couche mécanique : des indices d'empilement, jamais des verdicts -----------------------

// Compte les marqueurs d'ajout daté ("Ajouté le 2026-09-19", "Précisions apportées le ...",
// "Complément ajouté le ...") dans un texte — un nombre élevé sur UNE même règle est un indice
// (jamais une preuve) qu'elle a grandi par empilement plutôt que par conception. Seuils calibrés
// sur ce projet, à affiner avec l'usage : sous 4, aucun signal ; 4-5, "à surveiller" ; 6 et plus,
// "probable" — jamais "confirmé" pour un signal purement mécanique, la confirmation exige la
// couche raisonnement (l'agent).
export function countDatedAddenda(text) {
  const matches = text.match(/\(?[Aa]jout[ée]e?\s+le\s+20\d{2}-\d{2}-\d{2}|[Pp]r[ée]cisions?\s+apport[ée]es?\s+le\s+20\d{2}-\d{2}-\d{2}|[Cc]ompl[ée]ment\s+ajout[ée]\s+le\s+20\d{2}-\d{2}-\d{2}/g);
  return matches ? matches.length : 0;
}

export function addendaSignal(count) {
  if (count >= 6) return "probable";
  if (count >= 4) return "à surveiller";
  return undefined;
}

// Résume un relevé `git log --numstat` pour un fichier (une ligne par tranche "insertions\t
// deletions\tfichier") en indice de croissance sans réorganisation : beaucoup de commits, des
// insertions qui dominent très largement les suppressions. Un fichier sans historique retourne
// une absence honnête, jamais un signal à zéro déguisé en "rien à signaler".
export function parseNumstat(gitLogOutput) {
  const lines = (gitLogOutput || "").split("\n").filter((l) => /^\d+\t\d+\t/.test(l));
  if (!lines.length) return undefined;
  let insertions = 0, deletions = 0;
  for (const line of lines) {
    const [ins, del] = line.split("\t");
    insertions += Number(ins) || 0;
    deletions += Number(del) || 0;
  }
  return { commits: lines.length, insertions, deletions };
}

// TROIS ÉTATS, PAS DEUX (ajouté le 2026-09-25, tâche #835 — constat RETENU du plan
// `docs/plans/audit-gardiens-donnees-absentes-2026-09-23.md`, resté sans suite deux jours).
//
// `churnSignal()` rend `undefined` DANS DEUX CAS OPPOSÉS : quand aucune statistique git n'a pu être
// lue (rien mesuré) et quand elles ont été lues sans rien révéler (mesuré, rien trouvé). Ses
// appelants ne pouvaient donc pas les distinguer — et `Boolean(churnSignal(...))` les écrasait tous
// les deux en `false`, c'est-à-dire en « tout va bien ».
//
// POURQUOI UNE FONCTION À CÔTÉ plutôt qu'un changement de `churnSignal()` : sa forme de retour est
// lue par plusieurs appelants et par leurs tests. Le plan d'origine avait justement tranché que
// toucher à ce que les détecteurs RENDENT est un chantier de conception à arbitrer, jamais un geste
// de passage. Celle-ci est la correction locale et bornée que le même plan avait RETENUE.
export function churnSignalMesure(stats) {
  if (!stats) return { mesurable: false, signal: null, pourquoi: "aucune statistique git lue pour ce fichier — « pas de donnée » n'est pas « pas d'accumulation », et les compter pareil revient à rassurer sur du vide" };
  return { mesurable: true, signal: churnSignal(stats) ?? null };
}

export function churnSignal(stats) {
  if (!stats) return undefined;
  const { commits, insertions, deletions } = stats;
  if (commits >= 5 && deletions === 0 && insertions > 0) return "probable";
  if (commits >= 8 && insertions > deletions * 5) return "à surveiller";
  return undefined;
}

// --- KPI : combien de vrais points de dette structurelle par passage ------------------------

// Même logique que checkpointPerformance() d'HYPER-SCAN-CHECKPOINT, adaptée à la dette de
// structure plutôt qu'aux bugs — suivie DÈS LA CRÉATION de l'outil (décision explicite de
// l'utilisateur, contrairement aux autres outils qui ont attendu plusieurs passages réels).
// Absence honnête (undefined) tant qu'aucun passage n'a été enregistré — jamais un 0 % déguisé.
export function alwaysNewCodePerformance(indexText) {
  const counts = numericColumn(dataRows(indexText, "Zone examinée"), 3);
  if (!counts.length) return undefined;
  const passages = counts.length;
  const totalFindings = counts.reduce((a, b) => a + b, 0);
  return { passages, totalFindings, findingsPerPassage: totalFindings / passages };
}

const HARMONIA_MD_PATH = join(ROOT, "docs/referentiel/harmonia.md");

function main() {
  recordCliUsage("always-new-code");
  printReportHeader({ tool: "always-new-code", title: "ALWAYS-NEW-CODE — préparation (zéro coût, la couche raisonnement suit)", scriptPath: "scripts/always-new-code.mjs" });
  let divergence = { missingFromThemes: [], missingFromHarmonia: [] };
  if (existsSync(HARMONIA_MD_PATH)) {
    divergence = findThemesDivergingFromHarmonia(readFileSync(HARMONIA_MD_PATH, "utf8"));
    if (divergence.missingFromThemes.length || divergence.missingFromHarmonia.length) {
      console.log("⚠️  THEMES a divergé de harmonia.md (garde-fou de fraîcheur, 2026-09-21) :");
      if (divergence.missingFromThemes.length) console.log(`   présent dans harmonia.md, absent de THEMES : ${divergence.missingFromThemes.join(", ")}`);
      if (divergence.missingFromHarmonia.length) console.log(`   présent dans THEMES, absent de harmonia.md : ${divergence.missingFromHarmonia.join(", ")}`);
      console.log("");
    }
  }
  const requested = process.argv[2];
  const indexText = existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH, "utf8") : "";
  const coverage = parseCoverage(indexText);
  const rec = recommendZone(THEMES, coverage, requested);
  let signalChurn;

  if (!rec) {
    console.log("Aucun thème configuré.");
  } else if (rec.ambiguous) {
    console.log(`Zone demandée "${rec.requestedZone}" ne correspond à aucun thème connu (${THEMES.join(", ")}).`);
    console.log("=> À CLARIFIER AVEC L'UTILISATEUR avant de continuer (consultation bidirectionnelle, docs/regles-de-travail.md §7ter).");
  } else {
    const age = rec.daysSinceLastPass === undefined ? "jamais examinée" : `dernier passage il y a ${rec.daysSinceLastPass} jour(s)`;
    console.log(`Zone recommandée : ${rec.zone} (${rec.source}, ${age})`);

    const file = THEME_PRIMARY_FILE[rec.zone];
    if (file) {
      const numstat = sh(`git log --numstat --pretty=format:"" -- ${file}`, { cwd: ROOT });
      const stats = parseNumstat(numstat);
      const signal = churnSignal(stats);
      signalChurn = signal;
      console.log(`\nIndice git (${file}) : ${stats ? `${stats.commits} commit(s), +${stats.insertions}/-${stats.deletions}` : "aucun historique"} — signal : ${signal ?? "aucun"}.`);
    }
  }

  console.log("\n--- Ce qui reste du ressort du raisonnement (jamais mécanisable) ---");
  console.log("1. Décrire les GRANDS AXES d'une structure idéale pour cette zone, en repartant de zéro avec toute la connaissance actuelle du projet.");
  console.log("2. Comparer point par point cette structure imaginée à la structure réelle de la zone.");
  console.log("3. Vérifier, pour chaque écart trouvé, qu'il ne s'agit pas déjà d'une décision assumée et documentée (Article 19 — leçon trottoirGranted, 2026-09-19).");
  console.log("4. Vérifier qu'aucune fonctionnalité déjà couverte par check-house.mjs ne serait perdue par le changement proposé.");
  console.log("5. Classer chaque trouvaille par palier de confiance (confirmé / probable / à surveiller) — jamais une certitude absolue.");
  console.log("6. Proposer, jamais appliquer seul : préciser la portée exacte et le temps estimé, puis demander confirmation avant tout changement réel.");

  // LE PLAN D'ACTION (2026-09-23, Article 28). ALWAYS-NEW-CODE était, avec ARGUS, l'un des deux
  // vrais trous : il produisait une recommandation de zone — donc un constat réel — et s'arrêtait là.
  //
  // CE QUI REND SON PLAN PARTICULIER, et pourquoi il ne peut pas être « retenu » comme les autres :
  // sa recommandation ne dit jamais qu'il Y A une dette, seulement que cette zone n'a pas été
  // regardée depuis longtemps. Classer ça en « retenu » fabriquerait un problème à partir d'une
  // rotation de calendrier — exactement le garde-fou non négociable de l'Article 23 (vérifier
  // d'abord que ce n'est pas une décision déjà assumée). D'où « à trancher » : la zone est proposée,
  // le zoom profond coûte de vrais tokens (SMART-CONSO-TOKEN), et c'est une décision humaine.
  //
  // La divergence THEMES/harmonia.md, elle, est un VRAI défaut mécanique : deux registres qui
  // devraient dire la même chose ne la disent plus. Celle-là est « retenue », et fausse une mesure.
  const constatsANC = [
    ...divergence.missingFromThemes.map((t) => ({ constat: `thème « ${t} » présent dans harmonia.md mais absent de THEMES`, etat: "retenu", fausseUneMesure: true,
      tache: `réaligner THEMES sur harmonia.md : ajouter « ${t} » ou retirer le thème côté HARMONIA` })),
    ...divergence.missingFromHarmonia.map((t) => ({ constat: `thème « ${t} » présent dans THEMES mais absent de harmonia.md`, etat: "retenu", fausseUneMesure: true,
      tache: `réaligner harmonia.md sur THEMES : documenter « ${t} » ou le retirer de la rotation` })),
  ];
  if (rec && !rec.ambiguous && rec.zone) {
    constatsANC.push({
      constat: `zone « ${rec.zone} » désignée par la rotation (${rec.source}${rec.daysSinceLastPass === undefined ? ", jamais examinée" : `, dernier passage il y a ${rec.daysSinceLastPass} jour(s)`})${signalChurn ? ` — indice d'empilement : ${signalChurn}` : ""}`,
      etat: "a-trancher",
      pourquoi: "une zone recommandée n'est pas une dette constatée : le vrai zoom « page blanche » coûte de vrais tokens (Article 22/SMART-CONSO-TOKEN) et ne se lance jamais tout seul (Article 23)",
    });
  }
  const planANC = buildPlanDaction(constatsANC, { toolSlug: "always-new-code" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planANC.lignes) console.log(l);

  const perf = alwaysNewCodePerformance(indexText);
  console.log("\n--- Performance de l'outil (KPI) ---");
  console.log(perf
    ? `${perf.passages} passage(s) · ${perf.totalFindings} trouvaille(s) confirmée(s) · ${perf.findingsPerPassage.toFixed(1)} en moyenne par passage.`
    : "Absence de donnée (aucun passage encore consigné dans l'index) — jamais un faux 0 %.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
