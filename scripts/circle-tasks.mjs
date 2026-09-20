// CIRCLE-TASKS — « Ronde périodique » (2026-09-20, nommé par l'utilisateur : « je voudrais creer un
// mini agent qui appelle l'executoin de ce process : l'agent s'appelle circle-tasks »).
//
// Né d'un constat concret et gênant : le système de mise à jour du profil utilisateur — pourtant
// documenté, pourtant zéro coût API — était en retard pour la DEUXIÈME fois de la session (une
// session compactée sans que la fiche ne soit relancée), retrouvé uniquement parce que
// l'utilisateur a posé la question. CIRCLE-TASKS regroupe les tâches de ce type : périodiques par
// nature, gratuites, mais qui dépendent uniquement de la mémoire de l'agent pour être relancées —
// jamais un mécanisme automatique complet.
//
// Volontairement mince, EXACTEMENT le même principe que LE-COORDINATEUR (aucun blueprint séparé,
// documenté directement dans docs/regles-de-travail.md §7ter) : ce script ne DÉCIDE ni n'EXÉCUTE
// rien lui-même — il affiche le menu et un signal de fraîcheur mécanique quand une vraie date de
// référence existe (jamais inventée sinon), et laisse le choix précis à l'agent qui pilote via une
// fenêtre à cocher (demande explicite de l'utilisateur : « tu ouvres une fenêtre question me
// demandant de cocher ce que je veux précisément exécuter » — jamais un tout-en-un silencieux).
//
// Principalement GRATUITE — SEULE EXCEPTION explicite (2026-09-20, revirement demandé par
// l'utilisateur après un premier jet qui excluait tout item coûteux) : THE-FINAL-JUDGE reste
// visible dans la même fenêtre à cocher, jamais retiré de la vue, mais jamais traité comme un item
// ordinaire — panneau d'alerte (⚠️🔴), coût en tokens fixe affiché en toutes lettres, jamais coché
// par défaut. Les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet)
// restent hors de cette fenêtre pour l'instant, cf. docs/referentiel/smart-conso-token.md pour la
// discussion de leur extension éventuelle au même traitement.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Alerte visuelle non négociable (2026-09-20, demande explicite de l'utilisateur : « chaque fois
// que the-judge doit être sollicité [...] il y a un message d'alerte avec une icône : faire
// attention, des caractères en rouge et le prix en token fixe (37K) »). `ALERT_ICON` pour toute
// surface textuelle (chat, description d'option d'une fenêtre à cocher — aucune couleur possible
// là) ; `red()` pour la sortie TERMINAL uniquement (ce script, les crochets git), où de vrais
// caractères ANSI rouges sont affichables. Jamais mélangé : une fenêtre à cocher ne rend jamais les
// codes ANSI, elle recevrait du texte brut illisible — seul le préfixe ⚠️🔴 y est utilisé.
export const ALERT_ICON = "⚠️🔴";
export const FINAL_JUDGE_TOKEN_COST = 37000;
export function red(text) { return `\x1b[31m${text}\x1b[0m`; }

// Les 5 items gratuits (2026-09-20). Chacun a une raison d'être et un chemin d'exécution déjà
// documenté ailleurs — CIRCLE-TASKS ne réimplémente RIEN, il rappelle et agrège (règle anti-doublon,
// §7ter). Le champ `execute` décrit en une phrase la procédure réelle à suivre pour un item coché,
// jamais un code à lancer aveuglément.
export const CIRCLE_ITEMS = [
  {
    id: "profil",
    label: "Mettre à jour le profil utilisateur",
    cout: "gratuit — lecture/écriture de texte, zéro appel API",
    execute: "Suivre la procédure de docs/regles-de-travail.md §9 (Historisation du profil) : comparer les signaux de la session en cours à la dernière fiche, écrire une nouvelle observation datée, mettre à jour l'index.",
  },
  {
    id: "referentiel",
    label: "Relire tous les documents de référence",
    cout: "gratuit — lecture, aucun appel API",
    execute: "Relire CLAUDE.md (Article 13, vérification périodique) et toute la table des matières réelle de docs/referentiel/ + racine de docs/ — corriger tout écart trouvé immédiatement (Article 3), jamais seulement le signaler.",
  },
  {
    id: "kpi",
    label: "Lancer le rapport KPI (familles gratuites)",
    cout: "gratuit — node scripts/kpi-report.mjs, zéro nouvel appel API",
    execute: "Lancer node scripts/kpi-report.mjs et lire au moins la famille Robustesse du code (100% mécanique) — les autres familles restent honnêtement N/A si aucun serveur de dev avec du vrai trafic n'est joignable.",
  },
  {
    id: "always-new-code-signal",
    label: "Signaler la zone la plus négligée (ALWAYS-NEW-CODE)",
    cout: "gratuit — lecture de la mémoire de couverture déjà accumulée, jamais le vrai zoom (ça, c'est un raisonnement coûteux à part, cf. Article 23)",
    execute: "Lire docs/always-new-code/index.md et reporter honnêtement la zone la plus négligée (ou jamais examinée) — proposer, jamais lancer, le vrai zoom profond correspondant, qui reste un raisonnement coûteux nécessitant sa propre consultation SMART-CONSO-TOKEN.",
  },
  {
    id: "correctifs",
    label: "Relire les carnets de correctifs et points fragiles",
    cout: "gratuit — lecture, aucun appel API",
    execute: "Relire docs/simulations/correctifs-a-revalider.md et docs/referentiel/points-fragiles.md — retirer ce qui est confirmé stable (2 simulations propres consécutives), signaler ce qui traîne sans jamais avancer.",
  },
  // THE-FINAL-JUDGE (2026-09-20, demande explicite de l'utilisateur : « integre le dans la liste à
  // cocher malgré tout [...] avec un panneau d'avertissement [...] caractères couleur rouge [...]
  // le coût en token »). Revient sur le choix initial (le garder hors de la fenêtre) — l'utilisateur
  // préfère l'avoir SOUS LES YEUX à chaque ronde, mais jamais confondu visuellement avec un item
  // gratuit : `costly: true` déclenche le traitement d'alerte (ANSI rouge en terminal, préfixe
  // ⚠️🔴 partout) — jamais une case cochée par défaut, jamais bundlée silencieusement avec le reste.
  {
    id: "the-final-judge",
    label: "THE-FINAL-JUDGE — audit indépendant",
    cout: `${ALERT_ICON} COÛTEUX — ~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes (agent séparé), quel que soit le palier choisi`,
    execute: "Consulter Smart Conso API ET SMART-CONSO-TOKEN avant de lancer quoi que ce soit (Article 22) — jamais un réflexe de routine, seulement si un vrai besoin de regard indépendant justifie la dépense.",
    costly: true,
  },
];

// Signal de fraîcheur MÉCANIQUE, jamais inventé (2026-09-20) : la date la plus récente mentionnée
// dans un texte, au format YYYY-MM-DD ou ISO complet. Volontairement générique plutôt qu'un parseur
// par colonne propre à chaque document (fragile, à réécrire à chaque nouveau format de tableau) —
// suffisant pour un simple "depuis combien de temps", jamais pour une lecture qualitative fine.
export function mostRecentDate(text) {
  const matches = [...(text || "").matchAll(/\b(20\d{2}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}Z)?\b/g)];
  if (!matches.length) return undefined;
  const isoStrings = matches.map((m) => (m[0].length === 10 ? m[0] + "T00:00:00Z" : m[0]));
  return isoStrings.reduce((max, d) => (d > max ? d : max));
}

export function daysSince(dateStr, now = Date.now()) {
  if (!dateStr) return undefined;
  const days = Math.floor((now - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : undefined;
}

// Agrège un signal de fraîcheur honnête pour les items qui en ont un (profil, KPI, zone
// ALWAYS-NEW-CODE la plus négligée) — jamais pour "relecture référentiel" ou "correctifs", qui
// n'ont aucune date de référence mécanique fiable (Article 13 elle-même n'impose aucune cadence
// fixe, cf. CLAUDE.md — un signal inventé ici serait moins honnête que son absence).
export function buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText } = {}, now = Date.now()) {
  const profilLast = mostRecentDate(profilIndexText);
  const kpiLast = mostRecentDate(kpiIndexText);
  const coverage = parseCoverage(alwaysNewCodeIndexText || "");
  const zoneRec = recommendZone(THEMES, coverage, undefined, new Date(now));

  return CIRCLE_ITEMS.map((item) => {
    if (item.id === "profil") return { ...item, staleness: profilLast ? `${daysSince(profilLast, now)} jour(s) depuis la dernière fiche` : "jamais fait" };
    if (item.id === "kpi") return { ...item, staleness: kpiLast ? `${daysSince(kpiLast, now)} jour(s) depuis le dernier rapport archivé` : "jamais fait" };
    if (item.id === "always-new-code-signal") {
      if (!zoneRec) return { ...item, staleness: "aucun thème connu" };
      const zoneDate = coverage[zoneRec.zone];
      return { ...item, staleness: zoneDate ? `zone la plus négligée : "${zoneRec.zone}" (${daysSince(zoneDate, now)} jour(s))` : `zone la plus négligée : "${zoneRec.zone}" (jamais examinée)` };
    }
    if (item.costly) return { ...item, staleness: "jamais une routine — décision au cas par cas, à chaque fois" };
    return { ...item, staleness: "pas de signal de fraîcheur mécanique disponible" };
  });
}

// `colorize` par défaut vrai (sortie terminal réelle, ce script et les crochets git) — mis à faux
// pour toute sortie destinée à être relue comme du texte brut (tests, archive future) où des codes
// ANSI seraient juste des caractères parasites, jamais un vrai signal visuel.
export function formatCircleMenu(report, { colorize = true } = {}) {
  const lines = ["| Item | Coût | Fraîcheur |", "|---|---|---|"];
  for (const r of report) {
    const label = r.costly && colorize ? red(`${ALERT_ICON} ${r.label}`) : r.label;
    const cout = r.costly && colorize ? red(r.cout) : r.cout;
    lines.push(`| ${label} | ${cout} | ${r.staleness} |`);
  }
  return lines.join("\n");
}

// Rappel de fraîcheur pour le crochet post-commit (2026-09-20, demande explicite de l'utilisateur :
// « rappelle-moi à des moments naturels ») — mémoire best-effort locale, jamais committée, même
// statut que .le-coordinateur-last-run.json. Un seuil de commits, jamais une fenêtre de temps (les
// commits sont l'unité de mesure déjà utilisée ailleurs dans ce paysage pour "du travail a eu
// lieu"), déclenché seulement si le nombre de commits réels depuis le dernier passage confirmé
// dépasse le seuil — jamais à chaque commit, ce serait juste un second LE-COORDINATEUR redondant.
const LAST_RUN_PATH = fileURLToPath(new URL("../.circle-tasks-last-run.json", import.meta.url));
export const REMINDER_COMMIT_THRESHOLD = 10;

export function loadLastRun(readFile = (f) => readFileSync(f, "utf8")) {
  try { return JSON.parse(readFile(LAST_RUN_PATH)); } catch { return {}; }
}

// `commitsSinceLastRun` : fourni par l'appelant (déjà calculé ailleurs, ex. via `git rev-list
// --count`) — CIRCLE-TASKS ne relance jamais lui-même une commande git, jamais un second mécanisme
// de comptage à côté de celui déjà utilisé par LE-COORDINATEUR/le suivi.
export function shouldRemindCircleTasks(commitsSinceLastRun) {
  if (!Number.isFinite(commitsSinceLastRun)) return false;
  return commitsSinceLastRun >= REMINDER_COMMIT_THRESHOLD;
}

// À appeler explicitement par l'agent une fois une vraie ronde effectuée (au moins un item traité),
// jamais automatiquement — CIRCLE-TASKS ne sait jamais tout seul si l'agent a réellement fait le
// travail derrière chaque case cochée (aucun mécanisme ne peut le vérifier, même honnêteté que le
// reste de ce paysage). `totalCommitCount` : le compte réel au moment du passage (`git rev-list
// --count HEAD`), fourni par l'appelant.
export function recordCircleTasksRun(totalCommitCount, now = Date.now()) {
  const state = { lastRunCommitCount: totalCommitCount, lastRunAt: now };
  writeFileSync(LAST_RUN_PATH, JSON.stringify(state, null, 1));
  return state;
}

function main() {
  const profilIndexText = existsSync(`${ROOT}docs/profil-utilisateur/index.md`) ? readFileSync(`${ROOT}docs/profil-utilisateur/index.md`, "utf8") : "";
  const kpiIndexText = existsSync(`${ROOT}docs/referentiel/kpi-index.md`) ? readFileSync(`${ROOT}docs/referentiel/kpi-index.md`, "utf8") : "";
  const alwaysNewCodeIndexText = existsSync(`${ROOT}docs/always-new-code/index.md`) ? readFileSync(`${ROOT}docs/always-new-code/index.md`, "utf8") : "";
  const report = buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText });
  console.log("=== CIRCLE-TASKS — Ronde périodique ===\n");
  console.log(formatCircleMenu(report));
  console.log("\nJamais exécuté seul : l'agent qui pilote ouvre une fenêtre à cocher pour choisir précisément quoi lancer.");
  console.log(red(`${ALERT_ICON} THE-FINAL-JUDGE reste visible ci-dessus mais n'est JAMAIS coché par défaut — vérifie Smart Conso API ET SMART-CONSO-TOKEN avant de le sélectionner.`));
  console.log("Rappel : les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet) restent hors de cette ronde pour l'instant, jamais des cases à cocher ici.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
