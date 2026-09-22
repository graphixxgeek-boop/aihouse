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
import { PRESTATIONS, suggestPrestationsForTask, significantWords, badgeSignalsAsContext } from "./le-coordinateur.mjs";
import { daysSince, printReliabilityNotice } from "./lib-shell.mjs";
import { walkDocsPaths } from "./lib-shell.mjs";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

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
      const [n, horodatage, sujet, sousSujet, sensibilite, detail, statut] = entry.cells;
      rows.push({
        n: Number(n) || undefined,
        horodatage,
        sujet: sujet ?? "?",
        sousSujet: sousSujet ?? "?",
        sensibilite: sensibilite ?? "?",
        detail: detail ?? "",
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

// Longueur réelle de la série d'instantanés consécutifs (en partant du plus récent, vers le passé)
// où la tâche `n` apparaît ouverte — jamais plafonnée à 2 ici : la stagnation en amont
// (recommendNextTasks, 2026-09-20) a besoin du vrai nombre pour distinguer une tâche immobile
// depuis 3 rapports d'une immobile depuis 20, plutôt qu'un même forfait fixe pour les deux.
function consecutiveOpenStreak(previousSnapshots, n) {
  let streak = 0;
  for (let i = previousSnapshots.length - 1; i >= 0; i--) {
    const row = previousSnapshots[i].rows.find((r) => r.n === n);
    if (row && OPEN_KEYS.has(row.statusKey)) streak++;
    else break;
  }
  return streak;
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
      // +1 : le nombre de rapports PRÉCÉDENTS où la tâche apparaît déjà ouverte, plus le rapport
      // courant lui-même — un vrai décompte de rapports consécutifs (2026-09-20, demande explicite
      // de l'utilisateur : « l'echelle dvrait s'affiner [...] permettre une meilleure comparaisone
      // netre les taches »), jamais seulement un booléen "stagnante oui/non".
      if (seenInBoth) stagnant.push({ n: row.n, sousSujet: row.sousSujet, streak: consecutiveOpenStreak(previousSnapshots, row.n) + 1 });
    }
  }
  return { regressions, stagnant };
}

// Corroboration par les autres vigies (2026-09-20, demande explicite de l'utilisateur, posée en
// pleine construction de recommendNextTasks() : « je veux m'assurer que check-tasks a une vraie
// comprehension de ou on en est dans le projet [...] comment bien cabler cet outil avec toi pour
// que tu en profites quand tu en as besoin ? » — le vrai plafond identifié à ce moment-là : une
// tâche déclarée "critique" dans le suivi était traitée pareil qu'elle soit corroborée par une
// vraie trouvaille ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD ou pas du tout. Lecture SEULE des
// registres déjà existants (`docs/argus/index.md`, `docs/harmonia/index.md`,
// `docs/axa-check/index.md`, `docs/clean-dirty-old/index.md`) — jamais un second mécanisme de
// détection, seulement un rapprochement de mots-clés avec ce que ces outils ont déjà confirmé
// (même tokenizer que `suggestPrestationsForTask()`, réutilisé tel quel — anti-duplication,
// docs/regles-de-travail.md §7ter). Un rapprochement mécanique reste un signal à vérifier, jamais
// une certitude — même honnêteté de conception que les registres eux-mêmes.
const REGISTRY_FILES = [
  { source: "ARGUS", path: "docs/argus/index.md" },
  { source: "HARMONIA", path: "docs/harmonia/index.md" },
  { source: "AXA-CHECK", path: "docs/axa-check/index.md" },
  { source: "CLEAN-DIRTY-OLD", path: "docs/clean-dirty-old/index.md" },
];
// Valeurs qui signifient "rien de confirmé cette ligne-là" dans ces registres — jamais un texte à
// faire correspondre (sinon "0" ou "(aucune)" matcheraient entre eux sans rien dire de réel).
const EMPTY_FINDING_VALUES = new Set(["", "0", "—", "-", "(aucune)"]);

function splitTableRow(line) {
  return line.split("|").map((cell) => cell.trim());
}

// Lit une table markdown "| Date | ... | X confirmée(s) | ... |" sans hypothèse sur la position
// exacte de la colonne (les 4 registres n'ont pas le même nombre de colonnes) — repère la colonne
// par son intitulé (`/confirmée/i`), jamais par un index fixe qui casserait si une colonne est
// ajoutée demain dans un seul des quatre fichiers.
export function parseRegistryTable(markdown) {
  const lines = String(markdown ?? "").split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return [];
  const headers = splitTableRow(lines[0]);
  const confirmedIdx = headers.findIndex((h) => /confirmée/i.test(h));
  const dateIdx = headers.findIndex((h) => /^date$/i.test(h));
  if (confirmedIdx === -1) return [];
  const rows = [];
  for (const line of lines.slice(2)) {
    const cells = splitTableRow(line);
    const text = cells[confirmedIdx] ?? "";
    if (EMPTY_FINDING_VALUES.has(text.toLowerCase())) continue;
    rows.push({ date: cells[dateIdx] ?? "", text });
  }
  return rows;
}

export function loadRegistryFindings(root = ROOT, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  const findings = [];
  for (const { source, path } of REGISTRY_FILES) {
    const full = join(root, path);
    if (!exists(full)) continue;
    for (const row of parseRegistryTable(readFile(full))) {
      findings.push({ source, ...row });
    }
  }
  return findings;
}

// Seuil de 2 mots partagés, même seuil et même raison d'être que `suggestPrestationsForTask()` :
// un seul mot commun (souvent un mot général du projet) produirait trop de faux positifs.
export function corroborateWithRegistries(row, findings) {
  const taskWords = new Set(significantWords(`${row.sujet ?? ""} ${row.sousSujet ?? ""} ${row.detail ?? ""}`));
  if (!taskWords.size || !findings.length) return [];
  return findings
    .map((f) => ({ ...f, matched: [...new Set(significantWords(f.text).filter((w) => taskWords.has(w)))] }))
    .filter((f) => f.matched.length >= 2)
    .sort((a, b) => b.matched.length - a.matched.length);
}

// Recommandation de l'ordre des N prochaines tâches (2026-09-20, demande explicite de
// l'utilisateur : « check tasks recommande en fin de rapport l'ordre des 4 prochaines tâches
// [...] d'après des critères pertinents et bien définis »). Cinq critères calibrés explicitement
// (les quatre premiers choisis par l'utilisateur, le cinquième — corroboration par les autres
// vigies — ajouté le même jour pour approfondir la compréhension réelle de l'outil, cf. ci-dessus),
// combinés en un score simple — jamais un algorithme opaque, chaque tâche proposée porte ses
// raisons en clair (`reasons`) pour que l'agent et l'utilisateur puissent juger la pertinence
// réelle plutôt que de suivre un chiffre aveuglément (même honnêteté que ARGUS/ALWAYS-NEW-CODE :
// un signal à vérifier, jamais une certitude).
//
// Affinage du score (2026-09-20, demande explicite de l'utilisateur, le même jour : « l'echelle
// dvrait s'affiner, l'evaluation etre plus precise et permettre une meilleure comparaisone netre
// les taches » — calibré ensuite par trois choix explicites parmi quatre options proposées).
// Trois des cinq critères passent d'un forfait fixe à un calcul progressif ; la sensibilité
// déclarée (4 cases dans le suivi) et l'ancienneté (déjà continue via daysSince) restent
// inchangées, décision explicite de l'utilisateur de ne pas toucher à l'échelle de sensibilité
// elle-même.
const SENSITIVITY_SCORE = { critique: 3, important: 2, normal: 1, autre: 0 };
// Deux paliers plutôt qu'un seul forfait (2026-09-20) : « priorité absolue » pèse plus lourd
// qu'un simple « en priorité »/« priorité explicite » — les deux formulations n'exprimaient pas la
// même urgence mais recevaient jusqu'ici le même bonus. Détection toujours volontairement étroite
// (un keyword-match, jamais une compréhension d'intention), jamais devinée.
const ABSOLUTE_PRIORITY_PATTERN = /\bpriorit[ée]\s+absolue\b/i;
const EXPLICIT_PRIORITY_PATTERN = /\ben\s+priorit[ée]\b|\bpriorit[ée]\s+explicite\b/i;

export function recommendNextTasks(rows, { stagnant = [], findings = [], limit = 4, now = Date.now() } = {}) {
  const stagnantStreakByN = new Map(stagnant.map((s) => [s.n, s.streak ?? 3]));
  const openRows = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
  const scored = openRows.map((row) => {
    const reasons = [];
    let score = 0;

    const sensScore = SENSITIVITY_SCORE[row.sensibilite] ?? 0;
    if (sensScore > 0) { score += sensScore; reasons.push(`sensibilité déclarée : ${row.sensibilite}`); }

    // Stagnation progressive : le score grimpe avec le nombre RÉEL de rapports consécutifs où la
    // tâche est restée identique, jamais un forfait unique dès le seuil de 3 (une tâche immobile
    // depuis 12 rapports doit clairement dépasser une immobile depuis 3, plafonné à 6 pour éviter
    // qu'une tâche très ancienne écrase à elle seule tous les autres critères).
    const streak = stagnantStreakByN.get(row.n);
    if (streak != null) {
      const stagnationScore = Math.min(6, streak);
      score += stagnationScore;
      reasons.push(`signalée stagnante depuis ${streak} rapports consécutifs`);
    }

    const ageDays = row.horodatage ? daysSince(row.horodatage, now) : undefined;
    if (ageDays != null && ageDays >= 3) {
      const ageScore = Math.min(3, ageDays / 5);
      score += ageScore;
      reasons.push(`ouverte depuis ${ageDays} jour(s)`);
    }

    if (row.detail && ABSOLUTE_PRIORITY_PATTERN.test(row.detail)) {
      score += 14;
      reasons.push("priorité absolue explicitement exprimée par l'utilisateur dans le suivi");
    } else if (row.detail && EXPLICIT_PRIORITY_PATTERN.test(row.detail)) {
      score += 10;
      reasons.push("priorité explicitement exprimée par l'utilisateur dans le suivi");
    }

    // Corroboration progressive : le score augmente avec le NOMBRE de vigies qui confirment un
    // lien (largeur) et la force du rapprochement de mots-clés (profondeur) — une tâche confirmée
    // par plusieurs outils différents doit ressortir devant une confirmation isolée, jamais le
    // même forfait fixe pour les deux.
    const corroborations = corroborateWithRegistries(row, findings);
    if (corroborations.length) {
      const corroborationScore = corroborations.reduce((acc, c) => acc + 1 + Math.max(0, c.matched.length - 2) * 0.5, 0);
      score += corroborationScore;
      const sources = corroborations.map((c) => c.source).join(", ");
      reasons.push(`corroborée par ${corroborations.length} vigie(s) (${sources}) : liens réels avec des trouvailles déjà confirmées`);
    }

    return { n: row.n, sousSujet: row.sousSujet, sensibilite: row.sensibilite, statusKey: row.statusKey, score, reasons };
  });

  return scored
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
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

// CHANTIER_PRELIMINARY_FILES (tâche #185, 2026-09-22) : registre des chantiers connus → leur
// fichier préliminaire dédié, cf. docs/regles-de-travail.md « Idées dites en avance sur un « gros
// chantier » ». Tenu à jour à chaque nouveau chantier de cette ampleur reconnu — jamais un chantier
// ordinaire (même liste que docs/regles-de-travail.md, jamais une seconde énumération divergente).
export const CHANTIER_PRELIMINARY_FILES = {
  "CASSANDRA-RH": { file: "docs/cassandra-rh-conception.md", match: /cassandra/i },
  "Refonte graphique": { file: "docs/referentiel/regles-des-graphismes.md", match: /refonte graphique/i },
  "Outil concordance/évolutivité": { file: "docs/concordance-evolutivite-conception.md", match: /concordance|évolutivité|evolutivite/i },
  "Agence exportable": { file: "docs/agence-exportable-conception.md", match: /agence exportable|gabarit générique|gabarit generique/i },
  "Changement de modèle IA (CIRCLE-TASKS)": { file: "docs/changement-de-modele-ia-conception.md", match: /changement de mod[eè]le|changement-de-modele-ia/i },
  "circle-process-guardian": { file: "docs/circle-process-detail.txt", match: /circle-process-guardian/i },
  "Utilité des outils dans CLAUDE.md vs la Ronde": { file: "docs/claude-md-tool-listing-conception.md", match: /outils dans claude\.md|claude-md-tool-listing/i },
  // Inscrit le 2026-09-22, trouvé par findConceptionFilesMissingFromRegistry() à sa toute première
  // exécution : le fichier existait depuis des jours, suivait la convention de nommage, et n'avait
  // jamais été déclaré — donc jamais vérifié, ni en fraîcheur ni en restitution de valeur.
  "LE-GRAND-ARCHITECTE": { file: "docs/le-grand-architecte-conception.md", match: /grand[- ]architecte/i },
  "Visiteur de simulation": { file: "docs/simulation-visiteur-conception.md", match: /visiteur de simulation|script de simu/i },
};

// checkChantierFileFreshness() — la « vérification, jamais seulement une intention déclarée »
// demandée explicitement (docs/regles-de-travail.md) : compare, pour chaque chantier connu, la
// tâche de suivi la plus récente qui le concerne (Sujet/Sous-sujet, les deux champs de classement
// réels — jamais le Détail, cf. la note ci-dessous, ni une nouvelle classification inventée) à la dernière modification RÉELLE (git, `lastTouchDays()`,
// clean-dirty-old.mjs — jamais un second calcul de fraîcheur divergent, Article 3) de son fichier
// préliminaire dédié. Signale un ÉCART honnête (idée notée en suivi, jamais recopiée dans son
// fichier), jamais une certitude d'oubli — l'idée a pu être jugée non pertinente après coup, ou
// recopiée sans qu'un nouveau commit du fichier suive immédiatement le même jour (tolérance d'une
// journée, `TOLERANCE_DAYS`, pour ce cas fréquent de commit groupé). `lastTouch` injectable (même
// patron que clean-dirty-old.mjs) pour rester testable sans dépendre de git réel.
const TOLERANCE_DAYS = 1;
// isStagedForCommit() (2026-09-21, faux positif réel trouvé en committant CE MÊME soir la toute
// première fois qu'un fichier préliminaire de chantier a été introduit dans le MÊME commit que la
// tâche de suivi qui le mentionne — exactement la discipline demandée par Article 13 : « chaque
// tâche substantielle se documente dans docs/suivi/ DANS LE MÊME commit »). `lastTouchDays()`
// interroge `git log`, qui ne voit encore AUCUN commit touchant ce fichier tant que le commit en
// cours (celui que le crochet pre-commit est justement en train de valider) n'a pas réellement eu
// lieu — un vrai paradoxe temporel du crochet pre-commit, jamais un oubli réel. Distingue donc un
// fichier réellement absent (jamais écrit ni indexé par git, un vrai oubli) d'un fichier déjà STAGÉ
// pour ce commit précis (`git diff --cached`), qui va bien atterrir avec lui dans quelques instants.
export function isStagedForCommit(file, shImpl = sh) {
  return shImpl(`git diff --cached --name-only -- ${file}`, { cwd: ROOT }).trim().length > 0;
}
// findChantierFilesMissingValueRestitution() (2026-09-22) — le garde-fou de « la restitution de la
// valeur », la règle retrouvée ce jour-là dans l'historique de conversation après que l'utilisateur
// ait demandé de la chercher, et qui n'était écrite NULLE PART dans le dépôt : « chaque idee que
// j'ai et que je veux sauvegardé doit comporter mon idee (ma valeur) + ta/tes reponses (ta valeur),
// de maniere synthetisé, suivant la derniere "version" de l'idee discuté ». Règle complète et sa
// portée exacte : docs/systeme-de-suivi.md, « La restitution de la valeur d'une idée ».
//
// POURQUOI IL EXISTE, et c'est une distinction de fond avec checkChantierFileFreshness() juste
// au-dessus : celui-là vérifie qu'une idée ne se PERD pas (elle a bien rejoint son fichier) ; il ne
// regarde jamais ce que le fichier CONTIENT. Une idée consignée sous une seule voix est pourtant
// déjà une perte : la formulation brute sans l'analyse perd ce que la discussion a apporté ;
// l'analyse sans la formulation d'origine perd l'intention réelle, et le prochain agent qui
// reprendra le fichier reconstruira une intention approchante au lieu de lire la vraie (Article 27).
//
// COMMENT LES DEUX VOIX SE DISTINGUENT — un principe, jamais une liste de titres autorisés (le
// corollaire de l'Article 17 interdit exactement ça, et une liste de formulations de titres se
// périmerait au premier fichier écrit autrement). Les deux voix se distinguent par ATTRIBUTION, pas
// par vocabulaire : dans tout ce dépôt, la parole de l'utilisateur est rendue par une citation
// verbatim entre guillemets français, et la parole de l'agent est la prose qui l'entoure. On mesure
// donc ces deux matières-là, indépendamment des mots employés.
//
// LIMITE HONNÊTE, déclarée plutôt que tue (c'est le défaut récurrent traqué toute cette session :
// une mesure ADJACENTE présentée comme la mesure visée) : ceci vérifie que la FORME est là. Jamais
// que la synthèse est fidèle, jamais qu'elle reflète la dernière version discutée — seule une
// lecture le dit. Un fichier au vert n'est donc PAS un fichier à jour ; un fichier au rouge est en
// revanche un vrai manque, sans ambiguïté.
// findConceptionFilesMissingFromRegistry() (2026-09-22) — le garde-fou du garde-fou, et il a trouvé
// un vrai manque le jour même où il a été écrit.
//
// LE TROU, exactement celui que l'Article 24 vise : CHANTIER_PRELIMINARY_FILES est une liste tenue
// à la main. Les deux vérifications ci-dessous et ci-dessus ne voient QUE ce qui y est déclaré —
// donc un fichier de conception bien réel, écrit selon la convention de nommage du projet mais
// jamais inscrit au registre, est invisible aux deux, silencieusement, pour toujours. C'est la même
// cécité structurelle déjà rencontrée ailleurs dans ce projet (findRegistriesMissingFromCircle(),
// aveugle à un outil qui n'a aucun registre) : le trou vivait À L'INTÉRIEUR du garde-fou.
//
// PREMIÈRE EXÉCUTION RÉELLE : docs/le-grand-architecte-conception.md, jamais déclaré. Ni sa
// fraîcheur ni la restitution de sa valeur n'avaient donc jamais été vérifiées une seule fois.
//
// La convention de nommage est la SEULE chose lue ici, jamais un contenu deviné : un fichier nommé
// `*-conception.md` dans docs/ annonce lui-même ce qu'il est.
export function findConceptionFilesMissingFromRegistry({ readDir = readdirSync } = {}) {
  const declares = new Set(Object.values(CHANTIER_PRELIMINARY_FILES).map((v) => v.file));
  let entrees;
  try {
    entrees = readDir(join(ROOT, "docs"));
  } catch {
    return [];
  }
  return entrees
    .filter((nom) => /-conception\.md$/.test(nom))
    .map((nom) => `docs/${nom}`)
    .filter((chemin) => !declares.has(chemin));
}

const CITATION_UTILISATEUR = /«([^»]{40,})»/g;
// 400 caractères de prose hors citations : assez pour distinguer un vrai travail d'analyse d'un
// fichier qui ne serait qu'un collage de citations avec deux lignes de liaison, assez bas pour ne
// jamais réclamer de la longueur pour de la longueur (la règle dit « synthétisé », pas « long »).
const PROSE_AGENT_MINIMUM = 400;
export function findChantierFilesMissingValueRestitution({ readFileImpl = readFileSync, exists = existsSync } = {}) {
  const findings = [];
  for (const [chantier, { file }] of Object.entries(CHANTIER_PRELIMINARY_FILES)) {
    const full = join(ROOT, file);
    if (!exists(full)) {
      findings.push({ chantier, file, etat: "fichier absent", citations: 0, proseAgent: 0 });
      continue;
    }
    let texte;
    try {
      texte = readFileImpl(full, "utf8");
    } catch {
      findings.push({ chantier, file, etat: "fichier illisible", citations: 0, proseAgent: 0 });
      continue;
    }
    const citations = [...texte.matchAll(CITATION_UTILISATEUR)];
    // La prose de l'agent = tout ce qui n'est PAS une citation de l'utilisateur. On retire aussi les
    // blocs de code, qui ne sont la voix de personne.
    const proseAgent = texte
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/«[^»]*»/g, " ")
      .replace(/\s+/g, " ")
      .trim().length;
    const aLIdee = citations.length > 0;
    const aLaReponse = proseAgent >= PROSE_AGENT_MINIMUM;
    const etat = aLIdee && aLaReponse
      ? "les deux voix présentes"
      : aLIdee
        ? "la voix de l'agent manque — l'idée est citée, jamais travaillée"
        : aLaReponse
          ? "la voix de l'utilisateur manque — aucune citation verbatim de sa formulation"
          : "aucune des deux voix";
    findings.push({ chantier, file, etat, citations: citations.length, proseAgent });
  }
  return findings;
}

export function checkChantierFileFreshness(allRows, { lastTouch = lastTouchDays, isStaged = isStagedForCommit } = {}) {
  const findings = [];
  for (const [chantier, { file, match }] of Object.entries(CHANTIER_PRELIMINARY_FILES)) {
    // CHAMPS DE CLASSEMENT SEULEMENT (2026-09-22, faux positif RÉEL trouvé en direct : la tâche
    // #304, dont le Détail dit « continuer à enchaîner les tâches ouvertes sans s'arrêter (SAUF pour
    // la refonte graphique) », était comptée comme une tâche DU chantier refonte graphique — le sens
    // exactement inverse de ce qu'elle dit). Le Détail est un récit libre : un chantier peut y être
    // cité en passant, en comparaison, ou justement pour être écarté. Sujet et Sous-sujet sont au
    // contraire les deux champs de CLASSEMENT que l'agent choisit délibérément quand il note la
    // tâche (cf. docs/systeme-de-suivi.md, les quatre attributs) — s'y tenir, c'est lire une
    // intention déclarée plutôt que deviner un rattachement depuis une mention. Même racine que les
    // corrections du même jour ailleurs dans ce projet : une MENTION n'est jamais une APPARTENANCE
    // (Article 3 — la cause, jamais le symptôme).
    const matching = allRows.filter((r) => match.test(r.sujet) || match.test(r.sousSujet));
    if (!matching.length) continue;
    const dated = matching.map((r) => ({ row: r, at: new Date(r.horodatage).getTime() })).filter((x) => Number.isFinite(x.at));
    if (!dated.length) continue;
    const latest = dated.reduce((a, b) => (b.at > a.at ? b : a));
    // Clampé à 0 (2026-09-22, faux positif réel trouvé en lançant cet outil en direct le soir même
    // de son écriture) : l'horodatage narratif d'une ligne de suivi suit la date "aujourd'hui"
    // donnée en tout début de session, qui peut courir de quelques heures à toute une journée
    // devant l'horloge système réelle utilisée par git (`lastTouchDays()`) — un simple décalage de
    // fuseau/arrondi, jamais une vraie tâche du futur. Sans ce clamp, une idée notée puis
    // immédiatement recopiée dans son fichier au même tour ressortait à tort comme "en retard",
    // uniquement à cause de ce décalage d'horloge, jamais d'un vrai oubli.
    const rowAgeDays = Math.max(0, (Date.now() - latest.at) / 86400000);
    const fileAgeDays = lastTouch(file);
    if (fileAgeDays === undefined) {
      if (isStaged(file)) continue;
      findings.push({ chantier, file, taskNumber: latest.row.n, message: `fichier "${file}" introuvable ou jamais commité, alors qu'une tâche de suivi (#${latest.row.n ?? "?"}) le concerne déjà` });
      continue;
    }
    // COMPARAISON EN JOURS ENTIERS (2026-09-22, second faux positif réel du même passage) : le
    // message affiche « (1.0j) plus récente que ... (1.0j) » tout en déclenchant l'alerte — un
    // verdict qui contredit sa propre phrase. La cause : la comparaison tournait sur des fractions
    // non arrondies (1.03 > 0.004 + 1) là où le message, lui, arrondit à la décimale. Cette fraction
    // n'est que du décalage d'horloge entre l'horodatage narratif du suivi et l'horloge système de
    // git — exactement ce que TOLERANCE_DAYS existe pour absorber, jamais un vrai retard. On compare
    // donc à la granularité du JOUR, la seule que la tolérance et le message expriment tous les deux.
    if (Math.floor(fileAgeDays) > Math.floor(rowAgeDays) + TOLERANCE_DAYS) {
      findings.push({ chantier, file, taskNumber: latest.row.n, message: `tâche #${latest.row.n ?? "?"} « ${latest.row.sousSujet} » (${rowAgeDays.toFixed(1)}j) plus récente que "${file}" (${fileAgeDays.toFixed(1)}j) — vérifier que l'idée a bien été recopiée` });
    }
  }
  return findings;
}

// --- Idées à trancher (2026-09-21, demande explicite : « à chaque fois que je propose une nouvelle
// idée [...] cette fenêtre devrait s'ouvrir [...] l'avantage de la ronde, c'est que c'est mécanique,
// donc impossible à zapper ») — filet de sécurité mécanique du réflexe en temps réel documenté dans
// docs/regles-de-travail.md, jamais le mécanisme principal lui-même (qui reste une discipline de
// l'agent au moment où l'idée est proposée). Voir docs/idees-a-trancher.md pour le registre complet
// et sa note méthodologique (pourquoi la portée reste volontairement limitée aux idées nouvelles).

// detectPendingIdeaCandidates() — repère honnête, jamais un jugement sémantique profond : le même
// libellé de Sujet que l'agent choisit déjà lui-même à chaque fois qu'il note une idée de ce type
// (« Nouvel outil »/« Conception »), jamais un second marqueur à saisir en plus.
// `sinceTaskNumber` (défaut : 332, la dernière tâche couverte par le balayage rétrospectif manuel du
// 2026-09-21/22, cf. docs/idees-a-trancher.md) — garde-fou non négociable trouvé EN TESTANT en direct
// contre le vrai docs/suivi/ avant tout câblage dans la Ronde (Article 3/19) : une simple date plancher
// (ex. "2026-09-21") aurait quand même remonté plus de 40 tâches "Nouvel outil"/"Conception" du jour
// même — la quasi-totalité de la session en cours, déjà construites et closes le jour même sans jamais
// être passées par une vraie décision de fichier préliminaire (des outils trop petits pour ça). Un
// numéro de tâche est strictement croissant et sans ambiguïté de fuseau horaire (même principe déjà
// établi par filterByZoom() ci-dessus) — un plancher au NUMÉRO exclut précisément tout ce que le
// balayage manuel a déjà tranché, sans exclure la moindre idée réellement nouvelle à partir de
// maintenant, quelle que soit l'heure exacte à laquelle ce mécanisme est effectivement déployé.
// `statusKey !== "terminee"` — second garde-fou trouvé EN TESTANT en direct (Article 3/19, le jour
// même où cette fonction a été câblée pour la première fois : la tâche de suivi documentant CE
// mécanisme lui-même — construit et clôturé dans le même tour, sur ordre explicite de
// l'utilisateur — s'est retrouvée signalée comme "idée en attente d'une décision" dès le premier
// passage réel). Une idée réellement "en attente" est une tâche encore OUVERTE (le travail n'est pas
// fait, la question du fichier préliminaire reste réellement ouverte) — une tâche déjà "terminée"
// documente un travail déjà livré : la question ne se pose plus, quel que soit le libellé de son
// Sujet (exactement le même principe que le balayage rétrospectif manuel, qui n'a jamais recensé de
// décision pour les dizaines de "Nouvel outil" déjà closes).
export function detectPendingIdeaCandidates(allRows, sinceTaskNumber = 332) {
  return allRows.filter((r) => /^(Nouvel outil|Conception)/i.test(r.sujet ?? "") && (r.n ?? 0) > sinceTaskNumber && r.statusKey !== "terminee");
}

export const IDEES_REGISTRY_PATH = "docs/idees-a-trancher.md";

// loadIdeaDecisions() — scan direct des lignes de tableau markdown (jamais dataRows(), qui exige un
// unique en-tête connu : ce registre porte plusieurs tableaux distincts dans le même fichier) :
// toute ligne portant une décision reconnue associe chaque numéro de tâche cité en 1re cellule (une
// cellule peut citer plusieurs tâches, ex. "#297") à cette décision.
// Détection par VALEUR, jamais par position fixe (bug réel trouvé en testant en direct avant tout
// câblage dans la Ronde, Article 3/19) : le tableau « Balayage rétrospectif » a 4 colonnes
// (Tâche(s)/Idée/Décision/Fichier — décision en index 2) tandis que le tableau « Idées nouvelles » a
// 5 colonnes (Tâche/Date/Idée/Décision/Fichier — décision en index 3) ; un index fixe (cells[3])
// aurait lu la colonne Fichier du premier tableau et n'aurait donc jamais retrouvé les décisions
// #297/#226 déjà enregistrées lors du balayage rétrospectif.
export function loadIdeaDecisions(registryText) {
  const decisions = {};
  const KNOWN = new Set(["à trancher", "entre-deux", "abandonnée", "fichier créé"]);
  for (const line of String(registryText ?? "").split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const decision = cells.find((c) => KNOWN.has(c));
    if (!decision) continue;
    // `#(\d+)` uniquement, jamais un `\d+` nu (bug réel trouvé en testant en direct : la 1re cellule
    // peut porter une référence de section comme "§8ter", dont le "8" nu serait à tort lu comme un
    // second numéro de tâche).
    for (const [, n] of cells[0].matchAll(/#(\d+)/g)) decisions[n] = decision;
  }
  return decisions;
}

// findIdeasNeedingDecision() — une décision "abandonnée" ou "fichier créé" ne redemande plus jamais
// la question ; "entre-deux" la repose à CHAQUE Ronde tant qu'aucun fichier n'a été créé (demande
// explicite) ; une idée jamais rencontrée ("à trancher" implicite, absente du registre) la pose pour
// la première fois.
export function findIdeasNeedingDecision(candidates, decisions) {
  return candidates.filter((r) => {
    const known = decisions[String(r.n)];
    return known === undefined || known === "entre-deux";
  });
}

// =============================================================================================
// RAPPORT DE RONDE EN TROIS REGARDS (2026-09-22, tâche #357, demande explicite de l'utilisateur :
// « je veux aussi un rapport txt, dans le cadre des rondes, de la part de check-tasks-detail [...]
// un état des lieux precis des taches en cours, plus une vision globale au niveau du projet.
// capable de dire ou on en est dans le projet, oeil critique, avec differents zoom, differents
// regards. + de verifier les chiffres du suivi »).
//
// Les trois fonctions ci-dessous sont PURES et ne lisent rien elles-mêmes : elles reçoivent les
// lignes déjà extraites par loadAllTaskRows() (qui ne fait lui-même que relayer
// categorizeAllSessions()). Aucune ne compte quoi que ce soit une seconde fois — c'est le même
// principe anti-duplication qui gouverne déjà tout ce fichier.
//
// Limite honnête, valable pour les trois : elles ne LISENT pas le projet, elles comptent ce que le
// suivi en dit. Un chantier réellement avancé mais jamais consigné leur est invisible — c'est une
// mesure de ce qui est TRACÉ, jamais de ce qui est FAIT. Dit explicitement dans le rapport lui-même
// plutôt que laissé à la déduction du lecteur (Article 15).

// PARTIE 1 — les chiffres vérifiés du suivi.
// « Vérifiés » au sens strict : chaque nombre est recalculé depuis les lignes réelles, et les
// incohérences internes sont signalées plutôt que lissées (un total qui ne retombe pas sur ses
// pieds est un bug du suivi, pas un arrondi à masquer).
export function suiviFigures(rows, { now = Date.now() } = {}) {
  const total = rows.length;
  const byStatus = { terminee: 0, enCours: 0, ouverte: 0, autre: 0 };
  for (const r of rows) byStatus[r.statusKey] = (byStatus[r.statusKey] ?? 0) + 1;
  const numbered = rows.filter((r) => Number.isFinite(r.n) && r.n > 0);
  const numbers = numbered.map((r) => r.n);
  const highest = numbers.length ? Math.max(...numbers) : 0;
  // Trous de numérotation : un numéro absent signale une tâche perdue lors d'un découpage de
  // fichier, ou jamais écrite. Le balayage part du PLUS PETIT numéro réellement présent, jamais de
  // 1 : le système de suivi a démarré en cours de projet (première tâche tracée : #117), donc
  // partir de 1 inventait 116 « trous » qui n'en sont pas — faux positif trouvé en lançant la
  // fonction pour de vrai sur le dépôt réel, jamais visible sur une fixture synthétique.
  // Sans aucun numéro exploitable, il n'y a pas de fenêtre à balayer : lowest et highest valant
  // tous deux 0, la boucle signalait « le numéro 0 manque » sur un projet vide (edge case trouvé
  // par son propre test, jamais en usage réel). Une absence de données n'est pas une anomalie.
  const lowest = numbers.length ? Math.min(...numbers) : 0;
  const seen = new Set(numbers);
  const missing = [];
  if (numbers.length) for (let i = lowest; i <= highest; i++) if (!seen.has(i)) missing.push(i);
  const duplicates = [...new Set(numbers.filter((n, i) => numbers.indexOf(n) !== i))];
  // Rythme réel : tâches portant un horodatage dans les 1/7/30 derniers jours, tous statuts
  // confondus (le suivi horodate la CRÉATION de la ligne, jamais sa clôture — on mesure donc le
  // rythme d'ouverture, ce qui est dit tel quel plutôt que présenté comme un rythme de clôture).
  const ageDays = (r) => { const t = Date.parse(r.horodatage ?? ""); return Number.isFinite(t) ? (now - t) / 86400000 : null; };
  const within = (d) => rows.filter((r) => { const a = ageDays(r); return a !== null && a >= 0 && a <= d; }).length;
  const byTheme = {};
  for (const r of rows) {
    const t = splitSujet(r.sujet).theme || "(sans thème)";
    byTheme[t] ??= { total: 0, ouvertes: 0 };
    byTheme[t].total++;
    if (r.statusKey !== "terminee") byTheme[t].ouvertes++;
  }
  const incoherences = [];
  const summed = byStatus.terminee + byStatus.enCours + byStatus.ouverte + byStatus.autre;
  if (summed !== total) incoherences.push(`La somme des statuts (${summed}) ne retombe pas sur le total de lignes (${total}) — une ligne échappe au classement.`);
  if (missing.length) incoherences.push(`${missing.length} numéro(s) de tâche manquant(s) entre #${lowest} et #${highest} : ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? "…" : ""}.`);
  if (duplicates.length) incoherences.push(`${duplicates.length} numéro(s) de tâche en double : ${duplicates.join(", ")} — deux tâches distinctes partagent un identifiant.`);
  if (rows.length && !numbered.length) incoherences.push("Aucune ligne ne porte de numéro exploitable — le suivi est illisible par numéro.");
  return {
    total, byStatus, lowest, highest, numberedCount: numbered.length, missing, duplicates,
    rythme: { jour1: within(1), jours7: within(7), jours30: within(30) },
    byTheme, incoherences,
  };
}

// PARTIE 2 — où en est le projet, vu de haut.
// Les chantiers viennent de CHANTIER_PRELIMINARY_FILES (déjà maintenu, déjà utilisé par le contrôle
// de fraîcheur) : jamais une seconde liste de chantiers à tenir à jour en parallèle, ce que
// l'Article 24 interdit explicitement. Chaque chantier est rapproché de ses tâches par le `match`
// déjà déclaré là-bas.
export function projectStanding(rows, { chantiers = CHANTIER_PRELIMINARY_FILES, now = Date.now() } = {}) {
  // Clampé à 0 : une ligne horodatée « demain » (fuseau, ou horodatage saisi en avance) donnerait
  // un âge négatif affiché « il y a -1 j », absurde à la lecture. Un âge négatif veut dire « tout
  // juste », jamais « dans le futur » — même honnêteté d'affichage qu'ailleurs dans ce fichier.
  const ageDays = (r) => { const t = Date.parse(r.horodatage ?? ""); return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86400000)) : null; };
  const out = [];
  for (const [nom, def] of Object.entries(chantiers)) {
    const mine = rows.filter((r) => def.match.test(`${r.sujet ?? ""} ${r.sousSujet ?? ""} ${r.detail ?? ""}`));
    const ouvertes = mine.filter((r) => r.statusKey !== "terminee");
    const ages = mine.map(ageDays).filter((a) => a !== null);
    out.push({
      chantier: nom,
      total: mine.length,
      terminees: mine.length - ouvertes.length,
      ouvertes: ouvertes.length,
      // "Jamais commencé" est un constat fort : on ne le prononce que si AUCUNE tâche ne s'y
      // rattache, jamais sur une simple impression de lenteur.
      jamaisCommence: mine.length === 0,
      dernierMouvementJours: ages.length ? Math.min(...ages) : null,
      avancementPct: mine.length ? Math.round(((mine.length - ouvertes.length) / mine.length) * 100) : null,
    });
  }
  return out.sort((a, b) => (b.ouvertes - a.ouvertes) || (b.total - a.total));
}

// PARTIE 3 — l'œil critique.
// Uniquement des constats CHIFFRÉS et vérifiables : chaque entrée porte le nombre qui la justifie,
// jamais une opinion fabriquée (même discipline que CASSANDRA-RH, qui « ne descend jamais un outil
// sans donner le chiffre exact qui le justifie »). Une liste vide est un résultat légitime.
export function criticalEye(rows, { stagnant = [], standing = [], figures = null, now = Date.now() } = {}) {
  const findings = [];
  const fig = figures ?? suiviFigures(rows, { now });
  for (const s of stagnant.filter((s) => (s.streak ?? 3) >= 3).sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0))) {
    findings.push({ gravite: (s.streak ?? 3) >= 5 ? "forte" : "moyenne", constat: `#${s.n} « ${s.sousSujet} » est ouverte et identique depuis ${s.streak ?? 3} rapports consécutifs.` });
  }
  for (const c of standing.filter((c) => c.jamaisCommence)) {
    findings.push({ gravite: "forte", constat: `Le chantier « ${c.chantier} » a un fichier de conception mais 0 tâche de suivi s'y rattache — annoncé, jamais commencé.` });
  }
  for (const c of standing.filter((c) => !c.jamaisCommence && c.ouvertes > 0 && (c.dernierMouvementJours ?? 0) >= 3)) {
    findings.push({ gravite: "moyenne", constat: `Le chantier « ${c.chantier} » a ${c.ouvertes} tâche(s) ouverte(s) et rien n'y a bougé depuis ${c.dernierMouvementJours} jour(s).` });
  }
  // Déséquilibre outillage / jeu. Les deux familles sont reconnues par le thème déjà écrit dans le
  // suivi, jamais par une classification inventée ici. Le seuil de 70 % n'est pas un idéal de
  // répartition : c'est le point à partir duquel le déséquilibre mérite d'être REGARDÉ, l'arbitrage
  // restant entièrement humain (construire de l'outillage est un investissement légitime).
  const outillage = rows.filter((r) => /outil|agence|m[ée]thode de travail|suivi/i.test(splitSujet(r.sujet).theme)).length;
  const jeu = rows.filter((r) => /jeu|dialogue|personnage|graphis|simulation|moteur/i.test(splitSujet(r.sujet).theme)).length;
  if (outillage + jeu > 0) {
    const pct = Math.round((outillage / (outillage + jeu)) * 100);
    if (pct >= 70) findings.push({ gravite: "moyenne", constat: `${pct} % des tâches tracées portent sur l'outillage de travail (${outillage}) contre ${100 - pct} % sur le jeu lui-même (${jeu}) — à regarder, jamais un défaut en soi.` });
  }
  for (const i of fig.incoherences) findings.push({ gravite: "forte", constat: `Incohérence de comptage du suivi : ${i}` });
  return findings;
}

// Assemble le rapport de Ronde en texte brut. Les TROIS zooms y figurent successivement (choix
// explicite de l'utilisateur : « je n'ai jamais à relancer l'outil pour changer d'angle »).
// Le txt est la version archivée et relue par les outils ; le HTML reste la version de
// présentation, construit à partir des MÊMES données — jamais un second calcul (cf. la décision
// HTML/texte déjà suivie par Doc-Report).
export function buildRondeTextReport({ rows, history = [], now = Date.now() } = {}) {
  const allRows = rows ?? loadAllTaskRows();
  const fig = suiviFigures(allRows, { now });
  const standing = projectStanding(allRows, { now });
  const { stagnant } = compareSnapshots(history, allRows);
  const critical = criticalEye(allRows, { stagnant, standing, figures: fig, now });
  const latestTaskNumber = fig.highest;
  const L = [];
  const pad = (s, n) => String(s).padEnd(n);
  L.push("=== check-tasks-details — rapport de Ronde ===");
  L.push(`Date : ${new Date(now).toISOString().slice(0, 16).replace("T", " ")}`);
  L.push("");
  L.push("Limite honnête, valable pour tout ce qui suit : ce rapport compte ce que le SUIVI dit du");
  L.push("projet, jamais ce que le projet est réellement. Un travail fait sans être consigné lui est");
  L.push("invisible.");
  L.push("");

  L.push("--- PARTIE 1 · LES CHIFFRES VÉRIFIÉS DU SUIVI ---------------------------------------");
  L.push(`Total de tâches tracées : ${fig.total}   (numéros #${fig.lowest} à #${fig.highest} — le suivi a démarré en cours de projet, les numéros antérieurs n'ont jamais existé)`);
  L.push(`  terminées : ${fig.byStatus.terminee}   en cours : ${fig.byStatus.enCours}   ouvertes : ${fig.byStatus.ouverte}   autre/indéterminé : ${fig.byStatus.autre}`);
  L.push(`Rythme d'ouverture de tâches : ${fig.rythme.jour1} sur 24 h · ${fig.rythme.jours7} sur 7 j · ${fig.rythme.jours30} sur 30 j`);
  L.push("  (le suivi horodate la création d'une ligne, jamais sa clôture — c'est donc un rythme");
  L.push("   d'ouverture, jamais un rythme d'achèvement.)");
  L.push("");
  L.push("Répartition par thème (total / encore ouvertes) :");
  for (const [theme, v] of Object.entries(fig.byTheme).sort((a, b) => b[1].total - a[1].total)) {
    L.push(`  ${pad(theme.slice(0, 48), 50)} ${pad(v.total, 5)} ${v.ouvertes ? `(${v.ouvertes} ouverte(s))` : ""}`);
  }
  L.push("");
  L.push(fig.incoherences.length ? "⚠️ Incohérences de comptage trouvées :" : "✅ Aucune incohérence de comptage : les statuts retombent sur le total, la numérotation est continue et sans doublon.");
  for (const i of fig.incoherences) L.push(`  - ${i}`);
  L.push("");

  L.push("--- PARTIE 2 · OÙ EN EST LE PROJET, VU DE HAUT --------------------------------------");
  L.push("Un chantier = une entrée de CHANTIER_PRELIMINARY_FILES (la liste déjà tenue pour le");
  L.push("contrôle de fraîcheur, jamais une seconde liste en parallèle).");
  L.push("");
  for (const c of standing) {
    const etat = c.jamaisCommence ? "JAMAIS COMMENCÉ" : c.ouvertes === 0 ? "rien d'ouvert" : `${c.ouvertes} ouverte(s)`;
    const bouge = c.dernierMouvementJours === null ? "aucun mouvement daté" : `dernier mouvement il y a ${c.dernierMouvementJours} j`;
    L.push(`  ${pad(c.chantier.slice(0, 42), 44)} ${pad(etat, 18)} ${pad(c.avancementPct === null ? "—" : c.avancementPct + " %", 6)} ${bouge}`);
  }
  L.push("");

  L.push("--- PARTIE 3 · L'ŒIL CRITIQUE ------------------------------------------------------");
  if (!critical.length) L.push("✅ Aucun constat critique chiffrable ce passage — jamais une absence de problème prouvée, seulement l'absence de signal mesurable.");
  for (const f of critical) L.push(`  [${f.gravite === "forte" ? "!!" : "! "}] ${f.constat}`);
  L.push("");

  L.push("--- PARTIE 4 · L'ÉTAT DÉTAILLÉ, AUX TROIS ZOOMS -------------------------------------");
  for (const zoom of ZOOM_LEVELS) {
    const scoped = filterByZoom(allRows, zoom, { latestTaskNumber });
    L.push("");
    L.push(`### ${ZOOM_LABELS[zoom]} — ${scoped.length} tâche(s)`);
    for (const t of scoped) {
      const icone = t.statusKey === "terminee" ? "✔" : t.statusKey === "enCours" ? "▶" : t.statusKey === "ouverte" ? "○" : "?";
      L.push(`  ${icone} #${pad(t.n ?? "—", 4)} ${pad(splitSujet(t.sujet).theme.slice(0, 26), 28)} ${String(t.sousSujet ?? "").slice(0, 96)}`);
    }
  }
  L.push("");
  L.push(`(Fin du rapport — ${critical.length} constat(s) critique(s), ${fig.incoherences.length} incohérence(s) de comptage.)`);
  return { text: L.join("\n"), figures: fig, standing, critical, stagnant };
}

// Construit le contenu du rapport (pure, testable) — la génération HTML et l'écriture d'instantané
// restent dans main(), jamais mélangées ici.
export function buildReport({ zoom = "en_cours", format = "liste", allRows, history = [], onboardingContext = null, registryFindings } = {}) {
  if (!ZOOM_LEVELS.includes(zoom)) throw new Error(`zoom inconnu : ${zoom}`);
  if (!FORMATS.includes(format)) throw new Error(`format inconnu : ${format}`);
  const rows = allRows ?? loadAllTaskRows();
  const findings = registryFindings ?? loadRegistryFindings();
  const latestTaskNumber = Math.max(0, ...rows.map((r) => r.n || 0));
  const scoped = filterByZoom(rows, zoom, { latestTaskNumber });
  const { regressions, stagnant } = compareSnapshots(history, rows);
  const chantierFreshnessGaps = checkChantierFileFreshness(rows);

  const blocks = [];
  if (chantierFreshnessGaps.length) {
    blocks.push({ type: "note", text: `⚠️ ${chantierFreshnessGaps.length} fichier(s) préliminaire(s) de chantier possiblement en retard sur le suivi — à vérifier (jamais une certitude, l'idée a pu être jugée non pertinente après coup).` });
    blocks.push({ type: "list", items: chantierFreshnessGaps.map((g) => `${g.chantier} : ${g.message}`) });
  }
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

  // Ordre recommandé des prochaines tâches (toujours calculé sur TOUTES les tâches ouvertes du
  // projet, jamais seulement celles du zoom affiché — un jugement de priorité project-wide, cf.
  // recommendNextTasks() ci-dessus). Jamais exécuté seul : l'agent doit lire ce rapport en entier,
  // évaluer la pertinence réelle de cet ordre, et ouvrir une fenêtre de questions à l'utilisateur
  // avant de trancher quoi que ce soit (protocole ajouté le 2026-09-20, cf. docs/regles-de-travail.md).
  const recommended = recommendNextTasks(rows, { stagnant });
  if (recommended.length) {
    blocks.push({ type: "heading", text: "Ordre recommandé des prochaines tâches (signal, jamais une décision)" });
    blocks.push({ type: "list", items: recommended.map((r, i) => `${i + 1}. #${r.n ?? "—"} « ${r.sousSujet} » — ${r.reasons.join(" ; ")}`) });
  }

  return {
    title: `État des tâches — ${ZOOM_LABELS[zoom]}`,
    subtitle: `Forme : ${FORMAT_LABELS[format]} · ${scoped.length} tâche(s) affichée(s) sur ${rows.length} au total`,
    blocks: blocks.filter((b) => b.type !== "noop"),
    meta: { zoom, format, count: scoped.length, total: rows.length, regressions, stagnant, recommended, chantierFreshnessGaps },
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
// Extraite le 2026-09-21 vers lib-shell.mjs (circle-tasks.mjs en a aussi besoin pour son propre
// garde-fou de fraîcheur ; l'importer directement d'ici créerait un cycle, cf. lib-shell.mjs).
// suggestTaskTypesForPlan() (2026-09-22) — la moitié « check-list » du principe posé par
// l'utilisateur : « je veux que check-list soit capable de dire : voici le type de tâches qui doit
// être associé à ce plan d'action, pendant que god dit : il y a un plan d'action, il faut mettre
// des tâches associées ».
//
// Les deux moitiés sont volontairement séparées, et c'est tout l'intérêt du dispositif : god
// CONSTATE un manque (il ne sait pas quoi mettre à la place), check-list PROPOSE une forme (elle ne
// sait pas si c'est obligatoire). Fusionner les deux donnerait un outil qui invente la tâche qu'il
// réclame, donc un outil qui se satisfait tout seul.
//
// LES QUATRE NATURES, tirées de ce que ce projet produit réellement — jamais une taxonomie
// importée. Chacune appelle un TRAVAIL différent, et se tromper de nature coûte cher : traiter une
// décision comme un correctif, c'est coder une réponse que personne n'a choisie.
export const NATURES_DE_TACHE = [
  { nature: "correctif", quand: "le constat décrit quelque chose de cassé, faux ou incohérent", forme: "corriger à la racine puis un test qui épingle le défaut (Article 3)", indices: /\b(bug|faux|cassé|incohéren|erreur|manqu|absent|jamais lu|jamais écrit|régress)/i },
  { nature: "investigation", quand: "le constat pose une question à laquelle le rapport ne répond pas", forme: "aller lire le vrai code ou les vraies données avant toute décision (Article 19)", indices: /\b(pourquoi|d'où|est-ce que|semble|possible|suspect|à vérifier|inexpliqu)/i },
  { nature: "décision", quand: "deux options légitimes s'affrontent et le choix n'est pas technique", forme: "une question de calibrage à l'utilisateur, jamais une décision prise seul (Article 16)", indices: /\b(faut-il|choisir|arbitr|décid|trancher|ou bien|calibr|seuil)/i },
  { nature: "documentation", quand: "le code et un document de référence ne disent plus la même chose", forme: "mettre à jour le document le jour même, jamais une note pour plus tard (Article 13)", indices: /\b(document|référentiel|charte|CLAUDE\.md|registre|blueprint|à jour|périmé)/i },
];

export function suggestTaskTypesForPlan(planDaction, { natures = NATURES_DE_TACHE } = {}) {
  const retenus = planDaction?.retenus ?? [];
  if (!retenus.length) return { mesurable: true, suggestions: [], message: "Aucun constat retenu — rien à transformer en tâche, et c'est un résultat, jamais un oubli." };
  const suggestions = retenus.map((c) => {
    const texte = String(c.constat ?? "");
    const correspondances = natures.filter((n) => n.indices.test(texte));
    return {
      constat: texte,
      dejaLiee: Boolean(c.tache),
      // Aucune correspondance n'est PAS un défaut du constat : c'est l'aveu honnête que cette
      // heuristique de vocabulaire ne sait pas classer celui-là. Inventer une nature par défaut
      // enverrait vers le mauvais travail, ce qui est pire que de ne rien proposer.
      naturesProposees: correspondances.length ? correspondances.map((n) => ({ nature: n.nature, forme: n.forme })) : [],
      note: correspondances.length ? undefined : "nature non reconnue par le vocabulaire — à qualifier à la main plutôt que rangée d'office",
    };
  });
  return { mesurable: true, suggestions, message: `${suggestions.length} constat(s) retenu(s) — ${suggestions.filter((s) => !s.dejaLiee).length} encore sans tâche.` };
}

export function formatTaskTypeSuggestions(res) {
  const l = [res.message];
  for (const s of res.suggestions) {
    l.push(`  · ${s.constat}${s.dejaLiee ? " (déjà reliée)" : ""}`);
    if (s.naturesProposees.length) for (const n of s.naturesProposees) l.push(`      type « ${n.nature} » → ${n.forme}`);
    else l.push(`      ${s.note}`);
  }
  return l.join("\n");
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
    // Les 6 signaux de Gardien du dernier commit (2026-09-22) — relevé déposé par le crochet
    // post-commit, relu gratuitement ici. Sans ça, tout badge produit par ce contexte affichait
    // « en cours (jamais scanné) », y compris pour un outil mesuré à 100 % au commit précédent :
    // deux chemins d'affichage du MÊME badge disaient deux choses différentes. Relevé absent
    // (premier lancement, conteneur neuf) ⇒ objet vide ⇒ retour honnête à « jamais consulté ».
    ...badgeSignalsAsContext(),
    // Seule déviation Agent réelle et documentée à ce jour (docs/regles-de-travail.md) — sans ça,
    // THE-DEEP-READER ressortirait à tort "sans badge" ici, alors qu'il est complet une fois ses
    // deux déviations assumées prises en compte (cf. checkAgentOnboarding(), le-coordinateur.mjs).
    agentOverrides: {
      "THE-DEEP-READER": { cousinOf: "THE-FINAL-JUDGE", registryPathPrefix: "docs/suivi/relectures-lourdes/" },
      // Smart Breaker (2026-09-22) : son blueprint porte le nom d'avant son surnom — écrit le
      // 2026-09-18, baptisé seulement le 2026-09-19. Déviation déclarée plutôt que renommage, qui
      // casserait les renvois croisés de CLAUDE.md et de plusieurs fiches.
      "Smart Breaker": { blueprintPath: "docs/outil-resilience-api.md" },
    },
  };
}

function rondeCli() {
  const allRows = loadAllTaskRows();
  const history = loadSnapshotHistory();
  const report = buildRondeTextReport({ rows: allRows, history });
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const txtFile = join(OUT_DIR, `ronde-${stamp}.txt`);
  writeFileSync(txtFile, report.text, "utf8");
  // Le HTML relit `report` (déjà calculé), jamais les lignes du suivi une seconde fois.
  const htmlFile = join(OUT_DIR, `ronde-${stamp}.html`);
  writeFileSync(htmlFile, renderHtmlReport({
    title: "check-tasks-details — rapport de Ronde",
    subtitle: `${report.figures.total} tâche(s) tracées · ${report.critical.length} constat(s) critique(s) · ${report.figures.incoherences.length} incohérence(s) de comptage`,
    dateLabel: new Date().toISOString(),
    blocks: [{ type: "pre", text: report.text }],
    footer: "check-tasks-details — lecture seule, docs/suivi/ reste l'unique source de vérité du projet.",
  }), "utf8");
  appendSnapshot(allRows);
  console.log(report.text);
  console.log(`\nRapport txt  : ${txtFile}`);
  console.log(`Rapport HTML : ${htmlFile}`);
}

function main() {
  printReliabilityNotice("check-tasks-details");
  recordCliUsage("check-tasks-details");
  // Sous-commande `ronde` (2026-09-22) : le rapport de Ronde en quatre parties, txt + HTML tirés
  // des MÊMES données (jamais deux calculs qui pourraient diverger — le txt est la version
  // archivée et relue par les outils, le HTML la version de présentation, décision explicite de
  // l'utilisateur). Sous-commande dédiée plutôt qu'un 3e argument positionnel : ce rapport ne prend
  // ni zoom ni forme, il les contient tous les trois.
  if (process.argv[2] === "ronde") return rondeCli();
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
  if (report.meta.chantierFreshnessGaps.length) console.log(`⚠️ ${report.meta.chantierFreshnessGaps.length} fichier(s) préliminaire(s) de chantier possiblement en retard sur le suivi.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
