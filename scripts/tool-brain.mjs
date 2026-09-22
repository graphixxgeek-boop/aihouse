// tool-brain — cerveau central des rappels d'outils (2026-09-21, demande explicite de l'utilisateur :
// « ca ne doit pas seulement pointer vers find brain, mais aussi vers tous les outils et pour ce
// faire via le catalogue du coordinateur [...] resoud ce point definitivement [...] adapte avec
// l'existant mis en place pour find brain »).
//
// Généralise find-brain.mjs (qui reste inchangé, spécialisé sur les 2 outils de recherche dans le
// code) à TOUT le catalogue PRESTATIONS de LE-COORDINATEUR. Ne réimplémente rien : réutilise
// suggestPrestationsForTask()/formatMenu() (LE-COORDINATEUR), recommendFindBrain()/
// flagFindDeepBoosterCandidates() (find-brain.mjs), flagFindBoosterCandidates() (Doc-Report) et
// toolUsageStats()/toolsNeverUsed() (tool-usage.mjs) telles quelles — tool-brain n'ajoute que des
// points d'entrée uniques qui centralisent ce qui existe déjà, jamais un second calcul.
//
// Statut : « Membre certifié (classique) » — badge 🎖️ réel, mais SANS instanciation/registre/
// blueprint séparés (2026-09-21, reclarification explicite de l'utilisateur : « il y a des membres
// certifiés qui ont une connaissance propre au projet et d'autres qui n'en ont pas [...] oui ce sont
// tous des membres certifiés » puis « membre certifié couvre les deux catégories »). tool-brain n'a
// AUCUNE connaissance propre au projet à documenter à part — il appelle/agrège ce que LE-COORDINATEUR/
// find-brain/tool-usage.mjs disent déjà — exactement la même catégorie que LE-COORDINATEUR/
// CIRCLE-TASKS/route-booster. Documenté directement dans `docs/regles-de-travail.md` (carte des
// outils + §7ter), jamais de blueprint ni de registre séparés (`checkAgentOnboarding()`,
// `le-coordinateur.mjs`, paramètre `ownKnowledge: false`).

import { readFileSync } from "node:fs";
import { PRESTATIONS, suggestPrestationsForTask, formatMenu, slugifyAgentName } from "./le-coordinateur.mjs";
import { recommendFindBrain, flagFindDeepBoosterCandidates, FIND_DEEP_BOOSTER_NICKNAME } from "./find-brain.mjs";
import { flagFindBoosterCandidates } from "./doc-report.mjs";
import { toolUsageStats, toolsNeverUsed, recordCliUsage } from "./tool-usage.mjs";
import { assessCriticality } from "./ecotoken.mjs";

export const TOOL_BRAIN_SLUG = "tool-brain";
const USAGE_HISTORY_URL = new URL("../.tool-usage-history.json", import.meta.url);

// Même discipline honnête que le reste du paysage (loadJson() de circle-tasks.mjs/tool-usage.mjs) :
// un historique absent ou corrompu retombe sur "aucun événement connu", jamais une erreur qui
// bloquerait un simple rappel.
export function loadToolUsageHistory(readFile = (u) => readFileSync(u, "utf8")) {
  try {
    return JSON.parse(readFile(USAGE_HISTORY_URL));
  } catch {
    return { events: [] };
  }
}

// --- 1. Consultation à la demande (inchangé depuis la première version) ---
// Seuil de correspondance déjà fixé par suggestPrestationsForTask() elle-même (score >= 2 mots
// significatifs partagés) — jamais un second seuil divergent ici.
export function adviseToolBrain({ taskDescription, filePath } = {}) {
  const prestations = taskDescription ? suggestPrestationsForTask(taskDescription) : [];
  const fileAdvice = filePath ? recommendFindBrain(filePath) : undefined;
  // CRITICITÉ (2026-09-22, règle de travail 3quater : « la criticité d'un fichier doit toujours être
  // évaluée avant d'y mener une action spécifique »). La mesure existait déjà dans ecotoken, mais
  // elle n'était atteignable qu'en lançant ecotoken SUR ce fichier — donc jamais au moment où elle
  // sert, c'est-à-dire juste avant d'agir. tool-brain étant le seul réflexe obligatoire avant de
  // toucher un fichier, c'est ici qu'elle doit apparaître : la règle devient atteignable au lieu de
  // rester une bonne intention. Jamais un second calcul — assessCriticality() est appelée telle
  // quelle, l'unique source de cette échelle à 6 niveaux.
  let criticite;
  if (filePath) { try { criticite = assessCriticality(filePath); } catch { criticite = undefined; } }
  return { prestations, fileAdvice, criticite };
}

// --- 2. Rappel centralisé post-commit (2026-09-21, remplace 3 blocs auparavant éparpillés dans
// scripts/hooks/check-last-commit.mjs : find-booster, find-deep-booster, et le menu PRESTATIONS nu
// — demande explicite : « je veux un rappel centralisé sur tool-brain : c'est sa vocation profonde
// plutôt que des rappels éparpillés »). Une seule bannière, une seule fonction à appeler.
export function formatToolBrainReminder({ prestations = PRESTATIONS } = {}) {
  const findBoosterCandidates = flagFindBoosterCandidates();
  const findDeepBoosterCandidates = flagFindDeepBoosterCandidates();
  const lines = ["🧠 tool-brain — rappel centralisé des outils :"];
  if (findBoosterCandidates.length) {
    lines.push(`\n🧭 find-booster : ${findBoosterCandidates.map((c) => `${c.label} (~${c.tokens} tokens)`).join(", ")} méritent une recherche par concept avant toute lecture intégrale.`);
  }
  if (findDeepBoosterCandidates.length) {
    lines.push(`\n🔧 ${FIND_DEEP_BOOSTER_NICKNAME} : ${findDeepBoosterCandidates.map((c) => `${c.label} (${c.lineCount} lignes, ${c.cutPointCount} points de coupe)`).join(", ")} méritent un vrai zoom de découpage avant toute lecture intégrale.`);
  }
  lines.push("\n\n📋 Prestations disponibles via le réseau d'outils (rappel automatique) :\n", formatMenu(prestations));
  return lines.join("");
}

// --- 3. KPI d'usage global (2026-09-21, demande explicite : « il a son KPI (tres important) [...]
// pour te dire si tu as suffisamment utilisé les outils »). La liste des outils connus vient de
// PRESTATIONS elle-même (slugifyAgentName() sur chaque nom cité dans `outils`) — jamais une
// deuxième liste maintenue à la main qui pourrait diverger du catalogue réel.
//
// `primaryName` (2026-09-21, bug réel trouvé en lançant `node scripts/tool-brain.mjs rapport`
// contre le vrai dépôt) : un `outils` de PRESTATIONS porte parfois une précision entre parenthèses
// ("ARGUS (mécanique)", "THE-FINAL-JUDGE (mandat sécurité inclus)", "Smart Breaker
// (check-gemini-quota.mjs)") — slugifier le texte ENTIER produisait un faux slug distinct
// ("argus-m-canique") jamais utilisé nulle part par `recordToolUsage()`, faisant apparaître à tort
// le même outil comme "jamais sollicité" sous deux identités différentes. Même découpage déjà
// établi ailleurs dans ce fichier (`badgeWarningsForOutils()`, `findToolsMissingFromMenu()`) —
// jamais une troisième règle divergente.
export function knownToolSlugsFromPrestations(prestations = PRESTATIONS) {
  return [...new Set(prestations.flatMap((p) => p.outils.map((o) => slugifyAgentName(o.split(/[/(]/)[0].trim()))))];
}

export function buildToolBrainUsageReport(history, prestations = PRESTATIONS) {
  const slugs = knownToolSlugsFromPrestations(prestations);
  const perTool = slugs
    .map((slug) => ({ slug, ...toolUsageStats(history, slug) }))
    .sort((a, b) => a.total - b.total);
  const neverUsed = toolsNeverUsed(history, slugs);
  return { perTool, neverUsed };
}

// --- 4. Auto-diagnostic borné au périmètre de tool-brain lui-même (2026-09-21, précision explicite
// de l'utilisateur : « je parle des ameliorations sur le perimetre de tool-brain et de ses
// objectifs uniquement » — jamais un audit du paysage entier, déjà couvert ailleurs par ARGUS/
// HARMONIA). Réutilise toolUsageStats() tel quel, sur le seul slug "tool-brain" ; le câblage
// réciproque (est-il bien appelé dans le crochet post-commit ?) est une simple recherche de texte
// dans le code source déjà en mémoire, même patron que checkHtmlWiring() (circle-tasks.mjs).
export function diagnoseToolBrainSelf(history, { checkLastCommitSource } = {}) {
  const usage = toolUsageStats(history, TOOL_BRAIN_SLUG);
  const spontaneousCount = usage.byOrigin?.spontane ?? 0;
  const wiredInPostCommitHook = checkLastCommitSource != null ? /tool-brain\.mjs/.test(checkLastCommitSource) : undefined;
  const findings = [];
  if (usage.total === 0) {
    findings.push("tool-brain n'a jamais été sollicité (ni spontanément, ni sur demande) — son rappel automatique post-commit reste alors la seule chose qui tourne réellement.");
  } else if (spontaneousCount === 0) {
    findings.push(`tool-brain a été sollicité ${usage.total} fois, mais jamais spontanément — signe que le réflexe n'est pas encore acquis, seulement le rappel mécanique.`);
  }
  if (wiredInPostCommitHook === false) {
    findings.push("tool-brain ne semble plus câblé dans le crochet post-commit (scripts/hooks/check-last-commit.mjs) — vérifier le câblage réciproque.");
  }
  return { usage, spontaneousCount, wiredInPostCommitHook, findings };
}

// --- 5. Rapport de Ronde, texte (2026-09-21, demande explicite : « delivre un rapport txt à chaque
// ronde [...] te faire des recommandations [...] eventuellement diagnostiquer des ameliorations à
// apporter sur le systeme global "tool-brain" »). Disponible aux deux déclenchements demandés : à
// chaque Ronde (cf. circle-tasks.mjs, item "tool-brain-report") ET à la demande (CLI ci-dessous).
export function formatToolBrainReport({ history, prestations = PRESTATIONS, checkLastCommitSource, now = Date.now() } = {}) {
  const { perTool, neverUsed } = buildToolBrainUsageReport(history, prestations);
  const self = diagnoseToolBrainSelf(history, { checkLastCommitSource });
  const lines = [
    "=== tool-brain — rapport de Ronde ===",
    `Date : ${new Date(now).toISOString()}`,
    "",
    neverUsed.length ? `${neverUsed.length} outil(s) du catalogue jamais sollicité(s) : ${neverUsed.join(", ")}.` : "Tous les outils connus du catalogue ont déjà été sollicités au moins une fois.",
    "",
    "Outils les moins sollicités (total cumulé, jamais remis à zéro) :",
    ...perTool.slice(0, 10).map((t) => `- ${t.slug} : ${t.total} sollicitation(s)${t.foundSomethingRate != null ? `, ${t.foundSomethingRate}% de trouvailles confirmées` : ""}`),
    "",
    "Auto-diagnostic (périmètre tool-brain uniquement, jamais un audit du paysage entier) :",
    self.findings.length ? self.findings.map((f) => `- ${f}`).join("\n") : "- Aucun signal d'anomalie sur le périmètre propre de tool-brain.",
  ];
  return lines.join("\n");
}

function main() {
  recordCliUsage("tool-brain");
  const [, , ...rest] = process.argv;

  if (rest[0] === "rapport") {
    const history = loadToolUsageHistory();
    let checkLastCommitSource;
    try {
      checkLastCommitSource = readFileSync(new URL("./hooks/check-last-commit.mjs", import.meta.url), "utf8");
    } catch { /* best-effort, jamais bloquant */ }
    console.log(formatToolBrainReport({ history, checkLastCommitSource }));
    return;
  }

  const taskDescription = rest.join(" ");
  if (!taskDescription) {
    console.log('Usage : node scripts/tool-brain.mjs "<description de la tâche>" [--file <chemin>]');
    console.log("        node scripts/tool-brain.mjs rapport");
    return;
  }
  const fileFlagIndex = rest.indexOf("--file");
  const filePath = fileFlagIndex >= 0 ? rest[fileFlagIndex + 1] : undefined;
  const cleanDescription = fileFlagIndex >= 0 ? rest.slice(0, fileFlagIndex).join(" ") : taskDescription;
  const { prestations, fileAdvice, criticite } = adviseToolBrain({ taskDescription: cleanDescription, filePath });

  console.log(`tool-brain — pour : "${cleanDescription}"${filePath ? ` (fichier : ${filePath})` : ""}\n`);
  if (prestations.length) {
    console.log(`${prestations.length} prestation(s) du catalogue LE-COORDINATEUR pertinente(s) :`);
    for (const p of prestations) console.log(`- ${p.nom} → ${p.outils.join(" + ")} (mots-clés : ${p.matched.join(", ")}) — ${p.cout}`);
  } else {
    console.log("Aucune correspondance dans le catalogue PRESTATIONS pour cette description.");
  }
  if (fileAdvice) {
    if (fileAdvice.findBooster.notFound && fileAdvice.findDeepBooster.notFound) {
      console.log("\n🧠 find-brain : fichier introuvable (pas encore créé ?) — rien à recommander tant qu'il n'existe pas.");
    } else {
      console.log(fileAdvice.recommend.length ? `\n🧠 find-brain : ${fileAdvice.recommend.join(" + ")} recommandé(s) pour ce fichier.` : "\n🧠 find-brain : aucun des deux outils de recherche n'est nécessaire pour ce fichier.");
    }
  }
  // La criticité passe AVANT tout le reste dans la lecture : savoir qu'on s'apprête à toucher un
  // fichier maître change la façon de mener l'action, pas seulement l'outil qu'on choisit.
  if (criticite && !criticite.absent) {
    console.log(`\n⚖️  criticité : ${String(criticite.niveau).toUpperCase()} (score ${criticite.score}) — risque maximal applicable sans repasser par l'utilisateur : « ${criticite.risqueMaxAutorise} »`);
    for (const sig of (criticite.signaux ?? []).slice(0, 4)) console.log(`     · ${typeof sig === "string" ? sig : `${sig.nom}${sig.detail ? ` — ${sig.detail}` : ""}`}`);
    if (["maitre", "tuyauterie", "critique"].includes(criticite.niveau)) {
      console.log("     ⚠️  Relecture humaine et contrôle de perte de références OBLIGATOIRES avant d'appliquer quoi que ce soit ici.");
    }
  }
  if (!prestations.length && !fileAdvice) {
    console.log("Vérifier manuellement si un outil existant répond déjà au besoin avant de foncer (Article 3, anti-doublon).");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
