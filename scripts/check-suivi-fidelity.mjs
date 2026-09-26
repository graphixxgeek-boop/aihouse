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
import { motCleValide, findMotsClesEnCollision, FORMAT_TACHE, CASE_COCHEE, PREMIERE_TACHE_AVEC_RITUEL, QUESTIONS_DE_CLOTURE } from "./criticite.mjs";
import { sh, printReliabilityNotice } from "./lib-shell.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

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
    .filter(estUneLigneDeTache);
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

// findCloturesSansRituel() (2026-09-26, tâche #905 — SA DÉCISION, prise en fenêtre dédiée : « le
// garde-fou refuse une clôture dont la colonne APRÈS est vide — exactement comme il refuse déjà une
// clôture sans déclaration de fidélité. La case à cocher devient une condition, pas une intention. »)
//
// CE QUI EXISTAIT DÉJÀ, ET CE QUI MANQUAIT — la distinction est tout le sujet. Les deux colonnes du
// rituel existent depuis le 2026-09-25 (#872) et `findRituelManquant()` les MESURE très bien : il
// dit quel pourcentage des lignes porte ses deux cases. Mais mesurer n'est pas refuser. Un taux de
// 60 % s'affiche, se lit, et ne bloque rien ; la case restait donc une intention, exactement le mot
// qu'il a employé. Ce qui manquait n'était pas la mesure, c'était la CONDITION.
//
// POURQUOI SEULEMENT LA COLONNE APRÈS, et c'est sa décision, pas une facilité : la colonne AVANT se
// remplit quand on OUVRE la tâche, et on ne peut pas refuser l'ouverture de quelque chose qui n'est
// pas encore là. La colonne APRÈS se remplit quand on CLÔT — et là, il y a un geste à refuser.
// `findRituelManquant()` continue de mesurer les deux ; celui-ci n'en refuse qu'une.
//
// LA POSITION DE LA COLONNE EST DÉRIVÉE, JAMAIS ÉCRITE EN DUR (Article 24) : FORMAT_TACHE déclare
// l'ordre, et les fichiers réels placent `detail` juste avant `statut` plutôt qu'à sa place
// déclarée — divergence déjà documentée et déjà traitée comme une dette ailleurs. On lit donc la
// colonne depuis la FIN, où l'ordre réel est stable : ... | ouverture | clôture | détail | statut |.
export const RANG_CLOTURE_DEPUIS_LA_FIN = 3;

export function findCloturesSansRituel(sessionText, { depuis = PREMIERE_TACHE_AVEC_RITUEL } = {}) {
  const hits = [];
  for (const row of String(sessionText).split("\n").filter(estUneLigneDeTache)) {
    const cells = splitTableRow(row);
    const numero = Number(cells[0]);
    // UNE LIGNE D'AVANT LE SEUIL N'EST PAS FAUTIVE : la colonne n'existait pas quand elle a été
    // écrite. Accuser 870 lignes d'un coup est la leçon L4, payée deux fois dans ce fichier.
    if (!Number.isFinite(numero) || numero < depuis) continue;
    const statut = cells[cells.length - 1] ?? "";
    if (!/^termin[ée]/i.test(statut)) continue;
    // Une ligne portant des « | » en trop n'est pas une case vide : c'est une ligne mal formée, et
    // le geste qui la répare n'est pas le même. On ne la compte pas ici — un autre garde-fou la voit.
    if (cells.length > FORMAT_TACHE.length) continue;
    const cloture = cells[cells.length - RANG_CLOTURE_DEPUIS_LA_FIN] ?? "";
    if (String(cloture).trim().toUpperCase() !== CASE_COCHEE) {
      hits.push({ numero, cloture: String(cloture).trim(), row: row.trim() });
    }
  }
  return hits;
}

export function auditCloturesSansRituel(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const out = [];
  for (const file of readDir(sessionsDir).filter((f) => f.endsWith(".md"))) {
    const hits = findCloturesSansRituel(readFile(join(sessionsDir, file), "utf8"));
    if (hits.length) out.push({ file, hits });
  }
  return out;
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
    .filter(estUneLigneDeTache);
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
    .filter(estUneLigneDeTache);
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
// LE FILTRE D'EN-TÊTE, DÉFINI UNE SEULE FOIS (2026-09-24, deuxième correction du même défaut
// dans la même soirée — et c'est la deuxième qui compte).
//
// L'ANCIENNE VERSION écartait toute ligne CONTENANT le mot « Horodatage », pour sauter la ligne de
// titre du tableau. Conséquence : n'importe quelle tâche dont le texte emploie ce mot disparaissait
// de TOUTES les lectures du suivi, en silence. C'est arrivé pour de vrai deux fois le 2026-09-24 :
// une ligne citant findHorodatagesFuturs() rendait la numérotation fausse, et la tâche #721,
// intitulée « Horodatages futurs », n'existait pour aucun outil alors qu'elle était bien écrite.
//
// LA PREMIÈRE CORRECTION N'A PORTÉ QUE SUR UN APPELANT, et c'est la vraie leçon de la soirée :
// j'ai corrigé extractTaskNumbers() et laissé les trois autres lecteurs avec le même défaut. Un
// motif partagé se corrige à l'endroit où il est DÉFINI, jamais chez celui qui s'en plaint
// (Article 3). D'où cette fonction, unique, que les quatre lecteurs appellent désormais.
//
// LE MOTIF ANCRÉ ne peut pas se tromper : une ligne d'en-tête COMMENCE par « | N° | » ou
// « | Numéro | ». Une ligne de tâche commence par « | 721 | ». Aucune prose ne peut imiter ça.
export function estUneLigneDeTache(l) {
  if (!l.startsWith("|")) return false;
  if (/^\|\s*-+\s*\|/.test(l)) return false;           // la ligne de séparation du tableau
  // Deux formats d'en-tête coexistent dans docs/suivi/ : l'ancien commence par « | Horodatage |,
  // le nouveau par « | N° |. Les deux se reconnaissent à leur PREMIÈRE CELLULE, et une ligne de
  // tâche a toujours un NOMBRE en première cellule — aucune prose ne peut imiter ça, là où le
  // motif précédent se laissait tromper par n'importe quel texte citant le mot.
  if (/^\|\s*(?:N°|Numéro|Numero|Horodatage)\s*\|/.test(l)) return false;
  return true;
}

export function categorizeTasks(sessionText) {
  const rows = sessionText
    .split("\n")
    .filter(estUneLigneDeTache);
  const buckets = { terminee: [], enCours: [], ouverte: [], ecartee: [], autre: [] };
  for (const row of rows) {
    const cells = splitTableRow(row);
    const statut = cells[cells.length - 1] ?? "";
    const entry = { row: row.trim(), statut, cells, statutNormalise: normaliserStatut(statut) };
    const s = entry.statutNormalise;
    if (/^termin[ée]/.test(s) || /^fait\b/.test(s)) buckets.terminee.push(entry);
    else if (/^en cours/.test(s)) buckets.enCours.push(entry);
    // « en attente de décision » est une tâche OUVERTE qui attend l'utilisateur, jamais une
    // décision déjà prise : la ranger ailleurs la ferait disparaître de ce qu'il reste à trancher.
    // TROIS FORMES DE PLUS, TROUVÉES LE 2026-09-26 en faisant le ménage de la file à sa demande.
    // Elles tombaient dans « autre », c'est-à-dire nulle part : quatre tâches réelles comptées
    // ouvertes faute de mieux, sans que personne sache ce qu'elles attendaient vraiment.
    //   · « A-TRANCHER » (#853, #861) — elle attend SA décision : c'est la définition même d'une
    //     tâche ouverte, et c'est déjà ce que « en attente de décision » veut dire juste au-dessus ;
    //   · « Ouverte → Avancée » (#813) — le normaliseur lit la DROITE d'une flèche, qui est le
    //     dernier état atteint, et rendait donc « avancee » : un mot qu'aucun seau ne connaissait.
    //     Avancée n'est pas close. Une tâche qui progresse reste une tâche à finir, et la ranger
    //     ailleurs la ferait disparaître du reste à faire au moment précis où elle avance.
    else if (/^ouverte/.test(s) || /^a faire/.test(s) || /^a traiter/.test(s) || /^en attente/.test(s) || /^a.?trancher/.test(s) || /^avanc/.test(s)) buckets.ouverte.push(entry);
    // ÉCARTÉE/REPORTÉE EST UNE DÉCISION DE L'UTILISATEUR, jamais un reste à faire : la ranger
    // avec les tâches ouvertes la lui re-proposerait à chaque passage, exactement ce qu'il a
    // demandé qu'on ne fasse jamais (« ne jamais écarter une zone sciemment laissée de côté par
    // moi » — pris par l'autre bout : ne jamais rouvrir ce qu'il a fermé, cf. leçon L22).
    //   · « Sortie de la file » (#734) — c'est SA décision explicite du 2026-09-26 (« je sors #734
    //     SQUID GAME de la file, refonte graphique »). La compter ouverte la lui reproposerait à
    //     chaque passage, exactement ce que la leçon L22 interdit.
    else if (/^ecart/.test(s) || /^report/.test(s) || /^abandon/.test(s) || /^sortie de la file/.test(s)) buckets.ecartee.push(entry);
    else buckets.autre.push(entry);
  }
  return buckets;
}

// LE STATUT SE NORMALISE AVANT D'ÊTRE RECONNU (2026-09-23, tâche #625).
//
// POURQUOI, ET LE CHIFFRE EST LE VRAI SUJET : le classement d'origine n'acceptait que trois
// formes littérales (« terminée », « en cours », « ouverte ») en tête de cellule. Le suivi réel en
// emploie sept, entre les crochets (« [à faire] », « [terminé le 2026-09-23] ») et la majuscule
// sans -e final (« TERMINÉ »). Résultat mesuré le jour de ce correctif : **53 tâches sur 508
// tombaient dans « statut non reconnu »**, dont une vingtaine marquées « à faire » — et la vue
// temps réel annonçait « 2 tâches ouvertes ». Le tableau qui sert à savoir ce qu'il reste à faire
// en cachait donc l'essentiel, sans jamais mentir explicitement : il rangeait à part, et personne
// ne lisait la catégorie fourre-tout.
//
// Ce n'est pas une liste de formes tolérées qui grandira indéfiniment (Article 24) : on retire la
// décoration (crochets, gras, horodatage de clôture) puis on compare sur un texte sans accent ni
// casse — un PRINCIPE, pas une énumération.
// UNE FLÈCHE DIT L'ÉTAT FINAL, PAS L'ÉTAT DE DÉPART (2026-09-25, tâche #844).
//
// LE DÉFAUT, ET SON EFFET EST MESURÉ. Le classement s'ancre sur le DÉBUT du statut (`^ouverte`,
// `^termin[ée]`…). Or huit lignes réelles portent une TRANSITION — « Ouverte → Terminée (clôturée
// par #785) », « En attente de sa décision → Terminée (clôturée par #780) ». Elles commencent par
// « ouverte » ou « en attente », donc elles étaient rangées parmi les tâches OUVERTES alors que
// leur état final est « terminée ».
//
// CE QUE ÇA FAUSSAIT, et ce n'est pas cosmétique : la taille de la file (128 au lieu de 120), la
// liste des « plus anciennes encore ouvertes » — où elles remontaient en tête — et toute mesure
// d'émiettement ou de retard construite dessus. **Un retard qui n'existait pas.**
//
// Trouvé en instruisant #209 (« les 5 tâches en stagnation »), c'est-à-dire en cherchant tout
// autre chose : la liste des plus anciennes ne ressemblait pas à ce que le suivi racontait.
export function normaliserStatut(statut = "") {
  return String(statut)
    // La flèche d'abord : « A → B » se lit B. Faite avant tout le reste, sinon les nettoyages
    // ci-dessous s'appliqueraient à la partie gauche, celle qui n'est plus vraie.
    .replace(/^.*?(?:→|->|=>)\s*/, "")
    .replace(/^[\s*_`]+/, "")
    .replace(/^\[\s*/, "")
    .replace(/\s*\]\s*$/, "")
    .replace(/\s+le\s+\d{4}-\d{2}-\d{2}.*$/i, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function categorizeAllSessions(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return { terminee: [], enCours: [], ouverte: [], ecartee: [], autre: [] };
  const files = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  const total = { terminee: [], enCours: [], ouverte: [], ecartee: [], autre: [] };
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

// LE DÉNOMINATEUR, MESURÉ POUR DE VRAI (2026-09-23, tâche #206) — et cette fonction existe parce
// que le premier jet de la correction a reproduit le défaut qu'il corrigeait. Il réutilisait
// `auditAllSessions()` pour compter « les fichiers lus », alors que celle-ci ne rend QUE les
// sessions PORTANT un écart : elle affichait donc « 3 fichiers lus » là où il fallait lire « 3
// fichiers en défaut », et aurait affiché « aucun fichier lu » sur un registre parfait. Compter ce
// qu'on a lu et compter ce qui cloche sont deux mesures différentes, et les confondre est
// exactement la confusion que cette tâche traque.
export function sessionsLues(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return { fichiers: [], lignes: 0, dossierAbsent: true };
  const fichiers = readDir(sessionsDir).filter((f) => f.endsWith(".md"));
  let lignes = 0;
  for (const f of fichiers) {
    try { lignes += readFile(join(sessionsDir, f)).split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l)).length; } catch { /* un fichier illisible ne se compte pas comme lu */ }
  }
  return { fichiers, lignes, dossierAbsent: false };
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
  // L'EN-TÊTE SE RECONNAÎT À SA PREMIÈRE CELLULE, jamais à un mot présent quelque part dans la
  // ligne (corrigé le 2026-09-24, après un vrai dégât). Le filtre précédent écartait toute ligne
  // CONTENANT « Horodatage » — or une description de tâche qui cite `findHorodatagesFuturs()`
  // contient ce mot. La ligne entière devenait invisible à la numérotation, et le jour où deux
  // tâches ont porté le même numéro, l'une des deux n'était pas lue : le garde-fou a répondu
  // « numérotation cohérente » sur un registre qui portait un doublon. Le détecteur de doublons
  // fonctionnait parfaitement ; c'est son entrée qui était amputée — exactement le motif qui NE
  // PEUT PAS matcher, vu depuis l'autre bout (leçon L11).
  const rows = sessionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-+\s*\|/.test(l) && !/^\|\s*(?:N°|Numéro)\s*\|/.test(l));
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
// findHorodatagesFuturs() (2026-09-23, Ronde GOAT MAX) — UNE LIGNE DATÉE DEMAIN N'EST PAS UNE TRACE.
//
// CE QUE LA RONDE A TROUVÉ, et le chiffre dit tout : check-tasks-details signalait UNE tâche à date
// future. Un balayage de TOUTES les lignes en a rendu 44 sur 526 — dont les deux écrites dix
// minutes plus tôt. L'écart n'était pas un oubli du garde-fou existant : il ne regarde que les
// tâches encore OUVERTES, et 43 des 44 étaient déjà « terminée », donc structurellement invisibles.
// Un contrôle qui ne voit qu'une tranche rend un chiffre juste sur cette tranche et faux sur le tout.
//
// POURQUOI C'EST UN VRAI DÉFAUT et pas une coquetterie d'horodatage : tout le paysage calcule des
// FRAÎCHEURS à partir de ces dates (« tâche ouverte depuis 3 jours », « dernier passage il y a
// 4 jours », la stagnation de CLEAN-DIRTY-OLD, la périodicité des items coûteux de la Ronde). Une
// date future rend un âge NÉGATIF, qu'aucun de ces calculs n'attend — et un âge négatif se lit
// comme « tout frais », c'est-à-dire exactement l'inverse d'une alerte.
//
// LA CAUSE RACINE, écrite ici parce qu'aucune mécanique ne peut l'empêcher (Article 27) : ces dates
// sont TAPÉES par l'agent, jamais lues sur une horloge. Un agent qui extrapole une heure de session
// plausible au lieu de lire l'heure réelle fabrique une valeur qui ressemble à une mesure — le
// défaut que ce projet chasse partout ailleurs, appliqué à sa propre trace.
export function findHorodatagesFuturs(sessionsDir = SESSIONS_DIR, now = new Date(), readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const limite = now instanceof Date ? now : new Date(now);
  const futurs = [];
  for (const file of readDir(sessionsDir).filter((f) => f.endsWith(".md"))) {
    for (const ligne of readFile(join(sessionsDir, file)).split("\n")) {
      const m = /^\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})Z?\s*\|/.exec(ligne);
      if (!m) continue;
      const quand = new Date(`${m[2]}:00Z`);
      if (!Number.isFinite(quand.getTime()) || quand <= limite) continue;
      const avanceMin = Math.round((quand - limite) / 60000);
      futurs.push({ numero: Number(m[1]), horodatage: m[2] + "Z", file, avanceMinutes: avanceMin,
        pourquoi: `datée ${avanceMin} minute(s) dans le futur — toute fraîcheur calculée dessus rend un âge négatif, qui se lit comme « tout frais » au lieu de déclencher une alerte` });
    }
  }
  return futurs.sort((a, b) => a.numero - b.numero);
}

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

// findCheminsMortsDansReferentiel() (2026-09-23, tâche #556) — LA PARTIE MÉCANIQUE DE LA
// RELECTURE PÉRIODIQUE DE L'ARTICLE 13.
//
// Ce que l'Article 13 demande vraiment : que les documents de référence disent la vérité sur le
// code. La partie qui exige un jugement (une règle décrite est-elle encore celle qui s'applique ?)
// ne s'automatise pas. Celle-ci, si : un document qui cite un fichier disparu ment sur le dépôt,
// et c'est vérifiable sans lire une ligne de prose.
//
// TROIS CAS RÉELS TROUVÉS AU PREMIER PASSAGE, sur 657 chemins cités : le journal de TOOL-LEARNING
// annoncé sous un chemin qui n'a jamais existé, la fiche `memento.md` encore citée un jour après
// son renommage en `memory-audit.md`, et — celui-là dans la charte elle-même — un document de
// contexte présenté comme disponible alors qu'il n'a JAMAIS été committé une seule fois.
//
// LES DEUX EXCLUSIONS, et elles sont la différence entre un garde-fou lu et un garde-fou ignoré
// (L4) : un chemin qui sert d'EXEMPLE de gabarit (`docs/X-blueprint.md`) ne désigne aucun fichier,
// et un chemin cité dans une PROPOSITION (« un document séparé allégerait… ») décrit ce qui
// n'existe pas encore, volontairement. Les deux produiraient un reproche sur une phrase juste.
const CHEMIN_CITE = /`((?:docs|lib|app|scripts|components)\/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+)`/g;
const CHEMIN_GABARIT = /(^|\/)X(\.|-|$)/;
const TOURNURE_DE_PROPOSITION = /(all[ée]gerait|pourrait|serait|à cr[ée]er|envisag|un futur|proposition)/i;
// LE TROISIÈME ÉTAT, et sans lui ce garde-fou serait rouge à vie sur trois lignes parfaitement
// honnêtes : un document peut citer un chemin absent EN DISANT qu'il est absent — la charte le fait
// pour un fichier de contexte jamais committé, THE-EQUALIZER cite un chemin erroné qu'un outil avait
// produit, et TOOL-LEARNING rappelle l'ancien chemin faux à côté du bon. Trois états, jamais deux :
// le chemin existe · il est absent et personne ne le dit · il est absent ET le document le déclare.
// Le dernier n'est pas un défaut, c'est précisément ce que l'Article 27 demande de faire.
// La déclaration est LUE dans la phrase, jamais supposée d'après le ton.
const ABSENCE_DECLAREE = /(n'existe pas|n'a jamais existé|jamais committé|absent du dépôt|introuvable|disparue? avec)/i;

export function findCheminsMortsDansReferentiel({ root = ROOT, fichiers, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync } = {}) {
  const cibles = fichiers ?? [
    ...readdirSync(join(root, "docs/referentiel")).filter((f) => f.endsWith(".md")).map((f) => `docs/referentiel/${f}`),
    "CLAUDE.md", "docs/regles-de-travail.md", "docs/systeme-de-suivi.md", "docs/philosophie-et-politique.md",
  ];
  const morts = [];
  const declarees = [];
  let verifies = 0;
  for (const rel of cibles) {
    let texte;
    try { texte = readFile(join(root, rel)); } catch { morts.push({ document: rel, chemin: rel, pourquoi: "le document de référence lui-même est illisible" }); continue; }
    for (const ligne of texte.split("\n")) {
      for (const m of ligne.matchAll(CHEMIN_CITE)) {
        const chemin = m[1];
        if (CHEMIN_GABARIT.test(chemin)) continue;
        verifies++;
        if (exists(join(root, chemin))) continue;
        if (TOURNURE_DE_PROPOSITION.test(ligne)) continue;
        if (ABSENCE_DECLAREE.test(ligne)) { declarees.push({ document: rel, chemin }); continue; }
        morts.push({ document: rel, chemin, pourquoi: `« ${rel} » cite ${chemin}, qui n'existe pas sur le disque` });
      }
    }
  }
  return { verifies, morts, declarees };
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
// Le format de tâche du suivi : 8 colonnes, ni plus ni moins (docs/systeme-de-suivi.md).
// Nommé une fois plutôt que comparé à un 8 nu à trois endroits — un chiffre nu ne dit pas de quoi
// il parle le jour où quelqu'un le lit sans contexte.
// DÉRIVÉ DE `FORMAT_TACHE`, JAMAIS ÉCRIT À LA MAIN (2026-09-25, tâche #870 — Article 24).
//
// CE QUI S'ÉTAIT PASSÉ, et c'est la CINQUIÈME occurrence du même patron en une journée : le champ
// `pourQui` a rejoint le format le 2026-09-25 (tâche #825), portant FORMAT_TACHE de 8 à 9 champs.
// Ce compte-ci est resté à 8. Résultat : les SEPT lignes écrites au format NEUF — donc les seules
// parfaitement à jour — étaient accusées d'être « mal formées », avec un message qui affirmait en
// prime que leurs colonnes suivantes étaient décalées. Elles ne l'étaient pas.
//
// C'est exactement la forme du faux positif décrite dans L4 : le garde-fou punit la conduite qu'il
// existe pour obtenir, et il le fait de plus en plus fort à mesure que les lignes se conforment.
//
// LES DEUX LONGUEURS SONT LÉGITIMES, et les confondre serait l'erreur inverse : 8 colonnes est
// l'HISTOIRE (avant que `pourQui` n'existe, 824 lignes), 9 colonnes est le format ACTUEL. Le
// minimum est le nombre de champs obligatoires, le maximum le format complet — les deux se lisent
// sur FORMAT_TACHE, donc un dixième champ ajouté demain n'exigera aucune retouche ici.
// LE MINIMUM N'EST PAS LE NOMBRE DE CHAMPS OBLIGATOIRES — première version de ce correctif, et
// elle était fausse : un champ facultatif occupe quand même SA COLONNE, vide. Le test l'a
// immédiatement attrapée en acceptant une ligne à 7 colonnes qui est réellement cassée.
// Le minimum est donc le format HISTORIQUE : tous les champs, moins ceux qui déclarent être
// arrivés après coup (`depuis`). Dérivé, jamais recopié.
export const COLONNES_MAX = FORMAT_TACHE.length;
export const COLONNES_MIN = COLONNES_MAX - FORMAT_TACHE.filter((f) => f.depuis).length;
// Conservé pour les appelants qui le lisent : c'est le format COMPLET visé, pas une exigence.
export const COLONNES_ATTENDUES = COLONNES_MAX;

export function findMotsClesManquants(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  const buckets = categorizeAllSessions(sessionsDir, readDir, readFile, exists);
  const ouvertes = [...buckets.enCours, ...buckets.ouverte, ...buckets.autre];
  const hits = [];
  const taches = [];
  for (const entry of ouvertes) {
    const c = entry.cells;
    const n = (c[0] ?? "").trim();
    // Même lecture ancrée qu'ailleurs : Mot-clé en 3e position du format à 8 colonnes, absent
    // d'une ligne restée à l'ancien format — jamais un décalage silencieux des colonnes suivantes.
    //
    // MAIS UNE LIGNE MAL FORMÉE SE DIT COMME TELLE (2026-09-23, tâche #625). Avant ce jour, une
    // ligne qui n'avait pas ses 8 colonnes rendait un mot-clé vide, et le garde-fou annonçait
    // « un mot-clé vide ne rappelle rien » — alors que le mot-clé était bel et bien écrit, et que
    // la vraie panne était structurelle. Quatorze lignes d'affilée ont porté ce message faux :
    // elles faisaient croire à une négligence de saisie là où c'était le FORMAT qui avait cédé,
    // et TOUTES les colonnes suivantes (sous-sujet, description, statut) étaient décalées avec.
    // Un garde-fou qui nomme la mauvaise cause envoie chercher au mauvais endroit — c'est la même
    // famille que la leçon L22, où un résumé recomptait au lieu de lire.
    if (c.length < COLONNES_MIN || c.length > COLONNES_MAX) {
      hits.push({ n, motCle: "", pourquoi: `ligne mal formée : ${c.length} colonne(s), hors de la fourchette ${COLONNES_MIN}–${COLONNES_MAX} — le mot-clé n'est pas manquant, il est illisible, et sous-sujet/description/statut sont décalés avec lui`, file: entry.file });
      continue;
    }
    const motCle = (c[2] ?? "").trim();
    taches.push({ n, motCle, statut: c[c.length - 1] ?? "" });
    const verdict = motCleValide(motCle);
    if (!verdict.ok) hits.push({ n, motCle, pourquoi: verdict.pourquoi, file: entry.file });
  }
  for (const collision of findMotsClesEnCollision(taches)) {
    // La raison vient de criticite.mjs telle quelle : la reformuler ici ferait vivre deux
    // explications du même refus, dont une seule serait tenue à jour (Article 24).
    // `collision: true` DÉCLARÉ À LA SOURCE (2026-09-25, #870) : un appelant qui recalcule les
    // collisions lui-même — c'est le cas d'auditFormatDesTaches, avec de meilleures données —
    // doit pouvoir les retirer d'ici sans les reconnaître au texte de leur message. Sans ce
    // drapeau, chaque collision sortait DEUX fois dans le rapport, dont une avec « n°undefined ».
    hits.push({ n: collision.numeros.join(", "), motCle: collision.mot, pourquoi: collision.pourquoi, collision: true });
  }
  return hits;
}

// ————————————————————————————————————————————————————————————————————————
// LA LIGNE FANTÔME — une tâche FAITE dont la ligne dit encore « Ouverte » (2026-09-26, tâche #944)
// ————————————————————————————————————————————————————————————————————————
//
// LA RÈGLE EXISTAIT DÉJÀ, ÉCRITE NOIR SUR BLANC, et personne ne la portait :
// `docs/systeme-de-suivi.md` §2 — « À la clôture d'une tâche, sa ligne est mise à jour (statut,
// pas une nouvelle ligne) ». Aucun mécanisme ne la vérifiait. Elle a donc cessé d'être vraie sans
// que rien ne le dise, ce qui est exactement ce que l'Article 27 annonce d'une obligation confiée
// à la seule mémoire d'un agent.
//
// CE QUE ÇA CASSE, ET CE N'EST PAS DU RANGEMENT : la file ment sur sa propre taille. Une tâche
// faite hier compte encore comme ouverte, donc « épuiser la file » n'a plus de fin mesurable, les
// « plus anciennes tâches encore ouvertes » remontent des travaux terminés, et tout taux
// d'avancement calculé là-dessus est faux. Une ligne fantôme est pire qu'une ligne manquante :
// elle a l'air d'un travail qui reste.
//
// LE SIGNAL, ET POURQUOI IL EST ÉTROIT PAR CHOIX : on ne retient un fantôme que si une AUTRE ligne,
// elle-même CLÔTURÉE, dit explicitement « tâche #N ». Un simple « #N » en prose ne suffit pas — une
// ligne cite couramment une voisine sans prétendre l'avoir faite, et accuser sur cette base
// produirait exactement le garde-fou qu'on apprend à ignorer (leçon L4). Le prix de ce choix est
// assumé et déclaré : un fantôme dont la ligne de clôture n'emploie pas le mot « tâche » passe
// inaperçu. Manquer un vrai cas coûte moins cher qu'en inventer un — c'est la leçon L30.
export const CITE_UNE_TACHE = /t[âa]ches?\s*#\s*(\d{1,5})/gi;

export function tachesCitees(texte = "") {
  const out = new Set();
  for (const m of String(texte).matchAll(CITE_UNE_TACHE)) out.add(Number(m[1]));
  return out;
}

export function estCloturee(statut = "") {
  return /^termin/.test(normaliserStatut(statut));
}

// Rend TOUJOURS `mesurable` : un suivi illisible ou vide ne peut pas rendre « aucun fantôme », qui
// se lirait comme un satisfecit sur zéro donnée (leçons L5/L11).
export function findLignesFantomes(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return { mesurable: false, pourquoi: `${sessionsDir} est introuvable — rien n'a pu être lu, ce qui ne veut pas dire qu'il n'y a rien à trouver`, fantomes: [] };
  const lignes = [];
  for (const file of readDir(sessionsDir).filter((f) => f.endsWith(".md"))) {
    for (const l of readFile(join(sessionsDir, file)).split("\n")) {
      if (!estUneLigneDeTache(l)) continue;
      const cells = splitTableRow(l);
      const n = Number((cells[0] ?? "").trim());
      if (!Number.isFinite(n)) continue;
      lignes.push({ n, file, statut: cells[cells.length - 1] ?? "", sousSujet: cells[4] ?? "", sujet: (cells[3] ?? "").trim().slice(0, 90) });
    }
  }
  if (!lignes.length) return { mesurable: false, pourquoi: "aucune ligne de tâche lue dans le suivi — un zéro sur zéro donnée n'est pas un zéro", fantomes: [] };

  const closes = lignes.filter((r) => estCloturee(r.statut));
  const ouvertes = lignes.filter((r) => !estCloturee(r.statut));
  // TROIS CONDITIONS, ET CHACUNE A ÉTÉ AJOUTÉE PARCE QUE LA VERSION D'AVANT ACCUSAIT À TORT.
  // La première mesure en rendait 16 ; quatre étaient fausses, et les lire une par une valait
  // mieux que de croire le chiffre (leçon L28 : un nombre qui BOUGE n'est pas un nombre qui
  // s'AMÉLIORE).
  //
  // 1. La ligne qui cite doit être CLÔTURÉE. Deux lignes ouvertes qui se renvoient l'une à
  //    l'autre ne prouvent aucun travail fait.
  // 2. Son numéro doit être PLUS GRAND. Une ligne ne peut pas avoir fait une tâche née après
  //    elle — c'est l'inverse : elle l'OUVRE en suite de son propre travail. Quatre des seize
  //    premières alertes étaient exactement ça (n°909 « closant » n°910, n°916/917, n°918/919,
  //    n°779/787), et chacune décrivait une suite, jamais une clôture.
  // 3. La citation doit être dans la cellule SOUS-SUJET, jamais dans le Détail. C'est la
  //    convention réelle du suivi, vérifiée sur les 825 lignes existantes : une ligne qui clôt
  //    une tâche l'annonce dans son sous-sujet (« Tâche #137 close après vérification »,
  //    « MEMENTO construit (tâche #169) »). Le Détail, lui, cite couramment une voisine sans
  //    prétendre l'avoir faite — c'est ce qui faisait dire que n°613 avait clos n°612, alors
  //    qu'il expliquait au contraire pourquoi il ne la touchait PAS.
  const parCitee = new Map();
  for (const c of closes) {
    for (const cite of tachesCitees(c.sousSujet)) {
      if (cite >= c.n) continue;
      if (!parCitee.has(cite)) parCitee.set(cite, []);
      parCitee.get(cite).push(c.n);
    }
  }
  const fantomes = [];
  for (const o of ouvertes) {
    const par = parCitee.get(o.n);
    if (par?.length) fantomes.push({ n: o.n, file: o.file, sujet: o.sujet, closePar: [...new Set(par)].sort((a, b) => a - b) });
  }
  return { mesurable: true, lues: lignes.length, ouvertes: ouvertes.length, fantomes };
}

export function formatLignesFantomesLines(r) {
  if (!r.mesurable) return [`❓ Lignes fantômes : PAS MESURÉ — ${r.pourquoi}`];
  if (!r.fantomes.length) return [`✅ Aucune ligne fantôme sur ${r.ouvertes} ligne(s) ouverte(s) : aucune tâche déclarée ouverte n'est citée comme faite par une ligne close.`];
  const L = [`🔴 ${r.fantomes.length} ligne(s) FANTÔME(S) sur ${r.ouvertes} ouverte(s) — la file annonce ${r.ouvertes} tâches restantes, il y en a ${r.ouvertes - r.fantomes.length}.`];
  L.push("   La règle qu'elles enfreignent est écrite depuis le 2026-09-19 dans docs/systeme-de-suivi.md §2 :");
  L.push("   « À la clôture d'une tâche, sa ligne est mise à jour (statut, pas une nouvelle ligne). »");
  for (const f of r.fantomes) L.push(`   · n°${f.n} dit « ouverte » mais la tâche est faite et close par n°${f.closePar.join(", n°")} — ${f.sujet}`);
  return L;
}

function main() {
  // L'AVERTISSEMENT DE MARGE, DIT ET PAS SEULEMENT DÉCLARÉ (2026-09-25, tâche #653 → #808) :
  // sa nature heuristique était écrite dans TOOL_RELIABILITY et aucun chemin de ce script ne la
  // prononçait — une protection écrite qui ne sort jamais, le fil rouge de ce projet.
  printReliabilityNotice("check-suivi-fidelity");
  console.log("=== État des tâches, en temps réel (docs/suivi/) ===\n");
  const all = categorizeAllSessions();
  console.log(`✅ Terminées : ${all.terminee.length}`);
  console.log(`🔧 En cours : ${all.enCours.length}`);
  for (const e of all.enCours) console.log(`   - ${describe(e)}`);
  console.log(`📋 Ouvertes / à faire : ${all.ouverte.length}`);
  for (const e of all.ouverte) console.log(`   - ${describe(e)}`);
  // Écartées et reportées comptées À PART et sans détail : ce sont des décisions déjà prises,
  // les relister ligne à ligne à chaque passage revient à les reproposer (cf. leçon L22).
  if (all.ecartee.length) console.log(`🚫 Écartées / reportées par décision explicite : ${all.ecartee.length} (jamais reproposées ici)`);
  if (all.autre.length) {
    console.log(`⚠️ Statut vraiment non reconnu : ${all.autre.length} — à corriger, pas à ignorer`);
    for (const e of all.autre) console.log(`   - [${e.statut.slice(0, 60)}] ${describe(e)}`);
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

  console.log(`\n=== Garde-fou rituel de clôture (la colonne APRÈS, depuis #${PREMIERE_TACHE_AVEC_RITUEL}) ===\n`);
  const sansRituel = auditCloturesSansRituel();
  if (!sansRituel.length) {
    console.log(`Aucune clôture sans sa case APRÈS — chaque tâche close depuis le seuil déclare ${QUESTIONS_DE_CLOTURE.map((q) => q.mot).join(" / ")}.`);
  } else {
    console.log("Sa décision du 2026-09-26 : « la case à cocher devient une condition, pas une intention ». Une tâche close sans sa case APRÈS n'est pas close.");
    for (const { file, hits } of sansRituel) {
      console.log(`${file} : ${hits.length} clôture(s) sans la case APRÈS`);
      for (const h of hits) console.log(`   - #${h.numero} — case lue : « ${h.cloture || "(vide)"} »`);
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

  console.log("\n=== Relecture périodique Article 13 — chemins cités par les documents de référence ===\n");
  const relecture = findCheminsMortsDansReferentiel();
  if (!relecture.morts.length) {
    console.log(`${relecture.verifies} chemin(s) cité(s) vérifié(s) : tous existent réellement sur le disque.`);
    if (relecture.declarees.length) console.log(`   (${relecture.declarees.length} chemin(s) absent(s) mais DÉCLARÉS comme tels par le document qui les cite — jamais un défaut : c'est ce que l'Article 27 demande.)`);
  } else {
    console.log(`${relecture.morts.length} chemin(s) mort(s) sur ${relecture.verifies} vérifié(s) :`);
    for (const m of relecture.morts) console.log(`   - ${m.pourquoi}`);
  }

  console.log("\n=== Garde-fou mot-clé unique par tâche ouverte (docs/suivi/) ===\n");
  const motsCles = findMotsClesManquants();
  if (!motsCles.length) {
    console.log("Chaque tâche ouverte porte un mot-clé valide, et aucun n'est porté par deux tâches à la fois.");
  } else {
    console.log(`${motsCles.length} tâche(s) ouverte(s) sans mot-clé exploitable :`);
    for (const h of motsCles) console.log(`   - n°${h.n} : ${h.pourquoi}`);
  }

  // DÉNOMINATEUR AFFICHÉ AVANT TOUT VERT (2026-09-23, tâche #206). Ce rapport rendait exactement
  // le même « tout va bien » sur un registre PARFAIT et sur un registre INTROUVABLE : sur zéro
  // session, chaque garde-fou rend une liste vide, et une liste vide se lit comme « aucun écart ».
  // Un rapport qui alerte à tort se fait corriger ; un rapport qui rassure à tort ne se fait jamais
  // corriger, puisque personne ne va voir. Le compte de ce qui a RÉELLEMENT été lu est donc affiché
  // avant les verdicts, et un registre vide le dit au lieu de se taire.
  const lu = sessionsLues();
  if (!lu.fichiers.length || !lu.lignes) {
    console.log(`\n⚠️  ${lu.dossierAbsent ? "Le dossier docs/suivi/sessions/ est introuvable" : "Aucune tâche lue dans docs/suivi/sessions/"} — tous les verdicts ci-dessous portent sur ZÉRO tâche.`);
    console.log("   Ce n'est pas « rien à signaler », c'est « rien n'a été mesuré ». Les deux se ressemblent à l'écran, et c'est précisément ce qui rend ce cas dangereux.");
  } else {
    console.log(`\n${lu.fichiers.length} fichier(s) de session lu(s), ${lu.lignes} tâche(s) au total — c'est le dénominateur des verdicts qui suivent.`);
  }

  console.log("\n=== Garde-fou numérotation durable des tâches (docs/suivi/) ===\n");
  const numberIssues = findTaskNumberIssues();
  if (!numberIssues.length) {
    console.log(`Numérotation cohérente sur tout le registre. Prochain numéro à utiliser : ${nextTaskNumber()}.`);
  } else {
    for (const i of numberIssues) console.log(`   - [${i.type}] n°${i.number} dans ${i.file}`);
  }

  // LA LIGNE FANTÔME (2026-09-26, tâche #944) — placée AVANT les horodatages parce qu'elle change
  // la taille annoncée de la file, donc le sens de tout ce qui suit.
  console.log("\n=== Garde-fou lignes fantômes (une tâche FAITE dont la ligne dit encore « ouverte ») ===\n");
  console.log(formatLignesFantomesLines(findLignesFantomes()).join("\n"));

  console.log("\n=== Garde-fou horodatages dans le futur (docs/suivi/) ===\n");
  const futurs = findHorodatagesFuturs();
  if (!futurs.length) {
    console.log("Aucune ligne datée dans le futur — toutes les fraîcheurs calculées sur ce registre rendent un âge positif.");
  } else {
    console.log(`${futurs.length} ligne(s) datée(s) dans le futur. Une date à venir rend un âge NÉGATIF, qui se lit comme « tout frais » au lieu de déclencher une alerte — tous les signaux de fraîcheur du paysage s'appuient dessus.`);
    for (const f of futurs.slice(0, 12)) console.log(`   - n°${f.numero} — ${f.horodatage} (+${f.avanceMinutes} min) — ${f.file}`);
    if (futurs.length > 12) console.log(`   … et ${futurs.length - 12} autre(s).`);
    console.log("   Cause racine, qu'aucune mécanique ne peut empêcher : ces dates sont TAPÉES, jamais lues sur une horloge. Lire l'heure réelle avant d'écrire une ligne, jamais extrapoler une heure de session plausible.");
  }

  console.log("\n=== Garde-fou fraîcheur du suivi (commits récents sans mise à jour docs/suivi/) ===\n");
  const missing = findCommitsMissingSuiviUpdate(recentCommits());
  if (!missing.length) {
    console.log("Aucun commit récent substantiel n'a sauté la mise à jour du suivi — discipline respectée.");
  } else {
    for (const c of missing) console.log(`   - ${c.hash.slice(0, 8)} : ${c.subject}`);
    console.log(`\n→ ${missing.length} commit(s) récent(s) ont changé du code/de la charte réelle sans jamais toucher docs/suivi/ — signe de la dérive réelle trouvée le 2026-09-19 (règle ajoutée à docs/regles-de-travail.md §4 : le suivi se met à jour DANS LE MÊME commit).`);
  }

  // LE PLAN D'ACTION (2026-09-25, tâche #854 — reste mesuré de #803/#833).
  //
  // POURQUOI CET OUTIL-CI EN AVAIT LE PLUS BESOIN : il émet SEPT familles d'écarts différentes,
  // chacune imprimée à sa place dans un rapport long, et rien ne les rassemblait à la fin. Un
  // lecteur qui parcourt le rapport en diagonale voit sept blocs et repart sans savoir lequel
  // demande quoi. C'est précisément le trou que l'Article 28 nomme : « un rapport produit ressemble
  // à un problème traité ».
  //
  // CHAQUE FAMILLE PORTE SA PROPRE TÂCHE, jamais une formule commune, parce que les corrections
  // n'ont rien à voir entre elles : une clôture sans fidèle/écart se répare en RELISANT le travail,
  // un chemin mort en CORRIGEANT un renvoi, un horodatage futur en RELISANT L'HEURE. Les fondre en
  // « corriger le suivi » produirait un plan qu'on ne peut pas appliquer sans rouvrir le rapport.
  //
  // CE QUI N'Y FIGURE PAS, ET C'EST VOULU : les tâches simplement OUVERTES. Une tâche ouverte n'est
  // pas un écart, c'est du travail en attente — la faire remonter en constat transformerait chaque
  // passage en une liste de cent lignes et apprendrait à ne plus lire la section.
  // UN CONSTAT PAR FAMILLE, JAMAIS UN PAR LIGNE — et ce n'est pas un raccourci, c'est la correction
  // d'une erreur faite ici même. Le premier jet poussait chaque écart comme un constat séparé :
  // 277 lignes de plan d'action, dont 23 fois la même phrase. Un plan plus long que le rapport
  // qu'il conclut n'est pas un plan, c'est un déversement — et il apprend à sauter la section,
  // c'est-à-dire exactement ce que l'Article 28 cherche à empêcher en la créant.
  //
  // La bonne granularité est celle de la CORRECTION : « 23 clôtures sans fidèle/écart, dont les
  // n°171, 172, 287 » se traite, « 23 lignes identiques » se saute. Le compte voyage donc avec le
  // constat (le dénominateur, règle de maison) et trois exemples suffisent à rendre la famille
  // localisable sans la recopier.
  const numeroDe = (row) => (String(row).match(/^\s*\|\s*(\d+)/) ?? [])[1];
  const exemples = (liste, max = 3) => {
    const vus = liste.slice(0, max).filter(Boolean);
    const reste = liste.length - vus.length;
    return vus.length ? ` — ex. ${vus.join(", ")}${reste > 0 ? ` (+${reste})` : ""}` : "";
  };
  const familles = [
    {
      n: results.reduce((t, r) => t + r.hits.length, 0),
      ex: results.flatMap((r) => r.hits.map((h) => { const num = numeroDe(h.row); return num ? `n°${num}` : r.file; })),
      // LE DÉNOMINATEUR VOYAGE AVEC LE CHIFFRE, règle de maison : « 251 clôtures sans verdict »
      // affole, « 251 sur 780 lignes de suivi » se situe. Et la taille change la NATURE de la
      // suite : trois clôtures se relisent dans la foulée, deux cent cinquante demandent une
      // décision sur la façon de les traiter (par lot, par période, ou pas du tout). Le dire
      // évite un plan d'action que personne n'appliquera jamais, ce qui est une autre façon de
      // ne rien conclure.
      quoi: (n, ex) => `${n} clôture(s) sans fidèle/écart sur ${lu.lignes} ligne(s) de suivi lues${ex}`,
      quoiFaire: (n) => n > 20
        ? `population historique : décider COMMENT la traiter (par lot, par période, ou la déclarer grandfathered comme docs/systeme-de-suivi.md l'autorise) avant d'en relire une seule — relire 251 clôtures une par une est un plan que personne n'appliquera`
        : "relire ce qui a été livré contre ce qui était demandé, puis écrire le verdict — une clôture nue ne dit pas si le travail a tenu sa promesse",
    },
    {
      n: relecture.morts.length,
      ex: relecture.morts.map((m) => m.chemin ?? String(m)),
      quoi: (n, ex) => `${n} chemin(s) mort(s) cité(s) par le référentiel${ex}`,
      quoiFaire: "corriger le renvoi ou déclarer l'absence (Article 27) — un chemin cassé ressemble à un lien, ce qui est pire qu'une absence",
    },
    {
      n: motsCles.length,
      ex: motsCles.map((m) => `n°${m.n}`),
      quoi: (n, ex) => `${n} tâche(s) ouverte(s) sans mot-clé exploitable${ex}`,
      quoiFaire: "ajouter ou corriger le mot-clé — sans lui la ligne est introuvable par sujet, donc invisible à la reprise des notes (Article 30)",
    },
    {
      n: numberIssues.length,
      ex: numberIssues.map((i) => String(i.message ?? i).slice(0, 60)),
      quoi: (n, ex) => `${n} incohérence(s) de numérotation${ex}`,
      quoiFaire: "renuméroter la ligne fautive — un numéro doit rester unique ET strictement croissant, c'est ce qui rend une clôture citable",
    },
    {
      n: futurs.length,
      ex: futurs.map((f) => `n°${f.numero} (+${f.avanceMinutes} min)`),
      quoi: (n, ex) => `${n} ligne(s) datée(s) dans le FUTUR${ex}`,
      quoiFaire: "relire l'heure réelle (node scripts/agent-du-temps.mjs) et corriger — un âge négatif se lit « tout frais » au lieu de déclencher une alerte (Article 32)",
    },
    {
      n: missing.length,
      ex: missing.map((c) => c.hash.slice(0, 8)),
      quoi: (n, ex) => `${n} commit(s) sans mise à jour du suivi${ex}`,
      quoiFaire: "écrire la ligne de suivi manquante — la règle est « dans le MÊME commit », et « je le ferai après » est la forme que prend l'oubli",
    },
  ];
  const ecarts = familles.filter((f) => f.n > 0).map((f) => ({
    quoi: f.quoi(f.n, exemples(f.ex)),
    quoiFaire: typeof f.quoiFaire === "function" ? f.quoiFaire(f.n) : f.quoiFaire,
  }));

  const plan = planDactionDepuisEcarts(ecarts, {
    toolSlug: "check-suivi-fidelity",
    libelle: (e) => e.quoi,
    tache: (e) => e.quoiFaire,
    fausseUneMesure: true,
  });
  console.log("");
  console.log(`=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
