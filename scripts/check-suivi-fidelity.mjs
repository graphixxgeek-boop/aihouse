// ICEBERG: membre
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
import { motCleValide, findMotsClesEnCollision, FORMAT_TACHE, CASE_COCHEE, PREMIERE_TACHE_AVEC_RITUEL, QUESTIONS_DE_CLOTURE, lireLigneDeTache } from "./criticite.mjs";
import { sh, printReliabilityNotice, lireLeDocumentGouvernant, ligneDocumentAbsent, listerLeDossierGouvernant } from "./lib-shell.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SESSIONS_DIR = join(ROOT, "docs/suivi/sessions");

// LE DOSSIER D'ARCHIVE DU SUIVI (2026-09-28, tâche #1024) — et pourquoi il vit À CÔTÉ de
// `sessions/` plutôt que dedans.
//
// LE FAIT QUI L'A RENDU NÉCESSAIRE, mesuré le jour même : le fichier de session en cours pesait
// 1,38 million de caractères, dont **94 % en tâches déjà fermées**. Le suivi était devenu le
// premier poste de coût du projet (47 % d'une session, devant la charte à 45 %) — non parce qu'il
// était mal tenu, mais parce qu'il gardait tout sous les yeux pour toujours.
//
// SA DÉCISION, prise en fenêtre dédiée : les tâches fermées DEPUIS LONGTEMPS rejoignent un dossier
// d'archive, celles fermées récemment restent immédiatement visibles. Le texte intégral n'est
// jamais touché — il est DÉPLACÉ. Compacter n'est pas supprimer, et archiver encore moins.
//
// POURQUOI UN DOSSIER SÉPARÉ ET PAS UN FICHIER DE PLUS DANS `sessions/` : `realSessionCost()`
// (ecotoken) mesure le coût du suivi sur le fichier le PLUS RÉCEMMENT MODIFIÉ de `sessions/`. Une
// archive posée là serait, le jour où on l'écrit, le fichier le plus récent — et la mesure de coût
// se braquerait sur elle au lieu du fichier de travail. Le chiffre resterait juste et désignerait
// la mauvaise cible, exactement le défaut que cette même fonction porte déjà écrit en commentaire.
//
// CE QUE ÇA OBLIGE, ET C'EST LE VRAI DANGER DE CE CHANTIER : les fonctions qui NUMÉROTENT ou
// COMPTENT les tâches doivent voir l'archive, sans quoi `nextTaskNumber()` réattribuerait un
// numéro déjà pris dès que les plus hauts numéros seraient archivés, et `categorizeAllSessions()`
// perdrait 655 tâches d'un coup — donc tous les KPI, toutes les confrontations avant/après, et la
// taille même de la file. Elles lisent donc DOSSIERS_DE_TACHES, jamais `sessions/` seul.
//
// CE QUE ÇA N'OBLIGE PAS, et la distinction est délibérée : les garde-fous de QUALITÉ (fraîcheur,
// cases de rituel, lignes mal formées, horodatages futurs) restent sur `sessions/`. Une tâche
// fermée il y a une semaine et archivée n'a pas à repasser un contrôle de fraîcheur à chaque
// commit — les accuser serait le garde-fou qui crie toujours, donc celui qu'on cesse de lire (L4).
export const ARCHIVES_DIR = join(ROOT, "docs/suivi/archives");

// Les dossiers qui portent des lignes de tâche. Une LISTE, parce qu'un troisième dossier demain
// (une seconde archive, un dossier par année) doit être vu par tout le monde sans qu'on retouche
// une seule fonction — Article 24 : un registre se LIT, il ne s'énumère pas à chaque appel.
export const DOSSIERS_DE_TACHES = [SESSIONS_DIR, ARCHIVES_DIR];

// RÈGLE D'APPEL, écrite ici parce qu'elle n'est pas devinable : un appelant qui NOMME un dossier
// veut CE dossier-là et rien d'autre (c'est ce que font tous les tests, avec un faux chemin). Seul
// l'appel par défaut — celui du vrai dépôt — balaie sessions/ ET archives/. Sans cette règle, tout
// test passant '/fake' se verrait servir en plus les vraies archives du dépôt, et ne testerait
// plus ce qu'il croit tester.
export function dossiersDeTaches(sessionsDir = SESSIONS_DIR) {
  return sessionsDir === SESSIONS_DIR ? DOSSIERS_DE_TACHES : [sessionsDir];
}

// Le balayage partagé : rend un couple { dossier, fichier } par fichier de tâches réellement
// présent. Un dossier absent est SAUTÉ, jamais une erreur — le dossier d'archive n'existe pas
// tant que rien n'a été archivé, et exiger sa présence ferait échouer un dépôt tout neuf.
export function listerLesFichiersDeTaches(sessionsDir = SESSIONS_DIR, readDir = readdirSync, exists = existsSync) {
  const out = [];
  for (const dossier of dossiersDeTaches(sessionsDir)) {
    if (!exists(dossier)) continue;
    // `index.md` EST EXCLU, ET CE N'EST PAS UN DÉTAIL DE RANGEMENT. Un index DÉCRIT un dossier ; il
    // n'en fait jamais partie. Le dépôt exige un index par dossier de registre, et celui du dossier
    // d'archive porte un tableau de sommaire (« | Fichier | Source | Lignes | … »). Ses lignes
    // commencent par `|` et ne portent aucun des intitulés que `estUneLigneDeTache()` sait écarter :
    // elles ont donc été comptées comme QUATRE TÂCHES dès son écriture — la file est passée de 985 à
    // 992 et les ouvertes de 76 à 81, sans qu'une seule tâche soit née. Vu au contrôle qui suit
    // chaque écriture, jamais à la relecture.
    //
    // La règle est générale plutôt que taillée sur ce cas (Article 24) : tout index de tout dossier
    // de tâches est écarté, y compris celui que `sessions/` pourrait recevoir demain.
    for (const fichier of readDir(dossier).filter((f) => f.endsWith(".md") && f !== "index.md")) out.push({ dossier, fichier });
  }
  return out;
}

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

// LES LIGNES DE TÂCHE AVEC LEUR STATUT, LUES UNE SEULE FOIS (2026-09-27, tâche #993, deuxième
// constat retenu de CLONE-HUNTER). Quatre fonctions de ce fichier répétaient exactement les mêmes
// cinq lignes : découper le texte, garder les lignes de tâche, découper chaque ligne en cellules,
// prendre la DERNIÈRE comme statut. CLONE-HUNTER les signalait depuis plusieurs passages.
//
// CE QUE LA RÉPÉTITION RISQUAIT, et ce n'est pas seulement de la lourdeur : « le statut est la
// dernière cellule » est une CONVENTION du format de suivi, pas une évidence. Écrite à quatre
// endroits, elle devait être corrigée à quatre endroits le jour où une colonne serait ajoutée après
// Statut — et la copie oubliée aurait lu une cellule voisine en silence, donc conclu « ouverte »
// sur une tâche close. C'est exactement ce qui vient d'arriver à `estUnDepot()` dans un autre
// fichier le même jour.
//
// `cells` est rendu avec le reste parce que trois des quatre appelants en ont besoin ensuite : le
// recalculer de leur côté aurait rétabli la moitié du doublon.
export function lignesDeTacheAvecStatut(sessionText) {
  return String(sessionText)
    .split("\n")
    .filter(estUneLigneDeTache)
    .map((row) => {
      const cells = splitTableRow(row);
      return { row, cells, statut: cells[cells.length - 1] ?? "" };
    });
}

// estStatutTermine()/estStatutEcarte() — LA MÊME QUESTION POSÉE QUATRE FOIS, ET TROIS RÉPONSES
// DIFFÉRENTES (2026-09-29, tâche #1171).
//
// LE CHIFFRE AVANT L'EXPLICATION, parce que c'est lui qui rend la chose incontestable : sur les
// 1 103 lignes du registre, **317 sont lues « encore ouverte » par un lecteur et « terminée » par
// un autre** — 29 % du suivi, sur la question la plus simple qu'on puisse lui poser.
//
// LA CAUSE TIENT EN UNE LETTRE. Quatre fonctions testaient la clôture à la main, avec trois motifs
// distincts : `/^termin[ée]e/i` (trois d'entre elles) et `/^termin[ée]/i` (la quatrième). Le
// registre, lui, écrit « Terminé » sans -e final **222 fois**, « TERMINÉ » 24 fois. Le premier
// motif exige ce -e : il rate donc la forme la PLUS COURANTE de clôture du projet. S'y ajoutent
// « [Terminé] », « **Terminée** », « Fait », « terminé le 2026-09-23T… » et les transitions
// « Ouverte → Terminée », toutes lues correctement par `categorizeTasks()` et par personne d'autre.
//
// CE QUE ÇA A PRODUIT, ET LES DEUX DÉGÂTS SONT OPPOSÉS :
//   · `findOpenTasks()` annonçait **409 tâches encore ouvertes** là où il y en a 88. Le rapport du
//     garde-fou se contredisait donc lui-même à dix lignes d'intervalle — « Ouvertes / à faire :
//     85 » en tête, « 300 tâche(s) non fermée(s) » dans le détail juste en dessous, la première
//     ligne du détail étant une tâche dont le statut est littéralement « [Terminé] ». Un garde-fou
//     qui accuse 4,4 fois trop cesse d'être lu (leçon L4) — et il a cessé de l'être : c'est
//     précisément dans cette section que j'ai pris le chiffre « 115 » du commit précédent, qui
//     était faux (la mesure vraie ne bouge pas : 92 non terminées avant comme après).
//   · `findClaimedFilesMissing()` fait l'inverse : il ne contrôle QUE ce qu'il croit terminé. Ces
//     mêmes 317 lignes n'ont donc jamais vu passer la vérification « les fichiers que tu déclares
//     avoir créés existent-ils vraiment ». Le garde-fou était aveugle sur un tiers des clôtures.
//
// ET LA LEÇON ÉTAIT DÉJÀ ÉCRITE DANS CE FICHIER, quarante lignes plus bas : « Un motif partagé se
// corrige à l'endroit où il est DÉFINI, jamais chez celui qui s'en plaint ». Elle y a été écrite le
// 2026-09-24 après exactement ce défaut, corrigé alors chez un seul appelant sur quatre. Le
// 2026-09-23, `normaliserStatut()` a été écrit pour clore ce vocabulaire — et n'a été branché que
// sur `categorizeTasks()`. Deux corrections partielles du même défaut, à un jour d'intervalle.
//
// D'OÙ CES DEUX FONCTIONS : une seule définition de « close », une seule de « écartée », sur le
// statut NORMALISÉ. Une septième orthographe demain se reconnaît en un seul endroit.
export function estStatutTermine(statut = "") {
  const s = normaliserStatut(statut);
  return /^termin[ée]/.test(s) || /^fait\b/.test(s);
}

export function estStatutEcarte(statut = "") {
  const s = normaliserStatut(statut);
  return /^ecart/.test(s) || /^report/.test(s) || /^abandon/.test(s) || /^sortie de la file/.test(s);
}

// Une ligne du tableau "| Horodatage | Sujet | Sous-sujet | Sensibilité | Description | Statut |"
// est une clôture non vérifiée si son dernier champ (Statut) commence par "terminée" sans jamais
// contenir "fidèle" ni "écart". Une tâche encore "ouverte"/"en cours" n'est jamais concernée — le
// garde-fou ne porte que sur ce qui est déclaré fini.
export function findUnverifiedClosures(sessionText) {
  const hits = [];
  for (const { row, statut } of lignesDeTacheAvecStatut(sessionText)) {
    if (estStatutTermine(statut) && !/fid[èe]le/i.test(statut) && !/[ée]cart/i.test(statut)) {
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
    if (!estStatutTermine(statut)) continue;
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
  const hits = [];
  for (const { row, cells, statut } of lignesDeTacheAvecStatut(sessionText)) {
    if (!estStatutTermine(statut)) continue;
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
  const hits = [];
  for (const { row, cells, statut } of lignesDeTacheAvecStatut(sessionText)) {
    // Un statut VIDE est une ligne mal formée (tableau markdown cassé) — un trou à signaler, jamais
    // un silence qui la laisserait invisible au garde-fou (trouvé le 2026-09-19 en relisant le
    // script à la demande explicite de l'utilisateur : « assure-toi encore de la fiabilité »).
    // ÉCARTÉE N'EST PAS OUVERTE, et l'oublier ici rouvrait ce qu'il avait fermé. Une tâche
    // écartée/reportée est une DÉCISION de l'utilisateur ; la lister sous « encore ouvertes » la lui
    // repropose à chaque passage, ce qu'il a explicitement demandé qu'on ne fasse jamais (leçon L22,
    // déjà écrite dans `categorizeTasks()` — et qui n'avait, elle non plus, été branchée qu'à un seul
    // lecteur). Les deux tests viennent maintenant de la même définition que le classement.
    if (!statut || (!estStatutTermine(statut) && !estStatutEcarte(statut))) hits.push({ row: row.trim(), statut, cells });
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
  const buckets = { terminee: [], enCours: [], ouverte: [], ecartee: [], autre: [] };
  for (const { row, cells, statut } of lignesDeTacheAvecStatut(sessionText)) {
    const entry = { row: row.trim(), statut, cells, statutNormalise: normaliserStatut(statut) };
    const s = entry.statutNormalise;
    if (estStatutTermine(s)) buckets.terminee.push(entry);
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
    else if (estStatutEcarte(s)) buckets.ecartee.push(entry);
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
// Un nom d'état : des lettres, des espaces, des apostrophes, des tirets. Rien d'autre — pas de
// chiffre, pas de pourcentage, pas de tiret cadratin, pas de parenthèse ni de deux-points, qui
// sont les marques d'une phrase et jamais celles d'un état.
export const MOTIF_NOM_D_ETAT = /^[\p{L}\s'’\-]+$/u;

export function normaliserStatut(statut = "") {
  return String(statut)
    // La flèche d'abord : « A → B » se lit B. Faite avant tout le reste, sinon les nettoyages
    // ci-dessous s'appliqueraient à la partie gauche, celle qui n'est plus vraie.
    //
    // MAIS TOUTE FLÈCHE N'EST PAS UNE TRANSITION (2026-09-29, tâche #1187), et je l'ai découvert en
    // l'écrivant moi-même : une clôture qui rapporte une mesure — « Terminé — fidèle : les données
    // sans lecteur passent de (8 → 7) » — se faisait couper à la flèche et rendait « 7), pas
    // déduite du code », c'est-à-dire un statut qu'aucun outil de la file ne reconnaît. La ligne
    // sortait du décompte des terminées, sur un ARTEFACT D'ÉCRITURE et non sur son état réel.
    //
    // LA RÈGLE EST UNE PROPRIÉTÉ, jamais une longueur (Article 24, BP5) : un nom d'état ne contient
    // que des LETTRES, des espaces et des tirets. Les douze transitions réelles du registre ont
    // trois parties gauches distinctes — « Ouverte », « en cours », « En attente de sa décision » —
    // et toutes trois le vérifient. Une prose qui rapporte une mesure ne le vérifie jamais : elle
    // porte des chiffres, un pourcentage, un tiret cadratin, une parenthèse ou un deux-points.
    //
    // MA PREMIÈRE VERSION NE BORNAIT QUE LA LONGUEUR, et le contre-test l'a refusée dans la minute :
    // « Terminé — le taux passe de 44 % -> 80 % » tient en 32 caractères avant la flèche et se
    // faisait donc couper comme une transition. Une longueur décrit la forme d'un exemple ; une
    // propriété décrit ce qu'est un nom d'état. La seconde couvre le cas suivant, la première non.
    //
    // La borne de longueur reste, en seconde ceinture : 32 caractères, pour laisser respirer un
    // libellé un peu plus long que le plus long connu (25) sans atteindre la taille d'une phrase.
    .replace(/^(.{0,32}?)(?:→|->|=>)\s*/u, (tout, gauche) => (MOTIF_NOM_D_ETAT.test(gauche.trim()) ? "" : tout))
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
  const total = { terminee: [], enCours: [], ouverte: [], ecartee: [], autre: [] };
  // ARCHIVE COMPRISE : une tâche archivée reste une tâche du projet. L'oublier ici ferait fondre la
  // file de 655 lignes sans qu'aucune ne soit close — un progrès qui n'a pas eu lieu (tâche #1024).
  for (const { dossier, fichier } of listerLesFichiersDeTaches(sessionsDir, readDir, exists)) {
    const cats = categorizeTasks(readFile(join(dossier, fichier)));
    const archivee = dossier === ARCHIVES_DIR;
    for (const key of Object.keys(total)) for (const entry of cats[key]) total[key].push({ ...entry, file: fichier, archivee });
  }
  return total;
}

// auditParFichier() — LE BALAYAGE PAR FICHIER, ÉCRIT UNE SEULE FOIS (2026-09-29, tâche #1204).
// CLONE-HUNTER signalait `auditOpenTasks` et `auditAllSessions` comme deux blocs jumeaux. Ils le
// sont : même squelette au caractère près, seul le détecteur appliqué au texte les distingue.
//
// LA PORTÉE EST DÉSORMAIS DÉCLARÉE, ET C'EST LE VRAI APPORT DE CETTE FONCTION. Les deux ne lisaient
// que `sessions/`, jamais `archives/` — sans qu'une ligne ne le dise. Ce n'était pas une décision,
// c'était la valeur par défaut d'un paramètre, et elle laissait **605 lignes de tâches sur 1 086
// hors de leur regard**, soit 56 % du registre. Une portée qu'on n'a pas choisie n'est pas une
// portée, c'est un angle mort — et un angle mort dont personne ne peut mesurer la taille.
export function auditParFichier(detecteur, dir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(dir)) return [];
  const results = [];
  for (const file of readDir(dir).filter((f) => f.endsWith(".md") && f !== "index.md")) {
    const hits = detecteur(readFile(join(dir, file)));
    if (hits.length) results.push({ file, hits });
  }
  return results;
}

// LA PORTÉE DE CES DEUX-CI RESTE `sessions/`, ET LA RAISON EST MESURÉE PLUTÔT QUE SUPPOSÉE :
//   · tâches OUVERTES dans les archives : **0**. L'angle mort est réel et VIDE aujourd'hui — un
//     zéro constaté, jamais un zéro présumé (leçon L5). `findTachesOuvertesArchivees()` juste en
//     dessous existe pour qu'il ne redevienne pas silencieusement non nul.
//   · clôtures sans déclaration dans les archives : **300**, qui s'ajouteraient aux 242 des
//     sessions. C'est la population historique déjà identifiée (#1171) comme une masse à traiter
//     par une décision d'ensemble, pas ligne à ligne. Les inclure ferait passer le compte de 242 à
//     542 sans rien apprendre de neuf, et noierait les clôtures RÉCENTES, qui sont les seules sur
//     lesquelles on peut encore agir.
export function auditOpenTasks(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  return auditParFichier(findOpenTasks, sessionsDir, readDir, readFile, exists);
}

// findTachesOuvertesArchivees() — LE ZÉRO QUI DOIT RESTER SURVEILLÉ (2026-09-29, tâche #1204).
// Une tâche encore OUVERTE dans un fichier archivé est exactement celle qu'on oubliera : l'archivage
// répond à la taille d'un fichier, jamais à la clôture d'une tâche. Aujourd'hui il n'y en a aucune,
// et c'est précisément pour ça que ce compteur existe — un angle mort vide ne prévient pas quand il
// se remplit. Il ne double pas `auditOpenTasks` : celle-ci regarde les sessions vivantes, celle-là
// l'endroit dont on a décidé de ne plus s'occuper.
export function findTachesOuvertesArchivees(archivesDir = ARCHIVES_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  return auditParFichier(findOpenTasks, archivesDir, readDir, readFile, exists);
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
    // Sans cette option, une fusion qui apporte des lignes de suivi passerait pour un commit
    // qui ne touche aucun fichier de suivi — le garde-fou regarderait à côté sans le dire.
    filesChanged: shImpl(`git diff-tree --no-commit-id --name-only -r --diff-merges=first-parent ${hash}`, { cwd: root }).trim().split("\n").filter(Boolean),
  }));
}

export function auditAllSessions(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  return auditParFichier(findUnverifiedClosures, sessionsDir, readDir, readFile, exists);
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
  let max = 0;
  // ARCHIVE COMPRISE, ET C'EST LE POINT LE PLUS DANGEREUX DE L'ARCHIVAGE (tâche #1024) : le jour où
  // les plus hauts numéros partiraient en archive, un balayage limité à sessions/ rendrait un
  // maximum trop bas et RÉATTRIBUERAIT un numéro déjà pris. Deux tâches différentes porteraient le
  // même numéro, et tous les renvois du dépôt pointeraient vers l'une ou l'autre au hasard.
  for (const { dossier, fichier } of listerLesFichiersDeTaches(sessionsDir, readDir, exists)) {
    for (const n of extractTaskNumbers(readFile(join(dossier, fichier)))) if (n > max) max = n;
  }
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
  for (const { file, ligne } of lignesDeTaches(sessionsDir, readDir, readFile)) {
    {
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

// LES DEUX CASES DU RITUEL, ET CE QU'ELLES N'ACCEPTENT PAS (2026-09-27, tâche #999).
//
// CE QUE DIT LE FORMAT, et il le dit sans ambiguïté : dans `FORMAT_TACHE` (scripts/criticite.mjs),
// `ouverture` vaut « OUI quand la tâche s'est ouverte en respectant les process » et `cloture`
// « OUI quand les trois questions de clôture ont été posées ». Le vocabulaire est FERMÉ —
// `CASE_COCHEE = "OUI"` — et le commentaire d'origine le souligne : « OUI ou rien : une case à
// moitié cochée n'existe pas, et un troisième mot ferait revenir le flou que la case existe pour
// retirer ».
//
// CE QUE PORTAIENT LES LIGNES : 35 y avaient écrit un horodatage, de #958 à #992. La confusion est
// compréhensible — deux cases vides à droite d'une colonne « Horodatage » appellent des dates — et
// c'est exactement pour ça qu'elle ne se corrige pas par la vigilance : elle se corrige par un
// détecteur.
//
// POURQUOI CE N'EST PAS COSMÉTIQUE, et c'est le fil rouge de ce projet : toute lecture de ces deux
// cases devient AVEUGLE sur ces lignes-là. Le tri de chantier (#998) ne peut pas y voir une clôture
// oubliée ; `findRituelManquant` ne peut pas y voir un rituel sauté. Un garde-fou qui ne voit pas
// rend un vert, et un vert se lit comme une bonne nouvelle (leçon L11).
//
// SA DÉCISION DU 2026-09-27, en fenêtre de calibrage : « Remettre OUI/vide, la date part ». Rien
// n'est perdu — la date d'ouverture vit déjà dans la colonne Horodatage juste à côté, la date de
// clôture dans le Détail. Les deux autres options (ajouter deux vraies colonnes de date, ou
// supprimer les cases) ont été écartées : la première est une migration de 11 à 13 colonnes, la
// seconde jetterait un contrôle que 83 lignes portent correctement.
// LE MÊME PARCOURS DANS TROIS SONDES, ET LA MÊME PHRASE DE NON-MESURE DANS QUATRE (2026-09-28,
// tâche #997, signalé par CLONE-HUNTER). Treize fonctions de ce fichier prennent les mêmes quatre
// paramètres injectables ; trois réécrivaient mot pour mot « pour chaque .md, pour chaque ligne qui
// commence par un numéro de tâche ».
//
// CE QUI EST EN JEU N'EST PAS LA PLACE PRISE, c'est le CRITÈRE : ce qui compte comme « une ligne de
// tâche » (`|` puis un nombre) était écrit trois fois. Le jour où le format bouge — et il a déjà
// bougé deux fois cette semaine — une sonde corrigée et deux oubliées rendraient trois vérités
// différentes sur le même registre, et rien ne le dirait. Une seule définition, donc.
export const MOTIF_LIGNE_DE_TACHE = /^\|\s*\d+\s*\|/;

export function* lignesDeTaches(sessionsDir, readDir, readFile) {
  for (const file of readDir(sessionsDir).filter((f) => f.endsWith(".md"))) {
    for (const ligne of readFile(join(sessionsDir, file)).split("\n")) {
      if (!MOTIF_LIGNE_DE_TACHE.test(ligne)) continue;
      yield { file, ligne };
    }
  }
}

// LA NON-MESURE SE DIT D'UNE SEULE VOIX. « Rien lu » n'est pas « aucun écart » (leçons L5/L11), et
// cette phrase-là est trop importante pour vivre en quatre exemplaires qui pourraient diverger.
export function riennAPuEtreLu() {
  return { mesurable: false, ecarts: [], lignesLues: 0,
    pourquoi: "aucun dossier de sessions lu : rien \u00e0 confronter, ce qui n'est pas la m\u00eame chose qu'aucun \u00e9cart" };
}

export const MOTIF_DATE_DANS_UNE_CASE = /^\s*\d{4}-\d{2}-\d{2}T/;
export const VALEURS_DE_CASE_ADMISES = ["OUI", ""];

export function findCasesDeRituelMalRemplies(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return riennAPuEtreLu();
  const ecarts = [];
  let lignesLues = 0;
  for (const { file, ligne } of lignesDeTaches(sessionsDir, readDir, readFile)) {
    {
      const cells = splitTableRow(ligne);
      // Les deux cases vivent APRÈS « Pour qui » et AVANT « Détail » : on les lit par leur position
      // de tête, jamais par un index fixe compté depuis la fin — un `|` non échappé dans le Détail
      // découpe la ligne en dix, douze, quinze cellules, et un index depuis la fin tombe alors au
      // milieu d'une phrase. C'est la même prudence qui a déjà évité trois accusations fausses.
      if (cells.length < 11) continue;   // ligne restée à un format antérieur : rien à reprocher
      lignesLues += 1;
      for (const [i, champ] of [[7, "ouverture"], [8, "cloture"]]) {
        const v = String(cells[i] ?? "").trim();
        if (!MOTIF_DATE_DANS_UNE_CASE.test(v)) continue;
        ecarts.push({ numero: Number(cells[0]), file, champ, valeur: v,
          pourquoi: `la case « ${champ} » porte une date (${v}) alors qu'elle n'accepte que « OUI » ou rien — toute lecture de cette case est aveugle sur cette ligne` });
      }
    }
  }
  return { mesurable: true, ecarts, lignesLues,
    pourquoi: lignesLues === 0
      ? "aucune ligne au format complet (11 colonnes) : les deux cases n'existent pas encore sur ce registre, et ce zéro ne certifie rien"
      : `${ecarts.length} écart(s) sur ${lignesLues} ligne(s) au format complet` };
}

// LES LIGNES MAL FORMÉES — plus de cellules que le format n'en porte (2026-09-27, tâche #999,
// trouvé en réparant les cases du rituel et pas en le cherchant).
//
// POURQUOI CE N'EST PAS UN DÉTAIL DE MISE EN PAGE : `loadAllTaskRows` traite toute ligne plus
// longue que le format comme ILLISIBLE et rend `null` pour ses trois champs de tête tardifs. Le
// lecteur canonique du registre devient donc AVEUGLE sur ces lignes-là — et la nuit du 2026-09-27
// il l'était sur les CINQ tâches les plus récentes, c'est-à-dire celles qu'on relit le plus.
//
// DEUX CAUSES, jamais confondues parce qu'elles se réparent à l'opposé :
//   · une barre verticale NON ÉCHAPPÉE dans le texte du Détail (souvent dans un extrait de code
//     entre accents graves) — elle doit s'écrire `\|` ;
//   · une CELLULE SURNUMÉRAIRE, une barre de trop tapée en écrivant la ligne.
//
// COMMENT LA FRONTIÈRE SE TROUVE SANS DEVINER L'ÉPOQUE DE LA LIGNE : le registre porte cinq
// formats successifs (7 à 11 colonnes) et une ligne trop longue ne dit pas duquel elle vient. On
// ne compte donc pas — on RECONNAÎT : la criticité, « pour qui » et les deux cases du rituel ont
// chacun un vocabulaire fermé. Tout ce qui suit le dernier champ de tête reconnu, jusqu'à
// l'avant-dernière cellule incluse, est du Détail ; la dernière est le statut. Aucune position
// écrite en dur, donc un douzième champ demain ne casse rien (Article 24).
// LE VOCABULAIRE SE DISAIT « FERMÉ », ET IL AVAIT GRANDI DE SEPT VALEURS SANS QUE SON LECTEUR LE
// SACHE (2026-09-28, tâche #1087). Mesuré sur les 364 lignes réelles : 66 d'entre elles — 18 % du
// registre — portaient une criticité parfaitement légitime que ce motif ne reconnaissait pas
// (CRITIQUE-STRUCTURANT ×21, MOYENNE ×17, NORMAL-NON-PRIORITAIRE ×10, ELEVEE ×8, PRIORITAIRE ×5,
// RECOMMANDEE ×4, FAIBLE ×1). Aucune n'était une faute de saisie.
//
// ET LA CONSÉQUENCE EST PIRE QUE LE CHIFFRE : quand la criticité n'est pas reconnue,
// `frontiereDuDetail()` rend `null` et la ligne est SILENCIEUSEMENT écartée de tous les contrôles.
// L'abstention est juste — on ne devine pas — mais **l'abstention SILENCIEUSE ne l'est pas** :
// 18 % du registre échappait à la vérification, et rien ne le disait. C'est le défaut que ce
// paysage corrige partout ailleurs, commis par le garde-fou du registre lui-même.
//
// `NORMAL-NON-PRIORITAIRE` explique à lui seul pourquoi le motif d'origine ratait : il acceptait
// `NORMAL-` suivi d'UN mot, jamais d'un second tiret. Le motif accepte désormais les composés.
const MOTIF_CRITICITE = /^\s*(?:PRIORITAIRE-OBLIGATOIRE|PRIORITAIRE|CRITIQUE(?:-[A-Z-]+)?|RECOMMANDEE?(?:-[A-Z-]+)?|NORMAL(?:-[A-Z-]+)?|SENSIBLE(?:-[A-Z-]+)?|A-?\s?TRANCHER|ELEVEE|MOYENNE|FAIBLE|critique|important|normal|autre)\s*$/i;
const MOTIF_POUR_QUI = /^\s*(?:PROJET|DETTE-ENVERS-L-?'?L?UTILISATEUR)\s*$/i;
const MOTIF_CASE_RITUEL = /^\s*(?:OUI|NON|)\s*$/i;

export function frontiereDuDetail(cells = []) {
  let i = cells.findIndex((c) => MOTIF_CRITICITE.test(String(c)));
  if (i === -1) return null;   // pas de criticité reconnue : on ne devine pas, on s'abstient
  i += 1;
  if (MOTIF_POUR_QUI.test(String(cells[i] ?? "x"))) i += 1;
  // Les deux cases du rituel ne se lisent QUE si les DEUX sont présentes et admises : une seule
  // cellule vide juste après « pour qui » peut tout aussi bien être un Détail vide, et avancer
  // d'un cran sur cette seule foi décalerait la frontière.
  if (MOTIF_CASE_RITUEL.test(String(cells[i] ?? "x")) && MOTIF_CASE_RITUEL.test(String(cells[i + 1] ?? "x"))) i += 2;
  return i;
}

// findLignesSansCriticiteReconnue() — L'ABSTENTION CESSE D'ÊTRE SILENCIEUSE (2026-09-28, #1087).
// `frontiereDuDetail()` a raison de s'abstenir quand elle ne reconnaît pas la criticité : deviner
// ferait pire. Mais une ligne écartée sans bruit est une ligne que PLUS AUCUN contrôle ne regarde,
// et personne ne peut le savoir. Ce compteur existe pour que le prochain trou du vocabulaire
// remonte le jour où il apparaît, au lieu de cacher 18 % du registre pendant des semaines.
// balayerLesLignesDeTaches() — LE BALAYAGE, ÉCRIT UNE SEULE FOIS (2026-09-28, tâche #1088).
// Trois détecteurs de ce fichier partageaient le même squelette au caractère près : refuser un
// dossier absent par `riennAPuEtreLu()`, compter les lignes lues, découper chaque ligne, et rendre
// `{ mesurable, ecarts, lignesLues }`. Seul le VERDICT sur une ligne les distingue.
//
// CLONE-HUNTER l'a signalé au commit même où j'écrivais le troisième — et il avait raison : c'est
// la forme de dette qui se recopie une fois de plus à chaque détecteur qui rejoint le fichier.
// Le dénominateur compte autant que les écarts : un détecteur qui rend zéro sans dire combien il a
// lu est indiscernable d'un détecteur qui n'a rien lu (leçons L5/L11), d'où `lignesLues` porté ici.
export function balayerLesLignesDeTaches(verdict, sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return riennAPuEtreLu();
  const ecarts = [];
  let lignesLues = 0;
  for (const { file, ligne } of lignesDeTaches(sessionsDir, readDir, readFile)) {
    lignesLues += 1;
    const ecart = verdict(splitTableRow(ligne), file);
    if (ecart) ecarts.push(ecart);
  }
  return { mesurable: true, ecarts, lignesLues };
}

// findOrdreFormatDivergent() — LE FORMAT DÉCLARÉ DÉCRIT-IL ENCORE LES LIGNES RÉELLES ?
// (2026-09-28, tâche #1099)
//
// LE TROU QU'IL FERME EST CELUI QUI A COÛTÉ LE PLUS CHER CETTE SEMAINE, et il était INVISIBLE :
// `FORMAT_TACHE` déclarait `detail` en 7ᵉ position quand 270 des 374 lignes réelles y portent
// « pour qui ». Aucun test ne pouvait le voir, parce que chaque moitié était cohérente avec
// elle-même : le format se lisait bien, les lignes se lisaient bien, seul leur ACCORD était faux.
// La divergence était même écrite en commentaire, renvoyée à une « tâche notée séparément » qui
// n'a jamais existé — donc à personne.
//
// SON PRINCIPE : plutôt que de comparer deux listes (ce qui suppose une seconde liste à tenir à
// jour, donc une seconde chose qui peut diverger — Article 24), il SONDE. Quatre champs du format
// ont un vocabulaire reconnaissable ; si l'ordre déclaré se remet à mentir, la valeur trouvée à
// leur place cessera de ressembler à ce qu'ils doivent contenir, en masse et d'un coup.
//
// POURQUOI UNE PROPORTION ET PAS UN ZÉRO ABSOLU : une ligne isolée peut légitimement porter une
// valeur inattendue (une criticité au vocabulaire neuf, une case laissée vide). Exiger zéro ferait
// crier le garde-fou sur du bruit, et un garde-fou qui crie à tort cesse d'être lu (leçon L4). Un
// ordre qui se décale, lui, ne rate pas une ligne : il les rate TOUTES.
export const SONDES_DU_FORMAT = [
  { champ: "numero", motif: /^[0-9]+$/, quoi: "un numéro de tâche" },
  { champ: "horodatage", motif: /^[0-9]{4}-[0-9]{2}-[0-9]{2}T/, quoi: "un horodatage" },
  { champ: "criticite", motif: MOTIF_CRITICITE, quoi: "un niveau de criticité" },
  { champ: "pourQui", motif: MOTIF_POUR_QUI, quoi: "PROJET ou DETTE-ENVERS-L-UTILISATEUR" },
  { champ: "ouverture", motif: MOTIF_CASE_RITUEL, quoi: "OUI, NON, ou rien" },
  { champ: "cloture", motif: MOTIF_CASE_RITUEL, quoi: "OUI, NON, ou rien" },
];

// Au-delà de cette part de lignes en désaccord sur un même champ, ce n'est plus une exception :
// c'est l'ordre déclaré qui a cessé de décrire le fichier.
export const PART_MAX_HORS_VOCABULAIRE = 0.2;

export function findOrdreFormatDivergent(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return riennAPuEtreLu();
  const vus = new Map(SONDES_DU_FORMAT.map((s) => [s.champ, { lus: 0, hors: 0, exemple: null }]));
  let lignesLues = 0, illisibles = 0;
  for (const { ligne } of lignesDeTaches(sessionsDir, readDir, readFile)) {
    lignesLues += 1;
    const lu = lireLigneDeTache(splitTableRow(ligne));
    if (!lu.lisible) { illisibles += 1; continue; }
    for (const sonde of SONDES_DU_FORMAT) {
      const v = lu.champs[sonde.champ];
      if (v === null) continue;                 // champ absent d'une ligne ancienne : rien à dire
      const etat = vus.get(sonde.champ);
      etat.lus += 1;
      if (!sonde.motif.test(String(v))) { etat.hors += 1; if (!etat.exemple) etat.exemple = String(v).slice(0, 40); }
    }
  }
  const ecarts = [];
  for (const sonde of SONDES_DU_FORMAT) {
    const { lus, hors, exemple } = vus.get(sonde.champ);
    if (!lus) continue;                          // jamais lu : pas mesuré, jamais « conforme »
    const part = hors / lus;
    if (part > PART_MAX_HORS_VOCABULAIRE) {
      ecarts.push({ champ: sonde.champ, lus, hors, part,
        pourquoi: `${hors} valeur(s) sur ${lus} (${Math.round(part * 100)} %) ne ressemblent pas à ${sonde.quoi} — exemple lu : « ${exemple} ». Au-delà de ${Math.round(PART_MAX_HORS_VOCABULAIRE * 100)} %, ce n'est plus une exception de saisie : l'ordre déclaré dans FORMAT_TACHE a cessé de décrire les lignes réelles, et TOUT lecteur qui en dérive une position lit la mauvaise colonne` });
    }
  }
  return { mesurable: true, ecarts, lignesLues, illisibles,
    pourquoi: lignesLues === 0
      ? "aucune ligne de tâche lue : ce zéro dit qu'il n'y a rien à mesurer, jamais que le format est juste"
      : `${SONDES_DU_FORMAT.length} champ(s) sondé(s) sur ${lignesLues - illisibles} ligne(s) lisible(s) (${illisibles} illisible(s), écartée(s) plutôt que devinée(s))` };
}

export function findLignesSansCriticiteReconnue(...args) {
  return balayerLesLignesDeTaches((cells, file) => (frontiereDuDetail(cells) !== null ? null : {
    numero: Number(cells[0]), file, valeur: String(cells[5] ?? "").trim().slice(0, 40),
    pourquoi: "aucune criticité reconnue dans cette ligne : elle est donc écartée de TOUS les contrôles de forme, silencieusement — soit la valeur est fautive, soit le vocabulaire du lecteur a pris du retard sur celui du registre",
  }), ...args);
}

export function findLignesMalFormees(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return riennAPuEtreLu();
  const ecarts = [];
  let lignesLues = 0;
  for (const { file, ligne } of lignesDeTaches(sessionsDir, readDir, readFile)) {
    {
      lignesLues += 1;
      const cells = splitTableRow(ligne);
      const debutDetail = frontiereDuDetail(cells);
      if (debutDetail === null) continue;
      // Bien formée : exactement une cellule de Détail, puis le statut.
      const surplus = cells.length - (debutDetail + 2);
      if (surplus <= 0) continue;
      ecarts.push({ numero: Number(cells[0]), file, cellules: cells.length, surplus,
        pourquoi: `${surplus} cellule(s) de trop : le Détail est découpé en ${surplus + 1} morceaux, donc \`loadAllTaskRows\` déclare cette ligne illisible et rend null pour ses champs de tête tardifs — le lecteur canonique du registre est aveugle sur elle` });
    }
  }
  return { mesurable: true, ecarts, lignesLues,
    pourquoi: lignesLues === 0
      ? "aucune ligne de tâche lue : ce zéro dit qu'il n'y a rien à mesurer, jamais que le registre est propre"
      : `${ecarts.length} ligne(s) mal formée(s) sur ${lignesLues} lue(s)` };
}

export function findTaskNumberIssues(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync) {
  if (!exists(sessionsDir)) return [];
  const issues = [];
  const seenIn = new Map();
  // ARCHIVE COMPRISE : sans elle, un numéro réutilisé par erreur ne serait plus détecté dès que son
  // premier porteur aurait été archivé — le doublon deviendrait invisible en vieillissant.
  for (const { dossier, fichier: file } of listerLesFichiersDeTaches(sessionsDir, readDir, exists)) {
    let previous = -Infinity;
    for (const n of extractTaskNumbers(readFile(join(dossier, file)))) {
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
  let count = 0;
  // ARCHIVE COMPRISE : ce compte sert de borne de reprise à THE-DEEP-READER. L'amputer des tâches
  // archivées lui ferait croire qu'il a moins à relire qu'en réalité.
  for (const { dossier, fichier } of listerLesFichiersDeTaches(sessionsDir, readDir, exists)) {
    for (const n of extractTaskNumbers(readFile(join(dossier, fichier)))) if (n > sinceTaskNumber) count++;
  }
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
// LE VOCABULAIRE DE L'ABSENCE DÉCLARÉE. Le message de ce garde-fou propose deux issues — « corriger
// le renvoi OU déclarer l'absence (Article 27) » — et seule la première marchait vraiment : les
// tournures du RETRAIT n'y figuraient pas.
//
// ÉLARGI LE 2026-09-27 (tâche #1000), et le cas l'a imposé le jour même : `lib/reference.ts` a été
// retiré du produit et archivé verbatim. Les six documents qui le citaient ont reçu une note disant
// exactement ça — « a été RETIRÉ du produit [...] archivé dans <chemin> » — et le compte de chemins
// morts est MONTÉ de 14 à 19. Déclarer l'absence dans les mots de la charte aggravait le signal :
// une issue proposée par l'outil que l'outil lui-même ne reconnaissait pas.
//
// L'ÉLARGISSEMENT RESTE ÉTROIT, et la contrainte forte est ailleurs : la tournure doit figurer SUR
// LA MÊME LIGNE que la citation. Un document qui parle d'un retrait dix lignes plus haut ne fait
// donc taire aucun vrai lien mort — c'est ce qui sépare cet élargissement d'un affaiblissement.
const ABSENCE_DECLAREE = /(n'existe pas|n'a jamais existé|jamais committé|absent du dépôt|introuvable|disparue? avec|retiré (?:du|de) (?:produit|dépôt|jeu)|a quitté le dépôt|archivé (?:verbatim )?dans)/i;

// LES CHEMINS RETIRÉS, DÉCLARÉS UNE FOIS POUR TOUT LE DÉPÔT (2026-09-27, tâche #1000).
//
// LE PROBLÈME QUE LA DÉCLARATION PAR LIGNE NE RÈGLE PAS. `ABSENCE_DECLAREE` exige que la tournure
// figure SUR LA MÊME LIGNE que la citation, et cette contrainte est bonne : un document qui parle
// d'un retrait dix lignes plus haut ne doit pas faire taire un vrai lien mort ailleurs. Mais quand
// un fichier RÉEL quitte le dépôt, ce n'est pas treize faits différents à déclarer treize fois :
// c'est UN fait, et le répéter à chaque ligne citante est exactement la liste recopiée à la main
// que l'Article 24 interdit — elle se périmerait au premier document qui le cite à son tour.
//
// CE QUI EST DÉCLARÉ ICI EST UN FAIT VÉRIFIABLE, jamais une dispense : le fichier a été retiré à
// une date, et son contenu vit à un endroit qui, lui, DOIT exister. Un successeur introuvable
// rouvre le signal — sans quoi cette table deviendrait le moyen le plus simple de faire taire
// n'importe quel lien mort, ce qui est précisément ce qu'elle ne doit pas être.
export const CHEMINS_RETIRES = {
  "lib/reference.ts": {
    retireLe: "2026-09-27",
    successeur: "docs/contexte-projet/referentiel-affiche-en-jeu-archive.md",
    pourquoi: "le référentiel AFFICHÉ EN JEU (panneau Admin), retiré du produit sur décision explicite de l'utilisateur — son rôle est aujourd'hui rempli par CLAUDE.md et docs/referentiel/. Texte intégral archivé verbatim, jamais résumé",
  },
};

export function findCheminsMortsDansReferentiel({ root = ROOT, fichiers, readFile = (f) => readFileSync(f, "utf8"), exists = existsSync, retires = CHEMINS_RETIRES } = {}) {
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
        // Un chemin RETIRÉ et déclaré comme tel n'est pas un lien mort — à la condition stricte que
        // son successeur existe vraiment. Si l'archive a disparu à son tour, le renvoi redevient
        // mort, et il le redevient bruyamment : c'est ce qui empêche cette table d'être une porte
        // de sortie pour n'importe quel chemin cassé.
        const retire = retires?.[chemin];
        if (retire && exists(join(root, retire.successeur))) { declarees.push({ document: rel, chemin, retireLe: retire.retireLe, successeur: retire.successeur }); continue; }
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

// DEUX FAÇONS DE NE PLUS ATTENDRE, ET ELLES NE SE CONFONDENT PAS (2026-09-28, tâche #1088). Une
// tâche « terminée » a été FAITE ; une tâche « écartée » a été DÉCIDÉE — on a regardé, et on ne la
// fait pas. L'Article 28 pose exactement cette distinction pour un constat (RETENU / ÉCARTÉ), et
// elle vaut tout autant pour une tâche.
//
// CE QUI ÉTAIT FAUX N'ÉTAIT NI L'UNE NI L'AUTRE : une tâche écartée était comptée OUVERTE. Elle
// remontait donc dans la file, dans les « plus anciennes encore ouvertes », dans toute mesure de
// retard — alors que plus personne n'attend rien d'elle. **Un retard qui n'existe pas**, exactement
// le défaut déjà corrigé ici même pour les statuts en transition (« A → B »).
//
// LES DEUX LABELS RESTENT DISTINCTS : on ne renomme pas « écartée » en « terminée », ce qui
// effacerait la décision et son sens. On reconnaît seulement que les deux sont TERMINALES.
// STATUTS_RECONNUS — le vocabulaire des états, et le garde-fou qui nomme ce qui en sort
// (2026-09-28, tâche #1088). Deux tâches réelles portaient « FAIT » : parfaitement claires pour un
// lecteur humain, invisibles pour tous les outils de la file, qui les comptaient OUVERTES des jours
// après leur clôture.
//
// LE GARDE-FOU NE DEVINE PAS, ET NE SE TAIT PAS NON PLUS — même doctrine que l'abstention de la
// tâche #1087 : élargir le vocabulaire à chaque synonyme rencontré (« FAIT », « OK », « réglé »)
// finirait par tout accepter, donc par ne plus rien signifier. On garde donc un vocabulaire étroit,
// et on NOMME ce qui en sort, pour que la ligne soit corrigée au lieu de compter faux en silence.
export const STATUTS_RECONNUS = [
  { motif: /^termin/, etat: "terminée", quoi: "elle a été FAITE" },
  { motif: /^ecart/, etat: "écartée", quoi: "on a regardé, et on a DÉCIDÉ de ne pas la faire (Article 28)" },
  { motif: /^ouvert/, etat: "ouverte", quoi: "elle attend d'être faite" },
  { motif: /^en cours/, etat: "en cours", quoi: "elle est commencée" },
  { motif: /^a faire/, etat: "ouverte", quoi: "elle attend d'être faite" },
  { motif: /^a-?\s?trancher/, etat: "ouverte", quoi: "elle attend une décision de l'utilisateur" },
  { motif: /^en attente/, etat: "ouverte", quoi: "elle attend quelque chose ou quelqu'un" },
];

export function etatDuStatut(statut = "") {
  const n = normaliserStatut(statut);
  return STATUTS_RECONNUS.find((s) => s.motif.test(n)) ?? null;
}

export function findStatutsNonReconnus(...args) {
  return balayerLesLignesDeTaches((cells, file) => {
    const brut = String(cells[cells.length - 1] ?? "").trim();
    return etatDuStatut(brut) ? null : {
      numero: Number(cells[0]), file, statut: brut.slice(0, 50),
      pourquoi: "statut hors du vocabulaire reconnu : les outils de la file ne savent pas si cette tâche attend encore quelque chose, et par défaut ils la comptent ouverte",
    };
  }, ...args);
}

export function estEcartee(statut = "") {
  return /^ecart/.test(normaliserStatut(statut));
}

export function estCloturee(statut = "") {
  const n = normaliserStatut(statut);
  return /^termin/.test(n) || /^ecart/.test(n);
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

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE COMPOSEUR DE LIGNE — l'autre bout du suivi (2026-10-02, tâche #1447)
// ════════════════════════════════════════════════════════════════════════════════════════════
//
// LE DIAGNOSTIC EST UN RAPPORT DE UN À TRENTE-QUATRE, et il vient de la description du module
// (tâche #1443) : le suivi a UNE SEULE porte d'entrée — la main de l'agent — et trente-quatre
// scripts qui le lisent. Tout ce qui est faux à l'entrée se propage trente-quatre fois. Seize
// contrôles veillent déjà, et TOUS EN LECTURE : ils refusent le commit après coup, et ils disent
// déjà tout ce qui peut être dit après. Un dix-septième ne dirait rien de neuf.
//
// CE QUI MANQUE EST À L'AUTRE BOUT : composer la ligne plutôt que la corriger. C'est exactement
// le raisonnement payé sur l'heure — cinq horodatages faux en deux jours malgré une règle
// explicite, parce que la règle disait LIRE et que le défaut était dans la RECOPIE. On ne corrige
// pas une recopie, on la rend impossible.
//
// POURQUOI ICI PLUTÔT QUE DANS UN OUTIL NEUF, et c'est une décision assumée : un outil neuf
// demanderait un nom — que seul l'utilisateur donne — et dix registres à remplir. Le composeur a
// le MÊME sujet que le garde-fou mécanique du suivi et la direction inverse ; le loger chez lui lui fait
// hériter de son kit, de son item de Ronde et de sa fiche, ce qui est précisément ce que
// l'Article 24 demande d'un nouveau venu. Si l'utilisateur préfère un outil séparé, il le
// baptisera et le déménagement sera mécanique.
//
// CE QU'IL NE FAIT SURTOUT PAS : écrire la description à ma place. Une ligne de suivi porte un
// JUGEMENT — pourquoi ce travail, ce qu'il a coûté, ce qu'on en retient. Un assistant qui le
// génèrerait produirait exactement ce que l'Article 31 appelle un outil fabriqué pour cocher une
// case. Il compose la FORME, jamais le FOND, et il REFUSE quand le fond manque.
export const COLONNES_DU_SUIVI = ["numero", "horodatage", "motCle", "sujet", "sousSujet",
  "sensibilite", "pourQui", "ouverture", "cloture", "description", "statut"];
export const CELLULES_ATTENDUES = COLONNES_DU_SUIVI.length + 2; // les deux vides des bords

// UNE CELLULE NE PEUT PAS CONTENIR DE SÉPARATEUR, et les accents graves ne protègent RIEN — c'est
// un cas réel : « L'esprit de Lia et Noé | Article 0 » a produit quatorze cellules au lieu de
// treize, et la ligne est devenue illisible pour les trente-quatre lecteurs d'un coup.
export const SEPARATEUR_INTERDIT = /\|/;

export function composerLigneDeSuivi(champs = {}, { horodatageLu = null, statutsReconnus = STATUTS_RECONNUS } = {}) {
  const manquants = COLONNES_DU_SUIVI.filter((c) => c !== "horodatage" && !String(champs[c] ?? "").trim());
  if (manquants.length) {
    return { mesurable: false, refus: "champs-manquants", pourquoi: `il manque ${manquants.length} champ(s) obligatoire(s) : ${manquants.join(", ")} — une ligne incomplète est pire qu'une ligne absente, parce qu'elle a l'air écrite` };
  }
  // L'HEURE EST SUBSTITUÉE, JAMAIS RECOPIÉE. C'est la seule protection qui a marché : cinq
  // horodatages faux en deux jours malgré une règle qui disait déjà de la LIRE (Article 32).
  if (!horodatageLu) {
    return { mesurable: false, refus: "heure-non-lue", pourquoi: "aucune heure LUE n'a été fournie : elle se substitue, elle ne se tape pas (Article 32). Le composeur refuse plutôt que d'accepter une heure dont il ne sait pas d'où elle vient" };
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(String(horodatageLu))) {
    return { mesurable: false, refus: "heure-mal-formee", pourquoi: `« ${horodatageLu} » n'a pas la forme AAAA-MM-JJTHH:MMZ — une heure mal formée passerait les contrôles de date sans être lisible par les outils` };
  }
  const etat = statutsReconnus.find((s) => s.motif.test(normaliserStatut(String(champs.statut))));
  if (!etat) {
    return { mesurable: false, refus: "statut-inconnu", pourquoi: `« ${champs.statut} » n'est pas un statut reconnu : les outils de la file ne sauraient pas si la tâche attend encore quelque chose, et par défaut ils la compteraient ouverte. Vocabulaire admis : ${statutsReconnus.map((s) => s.etat).join(", ")}` };
  }
  // LE FOND N'EST PAS COMPOSÉ, IL EST EXIGÉ. Une description qui ne dit pas POURQUOI n'est pas une
  // description, c'est une étiquette — et c'est la seule chose qu'aucun assistant ne peut fournir.
  const desc = String(champs.description).trim();
  if (desc.length < 80) {
    return { mesurable: false, refus: "fond-absent", pourquoi: `la description fait ${desc.length} caractères : une ligne de suivi porte un JUGEMENT — pourquoi ce travail, ce qu'il a coûté, ce qu'on en retient — et c'est exactement la part qu'un assistant ne doit jamais écrire à la place de l'agent` };
  }
  const avecSeparateur = COLONNES_DU_SUIVI.filter((c) => SEPARATEUR_INTERDIT.test(String(champs[c] ?? "")));
  const nettoyes = {};
  for (const c of COLONNES_DU_SUIVI) nettoyes[c] = String(champs[c] ?? "").replace(/\|/g, "∣").replace(/\s+/g, " ").trim();
  nettoyes.horodatage = String(horodatageLu);
  const ligne = "| " + COLONNES_DU_SUIVI.map((c) => nettoyes[c]).join(" | ") + " |";
  const cellules = ligne.split("|").length;
  if (cellules !== CELLULES_ATTENDUES) {
    return { mesurable: false, refus: "cellules", pourquoi: `la ligne composée rend ${cellules} cellules au lieu de ${CELLULES_ATTENDUES} — le composeur se refuse lui-même plutôt que d'écrire une ligne que les trente-quatre lecteurs du suivi ne sauront pas découper` };
  }
  return { mesurable: true, ligne, cellules, etat: etat.etat,
    separateursRemplaces: avecSeparateur,
    avertissements: avecSeparateur.length
      ? [`${avecSeparateur.length} champ(s) contenaient un séparateur de tableau, remplacé par une barre typographique : ${avecSeparateur.join(", ")}. Les accents graves ne protègent RIEN — c'est un cas réel qui a rendu une ligne illisible pour tous ses lecteurs d'un coup.`]
      : [] };
}

export function formatCompositionLines(r) {
  if (!r?.mesurable) return ["=== COMPOSITION REFUSÉE ===", `  motif : ${r?.refus}`, `  ${r?.pourquoi}`,
    "", "  LE REFUS EST LE SERVICE RENDU : une ligne mal formée passerait les seize contrôles de lecture",
    "  en apparence, puis se propagerait aux trente-quatre scripts qui lisent le suivi."];
  const L = ["=== LIGNE COMPOSÉE ===", "", r.ligne, "",
    `${r.cellules} cellules (attendu ${CELLULES_ATTENDUES}) · statut reconnu : ${r.etat}`];
  for (const a of r.avertissements) L.push(`⚠️  ${a}`);
  L.push("");
  L.push("HORS PORTÉE, et c'est délibéré : le composeur n'a pas écrit un mot de la description. Il compose la");
  L.push("FORME — l'heure substituée, les colonnes comptées, les séparateurs échappés, le statut vérifié — et il");
  L.push("REFUSE quand le FOND manque. Une ligne de suivi porte un jugement, et un jugement ne se génère pas.");
  return L;
}

function main() {
  // SOUS-COMMANDE « composer » (tâche #1447) : l'autre bout du suivi. Elle lit un objet JSON sur
  // l'entrée standard, ou un fichier passé en argument, et rend la ligne — ou le refus motivé.
  if (process.argv[2] === "composer") {
    printReliabilityNotice("check-suivi-fidelity");
    recordCliUsage("check-suivi-fidelity");
    const chemin = process.argv[3];
    let champs = {};
    try { champs = JSON.parse(readFileSync(chemin, "utf8")); }
    catch {
      console.log("Usage : node scripts/check-suivi-fidelity.mjs composer <champs.json>");
      console.log("  Le fichier porte les dix champs de fond ; l'horodatage est LU par l'outil, jamais fourni.");
      console.log(`  Champs attendus : ${COLONNES_DU_SUIVI.filter((c) => c !== "horodatage").join(", ")}`);
      process.exitCode = 2;
      return;
    }
    // L'HEURE EST LUE ICI, par l'outil lui-même : la faire fournir par l'appelant rouvrirait
    // exactement la porte que cette sous-commande existe pour fermer.
    let lue = null;
    try { lue = (sh("node scripts/agent-du-temps.mjs").match(/2026-\d{2}-\d{2}T\d{2}:\d{2}Z/) ?? [])[0] ?? null; } catch { lue = null; }
    const r = composerLigneDeSuivi(champs, { horodatageLu: lue });
    for (const l of formatCompositionLines(r)) console.log(l);
    if (!r.mesurable) process.exitCode = 1;
    return;
  }
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
  // LA PORTÉE EST DITE, Y COMPRIS QUAND ELLE NE TROUVE RIEN (2026-09-29, tâche #1204). Cette
  // section ne lit que `sessions/` ; les archives portent 605 des 1 086 lignes du registre. Une
  // tâche encore OUVERTE là-bas est exactement celle qu'on oubliera, l'archivage répondant à la
  // taille d'un fichier et jamais à la clôture d'une tâche. Il n'y en a aucune aujourd'hui — et
  // c'est écrit noir sur blanc plutôt que tu, parce qu'un angle mort vide ne prévient pas quand il
  // se remplit, et qu'un silence se lit exactement comme un « rien à signaler » (leçons L5 et L11).
  const archivees = findTachesOuvertesArchivees();
  const combien = archivees.reduce((n, r) => n + r.hits.length, 0);
  console.log(combien === 0
    ? "\nPortée : cette section lit les sessions vivantes. Vérifié aussi dans les archives : 0 tâche encore ouverte y dort."
    : `\n⚠️ ${combien} tâche(s) encore OUVERTE(S) dorment dans des fichiers ARCHIVÉS — l'archivage répond à la taille d'un fichier, jamais à la clôture d'une tâche :`);
  for (const { file, hits } of archivees) for (const h of hits) console.log(`   - [${h.statut}] ${file} — ${h.row}`);

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
  // (2026-09-27, tâche #1034) — sur un dépôt sans suivi, l'outil mourait ici au lieu de dire
  // simplement qu'il n'y a rien à vérifier. Même classe que #1043, forme « dossier ».
  const dossierSessions = listerLeDossierGouvernant(SESSIONS_DIR);
  if (!dossierSessions.trouve) {
    for (const l of ligneDocumentAbsent(dossierSessions, { outil: "check-suivi-fidelity", aQuoiCaSert: "il y relit chaque fichier de session du suivi" })) console.log(l);
    return;
  }
  const allSessions = dossierSessions.fichiers.filter((f) => f.endsWith(".md"));
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

  // LES DEUX GARDE-FOUS DE FORME DE LA LIGNE (2026-09-27, tâche #999). Ils sortent ici, dans le
  // rapport, et pas seulement en export : un mécanisme qui ne sort jamais du script est une
  // intention (leçon L2 — trois fois payée dans ce dépôt).
  console.log("\n=== Garde-fou cases du rituel (elles n'acceptent que « OUI » ou rien) ===\n");
  const rituel = findCasesDeRituelMalRemplies();
  if (!rituel.mesurable) {
    console.log(`PAS MESURÉ — ${rituel.pourquoi}`);
  } else if (!rituel.ecarts.length) {
    console.log(`Aucune case mal remplie sur ${rituel.lignesLues} ligne(s) au format complet — les deux cases restent lisibles par tous les garde-fous qui s'appuient dessus.`);
  } else {
    console.log(`${rituel.ecarts.length} case(s) portent une DATE au lieu de « OUI » ou rien, sur ${rituel.lignesLues} ligne(s) au format complet.`);
    for (const e of rituel.ecarts.slice(0, 12)) console.log(`   - n°${e.numero} — case « ${e.champ} » = ${e.valeur}`);
    if (rituel.ecarts.length > 12) console.log(`   … et ${rituel.ecarts.length - 12} autre(s).`);
    console.log("   Conséquence : toute lecture de ces deux cases est AVEUGLE sur ces lignes — le tri de chantier n'y voit pas de clôture oubliée, le contrôle de rituel n'y voit pas de rituel sauté, et les deux rendent un vert qui se lit comme une bonne nouvelle.");
  }

  console.log("\n=== Garde-fou lignes mal formées (plus de cellules que le format n'en porte) ===\n");
  const malFormees = findLignesMalFormees();
  if (!malFormees.mesurable) {
    console.log(`PAS MESURÉ — ${malFormees.pourquoi}`);
  } else if (!malFormees.ecarts.length) {
    console.log(`Aucune ligne mal formée sur ${malFormees.lignesLues} lue(s) — le lecteur canonique du registre les voit toutes.`);
  } else {
    console.log(`${malFormees.ecarts.length} ligne(s) portent des cellules en trop, sur ${malFormees.lignesLues} lue(s).`);
    for (const e of malFormees.ecarts.slice(0, 12)) console.log(`   - n°${e.numero} — ${e.cellules} cellules (${e.surplus} de trop) — ${e.file}`);
    console.log("   Deux causes, qui se réparent à l'opposé : une barre verticale non échappée dans le Détail (elle s'écrit `\\|`), ou une cellule surnuméraire tapée en écrivant la ligne.");
  }

  // L'ABSTENTION CESSE D'ÊTRE SILENCIEUSE (2026-09-28, tâche #1087). Une ligne dont la criticité
  // n'est pas reconnue est écartée de TOUS les contrôles ci-dessus — 66 lignes sur 364 l'étaient
  // sans que rien ne le dise. Le compteur s'affiche même à zéro : c'est le seul moyen que le
  // prochain trou du vocabulaire remonte le jour où il apparaît.
  // LE VOCABULAIRE DES STATUTS (2026-09-28, tâche #1088) : deux tâches réelles portaient « FAIT »,
  // claires pour un lecteur, invisibles pour tous les outils de la file. Affiché même à zéro.
  const statutsInconnus = findStatutsNonReconnus();
  if (!statutsInconnus.mesurable) {
    console.log(`⚪ PAS MESURÉ — ${statutsInconnus.pourquoi}`);
  } else if (!statutsInconnus.ecarts.length) {
    console.log(`Tous les statuts sont dans le vocabulaire reconnu, sur ${statutsInconnus.lignesLues} ligne(s).`);
  } else {
    console.log(`⚠️ ${statutsInconnus.ecarts.length} statut(s) hors vocabulaire sur ${statutsInconnus.lignesLues} ligne(s) — les outils de la file les comptent OUVERTS par défaut.`);
    for (const e of statutsInconnus.ecarts.slice(0, 12)) console.log(`   - n°${e.numero} — « ${e.statut} » — ${e.file}`);
    console.log("   À corriger dans la ligne, jamais en élargissant le vocabulaire à chaque synonyme : accepter « FAIT », « OK », « réglé » finirait par tout accepter, donc par ne plus rien signifier.");
  }

  const sansCriticite = findLignesSansCriticiteReconnue();
  if (!sansCriticite.mesurable) {
    console.log(`⚪ PAS MESURÉ — ${sansCriticite.pourquoi}`);
  } else if (!sansCriticite.ecarts.length) {
    console.log(`Aucune ligne écartée faute de criticité reconnue, sur ${sansCriticite.lignesLues} lue(s) — donc aucune ligne n'échappe en silence aux contrôles ci-dessus.`);
  } else {
    console.log(`⚠️ ${sansCriticite.ecarts.length} ligne(s) sur ${sansCriticite.lignesLues} sont ÉCARTÉES DE TOUS LES CONTRÔLES faute de criticité reconnue.`);
    for (const e of sansCriticite.ecarts.slice(0, 12)) console.log(`   - n°${e.numero} — valeur lue : « ${e.valeur} » — ${e.file}`);
    console.log("   Deux causes, et la seconde est la plus fréquente : soit la valeur est fautive, soit le vocabulaire du lecteur (MOTIF_CRITICITE) a pris du retard sur celui qu'emploie réellement le registre.");
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
  imprimerPlanDaction(plan);
}

// LE PASSAGE S'ENREGISTRE : la raison complète vit à côté de `recordCliUsage()` (scripts/tool-usage.mjs).
// ─────────────────────────────────────────────────────────────────────────────────────────────
// ÉCRIRE DANS UNE LIGNE DU SUIVI SANS LA CASSER (2026-09-28, tâche #1071)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// LE DÉFAUT QUE CES QUATRE FONCTIONS RENDENT IMPOSSIBLE, et il a été commis TROIS FOIS dans la même
// nuit, de bonne foi à chaque fois. Une ligne du registre s'écrit `| a | b | c |`. Découpée sur
// « | », elle rend `["", "a", "b", "c", ""]` : le dernier élément n'est PAS la dernière cellule,
// c'est la chaîne vide qui suit la barre finale. Écrire dedans AJOUTE une colonne et décale tout.
//
// CE QUE ÇA COÛTE : le statut se retrouve dans le Détail, le Détail dans la cellule « pour qui », et
// le lecteur canonique déclare la ligne illisible — donc la tâche devient invisible à tout ce qui
// compte les tâches. Rien ne se voit à l'œil : « une ligne mal formée s'affiche presque
// normalement », comme le disait déjà la tâche #826.
//
// POURQUOI UN GESTE OUTILLÉ PLUTÔT QU'UNE ATTENTION SOUTENUE : le défaut a été commis sur #604, puis
// sur #765 ET #766, une heure après avoir corrigé le premier. Une erreur qu'on répète après l'avoir
// vue n'est pas un défaut d'attention, c'est un geste mal outillé (leçon L37 : corriger la CLASSE).
//
// POURQUOI ICI ET PAS DANS UN FICHIER NEUF : ce module est déjà le PROPRIÉTAIRE du format des
// lignes de suivi — il le lit, il le valide, il en connaît les cinq variantes historiques. Mettre
// l'écriture ailleurs aurait créé un second détenteur du même format, ce qui est très exactement la
// façon dont deux lectures d'une même chose finissent par diverger (Article 24). Et un fichier de
// plus aurait réclamé un blueprint, une fiche et neuf inscriptions de registre pour quatre
// fonctions de quatre lignes : l'Article 31 dit d'ÉTENDRE avant de construire.

// Les vraies cellules d'une ligne de tableau markdown, sans les deux vides de bordure.
export function cellulesDe(ligne = "") {
  const parts = String(ligne).split("|");
  if (parts.length < 3) return [];
  // La bordure gauche est toujours là sur une ligne de tâche ; la droite peut manquer si quelqu'un
  // l'a mangée — on ne la retire que si elle est VIDE, sinon on effacerait une vraie cellule.
  const debut = parts[0].trim() === "" ? 1 : 0;
  const fin = parts[parts.length - 1].trim() === "" ? parts.length - 1 : parts.length;
  return parts.slice(debut, fin);
}

// Recompose une ligne à partir de ses vraies cellules, bordures comprises.
export function ligneDe(cellules = []) {
  return `|${cellules.join("|")}|`;
}

// Remplace UNE cellule par son index depuis la fin (0 = la dernière vraie cellule, donc le statut),
// et rend la ligne recomposée. C'est le geste qui manquait : il ne peut pas ajouter de colonne.
export function avecCelluleDepuisLaFin(ligne = "", indexDepuisLaFin = 0, valeur = "") {
  const c = cellulesDe(ligne);
  if (!c.length) return ligne;
  const i = c.length - 1 - indexDepuisLaFin;
  if (i < 0) return ligne;
  c[i] = valeur;
  return ligneDe(c);
}

// Le geste courant : clôturer une tâche, c'est écrire son Détail (avant-dernière cellule) et son
// statut (dernière). Les deux d'un coup, parce que les séparer est justement ce qui a raté.
export function avecDetailEtStatut(ligne = "", detail = null, statut = null) {
  let out = ligne;
  if (detail !== null) out = avecCelluleDepuisLaFin(out, 1, detail);
  if (statut !== null) out = avecCelluleDepuisLaFin(out, 0, statut);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) { recordCliUsage("check-suivi-fidelity"); main(); }
