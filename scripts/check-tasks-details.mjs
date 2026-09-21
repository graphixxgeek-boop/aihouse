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
import { PRESTATIONS, suggestPrestationsForTask, significantWords } from "./le-coordinateur.mjs";
import { daysSince } from "./circle-tasks.mjs";
import { walkDocsPaths } from "./lib-shell.mjs";
import { lastTouchDays } from "./clean-dirty-old.mjs";
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
// ordinaire (seuls CASSANDRA-RH et la refonte graphique qualifient à ce jour, même liste que
// celle-ci).
export const CHANTIER_PRELIMINARY_FILES = {
  "CASSANDRA-RH": { file: "docs/cassandra-rh-conception.md", match: /cassandra/i },
  "Refonte graphique": { file: "docs/referentiel/regles-des-graphismes.md", match: /refonte graphique/i },
};

// checkChantierFileFreshness() — la « vérification, jamais seulement une intention déclarée »
// demandée explicitement (docs/regles-de-travail.md) : compare, pour chaque chantier connu, la
// tâche de suivi la plus récente qui le concerne (Sujet/Sous-sujet/Détail, jamais une nouvelle
// classification inventée) à la dernière modification RÉELLE (git, `lastTouchDays()`,
// clean-dirty-old.mjs — jamais un second calcul de fraîcheur divergent, Article 3) de son fichier
// préliminaire dédié. Signale un ÉCART honnête (idée notée en suivi, jamais recopiée dans son
// fichier), jamais une certitude d'oubli — l'idée a pu être jugée non pertinente après coup, ou
// recopiée sans qu'un nouveau commit du fichier suive immédiatement le même jour (tolérance d'une
// journée, `TOLERANCE_DAYS`, pour ce cas fréquent de commit groupé). `lastTouch` injectable (même
// patron que clean-dirty-old.mjs) pour rester testable sans dépendre de git réel.
const TOLERANCE_DAYS = 1;
export function checkChantierFileFreshness(allRows, { lastTouch = lastTouchDays } = {}) {
  const findings = [];
  for (const [chantier, { file, match }] of Object.entries(CHANTIER_PRELIMINARY_FILES)) {
    const matching = allRows.filter((r) => match.test(r.sujet) || match.test(r.sousSujet) || match.test(r.detail));
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
      findings.push({ chantier, file, taskNumber: latest.row.n, message: `fichier "${file}" introuvable ou jamais commité, alors qu'une tâche de suivi (#${latest.row.n ?? "?"}) le concerne déjà` });
      continue;
    }
    if (fileAgeDays > rowAgeDays + TOLERANCE_DAYS) {
      findings.push({ chantier, file, taskNumber: latest.row.n, message: `tâche #${latest.row.n ?? "?"} « ${latest.row.sousSujet} » (${rowAgeDays.toFixed(1)}j) plus récente que "${file}" (${fileAgeDays.toFixed(1)}j) — vérifier que l'idée a bien été recopiée` });
    }
  }
  return findings;
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
  recordCliUsage("check-tasks-details");
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
