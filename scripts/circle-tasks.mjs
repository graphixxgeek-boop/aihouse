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

// Les 9 items gratuits (2026-09-20, complétés en plusieurs passes le même jour : « il n'y a pas
// aussi les smart scans de api et token ? » — écart réel trouvé en refaisant le tour complet du
// paysage ; « la photo de la dream team », ajoutée comme seul item purement récréatif ; puis « la
// possibilité de demander une capture d'écran de la simulation » — THE-SCREENER, dernier oubli
// trouvé). Chacun a une raison d'être et un chemin d'exécution déjà documenté ailleurs —
// CIRCLE-TASKS ne réimplémente RIEN, il rappelle et agrège (règle anti-doublon, §7ter). Le champ
// `execute` décrit en une phrase la procédure réelle à suivre pour un item coché, jamais un code à
// lancer aveuglément.
//
// `tokensEstimes` (2026-09-20, demande explicite : « alimente ce catalogue avec une estimation du
// prix en token et/ou en API ») — un ORDRE DE GRANDEUR honnête du coût en tokens Claude (agent
// pilote) pour exécuter l'item, jamais un chiffre exact fabriqué (même discipline que
// SMART-CONSO-TOKEN, Article 22 : « jamais un chiffre exact présenté comme tel », sauf quand une
// vraie recherche documentée existe déjà — cf. le-final-judge ci-dessous). `cout` reste le texte
// qui décrit le coût en appels API réels (Gemini, ou agent séparé) ; `tokensEstimes` est le nouveau
// champ distinct pour le coût en tokens de CE agent — les deux budgets ne se confondent jamais
// (Article 22 régule les appels Gemini déclenchés par l'agent, SMART-CONSO-TOKEN régule les tokens
// de l'agent lui-même, cf. CLAUDE.md).
export const CIRCLE_ITEMS = [
  {
    id: "profil",
    label: "Mettre à jour le profil utilisateur",
    cout: "gratuit — lecture/écriture de texte, zéro appel API",
    tokensEstimes: "quelques milliers de tokens (lecture de l'index + de la dernière fiche, rédaction d'une nouvelle observation datée)",
    execute: "Suivre la procédure de docs/regles-de-travail.md §9 (Historisation du profil) : comparer les signaux de la session en cours à la dernière fiche, écrire une nouvelle observation datée, mettre à jour l'index.",
  },
  {
    id: "referentiel",
    label: "Relire tous les documents de référence",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "élevé si réellement exhaustif — potentiellement plusieurs dizaines de milliers de tokens (CLAUDE.md seul pèse ~29 000 tokens estimés, cf. docs/smart-conso-token/) ; \"gratuit\" ne veut jamais dire \"gratuit en tokens\"",
    execute: "Relire CLAUDE.md (Article 13, vérification périodique) et toute la table des matières réelle de docs/referentiel/ + racine de docs/ — corriger tout écart trouvé immédiatement (Article 3), jamais seulement le signaler.",
  },
  {
    id: "kpi",
    label: "Lancer le rapport KPI (familles gratuites)",
    cout: "gratuit — node scripts/kpi-report.mjs, zéro nouvel appel API",
    tokensEstimes: "faible à modéré — sortie du script (quelques milliers de tokens) + rédaction de l'entrée d'index",
    execute: "Lancer node scripts/kpi-report.mjs et lire au moins la famille Robustesse du code (100% mécanique) — les autres familles restent honnêtement N/A si aucun serveur de dev avec du vrai trafic n'est joignable.",
  },
  {
    id: "always-new-code-signal",
    label: "Signaler la zone la plus négligée (ALWAYS-NEW-CODE)",
    cout: "gratuit — lecture de la mémoire de couverture déjà accumulée, jamais le vrai zoom (ça, c'est un raisonnement coûteux à part, cf. Article 23)",
    tokensEstimes: "faible — lecture d'un seul fichier d'index compact",
    execute: "Lire docs/always-new-code/index.md et reporter honnêtement la zone la plus négligée (ou jamais examinée) — proposer, jamais lancer, le vrai zoom profond correspondant, qui reste un raisonnement coûteux nécessitant sa propre consultation SMART-CONSO-TOKEN.",
  },
  {
    id: "correctifs",
    label: "Relire les carnets de correctifs et points fragiles",
    cout: "gratuit — lecture, aucun appel API",
    tokensEstimes: "modéré — lecture de deux carnets (points-fragiles.md, correctifs-a-revalider.md)",
    execute: "Relire docs/simulations/correctifs-a-revalider.md et docs/referentiel/points-fragiles.md — retirer ce qui est confirmé stable (2 simulations propres consécutives), signaler ce qui traîne sans jamais avancer.",
  },
  {
    id: "smart-conso-api-scan",
    label: "Scanner les schémas de consommation API (Smart Conso API)",
    cout: "gratuit — node scripts/smart-conso-api.mjs scan, lecture de l'historique déjà accumulé, zéro nouvel appel API",
    tokensEstimes: "faible — sortie compacte d'un script",
    execute: "Lancer `node scripts/smart-conso-api.mjs scan` et lire les constats (taux d'épuisement récent élevé, relancement trop rapide après un épisode confirmé) — jamais un jugement sur le code du jeu, seulement le rythme des appels déjà faits.",
  },
  {
    id: "smart-conso-token-scan",
    label: "Scanner le poids des documents de travail (SMART-CONSO-TOKEN)",
    cout: "gratuit — scan de portée Global, lecture de fichiers, zéro appel API",
    tokensEstimes: "faible à modéré — sortie du scan + lecture des fichiers qu'il pointe comme volumineux",
    execute: "Relancer un scan de portée Global (cf. docs/referentiel/smart-conso-token.md) — particulièrement utile après une session qui a fait grossir CLAUDE.md ou docs/, pour repérer une dérive avant qu'elle ne s'accumule trop.",
  },
  // « Photo de la dream team » (2026-09-20, demande explicite de l'utilisateur, pendant une pause
  // fun : « garde en mémoire et écrit que cette "photo" de la dream team fait partie des tâches
  // proposées lors des rondes périodiques »). Seul item de CIRCLE_ITEMS purement récréatif — jamais
  // un outil de travail technique, aucun impact sur la charte ni le code du jeu.
  {
    id: "dream-team-photo",
    label: "Régénérer la « photo » de la dream team (récap des outils nommés)",
    cout: "gratuit — lecture de la liste des outils déjà nommés dans CLAUDE.md/docs/regles-de-travail.md, mise en forme, zéro appel API",
    tokensEstimes: "modéré — rédaction d'un document HTML complet à partir d'une liste déjà connue",
    execute: "Régénérer le document récapitulatif (nom, rôle, commentaire sur le nom choisi) de tous les outils/agents nommés du projet et le livrer en fichier HTML à l'utilisateur (cf. scripts/html-report.mjs) — pour le plaisir, jamais un livrable technique.",
  },
  // THE-SCREENER (2026-09-20, demande explicite de l'utilisateur : « il y a aussi la possibilité de
  // demander une capture d'écran de la simulation (avec coût API) si je ne me trompe pas »).
  // Précision importante trouvée en relisant docs/referentiel/the-screener.md avant d'ajouter cet
  // item (Article 19) : le MÉCANISME lui-même (capture Playwright + lecture vision par l'agent)
  // coûte ZÉRO appel Gemini — la seule vraie condition est de disposer déjà d'une session/un serveur
  // avec un état réel à capturer, jamais de lancer une simulation complète juste pour la photo (ce
  // serait un vrai coût Gemini indirect, contraire à l'Article 8).
  {
    id: "the-screener",
    label: "Capturer et noter 2 captures d'écran (THE-SCREENER)",
    cout: "zéro appel à l'API Gemini pour le mécanisme lui-même (capture Playwright locale) — CONDITIONNEL : n'a de sens que si une session/un serveur avec un vrai état est déjà en cours ; ne jamais lancer une nouvelle simulation juste pour cet item",
    tokensEstimes: "modéré — lecture vision de 2 images par l'agent + rédaction de la notation",
    execute: "Lancer node scripts/the-screener-capture.mjs contre un serveur DÉJÀ actif (dev ou site en ligne) avec une vraie session en cours, lire les 2 captures et noter contre docs/referentiel/regles-des-graphismes.md — jamais déclencher une nouvelle simulation juste pour cet item.",
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
    tokensEstimes: `~${FINAL_JUDGE_TOKEN_COST.toLocaleString("fr-FR")} tokens fixes — le seul chiffre de ce paysage issu d'une vraie recherche documentée plutôt que d'une estimation à l'ordre de grandeur`,
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
export function buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText, smartConsoApiIndexText, smartConsoTokenIndexText } = {}, now = Date.now()) {
  const profilLast = mostRecentDate(profilIndexText);
  const kpiLast = mostRecentDate(kpiIndexText);
  const smartConsoApiLast = mostRecentDate(smartConsoApiIndexText);
  const smartConsoTokenLast = mostRecentDate(smartConsoTokenIndexText);
  const coverage = parseCoverage(alwaysNewCodeIndexText || "");
  const zoneRec = recommendZone(THEMES, coverage, undefined, new Date(now));

  return CIRCLE_ITEMS.map((item) => {
    if (item.id === "profil") return { ...item, staleness: profilLast ? `${daysSince(profilLast, now)} jour(s) depuis la dernière fiche` : "jamais fait" };
    if (item.id === "kpi") return { ...item, staleness: kpiLast ? `${daysSince(kpiLast, now)} jour(s) depuis le dernier rapport archivé` : "jamais fait" };
    if (item.id === "smart-conso-api-scan") return { ...item, staleness: smartConsoApiLast ? `${daysSince(smartConsoApiLast, now)} jour(s) depuis la dernière décision archivée` : "jamais fait" };
    if (item.id === "smart-conso-token-scan") return { ...item, staleness: smartConsoTokenLast ? `${daysSince(smartConsoTokenLast, now)} jour(s) depuis le dernier scan archivé` : "jamais fait" };
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
  const lines = ["| Item | Coût API | Tokens Claude (estimation) | Fraîcheur |", "|---|---|---|---|"];
  for (const r of report) {
    const label = r.costly && colorize ? red(`${ALERT_ICON} ${r.label}`) : r.label;
    const cout = r.costly && colorize ? red(r.cout) : r.cout;
    const tokens = r.costly && colorize ? red(r.tokensEstimes) : r.tokensEstimes;
    lines.push(`| ${label} | ${cout} | ${tokens} | ${r.staleness} |`);
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
  const read = (p) => (existsSync(`${ROOT}${p}`) ? readFileSync(`${ROOT}${p}`, "utf8") : "");
  const profilIndexText = read("docs/profil-utilisateur/index.md");
  const kpiIndexText = read("docs/referentiel/kpi-index.md");
  const alwaysNewCodeIndexText = read("docs/always-new-code/index.md");
  const smartConsoApiIndexText = read("docs/smart-conso-api/index.md");
  const smartConsoTokenIndexText = read("docs/smart-conso-token/index.md");
  const report = buildCircleReport({ profilIndexText, kpiIndexText, alwaysNewCodeIndexText, smartConsoApiIndexText, smartConsoTokenIndexText });
  console.log("=== CIRCLE-TASKS — Ronde périodique ===\n");
  console.log(formatCircleMenu(report));
  console.log("\nJamais exécuté seul : l'agent qui pilote ouvre une fenêtre à cocher pour choisir précisément quoi lancer.");
  console.log(red(`${ALERT_ICON} THE-FINAL-JUDGE reste visible ci-dessus mais n'est JAMAIS coché par défaut — vérifie Smart Conso API ET SMART-CONSO-TOKEN avant de le sélectionner.`));
  console.log("Rappel : les autres items coûteux du paysage (check-spirit.mjs, HYPER-SCAN-CHECKPOINT complet) restent hors de cette ronde pour l'instant, jamais des cases à cocher ici.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
