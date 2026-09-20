// check-tasks-details.mjs — état des lieux des tâches à la demande, gratuit, mécanique (2026-09-20,
// demande explicite de l'utilisateur : un gabarit pour ses demandes type « fais-moi l'état des
// tâches en cours », avec un choix de zoom [en cours actuellement / vue élargie / tout le projet]
// et de forme [liste rapide / arborescence détaillée], rendu en fichier HTML séparé). Statut complet
// comme un membre à part entière du paysage d'outils (choix explicite de l'utilisateur, Article 16
// — pas un simple utilitaire comme LE-COORDINATEUR/CIRCLE-TASKS) : cf.
// docs/check-tasks-details-blueprint.md (principe générique) et
// docs/referentiel/check-tasks-details.md (instanciation propre à ce projet).
//
// LECTURE SEULE, non négociable (choix explicite de l'utilisateur, Article 16 : « le suivi des
// tâches [...] est sa mère »). Cet outil ne modifie JAMAIS docs/suivi/, qui reste l'unique source de
// vérité. Il lit ce qui existe déjà (Sujet/Sous-sujet/Sensibilité, déjà présents dans chaque ligne du
// suivi — cf. docs/systeme-de-suivi.md) et calcule, pour SON PROPRE rapport, des regroupements/tris
// utiles à la lecture (thème > sous-thème > tâche, statut, sensibilité) — jamais une réécriture. Si
// une classification utile manque, il la propose dans son rapport ; c'est toujours à l'agent de
// l'ajouter ensuite au suivi à la main, comme pour toute autre tâche.
//
// Consultation du coordinateur (2026-09-20, demande explicite de l'utilisateur : « check-tasks-
// details travaille en étroite collaboration avec le coordinateur : pour chaque tâche à accomplir,
// il consulte le coordinateur qui lui dit quelles prestations permettent de remplir la tâche »). Pour
// chaque tâche encore ouverte listée dans le rapport, `suggestPrestationsForTask()`
// (le-coordinateur.mjs) est appelée pour signaler, quand une correspondance de mots-clés existe, quel
// outil du paysage pourrait aider à la faire avancer — jamais une certitude, un simple signal.
//
// Vérification croisée automatique (choix explicite de l'utilisateur, Article 16) : chaque
// génération de rapport compare son instantané courant au dernier instantané archivé
// (docs/check-tasks-details/historique.jsonl) pour repérer deux anomalies mécaniques honnêtes —
// jamais un jugement de contenu : une régression de statut, ou une tâche ouverte identique depuis
// au moins 3 instantanés consécutifs (signal de stagnation possible, à vérifier, jamais une
// certitude d'oubli).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { categorizeAllSessions } from "./check-suivi-fidelity.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { PRESTATIONS, suggestPrestationsForTask } from "./le-coordinateur.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
export const OUT_DIR = join(ROOT, "docs/check-tasks-details");
export const SNAPSHOTS_FILE = join(OUT_DIR, "historique.jsonl");
export const INDEX_FILE = join(OUT_DIR, "index.md");

export const ZOOM_LEVELS = ["en_cours", "elargi", "projet_entier"];
export const FORMATS = ["liste", "arborescence"];
const ZOOM_LABELS = { en_cours: "Tâches en cours actuellement", elargi: "Vue élargie (ouvertes + terminées récentes)", projet_entier: "Tout le projet" };
const FORMAT_LABELS = { liste: "liste rapide", arborescence: "arborescence détaillée" };

// Aplatit les 4 paniers de categorizeAllSessions() en une seule liste de lignes annotées — jamais un
// second parseur de tableau markdown (anti-duplication, docs/regles-de-travail.md §7ter) : ce module
// ne fait QUE lire ce que check-suivi-fidelity.mjs sait déjà extraire.
export function loadAllTaskRows(sessionsDir, readDir, readFile, exists) {
  const buckets = categorizeAllSessions(sessionsDir, readDir, readFile, exists);
  const rows = [];
  for (const [statusKey, entries] of Object.entries(buckets)) {
    for (const entry of entries) {
      const [n, horodatage, sujet, sousSujet, sensibilite, , statut] = entry.cells;
      rows.push({
        n: Number(n) || undefined,
        horodatage,
        sujet: sujet ?? "?",
        sousSujet: sousSujet ?? "?",
        sensibilite: sensibilite ?? "?",
        statut: statut ?? entry.statut,
        statusKey,
        file: entry.file,
      });
    }
  }
  return rows;
}

// Découpe "Sujet" en thème/sous-thème selon la convention déjà utilisée partout dans docs/suivi
// (« Thème / Sous-thème (détail) ») — jamais une nouvelle taxonomie inventée, seulement la lecture
// d'une convention qui existe déjà dans le texte des lignes.
export function splitSujet(sujet) {
  const [theme, ...rest] = String(sujet ?? "?").split(" / ");
  return { theme: theme.trim() || "?", sousTheme: rest.join(" / ").trim() || "Général" };
}

const OPEN_KEYS = new Set(["ouverte", "enCours", "autre"]);

export function filterByZoom(rows, zoom, { latestTaskNumber } = {}) {
  if (!ZOOM_LEVELS.includes(zoom)) throw new Error(`zoom inconnu : ${zoom}`);
  if (zoom === "projet_entier") return rows;
  const isOpen = (r) => OPEN_KEYS.has(r.statusKey);
  if (zoom === "en_cours") return rows.filter(isOpen);
  // "elargi" : tout ce qui reste ouvert + les 20 dernières tâches numérotées (terminées incluses),
  // jamais une fenêtre de temps — un numéro de tâche est strictement croissant et sans ambiguïté de
  // fuseau horaire, même principe que countTasksSince() (check-suivi-fidelity.mjs).
  const threshold = (latestTaskNumber ?? Math.max(0, ...rows.map((r) => r.n || 0))) - 20;
  return rows.filter((r) => isOpen(r) || (r.n ?? 0) > threshold);
}

// Arborescence thème > sous-thème > tâche — chaque feuille porte son N°, sa sensibilité et son
// statut, pour rester lisible sans avoir à rouvrir docs/suivi/.
// Icône de statut (2026-09-20, retour direct de l'utilisateur sur le tout premier rapport livré :
// « la distinction être fait/en cours/à faire n'est pas assez claire, pas assez visible »). Le
// texte du statut réel (`t.statut`, verbatim depuis docs/suivi/) reste affiché intégralement à côté
// — l'icône ne le remplace jamais, elle attire juste l'œil avant la lecture du détail.
const STATUS_ICONS = { enCours: "🔄", ouverte: "📋", terminee: "✅", autre: "❓" };

export function buildTree(rows) {
  const themes = new Map();
  for (const row of rows) {
    const { theme, sousTheme } = splitSujet(row.sujet);
    if (!themes.has(theme)) themes.set(theme, new Map());
    const sousThemes = themes.get(theme);
    if (!sousThemes.has(sousTheme)) sousThemes.set(sousTheme, []);
    sousThemes.get(sousTheme).push(row);
  }
  const nodes = [];
  for (const [theme, sousThemes] of themes) {
    const children = [];
    let total = 0;
    for (const [sousTheme, tasks] of sousThemes) {
      total += tasks.length;
      children.push({
        label: `${sousTheme} (${tasks.length})`,
        children: tasks.map((t) => ({
          label: `${STATUS_ICONS[t.statusKey] ?? "❓"} #${t.n ?? "—"} · [${t.sensibilite}] ${t.sousSujet} — ${t.statut}`,
          statusKey: t.statusKey,
        })),
      });
    }
    nodes.push({ label: `${theme} (${total})`, children });
  }
  return nodes;
}

export function buildListBlocks(rows) {
  const groups = [
    [`${STATUS_ICONS.enCours} En cours`, rows.filter((r) => r.statusKey === "enCours")],
    [`${STATUS_ICONS.ouverte} Ouvertes`, rows.filter((r) => r.statusKey === "ouverte")],
    [`${STATUS_ICONS.autre} Autre statut (à vérifier)`, rows.filter((r) => r.statusKey === "autre")],
    [`${STATUS_ICONS.terminee} Terminées`, rows.filter((r) => r.statusKey === "terminee")],
  ];
  const blocks = [];
  for (const [label, tasks] of groups) {
    if (!tasks.length) continue;
    blocks.push({ type: "heading", text: `${label} (${tasks.length})` });
    blocks.push({
      type: "table",
      headers: ["N°", "Sensibilité", "Sujet", "Sous-sujet", "Statut"],
      rows: tasks.map((t) => [t.n ?? "—", t.sensibilite, t.sujet, t.sousSujet, t.statut]),
    });
  }
  return blocks;
}

// Pour chaque tâche encore ouverte, un signal de correspondance possible avec une prestation du
// coordinateur — jamais forcé : seules les tâches avec au moins une correspondance apparaissent.
// `onboardingContext` (2026-09-20, trouvaille réelle : c'était l'unique appelant réel de
// suggestPrestationsForTask() en production, et il ne passait jamais ce paramètre — le badge
// n'était donc jamais réellement vérifié nulle part, malgré son propre chokepoint déjà construit)
// est optionnel et rétrocompatible ; passé ici, tout outil suggéré sans son badge est signalé dans
// la même ligne, jamais un second rapport séparé.
export function suggestToolsForOpenTasks(rows, prestations = PRESTATIONS, onboardingContext = null) {
  const openRows = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
  const items = [];
  for (const row of openRows) {
    const matches = suggestPrestationsForTask(`${row.sujet} ${row.sousSujet}`, prestations, onboardingContext);
    if (!matches.length) continue;
    const warning = matches[0].badgeWarnings?.length ? ` — ⚠️ ${matches[0].badgeWarnings.join(" ; ")}` : "";
    items.push(`#${row.n ?? "—"} « ${row.sousSujet} » → ${matches[0].outils.join(" + ")} (mots-clés : ${matches[0].matched.join(", ")})${warning}`);
  }
  return items;
}

// Compare l'instantané courant au dernier instantané archivé — deux anomalies mécaniques honnêtes,
// jamais un jugement de contenu (cf. en-tête du fichier).
export function compareSnapshots(previousSnapshots, currentRows) {
  const regressions = [];
  const stagnant = [];
  if (!previousSnapshots.length) return { regressions, stagnant };
  const rank = { ouverte: 0, autre: 0, enCours: 1, terminee: 2 };
  const last = previousSnapshots[previousSnapshots.length - 1];
  const lastByN = new Map(last.rows.map((r) => [r.n, r]));
  for (const row of currentRows) {
    const prev = lastByN.get(row.n);
    if (prev && (rank[row.statusKey] ?? 0) < (rank[prev.statusKey] ?? 0)) {
      regressions.push({ n: row.n, sousSujet: row.sousSujet, before: prev.statusKey, after: row.statusKey });
    }
  }
  const recent = previousSnapshots.slice(-2);
  if (recent.length === 2) {
    for (const row of currentRows) {
      if (!OPEN_KEYS.has(row.statusKey)) continue;
      const seenInBoth = recent.every((snap) => snap.rows.some((r) => r.n === row.n && OPEN_KEYS.has(r.statusKey)));
      if (seenInBoth) stagnant.push({ n: row.n, sousSujet: row.sousSujet });
    }
  }
  return { regressions, stagnant };
}

export function loadSnapshotHistory(file = SNAPSHOTS_FILE, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(file)) return [];
  return readFile(file).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

// Signature stable d'un jeu de lignes (n + statutKey, dans l'ordre) — jamais l'horodatage, qui
// varie toujours et rendrait toute comparaison inutile.
function rowsSignature(rows) {
  return JSON.stringify(rows.map((r) => [r.n, r.statusKey]));
}

// Dé-doublonnage des instantanés consécutifs identiques (2026-09-20, bug réel trouvé en analysant
// le tout premier rapport livré à l'utilisateur : plusieurs relances rapprochées du script pendant
// une session de débogage — quelques minutes d'écart — avaient chacune ajouté leur propre
// instantané, alors que rien n'avait réellement changé entre elles. `compareSnapshots()` comptait
// ensuite ces doublons comme des observations RÉELLEMENT séparées dans le temps, gonflant
// artificiellement le signal de stagnation ("16 tâches ouvertes identiques depuis 3 rapports" alors
// que 2 des 3 rapports comptés dataient de 90 secondes d'écart, sans aucun travail entre les deux).
// Jamais un jugement de contenu — seulement refuser d'enregistrer une observation qui ne dit rien
// de plus que la précédente. Un instantané réellement différent (même un seul statut changé) est
// toujours écrit normalement.
export function appendSnapshot(rows, { file = SNAPSHOTS_FILE, dir = OUT_DIR, now = () => new Date().toISOString() } = {}) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const prior = existsSync(file) ? readFileSync(file, "utf8") : "";
  const priorLines = prior.trim().split("\n").filter(Boolean);
  const lastSnapshot = priorLines.length ? JSON.parse(priorLines[priorLines.length - 1]) : null;
  const newSignature = rowsSignature(rows);
  if (lastSnapshot && rowsSignature(lastSnapshot.rows) === newSignature) {
    return { ...lastSnapshot, skipped: true };
  }
  const snapshot = { at: now(), rows: rows.map((r) => ({ n: r.n, statusKey: r.statusKey })) };
  writeFileSync(file, prior + JSON.stringify(snapshot) + "\n", "utf8");
  return snapshot;
}

// Construit le contenu du rapport (pure, testable) — la génération HTML et l'écriture d'instantané
// restent dans main(), jamais mélangées ici.
export function buildReport({ zoom = "en_cours", format = "liste", allRows, history = [], onboardingContext = null } = {}) {
  if (!ZOOM_LEVELS.includes(zoom)) throw new Error(`zoom inconnu : ${zoom}`);
  if (!FORMATS.includes(format)) throw new Error(`format inconnu : ${format}`);
  const rows = allRows ?? loadAllTaskRows();
  const latestTaskNumber = Math.max(0, ...rows.map((r) => r.n || 0));
  const scoped = filterByZoom(rows, zoom, { latestTaskNumber });
  const { regressions, stagnant } = compareSnapshots(history, rows);

  const blocks = [];
  if (regressions.length) {
    blocks.push({ type: "note", text: `⚠️ ${regressions.length} régression(s) de statut détectée(s) depuis le dernier rapport — à vérifier en priorité.` });
    blocks.push({ type: "list", items: regressions.map((r) => `#${r.n} « ${r.sousSujet} » : ${r.before} → ${r.after}`) });
  }
  if (stagnant.length) {
    blocks.push({ type: "note", text: `${stagnant.length} tâche(s) ouverte(s) identiques depuis au moins 3 rapports consécutifs — possible oubli, à vérifier (jamais une certitude).` });
    blocks.push({ type: "list", items: stagnant.map((s) => `#${s.n} « ${s.sousSujet} »`) });
  }
  blocks.push(format === "arborescence" ? { type: "tree", nodes: buildTree(scoped) } : { type: "noop" });
  if (format === "liste") blocks.push(...buildListBlocks(scoped));

  const suggestions = suggestToolsForOpenTasks(scoped, PRESTATIONS, onboardingContext);
  if (suggestions.length) {
    blocks.push({ type: "heading", text: "Outils du coordinateur pouvant aider (correspondance de mots-clés, à vérifier)" });
    blocks.push({ type: "list", items: suggestions });
  }

  return {
    title: `État des tâches — ${ZOOM_LABELS[zoom]}`,
    subtitle: `Forme : ${FORMAT_LABELS[format]} · ${scoped.length} tâche(s) affichée(s) sur ${rows.length} au total`,
    blocks: blocks.filter((b) => b.type !== "noop"),
    meta: { zoom, format, count: scoped.length, total: rows.length, regressions, stagnant },
  };
}

function appendIndexRow({ file, zoom, format, count, total, regressions, stagnant }) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const header = "| Date | Zoom | Forme | Tâches affichées | Total | Régressions | Stagnations | Rapport |\n|---|---|---|---|---|---|---|---|\n";
  const prior = existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, "utf8") : `# Registre check-tasks-details\n\n${header}`;
  const row = `| ${new Date().toISOString()} | ${zoom} | ${format} | ${count} | ${total} | ${regressions.length} | ${stagnant.length} | ${file} |\n`;
  writeFileSync(INDEX_FILE, prior + row, "utf8");
}

// Construit le contexte de badge réel — zéro coût API, aucun appel réseau : uniquement des
// lectures de fichiers locaux déjà présents sur disque (CLAUDE.md, docs/regles-de-travail.md,
// l'arborescence de docs/, les sessions de docs/suivi/ déjà relues par catégorizeAllSessions() pour
// le reste de ce rapport). Fonction dédiée plutôt qu'inlinée dans main() pour rester testable sans
// dépendre du système de fichiers réel.
// `root` doit être fourni SANS séparateur final (rappel trouvé le 2026-09-20 : ROOT se termine déjà
// par "/" — un simple `slice(root.length + 1)` grignotait la première lettre de "docs/", faussant
// silencieusement TOUTE vérification de registre/instanciation en aval, découvert en voyant
// check-tasks-details lui-même signalé "sans badge" alors que ses trois fichiers existent bien).
function walkDocsPaths(dir, root, out = new Set()) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    out.add(full.slice(root.length).replace(/^[\\/]/, "").replace(/\\/g, "/"));
    if (entry.isDirectory()) walkDocsPaths(full, root, out);
  }
  return out;
}
export function buildRealOnboardingContext(root = ROOT.replace(/\/$/, "")) {
  const docsDir = join(root, "docs");
  const existingPaths = walkDocsPaths(docsDir, root);
  const sessionsDir = join(root, "docs/suivi/sessions");
  let suiviText = "";
  if (existsSync(sessionsDir)) {
    for (const f of readdirSync(sessionsDir)) suiviText += readFileSync(join(sessionsDir, f), "utf8");
  }
  return {
    toolsTableMarkdown: existsSync(join(root, "docs/regles-de-travail.md")) ? readFileSync(join(root, "docs/regles-de-travail.md"), "utf8") : "",
    claudeMdText: existsSync(join(root, "CLAUDE.md")) ? readFileSync(join(root, "CLAUDE.md"), "utf8") : "",
    existingPaths,
    suiviText,
    // Seule déviation Agent réelle et documentée à ce jour (docs/regles-de-travail.md) — sans ça,
    // THE-DEEP-READER ressortirait à tort "sans badge" ici, alors qu'il est complet une fois ses
    // deux déviations assumées prises en compte (cf. checkAgentOnboarding(), le-coordinateur.mjs).
    agentOverrides: { "THE-DEEP-READER": { cousinOf: "THE-FINAL-JUDGE", registryPathPrefix: "docs/suivi/relectures-lourdes/" } },
  };
}

function main() {
  const [, , zoomArg = "en_cours", formatArg = "liste"] = process.argv;
  const zoom = ZOOM_LEVELS.includes(zoomArg) ? zoomArg : "en_cours";
  const format = FORMATS.includes(formatArg) ? formatArg : "liste";

  const allRows = loadAllTaskRows();
  const history = loadSnapshotHistory();
  const onboardingContext = buildRealOnboardingContext();
  const report = buildReport({ zoom, format, allRows, history, onboardingContext });

  const html = renderHtmlReport({
    title: report.title,
    subtitle: report.subtitle,
    dateLabel: new Date().toISOString(),
    blocks: report.blocks,
    footer: "check-tasks-details — lecture seule, docs/suivi/ reste l'unique source de vérité du projet.",
  });

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const outFile = join(OUT_DIR, `${Date.now()}-${zoom}-${format}.html`);
  writeFileSync(outFile, html, "utf8");
  appendSnapshot(allRows);
  appendIndexRow({ file: outFile, zoom, format, ...report.meta });

  console.log(`Rapport généré : ${outFile}`);
  console.log(`Zoom : ${ZOOM_LABELS[zoom]} — Forme : ${FORMAT_LABELS[format]}`);
  console.log(`${report.meta.count} tâche(s) affichée(s) sur ${report.meta.total} au total.`);
  if (report.meta.regressions.length) console.log(`⚠️ ${report.meta.regressions.length} régression(s) détectée(s).`);
  if (report.meta.stagnant.length) console.log(`${report.meta.stagnant.length} tâche(s) possiblement oubliée(s) (stagnation).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
