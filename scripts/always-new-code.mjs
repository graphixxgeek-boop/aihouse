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

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

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
  const dataRows = indexText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Zone examinée"));
  const counts = dataRows
    .map((row) => row.split("|").map((c) => c.trim()))
    .filter((cols) => cols.length >= 5 && /^\d+$/.test(cols[3]))
    .map((cols) => Number(cols[3]));
  if (!counts.length) return undefined;
  const passages = counts.length;
  const totalFindings = counts.reduce((a, b) => a + b, 0);
  return { passages, totalFindings, findingsPerPassage: totalFindings / passages };
}

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return e.stdout || "";
  }
}

function main() {
  console.log("=== ALWAYS-NEW-CODE — préparation (zéro coût, la couche raisonnement suit) ===\n");
  const requested = process.argv[2];
  const indexText = existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH, "utf8") : "";
  const coverage = parseCoverage(indexText);
  const rec = recommendZone(THEMES, coverage, requested);

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
      const numstat = sh(`git log --numstat --pretty=format:"" -- ${file}`);
      const stats = parseNumstat(numstat);
      const signal = churnSignal(stats);
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

  const perf = alwaysNewCodePerformance(indexText);
  console.log("\n--- Performance de l'outil (KPI) ---");
  console.log(perf
    ? `${perf.passages} passage(s) · ${perf.totalFindings} trouvaille(s) confirmée(s) · ${perf.findingsPerPassage.toFixed(1)} en moyenne par passage.`
    : "Absence de donnée (aucun passage encore consigné dans l'index) — jamais un faux 0 %.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
