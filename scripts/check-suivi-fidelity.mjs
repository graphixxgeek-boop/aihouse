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
import { motCleValide, findMotsClesEnCollision } from "./criticite.mjs";
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

// findClaimedFilesMissing() (2026-09-19, demande explicite de l'utilisateur : « fiabiliser [...] la
// validation des tâches terminées »). Une tâche "terminée" cite presque toujours, entre backticks,
// les fichiers réellement créés/modifiés — cette fonction vérifie qu'ils existent VRAIMENT sur
// disque, plutôt que de faire confiance à la seule déclaration textuelle. Portée volontairement
// étroite (chemins commençant par un des dossiers réels du projet) pour ne jamais confondre un
// extrait de code ou une commande (`--confirm`, `node script.mjs`) avec un vrai chemin de fichier.
const REPO_PATH_PATTERN = /`((?:docs|lib|app|scripts|components)\/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+)`/g;

export function findClaimedFilesMissing(sessionText, existsFn = existsSync, root = ROOT) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const hits = [];
  for (const row of rows) {
    const cells = splitTableRow(row);
    const statut = cells[cells.length - 1] ?? "";
    if (!/^termin[ée]e/i.test(statut)) continue;
    // Description = avant-dernière colonne, jamais un index fixe (2026-09-20, ajout de la colonne
    // N° en première position, cf. extractTaskNumbers ci-dessous) : Description précède toujours
    // immédiatement Statut, que la ligne porte ou non cette nouvelle colonne — même principe de
    // robustesse que cells[cells.length-1] déjà utilisé pour Statut partout dans ce fichier, jamais
    // un compte de colonnes supposé fixe qui casserait sur une ligne au format légèrement différent
    // (ancienne fixture de test à 6 colonnes, vraie donnée à 7 colonnes depuis ce jour).
    const description = cells[cells.length - 2] ?? "";
    const claimed = new Set([...description.matchAll(REPO_PATH_PATTERN)].map((m) => m[1]));
    for (const path of claimed) {
      if (!existsFn(join(root, path))) hits.push({ row: row.trim(), path });
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

// categorizeTasks()/categorizeAllSessions() (2026-09-19, demande explicite de l'utilisateur : « je
// veux un suivi en temps réel des tâches réalisées, en cours, à faire [...] je veux que le système
// puisse produire ces infos »). Jusqu'ici, findOpenTasks()/findUnverifiedClosures() répondent
// chacun à une question de garde-fou précise ("un trou existe-t-il ?") mais aucune fonction ne
// produit la vue d'ensemble à trois colonnes (terminé/en cours/à faire) que l'utilisateur demande
// littéralement à obtenir en sortie du système, pas seulement en cas d'anomalie.
export function categorizeTasks(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const buckets = { terminee: [], enCours: [], ouverte: [], autre: [] };
  for (const row of rows) {
    const cells = splitTableRow(row);
    const statut = cells[cells.length - 1] ?? "";
    const entry = { row: row.trim(), statut, cells };
    if (/^termin[ée]e/i.test(statut)) buckets.terminee.push(entry);
    else if (/^en cours/i.test(statut)) buckets.enCours.push(entry);
    else if (/^ouverte/i.test(statut)) buckets.ouverte.push(entry);
    else buckets.autre.push(entry);
  }
  return buckets;
}

export function categorizeAllSessions(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return { terminee: [], enCours: [], ouverte: [], autre: [] };
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const total = { terminee: [], enCours: [], ouverte: [], autre: [] };
  for (const file of files) {
    const cats = categorizeTasks(readFile(join(sessionsDir, file)));
    for (const key of Object.keys(total)) for (const entry of cats[key]) total[key].push({ ...entry, file });
  }
  return total;
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

// Description courte d'une entrée de tableau pour l'affichage — Sujet + Sous-sujet (colonnes 3 et
// 4 depuis l'ajout de la colonne N° en tête, 2026-09-20), jamais la ligne brute entière (illisible)
// ni seulement l'horodatage (pas assez parlant).
function describe(entry) {
  const [, , sujet, sousSujet] = entry.cells;
  return `${sujet ?? "?"} — ${sousSujet ?? "?"}`;
}

// Numérotation durable des tâches (2026-09-20, demande explicite de l'utilisateur : « peux tu
// garantir l'execution de ce numérotage dans le prolongement de celui actuel et jusqu'à nouvel
// ordre ? »). Contrairement au gestionnaire de tâches interne de Claude Code (TaskCreate/TaskUpdate,
// un aide-mémoire propre à la session, cf. docs/regles-de-travail.md §B.1), ce numéro vit dans les
// fichiers du projet (colonne N°, toujours en PREMIÈRE position — jamais en dernière, pour ne
// jamais perturber la lecture de Statut par cells[cells.length-1] utilisée partout ailleurs dans ce
// fichier) et est vérifié par un vrai test — il survit à la fin de n'importe quelle session. Les
// lignes antérieures à cette règle portent "—", jamais un numéro reconstruit après coup (Article 3 :
// ne jamais fabriquer une fausse précision historique) — la suite démarre à 117, dans le
// prolongement du compteur de tâches de la session en cours au moment de cette demande.
const TASK_NUMBER_SEED = 117;

export function extractTaskNumbers(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Horodatage"));
  const numbers = [];
  for (const row of rows) {
    const raw = (splitTableRow(row)[0] ?? "").trim();
    if (/^\d+$/.test(raw)) numbers.push(Number(raw));
  }
  return numbers;
}

export function nextTaskNumber(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return TASK_NUMBER_SEED;
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  let max = 0;
  for (const file of files) for (const n of extractTaskNumbers(readFile(join(sessionsDir, file)))) if (n > max) max = n;
  return max > 0 ? max + 1 : TASK_NUMBER_SEED;
}

// Détecte un doublon (même numéro utilisé deux fois, n'importe où) ou une régression (un numéro
// inférieur ou égal au précédent DANS UN MÊME fichier — les lignes s'ajoutent toujours dans l'ordre
// chronologique au sein d'un fichier de session) — jamais un jugement sur le contenu des tâches,
// seulement sur la cohérence de la numérotation elle-même.
export function findTaskNumberIssues(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const issues = [];
  const seenIn = new Map();
  for (const file of files) {
    let previous = -Infinity;
    for (const n of extractTaskNumbers(readFile(join(sessionsDir, file)))) {
      if (seenIn.has(n)) issues.push({ type: "duplicate", number: n, file, firstSeenIn: seenIn.get(n) });
      else seenIn.set(n, file);
      if (n <= previous) issues.push({ type: "not-increasing", number: n, file, previous });
      previous = n;
    }
  }
  return issues;
}

// countTasksSince() (2026-09-20, THE-DEEP-READER) : compte les tâches réelles enregistrées APRÈS une
// borne donnée (numéro de tâche, jamais une date/heure — demande explicite de l'utilisateur : « prends
// en compte le fuseau, erreur de moi à ce moment là » — un numéro de tâche est strictement croissant
// et global, aucune ambiguïté de fuseau horaire possible, contrairement à une date/heure qu'il
// faudrait faire correspondre entre le fuseau de l'utilisateur et l'UTC déjà utilisé dans
// docs/suivi/). Réutilise extractTaskNumbers() (jamais un second parseur) — sert de proxy honnête au
// volume de conversation à relire depuis cette borne, jamais un vrai compte de tokens.
export function countTasksSince(sinceTaskNumber, sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return 0;
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  let count = 0;
  for (const file of files) for (const n of extractTaskNumbers(readFile(join(sessionsDir, file)))) if (n > sinceTaskNumber) count++;
  return count;
}

// lastCoveredTaskNumber() (2026-09-20, THE-DEEP-READER) : lit le registre
// docs/suivi/relectures-lourdes/index.md (cf. docs/referentiel/the-deep-reader.md) et retourne le plus
// grand numéro de tâche déjà couvert par un passage précédent — la colonne "Dernière tâche couverte
// (N°)", toujours en dernière position de chaque ligne réelle. Sert de borne de départ PAR DÉFAUT pour
// le prochain passage (reprendre juste après, jamais tout relire depuis le début à chaque fois) —
// jamais une date/heure, même raison que countTasksSince() ci-dessus. Retourne undefined si aucun
// passage n'a encore été enregistré (première relecture, forcément depuis le début).
export function lastCoveredTaskNumber(indexText) {
  const rows = (indexText || "").split("\n").filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !l.includes("Dernière tâche couverte"));
  let max = 0;
  for (const row of rows) {
    const cells = splitTableRow(row);
    const n = Number((cells[cells.length - 1] ?? "").trim());
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max > 0 ? max : undefined;
}

// findMotsClesManquants() (2026-09-23, tâche #569) : une tâche OUVERTE doit porter un mot-clé
// valide et unique. Le garde-fou existe parce que la colonne, seule, ne suffit pas : un champ
// facultatif qu'aucun mécanisme ne réclame se remplit trois fois puis plus jamais, et le jour où
// « #490 » ne dit plus rien à personne, la colonne est là, vide, à prouver qu'on y avait pensé.
// C'est la leçon L7 prise au mot : une règle sans porteur n'existera plus à la session suivante
// (Article 27). Portée volontairement limitée aux tâches OUVERTES, pour la même raison que
// findMotsClesEnCollision() : une tâche close n'est plus citée, lui réclamer un mot-clé
// rétroactivement rendrait la règle impraticable, donc contournée.
//
// Ce module ne connaît pas les règles du mot-clé : elles vivent dans criticite.mjs, avec le
// format de tâche qu'elles servent. On les LIT (Article 24), on ne les recopie pas ici.
export function findMotsClesManquants(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  const buckets = categorizeAllSessions(sessionsDir, readDir, readFile, exists);
  const ouvertes = [...buckets.enCours, ...buckets.ouverte, ...buckets.autre];
  const hits = [];
  const taches = [];
  for (const entry of ouvertes) {
    const c = entry.cells;
    // Même lecture ancrée qu'ailleurs : Mot-clé en 3e position du format à 8 colonnes, absent
    // d'une ligne restée à l'ancien format — jamais un décalage silencieux des colonnes suivantes.
    const motCle = c.length >= 8 ? (c[2] ?? "").trim() : "";
    const n = (c[0] ?? "").trim();
    taches.push({ n, motCle, statut: c[c.length - 1] ?? "" });
    const verdict = motCleValide(motCle);
    if (!verdict.ok) hits.push({ n, motCle, pourquoi: verdict.pourquoi, file: entry.file });
  }
  for (const collision of findMotsClesEnCollision(taches)) {
    // La raison vient de criticite.mjs telle quelle : la reformuler ici ferait vivre deux
    // explications du même refus, dont une seule serait tenue à jour (Article 24).
    hits.push({ n: collision.numeros.join(", "), motCle: collision.mot, pourquoi: collision.pourquoi });
  }
  return hits;
}

function main() {
  console.log("=== État des tâches, en temps réel (docs/suivi/) ===\n");
  const all = categorizeAllSessions();
  console.log(`✅ Terminées : ${all.terminee.length}`);
  console.log(`🔧 En cours : ${all.enCours.length}`);
  for (const e of all.enCours) console.log(`   - ${describe(e)}`);
  console.log(`📋 Ouvertes / à faire : ${all.ouverte.length}`);
  for (const e of all.ouverte) console.log(`   - ${describe(e)}`);
  if (all.autre.length) {
    console.log(`⚠️ Statut non reconnu (ni terminée/en cours/ouverte) : ${all.autre.length}`);
    for (const e of all.autre) console.log(`   - [${e.statut}] ${describe(e)}`);
  }

  console.log("\n=== Détail des tâches encore ouvertes (docs/suivi/) ===\n");
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

  console.log("\n=== Garde-fou validation des tâches terminées (fichiers cités réellement présents) ===\n");
  const allSessions = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".md"));
  let anyMissingFile = false;
  for (const file of allSessions) {
    const missingFiles = findClaimedFilesMissing(readFileSync(join(SESSIONS_DIR, file), "utf8"));
    if (missingFiles.length) {
      anyMissingFile = true;
      console.log(`${file} : ${missingFiles.length} fichier(s) cité(s) comme fait mais introuvable(s) sur disque`);
      for (const h of missingFiles) console.log(`   - ${h.path}`);
    }
  }
  if (!anyMissingFile) console.log("Aucun fichier cité dans une tâche terminée ne manque sur disque.");

  console.log("\n=== Garde-fou mot-clé unique par tâche ouverte (docs/suivi/) ===\n");
  const motsCles = findMotsClesManquants();
  if (!motsCles.length) {
    console.log("Chaque tâche ouverte porte un mot-clé valide, et aucun n'est porté par deux tâches à la fois.");
  } else {
    console.log(`${motsCles.length} tâche(s) ouverte(s) sans mot-clé exploitable :`);
    for (const h of motsCles) console.log(`   - n°${h.n} : ${h.pourquoi}`);
  }

  console.log("\n=== Garde-fou numérotation durable des tâches (docs/suivi/) ===\n");
  const numberIssues = findTaskNumberIssues();
  if (!numberIssues.length) {
    console.log(`Numérotation cohérente sur tout le registre. Prochain numéro à utiliser : ${nextTaskNumber()}.`);
  } else {
    for (const i of numberIssues) console.log(`   - [${i.type}] n°${i.number} dans ${i.file}`);
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
