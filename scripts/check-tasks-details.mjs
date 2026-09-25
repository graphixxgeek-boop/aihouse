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
// L'étiquette criticité/urgence/mot-clé — lue chez son propriétaire, jamais recalculée ici.
import { etiquetteDeLaTache, findMotsClesEnCollision, findChampsManquants, FORMAT_TACHE } from "./criticite.mjs";
import { findMotsClesManquants } from "./check-suivi-fidelity.mjs";
import { daysSince, printReliabilityNotice } from "./lib-shell.mjs";
import { renderTextReport } from "./report-template.mjs";
import { recordRegistryWrite } from "./tool-usage.mjs";
import { walkDocsPaths } from "./lib-shell.mjs";
import { lastTouchDays } from "./clean-dirty-old.mjs";
import { sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

// ————————————————————————————————————————————————————————————————————————
// RESPONSABLE DE L'ORGANISATION DES TÂCHES (2026-09-23, chantier 3 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// PROMOTION EXPLICITE de l'utilisateur, après la question « comme pour l'organisation de l'agence,
// il nous faut un responsable de l'organisation des tâches : c'est check-detail le bon candidat ? ».
// Réponse retenue : oui, promu. Il connaissait déjà toutes les tâches et produisait déjà le
// rapport ; lui confier en plus les RÈGLES DE CLASSEMENT évite d'inventer une coordination entre
// deux outils qui liraient la même chose.
//
// CE QUE « RESPONSABLE » VEUT DIRE ICI, et ce n'est pas un titre : il détient les règles (l'échelle
// à six paliers, le calcul par signaux mesurables, le cliquet, la nature technique/créative) et il
// est le contrôleur déclaré du process « état des tâches ». Les règles elles-mêmes vivent dans
// `scripts/priorites.mjs` — un module, jamais un second décideur : il ne s'exécute pas seul et ne
// produit aucun rapport de son côté.
//
// POURQUOI LES RÈGLES NE SONT PAS DANS CE FICHIER : tool-brain, consulté avant d'y toucher, le
// classe SENSIBLE (1164 lignes, cité par 16 fichiers, lu par le filet de sécurité) — « seules les
// modifications à risque faible peuvent y être appliquées directement ». Y verser une échelle neuve
// entière aurait été un risque élevé sur un nœud central, pour zéro gain de clarté.
export const RESPONSABLE_ORGANISATION_TACHES = {
  outil: "check-tasks-details",
  depuis: "2026-09-23",
  detient: ["l'échelle à six paliers", "le calcul de priorité par signaux mesurables", "le cliquet des trois paliers hauts", "la nature technique/créative/mixte", "le process « état des tâches »"],
  regles: "scripts/priorites.mjs",
  process: "docs/etat-des-taches-process-detail.md",
};

// L'ÉCHELLE APPLIQUÉE À UNE LIGNE RÉELLE DU SUIVI. Elle lit ce que la ligne DIT, jamais ce que
// j'imagine d'elle : la valeur déjà posée si elle existe, sinon le calcul à partir des signaux que
// la ligne porte réellement.
export function palierDeLaLigne(row = {}) {
  const dejaPose = PALIERS_PAR_CLE.has(String(row.criticite ?? "").trim()) ? String(row.criticite).trim() : null;
  if (dejaPose) return { palier: dejaPose, origine: "déjà posé dans le suivi", mesure: "mesuré" };
  const converti = convertirAncienneGravite(row.criticite);
  if (converti) return { palier: converti, origine: `converti depuis l'ancienne échelle (« ${row.criticite} »)`, mesure: "mesuré" };
  const calcul = calculerPalier(signauxDeLaLigne(row));
  return { ...calcul, origine: "calculé depuis les signaux de la ligne" };
}

// LES SIGNAUX QU'UNE LIGNE DE SUIVI PORTE RÉELLEMENT. Chacun se lit dans le texte ou dans une date,
// jamais dans une appréciation — c'est la condition que l'utilisateur a posée pour autoriser le
// calcul à aller jusqu'à CRITIQUE.
export function signauxDeLaLigne(row = {}, { stagnante = false, signaleParUnControleur = false } = {}) {
  const texte = `${row.sujet ?? ""} ${row.sousSujet ?? ""} ${row.detail ?? ""}`.toLowerCase();
  const signaux = [];
  // PAS DE `\b` DEVANT UN CARACTÈRE ACCENTUÉ (corrigé le 2026-09-23, attrapé par un test) : en
  // JavaScript, `\b` se calcule sur l'alphabet ASCII, donc « à » n'est pas une lettre pour lui et
  // `\bà chaque commit` ne peut JAMAIS matcher. Le motif paraissait juste et ne déclenchait jamais —
  // un signal muet par construction, exactement le genre de détecteur qui rassure sans rien voir.
  if (/priorit[ée]\s+absolue/.test(texte)) signaux.push("priorite-absolue-demandee");
  if (/s'aggrave|dégât|degat|perte de données|écrit faux|ecrit faux/.test(texte)) signaux.push("degat-qui-saggrave");
  if (/bloqu|en attente de|dépend de|depend de/.test(texte)) signaux.push("bloque-autre-chose");
  if (/réponse due|reponse due|te répondre|te repondre|dette envers/.test(texte)) signaux.push("dette-envers-utilisateur");
  if (/sans test|non couvert|aucune couverture/.test(texte)) signaux.push("sans-couverture-de-test");
  if (/[àa] chaque (commit|passage|tour)/.test(texte)) signaux.push("cout-repete");
  if (stagnante) signaux.push("stagnation-confirmee");
  if (signaleParUnControleur) signaux.push("signale-par-un-controleur");
  return signaux;
}

// LA VUE QUE LE RESPONSABLE DOIT SAVOIR RENDRE : la file, dans l'ordre réel de traitement.
// L'ordre vient du PALIER seul — jamais de la nature, qui décide QUAND et pas dans quel ordre.
export function fileOrdonnee(rows = [], { ouvertesSeulement = true } = {}) {
  const lignes = (ouvertesSeulement ? rows.filter((r) => !/termin|clos|résolu|resolu/i.test(String(r.statut ?? ""))) : rows)
    .map((r) => {
      const p = palierDeLaLigne(r);
      const n = natureDeLaTache(`${r.sujet ?? ""} ${r.sousSujet ?? ""}`);
      return { ...r, palier: p.palier, originePalier: p.origine, nature: n.nature, nuit: traitableLaNuit(p.palier, n.nature) };
    });
  return lignes.sort((a, b) => rangDe(b.palier) - rangDe(a.palier) || String(a.numero ?? "").localeCompare(String(b.numero ?? "")));
}

export function formatFile(file = []) {
  const l = [`File ordonnée — ${file.length} tâche(s) ouverte(s), par palier décroissant :`];
  for (const t of file) {
    const p = PALIERS_PAR_CLE.get(t.palier);
    l.push(`  ${p?.icone ?? "·"} ${t.palier.padEnd(24)} ${t.nature ? `[${t.nature}]`.padEnd(12) : "[nature ?]".padEnd(12)} #${t.numero ?? "—"} ${String(t.sousSujet ?? "").slice(0, 70)}`);
  }
  const sansNature = file.filter((t) => !t.nature).length;
  if (sansNature) l.push(`  · ${sansNature} tâche(s) sans nature déterminée — jamais routées automatiquement vers la nuit, par refus de deviner`);
  return l;
}

import { PALIERS, PALIERS_PAR_CLE, rangDe, transitionAutorisee, calculerPalier, natureDeLaTache, traitableLaNuit, marqueDeVictoire, convertirAncienneGravite, formatPalier, expliquerEchelle } from "./priorites.mjs";

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
      // Lecture ANCRÉE AUX DEUX BOUTS, jamais un compte de colonnes supposé fixe : Statut est
      // toujours la dernière cellule et Description l'avant-dernière (même principe que
      // findClaimedFilesMissing() dans check-suivi-fidelity.mjs, qui l'avait appris en 2026-09-20
      // quand la colonne N° est arrivée en tête). La colonne « Mot-clé » ajoutée le 2026-09-23 en
      // position 3 est lue par sa position de TÊTE, et son absence sur une ligne restée à
      // l'ancien format à 7 colonnes ne casse rien — elle vaut alors "" plutôt que de décaler
      // Sujet/Sous-sujet/Sensibilité d'un cran, ce qui aurait rendu toute la ligne fausse en
      // silence (c'est exactement ce décalage qui, pendant la migration, faisait lire « UTILE »
      // à 26 tâches d'un coup).
      const c = entry.cells;
      const aMotCle = c.length >= 8;
      const [n, horodatage] = c;
      const motCle = aMotCle ? c[2] : "";
      const sujet = c[aMotCle ? 3 : 2];
      const sousSujet = c[aMotCle ? 4 : 3];
      const criticite = c[aMotCle ? 5 : 4];
      // « Pour qui » (2026-09-25, tâche #825) lu exactement comme « Mot-clé » l'avait été : par sa
      // position de TÊTE, jamais par un index fixe. Une ligne restée à 8 colonnes rend "" plutôt
      // que de décaler Détail et Statut d'un cran — le décalage silencieux qui avait fait lire
      // « UTILE » à 26 tâches d'un coup pendant la migration précédente.
      // Exactement 9, jamais « au moins 9 » : une ligne dont le Détail contient un `|` non échappé
      // se découpe en 10, 12, 15 cellules, et c[6] y tombe au milieu d'une phrase. Trois lignes
      // réelles du registre sont dans ce cas (#625, #683, #751) et la première version de ce
      // lecteur les a signalées comme « valeur pour-qui invalide » — une accusation fausse sur un
      // vrai défaut d'à côté, exactement le signal adjacent pris pour le signal visé. `null`
      // signifie donc « illisible ici », jamais « absent » : les deux appellent des gestes opposés.
      const pourQui = c.length === 9 ? c[6] : (c.length > 9 ? null : "");
      const detail = c[c.length - 2];
      const statut = c[c.length - 1];
      rows.push({
        numero: Number(n) || undefined,
        horodatage,
        motCle: (motCle ?? "").trim(),
        sujet: sujet ?? "?",
        sousSujet: sousSujet ?? "?",
        criticite: criticite ?? "?",
        pourQui: pourQui === null ? null : pourQui.trim(),
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
  const threshold = (latestTaskNumber ?? Math.max(0, ...rows.map((r) => r.numero || 0))) - 20;
  return rows.filter((r) => isOpen(r) || (r.numero ?? 0) > threshold);
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
          label: `${STATUS_ICONS[t.statusKey] ?? "❓"} ${numeroTache(t.numero)} · [${t.criticite}] ${t.sousSujet} — ${t.statut}`,
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
      // LA NOUVELLE ÉTIQUETTE (2026-09-23, tâche #568). L'ancienne colonne « Sensibilité » mélangeait
      // la criticité et le retard : `URGENT-RETARD` y siégeait au-dessus de tâches plus importantes.
      // Elle est remplacée par TROIS colonnes qui disent chacune une seule chose — le mot-clé qui
      // rappelle de quoi il s'agit, la criticité seule, et l'urgence dans sa vignette à côté.
      //
      // L'ANCIEN PALIER RESTE VISIBLE en fin de ligne, et ce n'est pas de la nostalgie : c'est lui
      // qui porte l'explication détaillée (« attendre coûte à chaque tour »). Le retirer perdrait le
      // pourquoi au profit du quoi, et rendrait la migration irréversible au premier coup d'œil.
      headers: ["N°", "Mot-clé", "Criticité", "Urgence", "Sujet", "Sous-sujet", "Statut", "Palier d'origine"],
      rows: tasks.map((t) => {
        const jours = t.horodatage ? Math.floor((Date.now() - new Date(t.horodatage).getTime()) / 86400000) : undefined;
        const e = etiquetteDeLaTache(t, { jours });
        return [t.numero ?? "—", t.motCle || "—", `${e.icone} ${e.criticite}`, e.vignette, t.sujet, t.sousSujet, t.statut, e.palierSource];
      }),
    });
  }
  return blocks;
}

// auditFormatDesTaches() (2026-09-23, Ronde) — LE GARDIEN DU PROCESS FAIT ENFIN CE QUE SON
// DOCUMENT PROMET. god-of-all-process l'a dit le matin même : `docs/etat-des-taches-process-detail.md`
// annonçait quatre mécanismes (findMotsClesManquants, findMotsClesEnCollision, FORMAT_TACHE,
// findChampsManquants) que son gardien déclaré, ce fichier-ci, ne faisait PAS respecter. Pire que
// l'oubli : `findMotsClesEnCollision` y était IMPORTÉ et jamais appelé — un fil branché des deux
// côtés sauf au milieu.
//
// C'est la leçon L1 à la lettre (une règle écrite que rien ne fait respecter), et elle a été
// introduite le matin même, en documentant un mécanisme sans le brancher là où on le lit. Le
// rapport d'état des tâches est exactement l'endroit : qui le lit veut savoir quelles tâches
// ouvertes n'ont pas de mot-clé, pas seulement qu'un test quelque part y veille.
export function auditFormatDesTaches(rows, { motsClesManquantsImpl = findMotsClesManquants } = {}) {
  const ouvertes = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
  const manquants = motsClesManquantsImpl();
  const collisions = findMotsClesEnCollision(ouvertes);
  // findChampsManquants() porte le format à huit champs : on le lui applique tâche par tâche
  // plutôt que de recompter les colonnes ici, sinon deux définitions du format cohabiteraient et
  // une seule serait tenue à jour (Article 24).
  const champs = [];
  for (const r of ouvertes) {
    const absents = findChampsManquants(r);
    if (absents.length) champs.push({ numero: r.numero, absents });
  }
  return { manquants, collisions, champs, formatDeReference: FORMAT_TACHE.map((c) => c.champ) };
}

export function formatAuditFormatLines(audit) {
  const lignes = [];
  if (!audit.manquants.length && !audit.collisions.length && !audit.champs.length) {
    lignes.push(`Format des tâches ouvertes : conforme aux ${audit.formatDeReference.length} champs déclarés, chaque mot-clé valide et unique.`);
    return lignes;
  }
  for (const h of audit.manquants) lignes.push(`Mot-clé — n°${h.numero} : ${h.pourquoi}`);
  for (const c of audit.collisions) lignes.push(`Mot-clé — ${c.pourquoi}`);
  for (const c of audit.champs) lignes.push(`Format — n°${c.numero} : champ(s) absent(s) : ${c.absents.map((a) => a.champ).join(", ")}`);
  return lignes;
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
    items.push(`${numeroTache(row.numero)} « ${row.sousSujet} » → ${matches[0].outils.join(" + ")} (mots-clés : ${matches[0].matched.join(", ")})${warning}`);
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
    const row = previousSnapshots[i].rows.find((r) => r.numero === n);
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
  const lastByN = new Map(last.rows.map((r) => [r.numero, r]));
  for (const row of currentRows) {
    const prev = lastByN.get(row.numero);
    if (prev && (rank[row.statusKey] ?? 0) < (rank[prev.statusKey] ?? 0)) {
      regressions.push({ numero: row.numero, sousSujet: row.sousSujet, before: prev.statusKey, after: row.statusKey });
    }
  }
  const recent = previousSnapshots.slice(-2);
  if (recent.length === 2) {
    for (const row of currentRows) {
      if (!OPEN_KEYS.has(row.statusKey)) continue;
      const seenInBoth = recent.every((snap) => snap.rows.some((r) => r.numero === row.numero && OPEN_KEYS.has(r.statusKey)));
      // +1 : le nombre de rapports PRÉCÉDENTS où la tâche apparaît déjà ouverte, plus le rapport
      // courant lui-même — un vrai décompte de rapports consécutifs (2026-09-20, demande explicite
      // de l'utilisateur : « l'echelle dvrait s'affiner [...] permettre une meilleure comparaisone
      // netre les taches »), jamais seulement un booléen "stagnante oui/non".
      if (seenInBoth) stagnant.push({ numero: row.numero, sousSujet: row.sousSujet, streak: consecutiveOpenStreak(previousSnapshots, row.numero) + 1 });
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
  const stagnantStreakByN = new Map(stagnant.map((s) => [s.numero, s.streak ?? 3]));
  const openRows = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
  const scored = openRows.map((row) => {
    const reasons = [];
    let score = 0;

    const sensScore = SENSITIVITY_SCORE[row.criticite] ?? 0;
    if (sensScore > 0) { score += sensScore; reasons.push(`sensibilité déclarée : ${row.criticite}`); }

    // Stagnation progressive : le score grimpe avec le nombre RÉEL de rapports consécutifs où la
    // tâche est restée identique, jamais un forfait unique dès le seuil de 3 (une tâche immobile
    // depuis 12 rapports doit clairement dépasser une immobile depuis 3, plafonné à 6 pour éviter
    // qu'une tâche très ancienne écrase à elle seule tous les autres critères).
    const streak = stagnantStreakByN.get(row.numero);
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

    return { numero: row.numero, sousSujet: row.sousSujet, criticite: row.criticite, statusKey: row.statusKey, score, reasons };
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
  return JSON.stringify(rows.map((r) => [r.numero, r.statusKey]));
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
  const snapshot = { at: now(), rows: rows.map((r) => ({ numero: r.numero, statusKey: r.statusKey })) };
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
  "Organisation de l'Agence": { file: "docs/organisation-agence-conception.md", match: /organisation de l'agence|catégories transverses|organigramme/i },
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
// repartitionJeuVsOutillage() (2026-09-22) — la mesure que l'utilisateur a lui-même suggérée en
// demandant que les juges évaluent la PERTINENCE de ses choix et pas seulement un chiffre : « check
// circle peut evaluer la pertinence du type de taches et me dire : il y a plus de 80% des taches qui
// concernent l'outillage ».
//
// Elle vit ici parce que c'est ici qu'on lit docs/suivi/ — jamais un second lecteur de suivi ailleurs
// (Article 3). Le partage se fait sur le Sujet ET le Sous-sujet, les deux champs de CLASSEMENT que
// l'agent choisit délibérément, jamais sur le Détail qui est un récit libre où un mot peut apparaître
// en passant (même racine de faux positif que checkChantierFileFreshness() a déjà corrigée une fois).
//
// LE CRITÈRE : une tâche « touche le jeu » si elle parle de ce que le visiteur verra un jour — les
// personnages, le moteur, l'enquête, le dialogue, les graphismes, une simulation. Tout le reste est
// de l'outillage ou de la méthode : utile, souvent nécessaire, mais invisible pour qui ouvrira le
// site. La frontière est celle de l'organigramme de l'Agence, qui range déjà « Personnages » et
// « Moteur du jeu » hors de l'outillage.
const MOTS_DU_JEU = /lia|no[ée]|personnage|dialogue|enqu[êe]te|moteur|jauge|graphis|simulation|jeu|maison|dossier|r[ée]v[ée]lation|sommeil|attirance|r[êe]ve/i;
export function repartitionJeuVsOutillage(rows) {
  const total = rows.length;
  const jeu = rows.filter((r) => MOTS_DU_JEU.test(`${r.sujet} ${r.sousSujet}`)).length;
  const outillage = total - jeu;
  return {
    total,
    jeu,
    outillage,
    // Arrondi à une décimale : assez précis pour être cité, jamais assez pour faire croire à une
    // exactitude que le classement par mots-clés n'a pas.
    partOutillage: total ? Math.round((outillage / total) * 1000) / 10 : 0,
  };
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
      findings.push({ chantier, file, taskNumber: latest.row.numero, message: `fichier "${file}" introuvable ou jamais commité, alors qu'une tâche de suivi (#${latest.row.numero ?? "?"}) le concerne déjà` });
      continue;
    }
    // COMPARAISON EN JOURS ENTIERS (2026-09-22, second faux positif réel du même passage) : le
    // message affiche « (1.0j) plus récente que ... (1.0j) » tout en déclenchant l'alerte — un
    // verdict qui contredit sa propre phrase. La cause : la comparaison tournait sur des fractions
    // non arrondies (1.03 > 0.004 + 1) là où le message, lui, arrondit à la décimale. Cette fraction
    // n'est que du décalage d'horloge entre l'horodatage narratif du suivi et l'horloge système de
    // git — exactement ce que TOLERANCE_DAYS existe pour absorber, jamais un vrai retard. On compare
    // donc à la granularité du JOUR, la seule que la tolérance et le message expriment tous les deux.
    // LE MÊME PARADOXE TEMPOREL, SUR L'AUTRE BRANCHE (2026-09-23, faux positif réel qui a bloqué un
    // commit en boucle). `isStaged()` ne couvrait que le fichier ABSENT ; un fichier qui EXISTE,
    // que `git log` voit vieux, et qui porte justement la mise à jour demandée DANS CE COMMIT était
    // tout de même signalé. L'impasse est complète : le garde-fou réclame une mise à jour, on
    // l'écrit, il la refuse parce que git ne la voit pas encore — et git ne la verra jamais puisque
    // le commit est bloqué. Un fichier stagé est un fichier en train d'être mis à jour : c'est
    // exactement ce que le garde-fou demandait.
    if (isStaged(file)) continue;
    if (Math.floor(fileAgeDays) > Math.floor(rowAgeDays) + TOLERANCE_DAYS) {
      findings.push({ chantier, file, taskNumber: latest.row.numero, message: `tâche #${latest.row.numero ?? "?"} « ${latest.row.sousSujet} » (${rowAgeDays.toFixed(1)}j) plus récente que "${file}" (${fileAgeDays.toFixed(1)}j) — vérifier que l'idée a bien été recopiée` });
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
// DEUX SIGNAUX, ET LE SECOND EST CELUI QUI EXISTE VRAIMENT (2026-09-25, constat DEEP-READER 8 :
// « registre idées-à-trancher construit mais VIDE »). La cause racine, mesurée plutôt que devinée :
// ce détecteur ne regardait que le SUJET, et seulement s'il commence par « Nouvel outil » ou
// « Conception » — le vocabulaire du suivi en septembre 2026-09-21. Depuis, le suivi porte une
// colonne Criticité dont l'une des valeurs est littéralement `A-TRANCHER`, posée à la main sur
// chaque ligne qui attend une décision. Le signal le plus fiable qui soit, et le détecteur ne le
// lisait pas. Résultat : ZÉRO candidat sur 803 lignes réelles, dont sept écrites le matin même
// avec `A-TRANCHER` en toutes lettres — un registre parfaitement vide et parfaitement faux.
//
// C'est la huitième fois de la même journée qu'une sonde rend « rien trouvé » alors qu'elle ne
// POUVAIT pas trouver. On garde l'ancien chemin (des lignes anciennes n'ont que le sujet) et on
// ajoute celui qui compte, plutôt que de remplacer — une ligne qui remontait hier doit remonter
// encore.
// LA CLÔTURE ET LE STATUT QUI SE CONTREDISENT (2026-09-25, tâche #844 — trouvé en instruisant #209).
//
// LE SUIVI A DEUX FAÇONS DE DIRE QU'UNE TÂCHE EST FINIE, et elles ne se parlent pas : la colonne
// STATUT de sa propre ligne, et une ligne ULTÉRIEURE qui commence par « CLÔTURE DE #NNN » — la
// forme imposée ici, puisqu'un numéro ne se réutilise jamais. Rien ne vérifiait qu'elles disent la
// même chose.
//
// MESURÉ : sur 128 lignes encore marquées ouvertes, **8 sont clôturées par une ligne postérieure**.
// Elles gonflent la file, elles remontent dans « les plus anciennes », et elles font croire à un
// retard qui n'existe pas — c'est-à-dire exactement ce que cette journée a passé son temps à
// démêler, appliqué cette fois au suivi lui-même.
//
// CE QU'IL NE TRANCHE PAS : laquelle des deux a raison. Une clôture annoncée peut être fausse, et
// un statut non mis à jour peut être un oubli. Les deux appellent un œil, jamais une correction
// automatique d'un registre que l'utilisateur relit.
export const MOTIF_CLOTURE = /CL[ÔO]TURE\s+(?:DE\s+|du\s+constat[^#]{0,40})#(\d+)/gi;

export function findStatutsContredits(rows = []) {
  if (!rows.length) return { mesurable: false, pourquoi: "aucune ligne de suivi lue : rien à confronter, ce qui n'est pas la même chose qu'aucune contradiction" };
  const texte = rows.map((r) => r.detail ?? "").join("\n");
  const cloturees = new Set([...texte.matchAll(MOTIF_CLOTURE)].map((m) => m[1]));
  const contredits = rows
    .filter((r) => r.statusKey !== "terminee" && Number.isFinite(r.numero) && cloturees.has(String(r.numero)))
    .map((r) => ({ numero: r.numero, statut: r.statut, sousSujet: String(r.sousSujet ?? "").slice(0, 70) }));
  return {
    mesurable: true, contredits, lignesLues: rows.length, cloturesAnnoncees: cloturees.size,
    horsPortee: "Il montre que les deux sources se contredisent, jamais laquelle a raison : une clôture annoncée peut être fausse, un statut non mis à jour peut être un simple oubli. Aucune correction automatique sur un registre que l'utilisateur relit.",
  };
}

export function formatStatutsContreditsLines(r) {
  if (!r?.mesurable) return [`STATUTS CONTREDITS : PAS MESURÉ — ${r?.pourquoi ?? "aucune donnée"}`];
  if (!r.contredits.length) return [`Statuts : aucune contradiction sur ${r.lignesLues} ligne(s), pour ${r.cloturesAnnoncees} clôture(s) annoncée(s) ailleurs.`];
  const L = [`🔴 ${r.contredits.length} tâche(s) marquées OUVERTES alors qu'une ligne postérieure les déclare closes (sur ${r.lignesLues} lignes, ${r.cloturesAnnoncees} clôtures annoncées) :`];
  for (const c of r.contredits) L.push(`   · #${c.numero} — statut « ${c.statut} » — ${c.sousSujet}`);
  L.push("   Elles gonflent la file et remontent en tête des « plus anciennes » : un retard qui n'existe pas.");
  L.push(`   HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export const MOTIF_A_TRANCHER = /^\s*A[- ]?TRANCHER\s*$/i;

export function detectPendingIdeaCandidates(allRows, sinceTaskNumber = 332) {
  return (allRows ?? []).filter((r) => {
    if (r.statusKey === "terminee") return false;
    if (MOTIF_A_TRANCHER.test(String(r.criticite ?? ""))) return true;
    return /^(Nouvel outil|Conception)/i.test(r.sujet ?? "") && (r.numero ?? 0) > sinceTaskNumber;
  });
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
  // « TRANCHÉE » AJOUTÉE LE 2026-09-25 (tâche #857), et le trou qu'elle ferme est celui qui compte
  // le plus dans ce registre : il savait dire qu'une décision ATTEND, jamais qu'elle a été PRISE.
  // Trouvé en le cassant pour de vrai — l'utilisateur venait de trancher neuf décisions d'un coup,
  // j'ai écrit « TRANCHÉ 2026-09-25 » dans la colonne Décision, et la ligne a cessé d'exister aux
  // yeux du registre : aucune valeur reconnue, donc aucune décision associée à #801, donc le
  // garde-fou l'a comptée « idée jamais enregistrée ».
  //
  // LES DEUX ISSUES QU'IL RESTAIT SANS ELLE ÉTAIENT TOUTES LES DEUX FAUSSES : laisser « à trancher »
  // sur une décision prise (elle serait reposée à chaque Ronde, ce que la leçon L22 interdit
  // explicitement — ne jamais rouvrir ce qu'il a fermé), ou l'effacer du registre (elle
  // disparaîtrait, et avec elle la trace de ce qui a été décidé et pourquoi).
  //
  // Ce n'est pas un élargissement de vocabulaire libre : c'est le quatrième état d'une machine à
  // états qui en comptait trois et demi — à trancher · entre-deux · abandonnée · fichier créé ·
  // TRANCHÉE. Article 24 l'autorise expressément pour un vocabulaire fermé par nature.
  const KNOWN = new Set(["à trancher", "entre-deux", "abandonnée", "fichier créé", "tranchée"]);
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

// findIdeasNeedingDecision() — une décision "abandonnée", "fichier créé" ou "tranchée" ne redemande
// plus jamais la question ; "entre-deux" la repose à CHAQUE Ronde tant qu'aucun fichier n'a été créé
// (demande explicite) ; une idée jamais rencontrée ("à trancher" implicite, absente du registre) la
// pose pour la première fois.
//
// « tranchée » rejoint le camp de celles qui ne se reposent plus (2026-09-25, tâche #857) : c'est
// tout son intérêt. Une décision prise qu'on continuerait de présenter comme en attente ferait
// exactement ce que la leçon L22 interdit — reproposer à l'utilisateur ce qu'il a déjà fermé.
export function findIdeasNeedingDecision(candidates, decisions) {
  return candidates.filter((r) => {
    const known = decisions[String(r.numero)];
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
  const numbered = rows.filter((r) => Number.isFinite(r.numero) && r.numero > 0);
  const numbers = numbered.map((r) => r.numero);
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
    findings.push({ gravite: (s.streak ?? 3) >= 5 ? "forte" : "moyenne", constat: `${numeroTache(s.numero)} « ${s.sousSujet} » est ouverte et identique depuis ${s.streak ?? 3} rapports consécutifs.` });
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
      L.push(`  ${icone} #${pad(t.numero ?? "—", 4)} ${pad(splitSujet(t.sujet).theme.slice(0, 26), 28)} ${String(t.sousSujet ?? "").slice(0, 96)}`);
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
  const latestTaskNumber = Math.max(0, ...rows.map((r) => r.numero || 0));
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
    blocks.push({ type: "list", items: regressions.map((r) => `${numeroTache(r.numero)} « ${r.sousSujet} » : ${r.before} → ${r.after}`) });
  }
  if (stagnant.length) {
    blocks.push({ type: "note", text: `${stagnant.length} tâche(s) ouverte(s) identiques depuis au moins 3 rapports consécutifs — possible oubli, à vérifier (jamais une certitude).` });
    blocks.push({ type: "list", items: stagnant.map((s) => `${numeroTache(s.numero)} « ${s.sousSujet} »`) });
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
  // LE FORMAT DES TÂCHES, dans le rapport et pas seulement dans un test (2026-09-23, Ronde) —
  // c'est ici que le gardien déclaré du process `etat-des-taches` tient enfin les quatre mécanismes
  // que son document promet. Toujours affiché, y compris quand tout va bien : une section qui
  // n'apparaît qu'en cas de problème ne dit jamais « c'est vérifié », seulement rien.
  const auditFormat = auditFormatDesTaches(rows);
  blocks.push({ type: "heading", text: "Format et mot-clé des tâches ouvertes (garde-fou du process)" });
  blocks.push({ type: "list", items: formatAuditFormatLines(auditFormat) });

  const recommended = recommendNextTasks(rows, { stagnant });
  if (recommended.length) {
    blocks.push({ type: "heading", text: "Ordre recommandé des prochaines tâches (signal, jamais une décision)" });
    blocks.push({ type: "list", items: recommended.map((r, i) => `${i + 1}. #${r.numero ?? "—"} « ${r.sousSujet} » — ${r.reasons.join(" ; ")}`) });
  }

  return {
    title: `État des tâches — ${ZOOM_LABELS[zoom]}`,
    subtitle: `Forme : ${FORMAT_LABELS[format]} · ${scoped.length} tâche(s) affichée(s) sur ${rows.length} au total`,
    blocks: blocks.filter((b) => b.type !== "noop"),
    meta: { zoom, format, count: scoped.length, total: rows.length, regressions, stagnant, recommended, chantierFreshnessGaps, auditFormat },
  };
}

// LE NUMÉRO D'UNE TÂCHE, AFFICHÉ HONNÊTEMENT (2026-09-23)
//
// Relevé par l'utilisateur sur le rapport d'état de la Ronde : une tâche y apparaissait comme
// « #undefined ». Vérification faite avant de corriger : la donnée n'est PAS cassée — 50 lignes du
// suivi portent volontairement « — » comme numéro (des tâches antérieures à la numérotation, ou
// des notes qui n'en méritent pas). La convention est légitime ; c'est l'AFFICHAGE qui mentait.
//
// « #undefined » est exactement le défaut que ce projet corrige partout ailleurs : une absence
// rendue comme une valeur. Elle fait douter du reste du rapport — un lecteur qui voit « undefined »
// se demande ce qui d'autre est faux — alors que « sans numéro » dit la vérité et n'inquiète pas.
//
// UN SEUL FORMATEUR plutôt que trois gardes recopiées : trois endroits affichaient ce numéro, deux
// avec un garde et un sans. C'est précisément ainsi qu'un quatrième endroit naîtra sans garde.
export function numeroTache(n) {
  return n === undefined || n === null || n === "" || n === "—" ? "sans numéro" : `#${n}`;
}

function appendIndexRow({ file, zoom, format, count, total, regressions, stagnant }) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const header = "| Date | Zoom | Forme | Tâches affichées | Total | Régressions | Stagnations | Rapport |\n|---|---|---|---|---|---|---|---|\n";
  const prior = existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, "utf8") : `# Registre check-tasks-details\n\n${header}`;
  const row = `| ${new Date().toISOString()} | ${zoom} | ${format} | ${count} | ${total} | ${regressions.length} | ${stagnant.length} | ${file} |\n`;
  writeFileSync(INDEX_FILE, prior + row, "utf8");
  // QUATRIÈME MOMENT OPPORTUN (2026-09-23) — l'index de check-tasks-details est lu par la Ronde
  // (fraîcheur) et par data-archangel. L'écrire, c'est l'alimenter.
  recordRegistryWrite(INDEX_FILE, { par: "check-tasks-details" });
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
  // Sous-commande `poids` (2026-09-24, chantier 5 du plan de nuit) : le poids des tâches, les
  // vignettes, les lignes longues sans résumé de tête et la répartition des origines. Sous-commande
  // à part parce qu'elle sert à COMPOSER le travail avant de le lancer, jamais à le rendre compte —
  // la mêler au rapport d'état aurait noyé un outil de décision dans un outil de constat.
  // Sous-commande `emiettement` (2026-09-25, tâche #735) : le pendant EXACT de `poids`, et c'est
  // pour ça qu'elle vit à côté plutôt que dedans. `poids` demande « cette tâche est-elle trop
  // GROSSE ? », celle-ci demande « avons-nous coupé trop FIN ? ». Les deux défauts sont opposés et
  // se paient différemment : une tâche trop grosse se traîne, cinquante trop fines noient la file.
  if (process.argv[2] === "emiettement") {
    const rows = loadAllTaskRows();
    console.log(`\n=== ÉMIETTEMENT DE LA FILE — a-t-on coupé trop fin ? ===\n`);
    for (const l of formatEmiettementLines(emiettementDesTaches(rows), dureeDeVieDesTaches(rows))) console.log(l);
    return;
  }
  if (process.argv[2] === "poids") {
    const rows = loadAllTaskRows();
    const ouvertes = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
    console.log(`\n=== POIDS, VIGNETTES ET ORIGINES — ${ouvertes.length} tâche(s) ouverte(s) sur ${rows.length} ===\n`);
    for (const l of formatChantier5Lines(rows, { ouvertes })) console.log(l);
    const lourdes = ouvertes.filter((r) => poidsDeLaTache(r).palier === "lourde");
    if (lourdes.length) {
      console.log(`\n--- Vignettes des ${lourdes.length} tâche(s) ouverte(s) LOURDE(S) ---`);
      for (const r of lourdes) for (const l of vignetteDeLaTache(r).lignes) console.log(l);
    }
    console.log(`\nHORS PORTÉE : le poids dit s'il faut DÉCOUPER, jamais dans quel ordre traiter — l'ordre vient du palier de priorité, et les deux ne se remplacent pas.`);
    return;
  }
  // Sous-commande `suites` (2026-09-24, tâche #698) : la chaîne « mesure → suite », le maillon que
  // l'Article 28 laissait ouvert. Sous-commande à part et non un bloc du rapport d'état, parce
  // qu'elle ne dit pas OÙ ON EN EST mais CE QU'ON A LAISSÉ TOMBER — deux questions qu'on ne lit pas
  // au même moment ni dans le même état d'esprit.
  if (process.argv[2] === "suites") {
    const rows = loadAllTaskRows();
    console.log(`\n=== CONSTATS SANS SUITE — la chaîne « mesure → suite » sur TOUT le registre ===\n`);
    for (const l of formatConstatsSansSuiteLines(rows, { limite: Number(process.argv[3]) || 25 })) console.log(l);
    console.log(`\nHORS PORTÉE : cet outil voit qu'un constat ne conclut pas ; il ne dit jamais si le constat MÉRITAIT une suite — ça se lit, et ça se tranche avec l'utilisateur.`);
    return;
  }
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

  // LE CONTENU, PAS SEULEMENT LE CHEMIN (2026-09-23, constat de l'utilisateur sur la Ronde du
  // jour : « check-detail est vide de contenu data et analytique [...] à chaque fois je dois avoir
  // un contenu intéressant non ? »). Il avait raison et le défaut était réel : ce chemin de sortie
  // n'imprimait QUE le nom du fichier HTML produit et trois compteurs. Livré tel quel dans le
  // dossier de la Ronde, le rapport ne portait aucune donnée — il pointait vers une donnée.
  //
  // Un rapport de Ronde est LU DANS SON FICHIER TEXTE, jamais rouvert ailleurs : un pointeur y est
  // un cul-de-sac. La version HTML reste produite (elle est plus agréable à parcourir), mais elle
  // s'ajoute au contenu au lieu de le remplacer. Même patron que partout ailleurs ici : un
  // mécanisme qui ne sort pas du script est une intention.
  console.log(renderTextReport({
    tool: "check-tasks-details",
    title: report.title,
    subtitle: report.subtitle,
    dateLabel: new Date().toISOString(),
    blocks: report.blocks,
    footer: "check-tasks-details — lecture seule, docs/suivi/ reste l'unique source de vérité du projet.",
  }));
  console.log(`\nMême rapport en HTML : ${outFile}`);
  console.log(`Zoom : ${ZOOM_LABELS[zoom]} — Forme : ${FORMAT_LABELS[format]}`);
  console.log(`${report.meta.count} tâche(s) affichée(s) sur ${report.meta.total} au total.`);
  if (report.meta.regressions.length) console.log(`⚠️ ${report.meta.regressions.length} régression(s) détectée(s).`);
  if (report.meta.stagnant.length) console.log(`${report.meta.stagnant.length} tâche(s) possiblement oubliée(s) (stagnation).`);
  if (report.meta.chantierFreshnessGaps.length) console.log(`⚠️ ${report.meta.chantierFreshnessGaps.length} fichier(s) préliminaire(s) de chantier possiblement en retard sur le suivi.`);

  // LE PLAN D'ACTION (2026-09-23, tâche #211). Cet outil dresse l'état des tâches — il est donc le
  // seul dont le plan d'action porte sur… le suivi des plans d'action. D'où une prudence
  // particulière : il ne doit jamais fabriquer des tâches à partir de l'état des tâches, sous peine
  // d'une boucle qui gonflerait le suivi sans rien faire avancer.
  //
  // Une RÉGRESSION est un fait dur : une tâche déclarée terminée qui ne l'est plus. RETENU.
  // Un fichier de chantier POSSIBLEMENT en retard est, comme son nom le dit, une possibilité — le
  // classer « retenu » transformerait une heuristique de fraîcheur en verdict.
  const constatsTaches = [
    ...(report.meta.regressions ?? []).map((r) => ({ constat: `régression : ${r.tache ?? r.label ?? r} n'est plus dans l'état où elle avait été déclarée`, etat: "retenu",
      tache: "remonter à ce qui a défait cette tâche, jamais la re-cocher sans comprendre" })),
    ...(report.meta.chantierFreshnessGaps ?? []).map((g) => ({ constat: `fichier préliminaire de chantier possiblement en retard sur le suivi : ${g.fichier ?? g.label ?? g}`, etat: "a-trancher",
      pourquoi: "la fraîcheur se mesure sur des dates, pas sur le contenu : un fichier ancien peut être simplement fini" })),
  ];
  const planTaches = buildPlanDaction(constatsTaches, { toolSlug: "check-tasks-details" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planTaches.lignes) console.log(l);
}


// ===========================================================================================
// LE POIDS D'UNE TÂCHE, SA VIGNETTE, ET SON ORIGINE  (2026-09-24, chantier 5 du plan de nuit)
// ===========================================================================================
//
// POURQUOI CES TROIS CHOSES SONT DANS LE MÊME BLOC, alors qu'elles répondent à trois demandes
// distinctes de l'utilisateur (5.2 « poids de la tâche + vignette », 5.3 « un résumé court en tête
// de chaque tâche longue », 5.5 « les tâches que l'agent s'attribue : le signaler ») : les trois se
// lisent sur la MÊME ligne de suivi, au même moment, et aucune ne vaut la peine d'un second
// fichier. Les séparer aurait donné trois lectures du même registre, donc trois occasions de
// diverger (Article 24).
//
// LA LIGNE ROUGE, la même pour les trois : chacune se calcule sur ce que la ligne DIT — une
// longueur, une énumération, une phrase présente ou absente — jamais sur une appréciation de ma
// part. Et quand la ligne ne porte aucun signal, la réponse est « non mesurable », jamais un poids
// moyen par défaut : c'est exactement le faux vert qui a coûté six corrections cette nuit-là.

// Le seuil au-dessus duquel une tâche est dite LONGUE. Il n'est pas choisi rond : mesuré sur le
// registre réel du 2026-09-24, la médiane des descriptions est aux alentours de 600 caractères et
// les lignes qui posent réellement problème à la lecture dépassent toutes le double. 1200 attrape
// donc le haut du panier sans accuser la moitié du registre — un seuil qui alerte sur tout n'est
// plus lu (leçon L4).
export const SEUIL_TACHE_LONGUE = 1200;

// Les signaux qui font le POIDS d'une tâche. Chacun est un fait lisible dans le texte, et chacun
// porte ce qu'il coûte : le poids ne sert pas à classer, il sert à décider s'il faut DÉCOUPER.
export const SIGNAUX_DE_POIDS = [
  { cle: "description-longue", points: 2, pourquoi: "la description dépasse le seuil de tâche longue",
    detecte: (r) => String(r.detail ?? "").length > SEUIL_TACHE_LONGUE },
  { cle: "plusieurs-livrables", points: 2, pourquoi: "plusieurs livrables distincts sont annoncés dans la même ligne",
    detecte: (r) => (String(r.detail ?? "").match(/\b(puis|ensuite|et enfin|ainsi que)\b/gi) ?? []).length >= 2 },
  { cle: "enumeration", points: 2, pourquoi: "la ligne énumère des sous-parties numérotées ou à puces",
    detecte: (r) => (String(r.detail ?? "").match(/(?:^|[\s(])\(?\d\)|(?:^|\s)[·•-]\s/g) ?? []).length >= 3 },
  { cle: "plusieurs-fichiers", points: 1, pourquoi: "trois fichiers ou plus sont nommés",
    detecte: (r) => new Set(String(r.detail ?? "").match(/`[\w./-]+\.(?:mjs|ts|tsx|md|html|json)`/g) ?? []).size >= 3 },
  { cle: "plusieurs-outils", points: 1, pourquoi: "plusieurs outils de l'Agence sont impliqués",
    detecte: (r) => (String(r.detail ?? "").match(/\b(?:ARGUS|HARMONIA|AXA-CHECK|CLONE-HUNTER|CASSANDRA|MOÏSE|THE-KING|tool-brain|god-of-all-process|SAFE-EXPORT)\b/g) ?? []).length >= 3 },
  { cle: "chantier-declare", points: 2, pourquoi: "la ligne se déclare elle-même comme un chantier",
    detecte: (r) => /\bchantier\b/i.test(`${r.sousSujet ?? ""} ${r.detail ?? ""}`) },
];

// Les paliers de poids. Trois, pas plus : la seule décision qu'ils servent est binaire (découper ou
// non), et un quatrième palier n'aurait rien changé à cette décision.
export const PALIERS_DE_POIDS = [
  { cle: "lourde", min: 6, icone: "⬛", quoi: "à découper en une série de petites avant d'être lancée" },
  { cle: "moyenne", min: 3, icone: "◧", quoi: "faisable d'un bloc, mais mérite un ordre écrit avant de commencer" },
  { cle: "legere", min: 0, icone: "▫", quoi: "se traite d'un seul geste" },
];

// LE POIDS D'UNE LIGNE. Retourne TOUJOURS les signaux qui l'ont produit : un poids sans ses raisons
// est un chiffre qu'on ne peut ni contester ni corriger, donc un chiffre qu'on finit par croire.
export function poidsDeLaTache(row = {}, { signaux = SIGNAUX_DE_POIDS, paliers = PALIERS_DE_POIDS } = {}) {
  const texte = `${row.sujet ?? ""} ${row.sousSujet ?? ""} ${row.detail ?? ""}`.trim();
  if (!texte) {
    return { mesurable: false, palier: null, points: 0, signaux: [],
      pourquoi: "la ligne ne porte aucun texte : rien à mesurer, et un poids par défaut ressemblerait à une mesure" };
  }
  const trouves = signaux.filter((s) => { try { return s.detecte(row); } catch { return false; } });
  const points = trouves.reduce((n, s) => n + s.points, 0);
  const palier = paliers.find((p) => points >= p.min) ?? paliers[paliers.length - 1];
  return { mesurable: true, palier: palier.cle, icone: palier.icone, quoi: palier.quoi, points,
    signaux: trouves.map((s) => ({ cle: s.cle, points: s.points, pourquoi: s.pourquoi })) };
}

// LE DÉCOUPAGE PROPOSÉ. Il ne découpe RIEN : il rend les morceaux que la ligne nomme déjà elle-même,
// pour qu'on n'ait pas à les retrouver à la main. Une tâche lourde dont le texte n'énumère rien
// ressort avec zéro morceau et le dit — inventer des sous-tâches à partir d'une prose serait
// exactement l'outil qui se satisfait tout seul que l'Article 28 refuse.
export function decoupagePropose(row = {}) {
  const detail = String(row.detail ?? "");
  const morceaux = [];
  // PAS de séparateur consommé devant `\(` (corrigé au premier test, 2026-09-24) : exiger un blanc
  // avant chaque « (n) » ne peut trouver que le PREMIER morceau, puisque la capture du morceau
  // précédent avale déjà ce blanc. Le motif paraissait juste et rendait systématiquement 1 sur 3.
  // `\(\d+\)` seul ne risque rien : une date comme « (2026-09-24) » porte des tirets et ne matche pas.
  for (const m of detail.matchAll(/\((\d+)\)\s*([^()]{10,140})/g)) morceaux.push(m[2].trim().replace(/[\s.;,]+$/, ""));
  if (morceaux.length < 2) {
    for (const m of detail.matchAll(/[·•]\s*([^·•]{10,140})/g)) morceaux.push(m[1].trim().replace(/[\s.;,]+$/, ""));
  }
  const uniques = [...new Set(morceaux)];
  return { morceaux: uniques,
    pourquoi: uniques.length >= 2
      ? "morceaux lus dans la ligne elle-même, jamais déduits — à valider avant d'en faire des tâches"
      : "la ligne n'énumère rien de découpable : le découpage reste à écrire à la main, il ne s'invente pas" };
}

// LA VIGNETTE. Trois lignes, lisibles d'un coup d'œil, exactement ce que l'utilisateur demandait
// pour « composer une grosse tâche en série de petites » sans rouvrir le registre entier.
// ————————————————————————————————————————————————————————————————————————
// L'ÉMIETTEMENT DES TÂCHES (2026-09-25, tâche #735)
// ————————————————————————————————————————————————————————————————————————
//
// SA DEMANDE : « cree une extension dans un outil et avance sur le sujet ».
//
// LE TROU, et il est net : `poidsDeLaTache()` dit si UNE tâche est trop grosse pour être lancée
// d'un bloc. RIEN ne disait si on avait coupé trop FIN. Les deux défauts sont opposés et se
// paient différemment — une tâche trop grosse se traîne, cinquante tâches trop fines noient la
// file et font perdre le fil de ce qu'on faisait.
//
// CE QUI SE MESURE HONNÊTEMENT, trois signaux et pas un de plus :
//   1. LA CONCENTRATION — combien de tâches OUVERTES partagent le même thème. Dix tâches sur un
//      même thème sont probablement une seule mal découpée.
//   2. LA PART DE LÉGÈRES parmi les ouvertes, via `poidsDeLaTache()` déjà écrit — réutilisé, pas
//      recalculé (Article 24 : un seuil se DÉRIVE, il ne se recopie pas).
//   3. LA DURÉE DE VIE — l'écart entre l'horodatage d'une tâche et celui de sa CLÔTURE. La
//      convention du suivi la rend lisible sans rien ajouter : une clôture s'ouvre par
//      « CLÔTURE DE #NNN. » et porte son propre horodatage. Une tâche fermée en dix minutes
//      n'aurait peut-être pas dû exister comme tâche.
//
// CE QUI NE SE MESURE PAS, ET QUI EST DÉCLARÉ PLUTÔT QUE DEVINÉ : « trop de tâches » n'a AUCUN
// seuil absolu. Un chantier de fond en produit légitimement dix sur un thème ; une journée de
// correctifs en produit trente légères sans que rien ne cloche. L'outil montre donc une TENDANCE
// et dit si elle s'accélère — jamais un verdict, jamais un « il faut regrouper ». La comparaison
// se fait contre le passé du projet lui-même, seul étalon qui veut dire quelque chose ici.

export const TAILLE_FENETRE_TENDANCE = 50;

export function dureeDeVieDesTaches(rows = []) {
  const ouverture = new Map();
  for (const r of rows) if (r.numero && r.horodatage) ouverture.set(r.numero, r.horodatage);
  const durees = [];
  for (const r of rows) {
    const m = String(r.detail ?? "").match(/CL[ÔO]TURE DE #(\d+)/i);
    if (!m) continue;
    const debut = ouverture.get(Number(m[1]));
    if (!debut || !r.horodatage) continue;
    const ms = Date.parse(r.horodatage) - Date.parse(debut);
    if (Number.isFinite(ms) && ms >= 0) durees.push({ numero: Number(m[1]), clotureePar: r.numero, heures: ms / 3600000 });
  }
  if (!durees.length) {
    return { mesurable: false, pourquoi: "aucune paire ouverture/clôture lisible : la durée de vie se lit sur la convention « CLÔTURE DE #NNN », et sans elle il n'y a rien à mesurer — jamais une durée de zéro, qui se lirait comme « fermée aussitôt »" };
  }
  const triees = [...durees].sort((a, b) => a.heures - b.heures);
  // LA MÉDIANE, jamais la moyenne : une seule tâche restée ouverte trois semaines tirerait la
  // moyenne à elle seule et dirait le contraire de ce que fait la file.
  const mediane = triees[Math.floor(triees.length / 2)].heures;
  const eclairs = durees.filter((d) => d.heures < 1);
  return {
    mesurable: true, comptees: durees.length,
    medianeHeures: Math.round(mediane * 10) / 10,
    eclairs: eclairs.length,
    partEclairs: (eclairs.length / durees.length) * 100,
    plusCourtes: triees.slice(0, 3).map((d) => `#${d.numero} (${d.heures < 2 ? `${Math.round(d.heures * 60)} min` : `${Math.round(d.heures * 10) / 10} h`})`),
    // LE DÉNOMINATEUR VOYAGE AVEC LE CHIFFRE, et il est indispensable ici : la convention
    // « CLÔTURE DE #NNN » est RÉCENTE dans ce suivi. Une médiane calculée sur neuf paires, sans
    // dire qu'il existe six cents tâches fermées, se lirait comme une mesure du projet entier
    // alors qu'elle ne décrit que ses derniers jours.
    fermeesEnTout: rows.filter((r) => r.statusKey === "terminee").length,
    horsPortee: "Une tâche fermée vite n'est pas forcément une tâche de trop : elle peut avoir été bien cadrée. Ce chiffre ouvre une question, il ne la tranche pas.",
  };
}

export function emiettementDesTaches(rows = [], { poids = poidsDeLaTache, fenetre = TAILLE_FENETRE_TENDANCE } = {}) {
  const ouvertes = rows.filter((r) => OPEN_KEYS.has(r.statusKey));
  if (!ouvertes.length) {
    return { mesurable: false, pourquoi: "aucune tâche ouverte : il n'y a pas de file à juger, ce qui n'est pas la même chose qu'une file saine" };
  }
  // 1. CONCENTRATION PAR THÈME.
  const parTheme = new Map();
  for (const r of ouvertes) {
    const t = splitSujet(r.sujet).theme;
    parTheme.set(t, (parTheme.get(t) ?? 0) + 1);
  }
  const themes = [...parTheme.entries()].map(([theme, n]) => ({ theme, ouvertes: n, part: (n / ouvertes.length) * 100 })).sort((a, b) => b.ouvertes - a.ouvertes);
  // 2. PART DE LÉGÈRES — `poidsDeLaTache()` réutilisé, jamais un second barème.
  let legeres = 0; let pesees = 0;
  for (const r of ouvertes) {
    const p = poids(r);
    if (!p?.mesurable) continue;
    pesees += 1;
    if (p.palier === "legere") legeres += 1;
  }
  // 3. TENDANCE — le rythme de création sur la dernière fenêtre contre la précédente.
  const datees = rows.filter((r) => r.numero && r.horodatage && Number.isFinite(Date.parse(r.horodatage))).sort((a, b) => a.numero - b.numero);
  let tendance = { mesurable: false, pourquoi: `moins de ${fenetre * 2} tâches datées : une tendance calculée sur deux fenêtres incomplètes dirait n'importe quoi` };
  if (datees.length >= fenetre * 2) {
    const rythme = (tranche) => {
      const h = (Date.parse(tranche[tranche.length - 1].horodatage) - Date.parse(tranche[0].horodatage)) / 3600000;
      return h > 0 ? tranche.length / h : null;
    };
    const recent = rythme(datees.slice(-fenetre));
    const avant = rythme(datees.slice(-fenetre * 2, -fenetre));
    if (recent !== null && avant !== null && avant > 0) {
      tendance = {
        mesurable: true, recentParHeure: Math.round(recent * 10) / 10, precedentParHeure: Math.round(avant * 10) / 10,
        variationPct: Math.round(((recent - avant) / avant) * 1000) / 10,
        sens: recent > avant ? "s'accélère" : recent < avant ? "ralentit" : "stable",
      };
    }
  }
  return {
    mesurable: true, ouvertes: ouvertes.length, themes,
    themeLePlusDense: themes[0] ?? null,
    legeres: pesees ? { legeres, pesees, part: (legeres / pesees) * 100 } : { mesurable: false, pourquoi: "aucune ligne ouverte ne porte assez de texte pour être pesée" },
    tendance,
    horsPortee:
      "« Trop de tâches » n'a AUCUN seuil absolu, et aucun n'est proposé ici : un chantier de fond en produit " +
      "légitimement dix sur un thème, une journée de correctifs en produit trente légères sans que rien ne cloche. " +
      "Ce rapport montre une TENDANCE contre le passé du projet lui-même — jamais un verdict, jamais un ordre de regrouper.",
  };
}

export function formatEmiettementLines(e, duree) {
  if (!e?.mesurable) return [`PAS MESURÉ — ${e?.pourquoi ?? "aucune donnée"}`];
  const l = [
    `${e.ouvertes} tâche(s) ouverte(s), réparties sur ${e.themes.length} thème(s).`,
    "",
    "CONCENTRATION — dix tâches sur un même thème sont probablement une seule mal découpée :",
  ];
  for (const t of e.themes.slice(0, 6)) l.push(`   ${String(t.ouvertes).padStart(3)} ouvertes  (${t.part.toFixed(1).padStart(5)} %)  ${t.theme}`);
  if (e.themes.length > 6) l.push(`   … et ${e.themes.length - 6} thème(s) de moins de ${e.themes[6].ouvertes + 1} tâche(s)`);
  l.push("");
  l.push(e.legeres.pesees
    ? `PART DE LÉGÈRES parmi les ouvertes : ${e.legeres.part.toFixed(1)} %  (${e.legeres.legeres}/${e.legeres.pesees} pesées) — poidsDeLaTache() réutilisé, jamais un second barème.`
    : `PART DE LÉGÈRES : PAS MESURÉE — ${e.legeres.pourquoi}`);
  l.push("");
  l.push(duree?.mesurable
    ? `DURÉE DE VIE (médiane sur ${duree.comptees} clôtures lisibles, sur ${duree.fermeesEnTout} tâches fermées en tout — la convention « CLÔTURE DE #NNN » est récente) : ${duree.medianeHeures} h · ${duree.eclairs} tâche(s) fermée(s) en moins d'une heure (${duree.partEclairs.toFixed(1)} %) — les plus courtes : ${duree.plusCourtes.join(", ")}`
    : `DURÉE DE VIE : PAS MESURÉE — ${duree?.pourquoi ?? "aucune donnée"}`);
  if (duree?.mesurable) l.push(`   ${duree.horsPortee}`);
  l.push("");
  l.push(e.tendance.mesurable
    ? `TENDANCE : le rythme ${e.tendance.sens} — ${e.tendance.recentParHeure} tâche(s)/h sur les ${TAILLE_FENETRE_TENDANCE} dernières contre ${e.tendance.precedentParHeure} sur les ${TAILLE_FENETRE_TENDANCE} précédentes (${e.tendance.variationPct > 0 ? "+" : ""}${e.tendance.variationPct} %).`
    : `TENDANCE : PAS MESURÉE — ${e.tendance.pourquoi}`);
  l.push("");
  l.push(`HORS PORTÉE : ${e.horsPortee}`);
  return l;
}

export function vignetteDeLaTache(row = {}) {
  const p = poidsDeLaTache(row);
  const pal = palierDeLaLigne(row);
  const o = origineDeLaTache(row);
  const titre = String(row.sousSujet ?? row.sujet ?? "sans intitulé").slice(0, 78);
  const lignes = [
    `${p.icone ?? "?"} ${numeroTache(row.numero)} — ${titre}`,
    `   priorité ${pal.palier} · poids ${p.mesurable ? `${p.palier} (${p.points} pt)` : "non mesurable"} · origine ${o.origine}`,
    `   ${p.mesurable ? p.quoi : p.pourquoi}`,
  ];
  const d = decoupagePropose(row);
  if (p.palier === "lourde") {
    lignes.push(d.morceaux.length >= 2
      ? `   découpage proposé (${d.morceaux.length}) : ${d.morceaux.map((m) => m.slice(0, 48)).join(" | ")}`
      : `   ${d.pourquoi}`);
  }
  return { lignes, poids: p, palier: pal, origine: o, decoupage: d };
}

// ---------------------------------------------------------------------------------------------
// 5.3 — LE RÉSUMÉ EN TÊTE D'UNE TÂCHE LONGUE
//
// Le risque que l'utilisateur nomme — « sécurise contre les lignes malformées » — est réel et déjà
// rencontré : une ligne de suivi est une SEULE ligne de tableau markdown de plusieurs milliers de
// caractères, et un pipe mal placé ou une troncature en coupe la fin sans prévenir. Si la première
// phrase porte déjà l'essentiel, la ligne reste lisible amputée. Si l'essentiel est au milieu, il
// disparaît avec le reste.
// ---------------------------------------------------------------------------------------------

export const LONGUEUR_MAX_RESUME = 320;

export function resumeDeTete(detail = "") {
  const t = String(detail).trim();
  if (!t) return { aUnResume: false, resume: "", pourquoi: "description vide" };
  // Une phrase de tête = jusqu'au premier point suivi d'un blanc, en ignorant les points des
  // abréviations de chemin (`docs/x.md`) et des numéros de version.
  // Le quantifieur porte sur ce qui PRÉCÈDE le point, jamais sur la phrase entière (corrigé au
  // premier test, 2026-09-24) : avec `.{20,}?[.!?]`, une phrase de tête de vingt caractères
  // ponctuation comprise ne peut pas matcher, puisque les vingt caractères mangent déjà le point.
  // Le motif rejetait donc exactement les résumés les plus courts, ceux qu'il devait valider.
  const m = t.match(/^(.{10,}?[.!?])(?:\s|$)/s);
  if (!m) return { aUnResume: false, resume: "", pourquoi: "aucune phrase complète en tête : la ligne démarre au milieu de son sujet" };
  const phrase = m[1].trim();
  if (phrase.length < 20) {
    return { aUnResume: false, resume: phrase, longueur: phrase.length,
      pourquoi: `la phrase de tête ne fait que ${phrase.length} caractères : trop courte pour porter le sujet de la ligne` };
  }
  if (phrase.length > LONGUEUR_MAX_RESUME) {
    return { aUnResume: false, resume: phrase.slice(0, 80), longueur: phrase.length,
      pourquoi: `la phrase de tête fait ${phrase.length} caractères : trop longue pour survivre à une troncature, donc pas un résumé` };
  }
  return { aUnResume: true, resume: phrase, longueur: phrase.length, pourquoi: "phrase de tête courte et complète" };
}

export function findTachesLonguesSansResume(rows = [], { seuil = SEUIL_TACHE_LONGUE } = {}) {
  const ecarts = [];
  for (const r of rows) {
    const detail = String(r.detail ?? "");
    if (detail.length <= seuil) continue;
    const res = resumeDeTete(detail);
    if (!res.aUnResume) {
      ecarts.push({ numero: r.numero, longueur: detail.length, pourquoi: res.pourquoi,
        consequence: "tronquée, cette ligne ne dira plus de quoi elle parlait" });
    }
  }
  return ecarts;
}

// ---------------------------------------------------------------------------------------------
// 5.5 — LES TÂCHES QUE L'AGENT S'ATTRIBUE
//
// « Le signaler à la création ET à la fin. » Le besoin derrière la demande est un contrôle de
// dérive : une file qui se remplit toute seule de travail que personne n'a commandé est le premier
// symptôme d'un agent qui se donne raison. Encore faut-il pouvoir la MESURER.
//
// TROIS états, jamais deux, et c'est le point : l'absence de la mention « demande de l'utilisateur »
// ne PROUVE pas que je me suis attribué la tâche — elle prouve seulement que la ligne ne le dit pas.
// Rendre « indéterminé » plutôt que « agent » évite de transformer un silence en aveu, la même
// erreur que les six faux verts de la nuit prise dans l'autre sens.
// ---------------------------------------------------------------------------------------------

export const MARQUE_AUTO_ATTRIBUEE = "AUTO-ATTRIBUÉE";

export function origineDeLaTache(row = {}) {
  const t = `${row.sousSujet ?? ""} ${row.detail ?? ""}`;
  if (new RegExp(MARQUE_AUTO_ATTRIBUEE, "i").test(t)) {
    return { origine: "agent", declaree: true, pourquoi: "la ligne se déclare elle-même auto-attribuée" };
  }
  // L'APOSTROPHE COMPTE DOUBLE, littéralement : le registre écrit « l'utilisateur » avec
  // l'apostroppe droite, la prose de l'agent avec la courbe (’). Un motif qui n'en accepte qu'une
  // manque la moitié des lignes sans jamais le dire — attrapé par un test au premier passage.
  if (/demande (?:explicite )?(?:de l['’]utilisateur|du user)|l['’]utilisateur (?:demande|a demandé|insiste)|à sa demande|prompt de l['’]utilisateur/i.test(t)) {
    return { origine: "utilisateur", declaree: true, pourquoi: "la ligne cite une demande de l'utilisateur" };
  }
  if (/trouvé par|remonté par|signalé par|constat de|écart trouvé/i.test(t)) {
    return { origine: "outil", declaree: true, pourquoi: "la ligne attribue la tâche à une trouvaille d'outil" };
  }
  return { origine: "indéterminée", declaree: false,
    pourquoi: "la ligne ne dit pas d'où vient la tâche — un silence, jamais la preuve que je me la suis donnée" };
}

export function repartitionDesOrigines(rows = []) {
  const compte = { utilisateur: 0, agent: 0, outil: 0, "indéterminée": 0 };
  for (const r of rows) compte[origineDeLaTache(r).origine] += 1;
  const total = rows.length;
  const declarees = total - compte["indéterminée"];
  // LE FAUX VERT QUE CETTE FONCTION A FAILLI PRODUIRE, attrapé à son premier vrai passage
  // (2026-09-24) : elle a rendu « agent 0 — 0 % des déclarées » sur le registre réel, ce qui se lit
  // comme « l'agent ne s'attribue jamais rien », donc comme un bulletin de santé. C'est faux. La
  // marque AUTO-ATTRIBUÉE venait d'être inventée : AUCUNE ligne du registre ne pouvait la porter.
  // Un zéro produit par un motif qui ne peut pas encore matcher est rigoureusement indiscernable
  // d'un zéro mesuré (leçon L11), et c'est la sixième fois de la même nuit que ce défaut se
  // présente. D'où `mesurable`, qui distingue « aucune tâche auto-attribuée » de « personne n'a
  // encore jamais posé la marque ».
  const marqueJamaisPosee = compte.agent === 0;
  return { compte, total, declarees,
    mesurable: !marqueJamaisPosee,
    partAuto: marqueJamaisPosee || !declarees ? null : compte.agent / declarees,
    pourquoi: marqueJamaisPosee
      ? `aucune ligne ne porte la marque « ${MARQUE_AUTO_ATTRIBUEE} » : ce zéro dit que la marque n'est pas encore en usage, jamais que l'agent ne s'attribue rien — les deux s'écrivent 0 et ne veulent pas dire la même chose`
      : !declarees
        ? "aucune ligne ne déclare son origine : la part auto-attribuée n'est pas mesurable, elle n'est pas nulle"
        : "la part est calculée sur les lignes qui DÉCLARENT leur origine — la rapporter au total ferait passer les silences pour des tâches commandées" };
}

// Une auto-attribution ne compte que si elle est signalée AUX DEUX BOUTS, comme demandé : à la
// création (la marque) et à la fin (la marque encore présente sur une ligne close). Une ligne
// marquée qui se ferme en perdant sa marque est exactement ce que la demande cherchait à empêcher.
export function findAutoAttribueesMalSignalees(rows = []) {
  const ecarts = [];
  for (const r of rows) {
    const o = origineDeLaTache(r);
    const close = /termin|clos|résolu|resolu|fait/i.test(String(r.statut ?? ""));
    if (o.origine === "agent" && close && !new RegExp(`${MARQUE_AUTO_ATTRIBUEE}[^|]*(?:clôtur|fermé|terminé)`, "i").test(String(r.detail ?? ""))) {
      ecarts.push({ numero: r.numero, quoi: "auto-attribuée et close sans que la clôture le redise",
        pourquoi: "le signalement était demandé aux deux bouts : à la création ET à la fin" });
    }
  }
  return ecarts;
}


// ===========================================================================================
// LA CHAÎNE « MESURE → SUITE » (2026-09-24, tâche #698)
// ===========================================================================================
// L'Article 28 câble `rapport → analyse → plan d'action → tâches`. Il ne dit RIEN du maillon que
// l'utilisateur a trouvé le 2026-09-24, et qui est exactement du même bois : une TÂCHE qui mesure
// quelque chose, livre un constat chiffré, se clôt — et n'ouvre rien derrière elle. Sa formulation
// exacte : « tu as fait la mesure, ok. Mais du coup la tache est accomplie et on n'en reparle
// jamais ? il faut absolument qu'il y ait une autre tache liée ou un calibrage pour le fond de la
// question ».
//
// IL AVAIT RAISON AVANT MOI, et c'est mesuré : sur les dix tâches de mesure de la nuit du
// 2026-09-24, ZÉRO n'avait ouvert de suite — y compris celles qui rapportaient 20 outils sans
// couche lourde, 14 détecteurs muets et 11 outils hors de la norme d'uniformité. Le constat était
// écrit, chiffré, commité, et rien au monde ne devait jamais le relire.
//
// CE QUI REND CE DÉFAUT INVISIBLE est le fil rouge de tout ce projet : une tâche de mesure CLOSE
// ressemble trait pour trait à un problème réglé. Le registre affiche « Terminée », et c'est vrai
// — la mesure a bien été faite. Ce qui manque n'est pas DANS la ligne, il est dans son absence de
// descendance, et rien dans le registre ne montre une absence.
//
// POURQUOI DEUX MARQUES EXPLICITES plutôt qu'une devinette sur les « #nnn » déjà présents : une
// ligne qui cite une autre tâche peut aussi bien annoncer une suite que renvoyer à son origine, et
// aucun programme ne peut trancher entre les deux en lisant de la prose. Deviner produirait un
// verdict qui a l'air mesuré sans l'être (leçon L12). Les marques, elles, ne se confondent avec
// rien. Le prix à payer est déclaré franchement plus bas : tant qu'elles ne sont pas en usage,
// cette fonction refuse de conclure au lieu de rendre un zéro rassurant.

export const MARQUE_SUITE = "SUITE";              // « SUITE : #712 » — une vraie tâche est ouverte
export const MARQUE_SANS_SUITE = "SANS SUITE";    // « SANS SUITE : <raison écrite> » — décision assumée
export const LONGUEUR_MIN_RAISON = 40;

// Un « constat » au sens de ce contrôle n'est pas n'importe quel chiffre : c'est un chiffre qui
// compte quelque chose qui MANQUE. « 227 groupes de tests au vert » mesure le travail lui-même et
// n'appelle aucune suite ; « 20 outils sans couche lourde » en appelle une. La distinction se fait
// sur la proximité d'un nombre et d'un mot de manque, jamais sur la présence d'un nombre seul —
// sans quoi l'outil accuserait la moitié du registre et cesserait d'être lu (leçon L4).
// PREMIER PASSAGE RÉEL, ET IL A ÉCHOUÉ (2026-09-24) : la première version cherchait « un nombre
// près d'un mot de manque » et a accusé 478 des 577 lignes closes. C'est un détecteur inutilisable,
// et la cause est lisible : ce projet ÉCRIT en permanence « jamais X », « aucun Y », « sans Z » —
// c'est son style de rédaction, pas un constat d'écart. Un garde-fou qui accuse à tort cesse
// d'être lu (leçon L4), donc il vaut mieux qu'il en rate que d'en inventer.
//
// LA FORME RÉELLE d'un constat qui appelle une suite, relevée sur les vrais cas de la nuit du
// 2026-09-24 : un NOMBRE, un NOM DÉNOMBRABLE du paysage (outils, détecteurs, écarts, commits…),
// puis un mot de manque APRÈS, dans la même respiration. « 20 outils sans couche lourde »,
// « 14 détecteurs muets », « 18 des 20 derniers commits avaient sauté cette étape ». Le mot de
// manque avant le nombre ne compte pas : « jamais une liste de 5 pièces » n'est pas un écart.
const NOM_DENOMBRABLE = "outils?|détecteurs?|detecteurs?|scripts?|écarts?|ecarts?|règles?|regles?|fichiers?|tâches?|taches?|documents?|rapports?|fonctions?|chemins?|registres?|commits?|constats?|agents?|blueprints?|items?|prestations?|lignes?|articles?|signaux|sondes?";
const COMPTE_DE_CHOSES = new RegExp(`\\b(\\d{1,4})\\s+(?:(?:des?|sur|les)\\s+\\d{1,4}\\s+)?(?:\\S+\\s+){0,2}(?:${NOM_DENOMBRABLE})\\b`, "gi");
// Mots de manque resserrés : chacun dit qu'une chose ATTENDUE n'est pas là. « jamais » et « aucun »
// sont volontairement exclus seuls — trop fréquents en prose ici — et ne comptent que soudés à un
// verbe d'usage (« n'ont jamais servi », « jamais lancé »).
const MOT_DE_MANQUE = /muets?\b|manquants?\b|hors (?:de la )?norme|non (?:couverts?|testés?|testes?|déclarés?|declares?|branchés?|branches?|câblés?|cables?|lus?|exploités?|conclus?|traités?|mesurés?|suivis?|documentés?)|périmés?|perimes?|mortes?\b|morts?\b|vides?\b|inexistants?|divergents?|dorment|dormaient|oubliés?|sautés?|avaient sauté|ont sauté|(?:n['’](?:ont|est|a|avaient)|ne\s+\w+)\s+(?:jamais|aucun)|jamais (?:servi|lancés?|lancé|lus?|relus?|sollicités?|utilisés?|appelés?|exécutés?|tournés?|consultés?)|sans (?:couche|suite|porteur|mécanisme|garde-fou|test|fiche|blueprint|raison|rapport|plan|trace|retour|preuve)|à corriger|à combler|restent? ouverts?|ne concluent? (?:toujours )?pas|ne (?:sert|servent) (?:à )?rien/i;
const FENETRE_APRES = 90;

export function estUnConstat(row) {
  const d = String(row?.detail ?? "");
  for (const m of d.matchAll(COMPTE_DE_CHOSES)) {
    const apres = d.slice(m.index, m.index + m[0].length + FENETRE_APRES);
    if (MOT_DE_MANQUE.test(apres)) {
      return { constat: true, extrait: apres.trim(),
        pourquoi: "un compte de choses du paysage, suivi d'un mot de manque : c'est un écart chiffré, pas le récit d'un travail fait" };
    }
  }
  return { constat: false, extrait: "",
    pourquoi: "aucun écart chiffré repéré — la ligne peut décrire un vrai travail, elle ne rapporte simplement pas de manque compté" };
}

// Trois états, jamais deux — le même découpage que l'Article 28, pour la même raison : sans le
// troisième, « écarté » deviendrait la case fourre-tout qu'on coche pour faire taire le contrôle.
export function suiteDuConstat(row, { numerosConnus = null } = {}) {
  const d = String(row?.detail ?? "");
  const mSuite = d.match(new RegExp(`(?:^|[^A-Za-zÀ-ÿ])${MARQUE_SUITE}\\s*:\\s*#?(\\d{1,4})\\b`, "i"));
  if (mSuite) {
    const cible = Number(mSuite[1]);
    if (numerosConnus && !numerosConnus.has(cible)) {
      // LE CAS LE PLUS VICIEUX, et il est le même que celui de checkActionChain() : une référence
      // morte ressemble à un lien, donc elle rassure — c'est pire que l'absence de lien.
      return { etat: "reference-morte", cible,
        pourquoi: `la suite annoncée est #${cible}, et aucune tâche ne porte ce numéro : la chaîne a l'air fermée alors qu'elle ne mène nulle part` };
    }
    return { etat: "tache", cible, pourquoi: `suite ouverte : #${cible}` };
  }
  const mSans = d.match(new RegExp(`(?:^|[^A-Za-zÀ-ÿ])${MARQUE_SANS_SUITE}\\s*:\\s*([^|]{0,400})`, "i"));
  if (mSans) {
    const raison = (mSans[1] ?? "").trim();
    if (raison.length < LONGUEUR_MIN_RAISON) {
      return { etat: "raison-vide", cible: null,
        pourquoi: `« ${MARQUE_SANS_SUITE} » posé sans raison lisible (${raison.length} car.) : un écart sans raison écrite n'est pas une décision, c'est un abandon déguisé` };
    }
    return { etat: "raison", cible: null, pourquoi: "écarté avec sa raison écrite" };
  }
  return { etat: "aucune", cible: null,
    pourquoi: "la ligne ne porte ni suite ouverte ni raison de ne pas en ouvrir — le constat s'arrête là où il a été écrit" };
}

const CLOSE = /termin|clos|résolu|resolu|\bfait\b/i;

export function findConstatsSansSuite(rows = []) {
  const numerosConnus = new Set(rows.map((r) => r.numero).filter(Boolean));
  const closes = rows.filter((r) => CLOSE.test(String(r.statut ?? "")));
  const constats = closes.filter((r) => estUnConstat(r).constat);
  const parEtat = { tache: 0, raison: 0, aucune: 0, "reference-morte": 0, "raison-vide": 0 };
  const ecarts = [];
  for (const r of constats) {
    const s = suiteDuConstat(r, { numerosConnus });
    parEtat[s.etat] += 1;
    if (s.etat !== "tache" && s.etat !== "raison") {
      ecarts.push({ numero: r.numero, sujet: r.sousSujet, etat: s.etat, pourquoi: s.pourquoi,
        extrait: estUnConstat(r).extrait.slice(0, 180) });
    }
  }
  // LE FAUX VERT QUE CETTE FONCTION AURAIT PRODUIT SI ELLE AVAIT ÉTÉ ÉCRITE À L'ENVERS : le jour
  // de sa naissance, AUCUNE ligne du registre ne peut porter les deux marques, puisqu'elles
  // viennent d'être inventées. Un outil qui compterait « 0 suite ouverte » et s'arrêterait là
  // rendrait un chiffre vrai et un sens faux. La mesure qui a un sens dès aujourd'hui est donc
  // l'inverse : combien de constats clos n'ont AUCUNE suite — et celle-là est immédiatement juste.
  const marquesEnUsage = parEtat.tache + parEtat.raison + parEtat["reference-morte"] + parEtat["raison-vide"] > 0;
  return {
    mesurable: constats.length > 0,
    totalLignes: rows.length, closes: closes.length, constats: constats.length,
    parEtat, ecarts, marquesEnUsage,
    pourquoi: constats.length === 0
      ? "aucun constat chiffré repéré parmi les lignes closes : ce zéro dit que le motif n'a rien trouvé, il ne certifie pas que le registre est sain"
      : marquesEnUsage
        ? "les deux marques sont en usage : la part conclue et la part non conclue sont toutes les deux lisibles"
        : `aucune ligne ne porte encore « ${MARQUE_SUITE} » ni « ${MARQUE_SANS_SUITE} » — les marques viennent d'être créées, donc 100 % des constats comptent comme non conclus, ce qui est le vrai état du registre et non un artefact`,
  };
}

// LA VIGNETTE D'UNE LIGNE (2026-09-24, demande explicite de l'utilisateur en lisant le premier
// rapport de commande-en-masse : « en fin de rapport je veux quelque chose qui reste lisible, mais
// avec les vignettes qui vont bien. c'est la forme la plus minimaliste de presenter une tache. je
// ne demande pas une mini fiche ou une fiche complete par ligne »).
//
// TROIS FORMES, ET ELLES NE SE REMPLACENT PAS : la FICHE COMPLÈTE dit tout ce qu'on sait d'une
// tâche ; la MINI-FICHE tient en quelques lignes et s'affiche dès qu'on s'intéresse à une tâche ;
// la VIGNETTE tient en UNE ligne et sert quand on en montre vingt à la suite. Les confondre rend
// soit une liste illisible, soit une liste qui ne dit rien.
//
// CE QU'ELLE PORTE, et rien d'autre : le numéro (pour retrouver), l'intitulé coupé (pour
// reconnaître), la criticité (pour hiérarchiser d'un coup d'œil) et l'état (pour savoir si c'est
// encore ouvert). Quatre informations, parce qu'une cinquième ferait déborder la ligne et qu'une
// ligne qui déborde n'est plus une vignette.
export const LARGEUR_INTITULE_VIGNETTE = 68;
const PASTILLE_CRITICITE = { "PRIORITAIRE-OBLIGATOIRE": "🔴", "RECOMMANDE-CRITIQUE": "🔴", "RECOMMANDE-NECESSAIRE": "🟠", "RECOMMANDE-UTILE": "🔵" };
const PASTILLE_ETAT = { terminee: "✅", ouverte: "⬜", enCours: "🔄", autre: "▫️" };

// `avecNumero: false` quand le contexte affiche DÉJÀ le numéro (le plan d'action du gabarit le
// pose lui-même en fin de ligne) : le répéter ferait une ligne qui se redit, et une vignette qui
// se redit n'est plus minimale.
export function ligneDeTache(row, { largeur = LARGEUR_INTITULE_VIGNETTE, avecNumero = true } = {}) {
  if (!row) return null;
  const titre = String(row.sousSujet ?? "?").trim();
  const coupe = titre.length > largeur ? titre.slice(0, largeur - 1) + "…" : titre;
  const crit = String(row.criticite ?? "").trim();
  const num = avecNumero ? `${numeroTache(row.numero)} ` : "";
  return `${PASTILLE_ETAT[row.statusKey] ?? "▫️"} ${num}${PASTILLE_CRITICITE[crit] ?? "⚪"} ${coupe}`;
}

// Le REGISTRE, indexé par numéro — pour qu'un outil qui cite une tâche puisse la QUALIFIER au lieu
// d'afficher un numéro nu. C'est le défaut exact qu'a trouvé l'utilisateur dans le premier rapport
// de commande-en-masse : « pourquoi toutes les taches sont undefined ? je prefere que d'abord les
// taches soient qualifiées entierement, avant de creer le rapport final ».
export function indexDesTaches(rows = []) {
  const par = new Map();
  for (const r of rows) if (r.numero) par.set(r.numero, r);
  return par;
}

export function formatConstatsSansSuiteLines(rows = [], { limite = 25 } = {}) {
  const r = findConstatsSansSuite(rows);
  const L = [];
  if (!r.mesurable) { L.push(`⚠️ NON MESURABLE — ${r.pourquoi}`); return L; }
  const conclus = r.parEtat.tache + r.parEtat.raison;
  L.push(`Constats chiffrés parmi les ${r.closes} tâche(s) close(s) : ${r.constats}.`);
  L.push(`Conclus : ${conclus} (${r.parEtat.tache} avec une suite ouverte, ${r.parEtat.raison} écartés avec raison écrite).`);
  L.push(`NON CONCLUS : ${r.ecarts.length} — un constat mesuré, écrit, clos, et que rien ne rouvrira.`);
  if (r.parEtat["reference-morte"]) L.push(`  🔴 dont ${r.parEtat["reference-morte"]} référence(s) MORTE(S) : pire qu'une absence, ça ressemble à un lien.`);
  if (r.parEtat["raison-vide"]) L.push(`  🟠 dont ${r.parEtat["raison-vide"]} « ${MARQUE_SANS_SUITE} » sans raison lisible.`);
  if (!r.marquesEnUsage) L.push(`  ⚠️ ${r.pourquoi}`);
  for (const e of r.ecarts.slice(0, limite)) {
    L.push(`  · ${numeroTache(e.numero)} « ${String(e.sujet).slice(0, 70)} » — ${e.pourquoi}`);
    if (e.extrait) L.push(`      constat : « …${e.extrait}… »`);
  }
  if (r.ecarts.length > limite) L.push(`  · … et ${r.ecarts.length - limite} autre(s)`);
  return L;
}

export function formatChantier5Lines(rows = [], { ouvertes = null } = {}) {
  const L = [];
  const longues = rows.filter((r) => String(r.detail ?? "").length > SEUIL_TACHE_LONGUE);
  const lourdes = rows.filter((r) => poidsDeLaTache(r).palier === "lourde");
  const sansResume = findTachesLonguesSansResume(rows);
  const origines = repartitionDesOrigines(rows);
  const malSignalees = findAutoAttribueesMalSignalees(rows);
  // PRÉCISION QUI N'EST PAS COSMÉTIQUE : ces chiffres portent sur TOUT le registre, closes
  // comprises, alors que la décision « découper avant de lancer » ne concerne que les ouvertes.
  // Le premier passage réel affichait les deux périmètres à trois lignes d'écart sans le dire, et
  // 40 lourdes sur 609 se lisait comme 40 chantiers en attente — il y en avait zéro.
  const ouvertesLourdes = ouvertes ? ouvertes.filter((r) => poidsDeLaTache(r).palier === "lourde").length : null;
  L.push(`Poids : ${lourdes.length} tâche(s) LOURDE(S) sur ${rows.length} lignes du registre entier${ouvertesLourdes === null ? "" : `, dont ${ouvertesLourdes} encore OUVERTE(S)`} — une lourde se découpe avant d'être lancée, jamais traitée d'un bloc.`);
  L.push(`Lignes longues (> ${SEUIL_TACHE_LONGUE} car.) : ${longues.length}, dont ${sansResume.length} sans résumé de tête exploitable.`);
  for (const e of sansResume.slice(0, 8)) L.push(`  · ${numeroTache(e.numero)} (${e.longueur} car.) — ${e.pourquoi}`);
  if (sansResume.length > 8) L.push(`  · … et ${sansResume.length - 8} autre(s)`);
  L.push(`Origines déclarées : ${origines.declarees}/${origines.total} — utilisateur ${origines.compte.utilisateur}, outil ${origines.compte.outil}, agent ${origines.compte.agent}${origines.partAuto === null ? "" : ` (${Math.round(origines.partAuto * 100)} % des déclarées)`}. ${origines.compte["indéterminée"]} ligne(s) ne le disent pas, ce qui n'est pas la même chose que zéro.`);
  if (!origines.mesurable) L.push(`  ⚠️ ${origines.pourquoi}`);
  for (const e of malSignalees.slice(0, 5)) L.push(`  · ${numeroTache(e.numero)} — ${e.quoi} : ${e.pourquoi}`);
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
