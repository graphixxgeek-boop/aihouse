// Garde-fou du système de suivi (2026-09-19, cf. docs/systeme-de-suivi.md). Une tâche fermée doit
// toujours préciser "terminée — fidèle" ou "terminée — écart : ..." — jamais un "terminée" nu qui
// laisserait la question "réalisée exactement selon le prompt ?" sans réponse. Ce script relit
// chaque fichier de session et signale les clôtures qui ont sauté cette étape. Gratuit, zéro appel
// réseau, intégré à la veille hebdomadaire du réseau d'outils plutôt qu'un rappel séparé de plus.
//
// findOpenTasks() (ajouté le 2026-09-19, à la demande explicite de l'utilisateur — « top, avant de
// lancer la simulation, tu vois une tâche à terminer ? [...] utilise le système de suivi pour
// vérifier si des tâches sont encore ouvertes. cet outil doit t'aider à le déterminer facilement »)
// répond au réel problème constaté ce jour-là : relire un fichier de session à la main pour savoir
// ce qui reste ouvert est lent et peu fiable (une session a été trouvée avec deux tâches encore
// marquées "en cours" alors qu'elles étaient terminées depuis des heures) — cette fonction liste
// en un coup d'œil, pour toutes les sessions, chaque ligne dont le statut n'est pas "terminée".

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { sh } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SESSIONS_DIR = join(ROOT, "docs/suivi/sessions");

// Découpe une ligne de tableau markdown sur "|", en respectant un "\|" échappé comme un caractère
// littéral plutôt qu'un séparateur de colonne (2026-09-19, même relecture de fiabilité — aucune
// ligne réelle n'a encore ce cas, mais une description citant une commande shell avec un tube, ou
// un exemple de tableau, romprait silencieusement le découpage sans cette précaution).
//
// Ne retire QUE les deux artefacts vides créés par les "|" d'ouverture/fermeture d'une ligne bien
// formée ("| a | b |" donne ["", "a", "b", ""]) — jamais un filtre général sur toute chaîne vide,
// qui avalerait aussi une vraie colonne Statut vide au milieu ou à la fin (bug trouvé en écrivant
// le test dédié : un tel filtre rendait la détection de statut vide ci-dessous totalement inerte,
// exactement le trou qu'elle est censée fermer).
export function splitTableRow(row) {
  const cells = row.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
  if (cells.length && cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

// Une ligne du tableau "| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |"
// est une clôture non vérifiée si son dernier champ (Statut) commence par "terminée" sans jamais
// contenir "fidèle" ni "écart". Une tâche encore "ouverte"/"en cours" n'est jamais concernée — le
// garde-fou ne porte que sur ce qui est déclaré fini.
export function findUnverifiedClosures(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const hits = [];
  for (const row of rows) {
    const cells = splitTableRow(row);
    const statut = cells[cells.length - 1] ?? "";
    if (/^termin[ée]e/i.test(statut) && !/fid[èe]le/i.test(statut) && !/[ée]cart/i.test(statut)) {
      hits.push({ row: row.trim(), statut });
    }
  }
  return hits;
}

// Une ligne est "ouverte" si son Statut ne commence PAS par "terminée" (couvre "ouverte", "en
// cours", ou toute autre valeur future) — jamais un motif positif qui devrait deviner tous les
// libellés possibles d'un statut non fermé.
export function findOpenTasks(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const hits = [];
  for (const row of rows) {
    const cells = splitTableRow(row);
    const statut = cells[cells.length - 1] ?? "";
    // Un statut VIDE est une ligne mal formée (tableau markdown cassé) — un trou à signaler, jamais
    // un silence qui la laisserait invisible au garde-fou (trouvé le 2026-09-19 en relisant le
    // script à la demande explicite de l'utilisateur : « assure-toi encore de la fiabilité »).
    if (!statut || !/^termin[ée]e/i.test(statut)) hits.push({ row: row.trim(), statut, cells });
  }
  return hits;
}

export function auditOpenTasks(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const results = [];
  for (const file of files) {
    const hits = findOpenTasks(readFile(join(sessionsDir, file)));
    if (hits.length) results.push({ file, hits });
  }
  return results;
}

// findCommitsMissingSuiviUpdate() (2026-09-19, à la demande explicite de l'utilisateur : « comment
// nous assurer que le suivi est correctement fait et historisé ? peux-tu fiabiliser ? »). Trouvaille
// réelle qui a motivé cette fonction : 7 des 8 derniers commits d'une même session avaient changé du
// code ou de la charte réelle sans jamais toucher docs/suivi/, laissant une fiche de session périmée
// de plus de 3h30 avant d'être découverte par hasard. Un commit "substantiel" (touche du vrai code
// ou la charte/les règles de méthode) qui ne touche JAMAIS docs/suivi/ dans le même commit est
// exactement cette dérive — jamais un jugement sur le contenu, seulement sur la co-occurrence des
// fichiers changés.
// Élargi le 2026-09-19 (même relecture de fiabilité) : `docs/referentiel/*.md` et les blueprints
// racine (`docs/*-blueprint.md`) manquaient — un gros chantier qui ne toucherait QUE
// `principes.md`/`parametres.md`/un blueprint, sans jamais toucher CLAUDE.md ni de code, ne
// déclenchait jamais l'alerte alors qu'il s'agit exactement du genre de travail que le suivi doit
// capturer. Les registres de sorties routinières (docs/simulations/, docs/el-professor/,
// docs/the-screener/, docs/argus/, docs/harmonia/, docs/axa-check/, docs/kpi-rapports/, etc.)
// restent volontairement hors de ce périmètre : leur création initiale passe déjà par un blueprint
// (donc déjà détectée), mais chaque fichier de sortie individuel qu'ils produisent ensuite est un
// résultat routinier, pas un nouveau chantier à journaliser à chaque fois.
const SUBSTANTIVE_PATTERN = /\.(mjs|ts|tsx)$/;
const SUBSTANTIVE_EXTRA = new Set(["CLAUDE.md", "docs/regles-de-travail.md"]);
const SUBSTANTIVE_DOC_PATTERN = /^docs\/(referentiel\/[^/]+\.md|[^/]+-blueprint\.md)$/;

export function findCommitsMissingSuiviUpdate(commits) {
  const isSubstantive = (f) => SUBSTANTIVE_PATTERN.test(f) || SUBSTANTIVE_EXTRA.has(f) || SUBSTANTIVE_DOC_PATTERN.test(f);
  const touchesSuivi = (f) => f.startsWith("docs/suivi/");
  return commits.filter((c) => c.filesChanged.some(isSubstantive) && !c.filesChanged.some(touchesSuivi));
}

// Lit les N derniers commits réels du dépôt — jamais tout l'historique (le système de suivi est né
// le 2026-09-19, une fenêtre glissante récente évite de signaler à tort des commits antérieurs à son
// existence, sans jamais avoir besoin de connaître sa date de création exacte).
export function recentCommits(limit = 20, shImpl = sh, root = ROOT) {
  const hashes = shImpl(`git log -${limit} --format=%H`, { cwd: root }).trim().split("\n").filter(Boolean);
  return hashes.map((hash) => ({
    hash,
    subject: shImpl(`git log -1 --format=%s ${hash}`, { cwd: root }).trim(),
    filesChanged: shImpl(`git diff-tree --no-commit-id --name-only -r ${hash}`, { cwd: root }).trim().split("\n").filter(Boolean),
  }));
}

export function auditAllSessions(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const results = [];
  for (const file of files) {
    const text = readFile(join(sessionsDir, file));
    const hits = findUnverifiedClosures(text);
    if (hits.length) results.push({ file, hits });
  }
  return results;
}

function main() {
  console.log("=== Tâches encore ouvertes (docs/suivi/) ===\n");
  const open = auditOpenTasks();
  if (!open.length) {
    console.log("Aucune tâche ouverte/en cours trouvée dans les fichiers de session.");
  } else {
    for (const { file, hits } of open) {
      console.log(`${file} : ${hits.length} tâche(s) non fermée(s)`);
      for (const h of hits) console.log(`   - [${h.statut}] ${h.row}`);
    }
  }

  console.log("\n=== Garde-fou fidélité au prompt (docs/suivi/) ===\n");
  const results = auditAllSessions();
  if (!results.length) {
    console.log("Aucune clôture non vérifiée trouvée — chaque tâche fermée précise bien fidèle/écart.");
  } else {
    for (const { file, hits } of results) {
      console.log(`${file} : ${hits.length} clôture(s) sans vérification de fidélité`);
      for (const h of hits) console.log(`   - ${h.row}`);
    }
  }

  console.log("\n=== Garde-fou fraîcheur du suivi (commits récents sans mise à jour docs/suivi/) ===\n");
  const missing = findCommitsMissingSuiviUpdate(recentCommits());
  if (!missing.length) {
    console.log("Aucun commit récent substantiel n'a sauté la mise à jour du suivi — discipline respectée.");
  } else {
    for (const c of missing) console.log(`   - ${c.hash.slice(0, 8)} : ${c.subject}`);
    console.log(`\n→ ${missing.length} commit(s) récent(s) ont changé du code/de la charte réelle sans jamais toucher docs/suivi/ — signe de la dérive réelle trouvée le 2026-09-19 (règle ajoutée à docs/regles-de-travail.md §4 : le suivi se met à jour DANS LE MÊME commit).`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
