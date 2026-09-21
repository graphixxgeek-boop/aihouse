// objectifs-vs-resultats (tâche #287, 2026-09-21, demande explicite de l'utilisateur : « tool brain
// delivre un rapport txt à chaque ronde [...] est-ce qu'on en fait un membre certifié ? » — role
// distinct, validé point par point : (1) un petit registre qui fixe un objectif chiffré par entité
// et par période ; (2) ne mesure JAMAIS lui-même un résultat — relit ce que les outils existants
// savent déjà (tool-usage.mjs) ; (3) calcule seulement l'écart objectif/résultat et un statut. Ce
// n'est ni un sous-agent de CASSANDRA-RH (organigramme plat, aucun outil n'a de sous-agent — le
// lier au calendrier de CASSANDRA casserait la séparation demandée), ni une extension du tableau de
// bord/KPI (le KPI mesure un résultat, celui-ci fixe une CIBLE et calcule l'écart) — un Membre
// standalone de plus, même statut que CLONE-HUNTER/AXA-CHECK : CASSANDRA-RH consommera plus tard ce
// que ce module dit, exactement comme elle consommera ARGUS/AXA-CHECK, jamais l'inverse.
//
// Registre hand-maintained (docs/objectifs-vs-resultats/registre.md, jamais généré) : une table
// markdown Entité|Début|Fin|Objectif|Unité|Source|Note. `Source` dit QUEL signal déjà existant lire
// pour mesurer le résultat réel — jamais un second calcul divergent de tool-usage.mjs :
//   - "usage-count"  : nombre de sollicitations réelles de l'entité (un slug d'outil) sur la période.
//   - "found-rate"   : % de sollicitations ayant réellement trouvé quelque chose sur la période.
// Toute autre valeur de Source est un gap de conception à combler plus tard (memory-audit,
// AXA-CHECK, KPI...), jamais fabriquée ici par supposition.

import { readFileSync } from "node:fs";
import { dataRows } from "./lib-markdown-table.mjs";
import { loadToolUsageHistory } from "./tool-brain.mjs";

const REGISTRY_PATH = new URL("../docs/objectifs-vs-resultats/registre.md", import.meta.url);

export function loadObjectifsRegistry(readFile = (u) => readFileSync(u, "utf8")) {
  try {
    return readFile(REGISTRY_PATH);
  } catch {
    return "";
  }
}

// parseObjectifsTable() — colonnes lues par NOM sur la ligne d'en-tête (même discipline que
// parseToolsTable(), le-coordinateur.mjs : jamais par position fixe, cf. le bug réel corrigé le
// 2026-09-20 quand une colonne ajoutée avait décalé une lecture positionnelle). Réutilise dataRows()
// (lib-markdown-table.mjs) pour le filtrage des lignes brutes, jamais une troisième réécriture du
// même filtrage déjà mutualisé.
export function parseObjectifsTable(markdown) {
  const lines = String(markdown ?? "").split("\n").filter((l) => l.trim().startsWith("|"));
  if (!lines.length) return [];
  const headerCells = lines[0].split("|").slice(1, -1).map((c) => c.trim());
  const idx = {
    entite: headerCells.indexOf("Entité"),
    debut: headerCells.indexOf("Début"),
    fin: headerCells.indexOf("Fin"),
    objectif: headerCells.indexOf("Objectif"),
    unite: headerCells.indexOf("Unité"),
    source: headerCells.indexOf("Source"),
    note: headerCells.indexOf("Note"),
  };
  if (idx.entite === -1 || idx.debut === -1 || idx.fin === -1 || idx.objectif === -1 || idx.source === -1) return [];
  const rows = [];
  for (const line of dataRows(markdown, "Entité")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const entite = cells[idx.entite];
    if (!entite || entite === "Entité" || /^-+$/.test(entite)) continue;
    const objectif = Number(cells[idx.objectif]);
    if (!Number.isFinite(objectif)) continue;
    rows.push({
      entite: entite.replace(/`/g, ""),
      debut: cells[idx.debut],
      fin: cells[idx.fin],
      objectif,
      unite: idx.unite !== -1 ? cells[idx.unite] : undefined,
      source: cells[idx.source],
      note: idx.note !== -1 ? cells[idx.note] : undefined,
    });
  }
  return rows;
}

// computeResultat() — jamais une seconde mesure divergente : relit tool-usage.mjs::toolUsageStats()
// n'est PAS réutilisé ici (il agrège sur toute la durée de vie, jamais borné à une période) — le
// filtrage par [début, fin réellement écoulée] est le seul calcul propre à ce module, sur les
// événements bruts de .tool-usage-history.json, exactement les mêmes que tool-usage.mjs lit.
function eventsInPeriod(history, entite, debut, finEffective) {
  const start = Date.parse(debut);
  const end = Date.parse(finEffective);
  return (history?.events ?? []).filter((e) => e.toolSlug === entite && e.at >= start && e.at <= end);
}

export function computeResultat(row, history, now = Date.now()) {
  const finBorne = Math.min(Date.parse(row.fin), now);
  const events = eventsInPeriod(history, row.entite, row.debut, new Date(finBorne).toISOString());
  if (row.source === "found-rate") {
    if (!events.length) return { valeur: null, hasData: false };
    const trouve = events.filter((e) => e.foundSomething === true).length;
    return { valeur: Math.round((trouve / events.length) * 100), hasData: true };
  }
  // "usage-count" par défaut — jamais une troisième source devinée pour une valeur inconnue.
  return { valeur: events.length, hasData: true };
}

export function periodStatus(row, now = Date.now()) {
  if (now < Date.parse(row.debut)) return "à venir";
  if (now > Date.parse(row.fin)) return "clos";
  return "en cours";
}

// atteint/en dessous/dépassé (2026-09-21, formulation explicite de l'utilisateur, tâche #287) —
// jamais une marge arbitraire pour distinguer "atteint" de "dépassé" : une égalité stricte reste
// "atteint", tout le reste au-dessus est "dépassé", tout le reste en dessous est "en dessous". Une
// source "found-rate" sans aucun événement sur la période reste "pas de données", jamais un 0%
// fabriqué qui laisserait croire à un vrai échec mesuré.
export function computeStatus(row, resultat) {
  if (!resultat.hasData) return "pas de données";
  if (resultat.valeur === row.objectif) return "atteint";
  return resultat.valeur > row.objectif ? "dépassé" : "en dessous";
}

export function buildObjectifsReport(markdown, history, { now = Date.now() } = {}) {
  return parseObjectifsTable(markdown).map((row) => {
    const resultat = computeResultat(row, history, now);
    return { ...row, resultat: resultat.valeur, hasData: resultat.hasData, statut: computeStatus(row, resultat), periode: periodStatus(row, now) };
  });
}

export function formatObjectifsReport(rows) {
  if (!rows.length) return "Aucun objectif enregistré (docs/objectifs-vs-resultats/registre.md est vide ou absent).";
  const STATUT_ICON = { "atteint": "✅", "dépassé": "🚀", "en dessous": "⏳", "pas de données": "❔" };
  return rows
    .map((r) => {
      const uniteTxt = r.unite ? ` ${r.unite}` : "";
      const resultatTxt = r.hasData ? `${r.resultat}${uniteTxt}` : "pas de données";
      return `${STATUT_ICON[r.statut] ?? ""} ${r.entite} (${r.debut} → ${r.fin}, ${r.periode}) : objectif ${r.objectif}${uniteTxt}, résultat réel ${resultatTxt} — ${r.statut}${r.note ? ` (${r.note})` : ""}`;
    })
    .join("\n");
}

function main() {
  const [, , sub] = process.argv;
  if (sub !== "rapport") {
    console.log("Usage : node scripts/objectifs-vs-resultats.mjs rapport");
    return;
  }
  const markdown = loadObjectifsRegistry();
  const history = loadToolUsageHistory();
  const rows = buildObjectifsReport(markdown, history);
  console.log("=== objectifs-vs-resultats — rapport ===\n");
  console.log(formatObjectifsReport(rows));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
