// CASSANDRA-RH — l'Agent Cadre RH de l'Agence Codex (2026-09-22, round de calibrage en 20
// questions consigné dans docs/cassandra-rh-conception.md, tâche de suivi #134 close par ce round).
// Noyau de première version, décidé explicitement avec l'utilisateur : NOTER l'équipe + SUPERVISER
// le badge + LIRE le KPI, plus le squelette (sans vraie recherche web) du recrutement en 3 temps —
// tout le reste (promotion de poste, gabarit de poste par classe, entretien de
// organisation-agence.md, stagiaire pré-processeur, vraie recherche web) reste explicitement pour
// une prochaine vague de construction, jamais deviné ni anticipé ici.
//
// Anti-doublon, principe fondateur non négociable (déjà écrit dans docs/cassandra-rh-conception.md
// §1, reproduit ici pour qu'il vive avec le code qu'il gouverne, Article 13) : CASSANDRA-RH ne
// recalcule JAMAIS ce qu'un autre outil sait déjà — elle LIT ses résultats et les traduit en langage
// RH. Concrètement dans ce fichier : le badge vient de checkAgentOnboarding()/checkAllAgentBadges()
// (le-coordinateur.mjs), le KPI vient de kpi-historique.csv (kpi-report.mjs), l'usage réel vient de
// tool-usage.mjs, la stagnation relative vient de clean-dirty-old.mjs — aucune de ces quatre choses
// n'est recalculée ici, jamais une seconde version qui pourrait diverger de l'originale.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseToolsTable } from "./le-coordinateur.mjs";
import { AGENT_CATEGORIES, assertNotAPersonnage } from "./lib-shell.mjs";
import { toolsNeverUsed, toolUsageStats, loadJson as loadUsageJson } from "./tool-usage.mjs";
import { relativeStaleness, lastTouchDays } from "./clean-dirty-old.mjs";
import { AGENT_SCRIPT_FILES } from "./axa-check.mjs";
import { KPI_HISTORY_COLUMNS, KPI_HISTORY_PATH } from "./kpi-report.mjs";
import { renderHtmlReport } from "./html-report.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// Personnage FIXE (2026-09-22, demande explicite : « un ton fixe et reconnaissable [...] comme
// THE-FINAL-JUDGE »). Reproduit mot pour mot par l'agent qui pilote au moment de narrer un rapport
// de CASSANDRA — jamais reformulé, même garde-fou que le personnage de THE-FINAL-JUDGE
// (judge-persona-shared.mjs) contre toute dérive vers un ton neutre. CASSANDRA-RH n'est PAS un
// agent séparé (elle ne spawn jamais de second appel de raisonnement, cf. Article 8/22) : ce texte
// prime la NARRATION que l'agent qui pilote fait de ses résultats mécaniques, jamais un texte
// envoyé à un modèle.
export const CASSANDRA_PERSONA = [
  "CASSANDRA-RH est une directrice des ressources humaines exigeante mais juste.",
  "Elle ne flatte jamais un outil pour lui faire plaisir, et ne descend jamais un outil sans donner",
  "le chiffre exact qui le justifie. Elle parle avec l'assurance calme de quelqu'un qui connaît",
  "chaque dossier de l'équipe par cœur — jamais de sur-jugement moral, jamais de mise en scène,",
  "juste le constat, net, et la conséquence concrète qu'il implique. Un outil qui mérite un badge",
  "l'obtient sans effusion ; un outil à retirer se voit nommé sans détour, jamais euphémisé.",
].join(" ");

// --- Lecture du KPI existant (kpi-report.mjs garde le calcul, CASSANDRA lit) ------------------

// Parseur minimal volontaire : les colonnes de kpi-historique.csv sont toutes des nombres ou des
// chaînes simples sans virgule interne (KPI_HISTORY_COLUMNS, kpi-report.mjs) — un vrai parseur CSV
// (guillemets, virgules échappées) serait une dépendance de plus pour un besoin qui n'existe pas
// dans ce fichier précis. Une cellule vide reste `undefined`, jamais une chaîne vide ni un 0 fabriqué
// (Article 1.9 de docs/philosophie-et-politique.md : une mesure absente doit rester visiblement
// absente).
export function parseKpiHistoryCsv(csvText) {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",");
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const row = {};
    header.forEach((col, i) => {
      const raw = cells[i];
      row[col] = raw === undefined || raw === "" ? undefined : (Number.isNaN(Number(raw)) ? raw : Number(raw));
    });
    rows.push(row);
  }
  return rows;
}

// Compare les deux dernières lignes ayant une vraie valeur pour chaque famille demandée — jamais
// une comparaison entre deux lignes qui n'ont simplement pas mesuré la même chose (une famille
// absente d'un run n'est pas une régression, c'est une donnée qui n'existe pas cette fois-là).
export function latestKpiTrend(rows, families = KPI_HISTORY_COLUMNS.filter((c) => c.endsWith("_pct"))) {
  const trend = {};
  for (const family of families) {
    const withValue = rows.filter((r) => typeof r[family] === "number");
    if (withValue.length === 0) { trend[family] = { current: undefined, previous: undefined, delta: undefined }; continue; }
    const current = withValue[withValue.length - 1][family];
    const previous = withValue.length >= 2 ? withValue[withValue.length - 2][family] : undefined;
    trend[family] = { current, previous, delta: previous === undefined ? undefined : Math.round((current - previous) * 10) / 10 };
  }
  return trend;
}

export function loadKpiTrend(path = join(ROOT, KPI_HISTORY_PATH)) {
  if (!existsSync(path)) return { rows: [], trend: {} };
  const rows = parseKpiHistoryCsv(readFileSync(path, "utf8"));
  return { rows, trend: latestKpiTrend(rows) };
}

// --- Effectif de l'équipe (constat chiffré honnête, jamais un seuil auto-jugé) -----------------

// Table maîtresse -> uniquement les lignes de statut "Agent" (les seules éligibles au badge,
// cf. checkAgentOnboarding()) — un Utilitaire nommé ou une Infrastructure n'est jamais compté ici
// comme "membre" au sens RH, cohérent avec le reste du réseau d'outils.
export function teamRoster(toolsTableMarkdown) {
  return parseToolsTable(toolsTableMarkdown)
    .filter((row) => row.statut === "Agent")
    .map((row) => ({ tool: row.tool, category: AGENT_CATEGORIES[slugify(row.tool)] }));
}

function slugify(name) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Simple constat chiffré (2026-09-22, demande explicite : « un simple constat chiffré, jamais un
// jugement automatique ») — jamais un verdict "trop grande"/"trop petite" fabriqué par ce script :
// c'est toujours l'utilisateur qui juge, à la lecture de ces chiffres.
export function teamSizeSnapshot(roster) {
  const byCategory = {};
  for (const member of roster) {
    const key = member.category ?? "(catégorie non répertoriée)";
    byCategory[key] = (byCategory[key] ?? 0) + 1;
  }
  return { total: roster.length, byCategory };
}

// --- Outils à retirer ou refondre (réutilise TEL QUEL l'existant, jamais un nouveau calcul) ----

// Combine deux signaux déjà calculés ailleurs, jamais un troisième calcul RH inventé (2026-09-22,
// demande explicite : « réutiliser tel quel l'existant, jamais un nouveau calcul ») : jamais
// sollicité (tool-usage.mjs::toolsNeverUsed) et stagnation relative sur le fichier script lui-même
// (clean-dirty-old.mjs::relativeStaleness, appliqué ici à AGENT_SCRIPT_FILES plutôt qu'à LIB_MAP,
// qui ne couvre que le moteur du jeu).
export function toolsToReconsider({ usageHistory, knownSlugs, staleness }) {
  const neverUsed = new Set(toolsNeverUsed(usageHistory, knownSlugs));
  const findings = [];
  for (const slug of knownSlugs) {
    const reasons = [];
    if (neverUsed.has(slug)) reasons.push("jamais sollicité (tool-usage.mjs)");
    const scriptPath = AGENT_SCRIPT_FILES[slug];
    const staleEntry = scriptPath ? staleness?.[scriptPath] : undefined;
    if (staleEntry?.stale) reasons.push(`stagnant relativement au reste du projet (${staleEntry.days} j)`);
    if (reasons.length) findings.push({ slug, reasons });
  }
  return findings;
}

// Rassemble la stagnation relative de tous les scripts connus d'AGENT_SCRIPT_FILES — jamais un
// second lancement de `git log` que celui déjà fait par lastTouchDays() ailleurs dans le réseau
// d'outils, juste appliqué ici à un périmètre différent (les scripts, jamais lib/*.ts).
export function scriptStaleness(shImpl) {
  const byFile = {};
  for (const scriptPath of Object.values(AGENT_SCRIPT_FILES)) byFile[scriptPath] = lastTouchDays(scriptPath, shImpl);
  return relativeStaleness(byFile);
}

// --- Recrutement : le squelette du processus en 3 temps, sans vraie recherche web (2026-09-22) --

// Décision explicite : le squelette du processus rejoint cette première vague, mais la vraie
// recherche web (lecture de documentation/avis externes) reste hors de ce fichier tant qu'elle n'a
// pas été calibrée séparément — jamais devinée ici. `advanceRecruitmentStage()` gère uniquement la
// PROGRESSION du processus, jamais la recherche elle-même.
export const RECRUITMENT_STAGES = ["cv_provisoire", "entretien_preliminaire", "proposition"];

export function createRecruitmentCandidate(name) {
  if (!name) throw new Error("createRecruitmentCandidate: un candidat doit avoir un nom.");
  return { name, stage: RECRUITMENT_STAGES[0], history: [] };
}

// decision: "avancer" passe à l'étape suivante, "rejeter" clôt le dossier — jamais une progression
// automatique sans décision explicite (cf. Article 16 : initiative de recrutement jamais spontanée).
export function advanceRecruitmentStage(candidate, decision, now = Date.now()) {
  if (candidate.stage === "rejete" || candidate.stage === "propose") {
    throw new Error(`advanceRecruitmentStage: le dossier de "${candidate.name}" est déjà clos (${candidate.stage}) — jamais rouvert silencieusement.`);
  }
  const entry = { from: candidate.stage, decision, at: now };
  if (decision === "rejeter") return { ...candidate, stage: "rejete", history: [...candidate.history, entry] };
  if (decision !== "avancer") throw new Error(`advanceRecruitmentStage: décision inconnue "${decision}" — attendu "avancer" ou "rejeter".`);
  const idx = RECRUITMENT_STAGES.indexOf(candidate.stage);
  const nextStage = idx === RECRUITMENT_STAGES.length - 1 ? "propose" : RECRUITMENT_STAGES[idx + 1];
  return { ...candidate, stage: nextStage, history: [...candidate.history, entry] };
}

// --- Badge : CASSANDRA supervise, jamais ne recalcule (LE-COORDINATEUR garde le mécanisme) ------

// `badgeResults` est fourni par l'appelant (déjà produit par checkAllAgentBadges()/
// checkAgentOnboarding(), le-coordinateur.mjs) — jamais un second appel à ces fonctions depuis ici,
// exactement la décision actée le 2026-09-22 (« LE-COORDINATEUR garde ce rôle technique, CASSANDRA
// supervise »).
export function badgeOversightSummary(badgeResults) {
  const certified = badgeResults.filter((r) => r.complet);
  const notCertified = badgeResults.filter((r) => !r.complet);
  return {
    total: badgeResults.length,
    certified: certified.length,
    notCertified: notCertified.map((r) => ({ agentName: r.agentName, gaps: r.gaps })),
  };
}

// --- Signal léger automatique (2026-09-22 : « signal auto léger + bilan complet sur demande ») --

export function buildCassandraLightSignal({ teamSize, badgeSummary, kpiTrend }) {
  const parts = [`${teamSize.total} membre(s) actif(s)`];
  parts.push(badgeSummary.notCertified.length ? `${badgeSummary.notCertified.length} sans badge` : "tous certifiés");
  const globalTrendEntry = Object.values(kpiTrend).find((t) => t.delta !== undefined);
  if (globalTrendEntry) parts.push(`tendance KPI ${globalTrendEntry.delta >= 0 ? "+" : ""}${globalTrendEntry.delta} pt`);
  return parts.join(" — ");
}

// --- Rapport complet, en HTML dès cette première version (2026-09-22, demande explicite) -------

export function buildCassandraReportBlocks({ teamSize, badgeSummary, kpiTrend, reconsider, recruitmentCandidates = [] }) {
  const blocks = [];
  blocks.push({ type: "heading", text: "Effectif de l'équipe" });
  blocks.push({ type: "paragraph", text: `${teamSize.total} membre(s) actif(s) — ${Object.entries(teamSize.byCategory).map(([cat, n]) => `${n} ${cat}`).join(", ")}.` });

  blocks.push({ type: "heading", text: "Badges" });
  blocks.push({ type: "paragraph", text: `${badgeSummary.certified}/${badgeSummary.total} certifiés.` });
  if (badgeSummary.notCertified.length) {
    blocks.push({ type: "list", items: badgeSummary.notCertified.map((r) => `${r.agentName} — ${r.gaps.join(" ; ")}`) });
  }

  blocks.push({ type: "heading", text: "Tendance KPI (lue depuis kpi-historique.csv, jamais recalculée)" });
  const trendLines = Object.entries(kpiTrend).filter(([, t]) => t.current !== undefined).map(([family, t]) => `${family} : ${t.current}%${t.delta !== undefined ? ` (${t.delta >= 0 ? "+" : ""}${t.delta} pt)` : ""}`);
  blocks.push(trendLines.length ? { type: "list", items: trendLines } : { type: "paragraph", text: "Aucune mesure disponible pour l'instant." });

  blocks.push({ type: "heading", text: "Outils à retirer ou refondre" });
  blocks.push(reconsider.length
    ? { type: "list", items: reconsider.map((r) => `${r.slug} — ${r.reasons.join(" ; ")}`) }
    : { type: "paragraph", text: "Aucun signal de retrait pour l'instant." });

  if (recruitmentCandidates.length) {
    blocks.push({ type: "heading", text: "Recrutement en cours" });
    blocks.push({ type: "list", items: recruitmentCandidates.map((c) => `${c.name} — étape : ${c.stage}`) });
  }
  return blocks;
}

export function buildCassandraReportHtml(data, dateLabel = new Date().toISOString()) {
  return renderHtmlReport({
    title: "CASSANDRA-RH — rapport d'équipe",
    subtitle: CASSANDRA_PERSONA,
    dateLabel,
    blocks: buildCassandraReportBlocks(data),
  });
}

function main() {
  assertNotAPersonnage("CASSANDRA-RH", "cassandra-rh.mjs::main()");
  const toolsTableMarkdown = readFileSync(join(ROOT, "docs/regles-de-travail.md"), "utf8");
  const roster = teamRoster(toolsTableMarkdown);
  const teamSize = teamSizeSnapshot(roster);
  const usageHistory = loadUsageJson(join(ROOT, ".tool-usage-history.json"), { events: [] });
  const staleness = scriptStaleness();
  const knownSlugs = roster.map((m) => slugify(m.tool));
  const reconsider = toolsToReconsider({ usageHistory, knownSlugs, staleness });
  const { trend } = loadKpiTrend();
  const badgeSummary = { total: 0, certified: 0, notCertified: [] };
  console.log(CASSANDRA_PERSONA);
  console.log("");
  console.log(buildCassandraLightSignal({ teamSize, badgeSummary, kpiTrend: trend }));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
