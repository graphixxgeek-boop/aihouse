// ICEBERG: membre
// SAFE-EXPORT (2026-09-22, nom donné par l'utilisateur) — le scan d'exportabilité et de
// lisibilité-par-une-autre-IA. Septième Gardien sacré du code, par sa COUCHE LÉGÈRE seulement.
//
// SA VOCATION, dans ses mots : « pointer les zones qui pourraient creer de la confusion, conduire
// une IA a mal interpreter » — et répondre à deux questions distinctes : est-ce que l'Agence est
// exportable ? est-ce que le code est bien construit pour qu'une autre IA s'y retrouve ?
//
// POURQUOI SEULEMENT SA COUCHE LÉGÈRE EST GARDIEN SACRÉ, et c'est le précédent exact
// d'ALWAYS-NEW-CODE : le critère d'appartenance est DOUBLE — délivrer un vrai scan de qualité ET
// tourner gratuitement, mécaniquement, à chaque commit. Le vrai jugement « est-ce qu'une autre IA
// s'y retrouve » demande du raisonnement payant ; les INDICES de ce jugement, eux, sont mécaniques
// et gratuits. Ce sont eux qui tournent à chaque commit.
//
// IL AVERTIT, IL PROPOSE, IL NE BLOQUE JAMAIS (calibrage explicite). Un gardien qui bloque sur un
// sujet sans rapport avec le travail en cours pousse à désactiver le crochet — et on perd tout.

// LE DÉCOR PARTAGÉ (2026-09-27) : les lectures par défaut passent par le cache commun de
// lib-shell, invalidé par mtime+taille+inode — un fichier modifié est donc bien relu. Les
// paramètres restent injectables : un test qui passe son propre `lire` n'est pas touché.
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, cpSync, statSync } from "node:fs";
import { lireFichierPartage } from "./lib-shell.mjs";
import { mesurerCorpus, ligneCorpus, findGardiensSansMesureDeCorpus, formatGardiensSansMesureLines, GARDIENS_SACRES } from "./corpus-mesure.mjs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { printReliabilityNotice, porteeDe, sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
// LE REGISTRE DES JOURNAUX LOCAUX VIT CHEZ DOC-REPORT, et il est LU ici plutôt que recopié
// (Article 24) : un journal ajouté là-bas entre dans ce contrôle sans que personne y pense.
import { LOCAL_JOURNALS } from "./doc-report.mjs";
import { printReportHeader, planDactionDepuisEcarts, buildPlanDaction, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";
import { loadJsonArray } from "./lib-json.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES DEUX CIBLES — « l'outil qui gere le scan d'exportabilité peut le faire pour deux choses :
// l'agence et/ou le projet ». Ce ne sont pas deux périmètres de fichiers, ce sont deux QUESTIONS
// différentes, et les confondre donnerait un verdict inutilisable : l'Agence doit être exportable
// vers un AUTRE projet (donc rien de propre à cette maison ne doit y fuir), le projet doit être
// reprenable par une AUTRE IA (donc tout doit y être compréhensible sans contexte). Un fichier peut
// très bien être parfaitement reprenable et totalement non exportable.
export const CIBLES = {
  agence: { question: "l'outillage de travail est-il exportable vers un autre projet ?", chercheFuites: true },
  projet: { question: "une autre IA reprendrait-elle ce code sans le casser ?", chercheFuites: false },
};

// LES NIVEAUX — « il a differents niveaux de performance d'execution, comme on a vu ». Même échelle
// d'esprit que CHECK-LEVEL-TARGET : ce qui distingue les niveaux n'est pas la profondeur du
// raisonnement (le gratuit n'en fait aucun), c'est l'ÉTENDUE de ce qui est lu.
export const NIVEAUX = {
  leger: { cout: "gratuit", portee: "les fichiers touchés par les derniers commits", raisonnement: false },
  moyen: { cout: "gratuit", portee: "une zone entière", raisonnement: false },
  profond: { cout: "payant", portee: "une zone, avec un vrai jugement de lisibilité", raisonnement: true },
};

// LA DÉCLARATION — son choix, et c'est le plus solide des trois proposés : le fichier annonce
// lui-même s'il est générique. L'outil ne devine rien, il lit une intention écrite.
//
// LA PROPRIÉTÉ QUI REND CE CHOIX AUTO-RENFORÇANT : un blueprint qui OUBLIE de se déclarer est
// lui-même un écart signalé. La règle se répare donc toute seule au lieu de se périmer — et c'est
// exactement ce que l'Article 24 demande d'une construction évolutive.
// La formule réelle du dépôt est « blueprint exportable », lue dans les fichiers plutôt que
// supposée — mon premier marqueur cherchait « blueprint générique » et déclarait 21 blueprints
// sur 26 en défaut. Le chiffre lui-même était l'alerte : quand un détecteur accuse presque tout,
// c'est presque toujours lui qui a tort, et vérifier avant de rapporter a coûté deux minutes
// contre un rapport entièrement faux.
export const MARQUEUR_GENERIQUE = /blueprint exportable|blueprint générique|générique réutilisable|réutilisable tel quel|gabarit générique/i;
export const MARQUEUR_SPECIFIQUE = /instanciation|propre à ce projet|spécifique à ce/i;

// DEUXIÈME RESSERRAGE (2026-09-23), et il corrige DEUX bugs qui se cachaient l'un l'autre.
//
// BUG 1 — le marqueur exigeait « générique réutilisable » collés. Trois blueprints écrivaient
// « Document générique, réutilisable sur un autre projet » : une virgule les faisait échouer. Le
// commentaire juste au-dessus raconte déjà ce resserrage une première fois ; la leçon n'avait pas
// été poussée assez loin, et un détecteur trop étroit accuse les conformes — le même patron que
// findOutilsSansPlanDaction() le même jour.
//
// BUG 2, et c'est le plus retors parce qu'il RETOURNE le verdict au lieu de l'affaiblir : une fois
// le test générique échoué, le texte tombait sur MARQUEUR_SPECIFIQUE, qui contient /instanciation/.
// Or ces en-têtes disent « Instanciation : docs/referentiel/x.md » — c'est-à-dire qu'ils POINTENT
// vers leur instanciation, ce qui est la preuve même qu'ils sont le document générique. Le mot qui
// prouvait leur généricité les faisait donc classer « spécifique ».
//
// La règle devient : un en-tête est générique s'il porte une des formules exactes du dépôt, OU s'il
// dit « générique » ET une notion de réemploi — deux signaux ensemble, jamais un mot isolé qui
// pourrait venir d'une phrase du genre « contrairement au blueprint générique... ».
export const MOTS_DE_REEMPLOI = /réutilisable|exportable|autre projet|tout projet/i;

export function declarationDuFichier(texte = "") {
  const entete = texte.slice(0, 2000);
  if (MARQUEUR_GENERIQUE.test(entete)) return "générique";
  if (/\bgénérique\b/i.test(entete) && MOTS_DE_REEMPLOI.test(entete)) return "générique";
  if (MARQUEUR_SPECIFIQUE.test(entete)) return "spécifique";
  return "non déclarée";
}

// ————————————————————————————————————————————————————————————————————————
// LES QUATRE DÉTECTEURS — les quatre priorités qu'il a retenues, toutes les quatre
// ————————————————————————————————————————————————————————————————————————

// 1. CE QUI NE S'EXPORTE PAS. Le défaut qu'il a lui-même attrapé sur EVAL-DH : des initiales dans
// un livrable d'une agence conçue pour être exportée. On ne cherche QUE dans les fichiers déclarés
// génériques — « Lia » dans une fiche spécifique est parfaitement normal, et le signaler noierait
// les vrais cas.
// LA FRONTIÈRE DE MOT SE LIT SUR LES LETTRES, JAMAIS SUR `\b` (corrigé le 2026-09-25, tâche #514).
// LE DÉFAUT EST MESURÉ, et il durait depuis l'écriture de ce détecteur : `\bNoé\b` ne pouvait
// JAMAIS correspondre à quoi que ce soit. En JavaScript sans le drapeau `u`, `é` n'est pas un
// caractère de mot, donc la frontière exigée APRÈS lui n'existe dans aucun texte — vérifié sur
// « Noé répond », « Noé. », « Noé, dit-il », « parle à Noé » : faux les quatre fois.
// **SAFE-EXPORT était aveugle au second personnage du projet**, et rien ne pouvait le dire : un
// motif qui ne correspond jamais rend zéro, ce qui se lit exactement comme un fichier propre.
// Trouvé en écrivant le test de la correction voisine — pas en relisant le motif, qui paraît juste.
// LA CORRECTION EST UN PRINCIPE, jamais un mot rattrapé : la frontière se définit comme « pas une
// lettre », ce qui couvre d'avance tout nom accentué qu'on ajoutera demain (Article 24).
export const MARQUES_DE_CE_PROJET = /(?<!\p{L})(?:Lia|Noé)(?!\p{L})|la maison|l'enquête|Gemini|aihouse/u;
export function findFuitesDeSpecificite(fichiers = [], { readFileImpl = lireFichierPartage, root = ROOT } = {}) {
  const fuites = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    if (declarationDuFichier(texte) !== "générique") continue;
    const lignes = texte.split("\n");
    const touchees = lignes
      .map((l, i) => ({ ligne: i + 1, texte: l, m: l.match(MARQUES_DE_CE_PROJET) }))
      .filter((x) => x.m);
    if (touchees.length) fuites.push({ fichier: f, occurrences: touchees.length, exemple: touchees[0].texte.trim().slice(0, 100), ligne: touchees[0].ligne });
  }
  return fuites;
}

// 2. CE QUI PEUT ÊTRE MAL COMPRIS — un nom propre employé sans être défini nulle part. C'est la
// dette de reprise que l'Article 27 nomme explicitement : « un nom propre sans définition
// atteignable est une dette de reprise, au même titre qu'un chemin cassé ».
export function findTermesNonDefinis(termesEmployes = [], { root = ROOT, exists = existsSync } = {}) {
  return termesEmployes
    .filter((t) => {
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      // Un terme est « défini » s'il a une fiche, un blueprint ou un registre — les trois endroits
      // où ce projet définit ses noms propres. Chercher ailleurs serait deviner.
      return !exists(join(root, `docs/referentiel/${slug}.md`))
        && !exists(join(root, `docs/${slug}-blueprint.md`))
        && !exists(join(root, `docs/${slug}/index.md`));
    })
    .map((t) => ({ terme: t, pourquoi: "employé sans définition atteignable — une autre IA devra deviner, et devinera mal" }));
}

// 3. CE QUI N'A PAS DE RAISON ÉCRITE. Le plus subtil des quatre, et le plus coûteux quand il
// manque : un mécanisme qui paraît redondant ou trop prudent se fait supprimer par le prochain
// agent qui croit nettoyer — réintroduisant un bug déjà corrigé une fois (Article 19 pris par
// l'autre bout, Article 27).
//
// L'HEURISTIQUE EST DÉCLARÉE FAIBLE : on repère une fonction exportée sans AUCUN commentaire dans
// les lignes qui la précèdent. Ça ne prouve pas l'absence de raison, ça signale une absence
// d'explication — deux choses différentes, et le rapport le dit.
export function findMecanismesSansRaison(code = "", { fichier = "" } = {}) {
  const lignes = code.split("\n");
  const sans = [];
  for (let i = 0; i < lignes.length; i++) {
    const m = lignes[i].match(/^export (?:async )?function (\w+)/);
    if (!m) continue;
    // LA FENÊTRE DE TROIS LIGNES LAISSAIT FUIR LE COMMENTAIRE DU VOISIN (corrigé le 2026-09-23,
    // trouvé en écrivant une fixture qui devait la faire rougir, tâche #585) : dans un fichier
    // dense, les trois lignes qui précèdent une fonction contiennent souvent la fin du commentaire
    // de la fonction PRÉCÉDENTE — et celle-ci passait alors pour expliquée. On remonte donc
    // jusqu'à la première ligne non vide, et on exige qu'elle soit un commentaire : l'explication
    // doit toucher la fonction qu'elle explique, ce qui est exactement ce que l'Article 27 demande
    // (« le POURQUOI vit À CÔTÉ du QUOI »).
    let j = i - 1;
    while (j >= 0 && lignes[j].trim() === "") j--;
    const explique = j >= 0 && /^\s*(\/\/|\/\*|\*)/.test(lignes[j]);
    if (!explique) sans.push({ fichier, fonction: m[1], ligne: i + 1 });
  }
  return sans;
}

// 3bis. LE MÊME DÉTECTEUR, MAIS BRANCHÉ — ET RESSERRÉ SUR CE QUE L'ARTICLE 27 CRAINT VRAIMENT
// (2026-09-23, tâche #585).
//
// CE QU'ON A TROUVÉ EN OUVRANT LE SUJET, et c'est le défaut que ce projet n'arrête pas de se
// trouver à lui-même : `findMecanismesSansRaison` existait, fonctionnait, était testée — et
// n'était APPELÉE PAR AUCUN main(). Elle avait été écrite pour l'exigence X6 du référentiel des
// standards, qui déclarait dans le même temps que X6 n'était vérifiée par « personne ». Les deux
// affirmations étaient vraies séparément et fausses ensemble. Le détecteur échappait même au
// chasseur de détecteurs muets, parce qu'une fonction appelée par la suite de tests compte comme
// protégée — ce qui est juste quand le test la fait tourner CONTRE LE DÉPÔT, et faux ici : les
// deux assertions ne lui donnaient que deux chaînes littérales. Un test qui se parle à lui-même
// (leçon L16) ne branche rien.
//
// POURQUOI ON NE CÂBLE PAS LA VERSION LARGE : mesurée sur le vrai dépôt, elle rend 298 fonctions
// exportées sans explication sur 74 fichiers. Ce n'est pas un signal, c'est un mur — et un
// garde-fou qui accuse à tort cesse d'être lu (leçon L4). La plupart de ces fonctions portent leur
// raison dans leur nom : `formatXp`, `loadVerdicts` n'ont aucun POURQUOI à écrire.
//
// CE QUE L'ARTICLE 27 CRAINT, LUI, EST PRÉCIS : « un mécanisme qui semble redondant ou trop
// prudent se fait supprimer par le prochain agent qui croit nettoyer ». Cette description ne vise
// pas n'importe quelle fonction : elle vise les GARDE-FOUS. Un garde-fou ressemble toujours à du
// zèle tant qu'on ignore le bug qu'il a coûté. C'est donc sur eux, et eux seuls, que l'absence
// d'explication est un vrai risque — 38 cas réels, un nombre qu'on peut regarder.
// 3ter. LA RAISON SUPPRIMÉE — le porteur mécanique de l'Article 19 (2026-09-23, tâche #616).
//
// POURQUOI ICI ET PAS AILLEURS. X6 ci-dessus compte les garde-fous qui n'ont PAS d'explication.
// C'est la moitié du sujet. L'Article 19 en nomme l'autre, et en des termes très précis : « le
// retirer ou le simplifier sans avoir d'abord compris cette raison risque de réintroduire un bug
// déjà résolu une fois ». Ce que craint l'Article 19 n'est donc pas une explication manquante,
// c'est une explication qui DISPARAÎT — et rien ne regardait ça. Les deux détecteurs vivent
// ensemble parce qu'ils gardent la même chose (le POURQUOI à côté du QUOI) par ses deux bouts.
//
// LA DIFFÉRENCE QUI FAIT TOUT : « déplacée » n'est pas « supprimée ». Le jour même où ce détecteur
// a été écrit, sept blocs de commentaires avaient migré d'un fichier à un autre avec le code
// qu'ils expliquaient — une version naïve aurait hurlé sept fois sur un déménagement parfaitement
// propre, et un garde-fou qui accuse à tort cesse d'être lu (leçon L4). On cherche donc l'empreinte
// du texte supprimé dans le dépôt APRÈS le commit : s'il est encore quelque part, rien n'est perdu.
//
// POURQUOI DES MARQUEURS STRICTS plutôt que « tout commentaire supprimé » : un commentaire
// ordinaire qui disparaît avec le code qu'il décrivait est un nettoyage normal, pas une perte.
// Quatre marqueurs, et eux seuls, signalent qu'un commentaire porte une RAISON qu'aucun diff ne
// redonnera : une date, une demande de l'utilisateur, une leçon déjà payée, une tâche du suivi.
// Strict par choix : mieux vaut manquer une perte que crier sur un ménage (même calibrage que la
// version resserrée de X6 juste au-dessus).
export const MARQUEURS_DE_RAISON = [
  [/\b20\d\d-\d\d-\d\d\b/, "porte une date — donc le moment et le contexte d'une décision"],
  [/demande explicite/i, "cite une demande de l'utilisateur — jamais redéductible d'un diff"],
  [/le\u00e7on L\d+/i, "cite une leçon déjà payée par une erreur réelle"],
  [/t\u00e2che #\d+/i, "renvoie à une tâche du suivi durable"],
];

const EST_UN_COMMENTAIRE = /^\s*(\/\/|\*|\/\*|#)/;

// Empreinte volontairement grossière : on enlève les marqueurs de commentaire, on écrase les
// espaces et la casse, et on garde les dix premiers mots. Un texte réindenté ou recollé autrement
// reste reconnu ; deux commentaires différents ne partagent pas dix mots consécutifs.
export function empreinteDeRaison(texte = "") {
  // Les marqueurs se retirent en BOUCLE, jamais une seule fois : une puce dans un commentaire
  // (« // * un point ») en empile deux, et l'astérisque restant devenait un mot de l'empreinte —
  // donc deux écritures du même texte ne se reconnaissaient plus. Trouvé par un test qui l'a
  // refusé, jamais à la relecture.
  const mots = String(texte)
    .replace(/^(?:\s*(?:\/\/+|\/\*+|\*+|#+))+/, " ")
    .replace(/\*\//g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return mots.slice(0, 10);
}

export const MOTS_MINIMUM_EMPREINTE = 5;

export function findRaisonsPerdues(diff = "", { contenuActuel = "", minimumMots = MOTS_MINIMUM_EMPREINTE } = {}) {
  // Trois états, jamais deux : un diff absent ne dit pas « aucune raison perdue », il dit qu'on
  // n'a pas pu regarder (leçon L13).
  if (!String(diff).trim()) {
    return { mesurable: false, perdues: [], pourquoi: "aucun diff fourni — ce silence ne dit rien sur les raisons perdues, seulement qu'on n'a pas pu les chercher" };
  }
  const apres = String(contenuActuel).toLowerCase().replace(/\s+/g, " ");
  const perdues = [];
  let fichier = "";
  for (const ligne of String(diff).split("\n")) {
    const entete = ligne.match(/^\+\+\+ b\/(.+)$/);
    if (entete) { fichier = entete[1]; continue; }
    if (!ligne.startsWith("-") || ligne.startsWith("---")) continue;
    const texte = ligne.slice(1);
    if (!EST_UN_COMMENTAIRE.test(texte)) continue;
    const marqueur = MARQUEURS_DE_RAISON.find(([motif]) => motif.test(texte));
    if (!marqueur) continue;
    const empreinte = empreinteDeRaison(texte);
    // Trop court pour être identifié sans risque de confusion : on s'abstient plutôt que d'accuser
    // sur une empreinte que n'importe quel autre commentaire pourrait porter.
    if (empreinte.length < minimumMots) continue;
    if (apres.includes(empreinte.join(" "))) continue; // DÉPLACÉE, pas supprimée
    perdues.push({ fichier, texte: texte.trim().slice(0, 140), pourquoi: marqueur[1] });
  }
  return { mesurable: true, perdues };
}

export const PREFIXES_GARDE_FOU = /^(?:find|check|audit|verif)/i;


// LE PÉRIMÈTRE NE SE DEVINE PAS AU NOM : IL SE LIT (Article 24, et la première version de ce bloc
// s'est fait prendre en flagrant délit). Le filtre par convention de nommage ci-dessus a été écrit
// d'abord, puis confronté aux registres réels — qui ont immédiatement rendu huit garde-fous bien
// vivants que ce filtre ratait en silence : `doitIntercalerUnTourAutonome`, `filtrerDejaTranches`,
// `relanceCircleTasks`, `etatConnexionProcessGardien`... La convention était donc DÉJÀ périmée au
// moment où on s'apprêtait à s'appuyer dessus, ce qui est exactement la panne que l'Article 24
// décrit : une liste recopiée qui cesse d'être vraie sans prévenir.
//
// LE PÉRIMÈTRE RÉEL est donc l'UNION de trois sources, dont deux sont lues à l'exécution :
//   · les fonctions que le référentiel des standards nomme comme VÉRIFICATEUR d'une exigence ;
//   · les fonctions que le registre des leçons nomme comme PORTEUR d'une leçon ;
//   · celles dont le nom suit la convention (le filet, pour un garde-fou qu'aucun registre ne cite
//     encore — il en naît à chaque chantier).
// Un garde-fou nouveau rejoint ce périmètre le jour où un registre le cite, sans qu'une ligne
// bouge ici. C'est la différence entre lire et recopier.
const PORTEUR_DE_LECON = /\*\*Port[ée] par\*\*\s*:([^\n]*)/g;
export const REGISTRES_CITANT_DES_GARDE_FOUS = ["docs/referentiel/standards.md", "docs/referentiel/lecons.md"];
export function gardeFousCitesParLesRegistres({ root = ROOT, readFileImpl = lireFichierPartage, registres = REGISTRES_CITANT_DES_GARDE_FOUS } = {}) {
  const cites = new Set();
  const ajouter = (fragment) => { for (const m of String(fragment).matchAll(/`(\w+)\(\)`/g)) cites.add(m[1]); };
  for (const r of registres) {
    let texte;
    try { texte = readFileImpl(join(root, r), "utf8"); } catch { continue; }
    // Un PORTEUR : la ligne qui le déclare, jamais une mention en passant ailleurs dans la fiche.
    for (const m of texte.matchAll(PORTEUR_DE_LECON)) ajouter(m[1]);
    // Un VÉRIFICATEUR : la 3e colonne d'une ligne de tableau, jamais le texte qui l'entoure.
    for (const ligne of texte.split("\n")) {
      if (!ligne.startsWith("|")) continue;
      const colonnes = ligne.split("|").map((c) => c.trim());
      if (colonnes.length >= 5) ajouter(colonnes[3]);
    }
  }
  return cites;
}

// EST UN GARDE-FOU ce qu'un registre déclare tel, ou ce que la convention de nommage désigne.
export function estUnGardeFou(nom, cites = new Set()) {
  return cites.has(nom) || PREFIXES_GARDE_FOU.test(nom);
}

export function findGardeFousSansRaison(fichiers = [], { readFileImpl = lireFichierPartage, root = ROOT, cites } = {}) {
  const perimetre = cites ?? gardeFousCitesParLesRegistres({ root, readFileImpl });
  const sans = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    for (const m of findMecanismesSansRaison(texte, { fichier: f })) if (estUnGardeFou(m.fonction, perimetre)) sans.push(m);
  }
  return sans;
}

// Les fichiers source du projet, PARCOURUS plutôt qu'énumérés (Article 24) : un fichier neuf entre
// dans le périmètre le jour où il est écrit, sans qu'une liste soit tenue à jour quelque part.
const DOSSIERS_SOURCE = ["scripts", "lib", "app"];
const IGNORES = /node_modules|\.next|\.sites-runtime|\.git/;
export function fichiersSourcesDuProjet({ root = ROOT, listDirImpl = readdirSync, dossiers = DOSSIERS_SOURCE } = {}) {
  const trouves = [];
  const parcourir = (relatif) => {
    let entrees;
    try { entrees = listDirImpl(join(root, relatif), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const chemin = `${relatif}/${e.name}`;
      if (IGNORES.test(chemin)) continue;
      if (e.isDirectory()) parcourir(chemin);
      else if (/\.(mjs|ts|tsx)$/.test(e.name)) trouves.push(chemin);
    }
  };
  for (const d of dossiers) parcourir(d);
  return trouves;
}

// 4. CE QUI DÉPEND D'UN OUTIL PARTICULIER. L'Article 27 l'interdit explicitement dans ce qui fait
// loi : « une IA qui arrive sans le gestionnaire de tâches de Claude Code, sans ses crochets git ou
// sans ses fenêtres de questions doit pouvoir travailler avec les documents seuls ».
export const DEPENDANCES_OUTILLAGE = /TaskCreate|TaskUpdate|AskUserQuestion|SendUserFile|crochet post-commit|crochet pre-commit|Claude Code/;
// `quelleQueSoitLaDeclaration` (2026-09-26, tâche #909) — AJOUTÉ PARCE QUE SON ABSENCE PRODUISAIT
// UN FAUX VERT, attrapé au premier passage du relai de modèle. Le filtre « ne scanner que les
// documents qui SE DÉCLARENT génériques » est juste pour la portabilité d'un blueprint : un
// document spécifique au projet a le droit de nommer l'outillage du projet. Mais le relai de modèle
// pose une AUTRE question — « une IA sans cet outillage peut-elle s'en servir ? » — et là le filtre
// faisait sauter CLAUDE.md et les règles de travail, c'est-à-dire exactement les documents à
// examiner. Le résultat était « aucune dépendance » sur trois documents jamais ouverts : la forme
// la plus dangereuse du zéro (leçon L11). Le comportement par défaut ne change pas d'un iota.
// UNE MENTION N'EST PAS UNE CONSIGNE (2026-09-27, tâche #910), et le relai le prouvait par l'absurde.
// Il signalait « 4 dépendances à un outillage particulier » dans les documents de mémoire et de
// conduite. Lues une par une, la quasi-totalité n'en étaient pas :
//   · « le crochet pre-commit la lance à chaque commit » — du RÉCIT au passé, qui raconte ce qui
//     s'est produit ici. Une IA sans ce crochet le comprend parfaitement ; rien ne lui est demandé.
//   · « tout agent (Claude Code ou autre) » — une phrase qui DÉCLARE l'indépendance, comptée comme
//     une dépendance.
//   · la phrase de l'Article 27 elle-même — le détecteur accusait LA RÈGLE QUI INTERDIT LA CHOSE.
//   · « le livrer en fichier séparé (`SendUserFile`) » — le GESTE est nommé, l'outil n'est que le
//     mécanisme concret entre parenthèses : transposable tel quel.
//
// UN SIGNAL QUI MÉLANGE LA RÈGLE ET SON CONTRE-EXEMPLE NE SE TRAITE PAS : on ne peut ni le corriger
// ni le classer sans rouvrir chaque ligne, donc on cesse de le lire (leçon L4).
//
// LE PARTAGE EST CELUI QUE CE DÉPÔT A DÉJÀ FAIT, sur exactement la même question. Au retrait de
// `lib/reference.ts` (tâche #1000) : « les renvois NARRATIFS restent tels quels — effacer le
// POURQUOI d'un correctif parce que le fichier a bougé est exactement ce que les Articles 19 et 27
// interdisent », seules les ÉTAPES DE PROCESS ont été corrigées. Une phrase qui RACONTE n'engage
// personne ; une phrase qui ORDONNE engage. Ce filtre-ci applique le même partage, et il ÉTEND
// celui qui existait déjà plutôt que d'en poser un second à côté (Article 31, leçon L29).
export const MOTIF_RECIT = /\b(a été|ont été|était|étaient|s'est|se sont|avait|avaient|passait|lançait|lance à chaque|faisait|venait|j'ai |on a |il a fallu)\b/i;
export const MOTIF_GESTE_NOMME = /\b(en fichier|fichier joint|fichier séparé|une question|poser la question|créer une tâche|le geste|mécanisme concret|ou autre|gestionnaire de tâches|documents seuls)\b/i;
export const MOTIF_CITEE_POUR_ETRE_ECARTEE = /sans |jamais |ne dépend|indépendam|plutôt que/i;

export function estMentionSansConsigne(ligne = "") {
  const t = String(ligne);
  return MOTIF_CITEE_POUR_ETRE_ECARTEE.test(t) || MOTIF_GESTE_NOMME.test(t) || MOTIF_RECIT.test(t);
}

export function findDependancesOutillage(fichiers = [], { readFileImpl = lireFichierPartage, root = ROOT, quelleQueSoitLaDeclaration = false } = {}) {
  const trouvees = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    if (!quelleQueSoitLaDeclaration && declarationDuFichier(texte) !== "générique") continue;
    const lignes = texte.split("\n").filter((l) => DEPENDANCES_OUTILLAGE.test(l));
    // Une dépendance CITÉE POUR ÊTRE ÉCARTÉE n'en est pas une — le texte qui dit « une IA sans
    // crochet git doit pouvoir travailler » nomme forcément le crochet git. Sans cette distinction,
    // le détecteur signalerait le plus fort des garde-fous d'exportabilité comme un défaut.
    // ÉLARGI LE 2026-09-27 (tâche #910) À DEUX AUTRES FORMES QUI N'ORDONNENT RIEN — et les quatre
    // « dépendances » du relai en étaient : voir estMentionSansConsigne() pour le détail.
    const reelles = lignes.filter((l) => !estMentionSansConsigne(l));
    const ecartees = lignes.filter((l) => estMentionSansConsigne(l));
    // LE CONTRAT DE CETTE FONCTION NE CHANGE PAS, et un test l'a rappelé en refusant un commit :
    // la LONGUEUR du tableau rendu est le nombre de fichiers qui portent une VRAIE dépendance, et
    // plusieurs appelants la lisent comme ça. Un fichier dont toutes les mentions sont écartées ne
    // rentre donc pas dans le tableau — les compter ici aurait changé silencieusement ce que
    // mesurent ces appelants, exactement la divergence qu'on venait de corriger ailleurs (L29).
    // Les mentions écartées se demandent à part, par findMentionsSansConsigne() : elles restent
    // visibles — les taire ferait disparaître le jour où l'une deviendrait une consigne.
    if (reelles.length) trouvees.push({ fichier: f, occurrences: reelles.length, exemple: reelles[0].trim().slice(0, 100), mentions: ecartees.length });
  }
  return trouvees;
}

export function findMentionsSansConsigne(fichiers = [], { readFileImpl = lireFichierPartage, root = ROOT } = {}) {
  const out = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    const ecartees = texte.split("\n").filter((l) => DEPENDANCES_OUTILLAGE.test(l) && estMentionSansConsigne(l));
    if (ecartees.length) out.push({ fichier: f, mentions: ecartees.length, exemple: ecartees[0].trim().slice(0, 100) });
  }
  return out;
}

// ————————————————————————————————————————————————————————————————————————
// LE CODE PARTIRAIT-IL VRAIMENT ? (2026-09-24, chantier 3.5 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, et il l'a soulignée plus fort que le reste : « SAFE-EXPORT doit se
// muscler — si on perd l'exportabilité, on perd TOUT UN PROJET. »
//
// LE TROU, ET IL ÉTAIT ENTIER : tout ce que cet outil savait vérifier, ce sont des DOCUMENTS. Un
// blueprint générique, un terme défini, une raison écrite, une dépendance au gestionnaire de
// tâches. Rien, absolument rien, ne vérifiait que le CODE tournerait ailleurs. Un outil pouvait
// donc avoir un blueprint parfait, un vocabulaire impeccable, et planter à la première seconde
// dans un dépôt neuf parce qu'il lit un fichier qui n'existe que dans celui-ci. La charte le dit
// pourtant en toutes lettres : « un outil qui ne fonctionne que sur ce dépôt-ci a raté la moitié
// de sa mission ».
//
// CE QUI REND LA MESURE JUSTE PLUTÔT QUE BRUYANTE — et c'est tout le travail : un outil de l'Agence
// qui nomme un artefact du JEU n'est pas portable ; un outil DU JEU qui le fait est à sa place.
// La frontière n'est donc pas devinée, elle est LUE dans `TOOL_PORTEE` (lib-shell), le registre qui
// déclare déjà ce que chaque outil analyse. Sans cette distinction, memory-audit et EL-PROFESSOR
// seraient dénoncés pour faire exactement leur métier.

export const ARTEFACTS_DU_JEU = [
  { motif: /\blib\/(life|lia|perception|simulation|playback)\.ts\b/, quoi: "un module du moteur de jeu" },
  { motif: /\bapp\/(page|api)\b/, quoi: "une page ou une route du site" },
  { motif: /docs\/simulations\//, quoi: "les archives de simulation" },
  { motif: /\bLia\b|\bNo[ée]\b/, quoi: "un personnage du jeu" },
  { motif: /loveRealized|attirance|dossier retourn/i, quoi: "une mécanique narrative" },
];

// Un chemin en dur vers un document de CE projet, dans un outil censé partir. Le remède n'est
// jamais de retirer la lecture — c'est de la rendre paramétrable, comme le reste du paysage le
// fait déjà (`{ root = ROOT }`, `{ registres = ... }`).
export const MOTIF_CHEMIN_PROJET = /["'`](docs\/[a-z0-9/-]+\.md|CLAUDE\.md|docs\/regles-de-travail\.md)["'`]/g;

// LA PORTÉE SE DEMANDE À `porteeDe()`, JAMAIS À LA TABLE BRUTE — et c'est encore la même erreur
// que cette nuit entière poursuit, commise une fois de plus. La table `TOOL_PORTEE` ne déclare que
// les EXCEPTIONS (simulation, les-deux) ; « agence » est le DÉFAUT, délibérément, pour qu'un outil
// nouveau hérite du cas majoritaire sans inscription (Article 24). En lisant la table plutôt que la
// fonction, ce détecteur n'a trouvé AUCUN outil de portée « agence » — donc il n'a rien examiné du
// tout, et a rendu « 0 non portable », qui se lit comme un dépôt sain. C'était « je n'ai pas pu
// regarder » déguisé en « je n'ai rien trouvé » (leçon L5), pour la cinquième fois de la nuit.
// EXEMPTIONS DÉCLARÉES, jamais devinées — même patron que `SANS_MAIN_PROPRE` et
// `SANS_BLUEPRINT_ASSUME` ailleurs dans ce fichier. Ces scripts SONT ce projet : les reprocher de
// le connaître serait leur reprocher d'exister.
export const NE_PART_PAS_ET_C_EST_NORMAL = {
  "check-house": "la suite de tests DE ce projet : elle teste le jeu, donc elle le nomme. Elle ne s'exporte pas, elle se réécrit.",
  "check-profile": "vérifie les profils des personnages du jeu : son sujet EST le jeu.",
  "check-spirit": "envoie de vraies provocations aux personnages : son sujet EST le jeu.",
  "run-simulation": "lance une simulation du jeu.",
  "simulation-visiteur": "joue le visiteur du jeu.",
  "summarize-simulation-log": "résume un journal de simulation du jeu.",
  "the-ghost": "intervient dans une partie en cours.",
  "run-framework": "lance le serveur de CE site.",
  "sites-env": "charge l'environnement de CE site.",
};

// ————————————————————————————————————————————————————————————————————————
// CE QUI COMPTE COMME UNE CIBLE PARAMÉTRABLE (élargi le 2026-09-28, tâche #668)
// ————————————————————————————————————————————————————————————————————————
//
// LA FORME HISTORIQUE — `{ root = … }`, `{ chemin = … }` — reste la principale : c'est le
// vocabulaire du paysage, adopté exprès plutôt que d'élargir la sonde à n'importe quel nom (la
// décision de la première moitié de #668, et elle tient).
//
// LA DEUXIÈME FORME : UNE CIBLE PASSÉE EN ARGUMENT DE LIGNE DE COMMANDE. `route-booster` écrit
// `process.argv[2] ?? "app/api/lia/route.ts"` — sa cible EST déjà remplaçable, par la voie la plus
// directe qui soit, et il était pourtant accusé. Un outil dont on change la cible en tapant un mot
// après son nom est exactement ce que « portable » veut dire.
export const MOTIF_CIBLE_EN_ARGUMENT = /process\.argv\[\d+\]\s*(\?\?|\|\|)\s*["'`]/;

// LA QUATRIÈME FORME : UN DÉFAUT DE PARAMÈTRE QUI EST UNE CONSTANTE EXPORTÉE. `check-level-target`
// écrit `findSensitiveNodesDivergingFromHarmonia(texte, nodes = SENSITIVE_NODES)` et EXPORTE
// `SENSITIVE_NODES` : la liste de cibles est remplaçable par construction — on passe la sienne — et
// elle est publiée pour qu'un projet d'accueil sache ce qu'il remplace. C'est exactement la forme
// portable, sous un autre nom que celui du paysage.
//
// POURQUOI ÉLARGIR ICI ET PAS RENOMMER, alors que la première moitié de #668 avait tranché
// l'inverse : là-bas il s'agissait de paramètres NEUFS que j'écrivais, et adopter le vocabulaire du
// paysage ne coûtait rien. Ici, renommer `nodes` en `{ noeuds = … }` changerait la signature de
// fonctions déjà appelées et déjà testées — on casserait du code qui marche pour plaire à une
// sonde. Et la forme reconnue n'est pas n'importe quel paramètre : il faut que le défaut soit une
// constante EXPORTÉE, ce qui est précisément la preuve qu'elle est faite pour être remplacée.
// L'ACCOLADE OUVRANTE COMPTE AUTANT QUE LA PARENTHÈSE (corrigé le 2026-09-28, tâche #902). Le motif
// n'acceptait que `(` ou `,` avant le nom du paramètre, si bien qu'un PREMIER paramètre
// déstructuré — `function main({ charte = CHARTE_PAR_DEFAUT })`, la forme la plus courante de ce
// dépôt — passait pour non paramétrable. Trouvé en paramétrant les deux derniers scripts liés :
// le détecteur continuait de les accuser APRÈS correction, ce qui est le signal le plus clair
// qu'il regarde la mauvaise chose (leçon L4). La garde qui compte reste intacte : il faut qu'un
// `export const` du même nom existe dans le fichier, donc un nom majuscule croisé par hasard
// n'absout personne.
export const MOTIF_DEFAUT_CONSTANTE = /[({,]\s*[a-zA-Z_$][\w$]*\s*=\s*([A-Z][A-Z0-9_]{3,})\s*[,)}]/g;

export function constantesExporteesEnDefaut(code = "") {
  const t = String(code);
  const out = [];
  for (const m of t.matchAll(MOTIF_DEFAUT_CONSTANTE)) {
    if (new RegExp(`export\\s+const\\s+${m[1]}\\b`).test(t) && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

export function estParametrable(code = "") {
  return /\{\s*(root|registres?|fichiers?|chemin|dossiers?)\s*=/.test(String(code))
    || MOTIF_CIBLE_EN_ARGUMENT.test(String(code))
    || constantesExporteesEnDefaut(code).length > 0;
}

// LA TROISIÈME FORME N'EST PAS UNE PARAMÉTRABILITÉ, C'EST UNE ABSENCE DE CIBLE : le nom n'apparaît
// que dans une PHRASE adressée à un humain. `check-gemini-quota` imprime « L'app (lib/lia.ts,
// route.ts) n'appelle que Gemini » — une note au lecteur, jamais un fichier qu'il ouvre. Le
// détecteur retirait déjà les COMMENTAIRES pour cette raison exacte (« les commentaires racontent
// souvent l'histoire du projet sans que le CODE en dépende ») ; il ne retirait pas les messages,
// qui sont la même chose adressée à quelqu'un d'autre. C'est la leçon déjà payée en #832 : une
// MENTION n'est pas un USAGE.
//
// LA MESURE EST FAITE LIGNE PAR LIGNE, ET CE CHOIX EST UNE CORRECTION. Ma première version
// découpait les CHAÎNES du fichier avec une expression régulière, et elle a fait exactement le
// dégât qu'on attend d'un pseudo-parseur : une apostrophe française quelque part suffit à
// désynchroniser l'appariement des guillemets, à avaler des pans entiers de code, et donc à effacer
// les marqueurs `{ chemin = … }` qui rendaient quatre outils parfaitement portables. Le détecteur
// s'est mis à accuser Abraham, circle-tasks, the-equalizer et SAFE-EXPORT lui-même — quatre faux
// rouges créés en voulant en retirer un. Une lecture ligne à ligne ne peut rien avaler.
//
// LE CRITÈRE PORTE SUR LA CHAÎNE, JAMAIS SUR LA LIGNE, et c'est la SECONDE correction du même
// jour — la première version comptait les mots de la ligne entière et rangeait
// `const lifeSource = readFileSync(join(ROOT, "lib/life.ts"), "utf8");` parmi les phrases : huit
// identifiants suffisaient. C'était un FAUX VERT, c'est-à-dire pire que le faux rouge qu'on
// retirait — un vrai chemin en dur, déclaré propre.
//
// UNE PHRASE EST UNE CHAÎNE LONGUE ET ESPACÉE : au moins 40 caractères et au moins 4 espaces. Une
// cible ne l'est jamais : `"lib/life.ts"` et `"utf8"` n'ont aucun espace. Les deux populations ne
// se chevauchent pas, et c'est ce qui rend ce critère sûr là où le comptage de mots ne l'était pas.
export const LONGUEUR_POUR_ETRE_UNE_PHRASE = 40;
export const ESPACES_POUR_ETRE_UNE_PHRASE = 4;
// UN MOTIF PAR TYPE DE GUILLEMET, et c'est la TROISIÈME correction du même détecteur — chacune a
// été trouvée en vérifiant le résultat plutôt qu'en le croyant. Un seul motif dont la classe
// interdisait les trois guillemets à la fois coupait la chaîne à la première APOSTROPHE FRANÇAISE :
// « L'app (lib/lia.ts) n'appelle que Gemini » se découpait en morceaux trop courts pour être
// reconnus comme une phrase, et le message repassait pour une cible. Trois motifs séparés, chacun
// n'interdisant que SON propre guillemet, lisent le texte français comme il s'écrit.
//
// Appariement par LIGNE dans tous les cas : une mauvaise paire ne peut abîmer que sa propre ligne,
// jamais avaler un pan de fichier comme le faisait la toute première version.
export const MOTIFS_CHAINE = [/"([^"\n]*)"/g, /'([^'\n]*)'/g, /`([^`\n]*)`/g];

export function estUnePhrase(ligne = "", { longueur = LONGUEUR_POUR_ETRE_UNE_PHRASE, espaces = ESPACES_POUR_ETRE_UNE_PHRASE } = {}) {
  for (const motif of MOTIFS_CHAINE) {
    for (const m of String(ligne).matchAll(motif)) {
      const contenu = m[1];
      if (contenu.length >= longueur && (contenu.match(/ /g) ?? []).length >= espaces) return true;
    }
  }
  return false;
}

export function sansLesPhrases(code = "", options = {}) {
  return String(code).split("\n").filter((l) => !estUnePhrase(l, options)).join("\n");
}

// LA SECONDE DÉCLARATION D'EXEMPTION EXISTAIT ET CE DÉTECTEUR NE LA VOYAIT PAS (2026-09-28,
// tâche #668). Le dépôt porte DEUX registres de « ceci ne part pas », écrits à deux moments et pour
// deux raisons : `NE_PART_PAS_ET_C_EST_NORMAL` (des outils dont le SUJET est le jeu) et
// `EXEMPTES_DU_KIT` (des fichiers qui ne quittent pas ce dépôt du tout — les crochets git, le
// script d'installation de l'environnement, le lanceur du produit). Ce détecteur n'honorait que le
// premier, si bien qu'il reprochait à `scripts/hooks/check-last-commit.mjs` de n'être pas portable
// — un CROCHET GIT, dont la charte déclare noir sur blanc, avec sa raison, qu'il ne partira jamais.
//
// ACCUSER UN FICHIER DONT LE PROJET A DÉJÀ DÉCIDÉ QU'IL RESTE, c'est le faux rouge le plus coûteux
// de tous : il crée du travail qui ne doit pas être fait, et un garde-fou qui en crée cesse d'être
// lu (leçon L4). La correction LIT le second registre au lieu de recopier son contenu ici
// (Article 24) : une quatrième exemption demain sera honorée sans qu'on y pense.
export function estExemptDuKit(chemin = "", exemptions = EXEMPTES_DU_KIT) {
  return exemptions.some((e) => e.motif.test(String(chemin)));
}

export function findScriptsNonPortables(scripts = [], { readFileImpl = lireFichierPartage, root = ROOT, portee = porteeDe, exemptes = NE_PART_PAS_ET_C_EST_NORMAL, exemptionsDuKit = null } = {}) {
  const trouves = [];
  for (const f of scripts) {
    const slug = f.replace(/^scripts\//, "").replace(/\.mjs$/, "");
    // Un fichier qui ne quitte pas ce dépôt n'a pas à être portable : lui reprocher de ne pas
    // l'être, c'est réclamer un travail que la charte interdit justement de faire.
    if (estExemptDuKit(f, exemptionsDuKit ?? EXEMPTES_DU_KIT)) continue;
    // La portée se LIT ; un outil dont personne n'a déclaré la portée n'est PAS jugé, parce que
    // deviner qu'il appartient à l'Agence pour ensuite le condamner serait accuser sur une
    // supposition (leçon L5 : ne pas pouvoir regarder n'autorise aucune conclusion).
    if (slug in exemptes) continue;
    const p = portee(slug);
    if (p !== "agence") continue;
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    // Les commentaires racontent souvent l'histoire du projet (« trouvé en simulant Lia ») sans que
    // le CODE en dépende. On ne juge donc que le code, chaînes et identifiants — jamais le récit.
    const sansCommentaires = texte.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    // La PARAMÉTRABILITÉ se juge sur le code entier ; seule la recherche d'une CIBLE écarte les
    // phrases. Les confondre a coûté quatre faux rouges (cf. le commentaire de sansLesPhrases).
    const code = sansLesPhrases(sansCommentaires);
    const fuites = [];
    for (const a of ARTEFACTS_DU_JEU) if (a.motif.test(code)) fuites.push(a.quoi);
    const cheminsDurs = [...code.matchAll(MOTIF_CHEMIN_PROJET)].map((m) => m[1]);
    // Un chemin en dur n'est un défaut que s'il n'est PAS paramétrable : tout ce paysage passe ses
    // chemins en option avec une valeur par défaut, et c'est exactement la forme portable.
    // DEUX FORMES PORTABLES DE PLUS, reconnues le 2026-09-28 (tâche #668) après avoir instruit les
    // huit derniers candidats un par un, comme l'Article 19 l'exige. Elles n'élargissent pas le
    // détecteur par confort : chacune répond à un FAUX ROUGE réel, constaté sur un outil nommé.
    const parametrables = estParametrable(sansCommentaires);
    // LA PARAMÉTRABILITÉ VAUT POUR LES DEUX, et l'oublier accusait vingt-six outils dont ARGUS et
    // le filet de sécurité lui-même. Un outil de l'Agence a parfaitement le droit de SCANNER le
    // jeu — c'est le métier d'ARGUS, de HARMONIA, de check-house. Ce qui n'est pas portable, c'est
    // une CIBLE écrite en dur sans aucun moyen de la pointer ailleurs. Un outil qui reçoit ses
    // dossiers, ses fichiers ou sa racine en option part tel quel : il suffit de lui donner
    // d'autres cibles. Sans cette distinction, le détecteur dénonçait le paysage entier pour faire
    // son travail, et un garde qui accuse tout le monde n'accuse plus personne (leçon L4).
    if (parametrables) continue;
    if (!fuites.length && !cheminsDurs.length) continue;
    trouves.push({
      fichier: f, portee: p, fuites,
      cheminsDurs: parametrables ? [] : [...new Set(cheminsDurs)].slice(0, 5),
      // UNE QUESTION, JAMAIS UN VERDICT : savoir si un couplage au jeu est un défaut ou la nature
      // même de l'outil demande de lire ce qu'il fait. Ce détecteur montre où regarder.
      pourquoi: fuites.length
        ? `nomme un artefact du JEU en dur et n'offre aucune cible paramétrable (${[...new Set(fuites)].join(", ")}) — partirait-il tel quel sur un autre projet, ou faut-il rendre ses cibles paramétrables ?`
        : `chemins de CE projet écrits en dur et non paramétrables (${[...new Set(cheminsDurs)].slice(0, 3).join(", ")}) : à passer en option avec une valeur par défaut, comme le reste du paysage`,
    });
  }
  return trouves;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHEMIN DÉCLARÉ CONTRE CHEMIN ENFOUI — la mesure que la nuit du 2026-10-01 avait
// déclarée impossible, et la raison exacte pour laquelle elle devient possible ici.
//
// POURQUOI ELLE MANQUAIT, ET CE N'EST PAS UNE NÉGLIGENCE. La tâche #1323 reposait sur
// « 38 fichiers sur 40 portent une ancre écrite en dur », chiffre RETIRÉ le 2026-10-01
// (tâche #1354) : quatre critères successifs avaient rendu quatre réponses en vingt minutes
// (42/48, puis 41, puis 25, puis 313). La conclusion écrite ce jour-là était que « séparer un
// chemin déclaré d'un chemin enfoui demande de comprendre la STRUCTURE du code, pas d'en
// reconnaître la forme » — donc qu'un cinquième motif de texte aurait produit un cinquième
// chiffre, jamais une vérité. Cette sonde-ci n'est pas ce cinquième motif : elle ne lit plus
// des lignes, elle lit un ARBRE.
//
// CE QUI REND LA DIFFÉRENCE OBJECTIVE. Le compilateur TypeScript est déjà une dépendance de ce
// dépôt (`package.json`, lancé par le crochet pré-commit) et sait analyser un `.mjs`. La
// question « ce chemin est-il pointable ailleurs ? » cesse alors d'être une ressemblance de
// texte pour devenir une POSITION dans la structure du fichier :
//   • DÉCLARÉ   — le littéral vit au niveau du module (constante, registre) ou comme VALEUR PAR
//                 DÉFAUT d'un paramètre : `{ root = ROOT, charte = "CLAUDE.md" } = {}`. Arriver
//                 ailleurs demande de lui donner une autre cible, pas de le réécrire. C'est la
//                 forme portable, et c'est déjà celle de la très grande majorité du paysage.
//   • ENFOUI    — le littéral vit DANS un corps de fonction, à l'endroit de l'appel :
//                 `lire(join(root, "CLAUDE.md"))`. Rien ne permet de le pointer ailleurs sans
//                 éditer le code. C'est le seul vrai coût de portabilité.
//
// CE QUE findScriptsNonPortables() NE PEUT PAS VOIR, ET POURQUOI LES DEUX COEXISTENT. Celui-là
// juge un FICHIER : il le déclare portable dès qu'il expose UNE cible en option. Un chemin
// enfoui au fond d'un fichier par ailleurs exemplaire lui échappe donc par construction — ce
// n'est pas un défaut du détecteur, c'est sa maille. Cette sonde-ci juge CHAQUE LITTÉRAL.
//
// LES TROIS NATURES QUI NE SONT PAS DES DÉFAUTS, et chacune répond à un cas réel observé au
// calibrage plutôt qu'à une précaution de principe :
//   • MOTIF DE NOM — le littéral est l'argument d'une opération de chaîne (`startsWith("scripts/")`,
//     `.replace("scripts/", "")`). Ce n'est pas une cible qu'on ouvre, c'est une convention de
//     nommage qu'on teste. 24 cas au calibrage.
//   • POINT D'ENTRÉE — le littéral vit dans `main()`. Nommer les vraies cibles EST le métier du
//     point d'entrée : c'est lui qui les fournit aux fonctions pures, qui les reçoivent en
//     paramètre. L'y reprocher reviendrait à exiger qu'aucun fichier ne sache jamais où il est.
//     113 cas au calibrage — de loin le plus gros contingent, et le plus trompeur.
//   • REGISTRE PROPRE — `docs/<son-propre-slug>/`. Un outil qui écrit dans SON registre n'est pas
//     couplé à ce projet-ci : le registre part avec lui. 36 cas au calibrage.
//
// SI LE PARSEUR MANQUE, ON NE CONCLUT PAS. Le compilateur est une dépendance de CE dépôt, jamais
// une garantie du dépôt d'arrivée. Absent, la sonde rend `mesurable: false` et le DIT — jamais
// zéro, qui se lirait « rien à signaler » alors que rien n'a été regardé (leçons L5 et L11).
export const MOTIF_LITTERAL_DE_CHEMIN = /^(?:CLAUDE\.md|(?:docs|scripts|lib|app|components)\/[A-Za-z0-9._/-]*)$/;

// Les opérations qui prennent un chemin comme MOTIF DE NOM et non comme cible à ouvrir.
export const OPERATIONS_SUR_LE_NOM = Object.freeze(["startsWith", "endsWith", "includes", "replace", "replaceAll", "split", "match", "indexOf", "lastIndexOf", "localeCompare", "test"]);

// LISTE VOLONTAIREMENT TENUE À LA MAIN, et l'Article 24 exige que cette nature soit écrite juste
// à côté : elle ne reflète aucun autre système, donc rien ne peut diverger en silence derrière
// elle. Un fichier n'y entre que par une décision, avec sa raison.
export const FICHIERS_HORS_MESURE_DES_CHEMINS = Object.freeze({
  "check-house.mjs": "le banc d'essai du dépôt : ses 382 littéraux de chemin sont des DÉCORS de test (`'docs/x/'`, `'scripts/autre.mjs'`, `'lib/house.ts'` dans des assertions), jamais des cibles ouvertes — les compter reviendrait à mesurer le couplage d'un décor de théâtre, et noierait les 93 vrais cas sous un faux rouge six fois plus gros (leçon L4 : un garde qui accuse tout le monde n'accuse plus personne)",
});

export function chargerLeParseur({ requireImpl = null } = {}) {
  try { return (requireImpl ?? createRequire(import.meta.url))("typescript"); }
  catch { return null; }
}

const NOEUDS_FONCTION = ["FunctionDeclaration", "FunctionExpression", "ArrowFunction", "MethodDeclaration", "Constructor", "GetAccessor", "SetAccessor"];

export function cheminsDuFichier(source = "", { slug = "", ts = null, charger = chargerLeParseur, motif = MOTIF_LITTERAL_DE_CHEMIN, operations = OPERATIONS_SUR_LE_NOM, nomDuFichier = "fichier.mjs" } = {}) {
  // Le chargeur est INJECTABLE pour une seule raison, et elle vaut d'être écrite : sans lui, la
  // branche « pas de parseur » ne serait pas testable, et un refus de conclure qu'on ne peut pas
  // éprouver est un refus qu'on découvre le jour où il se trompe.
  const parseur = ts ?? charger();
  if (!parseur) return { mesurable: false, pourquoi: "le compilateur TypeScript est absent de ce dépôt : impossible de lire la structure, donc aucune conclusion — surtout pas zéro" };
  const sf = parseur.createSourceFile(nomDuFichier, source, parseur.ScriptTarget.Latest, true, parseur.ScriptKind.JS);
  const fonctions = new Set(NOEUDS_FONCTION.map((k) => parseur.SyntaxKind[k]).filter((k) => k !== undefined));
  const ops = new Set(operations);
  const r = { mesurable: true, declares: 0, motifsDeNom: 0, pointDEntree: 0, registrePropre: 0, enfouis: [] };
  const nomDe = (f) => f.name?.text
    ?? (f.parent && parseur.isVariableDeclaration(f.parent) ? f.parent.name?.getText?.() : null)
    ?? (f.parent && parseur.isPropertyAssignment(f.parent) ? f.parent.name?.getText?.() : null)
    ?? "(anonyme)";
  const visiter = (n) => {
    if ((parseur.isStringLiteral(n) || parseur.isNoSubstitutionTemplateLiteral(n)) && motif.test(n.text)) {
      const p = n.parent;
      const estMotifDeNom = p && parseur.isCallExpression(p) && parseur.isPropertyAccessExpression(p.expression)
        && ops.has(p.expression.name.text) && p.arguments.includes(n);
      if (estMotifDeNom) r.motifsDeNom++;
      else {
        // On remonte jusqu'au module. Entrer dans un noeud de fonction AUTREMENT que par son
        // corps, c'est être une valeur par défaut de paramètre — donc une cible déjà pointable.
        let courant = n, pile = [], parDefaut = false;
        while (courant.parent) {
          const q = courant.parent;
          if (fonctions.has(q.kind)) { if (q.body !== courant) { parDefaut = true; break; } pile.push(q); }
          courant = q;
        }
        if (parDefaut || !pile.length) r.declares++;
        else if (slug && (n.text === `docs/${slug}` || n.text.startsWith(`docs/${slug}/`))) r.registrePropre++;
        else if (nomDe(pile[pile.length - 1]) === "main") r.pointDEntree++;
        else r.enfouis.push({ ligne: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, chemin: n.text, fonction: nomDe(pile[0]) });
      }
    }
    parseur.forEachChild(n, visiter);
  };
  visiter(sf);
  return r;
}

export function findCheminsEnfouis(scripts = [], { readFileImpl = lireFichierPartage, root = ROOT, ts = null, charger = chargerLeParseur, horsMesure = FICHIERS_HORS_MESURE_DES_CHEMINS } = {}) {
  const parseur = ts ?? charger();
  if (!parseur) return { mesurable: false, pourquoi: "le compilateur TypeScript est absent de ce dépôt : impossible de lire la structure, donc aucune conclusion — surtout pas zéro", fichiers: [] };
  const total = { declares: 0, motifsDeNom: 0, pointDEntree: 0, registrePropre: 0, enfouis: 0 };
  const fichiers = [], ecartes = [];
  for (const f of scripts) {
    const base = f.split("/").pop();
    if (base in horsMesure) { ecartes.push({ fichier: f, pourquoi: horsMesure[base] }); continue; }
    let source;
    try { source = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    const r = cheminsDuFichier(source, { slug: base.replace(/\.mjs$/, ""), ts: parseur, nomDuFichier: base });
    if (!r.mesurable) continue;
    total.declares += r.declares; total.motifsDeNom += r.motifsDeNom;
    total.pointDEntree += r.pointDEntree; total.registrePropre += r.registrePropre;
    total.enfouis += r.enfouis.length;
    if (r.enfouis.length) fichiers.push({ fichier: f, enfouis: r.enfouis });
  }
  fichiers.sort((a, b) => b.enfouis.length - a.enfouis.length || a.fichier.localeCompare(b.fichier));
  return { mesurable: true, examines: scripts.length - ecartes.length, total, fichiers, ecartes };
}

export function formatCheminsEnfouisLines(v = {}, { detail = 6 } = {}) {
  const l = ["=== CHEMINS ENFOUIS — ce qu'il faudrait rendre pointable pour partir ailleurs ==="];
  if (!v.mesurable) { l.push("", `🚨 PAS MESURÉ — ${v.pourquoi}`); return l; }
  const t = v.total ?? {};
  const juges = (t.declares ?? 0) + (t.enfouis ?? 0);
  const part = juges ? Math.round(((t.declares ?? 0) / juges) * 100) : null;
  l.push("", `${v.examines} script(s) lus EN STRUCTURE (arbre TypeScript), pas en motifs de texte.`, "");
  l.push(`  ${t.declares} chemin(s) DÉCLARÉ(S) — constante, registre, ou valeur par défaut de paramètre : déjà pointables ailleurs`);
  l.push(`  ${t.enfouis} chemin(s) ENFOUI(S) dans ${(v.fichiers ?? []).length} fichier(s) — à passer en option, avec la même valeur par défaut`);
  if (part !== null) l.push(`  → ${part} % des ${juges} chemins qui comptent sont déjà sous la forme portable`);
  l.push("", "  Non comptés, et chacun pour une raison, jamais par confort :");
  l.push(`    ${t.motifsDeNom} motif(s) de nom (argument de startsWith/replace/… : une convention testée, pas une cible ouverte)`);
  l.push(`    ${t.pointDEntree} au POINT D'ENTRÉE (dans main() : nommer les vraies cibles est son métier)`);
  l.push(`    ${t.registrePropre} vers son PROPRE registre (docs/<son-slug>/ : il part avec l'outil)`);
  for (const e of v.ecartes ?? []) l.push(`    hors mesure — ${e.fichier} : ${e.pourquoi}`);
  if ((v.fichiers ?? []).length) {
    l.push("", "LE TRAVAIL, FICHIER PAR FICHIER — chaque ligne est un passage en paramètre, à défaut identique :");
    for (const f of v.fichiers) {
      l.push("", `  ${String(f.enfouis.length).padStart(3)}  ${f.fichier}`);
      for (const e of f.enfouis.slice(0, detail)) l.push(`         L${e.ligne} · ${e.chemin} — dans ${e.fonction}()`);
      if (f.enfouis.length > detail) l.push(`         … et ${f.enfouis.length - detail} de plus`);
    }
  }
  return l;
}

// LE PLAN D'ACTION DE CETTE SONDE (Article 28). Deux états seulement, et le second compte autant
// que le premier : un constat ÉCARTÉ sans raison écrite n'est pas une décision, c'est un abandon
// déguisé. Le numéro de tâche est DÉCLARÉ, jamais deviné — c'est le créneau que #1371 a ouvert.
export const TACHE_DES_CHEMINS_ENFOUIS = "1323";

export function planDactionDesCheminsEnfouis(v = {}, { numeroTache = TACHE_DES_CHEMINS_ENFOUIS } = {}) {
  if (!v.mesurable) {
    return buildPlanDaction([{ constat: `la portabilité des chemins n'a PAS été mesurée — ${v.pourquoi}`, etat: "a-trancher", tache: "rétablir le parseur, ou acter que cette dimension restera non mesurée ici" }], { toolSlug: "safe-export" });
  }
  const constats = [];
  const n = v.total?.enfouis ?? 0;
  if (n) {
    constats.push({
      constat: `${n} chemin(s) de CE projet sont enfouis dans un corps de fonction, dans ${(v.fichiers ?? []).length} fichier(s) — rien ne permet de les pointer ailleurs sans éditer le code`,
      etat: "retenu", numeroTache,
      tache: "passer chacun en paramètre avec la MÊME valeur par défaut — forme déjà majoritaire dans le paysage, donc comportement inchangé par construction",
    });
  } else {
    constats.push({ constat: "aucun chemin enfoui : toutes les cibles sont déjà pointables ailleurs", etat: "ecarte", pourquoi: "rien à faire — et ce zéro-ci est mesuré, pas un défaut de regard" });
  }
  if (v.total?.pointDEntree) {
    constats.push({
      constat: `${v.total.pointDEntree} chemin(s) vivent dans main()`,
      etat: "ecarte",
      pourquoi: "nommer les vraies cibles EST le métier du point d'entrée : il les fournit aux fonctions pures, qui les reçoivent en paramètre. L'y reprocher exigerait qu'aucun fichier ne sache jamais où il est",
    });
  }
  return buildPlanDaction(constats, { toolSlug: "safe-export" });
}

// LE MANIFESTE D'EXPORT — la seconde moitié du muscle, et la plus utile le jour où ça sert
// vraiment. Jusqu'ici SAFE-EXPORT disait si un outil AVAIT L'AIR exportable ; il ne disait jamais
// CE QU'IL FAUDRAIT EMPORTER. Une exportabilité qu'on ne sait pas exécuter n'est pas une
// exportabilité, c'est une opinion sur du code.
export function manifesteDExport(slug, { root = ROOT, readFileImpl = lireFichierPartage, exists = existsSync } = {}) {
  const script = `scripts/${slug}.mjs`;
  let source;
  try { source = readFileImpl(join(root, script), "utf8"); } catch {
    return { mesurable: false, pourquoi: `${script} est introuvable — aucun manifeste, et surtout aucun inventé` };
  }
  // Les dépendances se lisent dans les imports réels, récursivement : emporter un outil sans le
  // vocabulaire commun qu'il appelle, c'est emporter un outil qui ne démarre pas.
  const vus = new Set();
  const aVisiter = [script];
  while (aVisiter.length) {
    const courant = aVisiter.pop();
    if (vus.has(courant)) continue;
    vus.add(courant);
    let src;
    try { src = readFileImpl(join(root, courant), "utf8"); } catch { continue; }
    for (const m of src.matchAll(/from\s+["']\.\/([a-z0-9-]+\.mjs)["']/g)) aVisiter.push(`scripts/${m[1]}`);
  }
  const candidats = {
    blueprint: `docs/${slug}-blueprint.md`,
    instanciation: `docs/referentiel/${slug}.md`,
    registre: `docs/${slug}/index.md`,
  };
  const emporter = [...vus].sort();
  const documents = []; const manquants = [];
  for (const [role, chemin] of Object.entries(candidats)) {
    if (exists(join(root, chemin))) documents.push({ role, chemin });
    else manquants.push({ role, chemin });
  }
  return {
    mesurable: true, slug,
    scripts: emporter,
    documents,
    // CE QUI MANQUE EST LA VRAIE INFORMATION : un outil sans blueprint part sans mode d'emploi, et
    // c'est précisément la moitié de mission que la charte lui reproche.
    manquants,
    // L'INSTANCIATION NE PART PAS, ET C'EST VOULU : elle décrit ce que l'outil fait SUR CE
    // PROJET-CI. La confondre avec le blueprint emporterait ce projet dans le suivant.
    horsPortee: "l'instanciation (`docs/referentiel/<outil>.md`) est listée pour mémoire mais ne s'emporte PAS : elle décrit ce que l'outil fait sur CE projet. Seul le blueprint part. Et ce manifeste dit ce qu'il faut COPIER, jamais que le résultat tournera — ça, seul un vrai essai sur un dépôt neuf le dira.",
  };
}

// ————————————————————————————————————————————————————————————————————————
// LES BLUEPRINTS — « il detecte aussi une absence de blueprint ou un blueprint mal construit »
// ————————————————————————————————————————————————————————————————————————

// Les sections qu'un blueprint doit porter pour être réellement réutilisable. Un blueprint qui
// décrit CE QUE fait l'outil sans dire QUEL PROBLÈME il résout n'est pas exportable : on ne saurait
// pas s'il vaut la peine d'être repris.
export const SECTIONS_ATTENDUES = [
  // ÉLARGI le 2026-09-23 : deux blueprints portaient bel et bien leur section de problème, sous un
  // titre que ce motif ne reconnaissait pas — « Ce que ce patron résout » et « Quand un tel gardien
  // se justifie ». Les verbes « résout » et « se justifie » sont des énoncés de problème aussi
  // clairs que le mot « problème » lui-même ; les exiger sous une seule formulation revenait à
  // noter la forme du titre plutôt que la présence du contenu. Deux VRAIS manques subsistaient
  // derrière ces deux faux positifs, et ils ont été écrits à la main : un blueprint qui décrit son
  // RÔLE ne dit pas pour autant quel problème l'a fait naître.
  // ÉLARGI UNE SECONDE FOIS le 2026-09-27, et la leçon est la même qu'au 2026-09-23 : le motif
  // notait la FORME DU TITRE plutôt que la présence du contenu. Mesuré sur les 17 blueprints
  // qu'il accusait ce jour-là, TREIZE portaient bel et bien leur énoncé de problème, sous les
  // titres que ce dépôt emploie réellement — « Le défaut fondateur », « Le défaut qu'il ferme »,
  // « Le trou qu'il comble », « Le trou qu'il ferme », « Le besoin », « Le motif général »,
  // « Les trois mensonges d'une compilation nue », « Le piège structurel », « L'asymétrie réelle
  // qui le motive », « Le principe fondateur ». Écrire dix-sept sections aurait dupliqué du
  // contenu déjà là, ce que l'Article 13 interdit — et treize faux rouges auraient fini par faire
  // cesser de lire ce détecteur (leçon L4). QUATRE vrais manques subsistaient derrière, et ils ont
  // été écrits à la main le jour même : le faux positif cache le vrai défaut, jamais l'inverse.
  //
  // CE QUI RESTE VOLONTAIREMENT HORS DU MOTIF : « ce qu'il est ». Un blueprint qui décrit son RÔLE
  // ne dit pas quel problème l'a fait naître, et l'accepter viderait l'exigence de son sens — c'est
  // la distinction qu'énonçait déjà l'élargissement de 2026-09-23, et elle tient toujours.
  { cle: "probleme", motif: /problème qu'il résout|le problème|pourquoi il existe|vocation|ce que ce patron résout|se justifie|défaut fondateur|défaut qu'il ferme|trou qu'il (comble|ferme)|le besoin|motif général|qui le motive|mensonges d'une|piège structurel|principe fondateur|vrai sujet de ce document/i, pourquoi: "sans le problème résolu, personne ne saura si cet outil vaut la peine d'être repris" },
  { cle: "garde-fous", motif: /garde-fou|limite honnête|ce qu'il ne|jamais/i, pourquoi: "sans ses limites, l'outil sera cru au-delà de ce qu'il sait faire" },
];

export function findBlueprintsMalConstruits(blueprints = [], { readFileImpl = lireFichierPartage, root = ROOT } = {}) {
  const defauts = [];
  for (const b of blueprints) {
    let texte;
    try { texte = readFileImpl(join(root, b), "utf8"); } catch { continue; }
    const manquantes = SECTIONS_ATTENDUES.filter((s) => !s.motif.test(texte));
    const declaration = declarationDuFichier(texte);
    // Un blueprint qui oublie de se DÉCLARER générique est un écart à part entière : c'est ce qui
    // rend la règle de déclaration auto-renforçante plutôt que périssable.
    if (declaration !== "générique") defauts.push({ fichier: b, defaut: "ne se déclare pas générique", consequence: "aucun détecteur de fuite ne le regardera — il pourra contenir n'importe quoi sans que rien ne le dise" });
    for (const s of manquantes) defauts.push({ fichier: b, defaut: `section « ${s.cle} » absente`, consequence: s.pourquoi });
  }
  return defauts;
}

// EXEMPTIONS DÉCLARÉES, reprises MOT POUR MOT de CLAUDE.md et jamais devinées (2026-09-23, tâche
// #218). La charte énonce déjà « Six outils volontairement SANS blueprint ni instanciation séparés
// — ils n'ont aucune connaissance propre au projet à documenter à part, leur valeur étant d'appeler
// et d'agréger ce que les autres disent déjà ». Les accuser reviendrait à reprocher une décision
// documentée, exactement ce que le garde-fou trottoirGranted interdit (Article 19).
//
// Les dossiers de docs/ qui ne sont pas des outils (registres de contenu, dossiers de travail) sont
// exclus pour la même raison : ils n'ont jamais eu vocation à partir avec l'Agence.
export const SANS_BLUEPRINT_ASSUME = {
  "le-coordinateur": "orchestrateur des outils gratuits — CLAUDE.md le déclare sans blueprint",
  "le-coordinateur-catalogue": "registre du catalogue de LE-COORDINATEUR, pas un outil",
  "circle-tasks": "la Ronde — CLAUDE.md la déclare sans blueprint",
  "html-report": "rend un rapport déjà produit — CLAUDE.md le déclare sans blueprint",
  "tool-usage": "compteur d'usage — CLAUDE.md le déclare sans blueprint",
  "doc-report": "veilleur de la décision HTML/texte — CLAUDE.md le déclare sans blueprint",
  "route-booster": "find-deep-booster — CLAUDE.md le déclare sans blueprint",
  // AJOUTÉ le 2026-09-23 (tâche #219) : son propre en-tête enregistre la décision explicite de
  // l'utilisateur du 2026-09-21 — « Membre certifié (classique) [...] SANS instanciation/registre/
  // blueprint séparés ». Lui écrire un blueprint reviendrait à défaire une décision documentée, très
  // exactement ce que le garde-fou trottoirGranted interdit (Article 19).
  //
  // ÉCART SIGNALÉ, jamais corrigé en douce : la décision dit « sans registre » et docs/tool-brain/
  // existe pourtant. L'un des deux a bougé sans l'autre. Ce n'est pas à cet outil de trancher lequel.
  "tool-brain": "décision explicite de l'utilisateur (2026-09-21) : membre certifié classique, sans blueprint séparé — mais son registre existe malgré la même décision, écart à trancher",
  "html-wiring-check": "vérification interne de la Ronde, jamais un outil autonome",
  "chantier-preliminaire": "dossier de travail, pas un outil",
  "idee-a-trancher": "registre de décisions en attente, pas un outil",
};

// BLUEPRINTS DONT LE NOM DE FICHIER DIFFÈRE DU NOM DE L'OUTIL. Un seul cas aujourd'hui, et la
// charte l'explique : « Smart Breaker | … | docs/outil-resilience-api.md (le blueprint garde son
// nom d'avant le surnom) ». Déclaré ici plutôt que deviné, et le jour où un second surnom apparaît
// il rejoint cette table au lieu de produire une fausse accusation.
export const BLUEPRINT_SOUS_UN_AUTRE_NOM = {
  "smart-breaker": "docs/outil-resilience-api.md",
};

// UN DOSSIER docs/X/ N'EST LE REGISTRE D'UN OUTIL QUE SI scripts/X.mjs EXISTE (Article 24 : on
// DÉRIVE au lieu d'énumérer). Sans cette règle il fallait tenir à la main la liste des dossiers qui
// sont des registres de CONTENU — profil-utilisateur, suivi-open-tasks, relecture-correctifs… —
// une liste qui se serait périmée au premier dossier créé. Un registre de contenu n'a jamais eu
// vocation à partir avec l'Agence : lui réclamer un blueprint serait un contresens.
// LES ALIAS SE LISENT DANS CLAUDE.md, ILS NE SE RECOPIENT PAS (2026-09-27, Article 24 — et le défaut
// a été payé le jour même). Cette fonction dérivait le nom du blueprint du nom du FICHIER
// (`docs/<script>-blueprint.md`) et complétait par une table écrite à la main d'UNE seule entrée.
// Or plusieurs outils de ce dépôt portent un blueprint nommé d'après l'OUTIL et non d'après son
// script : `scripts/kpi-report.mjs` → `docs/tableau-de-bord-blueprint.md`, `scripts/memento.mjs` →
// `docs/memory-audit-blueprint.md`, `scripts/the-screener-capture.mjs` →
// `docs/the-screener-blueprint.md`. Les trois étaient accusés de n'avoir AUCUN blueprint alors que
// le leur existait, était complet, et était déclaré noir sur blanc dans l'inventaire de CLAUDE.md.
// C'est exactement la classe de défaut que LE-CLASSIFICATEUR avait déjà payée — « il cherchait une
// fiche nommée d'après le FICHIER alors qu'une fiche est nommée d'après l'OUTIL, accusant 22 d'un
// coup » — et `aliasDocumentaires()`, qui lit cette correspondance dans la table réelle, vivait
// déjà dans ce fichier sans que cette fonction l'appelle.
//
// LA TABLE À LA MAIN RESTE, et elle n'est pas redondante : elle couvre le cas où un outil n'a
// AUCUNE ligne dans l'inventaire (Smart Breaker y figure sous son surnom). Les deux sources se
// complètent, la lue l'emportant sur la recopiée quand les deux parlent — jamais l'inverse, sans
// quoi une entrée oubliée à la main continuerait de masquer la vérité du dépôt.
export function findOutilsSansBlueprint(outils = [], { root = ROOT, exists = existsSync, readFileImpl = lireFichierPartage, exemptes = SANS_BLUEPRINT_ASSUME, alias = BLUEPRINT_SOUS_UN_AUTRE_NOM, aliasImpl = undefined } = {}) {
  const lus = aliasImpl === undefined ? aliasDocumentaires({ root, readFileImpl }) : aliasImpl;
  // La carte lue est indexée par CHEMIN de script (`scripts/x.mjs`) ; on la ramène au slug.
  const parSlug = new Map();
  if (lus) for (const [chemin, v] of lus) {
    const slug = String(chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
    if (v?.blueprint) parSlug.set(slug, v.blueprint);
  }
  const blueprintDe = (o) => parSlug.get(o) ?? alias[o] ?? `docs/${o}-blueprint.md`;
  return outils
    .filter((o) => !(o in exemptes))
    .filter((o) => exists(join(root, `scripts/${o}.mjs`)) || o in alias || parSlug.has(o))
    .filter((o) => !exists(join(root, blueprintDe(o))))
    .map((o) => ({ outil: o, pourquoi: "aucun blueprint : cet outil ne partira pas avec l'Agence le jour de l'export" }));
}

// ————————————————————————————————————————————————————————————————————————
// L'ESCALADE INTELLIGENTE — « elle avertit et propose une sonde plus poussée de façon intelligente »
// ————————————————————————————————————————————————————————————————————————

// Ce qui rend la proposition INTELLIGENTE plutôt que systématique : elle ne se déclenche que quand
// les indices se CONCENTRENT. Trois écarts éparpillés dans trois fichiers sont du bruit ordinaire ;
// trois écarts dans le même fichier disent qu'il s'y passe quelque chose. Proposer un scan payant à
// chaque avertissement reviendrait à le proposer toujours, donc à n'être jamais écouté.
// ══════════════════════════════════════════════════════════════════════════
// MESURER L'EXPORTABILITÉ (2026-09-26, tâche #906 — ses questions du gros prompt : « quels outils
// vitaux n'ont pas de blueprint ? y a-t-il un blueprint de l'Agence elle-même ? »).
//
// CE QUI MANQUAIT, ET C'EST LE CŒUR DE SA QUESTION : SAFE-EXPORT savait déjà dire QUELS outils
// n'ont pas de blueprint. Il ne savait pas dire lesquels COMPTENT. Une liste de vingt outils sans
// blueprint ne se hiérarchise pas ; une liste de trois outils VITAUX sans blueprint se traite le
// soir même. Le croisement vitalité × blueprint est toute la différence entre un inventaire et une
// priorité.
//
// LA VITALITÉ EST RELAYÉE DE LE-CLASSIFICATEUR, jamais recalculée ici : c'est son axe, et deux
// mesures de vitalité qui divergeraient seraient pires qu'une seule (leçon L29, payée le jour même
// sur un classificateur d'origine écrit en double).
export const BLUEPRINT_DE_L_AGENCE = "docs/agence-exportable-conception.md";

export function mesurerLExportabilite({ root = ROOT, vitalite = null, exists = existsSync, readFileImpl = lireFichierPartage, aliasImpl = undefined } = {}) {
  if (!vitalite?.mesurable) {
    return { mesurable: false, pourquoi: "la vitalité du parc n'a pas été fournie ou n'est pas mesurable : sans elle on ne peut que compter des blueprints manquants, jamais dire lesquels comptent" };
  }
  // LE MÊME DÉFAUT, UNE TROISIÈME FOIS, ET C'EST CE QUI LE REND INTÉRESSANT (2026-09-27, tâche #902).
  // LE-CLASSIFICATEUR l'avait payé — « il cherchait une fiche nommée d'après le FICHIER alors
  // qu'une fiche est nommée d'après l'OUTIL, accusant 22 d'un coup » ; `findOutilsSansBlueprint()`
  // l'a payé ce matin même, dans CE fichier, à cinquante lignes d'ici. Et la mesure qui produit le
  // CHIFFRE D'EXPORTABILITÉ AFFICHÉ EN TÊTE DE RAPPORT continuait, elle, de dériver le nom du
  // blueprint du nom du script : `check-argus.mjs` cherchait `docs/check-argus-blueprint.md` quand
  // son plan s'appelle `docs/argus-blueprint.md`. Six outils étaient déclarés « sans blueprint »,
  // les six à tort, et la couverture annoncée en était fausse d'autant.
  //
  // CORRIGER UNE OCCURRENCE NE CORRIGE PAS LA CLASSE : c'est la vraie leçon de ce troisième cas.
  // Le lien script → blueprint est ÉCRIT dans la colonne « Architecture » de l'inventaire de
  // CLAUDE.md. Il se LIT (Article 24), par la seule fonction qui sait le lire — jamais un second
  // lecteur du même tableau, qui finirait par en diverger (leçon L29).
  //
  // LA DÉRIVATION RESTE EN DERNIER RECOURS, et elle n'est pas un vestige : un script qui n'a
  // AUCUNE ligne dans l'inventaire (un outil neuf, pas encore inscrit) doit rester mesurable.
  // L'ordre compte : la source lue l'emporte toujours sur la devinette.
  const alias = aliasImpl === undefined ? aliasDocumentaires({ root, readFileImpl }) : aliasImpl;
  const aUnBlueprint = (chemin) => {
    const declare = alias?.get(String(chemin))?.blueprint;
    if (declare) return exists(join(root, declare));
    const base = String(chemin).replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
    return exists(join(root, `docs/${base}-blueprint.md`));
  };
  // DEUX MESURES DU MÊME OUTIL DISAIENT LE CONTRAIRE L'UNE DE L'AUTRE (2026-09-27, tâche #907).
  // Le compte des kits honore `EXEMPTES_DU_KIT` — les crochets git, le script d'installation de
  // l'environnement et le lanceur du PRODUIT ne partent pas avec l'Agence, chacun avec sa raison
  // écrite — et affichait « 7 dispensés ». Ce croisement-ci, lui, ne lisait pas cette déclaration :
  // il sortait EXACTEMENT LES MÊMES SEPT FICHIERS en « ⛔ BLOQUANTS ». Le même outil, dans le même
  // rapport, affirmait donc à trois lignes d'écart qu'ils étaient dispensés et qu'ils bloquaient.
  //
  // C'est la leçon L29 dans sa forme la plus pure : deux calculs sur la même question finissent
  // toujours par diverger. Il n'y a pas deux règles, il y en a une — et elle est déjà écrite, avec
  // ses raisons, à un seul endroit. On la LIT (Article 24), on ne la recopie pas.
  //
  // LES EXEMPTÉS NE DISPARAISSENT PAS DE LA MESURE : ils sont comptés à part et nommés, parce
  // qu'une dispense silencieuse gonflerait le taux et ressemblerait à une couverture méritée.
  const niveaux = {};
  for (const [niveau, fichiers] of Object.entries(vitalite.parNiveau)) {
    const exemptes = fichiers.filter((f) => exemptionDuKit(f.chemin));
    const dus = fichiers.filter((f) => !exemptionDuKit(f.chemin));
    const avec = dus.filter((f) => aUnBlueprint(f.chemin));
    niveaux[niveau] = {
      total: fichiers.length,
      dus: dus.length,
      exemptes: exemptes.map((f) => ({ chemin: f.chemin, pourquoi: exemptionDuKit(f.chemin)?.pourquoi ?? "" })),
      avecBlueprint: avec.length,
      sansBlueprint: dus.filter((f) => !aUnBlueprint(f.chemin)).map((f) => f.chemin),
      couverture: dus.length ? Math.round((avec.length / dus.length) * 100) : null,
    };
  }
  // LE BLUEPRINT DE L'AGENCE ELLE-MÊME — sa question, et elle est plus profonde qu'elle n'en a
  // l'air : quatre-vingt-huit blueprints d'outils n'expliquent pas comment les outils s'articulent.
  // Un acheteur qui reçoit 41 plans de pièces détachées n'a pas reçu le plan de la machine.
  // CORRIGÉ LE 2026-09-26, ET C'ÉTAIT UN FAUX VERT SUR LA PIÈCE LA PLUS IMPORTANTE. Cette mesure
  // vérifiait l'existence de `docs/agence-exportable-conception.md` et concluait « le blueprint de
  // l'Agence EXISTE ». Or ce fichier déclare lui-même, dans ses dix premières lignes, qu'il n'est
  // pas ça : c'est le carnet d'idées du projet SUIVANT. Le contrôle lisait la présence d'un fichier
  // et en déduisait la présence d'un contenu. Il délègue désormais à `mesurerLeKitDeLAgence()`,
  // qui exige que le plan se DÉCLARE comme tel — un fichier présent n'est pas un fichier qui parle
  // du bon sujet.
  const kitAgence = mesurerLeKitDeLAgence({ root, exists, readFileImpl });
  const planAgence = kitAgence.detail.find((d) => d.cle === "plan");
  const agence = planAgence?.present
    ? { existe: true, chemin: planAgence.chemin, kit: kitAgence, octets: (() => { try { return readFileImpl(join(root, planAgence.chemin), "utf8").length; } catch { return null; } })() }
    : { existe: false, chemin: planAgence?.chemin ?? "docs/agence-blueprint.md", kit: kitAgence, pourquoi: planAgence?.pourquoi ?? "aucun document ne décrit l'Agence COMME UN TOUT : on exporterait des pièces sans le plan de la machine" };
  return {
    mesurable: true, niveaux, agence,
    // LA PRIORITÉ SE DÉRIVE DU CROISEMENT, elle ne s'écrit pas : les vitaux et les essentiels sans
    // blueprint sont ce qui bloque un export, dans cet ordre.
    bloquants: [...(niveaux.vital?.sansBlueprint ?? []), ...(niveaux.essentiel?.sansBlueprint ?? [])],
    horsPortee: "un blueprint PRÉSENT n'est pas un blueprint SUFFISANT : cette mesure compte des fichiers, elle ne lit pas leur contenu. findBlueprintsMalConstruits() fait l'autre moitié du travail, et les deux ensemble ne remplacent toujours pas une relecture.",
  };
}

// ══════════════════════════════════════════════════════════════════════════
// L'EMPREINTE DISQUE ET SA PROJECTION (2026-09-26, tâche #906 — sa question : « mémoire disque :
// coût réel aujourd'hui, projeté à 1 mois, 2 mois, 1 an »).
//
// LA PROJECTION EST UNE TENDANCE, JAMAIS UNE LOI, et c'est écrit dans le résultat plutôt que promis
// en commentaire : elle prolonge en ligne droite un rythme observé sur quelques jours. Un chantier
// qui s'arrête, une archive qu'on purge, une simulation de plus — chacun la dément. Elle sert à
// savoir si l'ordre de grandeur est « quelques dizaines de Mo » ou « plusieurs Go », jamais à
// prévoir une facture.

// ══════════════════════════════════════════════════════════════════════════════════════════
// LE RAPPORT EXPORT CENTRAL (2026-09-28, tâche #1060)
// ══════════════════════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE, mot pour mot : « je veux que quelque part, on centralise toutes les questions liées
// à l'export, qu'on sache dire ou on en est, qu'on sache dire pourquoi et comment l'agence est
// exportable avec une vision globale. Qu'on sache répertorié tout ce qu'on sait faire en termes
// d'EXPORT, et aussi ce qu'on ne sait pas encore faire. Je veux un calcul qui donne le pourcentage
// d'exportabilité de l'agence. [...] je veux que ce rapport prenne en compte les taches ouvertes au
// sujet de l'EXPORT. »
//
// SON OBJECTIF, ET C'EST LUI QUI COMMANDE LA FORME : « ne pas se perdre sur le sujet de l'export,
// car beaucoup de choses ont déjà été faites [...] mais tout me semble éparpillé ». L'éparpillement
// est mesuré, pas ressenti : `data-archangel notes export` rend **248 fichiers** qui portent le
// sujet. Le rapport ne doit donc RIEN réécrire — il doit RASSEMBLER et NOMMER OÙ.
//
// POURQUOI CHEZ SAFE-EXPORT ET PAS AILLEURS : il détient déjà la mesure. Poser ce rapport ailleurs
// créerait un second endroit où lire le même pourcentage, et c'est exactement ainsi que deux
// chiffres finissent par diverger. La MESURE vit chez l'outil ; la DÉCISION reste dans
// `docs/strategies/export-et-commercialisation-strategie.md`. Deux domiciles, deux natures.
//
// CE QU'IL N'INVENTE PAS, et c'est ce qui le distingue d'un résumé : les trois listes — su-faire,
// pas-encore-su-faire, tâches ouvertes — sont DÉRIVÉES (Article 24). « Ce qu'on sait faire » est
// l'ensemble des dimensions qu'un outil mesure vraiment et qui tiennent leur barre ; « ce qu'on ne
// sait pas encore faire » réunit celles qui ne la tiennent pas ET celles qui rendent « pas
// mesurable » — une question à laquelle personne ne sait répondre aujourd'hui est précisément une
// chose qu'on ne sait pas encore faire, et c'est la catégorie qu'aucune sortie existante ne donne.
// Les tâches, elles, se LISENT dans la file : une liste recopiée serait périmée au prochain commit.

export const BARRE_DE_DIMENSION = 80;

// Les dimensions de l'export, chacune avec son extracteur. Une liste DÉCLARÉE et non devinée : ce
// qui compte comme « une question d'export » est un jugement, mais chaque valeur, elle, est lue.
// Une dimension qui rend `null` n'est pas à zéro — elle est NON MESURÉE, et les deux se lisent à
// l'opposé l'un de l'autre.
// ══════════════════════════════════════════════════════════════════════════════════════════════
// LA TUYAUTERIE — ce que l'Agence EMPORTE, ce qu'elle EXIGE, ce qui dépend du cas
// (2026-09-28, sa question : « la tuyauterie de l'agence est-elle exportable, ou bien l'agence se
// branche-t-elle sur la tuyauterie du projet qu'elle rejoint, ou bien ça dépend des cas ? »)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// SA QUESTION ÉTAIT JUSTE, ET LE TROU ÉTAIT RÉEL. SAFE-EXPORT mesurait déjà les liens vers CE
// dépôt-ci — « cet outil nomme-t-il Lia, la charte, docs/suivi ? ». Il ne mesurait nulle part ce
// que l'Agence **EXIGE DE SON HÔTE**. Or c'est la première question d'un acheteur : *de quoi ai-je
// besoin pour l'accueillir ?* Un rapport d'exportabilité qui ne répond pas à ça laisse deviner.
//
// LA RÉPONSE N'EST PAS « ÇA DÉPEND » : CE SONT TROIS COUCHES, chacune avec sa règle fixe.
//   · EMPORTÉE — la plomberie interne de l'Agence. Elle part avec elle, entière. Rien du projet
//     hôte n'y entre.
//   · EXIGÉE — ce que l'Agence suppose présent chez l'hôte sans l'apporter : un disque, un shell,
//     un git. Universel : tout projet de code en a un. Elle s'y BRANCHE, elle ne les fournit pas.
//   · ADAPTÉE — ce qui est propre à un fournisseur (Cloudflare, Gemini). C'est la seule couche qui
//     « dépend du cas », et elle doit rester mince, sans quoi l'Agence n'est portable que sur un
//     projet qui lui ressemble.
//
// POURQUOI LA MESURE EST DÉRIVÉE ET NON DÉCLARÉE : une liste tenue à la main des prérequis se
// périmerait au premier outil qui importe un module de plus (Article 24). On lit les imports réels.
export const COUCHES_DE_TUYAUTERIE = [
  { cle: "emportee", quoi: "la plomberie interne — part avec l'Agence", motif: /from\s+["']\.\/(lib-shell|lib-json|lib-markdown-table|report-template|html-report|tool-usage)\.mjs["']/ },
  { cle: "exigee", quoi: "ce que l'Agence attend de son hôte — elle s'y branche, elle ne l'apporte pas", motif: /from\s+["']node:(fs|child_process|path|os|url|crypto)["']|\bgit (log|rev-parse|status|diff|ls-files)/ },
  { cle: "adaptee", quoi: "propre à un fournisseur — la seule couche qui dépend du cas", motif: /\bGEMINI|WRANGLER|MINIFLARE|cloudflare|\bOPENAI/ },
  // LA BORNE DE MOT FINALE ÉTAIT UNE ERREUR, et le contre-test l'a attrapée avant la livraison :
  // `\bGEMINI\b` ne reconnaît PAS `GEMINI_API_KEY`, parce que le tiret bas est un caractère de mot.
  // La dépendance la plus courante du dépôt échappait donc à la mesure censée la compter.
];

export function tuyauterieDeLAgence({ root = ROOT, readFileImpl = lireFichierPartage, listDirImpl = readdirSync, couches = COUCHES_DE_TUYAUTERIE } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => `scripts/${f}`); } catch { /* illisible */ }
  if (!fichiers.length) {
    return { mesurable: false, pourquoi: "aucun script lu : rendre « aucune dépendance d'hôte » sur du vide serait un satisfecit (leçon L13)" };
  }
  const parCouche = Object.fromEntries(couches.map((c) => [c.cle, []]));
  for (const f of fichiers) {
    let texte = "";
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    // MENTIONNER N'EST PAS DÉPENDRE — et sans cette coupe, le premier passage accusait SIX scripts
    // d'être liés à un fournisseur quand DEUX le sont vraiment. `check-house`, `safe-export`,
    // `god-of-all-process` et `ecotoken` ne font que NOMMER Gemini ou Cloudflare, dans un
    // commentaire ou dans un registre déclaré. C'est très exactement la correction que
    // data-archangel a déjà payée sur son propre compteur (« déclarer n'est pas lire »), et la
    // refaire ici plutôt que de recopier la liste des innocents traite la CLASSE, pas l'occurrence
    // (leçon L37).
    const code = texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^export const [A-Z_0-9]+ = [\s\S]*?^\];$/gm, "");
    for (const c of couches) if (c.motif.test(code)) parCouche[c.cle].push(f);
  }
  const examines = fichiers.length;
  // LE TAUX EST CELUI DE LA COUCHE « ADAPTÉE », ET C'EST LE SEUL QUI DÉCIDE : plus il y a d'outils
  // liés à un fournisseur, moins l'Agence se pose ailleurs. Les deux autres couches ne sont pas des
  // défauts — l'une part, l'autre est universelle — et les compter contre l'Agence accuserait à
  // tort (leçon L4).
  const independants = examines - parCouche.adaptee.length;
  return {
    mesurable: true,
    examines,
    parCouche,
    taux: Math.round((independants / examines) * 100),
    horsPortee: "elle lit les IMPORTS et les mots du code, jamais l'exécution réelle : un module chargé dynamiquement lui échappe, et un simple commentaire citant Gemini compte comme une mention. C'est un indice de couche, jamais une preuve de dépendance.",
  };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTRÔLE D'ACCUEIL — et si l'hôte ne peut PAS fournir ? (2026-09-28, sa question)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// SA QUESTION : « si l'hôte ne peut pas fournir les éléments, alors safe-export résout la question
// et met ce qu'il faut en place, c'est comme ça ? »
//
// NON, ET IL NE DOIT PAS. La réponse diffère par couche, et les confondre produirait un outil
// dangereux.
//
//   · EXIGÉE manquante (pas de git, pas de shell, pas de Node) → **on REFUSE, on ne répare pas.**
//     Un outil qui installerait git à la place de son hôte modifierait la machine de quelqu'un
//     d'autre pour se rendre installable. C'est la définition d'un logiciel en qui on ne peut pas
//     avoir confiance. Ce qui manque se DIT, avant l'installation, jamais après.
//   · ADAPTÉE manquante (pas de clé Gemini, pas de Cloudflare) → **on DÉGRADE proprement.** L'outil
//     concerné refuse avec sa raison écrite, tout le reste tourne. Ce n'est pas une théorie : le
//     banc témoin a mesuré 68/68 outils debout sur un dépôt étranger SANS nos clés, précisément
//     parce que ceux qui en ont besoin refusent au lieu de planter.
//   · EMPORTÉE → sans objet : elle arrive avec l'Agence.
//
// CE QUE SA QUESTION A RÉVÉLÉ, ET C'ÉTAIT UN VRAI TROU : le banc témoin teste CHEZ NOUS, sur un
// dépôt que NOUS choisissons. Rien ne permettait à un acheteur de savoir, AVANT d'installer, si sa
// machine convient. Un rapport d'exportabilité qui ne répond pas à « puis-je l'accueillir ? »
// oblige à essayer pour savoir.
export const PREREQUIS_DE_L_HOTE = [
  { cle: "node", quoi: "un Node récent — l'Agence est écrite en JavaScript", sonde: ({ shImpl }) => shImpl("node --version").trim(), requis: true },
  { cle: "git", quoi: "un dépôt git — 24 outils lisent l'historique pour dater et mesurer", sonde: ({ shImpl }) => shImpl("git rev-parse --is-inside-work-tree").trim(), requis: true },
  { cle: "shell", quoi: "un shell POSIX — 18 outils lancent des commandes", sonde: ({ shImpl }) => shImpl("echo ok").trim(), requis: true },
  // FACULTATIF N'EST PAS ACCESSOIRE : son absence ne bloque pas l'installation, elle éteint des
  // outils précis — et l'acheteur a le droit de savoir LESQUELS avant d'acheter, pas après.
  { cle: "python3", quoi: "Python 3 — seulement pour lire des documents Word", sonde: ({ shImpl }) => shImpl("python3 --version").trim(), requis: false, eteint: "la lecture des .docx" },
];

export function controleDAccueil({ prerequis = PREREQUIS_DE_L_HOTE, shImpl } = {}) {
  // `sh` DE LIB-SHELL, jamais un execSync recopié ici : c'est le lanceur partagé du dépôt, et la
  // première version de ce contrôle a échoué faute de l'avoir importé — elle rendait « REFUSÉ » sur
  // une machine qui avait tout. Un contrôle d'accueil qui refuse à tort est pire qu'aucun contrôle :
  // il ferait renoncer un acheteur dont la machine convient (leçon L4).
  const run = shImpl ?? ((cmd) => sh(cmd));
  const lignes = [];
  for (const p of prerequis) {
    try {
      lignes.push({ ...p, present: true, valeur: p.sonde({ shImpl: run }) });
    } catch (e) {
      lignes.push({ ...p, present: false, valeur: String(e.message ?? e).split("\n")[0].slice(0, 80) });
    }
  }
  const bloquants = lignes.filter((l) => l.requis && !l.present);
  const eteints = lignes.filter((l) => !l.requis && !l.present);
  return {
    mesurable: true,
    lignes,
    bloquants,
    eteints,
    verdict: bloquants.length ? "REFUSÉ" : eteints.length ? "ACCUEILLI, avec des outils éteints" : "ACCUEILLI",
    horsPortee: "elle vérifie que l'outil RÉPOND, jamais qu'il répondra à tout ce dont l'Agence a besoin : une version de Node trop ancienne répond quand même à --version. C'est un contrôle de présence, pas de compatibilité.",
  };
}

export function formatAccueilLines(a) {
  if (!a?.mesurable) return [`=== CONTRÔLE D'ACCUEIL : PAS MESURÉ — ${a?.pourquoi} ===`];
  const l = [`=== CONTRÔLE D'ACCUEIL — ${a.verdict} ===`, ""];
  for (const x of a.lignes) {
    const marque = x.present ? "✅" : x.requis ? "🚫" : "⚠️ ";
    l.push(`  ${marque} ${x.cle.padEnd(8)} ${x.present ? x.valeur : "ABSENT"} — ${x.quoi}`);
    if (!x.present && !x.requis) l.push(`        sans lui, ${x.eteint} ne marche pas ; tout le reste tourne.`);
  }
  l.push("");
  if (a.bloquants.length) l.push(`  L'AGENCE NE S'INSTALLE PAS ICI, et elle ne va rien installer à votre place : ${a.bloquants.map((b) => b.cle).join(", ")} manque(nt). Un outil qui modifierait votre machine pour se rendre installable serait un outil en qui on ne peut pas avoir confiance.`);
  else l.push("  L'hôte fournit tout ce qui est exigé. Ce qui dépend d'un fournisseur (clés de modèle) n'empêche pas l'installation : les outils concernés refusent avec leur raison, le reste tourne.");
  l.push("");
  l.push(`  HORS PORTÉE : ${a.horsPortee}`);
  return l;
}

export function formatTuyauterieLines(t) {
  if (!t?.mesurable) return [`=== LA TUYAUTERIE : PAS MESURÉ — ${t.pourquoi} ===`, "", "Ce n'est PAS « aucune dépendance »."];
  const l = [`=== LA TUYAUTERIE DE L'AGENCE — ${t.examines} scripts, ${t.taux} % indépendants d'un fournisseur ===`, ""];
  for (const c of COUCHES_DE_TUYAUTERIE) {
    const n = t.parCouche[c.cle].length;
    l.push(`  ${c.cle.toUpperCase().padEnd(9)} ${String(n).padStart(3)} script(s) — ${c.quoi}`);
  }
  l.push("");
  l.push(`  CE QUI DÉPEND DU CAS, nommément : ${t.parCouche.adaptee.map((f) => f.replace("scripts/", "")).join(", ") || "aucun"}`);
  l.push("");
  l.push(`  HORS PORTÉE : ${t.horsPortee}`);
  return l;
}

export const DIMENSIONS_DE_L_EXPORT = [
  // DEUX MESURES DE PORTABILITÉ, ET LES CONFONDRE SERAIT LE DÉFAUT QUE CE RAPPORT EXISTE POUR
  // FERMER (constaté au premier passage, 2026-09-28). Le dépôt en porte deux, toutes deux justes,
  // qui rendaient **91 %** et **48 %** le même jour — et la stratégie citait la première pendant
  // que la commande `export` affichait la seconde. Un lecteur pressé en aurait conclu que l'une
  // des deux ment. Aucune ne ment : elles ne posent pas la même question.
  //   · RECONFIGURABLE — un outil nomme-t-il une cible de ce projet SANS offrir de paramètre pour
  //     en changer ? C'est le défaut réparable, celui qu'on corrige un outil à la fois (#668).
  //   · DÉCOUPLÉ — un outil mentionne-t-il ce projet, TOUT COURT ? Bien plus sévère, et c'est la
  //     vraie question du jour où l'Agence part : un outil paramétrable mais qui parle de Lia dans
  //     ses exemples partira quand même en parlant de Lia.
  // L'écart de 43 points entre les deux N'EST PAS UN BRUIT : c'est l'information. Il dit
  // exactement combien d'outils sont réparables « au paramètre » et combien demandent un vrai
  // travail de découplage.
  {
    cle: "portabilite-reconfigurable",
    quoi: "un outil peut-il recevoir d'autres cibles, ou les a-t-il écrites en dur ?",
    ouLireLeDetail: "node scripts/safe-export.mjs export — et la tâche #668, traitée un outil à la fois",
    lire: (m) => (m.reconfigurable?.mesurable ? { valeur: Math.round(m.reconfigurable.taux), sur: 100, detail: `${m.reconfigurable.portables}/${m.reconfigurable.examines} scripts reconfigurables, ${m.reconfigurable.nonPortables} avec une cible écrite en dur` } : null),
  },
  {
    cle: "portabilite-decouplee",
    quoi: "un outil mentionne-t-il encore ce projet-ci, même en exemple ?",
    ouLireLeDetail: "node scripts/safe-export.mjs export — bloc PORTABILITÉ (mesure la PLUS sévère des deux)",
    // LE DÉTAIL DIT LE CHIFFRE QUI DÉCIDE, pas seulement celui qui inquiète (2026-09-28) : « 43
    // encore liés » fait refermer le rapport, « 2 à découpler » le fait ouvrir. Les deux sont
    // vrais ; un seul appelle un geste.
    lire: (m) => (m.portabilite?.mesurable ? { valeur: Math.round(m.portabilite.tauxPct), sur: 100, detail: `${m.portabilite.portables}/${m.portabilite.examines} scripts sans aucune mention, ${m.portabilite.lignes.length} encore liés — mais une fois CLASSÉS (étape 2 du plan) : ${m.portabilite.parCategorie?.["a-decoupler"] ?? "?"} à découpler pour de vrai, ${m.portabilite.parCategorie?.parametrable ?? "?"} déjà paramétrables, ${m.portabilite.parCategorie?.legitime ?? "?"} légitimement liés — répartition des marqueurs : ${Object.entries(m.portabilite.parMarqueur ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}` } : null),
  },
  {
    cle: "tuyauterie",
    quoi: "que faut-il chez l'hôte pour accueillir l'Agence, et qu'est-ce qu'elle apporte elle-même ?",
    ouLireLeDetail: "node scripts/safe-export.mjs tuyauterie",
    lire: (m) => (m.tuyauterie?.mesurable ? { valeur: m.tuyauterie.taux, sur: 100, detail: `${m.tuyauterie.parCouche.emportee.length} script(s) emportent la plomberie interne · ${m.tuyauterie.parCouche.exigee.length} s'appuient sur le disque, le shell ou git de l'hôte (universel) · ${m.tuyauterie.parCouche.adaptee.length} sont liés à un fournisseur précis, et c'est la seule couche qui dépend du cas` } : null),
  },
  {
    cle: "kits-des-membres",
    quoi: "chaque outil emporte-t-il ses cinq pièces (blueprint, source, fiche, registre, dépendances) ?",
    ouLireLeDetail: "node scripts/safe-export.mjs kits",
    lire: (m) => (m.kits?.mesurable ? { valeur: m.kits.total ? Math.round((m.kits.complets / m.kits.total) * 100) : null, sur: 100, detail: `${m.kits.complets}/${m.kits.total} kits complets, ${m.kits.incomplets?.length ?? 0} incomplets, ${m.kits.exemptes?.length ?? 0} dispensés avec raison écrite` } : null),
  },
  {
    cle: "kit-de-l-agence",
    quoi: "l'Agence elle-même emporte-t-elle son propre kit (plan, installation, carte, organisation, standards, leçons) ?",
    ouLireLeDetail: "node scripts/safe-export.mjs kits — bloc AGENCE",
    lire: (m) => (m.agence?.mesurable ? { valeur: m.agence.taux ?? null, sur: 100, detail: `${m.agence.manquantes?.length ?? 0} pièce(s) manquante(s), ${m.agence.nonVerifiees?.length ?? 0} non vérifiée(s)` } : null),
  },
  {
    cle: "blueprints",
    quoi: "chaque outil a-t-il un plan réutilisable ailleurs, et les vitaux d'abord ?",
    ouLireLeDetail: "node scripts/safe-export.mjs export — bloc EXPORTABILITÉ",
    lire: (m) => {
      if (!m.exportabilite?.mesurable) return null;
      const n = m.exportabilite.niveaux ?? {};
      const dus = Object.values(n).reduce((a, d) => a + (d.dus ?? d.total ?? 0), 0);
      const ok = Object.values(n).reduce((a, d) => a + (d.avecBlueprint ?? 0), 0);
      return { valeur: dus ? Math.round((ok / dus) * 100) : null, sur: 100, detail: `${ok}/${dus} outils dus ont un blueprint · ${m.exportabilite.bloquants?.length ?? 0} bloquant(s) (vital ou essentiel sans plan)` };
    },
  },
  {
    cle: "relais-de-modele",
    // L'INTITULÉ PROMETTAIT PLUS QUE LA MESURE (resserré le 2026-09-28, tâche #902). « Une autre IA
    // peut-elle reprendre l'Agence » est la QUESTION ; ce qui se mesure est le matériel de reprise :
    // les documents sont-ils tous là, et aucun ne suppose-t-il un outillage que le successeur
    // n'aura pas. Un intitulé qui promet la réponse ferait lire 100 % comme « la reprise est
    // assurée », alors qu'aucune mécanique ne peut le dire — et c'est exactement le faux vert que
    // tout ce rapport existe pour éviter.
    quoi: "le matériel de reprise est-il là pour une AUTRE IA — tous les documents, et aucun qui suppose notre outillage ?",
    ouLireLeDetail: "node scripts/safe-export.mjs export — bloc RELAIS",
    lire: (m) => (m.relais?.mesurable ? { valeur: m.relais.taux ?? m.relais.tauxPct ?? null, sur: 100, detail: m.relais.resume ?? `${(m.relais.dimensions ?? []).length} dimension(s) examinée(s)` } : null),
  },
  {
    cle: "preuve-par-le-banc",
    quoi: "l'Agence a-t-elle été installée POUR DE VRAI ailleurs, et y tourne-t-elle ?",
    ouLireLeDetail: "node scripts/safe-export.mjs temoin — et docs/strategies/export-et-commercialisation-strategie.md",
    lire: (m) => (m.temoin?.mesurable ? { valeur: m.temoin.taux ?? null, sur: 100, detail: m.temoin.resume ?? "" } : null),
  },
];

// LA LECTURE DES TÂCHES OUVERTES SUR L'EXPORT — dans la file, jamais recopiée (Article 24). Le
// rapprochement se fait sur le TEXTE de la ligne : un thème seul raterait les tâches d'export
// rangées sous « Agence » ou « Charte », et elles existent.
export const MOTIF_TACHE_EXPORT = /export|portab|blueprint|kit d|essaimage|agence exportable/i;

export function tachesOuvertesExport({ lignes = [], estOuverte = null, motif = MOTIF_TACHE_EXPORT } = {}) {
  if (!lignes.length) {
    return { mesurable: false, pourquoi: "aucune ligne de suivi fournie : rendre « zéro tâche d'export ouverte » sans avoir lu la file serait un vert sur du vide (leçon L5)" };
  }
  const ouvertes = lignes.filter((r) => (estOuverte ? estOuverte(r) : true));
  const retenues = ouvertes.filter((r) => motif.test(`${r.sujet ?? ""} ${r.sousSujet ?? ""}`));
  return { mesurable: true, sur: ouvertes.length, retenues: retenues.map((r) => ({ numero: r.numero, criticite: String(r.criticite ?? "").trim(), sujet: String(r.sujet ?? "").replace(/\*\*/g, "").slice(0, 95) })) };
}

// mesuresDeLExport() (2026-10-01, extrait de la commande `rapport` sans une ligne de changement).
// POURQUOI L'EXTRAIRE : l'assemblage des dix mesures vivait DANS la commande, donc un second outil
// qui voulait lire les acquis de l'export n'avait d'autre choix que de le recopier — c'est-à-dire
// de créer la deuxième copie qui finit toujours par diverger (Article 24). Le premier à en avoir
// eu besoin est le chiffrage de refonte, qui doit dire ce qu'une refonte REMETTRAIT EN JEU.
// La commande `rapport` l'appelle désormais : un seul assemblage, un seul endroit où il vieillit.
export async function mesuresDeLExport() {
  const [lc, ctd] = await Promise.all([import("./le-classificateur.mjs"), import("./check-tasks-details.mjs")]);
  const vitalite = lc.vitaliteDuParc();
  const kits = mesurerLesKits({ vitalite });
  const agence = mesurerLeKitDeLAgence();
  let lignes = []; try { lignes = ctd.loadAllTaskRows(); } catch { lignes = []; }
  return {
    exportabilite: mesurerLExportabilite({ vitalite }),
    portabilite: mesurerLaPortabilite(),
    reconfigurable: (() => {
      const sc = fichiersSourcesDuProjet().filter((f) => String(f).startsWith("scripts/"));
      if (!sc.length) return { mesurable: false };
      const np = findScriptsNonPortables(sc);
      return { mesurable: true, examines: sc.length, nonPortables: np.length, portables: sc.length - np.length, taux: ((sc.length - np.length) / sc.length) * 100 };
    })(),
    kits, agence,
    relais: relaisDeModele(),
    tuyauterie: tuyauterieDeLAgence(),
    temoin: dernierPassageDuBanc(),
    tendances: tendancesExport(),
    taches: tachesOuvertesExport({ lignes, estOuverte: (r) => ctd.OPEN_KEYS.has(r.statusKey) }),
  };
}

export function rapportExportCentral(mesures = {}, { barre = BARRE_DE_DIMENSION, dimensions = DIMENSIONS_DE_L_EXPORT } = {}) {
  const sait = [], saitPas = [], nonMesure = [];
  for (const d of dimensions) {
    let lu = null;
    try { lu = d.lire(mesures); } catch { lu = null; }
    if (!lu || lu.valeur === null || lu.valeur === undefined) { nonMesure.push({ ...d, pourquoi: "aucune mesure disponible aujourd'hui" }); continue; }
    (lu.valeur >= barre ? sait : saitPas).push({ ...d, ...lu });
  }
  // LE POURCENTAGE GLOBAL est la MOYENNE DES DIMENSIONS MESURÉES, et son dénominateur est dit.
  // Compter une dimension non mesurée comme zéro punirait l'honnêteté de l'outil qui refuse de
  // conclure ; la compter comme 100 serait le faux vert le plus cher. Elle est donc EXCLUE du
  // calcul et NOMMÉE à côté — un pourcentage dont on ignore l'assiette ne veut rien dire.
  const mesurees = [...sait, ...saitPas];
  const global = mesurees.length ? Math.round(mesurees.reduce((a, d) => a + d.valeur, 0) / mesurees.length) : null;
  return {
    mesurable: mesurees.length > 0,
    pourquoi: mesurees.length ? undefined : "aucune dimension d'export n'a pu être mesurée : un pourcentage sur zéro dimension ressemblerait à une mesure",
    global, mesurees: mesurees.length, total: dimensions.length, barre,
    sait, saitPas, nonMesure,
    taches: mesures.taches ?? { mesurable: false, pourquoi: "la file n'a pas été fournie" },
    tendances: mesures.tendances ?? [],
  };
}

export function formatRapportExportLines(r = {}) {
  if (!r.mesurable) return [`🚨 EXPORT : PAS MESURÉ — ${r.pourquoi}`, "Ce n'est PAS « tout va bien »."];
  const L = [];
  L.push("=== RAPPORT EXPORT CENTRAL — où en est l'Agence, et ce qu'il lui reste à savoir faire ===");
  L.push("");
  L.push(`EXPORTABILITÉ GLOBALE : ${r.global} % — moyenne de ${r.mesurees} dimension(s) RÉELLEMENT mesurée(s) sur ${r.total}.`);
  if (r.nonMesure.length) {
    L.push(`  ⚠️ ${r.nonMesure.length} dimension(s) sont HORS du calcul faute de mesure. Les compter à zéro punirait`);
    L.push("     l'outil qui refuse de conclure ; les compter à 100 serait le faux vert le plus cher.");
  }
  L.push("");
  L.push(`--- CE QU'ON SAIT FAIRE (${r.sait.length}) — dimension mesurée et au-dessus de ${r.barre} % ---`);
  for (const d of r.sait) { L.push(`  ✅ ${d.valeur} %  ${d.quoi}`); L.push(`         ${d.detail}`); }
  if (!r.sait.length) L.push("  (aucune pour l'instant)");
  L.push("");
  L.push(`--- CE QU'ON NE SAIT PAS ENCORE FAIRE (${r.saitPas.length + r.nonMesure.length}) ---`);
  for (const d of r.saitPas) { L.push(`  🟠 ${d.valeur} %  ${d.quoi}`); L.push(`         ${d.detail}`); L.push(`         détail : ${d.ouLireLeDetail}`); }
  for (const d of r.nonMesure) { L.push(`  ⬜ NON MESURÉ  ${d.quoi}`); L.push(`         ${d.pourquoi} — et ne pas savoir répondre EST une chose qu'on ne sait pas encore faire.`); L.push(`         détail : ${d.ouLireLeDetail}`); }
  if (!r.saitPas.length && !r.nonMesure.length) L.push("  (rien — vérifier que ce n'est pas la mesure qui est trop indulgente)");
  L.push("");
  if (r.taches?.mesurable) {
    L.push(`--- CE QUI EST EN COURS : ${r.taches.retenues.length} tâche(s) ouverte(s) sur l'export, sur ${r.taches.sur} ouvertes ---`);
    for (const t of r.taches.retenues) L.push(`  #${t.numero} [${t.criticite}] ${t.sujet}`);
    if (!r.taches.retenues.length) L.push("  (aucune — ce qui mérite un regard : l'export est-il vraiment sans reste ?)");
  } else {
    L.push(`--- CE QUI EST EN COURS : PAS MESURÉ — ${r.taches?.pourquoi}`);
  }
  L.push("");
  if (r.tendances?.length) {
    L.push("--- LA PENTE, parce qu'un chiffre sans sa pente est la moitié de l'information ---");
    for (const t of r.tendances.slice(0, 8)) L.push(`  ${String(t.cle).padEnd(28)} ${t.tendance} (${t.points} point(s), ${t.sens})`);
    L.push("");
  }
  L.push("OÙ VIT QUOI, et c'est la réponse à « chez qui est ce document ? » :");
  L.push("  · LA MESURE, ici, chez SAFE-EXPORT — septième Gardien sacré, déjà propriétaire du chiffre.");
  L.push("  · LA DÉCISION et le plan de route, dans docs/strategies/export-et-commercialisation-strategie.md.");
  L.push("  · LE RÉCIT des passages du banc témoin, dans docs/safe-export/.");
  L.push("Un second détenteur du même chiffre est la façon dont deux chiffres finissent par diverger.");
  L.push("");
  L.push("HORS PORTÉE : ce rapport RASSEMBLE, il ne juge pas. Une dimension au-dessus de la barre dit");
  L.push("que la mesure est tenue, jamais que la question est close — et la barre elle-même est un");
  L.push("choix, pas un fait.");
  return L;
}

export const HORIZONS_DE_PROJECTION = [
  { cle: "1 mois", jours: 30 },
  { cle: "2 mois", jours: 60 },
  { cle: "1 an", jours: 365 },
];

export function projeterLaCroissance({ octetsAujourdhui = 0, octetsParJour = 0, joursObserves = 0, horizons = HORIZONS_DE_PROJECTION } = {}) {
  // MOINS DE DEUX JOURS OBSERVÉS NE FAIT PAS UN RYTHME — un rythme calculé sur une seule journée
  // est le chiffre de cette journée-là, présenté comme une tendance (même défaut que L5, pris par
  // l'autre bout : ici ce n'est pas l'absence de mesure qui trompe, c'est sa maigreur).
  if (joursObserves < 2) {
    return { mesurable: false, pourquoi: `seulement ${joursObserves} jour(s) observé(s) : un rythme a besoin d'au moins deux points, et une droite tirée d'un seul jour ressemble trait pour trait à une tendance` };
  }
  return {
    mesurable: true, octetsAujourdhui, octetsParJour, joursObserves,
    projections: horizons.map((h) => ({ ...h, octets: Math.round(octetsAujourdhui + octetsParJour * h.jours) })),
    horsPortee: "projection LINÉAIRE d'un rythme observé sur quelques jours : elle donne un ordre de grandeur, jamais une prévision. Un chantier qui s'arrête ou une archive purgée la démentent immédiatement.",
  };
}

export function enMo(octets) { return Math.round((Number(octets) || 0) / 1024 / 1024 * 10) / 10; }

// LA TAILLE SE LIT SUR GIT, jamais sur `du` : `du` mesure le conteneur (node_modules, caches,
// navigateurs préinstallés — 2,9 Go dont presque rien n'appartient au projet), git mesure ce qui
// PART réellement lors d'un export. Confondre les deux donnerait un chiffre cent fois trop gros et
// une panique sans objet.
export function tailleSuivieParGit({ shImpl = sh, jours = 0 } = {}) {
  const ref = jours
    ? (shImpl(`git rev-list -1 --before="${jours} days ago" HEAD`) ?? "").trim()
    : "HEAD";
  if (!ref) return { mesurable: false, pourquoi: `aucun commit trouvé avant ${jours} jour(s) : l'historique ne remonte pas si loin, ce qui n'est jamais la même chose qu'un dépôt vide` };
  const sortie = shImpl(`git ls-tree -r -l ${ref} | awk '{s+=$4} END{print s}'`);
  const octets = Number(String(sortie ?? "").trim());
  if (!Number.isFinite(octets) || !octets) return { mesurable: false, pourquoi: `la taille n'a pas pu être lue pour ${ref} — rien n'a été mesuré` };
  const quand = (shImpl(`git show -s --format=%ad --date=short ${ref}`) ?? "").trim();
  return { mesurable: true, ref, quand, octets };
}

export const FENETRE_DE_CROISSANCE_JOURS = 7;

export function empreinteDisque({ shImpl = sh, fenetre = FENETRE_DE_CROISSANCE_JOURS, horizons = HORIZONS_DE_PROJECTION } = {}) {
  const aujourdhui = tailleSuivieParGit({ shImpl });
  const avant = tailleSuivieParGit({ shImpl, jours: fenetre });
  if (!aujourdhui.mesurable) return { mesurable: false, pourquoi: aujourdhui.pourquoi };
  if (!avant.mesurable) {
    return { mesurable: false, aujourdhui, pourquoi: `taille actuelle lue (${enMo(aujourdhui.octets)} Mo) mais pas de point de comparaison à ${fenetre} jours : ${avant.pourquoi}. Une taille sans rythme ne se projette pas.` };
  }
  const parJour = (aujourdhui.octets - avant.octets) / fenetre;
  return {
    mesurable: true, aujourdhui, avant, fenetre, parJour,
    facteur: avant.octets ? Math.round((aujourdhui.octets / avant.octets) * 10) / 10 : null,
    projection: projeterLaCroissance({ octetsAujourdhui: aujourdhui.octets, octetsParJour: parJour, joursObserves: fenetre, horizons }),
  };
}

export function formatEmpreinteLines(e) {
  if (!e?.mesurable) return [`EMPREINTE DISQUE : PAS MESURÉE — ${e?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== EMPREINTE DISQUE — ce qui partirait vraiment dans un export ===`];
  l.push(`  Aujourd'hui (${e.aujourdhui.quand}) : ${enMo(e.aujourdhui.octets)} Mo suivis par git.`);
  l.push(`  Il y a ${e.fenetre} jours (${e.avant.quand}) : ${enMo(e.avant.octets)} Mo — soit ×${e.facteur} en ${e.fenetre} jours, ${enMo(e.parJour)} Mo/jour.`);
  if (e.projection.mesurable) {
    for (const p of e.projection.projections) l.push(`  Dans ${p.cle.padEnd(7)} : ${String(enMo(p.octets)).padStart(7)} Mo`);
    l.push(`  HORS PORTÉE : ${e.projection.horsPortee}`);
  } else {
    l.push(`  PROJECTION : PAS MESURÉE — ${e.projection.pourquoi}`);
  }
  l.push(`  Ce chiffre exclut .git (l'historique) et tout ce qui n'est pas suivi : c'est le poids de ce qui PART, pas celui du conteneur.`);
  return l;
}

// ══════════════════════════════════════════════════════════════════════════
// LE RELAI DE MODÈLE (2026-09-26, tâche #909 — sa demande : « le changement de modèle en cours de
// route : que SAFE-EXPORT couvre le relai (mémoire, ligne de conduite, process) », avec une
// consigne qui compte autant que la demande : **sans me servir de moi-même comme étalon**).
//
// CE QUE SA CONSIGNE INTERDIT, ET C'EST LE PIÈGE ÉVIDENT : vérifier « est-ce qu'une autre IA
// comprendrait ? » en me demandant si JE comprends. Je comprends toujours — j'ai la conversation,
// le contexte, les habitudes. Ma compréhension ne prouve rien sur celle d'un modèle qui arrive à
// froid ; elle prouve seulement que j'étais là. Le seul étalon utilisable est donc MÉCANIQUE : le
// document existe-t-il, est-il atteignable, et ne dépend-il pas d'un outillage particulier ?
//
// LES TROIS DIMENSIONS DU RELAI sont les siennes, pas une invention : ce qu'on a APPRIS (la
// mémoire), comment on TRAVAILLE (la ligne de conduite), et ce qu'on SUIT (les process). Un relai
// qui n'en porte que deux laisse le successeur refaire une erreur déjà payée, travailler autrement,
// ou sauter une étape — trois échecs différents.
export const DIMENSIONS_DU_RELAI = [
  { cle: "memoire", quoi: "ce que le projet a APPRIS en se trompant", documents: ["docs/referentiel/lecons.md", "docs/referentiel/points-fragiles.md"],
    sansQuoi: "le successeur repaiera une erreur déjà payée, et personne ne saura qu'elle l'avait déjà été" },
  { cle: "conduite", quoi: "comment on TRAVAILLE ensemble", documents: ["CLAUDE.md", "docs/regles-de-travail.md", "docs/philosophie-et-politique.md"],
    sansQuoi: "le successeur travaillera autrement, et la différence se lira dans le produit avant de se lire dans le code" },
  { cle: "process", quoi: "les suites d'étapes qui engagent", documents: ["docs/god-of-all-process-blueprint.md", "docs/pre-chantier-process-detail.md", "docs/xp-ia-process-detail.md"],
    sansQuoi: "le successeur sautera des étapes sans savoir qu'elles existaient" },
];

export function relaisDeModele({ root = ROOT, dimensions = DIMENSIONS_DU_RELAI, exists = existsSync, readFileImpl = lireFichierPartage } = {}) {
  const resultats = dimensions.map((d) => {
    const presents = d.documents.filter((c) => exists(join(root, c)));
    const absents = d.documents.filter((c) => !exists(join(root, c)));
    // LA DÉPENDANCE À UN OUTILLAGE PARTICULIER EST LE VRAI DÉFAUT DE RELAI, et il est invisible à
    // l'œil : un document parfaitement écrit qui dit « crée une tâche avec TaskCreate » est
    // inapplicable pour une IA qui n'a pas cet outil. findDependancesOutillage() le voit déjà —
    // on le RELAIE plutôt que d'écrire une seconde sonde (leçon L29).
    const dependances = findDependancesOutillage(presents, { readFileImpl, root, quelleQueSoitLaDeclaration: true });
    return { ...d, presents, absents, dependances, complet: !absents.length };
  });
  const incompletes = resultats.filter((r) => !r.complet);
  // LE TAUX MANQUAIT, ET SON ABSENCE COÛTAIT UNE DIMENSION ENTIÈRE (2026-09-28, tâche #902). Cette
  // fonction MESURE depuis toujours — elle rend `mesurable: true` — mais elle ne rendait aucun
  // chiffre, si bien que le rapport central affichait « NON MESURÉ » sur une mesure faite. Même
  // famille exacte que le banc témoin le même jour : produire et ne pas rendre, c'est ne pas
  // mesurer (leçon L2).
  //
  // CE QUE LE TAUX COMPTE, ET IL FAUT LE DIRE SOUS PEINE DE SURPROMETTRE : une dimension compte
  // quand TOUS ses documents existent ET qu'aucun ne s'appuie sur un outillage particulier. Les
  // deux conditions, jamais une seule — un document parfait qui dit « crée une tâche avec tel
  // outil » est inapplicable pour une IA qui ne l'a pas, et le compter bon serait le faux vert le
  // plus coûteux du lot, puisqu'il porte sur la reprise elle-même.
  const acquises = resultats.filter((r) => r.complet && !r.dependances.length);
  return {
    mesurable: true, dimensions: resultats, incompletes: incompletes.map((r) => r.cle),
    taux: resultats.length ? Math.round((acquises.length / resultats.length) * 100) : null,
    // LE COÛT DE L'ÉCART EST CHIFFRÉ, jamais laissé en « il manque quelque chose » : une dimension
    // qui échoue pour DIX-NEUF lignes à reformuler n'appelle pas le même geste qu'une qui échoue
    // pour une. Sans ce nombre, le lecteur ne peut pas décider si c'est une soirée ou une minute.
    resume: `${acquises.length}/${resultats.length} dimension(s) du relai complètes ET libres de tout outillage particulier`
      + (incompletes.length ? ` — documents MANQUANTS : ${incompletes.map((r) => r.cle).join(", ")}` : "")
      + (() => {
        const lignes = resultats.flatMap((r) => r.dependances).reduce((a, d) => a + d.occurrences, 0);
        const fichiers = [...new Set(resultats.flatMap((r) => r.dependances).map((d) => d.fichier))];
        return lignes ? ` — ${lignes} ligne(s) dans ${fichiers.join(" et ")} EXIGENT un outillage que le successeur n'aura peut-être pas : c'est le coût exact de l'écart, en lignes à reformuler` : "";
      })()
      + `. Mesure l'EXISTENCE et l'INDÉPENDANCE, jamais la SUFFISANCE : aucune mécanique ne dira qu'un modèle inconnu s'en sortira, et le déclarer EST la protection (Article 27)`,
    // CE QU'AUCUNE MÉCANIQUE NE PEUT VÉRIFIER, déclaré plutôt que tu (Article 27) : qu'un document
    // présent soit SUFFISANT. On vérifie qu'il existe et qu'il ne s'appuie pas sur un outillage
    // particulier ; on ne vérifie pas qu'un modèle inconnu, demain, en tirera ce qu'il faut.
    horsPortee: "vérifie l'EXISTENCE et l'INDÉPENDANCE À L'OUTILLAGE, jamais la suffisance. Et surtout jamais « est-ce que je comprends ? » : ma compréhension prouve que j'étais là, pas qu'un modèle arrivant à froid s'en sortira. C'est sa consigne explicite du 2026-09-26 — ne pas me servir de moi-même comme étalon.",
  };
}

export function formatRelaisLines(r) {
  if (!r?.mesurable) return [`RELAI DE MODÈLE : PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"}`];
  const l = ["=== RELAI DE MODÈLE — ce qui passe à l'IA suivante ==="];
  for (const d of r.dimensions) {
    l.push(`  ${d.complet ? "✅" : "⛔"} ${d.cle.toUpperCase().padEnd(9)} ${d.quoi}`);
    l.push(`     ${d.presents.length}/${d.documents.length} document(s) présent(s)${d.absents.length ? ` — MANQUE : ${d.absents.join(", ")}` : ""}`);
    if (!d.complet) l.push(`     SANS ÇA : ${d.sansQuoi}`);
    if (d.dependances.length) l.push(`     ⚠️  ${d.dependances.length} dépendance(s) à un outillage particulier : un document qui dit « crée une tâche avec tel outil » est inapplicable pour une IA qui ne l'a pas.`);
  }
  l.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

export const CONCENTRATION_MINIMUM = 3;
export function proposerSondePoussee(ecarts = [], { seuil = CONCENTRATION_MINIMUM } = {}) {
  const parFichier = new Map();
  for (const e of ecarts) {
    const f = e.fichier ?? e.outil ?? "?";
    parFichier.set(f, (parFichier.get(f) ?? 0) + 1);
  }
  const concentres = [...parFichier.entries()].filter(([, n]) => n >= seuil).sort((a, b) => b[1] - a[1]);
  if (!concentres.length) return { propose: false, raison: `aucun fichier ne concentre ${seuil} écarts ou plus — des écarts éparpillés sont du bruit ordinaire, jamais un signal` };
  return {
    propose: true,
    zone: concentres[0][0],
    ecarts: concentres[0][1],
    raison: `${concentres[0][0]} concentre ${concentres[0][1]} écarts : c'est là qu'un scan profond a une chance de rapporter plus qu'il ne coûte`,
  };
}

// LE CHOIX DE ZONE POUR LE SCAN PAYANT — le mélange qu'il a demandé (« un mélange des solutions 1
// et 2 : une solution performante, pertinente, efficace ») : priorité aux indices, AVEC une
// garantie anti-famine par rotation.
//
// POURQUOI LES DEUX ET PAS L'UN : la seule priorité aux indices laisserait indéfiniment de côté une
// zone silencieuse mais pourrie — les indices mécaniques ne voient qu'une partie du problème, donc
// zéro indice ne veut pas dire zéro problème. La seule rotation ferait payer un scan complet sur
// une zone où rien ne cloche. Le compromis : les indices décident, sauf si une zone attend depuis
// trop longtemps, auquel cas elle passe devant.
export const FAMINE_JOURS = 30;
export function choisirZoneAScanner(zones = [], { indices = {}, dernierScan = {}, maintenant = Date.now(), famineJours = FAMINE_JOURS } = {}) {
  const affamees = zones
    .map((z) => {
      const at = Date.parse(dernierScan[z] ?? "");
      const jours = Number.isFinite(at) ? Math.floor((maintenant - at) / 86400000) : Infinity;
      return { zone: z, jours };
    })
    .filter((z) => z.jours >= famineJours)
    .sort((a, b) => b.jours - a.jours);
  if (affamees.length) {
    const z = affamees[0];
    return { zone: z.zone, motif: "anti-famine", raison: z.jours === Infinity ? "jamais scannée — zéro indice ne veut pas dire zéro problème, seulement que les indices mécaniques n'y voient rien" : `${z.jours} jours sans scan` };
  }
  const parIndices = zones.map((z) => ({ zone: z, n: indices[z] ?? 0 })).sort((a, b) => b.n - a.n);
  if (!parIndices.length || parIndices[0].n === 0) return { zone: null, motif: "aucune", raison: "aucun indice nulle part et aucune zone en famine — rien ne justifie de payer un scan" };
  return { zone: parIndices[0].zone, motif: "indices", raison: `${parIndices[0].n} indice(s) mécanique(s) concentrés là` };
}

// ————————————————————————————————————————————————————————————————————————
// LA MÉMOIRE — trois états, et le troisième est celui qui rend le rapport lisible dans la durée
// ————————————————————————————————————————————————————————————————————————
//
// « Ce qui a été vu, corrigé, et écarté sciemment » (son choix). ÉCARTÉ SCIEMMENT est le plus utile
// des trois : une zone qu'on a regardée et décidé de laisser telle quelle ne doit pas revenir à
// chaque passage — sinon le rapport se remplit de bruit déjà tranché et on cesse de le lire, ce qui
// tue l'outil plus sûrement qu'un bug.
export const ETATS_MEMOIRE = ["vu", "corrigé", "écarté sciemment"];
export const MEMOIRE_FILE = "docs/safe-export/memoire.json";

// UN ÉCART NE SE MET DE CÔTÉ QU'AVEC SON ACCORD EXPLICITE (correction du 2026-09-22, le jour même
// où cette mémoire a été écrite, sur sa relecture : « ne jamais ecarter une zone sciemment laissée
// de coté par moi, sauf avec mon accord explicite »).
//
// CE QUE JE M'ÉTAIS DONNÉ SANS LE VOIR : la première version filtrait tout écart marqué « écarté
// sciemment » sans jamais demander qui l'avait écarté. L'agent pouvait donc faire taire un
// avertissement tout seul, et le silence qui suit ressemble exactement à un problème réglé. C'est
// la même famille d'erreur que celle traquée toute la journée — une absence prise pour un
// résultat — mais appliquée au dispositif de surveillance lui-même, ce qui est pire : un gardien
// qui peut se taire à sa propre initiative ne garde plus rien.
//
// LA RÈGLE : seul un écart portant un accord explicite daté de l'utilisateur est filtré. Tous les
// autres REVIENNENT, et leur rappel GROSSIT — « les gardiens sacrés doivent repeter une alerte si
// je ne la prends pas en compte, pour etre sur que je la traite ou l'ignore VOLONTAIREMENT ». La
// distinction qui compte est entre IGNORÉ et ÉCARTÉ : ignorer est un non-événement, écarter est une
// décision. Seule la seconde a le droit de faire taire l'alerte.
export const ACCORD_REQUIS = "accord explicite de l'utilisateur, daté";

// `fichier` paramétrable depuis le 2026-09-23 : ARGUS reçoit la même mémoire (tâche #214, accord
// explicite de l'utilisateur ce jour-là), et la recopier chez lui aurait été exactement le doublon
// que CLONE-HUNTER traque — pire, deux mémoires divergentes auraient vite donné deux disciplines
// différentes sur la même question. Le chemin suit la convention de registre déjà sans exception du
// projet (`docs/<outil>/`), donc un troisième Gardien s'y branche sans qu'on touche à cette ligne.
export function loadMemoire({ root = ROOT, readFileImpl = lireFichierPartage, fichier = MEMOIRE_FILE } = {}) {
  return loadJsonArray(fichier, { root, readFileImpl });
}

// Les paliers de relance. Un rappel identique devient un meuble — ce projet en a la preuve chiffrée
// (son rappel de Ronde ignoré plus de 200 fois, mot pour mot le même). À partir du troisième
// passage, l'alerte ne se contente plus de revenir : elle exige une réponse par une vraie question,
// pour qu'il soit certain de l'avoir traitée ou ignorée VOLONTAIREMENT.
export const PALIERS_RELANCE = [
  { passages: 5, action: "question obligatoire", ton: "🔴 signalé 5 fois sans décision — cette alerte bloque une question à te poser, elle ne repartira pas seule" },
  { passages: 3, action: "question proposée", ton: "🟠 signalé 3 fois : à trancher explicitement, garder ou écarter" },
  { passages: 1, action: "rappel", ton: "🟡 déjà signalé" },
  { passages: 0, action: "nouveau", ton: "· nouvel écart" },
];

export function filtrerDejaTranches(ecarts = [], memoire = []) {
  const cle = (e) => `${e.fichier ?? e.outil}::${e.defaut ?? e.pourquoi ?? ""}`;
  // SEULS les écarts portant un accord explicite sont filtrés. Un « écarté sciemment » sans accord
  // est traité comme non tranché — donc il revient, ce qui est exactement le but.
  const ecartesAvecAccord = new Set(
    memoire.filter((m) => m.etat === "écarté sciemment" && m.accordUtilisateur).map((m) => `${m.fichier}::${m.defaut ?? m.pourquoi ?? ""}`),
  );
  const sansAccord = memoire.filter((m) => m.etat === "écarté sciemment" && !m.accordUtilisateur);
  const gardes = ecarts.filter((e) => !ecartesAvecAccord.has(cle(e)));
  // Le compteur de passages porte la relance : il vit dans la mémoire, pas dans la tête de l'agent.
  const avecRelance = gardes.map((e) => {
    const vu = memoire.find((m) => `${m.fichier}::${m.defaut ?? m.pourquoi ?? ""}` === cle(e));
    const passages = vu?.passages ?? 0;
    const palier = PALIERS_RELANCE.find((p) => passages >= p.passages);
    return { ...e, passages, relance: palier.action, ton: palier.ton };
  });
  const revenus = ecarts.filter((e) => memoire.some((m) => m.etat === "corrigé" && m.fichier === (e.fichier ?? e.outil)));
  return {
    gardes: avecRelance,
    ecartesAvecAccord: ecarts.length - gardes.length,
    // Nommé plutôt que tu : un « écarté » posé sans accord est une tentative de faire taire
    // l'alerte, et elle doit se voir dans le rapport.
    ecartesSansAccord: sansAccord.map((m) => ({ fichier: m.fichier, pourquoi: "marqué écarté sans accord explicite de l'utilisateur — l'alerte continue donc de remonter" })),
    regressions: revenus,
    // Ce que l'agent DOIT poser en question, jamais à son appréciation.
    aTrancherObligatoirement: avecRelance.filter((e) => e.relance === "question obligatoire"),
  };
}

// Série temporelle partagée — SAFE-EXPORT n'en avait aucune à sa naissance (2026-09-22), et il
// n'était même pas inscrit au registre des consommateurs de tendance : celui-ci avait été écrit
// avant lui et rien ne l'a rouvert à son arrivée. Sept registres ont réclamé leur inscription en
// échouant ; celui-là n'a rien réclamé, faute de test disant ce qui DEVRAIT consommer une tendance.
export function enregistrerTendanceExport(mesures = {}, options = {}) {
  const point = buildPoint({
    mesures: {
      fuites: { valeur: mesures.fuites, sens: SENS.BAS_MIEUX },
      "blueprints-mal-construits": { valeur: mesures.blueprintsMalConstruits, sens: SENS.BAS_MIEUX },
      "dependances-outillage": { valeur: mesures.dependances, sens: SENS.BAS_MIEUX },
      "blueprints-total": { valeur: mesures.blueprints, sens: SENS.NEUTRE },
    },
    ...options,
  });
  return recordPoint("safe-export", point, options);
}

export function tendancesExport(options = {}) {
  const serie = loadSerie("safe-export", options);
  return ["fuites", "blueprints-mal-construits", "dependances-outillage", "blueprints-total"].map((c) => detectTendance(serie, c, options));
}

// ————————————————————————————————————————————————————————————————————————
// LA ONZIÈME COPIE DU CHARGEUR JSON (2026-09-29, tâche #1205)
// ————————————————————————————————————————————————————————————————————————
//
// D'OÙ ÇA VIENT, ET C'EST L'ARTICLE 27 PRIS EN FLAGRANT DÉLIT. `lib-json.mjs` a été créé le
// 2026-09-23 (#216) pour mettre fin à DIX copies de « lire un registre JSON, rendre un tableau ».
// Son en-tête raconte lui-même que `le-coordinateur.mjs` portait un commentaire fier de réutiliser
// le chargeur — « jamais une 4ᵉ copie » — pendant que sept copies naissaient ailleurs. Six jours
// plus tard, TROIS NOUVELLES étaient nées : deux dans ezechiel-les-tests, une dans x-port-blindtest.
//
// LE DÉFAUT N'EST DONC PAS QU'ON MANQUE D'UN CHARGEUR : c'est qu'un helper DISPONIBLE n'est pas un
// MÉCANISME. Rien ne regardait. Le fichier partagé règle le cas des copies qu'on a sous les yeux le
// jour où on l'écrit, jamais celui de la suivante — et la suivante arrive toujours.
//
// CE QUE CE GARDE-FOU RECONNAÎT, ET RIEN D'AUTRE : la forme EXACTE de `loadJsonArray()` — parser un
// JSON, puis vérifier que LE RÉSULTAT LUI-MÊME est un tableau, et rendre `[]` sinon. Un
// `Array.isArray(j?.events)` vise un CHAMP : ce n'est pas la même fonction, et l'accuser ferait
// exactement le garde-fou qu'on cesse de lire (leçon L4). Ce resserrement n'est pas théorique : la
// première version en accusait deux, dont une à tort.
export const COPIES_DE_CHARGEUR_ASSUMEES = {
  // Sa signature ne colle pas : elle reçoit un chemin ABSOLU et un lecteur qui prend ce chemin
  // entier, là où `loadJsonArray` prend un chemin RELATIF plus la racine. La convertir changerait
  // sa signature, donc ses tests — une factorisation qui change une signature n'en est plus une.
  "scripts/axa-check.mjs": "chemin absolu et lecteur à signature différente : la conversion changerait la signature publique, pas seulement le corps",
};
// LES CHAÎNES ET LES COMMENTAIRES SONT RETIRÉS AVANT DE CHERCHER, et ce garde-fou l'a appris de la
// pire façon : au premier passage réel il accusait DEUX lignes de check-house.mjs — les fixtures de
// son PROPRE contre-test, qui montrent la forme interdite à l'intérieur d'une chaîne de caractères.
// Un exemple qui DÉCRIT la faute n'est pas la faute, et un garde-fou qui ne fait pas la différence
// accuse le test écrit pour le prouver (leçon L4, et c'est la deuxième fois que ce projet la paie
// sur ce point précis — voir la même correction dans doc-report, tâche #1168).
// Les retours à la ligne sont PRÉSERVÉS : le numéro de ligne rendu doit rester celui du fichier.
export function sansCommentairesNiChaines(source = "") {
  return String(source)
    .replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, " "))
    .replace(/^([ \t]*)\/\/.*$/gm, "$1")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, (t) => "``" + t.replace(/[^\n]/g, ""));
}

export const MOTIF_DECLARATION_JSON = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*JSON\.parse\(/;
export const LIGNES_DE_LA_FORME_JSON = 3;

export function findCopiesDuChargeurJson({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage, exemptes = COPIES_DE_CHARGEUR_ASSUMEES } = {}) {
  let fichiers;
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs") && f !== "lib-json.mjs"); } catch { return null; }
  const copies = [];
  const nonLus = [];
  for (const f of fichiers.sort()) {
    const chemin = `scripts/${f}`;
    if (chemin in exemptes) continue;
    let lignes;
    try { lignes = sansCommentairesNiChaines(readFileImpl(join(root, chemin), "utf8")).split("\n"); } catch { nonLus.push(chemin); continue; }
    for (let i = 0; i < lignes.length; i += 1) {
      const m = lignes[i].match(MOTIF_DECLARATION_JSON);
      if (!m) continue;
      const nom = m[1].replace(/\$/g, "\\$");
      const fenetre = lignes.slice(i, i + LIGNES_DE_LA_FORME_JSON).join("\n");
      if (new RegExp(`Array\\.isArray\\(\\s*${nom}\\s*\\)\\s*\\?\\s*${nom}\\s*:\\s*\\[\\]`).test(fenetre)) {
        copies.push({ fichier: chemin, ligne: i + 1, extrait: lignes[i].trim().slice(0, 100) });
      }
    }
  }
  return { copies, nonLus, fichiersLus: fichiers.length - nonLus.length };
}

export function formatCopiesDuChargeurJsonLines(r) {
  if (!r) return ["🚨 PAS MESURÉ — le dossier scripts/ n'a pas pu être listé. Ce n'est pas un zéro."];
  const l = [];
  if (r.nonLus.length) l.push(`  ⚠️ ${r.nonLus.length} fichier(s) non lus, donc non vérifiés : ${r.nonLus.join(", ")} — le compte ci-dessous est un PLANCHER.`);
  if (!r.copies.length) {
    l.push(`CHARGEUR JSON : aucune copie de \`loadJsonArray()\` hors de lib-json.mjs, sur ${r.fichiersLus} fichier(s) lus.`);
    return l;
  }
  l.push(`⚠️ ${r.copies.length} copie(s) de \`loadJsonArray()\` réécrites à la main plutôt qu'importées de lib-json.mjs :`);
  for (const c of r.copies) l.push(`  · ${c.fichier}:${c.ligne} — ${c.extrait}`);
  l.push("  lib-json.mjs existe depuis le 2026-09-23 pour ça. Un helper disponible n'est pas un mécanisme : celui-ci l'est.");
  return l;
}

// ————————————————————————————————————————————————————————————————————————
// LES SAUTES SILENCIEUSES (2026-09-29, tâche #1203) — une MESURE, pas une alarme
// ————————————————————————————————————————————————————————————————————————
//
// D'OÙ ÇA VIENT : CLONE-HUNTER signalait cinq lignes recopiées à trois endroits de ce fichier. En
// cherchant POURQUOI les trois blocs existent plutôt qu'en les fondant, ces cinq lignes se sont
// révélées être le préambule ordinaire de toute fonction qui balaie une liste de fichiers : ouvrir
// chacun, passer au suivant si la lecture échoue. Il existe 92 fois dans l'outillage, et 91 de ces
// endroits abandonnent le fichier SANS EN GARDER LA MOINDRE TRACE — « je n'ai pas pu regarder »
// qui se lit exactement comme « j'ai regardé, il n'y a rien » (leçons L5 et L11).
//
// POURQUOI CECI N'EST PAS CÂBLÉ COMME UN GARDE-FOU, et c'est délibéré : une alarme qui afficherait
// 91 à chaque commit sans pouvoir descendre deviendrait du décor (leçon L6), et la corriger
// toucherait 8 outils — une décision qui appartient à l'utilisateur, pas à l'agent. La question
// est donc posée dans `docs/idees-a-trancher.md` (#1203) avec ce chiffre, et CETTE fonction existe
// pour que le chiffre soit REMESURABLE plutôt que cité de mémoire : `node scripts/safe-export.mjs
// sautes`. Le jour où il tranche, c'est elle qui dira si la correction a porté.
//
// CE QU'ELLE VOIT, ET CE QU'ELLE NE VOIT PAS : elle repère un `catch` qui abandonne juste après une
// lecture de fichier, et cherche dans les lignes voisines un mot qui dit qu'on garde une trace.
// C'est le cas grossier — une trace écrite sous un autre nom lui échapperait, et elle le dit.
// LE MOTIF A ÉTÉ ÉLARGI DANS LA MINUTE QUI A SUIVI SON ÉCRITURE, et la raison mérite d'être ici.
// Il ne reconnaissait d'abord qu'un `catch { continue }` NU. Quand cette fonction a commencé à
// noter ce qu'elle-même n'arrivait pas à lire, son propre site a cessé d'être VU — il est passé de
// « muet » à « invisible », ce qui est pire : le total baissait, donc la mesure s'améliorait en
// apparence pendant que rien n'était corrigé. Un détecteur dont le compte tombe quand on ajoute la
// bonne pratique est un détecteur qui récompense la mauvaise.
//
// L'ÉLARGISSEMENT A ÉTÉ TENTÉ PLUS LOIN, PUIS REPRIS, et c'est la leçon L4 qui a tranché.
// Reconnaître TOUT `catch` posé sur une lecture faisait passer le compte de 92 à 171 sites — et un
// échantillon lu à la main a montré que les nouveaux venus étaient en majorité légitimes : un
// repli qui essaie le chemin suivant, un défaut documenté rendu à la place, un constat déjà poussé
// disant que le fichier est illisible. Un garde-fou qui accuse à tort cesse d'être lu, donc le
// motif reste sur la forme qu'il vise vraiment : un `catch` qui fait PASSER AU FICHIER SUIVANT
// dans une boucle de balayage, où le fichier disparaît du scan sans laisser de trace. Le corps du
// `catch` peut faire quelque chose avant de continuer — c'est même la bonne forme, et c'est la
// recherche de trace, elle seule, qui départage.
export const MOTIF_ABANDON_APRES_LECTURE = /catch\s*\{[^}]*\bcontinue\b/;
export const MOTIF_LECTURE_DE_FICHIER = /readFileImpl|readFileSync|lireFichierPartage|lire\(/;
export const MOTIF_TRACE_DE_SAUTE = /illisibles|nonLus|sautes|sautés|pasPuLire|riennAPuEtreLu|nonLisibles/i;
export const LIGNES_AUTOUR_DE_LA_TRACE = 12;

export function sautesSilencieuses({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage } = {}) {
  let fichiers;
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); } catch { return null; }
  const muets = [];
  let total = 0;
  // ELLE S'APPLIQUE SA PROPRE RÈGLE, et ce n'est pas une coquetterie : au premier passage elle se
  // comptait elle-même parmi les muets, ce qui était juste. Un outil qui mesure une honnêteté sans
  // la tenir chez lui donne exactement la raison de ne pas le croire.
  const nonLus = [];
  for (const f of fichiers.sort()) {
    let lignes;
    try { lignes = readFileImpl(join(root, "scripts", f), "utf8").split("\n"); } catch { nonLus.push(f); continue; }
    for (let i = 0; i < lignes.length; i += 1) {
      if (!MOTIF_ABANDON_APRES_LECTURE.test(lignes[i])) continue;
      if (!MOTIF_LECTURE_DE_FICHIER.test(lignes[i])) continue;
      total += 1;
      const autour = lignes.slice(Math.max(0, i - 3), i + LIGNES_AUTOUR_DE_LA_TRACE).join("\n");
      if (!MOTIF_TRACE_DE_SAUTE.test(autour)) muets.push(`scripts/${f}:${i + 1}`);
    }
  }
  return { total, muets, nonLus, avecTrace: total - muets.length, fichiers: new Set(muets.map((m) => m.split(":")[0])).size };
}

export function formatSautesSilencieusesLines(r) {
  if (!r) return ["🚨 PAS MESURÉ — le dossier scripts/ n'a pas pu être listé. Ce n'est pas un zéro."];
  // L'AVEU VIENT AVANT LE CHIFFRE, ET L'ORDRE EST LE MÉCANISME : ce que la mesure n'a pas pu lire
  // s'imprime en PREMIER, y compris quand elle n'a rien trouvé du tout. Rangé après, il disparaît
  // dans la branche « rien trouvé » — c'est-à-dire exactement dans le cas où il compte le plus.
  const l = [];
  if (r.nonLus?.length) l.push(`  ⚠️ ${r.nonLus.length} fichier(s) que CETTE mesure n'a pas pu lire, donc non comptés : ${r.nonLus.join(", ")} — tout total ci-dessous est un PLANCHER, jamais un compte complet.`);
  if (!r.total) {
    l.push("🚨 PAS MESURÉ — aucun site de lecture trouvé. Sur ce dépôt-ci c'est impossible et veut dire que le motif ne correspond plus ; ailleurs, ça peut être vrai. Dans les deux cas ce n'est pas un zéro.");
    return l;
  }
  l.push(`SAUTES SILENCIEUSES : ${r.muets.length} / ${r.total} site(s) de lecture abandonnent un fichier sans en garder trace, répartis sur ${r.fichiers} outil(s).`);
  l.push(`  ${r.avecTrace} site(s) comptent ce qu'ils n'ont pas pu lire.`);
  l.push("  Ce n'est PAS un garde-fou : la question est posée dans docs/idees-a-trancher.md (#1203), et ce chiffre sert à mesurer l'avant et l'après le jour où elle est tranchée.");
  l.push("  Limite honnête : une trace écrite sous un nom que le motif ne connaît pas serait comptée comme muette.");
  for (const m of r.muets.slice(0, 8)) l.push(`  · ${m}`);
  if (r.muets.length > 8) l.push(`  … et ${r.muets.length - 8} autre(s).`);
  return l;
}

function main() {
  // LA COMMANDE « export » (2026-09-26, tâche #906) : le croisement vitalité × blueprint et
  // l'empreinte disque, joignables sans lancer le balayage complet — ce sont les deux chiffres
  // qu'il a demandés pour décider, pas pour surveiller.
  // LA COMMANDE « temoin » (2026-09-27, tâche #1034 étape 3) : lance les outils dans un dépôt
  // ÉTRANGER et classe ce qui se passe vraiment. C'est la portabilité MESURÉE, là où `export` rend
  // la portabilité LUE — les deux chiffres ne disent pas la même chose et doivent rester distincts.
  // `--ou=<chemin>` est OBLIGATOIRE : un banc d'essai qui viserait ce dépôt-ci par défaut
  // mesurerait que l'Agence marche chez elle, ce que personne n'a jamais mis en doute.
  // `tuyauterie` et `accueil` (2026-09-28, ses deux questions du soir). La première répond « que
  // faut-il chez l'hôte ? » depuis NOTRE dépôt ; la seconde répond « cette machine-ci convient-elle ? »
  // là où on la lance. Deux questions voisines et jamais la même : l'une se lit avant de vendre,
  // l'autre avant d'installer.
  if (process.argv[2] === "sautes") {
    recordCliUsage("safe-export");
    for (const l of formatSautesSilencieusesLines(sautesSilencieuses())) console.log(l);
    return;
  }
  if (process.argv[2] === "tuyauterie") {
    recordCliUsage("safe-export");
    for (const l of formatTuyauterieLines(tuyauterieDeLAgence())) console.log(l);
    return;
  }
  if (process.argv[2] === "accueil") {
    recordCliUsage("safe-export");
    for (const l of formatAccueilLines(controleDAccueil())) console.log(l);
    return;
  }
  if (process.argv[2] === "temoin") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    const ou = (process.argv.find((a) => a.startsWith("--ou=")) ?? "").split("=")[1];
    if (!ou) {
      console.log("🚨 PAS MESURÉ — aucun dépôt témoin donné. `node scripts/safe-export.mjs temoin --ou=<chemin d'un dépôt ÉTRANGER>`.");
      console.log("   Viser ce dépôt-ci par défaut mesurerait que l'Agence marche chez elle : personne ne l'a jamais mis en doute, et le chiffre serait un satisfecit.");
      return;
    }
    return import("./le-classificateur.mjs").then(async (lc) => {
      const { spawnSync } = await import("node:child_process");
      // LE BANC N'INSTALLAIT RIEN, ET C'EST LE PIRE DÉFAUT QU'IL POUVAIT AVOIR (2026-09-27, tâche
      // #1034 étape 2). Il lançait `scripts/<outil>.mjs` avec `cwd` sur le dépôt témoin, en
      // supposant qu'une copie de l'Agence s'y trouvait déjà. Elle y était — posée à la main vingt
      // minutes plus tôt — donc le banc a rendu un rapport parfaitement crédible, code 0, sur une
      // Agence VIEILLE DE QUATRE FICHIERS. Il mesurait le passé en ayant l'air de mesurer le
      // présent : exactement la leçon L41, cette fois sur l'outil censé la vérifier chez les autres.
      // Une copie qu'on ne rafraîchit pas n'est pas une copie, c'est un souvenir.
      const pose = installerLAgenceChez(ou);
      if (!pose.mesurable) { console.log(`🚨 PAS MESURÉ — ${pose.pourquoi}`); return; }
      console.log(`Agence installée dans le témoin : ${pose.fichiers} fichier(s) copiés depuis ${pose.commit} — le banc réinstalle à CHAQUE passage, sans quoi il mesurerait ce qui traînait là.\n`);
      const rec = lc.recenserLesScripts();
      const noms = [...new Set((rec.lignes ?? rec).map((l) => String(l.chemin ?? l.fichier ?? "")).filter((c) => c.endsWith(".mjs")).map((c) => c.replace(/^scripts\//, "").replace(/\.mjs$/, "")))]
        .filter((n) => !n.startsWith("hooks/") && n !== "check-house" && n !== "lib-shell");
      const passages = noms.map((outil) => {
        const r = spawnSync(process.execPath, [`scripts/${outil}.mjs`], { cwd: ou, timeout: 60000, encoding: "utf8" });
        return { outil, verdict: verdictDuTemoin({ code: r.status ?? 1, sortie: `${r.stdout ?? ""}\n${r.stderr ?? ""}` }) };
      });
      const synthese = synthetiserLeTemoin(passages);
      for (const l of formatTemoinLines(synthese, { ou })) console.log(l);
      // LE PASSAGE S'ENREGISTRE, sans quoi il ne sert qu'à celui qui regarde l'écran (leçon L2) :
      // le rapport central affichait « aucune mesure disponible » quelques secondes après que la
      // mesure ait été faite.
      if (synthese.mesurable) {
        const n = enregistrerPassageDuBanc({ date: new Date().toISOString(), temoin: ou, commit: pose.commit,
          taux: synthese.tauxPct, debout: synthese.tiennentDebout, examines: synthese.total,
          verdicts: Object.fromEntries(Object.entries(synthese.parVerdict).map(([k, v]) => [k, v.length])) });
        console.log(`\n  Passage enregistré (${n} au total) : ${BANC_TEMOIN_PASSAGES} — c'est lui que lit le rapport central.`);
      }
    });
  }

  if (process.argv[2] === "export") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return import("./le-classificateur.mjs").then((lc) => {
      const v = lc.vitaliteDuParc();
      for (const l of lc.formatVitaliteLines(v)) console.log(l);
      console.log("");
      const e = mesurerLExportabilite({ vitalite: v });
      if (!e.mesurable) { console.log(`EXPORTABILITÉ : PAS MESURÉE — ${e.pourquoi}`); }
      else {
        console.log("=== EXPORTABILITÉ — croisement vitalité × blueprint ===");
        for (const [niveau, d] of Object.entries(e.niveaux)) {
          // LE DÉNOMINATEUR EST CELUI DU POURCENTAGE, jamais un autre : afficher « 39/46 · 100 % »
          // est un chiffre qui se contredit lui-même en trois caractères. Les dispensés sont
          // comptés à part et NOMMÉS — une dispense tue ressemble à une couverture méritée.
          const dispense = d.exemptes?.length ? ` (+${d.exemptes.length} dispensé${d.exemptes.length > 1 ? "s" : ""} avec raison écrite)` : "";
          console.log(`  ${niveau.padEnd(10)} ${String(d.avecBlueprint).padStart(3)}/${String(d.dus ?? d.total).padEnd(3)} dus ont un blueprint · ${d.couverture === null ? "pas mesurable" : d.couverture + " %"}${dispense}`);
          for (const ex of d.exemptes ?? []) console.log(`               · dispensé : ${ex.chemin} — ${ex.pourquoi}`);
        }
        console.log(`  ⛔ BLOQUANTS (vitaux ou essentiels SANS blueprint) : ${e.bloquants.length}`);
        for (const c of e.bloquants) console.log(`     · ${c}`);
        console.log(e.agence.existe
          ? `  Blueprint de l'Agence elle-même : ${e.agence.chemin} (${e.agence.octets} caractères) — il EXISTE, ce qui ne dit pas qu'il suffit.`
          : `  ⛔ AUCUN blueprint de l'Agence elle-même : ${e.agence.pourquoi}`);
        console.log(`  HORS PORTÉE : ${e.horsPortee}`);
      }
      console.log("");
      // LA PORTABILITÉ (2026-09-27) rejoint `export` pour une raison précise : elle DOIT être lue
      // à côté du taux d'exportabilité, jamais ailleurs. Séparées, les deux mesures se feraient
      // confondre — et c'est exactement la confusion que ce bloc existe pour empêcher.
      for (const l of formatPortabiliteLines(mesurerLaPortabilite())) console.log(l);
      console.log("");
      // LES KITS rejoignent `export` plutôt qu'une commande à part : c'est la même question posée
      // plus finement (« que doit-il partir avec lui ? » au lieu de « a-t-il un plan ? »), et deux
      // commandes sur le même sujet finiraient par se contredire.
      for (const l of formatKitsLines(mesurerLesKits({ vitalite: v }))) console.log(l);
      console.log("");
      // CONSTRUIRE OU FAIRE TOURNER (2026-09-27, tâche #902) : sa première question du dossier de
      // stratégie — « quelle part de l'Agence devient inutile une fois le site vendu ? ». Elle vit
      // dans la commande `export` parce que c'est exactement la même question posée à l'envers :
      // ce qui doit pouvoir PARTIR, et ce qui n'a aucune raison de RESTER.
      for (const l of formatPartDeConstructionLines(partDeConstruction({ recenser: lc.recenserLesScripts }))) console.log(l);
      console.log("");
      for (const l of formatEmpreinteLines(empreinteDisque())) console.log(l);
      console.log("");
      for (const l of formatRelaisLines(relaisDeModele())) console.log(l);
    });
  }
  // `kits` — le même tableau, seul, pour quand c'est LA question du moment.
  // LA COMMANDE « plan-machine » (2026-09-27, tâche #908) : le plan de la machine, généré depuis la
  // chaîne quotidienne réelle. Il ne se lance pas à chaque commit — c'est un document qu'on
  // régénère quand la chaîne a bougé, pas un contrôle qui doit mordre tous les jours.
  if (process.argv[2] === "plan-machine") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return import("./le-classificateur.mjs").then(async (lc) => {
      const rec = lc.recenserLesScripts();
      const chaine = lc.chaineQuotidienne({ lignes: rec.lignes, importeDe: rec.importeDe });
      const plan = paliersDInstallation({ lignes: rec.lignes, importeDe: rec.importeDe, chaine });
      // LES POINTS D'ENTRÉE SE DÉRIVENT EUX AUSSI : ceux que le classificateur reconnaît comme
      // lancés par git ou par package.json, jamais une liste écrite ici qui se périmerait au
      // premier crochet ajouté.
      const entrees = rec.lignes
        .filter((l) => (l.portes ?? []).some((porte) => lc.POINTS_D_ENTREE_QUOTIDIENS.some((e) => String(porte).includes(e))))
        .map((l) => l.chemin).sort();
      // L'HEURE SE LIT, JAMAIS NE SE DÉDUIT (Article 32) — et si elle est illisible, le document
      // le dit plutôt que de porter une date inventée.
      let horodatage = "";
      try {
        const t = await import("./agent-du-temps.mjs");
        const m = await t.maintenant();
        // LA SOURCE VOYAGE AVEC L'HEURE, TOUJOURS (Article 32) : une heure de repli présentée comme
        // une heure réseau est le pire type d'erreur, parce qu'une heure fausse ressemble trait pour
        // trait à une heure juste. Dans ce conteneur les deux API de temps rendent HTTP 403, donc la
        // source est « système » — et le document le dit à chaque régénération plutôt que de le taire.
        horodatage = m?.mesurable ? `${m.humain} (source : ${m.source})` : "";
      } catch { horodatage = ""; }
      let commit = "";
      try { commit = sh("git rev-parse --short HEAD", { cwd: ROOT }).trim(); } catch { commit = ""; }
      const md = renderPlanDeLaMachine(plan, { entrees, horodatage, commit });
      const chemin = join(ROOT, "docs/agence-plan-de-la-machine.md");
      writeFileSync(chemin, md);
      console.log("=== SAFE-EXPORT — plan de la machine ===\n");
      if (!plan.mesurable) { console.log(`🚨 PAS MESURÉ — ${plan.pourquoi}`); return; }
      console.log(`✅ docs/agence-plan-de-la-machine.md régénéré : ${plan.paliers.length} paliers, ${plan.total} fichiers, ${entrees.length} point(s) d'entrée.`);
      if (plan.cycles.length) console.log(`⚠️  ${plan.cycles.length} fichier(s) dans un cycle d'imports, nommés dans le document : ${plan.cycles.join(", ")}`);
      else console.log("   Aucun cycle d'imports : l'ordre est suivable de bout en bout.");
      console.log("\n   Ce document est le pendant INSTANCIÉ de docs/agence-blueprint.md (ce que l'Agence est) et");
      console.log("   docs/agence-installation.md (dans quel ordre la poser), qui restent volontairement sans un");
      console.log("   seul nom de fichier pour pouvoir voyager. Celui-ci donne les vrais noms, et il se RÉGÉNÈRE.");
    });
  }

  // `chemins` (2026-10-01, tâche #1323) — la moitié de la portabilité que la maille du FICHIER
  // ne pouvait pas voir. Sa sortie est le livrable ; mon texte la commente, il ne la remplace
  // jamais (Article 31, faille 3).
  if (process.argv[2] === "chemins") {
    printReportHeader({ tool: "safe-export", title: "SAFE-EXPORT — chemins déclarés contre chemins enfouis", scriptPath: "scripts/safe-export.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    const sc = fichiersSourcesDuProjet().filter((f) => String(f).startsWith("scripts/") && String(f).endsWith(".mjs"));
    const v = findCheminsEnfouis(sc);
    console.log(formatCheminsEnfouisLines(v).join("\n"));
    imprimerPlanDaction(planDactionDesCheminsEnfouis(v));
    recordCliUsage("safe-export", "chemins");
    return;
  }

  // `rapport` (2026-09-28, tâche #1060) — LE rapport central de l'export. Il ne recalcule RIEN :
  // il appelle les mesures qui existent déjà et les rassemble, plus la file de tâches. Un rapport
  // qui referait les calculs deviendrait un second détenteur des mêmes chiffres, et deux
  // détenteurs divergent toujours (leçon L29).
  if (process.argv[2] === "rapport") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return mesuresDeLExport().then(async (mesures) => {
      const r = rapportExportCentral(mesures);
      const lignesTxt = formatRapportExportLines(r);
      for (const l of lignesTxt) console.log(l);
      const alerte = alerteExport(kits, agence);
      console.log("");
      console.log(`VERDICT DU KIT : ${alerte.verdict ?? alerte.pourquoi}`);
      // Le rapport s'ARCHIVE, sinon il n'a pas de pente : un rapport qu'on ne retrouve pas est un
      // rapport qu'on refait (Article 28, et le registre de SAFE-EXPORT existe pour ça).
      const quand = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      const dest = join(ROOT, "docs/safe-export", `rapport-export-central-${quand}.txt`);
      try {
        mkdirSync(join(ROOT, "docs/safe-export"), { recursive: true });
        writeFileSync(dest, `${lignesTxt.join("\n")}\n\nVERDICT DU KIT : ${alerte.verdict ?? alerte.pourquoi}\n`, "utf8");
        console.log(`\nArchivé : docs/safe-export/rapport-export-central-${quand}.txt`);
        // L'OUTIL QUI DÉPOSE UN FICHIER LE DÉCLARE LUI-MÊME (2026-09-28, tâche #902). Ce rapport
        // écrit un fichier daté à CHAQUE passage, et l'index de son propre registre restait en
        // arrière — si bien que le filet virait au ROUGE dès qu'on CONSULTAIT l'outil. C'est
        // exactement le défaut du seuil recopié trouvé plus tôt la même nuit : un garde-fou que
        // l'usage légitime fait crier apprend à ne plus s'en servir (leçons L4/L6). Déclarer ce
        // qu'on vient d'écrire est le travail de celui qui l'écrit, jamais du commit suivant.
        try {
          const da = await import("./data-archangel.mjs");
          const mesure = da.mesurerLesIndex();
          da.reparerLesIndex(mesure);
          da.genererLesIndexManquants(mesure);
        } catch (e) { console.log(`\u26a0\ufe0f  index non mis \u00e0 jour (${e?.message ?? e}) \u2014 le rapport est \u00e9crit, mais son registre ne l'annonce pas encore.`); }
      } catch (e) { console.log(`\n⚠️  archivage impossible : ${e.message}`); }
      return undefined;
    });
  }
  // `secrets` (2026-09-30, tâche #1326) — SOUS-COMMANDE À PART, et jamais fondue dans `kits`.
  // Les kits répondent « peut-on remonter l'Agence ailleurs ? » ; celle-ci répond « qu'emporte-t-elle
  // qu'elle ne devrait pas ? ». Deux questions opposées : l'une compte ce qui manque, l'autre ce
  // qui est en trop. Et son rapport n'est PAS déposé sur disque, contrairement à tous les autres :
  // un fichier qui liste où sont les secrets est lui-même une carte au trésor.
  if (process.argv[2] === "secrets") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    for (const l of formatSecretsLines(chercherLesSecrets())) console.log(l);
    return undefined;
  }
  if (process.argv[2] === "kits") {
    printReliabilityNotice("safe-export");
    recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return import("./le-classificateur.mjs").then(async (lc) => {
      const k = mesurerLesKits({ vitalite: lc.vitaliteDuParc() });
      const a = mesurerLeKitDeLAgence();
      const inv = inventaireDesKits(k);
      // LES SOLUTIONS À CONSIGNER (2026-10-01, #1342) — ici et pas ailleurs : c'est la septième
      // pièce du kit de l'Agence, donc sa complétude se regarde au même endroit que les six autres.
      // Les lignes de suivi sont lues chez check-tasks-details, jamais relues ici (anti-doublon).
      let sol = { mesurable: false, pourquoi: "les lignes de suivi n'ont pas pu être lues — le registre des solutions ne peut donc pas être confronté au suivi, et c'est une absence de mesure, jamais un « rien à consigner »" };
      try {
        // Import DYNAMIQUE et non statique, pour la même raison que partout ailleurs ici : le
        // crochet post-commit importe des fonctions de ce fichier, et un import de tête ferait
        // entrer check-tasks-details dans cette chaîne — la « tuyauterie par ricochet » que le
        // filet a déjà refusée sur HARMONIA.
        const ctdKits = await import("./check-tasks-details.mjs");
        sol = findSolutionsNonConsignees({ lignesSuivi: ctdKits.loadAllTaskRows() });
      } catch (e) { sol = { mesurable: false, pourquoi: `les lignes de suivi n'ont pas pu être lues (${e.message})` }; }
      const sortie = [...formatKitAgenceLines(a), "", ...formatSolutionsNonConsigneesLines(sol), "", ...formatKitsLines(k, { combien: 999 }), "", ...formatInventaireLines(inv), "", ...alerteExportLines(k, a)];
      for (const l of [...formatKitAgenceLines(a), "", ...formatSolutionsNonConsigneesLines(sol), "", ...formatKitsLines(k, { combien: 40 }), "", ...alerteExportLines(k, a)]) console.log(l);
      try { mkdirSync(join(ROOT, "docs/safe-export"), { recursive: true }); } catch { /* déjà là */ }
      const cible = join(ROOT, "docs/safe-export", `kits-${new Date().toISOString().slice(0, 10)}.txt`);
      writeFileSync(cible, sortie.join("\n") + "\n", "utf8");
      console.log(`\nÉcrit : ${cible}`);
    });
  }
  // Cadre commun (pure-gold-unity, Ronde du 2026-09-22) — même correction que ses deux voisins du
  // même soir : l'en-tête n'est plus écrit à la main ici.
  printReportHeader({ tool: "safe-export", title: "SAFE-EXPORT — exportabilité de l'Agence, lisibilité du projet", scriptPath: "scripts/safe-export.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  console.log("=== SAFE-EXPORT — exportabilité de l'Agence, lisibilité du projet ===\n");
  for (const [nom, c] of Object.entries(CIBLES)) console.log(`· cible « ${nom} » : ${c.question}`);
  console.log("");
  const blueprints = readdirSync(join(ROOT, "docs")).filter((f) => f.endsWith("-blueprint.md")).map((f) => `docs/${f}`);
  // LE CORPUS AVANT TOUT VERDICT (2026-09-25, chantier #206). Mesuré le 2026-09-23 :
  // `findFuitesDeSpecificite` et `findOutilsSansBlueprint` rendent tous deux `[]` sur une entrée
  // vide, soit exactement ce qu'ils rendent sur un dépôt parfaitement exportable.
  console.log(ligneCorpus(mesurerCorpus(blueprints, { quoi: "le corpus des blueprints (docs/*-blueprint.md)", unite: "blueprint" }), { nomDuGardien: "SAFE-EXPORT" }));
  const fuites = findFuitesDeSpecificite(blueprints);
  const defauts = findBlueprintsMalConstruits(blueprints);
  // LE CODE PARTIRAIT-IL ? (2026-09-24) — la moitié que cet outil ne regardait pas.
  const nonPortables = findScriptsNonPortables(fichiersSourcesDuProjet().filter((f) => f.startsWith("scripts/") && f.endsWith(".mjs")));
  console.log(`\n--- LE CODE PARTIRAIT-IL ? ${nonPortables.length} candidat(s) ---`);
  console.log("Jusqu'ici SAFE-EXPORT ne vérifiait que des DOCUMENTS : un outil pouvait avoir un blueprint parfait et");
  console.log("planter à la première seconde dans un dépôt neuf. Ces lignes posent une QUESTION, jamais un verdict —");
  console.log("savoir si un couplage au jeu est un défaut ou la nature même de l'outil demande de lire ce qu'il fait.");
  for (const n of nonPortables) console.log(`· ${n.fichier} — ${n.pourquoi}`);
  const deps = findDependancesOutillage(blueprints);

  // LE CODE TIENDRAIT-IL DEBOUT ? (2026-09-27, leçon L36.) Question voisine de la précédente et
  // distincte : « partirait-il » demande s'il est détachable, celle-ci s'il s'exécutera. Un
  // réexport sans liaison locale se lit parfaitement et plante au premier appel interne — et le
  // défaut voyage avec l'outil, donc il arrive intact dans le dépôt qui l'adopte.
  for (const ligne of formatReexportsLines(auditReexports())) console.log(ligne);

  // ET LE CODE RÉUTILISE-T-IL CE QUE L'AGENCE SAIT DÉJÀ FAIRE ? (2026-09-29, tâche #1205.) Voisine
  // des deux précédentes et distincte : celles-là demandent si l'outil PART et s'il TIENT DEBOUT,
  // celle-ci s'il emporte une copie de ce que le socle porte déjà. `lib-json.mjs` a été créé pour
  // mettre fin à dix copies du même chargeur ; trois nouvelles sont nées dans les six jours qui ont
  // suivi. Un helper disponible n'est pas un mécanisme — ce scan-ci en est un.
  const copiesJson = findCopiesDuChargeurJson();
  for (const ligne of formatCopiesDuChargeurJsonLines(copiesJson)) console.log(ligne);

  // LE TROISIÈME SENS, ENFIN BRANCHÉ (2026-09-23, tâche #218). Les trois détecteurs ci-dessus
  // examinent les blueprints QUI EXISTENT. Celui-ci pose la question inverse, et c'est la plus
  // importante pour la MOITIÉ 1 de l'évolutivité (pouvoir partir) : quels outils n'en ont AUCUN ?
  //
  // Un blueprint mal écrit se corrige ; un outil sans blueprint ne partira tout simplement pas avec
  // l'Agence le jour de l'export. Le détecteur était construit, exporté, et appelé par personne —
  // donc le seul angle mort qui comptait vraiment restait ouvert.
  //
  // La liste des outils est DÉRIVÉE des registres réels de docs/ (convention `docs/<outil>/`, sans
  // exception dans ce projet), jamais recopiée à la main : un outil créé demain entre dans ce scan
  // sans que personne n'ait à y penser (Article 24).
  const outilsAvecRegistre = readdirSync(join(ROOT, "docs"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !["referentiel", "suivi", "simulations", "contexte-projet", "plans", "rapports-de-nuit"].includes(d.name))
    .map((d) => d.name);
  const sansBlueprint = findOutilsSansBlueprint(outilsAvecRegistre);
  // LE DÉNOMINATEUR VOYAGE AVEC LE CHIFFRE (2026-09-25, tâche #514). `fuites.length` compte des
  // FICHIERS, jamais des fuites : le détecteur n'en remonte qu'UNE par fichier, avec son exemple.
  // Conséquence mesurée le 2026-09-22 et restée vraie trois jours : en fermant une fuite, une
  // seconde apparaissait à la ligne suivante — « 4 fuites » en valaient 6, « 11 écarts » 13, et
  // rien dans le rapport ne le disait. Le total EXISTAIT déjà dans le champ `occurrences` ; il ne
  // sortait simplement pas. Le dire transforme un plancher en un vrai compte, ce qui vaut mieux
  // que de déclarer une limite qu'on peut supprimer.
  const totalOccurrences = fuites.reduce((n, f) => n + (f.occurrences ?? 1), 0);
  console.log(`  fuites de spécificité : ${fuites.length} fichier(s)${totalOccurrences > fuites.length ? `, ${totalOccurrences} occurrence(s) au total (une seule est montrée par fichier)` : ""}`);
  console.log(`  blueprints mal construits : ${defauts.length}`);
  console.log(`  dépendances à un outillage particulier : ${deps.length}`);
  const memoire = loadMemoire();
  // 2026-09-22, corrigé au premier vrai passage post-intégration : ce bloc destructurait
  // `ecartesSilencieusement`, un nom qui n'existe plus depuis la correction du garde-fou
  // anti-auto-silence — d'où un « undefined déjà écarté(s) » affiché en clair. Le vrai problème
  // n'était pas ce mot : c'est que TOUTE l'escalade réclamée par l'utilisateur (« les gardiens
  // sacrés doivent répéter une alerte si je ne la prends pas en compte ») était calculée par
  // filtrerDejaTranches() et n'atteignait AUCUN lecteur. Un mécanisme qui ne sort pas du script ne
  // protège rien — c'est une intention, pas un garde-fou (Article 25).
  const tri = filtrerDejaTranches([...fuites, ...defauts, ...deps, ...sansBlueprint.map((o) => ({ outil: o.outil, defaut: "aucun blueprint", consequence: o.pourquoi }))], memoire);
  console.log(`\n${tri.gardes.length} écart(s) à regarder (${tri.ecartesAvecAccord} écarté(s) avec votre accord explicite, jamais reposé(s)).`);
  for (const e of tri.ecartesSansAccord) console.log(`   ⚠️  ${e.fichier} : ${e.pourquoi}`);
  for (const r of tri.regressions) console.log(`   🔁 ${r.fichier ?? r.outil} : déjà corrigé une fois, revenu depuis — une règle corrigée ne doit jamais se reproduire (Article 3).`);
  const relances = tri.gardes.filter((e) => e.passages > 0);
  for (const e of relances) console.log(`   ${e.ton ?? "·"} ${e.fichier ?? e.outil} : vu ${e.passages} fois → ${e.relance}`);
  if (tri.aTrancherObligatoirement.length) {
    console.log(`\n🔴 ${tri.aTrancherObligatoirement.length} écart(s) à vous poser en question OBLIGATOIRE — ce n'est plus à mon appréciation :`);
    for (const e of tri.aTrancherObligatoirement) console.log(`   ${e.fichier ?? e.outil} : ${e.defaut ?? e.pourquoi}`);
  }
  // LA DETTE DE VOCABULAIRE, SORTIE DU SCRIPT (2026-09-23). Un mécanisme qui ne s'affiche jamais
  // est une intention, pas un garde-fou — c'est la leçon que ce fichier a déjà apprise une fois,
  // quand toute son escalade se calculait sans jamais être imprimée.
  const voc = scanVocabulaire();
  console.log(`\n📖 VOCABULAIRE — ${voc.mesure} sur ${voc.cibles} document(s) normatif(s) : ${voc.ecarts.length} emploi(s) ambigu(s).`);
  for (const e of voc.ecarts.slice(0, 12)) console.log(`   • ${e.fichier} — « ${e.terme} » sans son rang : « ${e.phrase} » (définition : ${e.definition})`);
  if (voc.ecarts.length > 12) console.log(`   … +${voc.ecarts.length - 12} autre(s).`);
  for (const g of findGuardiansHorsProcess()) console.log(`   ⚠️  ${g}`);

  // LE REMÈDE À MOITIÉ CÂBLÉ (2026-09-30). Imprimé ICI plutôt que dans un rapport à part : un
  // garde-fou qui ne s'affiche jamais est une intention, et ce fichier a déjà payé cette leçon.
  const horizon = findVerdictsSansHorizon();
  if (!horizon.mesurable) {
    console.log(`\n📅 HORIZON DU COMPTEUR — PAS MESURÉ : ${horizon.pourquoi}`);
  } else {
    console.log(`\n📅 HORIZON DU COMPTEUR — ${horizon.ecarts.length} lecteur(s) sur ${horizon.lecteurs} rendent « jamais sollicité » sans dire ce que le journal COUVRE.`);
    for (const e of horizon.ecarts) console.log(`   ⚠️  ${e.fichier} : ${e.defaut}`);
    if (!horizon.ecarts.length) console.log("   ✅ Chaque lecteur du verdict d'absence imprime l'horizon à côté de son chiffre.");
  }

  // CE QU'UN CLONE NEUF PERD (2026-09-30). Imprimé dans SAFE-EXPORT et nulle part ailleurs : la
  // question « une autre IA reprend-elle sans rien perdre ? » est littéralement son domaine.
  const perdus = findEtatsPerdusAuClone({ journaux: LOCAL_JOURNALS });
  if (!perdus.mesurable) {
    console.log(`\n🧳 CE QU'UN CLONE PERD — PAS MESURÉ : ${perdus.pourquoi}`);
  } else {
    console.log(`\n🧳 CE QU'UN CLONE PERD — ${perdus.etats.length} journal(aux) local(aux) déclaré(s), ${perdus.sansIntention.length} sans intention écrite, ${perdus.perteReelle.length} en PERTE RÉELLE.`);
    for (const e of perdus.sansIntention) console.log(`   ⚠️  ${e.chemin} : aucun champ auClone — on ne peut pas distinguer le cache assumé de l'historique qu'on croyait permanent`);
    for (const e of perdus.intentionInconnue) console.log(`   ⚠️  ${e.chemin} : auClone « ${e.auClone} » n'est pas une valeur déclarée (${Object.keys(AU_CLONE).join(", ")})`);
    for (const e of perdus.perteReelle) console.log(`   🔴 ${e.chemin} — ${e.present ? `${e.octets} octets` : "absent de ce conteneur"} : ${AU_CLONE["perte-reelle"]}`);
  }

  // X6 — LE POURQUOI À CÔTÉ DU QUOI, ENFIN BRANCHÉ (2026-09-23, tâche #585). Le détecteur existait
  // depuis sa création sans qu'aucun main() ne l'appelle, pendant que le référentiel des standards
  // déclarait X6 « vérifiée par personne ». Les deux étaient vrais séparément.
  const sourcesProjet = fichiersSourcesDuProjet();
  const citesParRegistres = gardeFousCitesParLesRegistres();
  const sansRaison = findGardeFousSansRaison(sourcesProjet, { cites: citesParRegistres });
  console.log(`\n🧭 X6 — ${sansRaison.length} garde-fou(s) exporté(s) sans une ligne d'explication, sur ${sourcesProjet.length} fichier(s) source et ${citesParRegistres.size} garde-fou(s) nommé(s) par un registre réel.`);
  console.log("   Ce que ce chiffre dit, et rien de plus : une absence d'EXPLICATION, jamais une absence de RAISON — juger si un commentaire explique vraiment reste hors de portée d'une mécanique.");
  console.log("   Pourquoi ce périmètre et pas toutes les fonctions : la version large rend 298 cas, un mur plutôt qu'un signal. L'Article 27 craint précisément le garde-fou, qui ressemble toujours à du zèle tant qu'on ignore le bug qu'il a coûté.");
  for (const e of sansRaison.slice(0, 10)) console.log(`   • ${e.fichier}:${e.ligne} — ${e.fonction}()`);
  if (sansRaison.length > 10) console.log(`   … +${sansRaison.length - 10} autre(s).`);

  // CONSTAT >> TÂCHES (2026-09-23) : chaque rapport dit désormais ce qu'il faut FAIRE de ce qu'il
  // a trouvé, pas seulement ce qu'il a trouvé. `fausseUneMesure` déclaré ici parce qu'un blueprint
  // qui fuit du jargon propre au projet rend faux ce qu'il prétend : être exportable.
  const plan = planDactionDepuisEcarts([...tri.gardes, ...voc.ecarts.map((e) => ({ fichier: e.fichier, defaut: `« ${e.terme} » employé sans son rang`, consequence: `définition : ${e.definition}` }))], { toolSlug: "safe-export", fausseUneMesure: true,
    // Les trois détecteurs ne rendent pas la même forme : une FUITE porte une occurrence et sa
    // ligne, un blueprint MAL CONSTRUIT porte un défaut nommé. Un libellé unique qui supposerait
    // un seul champ affichait « undefined » sur quatre écarts sur onze — un rapport qui dit
    // « undefined » ne se lit plus, il se survole.
    libelle: (e) => {
      const ou = e.fichier ?? e.outil ?? "(source inconnue)";
      if (e.defaut) return `${ou} — ${e.defaut}${e.consequence ? ` (${e.consequence})` : ""}`;
      // L'ÉTIQUETTE DIT LAQUELLE DES DEUX FUITES C'EST (corrigé le 2026-09-27). Les deux détecteurs
      // qui rendent un `exemple` ne disent PAS la même chose : findFuitesDeSpecificite() trouve du
      // vocabulaire propre au projet (un nom de personnage, le nom du produit), findDependancesOutillage()
      // trouve une dépendance à un outillage particulier (un crochet git, un gestionnaire de paquets).
      // Les afficher tous deux comme « jargon propre au projet » envoyait chercher un nom de
      // personnage dans un fichier qui n'en contient aucun — le lecteur perd son temps, puis cesse
      // de lire. Le premier porte une LIGNE, le second n'en porte pas : c'est ce qui les distingue
      // mécaniquement, et le « :undefined » affiché jusqu'ici était le symptôme visible du mélange.
      if (e.exemple && e.ligne == null) return `${ou} — dépend d'un outillage particulier : « ${String(e.exemple).trim().slice(0, 90)} »${e.occurrences > 1 ? ` (+${e.occurrences - 1} autre(s) dans ce fichier — corriger celle-ci ne suffira pas)` : ""}. Un blueprint générique décrit le MÉCANISME, jamais l'outil qui le porte ici : citer le crochet comme EXEMPLE suffit à lever l'écart.`;
      if (e.exemple) return `${ou}:${e.ligne} — jargon propre au projet : « ${String(e.exemple).trim().slice(0, 90)} »${e.occurrences > 1 ? ` (+${e.occurrences - 1} autre(s) dans ce fichier — corriger celle-ci ne suffira pas)` : ""}`;
      return `${ou} — ${e.pourquoi ?? "écart sans description : à regarder dans le corps du rapport"}`;
    },
    tache: (e) => `rendre ${e.fichier ?? e.outil} réellement exportable` });
  // LE GARDE-FOU DU GARDE-FOU (2026-09-25, chantier #206). Il vit chez SAFE-EXPORT parce que c'est
  // exactement sa question — « une autre IA pourrait-elle reprendre ce code sans défaire ce qui a
  // été gagné ? » (Article 27). Un huitième Gardien sacré ajouté demain sans déclarer son corpus
  // retomberait en silence dans le faux vert que ce chantier vient de fermer, et personne ne le
  // saurait : c'est précisément la dette de reprise que SAFE-EXPORT existe pour attraper.
  console.log("\n--- LES GARDIENS SACRÉS DÉCLARENT-ILS CE QU'ILS ONT REGARDÉ ? ---");
  const sourcesGardiens = {};
  for (const g of GARDIENS_SACRES) {
    try { sourcesGardiens[g] = readFileSync(join(ROOT, `scripts/${g}.mjs`), "utf8"); } catch { /* source illisible : comptée « non vérifiée », jamais « en faute » */ }
  }
  for (const l of formatGardiensSansMesureLines(findGardiensSansMesureDeCorpus(sourcesGardiens))) console.log(l);

  imprimerPlanDaction(plan);

  const sonde = proposerSondePoussee(tri.gardes);
  console.log(sonde.propose ? `\n🔍 Sonde profonde proposée : ${sonde.raison}` : `\n· Aucune sonde proposée : ${sonde.raison}`);

  // Série temporelle partagée (2026-09-22) — « l'exportabilité en instantané ne veut rien dire ».
  // Chaque mesure déclare son sens : sans quoi la flèche se tromperait une fois sur deux. Le nombre
  // de blueprints est NEUTRE et c'est important : 28 au lieu de 26 n'est ni bon ni mauvais, c'est
  // l'assiette sur laquelle les trois autres chiffres se lisent — une baisse des fuites qui
  // accompagne une baisse des blueprints ne prouve rien.
  enregistrerTendanceExport({ fuites: fuites.length, blueprintsMalConstruits: defauts.length, dependances: deps.length, blueprints: blueprints.length });
  for (const t of tendancesExport()) console.log(`  ${t.cle} : ${t.tendance ?? t.etat ?? "pas encore de tendance"}${t.pourquoi ? ` — ${t.pourquoi}` : ""}`);
  recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}


// ————————————————————————————————————————————————————————————————————————
// LA DETTE DE VOCABULAIRE : « gardien » employé seul (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur : « autre dette de vocabulaire : l'appellation "gardien" pour
// des agents différents : corrige ça [...] garde l'expression "gardien sacré" » — puis, dans le
// même échange : « "gardien" ou "guardian" en anglais, c'est pareil ».
//
// POURQUOI C'EST ICI, ET PAS AILLEURS. L'Article 27 le dit : « un nom propre sans définition
// atteignable est une dette de reprise, au même titre qu'un chemin cassé ». SAFE-EXPORT est
// précisément l'outil qui juge si une autre IA peut reprendre ce dépôt — un mot qui désigne quatre
// rôles différents est exactement ce qui la ferait se tromper, et c'est le seul outil du paysage
// dont c'est le mandat.
//
// LA PORTÉE, VOLONTAIREMENT ÉTROITE : les documents NORMATIFS seulement (CLAUDE.md et
// docs/referentiel/), jamais les registres, les rapports archivés ni le suivi. Un rapport daté
// écrit avant cette règle n'est pas un écart, c'est de l'histoire — le réécrire effacerait la
// trace de ce qui a été dit à l'époque, ce qu'aucun Article n'autorise. Et un garde-fou qui crie
// sur trois cents fichiers d'archive n'est plus lu.
//
// CE QU'IL ACCEPTE, donc ce qu'il ne signale jamais : les quatre termes qualifiés (Article 20bis
// de la charte), la définition elle-même, et le surnom R/O-Guardian donné par l'utilisateur.
// LA GÉNÉRALISATION (2026-09-23, question de l'utilisateur dans le même échange : « les dettes de
// vocabulaire sont à inclure dans l'outil dédié export, non ? »). Oui — et pas sous la forme d'un
// mot câblé en dur, sinon le prochain terme ambigu demanderait de réécrire la logique au lieu de
// rejoindre un registre (Article 24 : « un registre se LIT, il ne s'énumère pas »).
//
// VOCABULAIRE_RESERVE est ce registre. Un terme y déclare : le mot qui pose problème (les deux
// langues si besoin), les rangs qui le qualifient légitimement, et où la définition vit. Ajouter
// un terme ne touche aucune fonction — findVocabulaireAmbigu() le lit tel quel.
export const VOCABULAIRE_RESERVE = [
  {
    terme: "gardien",
    motif: /\b(gardiens?|guardians?)\b/gi,
    definition: "CLAUDE.md, Article 20bis",
    depuis: "2026-09-23",
    pourquoi: "le même mot désignait quatre rôles qui n'ont ni le même objet, ni la même autorité, ni le même rythme",
    rangs: () => RANGS_QUALIFIES,
    // Les noms de scripts qui portent déjà leur rang dans leur nom : jamais un emploi ambigu.
    toleres: /[a-z]*[.-]?process[.-][a-z.-]*guardian[a-z.-]*/gi,
  },
];

export const RANGS_QUALIFIES = [
  /gardiens?\s+sacrés?/i,          // le rang des sept, seul à garder le mot
  /contrôleurs?\s+de\s+process/i,  // le déroulé d'une activité à étapes
  /veilleurs?/i,                   // un document ou une décision déjà actée
  /garde-?fous?/i,                 // une fonction, jamais un outil
];

// Les orthographes anglaises acceptées : toutes portent `process` dans le nom, donc le rang y est
// déjà dit. Cette liste se VÉRIFIE contre les fichiers réels (findGuardiansHorsProcess ci-dessous),
// jamais recopiée à la main sans contrôle (Article 24).
export const SURNOMS_DECLARES = [
  { surnom: "R/O-Guardian", outil: "objectifs-vs-resultats", rang: "veilleur", pourquoi: "surnom donné par l'utilisateur le 2026-09-21 — un surnom d'utilisateur ne se corrige jamais dans son dos, il se déclare" },
];

const MOT_GARDIEN = /\b(gardiens?|guardians?)\b/gi;

// Un emploi est ambigu quand le mot apparaît SANS qu'un rang qualifié soit nommé dans la même
// phrase. La phrase — et non la ligne — est la bonne unité : un document à lignes courtes couperait
// « gardien » de son qualificatif à la ligne suivante et produirait un faux positif à chaque
// retour à la ligne.
export function findVocabulaireAmbigu(texte, entree, { surnoms = SURNOMS_DECLARES } = {}) {
  const MOT_GARDIEN = entree.motif;
  const rangs = typeof entree.rangs === "function" ? entree.rangs() : (entree.rangs ?? []);
  const ecarts = [];
  // Découpe sur la ponctuation FORTE seulement. Les deux-points ont d'abord été inclus, et ils
  // coupaient les citations en deux : « ... always new est un gardien à mon sens » devenait un
  // fragment sans son guillemet ouvrant, donc un faux écart sur les mots mêmes de l'utilisateur.
  const phrases = String(texte ?? "").split(/(?<=[.!?])\s+|\n\n+/);
  for (const phrase of phrases) {
    MOT_GARDIEN.lastIndex = 0;
    if (!MOT_GARDIEN.test(phrase)) continue;
    if (rangs.some((r) => r.test(phrase))) continue;
    if (surnoms.some((s) => phrase.includes(s.surnom))) continue;
    // UNE CITATION N'EST PAS UN EMPLOI (2026-09-23). Les fiches du référentiel citent les mots
    // exacts de l'utilisateur (« always new est un gardien à mon sens »). Les réécrire pour faire
    // taire ce garde-fou falsifierait ce qui a été dit, et la charte n'autorise nulle part à
    // corriger un propos dans le dos de celui qui l'a tenu. Le mot n'est donc retenu que hors
    // guillemets — c'est là seulement qu'il sert de titre.
    // Une citation coupée par la découpe en phrases garde un seul guillemet : « ... est un gardien
    // à mon sens » commence dans la phrase d'avant. Un fragment déséquilibré est donc encore une
    // citation, et la réécrire falsifierait tout autant le propos.
    const ouvrants = (phrase.match(/«/g) ?? []).length;
    const fermants = (phrase.match(/»/g) ?? []).length;
    if (ouvrants !== fermants) continue;
    const horsCitation = phrase.replace(/«[^»]*»/g, "").replace(/"[^"]*"/g, "");
    MOT_GARDIEN.lastIndex = 0;
    if (!MOT_GARDIEN.test(horsCitation)) continue;
    // `*-process-guardian` : l'orthographe historique du rang contrôleur de process, jamais un
    // cinquième terme. Un nom de fichier qui porte déjà `process` dit son rang.
    // Les deux orthographes réelles du nom : `process-simulation-guardian.mjs` (fichier) et
    // `process.simulation.guardian` (le nom parlé, donné par l'utilisateur). Les deux disent déjà
    // le rang par leur `process` — les traiter comme un emploi ambigu ferait crier le garde-fou sur
    // chaque mention d'un script, donc sur ce qu'il y a de moins ambigu dans tout le paysage.
    const sansNomsDeFichiers = entree.toleres ? phrase.replace(entree.toleres, "") : phrase;
    MOT_GARDIEN.lastIndex = 0;
    if (!MOT_GARDIEN.test(sansNomsDeFichiers)) continue;
    ecarts.push(phrase.trim().replace(/\s+/g, " ").slice(0, 160));
  }
  return ecarts;
}

// L'INSTANCE HISTORIQUE, gardée sous son nom parce que la charte le cite : elle ne fait plus que
// choisir son entrée dans le registre. Un nom cité ailleurs ne se change jamais en silence.
// LE RÉEXPORT QUI NE LIE PAS (2026-09-27, leçon L36, payée DEUX FOIS dans la même nuit).
// `export { X } from "./ailleurs.mjs"` rend X disponible aux APPELANTS de ce module et ne crée
// AUCUNE liaison locale. Toute fonction du même fichier qui appelle `X(...)` plante sur « is not
// defined » — à l'exécution seulement, jamais à la lecture, jamais à `node --check`.
//
// CE QUI LE REND MÉCHANT, ET POURQUOI IL MÉRITE UN GARDE-FOU PLUTÔT QU'UNE LEÇON : la moitié
// visible marche. Les appelants externes voient X, l'import se résout, et tout ce qui n'exerce pas
// le chemin interne reste vert. Les deux fois, le défaut n'a été trouvé qu'en lançant un outil
// tiers qui, lui, passait par là. Une leçon écrite ne l'aurait pas empêché une troisième fois
// (Article 27 : ce qu'aucun mécanisme ne porte n'existera plus à la session suivante).
//
// LA DÉTECTION EST EXACTE, PAS HEURISTIQUE : on lit les noms réexportés par cette forme, et on
// cherche un appel `nom(` dans le reste du fichier. Un fichier qui réexporte sans appeler est
// parfaitement légitime et n'est jamais signalé — c'est même le cas le plus courant.
export const MOTIF_REEXPORT_SANS_LIEN = /^\s*export\s*\{([^}]*)\}\s*from\s*["'][^"']+["']\s*;?\s*$/gm;

export function findReexportsNonLies(source = "", chemin = "?") {
  const out = [];
  const reexportes = [];
  let m;
  const motif = new RegExp(MOTIF_REEXPORT_SANS_LIEN.source, "gm");
  while ((m = motif.exec(String(source)))) {
    for (const brut of m[1].split(",")) {
      // `X as Y` : c'est Y qui serait lié chez l'appelant, mais NI l'un NI l'autre localement.
      const nom = brut.trim().split(/\s+as\s+/)[0].trim();
      if (nom && /^[A-Za-z_$][\w$]*$/.test(nom) && nom !== "default") reexportes.push(nom);
    }
  }
  if (!reexportes.length) return out;
  // UN NOM PEUT ÊTRE RÉEXPORTÉ **ET** LIÉ PAR AILLEURS, et c'est parfaitement correct : le fichier
  // l'importe normalement pour son usage interne, puis le réexporte pour ses appelants. Sans cette
  // vérification, le premier passage réel accusait SEPT noms dont les SEPT étaient légitimes —
  // `familleDeLaCategorie` est importé ligne 21 et réexporté ligne 2068, les autres sont définis
  // dans le fichier même. Un garde-fou qui accuse à tort cesse d'être lu (leçon L4), et celui-ci
  // serait mort à son premier rapport. On écarte donc tout nom déjà lié, de l'une des deux façons
  // possibles : importé par un `import { … }` ordinaire, ou déclaré ici.
  const lies = new Set();
  for (const imp of String(source).matchAll(/^\s*import\s*\{([^}]*)\}\s*from\s*["'][^"']+["']/gm)) {
    for (const brut of imp[1].split(",")) {
      const parts = brut.trim().split(/\s+as\s+/);
      const nom = (parts[1] ?? parts[0] ?? "").trim();
      if (nom) lies.add(nom);
    }
  }
  for (const d of String(source).matchAll(/^\s*(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) lies.add(d[1]);
  // ON NE CHERCHE UN APPEL QUE DANS DU VRAI CODE, et ça s'est vérifié au premier passage réel :
  // sur sept noms signalés, DEUX l'étaient à tort — `source: "typeDeScript()"` est une chaîne de
  // caractères qui DÉCRIT une fonction, jamais un appel. Un garde-fou qui accuse à tort cesse
  // d'être lu (leçon L4), et celui-ci serait mort à son premier rapport. On neutralise donc, avant
  // de chercher : les lignes de réexport elles-mêmes (sinon le nom compterait dans sa propre
  // déclaration), les commentaires, et le contenu des chaînes de caractères — sans toucher au
  // reste, parce qu'une découpe approximative rate des appels réels et c'est le défaut inverse.
  const corps = String(source)
    .replace(new RegExp(MOTIF_REEXPORT_SANS_LIEN.source, "gm"), "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
  for (const nom of [...new Set(reexportes)]) {
    if (lies.has(nom)) continue;
    if (new RegExp(`\\b${nom}\\s*\\(`).test(corps)) {
      out.push({ chemin, nom, pourquoi: `\`${nom}\` est réexporté sans être importé, et appelé dans ce même fichier : l'appel plantera sur « is not defined » à l'exécution. Écrire les deux lignes — \`import { ${nom} } from …\` puis \`export { ${nom} }\`.` });
    }
  }
  return out;
}

export function auditReexports({ root = ROOT, lireDossier = readdirSync, lireFichier = readFileSync } = {}) {
  let fichiers = [];
  try { fichiers = lireDossier(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); } catch { return { mesurable: false, pourquoi: "scripts/ illisible — « aucun réexport cassé » et « je n'ai rien lu » s'écrivent pareil", ecarts: [] }; }
  const ecarts = [];
  for (const f of fichiers) {
    let src = "";
    try { src = lireFichier(join(root, "scripts", f), "utf8"); } catch { continue; }
    ecarts.push(...findReexportsNonLies(src, `scripts/${f}`));
  }
  return { mesurable: true, ecarts, fichiers: fichiers.length };
}

export function formatReexportsLines(r) {
  if (!r?.mesurable) return [`   🚨 PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"}`];
  if (!r.ecarts.length) return [`   ✅ réexports : aucun nom réexporté sans liaison locale sur ${r.fichiers} fichiers (leçon L36).`];
  return ["   ⚠️  RÉEXPORT SANS LIAISON LOCALE — l'appel plantera à l'exécution, jamais à la lecture (leçon L36) :",
    ...r.ecarts.map((e) => `      · ${e.chemin} — ${e.pourquoi}`)];
}

// ─────────────────────────────────────────────────────────────────────────────
// LE PLAN DE LA MACHINE (2026-09-27, tâche #908) — GÉNÉRÉ, JAMAIS RÉDIGÉ.
//
// CE QUI MANQUAIT, ET SAFE-EXPORT LE DISAIT DÉJÀ SANS SAVOIR LE COMBLER : « un acheteur qui reçoit
// quatre-vingts plans de pièces détachées n'a pas reçu le plan de la machine. » Deux documents
// génériques existent — `docs/agence-blueprint.md` (ce que l'Agence EST) et
// `docs/agence-installation.md` (dans quel ORDRE la poser) — et tous deux sont écrits en prose
// volontairement sans nommer un seul fichier de ce dépôt, ce qui est juste pour un blueprint
// destiné à voyager. Il manquait leur pendant INSTANCIÉ : pour CE dépôt-ci, quels fichiers forment
// la chaîne, qui dépend de qui, et par où commencer.
//
// LA CONTRAINTE EST LE CŒUR DE LA TÂCHE, et elle vient d'elle : ce document doit être DÉRIVÉ de la
// chaîne quotidienne et du graphe d'imports, jamais rédigé. Écrit à la main il se périmerait au
// premier fichier ajouté — exactement comme les quatre listes que l'audit d'évolutivité du
// 2026-09-21 avait trouvées déjà fausses (Article 24).
//
// L'ORDRE D'INSTALLATION SE CALCULE, IL NE SE DÉCIDE PAS. Le palier d'un fichier est la longueur
// de la plus longue chaîne de dépendances qui mène à lui : un fichier qui n'importe personne est au
// palier 0 et se pose en premier, un fichier qui importe un fichier de palier 3 est au moins au
// palier 4. Poser les paliers dans l'ordre garantit qu'aucun fichier n'arrive avant ce dont il a
// besoin — c'est la seule définition d'un « ordre d'installation » qui ne soit pas une opinion.
//
// LES CYCLES SONT DÉCLARÉS, JAMAIS CONTOURNÉS EN SILENCE. Un cycle d'import rend la notion de
// palier indéfinie pour les fichiers qui en font partie. On coupe la récursion pour ne pas boucler,
// et on NOMME les fichiers concernés : un plan d'installation qui masquerait un cycle donnerait un
// ordre impossible à suivre, et celui qui le suit ne comprendrait pas pourquoi.
export function paliersDInstallation({ lignes = [], importeDe = {}, chaine = null } = {}) {
  const dans = chaine ?? new Set(lignes.map((l) => l.chemin));
  if (!dans.size) return { mesurable: false, pourquoi: "aucune chaîne quotidienne fournie — « rien à installer » et « je n'ai rien lu » s'écrivent pareil", paliers: [], cycles: [] };
  const dep = {};
  for (const [src, cibles] of Object.entries(importeDe)) {
    if (!dans.has(src)) continue;
    dep[src] = [...(cibles ?? [])].filter((c) => dans.has(c));
  }
  const memo = {}; const enCours = new Set(); const cycles = new Set();
  const palier = (c) => {
    if (memo[c] !== undefined) return memo[c];
    if (enCours.has(c)) { cycles.add(c); return 0; }
    enCours.add(c);
    const d = dep[c] ?? [];
    const v = d.length ? 1 + Math.max(...d.map(palier)) : 0;
    enCours.delete(c); memo[c] = v; return v;
  };
  const parPalier = new Map();
  for (const c of dans) {
    const p = palier(c);
    if (!parPalier.has(p)) parPalier.set(p, []);
    parPalier.get(p).push(c);
  }
  const paliers = [...parPalier.entries()].sort((a, b) => a[0] - b[0])
    .map(([niveau, fichiers]) => ({ niveau, fichiers: fichiers.sort(), depend: fichiers.sort().map((f) => ({ fichier: f, sur: (dep[f] ?? []).sort() })) }));
  return { mesurable: true, paliers, cycles: [...cycles].sort(), total: dans.size };
}

export function renderPlanDeLaMachine(plan, { entrees = [], horodatage = "", commit = "" } = {}) {
  const l = [];
  l.push("# Le plan de la machine — l'Agence Codex telle qu'elle est câblée ici");
  l.push("");
  l.push("> **Ce document est GÉNÉRÉ** par `node scripts/safe-export.mjs plan-machine`, depuis la chaîne");
  l.push("> quotidienne réelle et le graphe d'imports. **Ne pas l'éditer à la main** : la prochaine");
  l.push("> génération écrase tout. Écrit à la main, il se périmerait au premier fichier ajouté — c'est");
  l.push("> exactement ce que la tâche #908 demandait d'éviter (Article 24).");
  l.push("");
  if (horodatage) l.push(`*Produit le ${horodatage}${commit ? ` · état du code : ${commit}` : ""}.*`);
  l.push("");
  l.push("**Son complément générique, à lire d'abord** : `docs/agence-blueprint.md` dit ce que l'Agence EST,");
  l.push("`docs/agence-installation.md` dans quel ORDRE la poser — tous deux sans nommer un fichier, pour");
  l.push("pouvoir voyager. Ce document-ci est leur pendant instancié : les mêmes étapes, avec les vrais noms.");
  l.push("");
  if (!plan?.mesurable) {
    l.push(`## 🚨 PAS MESURÉ`);
    l.push("");
    l.push(plan?.pourquoi ?? "raison non fournie");
    return l.join("\n") + "\n";
  }
  l.push("## Par où ça démarre");
  l.push("");
  l.push("Ce que l'Agence lance elle-même, sans que personne le demande — tout le reste n'est atteint");
  l.push("que par eux :");
  l.push("");
  for (const e of entrees) l.push(`- \`${e}\``);
  if (!entrees.length) l.push("- *(aucun point d'entrée dérivé — la sonde n'a rien trouvé, ce qui est un défaut de câblage, pas un dépôt vide)*");
  l.push("");
  l.push(`## L'ordre d'installation — ${plan.paliers.length} paliers, ${plan.total} fichiers`);
  l.push("");
  l.push("Le palier d'un fichier est la longueur de la plus longue chaîne de dépendances qui mène à lui.");
  l.push("**Poser les paliers dans l'ordre garantit qu'aucun fichier n'arrive avant ce dont il a besoin.**");
  l.push("C'est la seule définition d'un ordre d'installation qui ne soit pas une opinion.");
  l.push("");
  for (const p of plan.paliers) {
    l.push(`### Palier ${p.niveau} — ${p.fichiers.length} fichier(s)`);
    l.push("");
    if (p.niveau === 0) l.push("*Ils n'importent rien de la chaîne : ils se posent en premier, dans n'importe quel ordre entre eux.*");
    l.push("");
    for (const d of p.depend) {
      l.push(d.sur.length
        ? `- \`${d.fichier}\` — après ${d.sur.map((x) => `\`${x}\``).join(", ")}`
        : `- \`${d.fichier}\``);
    }
    l.push("");
  }
  l.push("## Ce que ce plan ne dit pas");
  l.push("");
  l.push("**Il ne dit pas ce que chaque fichier FAIT** : ça, c'est son blueprint et sa fiche. Il dit dans");
  l.push("quel ordre les poser pour qu'aucun n'arrive orphelin.");
  l.push("");
  l.push("**Il ne couvre que la chaîne QUOTIDIENNE** — ce que les points d'entrée atteignent réellement.");
  l.push("Un outil lancé seulement à la main n'y figure pas, et son absence n'est pas un verdict sur lui.");
  l.push("");
  if (plan.cycles.length) {
    l.push(`**Il y a ${plan.cycles.length} fichier(s) dans un cycle d'imports**, et leur palier est donc indéfini :`);
    l.push("");
    for (const c of plan.cycles) l.push(`- \`${c}\``);
    l.push("");
    l.push("Un cycle ne casse pas l'installation (les modules se résolvent), mais il rend l'ordre arbitraire");
    l.push("entre eux. **Il est nommé plutôt que masqué** : un plan qui cacherait un cycle donnerait un ordre");
    l.push("impossible à suivre sans qu'on comprenne pourquoi.");
  } else {
    l.push("**Aucun cycle d'imports dans la chaîne** : l'ordre ci-dessus est suivable de bout en bout.");
  }
  l.push("");
  return l.join("\n") + "\n";
}

export function findGardienAmbigu(texte, options = {}) {
  return findVocabulaireAmbigu(texte, VOCABULAIRE_RESERVE.find((v) => v.terme === "gardien"), options);
}

// LE BALAYAGE RÉEL, sur les documents normatifs seulement (cf. portée ci-dessus). C'est ce que
// SAFE-EXPORT fait remonter dans ses écarts : une dette de vocabulaire est une dette de REPRISE,
// donc son domaine, jamais celui d'un Gardien sacré du code.
export function scanVocabulaire({ root = ROOT, termes = VOCABULAIRE_RESERVE, readFileImpl = lireFichierPartage, listDirImpl = readdirSync } = {}) {
  const cibles = ["CLAUDE.md"];
  try {
    for (const f of listDirImpl(join(root, "docs/referentiel"))) if (f.endsWith(".md")) cibles.push(`docs/referentiel/${f}`);
  } catch { /* référentiel absent : le dire par un résultat vide, jamais par un vert */ }
  const ecarts = [];
  for (const cible of cibles) {
    let texte;
    try { texte = readFileImpl(join(root, cible), "utf8"); } catch { continue; }
    for (const entree of termes) {
      for (const phrase of findVocabulaireAmbigu(texte, entree)) {
        ecarts.push({ fichier: cible, terme: entree.terme, definition: entree.definition, phrase });
      }
    }
  }
  return { cibles: cibles.length, mesure: cibles.length ? "mesuré" : "pas mesuré — aucun document normatif trouvé", ecarts };
}

// L'AUTRE MOITIÉ, et sans elle la première ne garantit rien : un futur script nommé `*-guardian`
// SANS `process` dans son nom rouvrirait l'ambiguïté par le code, pendant que les documents
// resteraient impeccables. Lu sur le disque réel, jamais sur une liste tenue à la main.
export function findGuardiansHorsProcess({ root = ROOT, listDirImpl = readdirSync } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")); } catch { return []; }
  return fichiers
    .filter((f) => /guardian/i.test(f) && !/process/i.test(f))
    .map((f) => `scripts/${f} : porte « guardian » sans « process » — le rang n'est plus dit par le nom. Un contrôleur de process le nomme ; un Gardien sacré ne prend jamais cette orthographe.`);
}

// ══════════════════════════════════════════════════════════════════════════
// LE REMÈDE À MOITIÉ CÂBLÉ — « JAMAIS SOLLICITÉ » SANS SON HORIZON (2026-09-30, tâche #1283)
// ══════════════════════════════════════════════════════════════════════════
//
// CE QUI A ÉTÉ MESURÉ, ET C'EST UN DÉFAUT DE CÂBLAGE, JAMAIS UNE IDÉE NEUVE. Le journal d'usage
// (.tool-usage-history.json) est dans .gitignore : il ne voyage pas avec le clone et se reconstruit
// de zéro à chaque conteneur. Mesuré le 2026-09-30 : son plus ancien événement avait 23 HEURES,
// sur un dépôt de deux semaines. La conséquence est connue et elle a déjà son remède —
// horizonDuJournal() et formatHorizonLine() (tool-usage.mjs, tâche #1244, 2026-09-29) impriment
// « le journal ne couvre que N % : jamais sollicité veut dire jamais vu passer sur cette fenêtre ».
//
// LE DÉFAUT EST QUE CE REMÈDE N'EST CÂBLÉ QUE CHEZ UN SEUL LECTEUR sur les trois qui rendent le
// verdict. tool-brain l'imprime ; CASSANDRA-RH, qui propose de RETIRER des outils, et Doc-Report,
// qui annote les registres, ne l'impriment pas. Un remède écrit et non câblé est une intention
// (leçon L2), et ici il laisse passer exactement le tort qu'il devait empêcher, sur le lecteur
// dont la conclusion est la plus lourde.
//
// LA PORTÉE EST ÉTROITE EXPRÈS, ET C'EST LE CHOIX QUI REND CE GARDE-FOU LISIBLE (leçon L4 : un
// garde-fou qui accuse à tort cesse d'être lu). On ne cherche pas « qui parle du compteur » — la
// moitié du dépôt en parle en commentaire. On cherche l'IMPORT de toolsNeverUsed(), la fonction
// canonique qui rend le verdict d'absence : une ligne d'import est un fait mécanique, jamais une
// tournure de prose, donc aucun commentaire ne peut la simuler.
//
// SA LIMITE, DÉCLARÉE PLUTÔT QUE TUE : un lecteur qui recompte les événements lui-même au lieu
// d'appeler toolsNeverUsed() lui échappe. report-template.mjs faisait exactement cela — il a été
// câblé à la main le même jour. Le garde-fou couvre la fonction canonique ; savoir qu'un
// COMPTAGE maison rend un verdict d'absence demande de lire ce que le code VEUT dire, ce qu'aucun
// motif ne fait. Sous-déclarer vaut mieux que fabriquer des coupables.
export const FONCTION_DU_VERDICT_DABSENCE = "toolsNeverUsed";
export const FONCTIONS_DE_LHORIZON = ["formatHorizonLine", "horizonDuJournal"];
export function findVerdictsSansHorizon({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")); } catch { return { mesurable: false, pourquoi: "dossier scripts/ illisible — aucun verdict rendu, jamais un vert", lecteurs: 0, ecarts: [] }; }
  const lecteurs = [];
  for (const nom of fichiers.filter((f) => f.endsWith(".mjs")).sort()) {
    if (nom === "tool-usage.mjs" || nom === "check-house.mjs") continue;
    let src;
    try { src = readFileImpl(join(root, "scripts", nom), "utf8"); } catch { continue; }
    const importe = new RegExp(`^import\\s*\\{[^}]*\\b${FONCTION_DU_VERDICT_DABSENCE}\\b[^}]*\\}\\s*from\\s*["\'][^"\']*tool-usage\\.mjs["\']`, "m").test(src);
    if (!importe) continue;
    const aLHorizon = FONCTIONS_DE_LHORIZON.some((nomFn) => src.includes(nomFn));
    lecteurs.push({ fichier: `scripts/${nom}`, aLHorizon });
  }
  return {
    mesurable: true,
    lecteurs: lecteurs.length,
    ecarts: lecteurs.filter((l) => !l.aLHorizon).map((l) => ({
      fichier: l.fichier,
      defaut: "rend le verdict d'absence du compteur sans jamais imprimer l'horizon du journal — sur un journal qui se reconstruit à chaque conteneur, « jamais sollicité » se lit comme « jamais utilisé par le projet » alors qu'il ne dit que « jamais vu passer depuis hier »",
    })),
  };
}
// ══════════════════════════════════════════════════════════════════════════
// CE QU'UN CLONE NEUF PERD EN SILENCE (2026-09-30, tâche #1285)
// ══════════════════════════════════════════════════════════════════════════
//
// LA QUESTION EST CELLE DE L'ARTICLE 27, POSÉE SUR LES DONNÉES PLUTÔT QUE SUR LE CODE : une IA
// qui ne dispose que de ce dépôt reprend-elle le chantier sans rien perdre ? Le code part avec le
// clone. Les journaux locaux, non : ils sont dans `.gitignore`, donc ils meurent avec le conteneur.
//
// CE N'EST PAS UN DÉFAUT EN SOI — un cache DOIT être ignoré. Le défaut est qu'on ne peut pas
// distinguer le cache assumé de l'historique qu'on croyait permanent, et le cas réel est mesuré :
// `.tool-usage-history.json` se déclarait « cumul PERMANENT depuis le début du projet » dans son
// propre en-tête, phrase recopiée dans le catalogue de LE-COORDINATEUR. Le fichier est ignoré : il
// avait 23 heures. La contradiction a vécu des jours parce que rien ne DEMANDAIT l'intention.
//
// LA PREMIÈRE VERSION DE CE GARDE-FOU CHERCHAIT L'INTENTION DANS `.gitignore`, ET ELLE AURAIT
// ACCUSÉ QUATRE INNOCENTS. Elle rendait « 14 fichiers, 0 intention ». Or `.agent-session.json`,
// `.banniere-post-commit.txt`, `.xp-remontees.json` et `.conso-tours.json` DISENT déjà, mot pour
// mot, que leur perte est sans conséquence — dans `LOCAL_JOURNALS` (doc-report.mjs), le registre
// qui les déclare. Je regardais au mauvais endroit : encore un signal adjacent lu comme le signal
// visé (leçon L47), et cette fois sur le garde-fou même que j'écrivais pour ça.
//
// CE QUI EST MESURÉ À LA PLACE : chaque journal déclaré porte-t-il un champ `auClone` qui DIT ce
// que vaut sa perte ? Un champ, jamais une phrase à interpréter — une prose qui contient « jamais
// un état du projet » se reconnaît, une prose qui n'en parle pas ne prouve rien, et un garde-fou
// qui devine l'intention d'un texte finit par la deviner mal.
//
// IL NE DIT JAMAIS S'IL FAUT VERSIONNER : c'est une décision d'hygiène du dépôt, donc humaine
// (posée au point #1222 de `docs/idees-a-trancher.md`). Il dit ce qui n'est pas décidé.
//
// LE POIDS SERT À CLASSER, JAMAIS À JUGER : un gros fichier perdu n'est pas forcément grave, mais
// c'est par lui qu'on commence à regarder. `present: false` reste distinct d'un poids nul — un
// journal jamais écrit n'a rien à perdre, et ce n'est pas la même chose qu'un journal vide.
export const AU_CLONE = Object.freeze({
  "perte-acceptee": "cache, rendu régénérable ou mesure propre à une machine — le perdre ne coûte rien",
  "resume-committe": "le journal brut meurt, mais un résumé committé porte ce qui compte",
  "perte-reelle": "rien ne survit au clone, et personne n'a encore décidé si c'est acceptable",
});
export function findEtatsPerdusAuClone({ root = ROOT, journaux = null, statImpl = null } = {}) {
  if (!Array.isArray(journaux)) return { mesurable: false, pourquoi: "registre LOCAL_JOURNALS non fourni — impossible de conclure, et surtout pas que tout est déclaré", etats: [], sansIntention: [] };
  const taille = statImpl ?? ((p) => { try { return statSync(p).size; } catch { return null; } });
  const etats = journaux.map((j) => {
    const octets = taille(join(root, String(j?.path ?? "").replace(/^\//, "")));
    const valeur = j?.auClone ?? null;
    return {
      chemin: j?.path ?? "?",
      proprietaire: j?.owner ?? "?",
      present: octets !== null,
      octets,
      auClone: valeur,
      reconnu: valeur === null ? null : Object.hasOwn(AU_CLONE, valeur),
    };
  });
  etats.sort((a, b) => (b.octets ?? -1) - (a.octets ?? -1));
  return {
    mesurable: true,
    etats,
    sansIntention: etats.filter((e) => e.auClone === null),
    intentionInconnue: etats.filter((e) => e.reconnu === false),
    perteReelle: etats.filter((e) => e.auClone === "perte-reelle"),
  };
}
// LE LANCEUR EN DERNIER, ET C'EST UNE CONTRAINTE RÉELLE, pas une préférence de rangement : il
// était placé au milieu du fichier, donc main() s'exécutait avant que les `const` écrits en
// dessous n'existent (zone morte temporelle). scanVocabulaire() a planté au premier vrai
// lancement — l'outil aurait paru fini et n'aurait jamais tourné. Toute section ajoutée plus bas
// hérite désormais de la garantie : au moment où main() part, tout le module est initialisé.

// ══════════════════════════════════════════════════════════════════════════
// LES KITS D'EXPORT (2026-09-26) — LE BLUEPRINT NE PART JAMAIS SEUL
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE, mot pour mot : « tu m'avais dit qu'il était possible, en plus du blueprint, de
// transmettre le fichier .mjs. Je veux consolider l'export, je veux ajouter à chaque outil/élément
// vital ou important à l'agence un kit complet. Et un kit d'export moins conséquent (parce que
// moins pertinent) pour les autres, de façon proportionnelle. [...] définir des niveaux
// d'exportabilité, faire correspondre des niveaux de kits et des niveaux de criticité sur le
// sujet. Je veux un système cohérent. »
//
// CE QUI EXISTAIT, ET CE QUI MANQUAIT. La VITALITÉ existait déjà (quatre niveaux dérivés, chez
// LE-CLASSIFICATEUR) et `mesurerLExportabilite()` la croisait déjà avec le blueprint. Mais ce
// croisement est BINAIRE : blueprint, ou pas de blueprint. Or un blueprint tout seul ne s'exporte
// pas — il décrit une mécanique que le destinataire devra réécrire. Ce qui part vraiment, c'est un
// ENSEMBLE : le plan, le code, ce qu'il faut adapter, ce qui le vérifie, et ce sans quoi il ne
// démarre pas. Le kit nomme cet ensemble, et le fait varier avec ce que l'outil vaut.
//
// LE PRINCIPE DE PROPORTIONNALITÉ, qui est sa demande exacte : le niveau de kit se DÉRIVE du niveau
// de vitalité, il ne se déclare pas. Un outil qui devient vital hérite automatiquement du kit
// complet sans que personne n'y pense — c'est l'Article 24 appliqué à l'export, et c'est ce qui
// empêche le système de se périmer au prochain outil.
//
// CE QUE LE KIT N'EST PAS : une promesse que l'outil marchera ailleurs. Il dit ce qui est PRÊT à
// partir, jamais que le portage réussira. Cette limite est imprimée dans le rapport plutôt que tue.
//
// DEUX NOTIONS DISTINCTES, ET IL A CORRIGÉ CE POINT EXPRESSÉMENT (2026-09-26, « CORRECTION
// URGENTE ») : les quatre niveaux VITAL / ESSENTIEL / UTILE / OPTIONNEL qualifient l'importance
// d'un fichier **pour LE FONCTIONNEMENT DE L'AGENCE**, jamais son exportabilité. La confusion
// serait grave et pas seulement verbale : un fichier peut être vital au fonctionnement et trivial
// à exporter (une bibliothèque de dix lignes), ou secondaire au fonctionnement et lourd à
// transmettre (un outil rare mais subtil). Le KIT est la CONSÉQUENCE du niveau, jamais le niveau
// lui-même : on mesure ce que le fichier vaut pour l'Agence, puis on en déduit ce qui doit partir
// avec lui. Un seul axe, lu deux fois — c'est le système cohérent qu'il demande, et c'est ce qui
// empêche qu'un jour deux échelles disent deux choses du même fichier (leçon L29).

// LES CINQ PIÈCES, et chacune répond à une question qu'un destinataire se pose vraiment.
export const PIECES_DU_KIT = [
  { cle: "blueprint", quoi: "le blueprint générique", question: "comment ça marche, indépendamment de ce projet-ci ?",
    chemin: (base) => `docs/${base}-blueprint.md` },
  { cle: "source", quoi: "le fichier de code lui-même", question: "qu'est-ce que je copie ?",
    chemin: (base, ligne) => ligne?.chemin ?? `scripts/${base}.mjs` },
  { cle: "fiche", quoi: "la fiche d'instanciation", question: "qu'est-ce qui est propre à CE projet, donc à adapter chez moi ?",
    chemin: (base) => `docs/referentiel/${base}.md` },
  { cle: "registre", quoi: "le dossier d'historisation avec son index", question: "où l'outil écrit-il, et sous quelle forme ?",
    chemin: (base) => `docs/${base}/index.md` },
  { cle: "dependances", quoi: "la liste de ce qui doit partir AVEC lui", question: "que dois-je emporter d'autre pour qu'il démarre ?",
    // Pas un fichier : une liste DÉRIVÉE des imports réels du code. Un kit qui oublie une
    // dépendance livre un outil qui ne démarre pas, et c'est le plus décourageant des échecs —
    // il se produit à la première seconde, avant que le destinataire ait rien pu juger.
    derivee: true },
];

// ══════════════════════════════════════════════════════════════════════════
// LE KIT EST COMPLET POUR TOUS — SA CORRECTION DU 2026-09-26, ET ELLE EST JUSTE
// ══════════════════════════════════════════════════════════════════════════
//
// SES MOTS : « je comprends ma logique de départ, mais elle est mauvaise : le résultat, c'est que
// les optionnels de l'agence ne pourront pas être réinstallés correctement si on les a intégrés à
// l'agence. Ça n'est pas logique. »
//
// POURQUOI IL A RAISON, ET POURQUOI MON PREMIER SYSTÈME ÉTAIT FAUX. J'avais fait varier le kit
// avec la VITALITÉ, c'est-à-dire avec ce que l'Agence perd sans le fichier. Mais le kit ne répond
// pas à cette question-là. Il répond à : **peut-on le réinstaller ailleurs ?** Et cette question a
// la même réponse pour tout le monde — un optionnel exporté sans son plan est un optionnel
// irrécupérable, et il partira quand même, puisqu'il fait partie de l'Agence. Faire dépendre la
// réinstallabilité de l'importance produisait très exactement l'absurdité qu'il nomme : on
// emporte le fichier, et on ne sait plus le remonter.
//
// CE QUI REMPLACE LA PROPORTIONNALITÉ, et ce n'est pas « tout le monde doit tout » : deux
// mécanismes, qui ne se confondent jamais.
//   1. UNE PIÈCE PEUT ÊTRE SANS OBJET. Un registre n'est dû qu'à un fichier qui ÉCRIT quelque
//      chose : une bibliothèque n'a rien à historiser, et lui réclamer un index serait réclamer un
//      document vide. La pièce est alors « sans objet », jamais « manquante » — les deux se
//      ressemblent dans un compte et appellent l'inverse l'une de l'autre.
//   2. UN FICHIER PEUT ÊTRE EXEMPTÉ, avec sa raison ÉCRITE. Ce sont les fichiers qui ne partiront
//      pas : ceux qui servent le PRODUIT et non l'outillage, et ceux qui décrivent la machine
//      d'ici. Une exemption sans raison n'est pas une décision, c'est un abandon déguisé
//      (Article 28).
//
// LA VITALITÉ NE DISPARAÎT PAS POUR AUTANT : elle reste l'axe qui dit ce que l'Agence perd sans le
// fichier, donc l'ORDRE dans lequel on répare les kits manquants. Elle ne décide plus de ce qui
// est dû — elle décide de ce qu'on fait en premier. C'est une PRIORITÉ, jamais une dispense.
export const KIT_COMPLET = ["blueprint", "source", "fiche", "registre", "dependances"];

// LES EXEMPTIONS, chacune avec sa raison, et elles sont rares par construction.
export const EXEMPTES_DU_KIT = [
  { motif: /^scripts\/install-pnpm\.sh$/, pourquoi: "il installe l'environnement de CE conteneur : il décrit la machine d'ici, jamais un outil à remonter ailleurs" },
  // AJOUTÉS LE 2026-09-28 (tâche #902, trouvés par le banc témoin) : ce sont les DEUX AUTRES
  // installeurs de l'environnement d'ici, et ils tombent mot pour mot sous le critère écrit
  // au-dessus — ils décrivent la machine, pas un outil. `install-pnpm.sh` y était, eux non, ce qui
  // est la leçon L37 une fois de plus : on avait corrigé l'occurrence, pas la classe. Le banc les
  // comptait donc comme « l'Agence ne part pas », alors qu'ils n'ont jamais eu à partir.
  { motif: /^scripts\/install-ci/, pourquoi: "il installe les dépendances de CE dépôt en intégration continue : il décrit la machine d'ici, jamais un outil à remonter ailleurs" },
  { motif: /^scripts\/pnpm-install/, pourquoi: "il installe les dépendances de CE dépôt : il décrit la machine d'ici, jamais un outil à remonter ailleurs" },
  { motif: /^scripts\/hooks\//, pourquoi: "les crochets git sont le CÂBLAGE de l'Agence à ce dépôt-ci, pas des outils : ils se réinstallent par `hooks/install.mjs`, qui a lui-même son kit" },
  { motif: /^scripts\/run-framework/, pourquoi: "il lance le PRODUIT (le jeu), pas l'outillage — rang Hors Agence : ce qui part avec l'Agence n'a pas à emporter le camion de livraison" },
];

// CONSTRUIRE OU FAIRE TOURNER : LA PART DE L'AGENCE QUI NE SERT PLUS APRÈS L'INSTALLATION
// (2026-09-27, tâche #902 — sa question, posée dans son gros prompt du 2026-09-26 : « la part de
// l'Agence inutile en version commercialisée, estimée en lignes de code ».)
//
// LA LOGIQUE QU'IL AVAIT DÉJÀ POSÉE, et cette mesure ne fait que la chiffrer : **l'exportabilité
// est un besoin DU CRÉATEUR pendant la construction, jamais de l'acheteur après installation.**
// Un acheteur qui installe le produit n'a besoin d'aucun garde-fou, d'aucun registre, d'aucune
// Ronde — tout ça a servi à FABRIQUER ce qu'il reçoit.
//
// LA FRONTIÈRE SE LIT, ELLE NE SE DEVINE PAS : c'est exactement celle que `EXEMPTES_DU_KIT`
// déclare déjà, avec ses raisons écrites — le lanceur du produit et l'installeur de
// l'environnement d'un côté, tout le reste de l'autre. Aucune seconde liste (Article 24, L29).
//
// CE QUE LA MESURE NE VOIT PAS, et le dire fait partie du résultat : elle compte `scripts/`, donc
// l'OUTILLAGE. Le produit lui-même (`lib/`, `app/`, `components/`) n'est pas dans le dénominateur
// — la question porte sur ce que l'Agence emporterait pour rien, pas sur la taille du jeu. Et une
// ligne n'est pas un coût : 70 000 lignes d'outillage ne pèsent rien à l'exécution d'un produit
// qui ne les lance jamais. Ce chiffre éclaire un ARBITRAGE, il ne rend aucun verdict.
export function partDeConstruction({ recensement = null, exemptes = EXEMPTES_DU_KIT, recenser = null } = {}) {
  const rec = recensement ?? (recenser ? recenser() : null);
  if (!rec?.lignes?.length) {
    return { mesurable: false, pourquoi: "aucun recensement de scripts fourni — « rien d'inutile » et « je n'ai rien compté » s'écrivent tous les deux zéro (leçon L11)" };
  }
  let total = 0, produit = 0;
  const sertLeProduit = [];
  for (const l of rec.lignes) {
    const n = l.lignes ?? 0;
    total += n;
    const ex = exemptionDuKit(l.chemin, { exemptes });
    // Parmi les exemptés, seuls comptent ici ceux dont la raison écrite dit qu'ils servent le
    // PRODUIT ou la MACHINE — un crochet git est exempté d'export mais reste de la construction.
    if (ex && /PRODUIT|environnement de CE conteneur/.test(ex.pourquoi)) {
      produit += n;
      sertLeProduit.push({ chemin: l.chemin, lignes: n, pourquoi: ex.pourquoi });
    }
  }
  const construction = total - produit;
  return {
    mesurable: true, total, produit, construction,
    partConstruction: total ? Math.round((construction / total) * 1000) / 10 : null,
    sertLeProduit,
    horsPortee: "compte scripts/ seulement — le produit lui-même n'est pas au dénominateur, et une ligne qui ne s'exécute jamais ne coûte rien à l'installation. Ce chiffre éclaire un arbitrage, il ne rend aucun verdict.",
  };
}

export function formatPartDeConstructionLines(r) {
  if (!r?.mesurable) return [`   🚨 PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"}`];
  const l = ["", "🏗️  CONSTRUIRE OU FAIRE TOURNER — ce que l'Agence emporterait pour rien (tâche #902)"];
  l.push(`   ${r.construction} lignes sur ${r.total} servent à CONSTRUIRE — ${r.partConstruction} %.`);
  l.push(`   ${r.produit} lignes seulement servent encore une fois le produit installé :`);
  for (const x of r.sertLeProduit) l.push(`      · ${x.chemin} (${x.lignes} lignes) — ${x.pourquoi}`);
  l.push("   CE QUE ÇA CONFIRME, et c'est son propre cadrage : l'exportabilité est un besoin du CRÉATEUR");
  l.push("   pendant la construction, jamais de l'acheteur après installation.");
  l.push(`   HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

export function exemptionDuKit(chemin, { exemptes = EXEMPTES_DU_KIT } = {}) {
  return exemptes.find((e) => e.motif.test(String(chemin))) ?? null;
}

// ÉCRIT-IL QUELQUE CHOSE ? La question qui rend le registre DÛ ou SANS OBJET. Lue dans le code
// plutôt que déclarée : un fichier qui appelle une écriture ou enregistre un rapport tient une
// mémoire, les autres non — et une liste tenue à la main se périmerait au premier outil qui se met
// à écrire.
export const MOTIF_ECRIT = /writeFileSync|appendFileSync|recordCircleItemReport|recordRegistryWrite|enregistrer[A-Z]/;
export function tientUneMemoire(source = "") { return MOTIF_ECRIT.test(String(source)); }

// LES NIVEAUX DE VITALITÉ NE CHANGENT PLUS LE KIT : ils donnent l'ORDRE DE RÉPARATION. Gardé sous
// le même nom pour que rien d'autre ne bouge, mais chaque entrée porte désormais le kit COMPLET.
export const NIVEAUX_DE_KIT = [
  { vitalite: "vital", cle: "complet", icone: "🔴", pieces: KIT_COMPLET, rang: 1,
    pourquoi: "sans lui l'Agence ne tourne pas : son kit se répare EN PREMIER — la priorité, jamais une exigence plus haute" },
  { vitalite: "essentiel", cle: "complet", icone: "🟠", pieces: KIT_COMPLET, rang: 2,
    pourquoi: "il porte une garantie : deuxième dans l'ordre de réparation, même kit dû" },
  { vitalite: "utile", cle: "complet", icone: "🟡", pieces: KIT_COMPLET, rang: 3,
    pourquoi: "il fait gagner du temps ici, et il devra pouvoir le faire ailleurs : même kit dû, réparé après les deux premiers" },
  { vitalite: "optionnel", cle: "complet", icone: "⚪", pieces: KIT_COMPLET, rang: 4,
    pourquoi: "personne ne le lance ici, mais il partira quand même avec l'Agence — et un optionnel exporté sans son plan est un optionnel irrécupérable" },
];

export function kitAttendu(niveauVitalite, { niveaux = NIVEAUX_DE_KIT } = {}) {
  return niveaux.find((n) => n.vitalite === niveauVitalite) ?? null;
}

// basesDuChemin() — LES DEUX ORTHOGRAPHES, et il en faut deux parce que le dépôt en emploie deux.
//
// MESURÉ AVANT D'ÊTRE ÉCRIT : `scripts/check-argus.mjs` a son plan sous `docs/argus-blueprint.md`
// (sans le préfixe), tandis que `scripts/check-suivi-fidelity.mjs` a le sien sous
// `docs/check-suivi-fidelity-blueprint.md` (avec). Les deux conventions cohabitent depuis toujours,
// et aucune n'est fautive — ce sont des noms, donc des décisions humaines.
//
// POURQUOI CE DÉTAIL COMPTE AUTANT : un lecteur qui n'essaie qu'une seule orthographe déclare
// absent un document qui existe, et rend une liste de « pièces manquantes » qu'on irait créer en
// double. C'est le motif L11 pour la troisième fois ce jour-là, et mon premier jet le portait —
// il réclamait `docs/house-blueprint.md` pour `check-house.mjs` et `docs/suivi-fidelity-…` pour un
// blueprint qui existe. On essaie donc les deux, et la pièce compte dès que l'une des deux existe.
export function basesDuChemin(chemin) {
  const nu = String(chemin).replace(/^scripts\//, "").replace(/^hooks\//, "").replace(/\.(mjs|sh)$/, "");
  return nu.startsWith("check-") ? [nu, nu.slice("check-".length)] : [nu];
}
export function baseDuChemin(chemin) { return basesDuChemin(chemin)[0]; }

// dependancesInternes() — ce qui doit partir AVEC le fichier, LU dans ses imports plutôt que
// déclaré à la main. Un seul niveau : les imports directs. Aller plus loin donnerait la moitié du
// dépôt pour les outils centraux, ce qui n'est plus une liste d'emport mais un inventaire.
export const MOTIF_IMPORT_LOCAL = /from\s+["']\.\/([a-z0-9._/-]+)["']/gi;
export function dependancesInternes(source = "") {
  return [...new Set([...String(source).matchAll(MOTIF_IMPORT_LOCAL)].map((m) => `scripts/${m[1]}`))].sort();
}

// ══════════════════════════════════════════════════════════════════════════
// LES DOCUMENTS QUI NE PORTENT PAS LE NOM DE LEUR SCRIPT (2026-09-26)
// ══════════════════════════════════════════════════════════════════════════
//
// LE DÉFAUT QUE CETTE FONCTION CORRIGE, ET IL RÉCLAMAIT DU TRAVAIL DÉJÀ FAIT. La mesure dérivait
// le chemin des documents du NOM DU FICHIER (`scripts/x.mjs` → `docs/x-blueprint.md`). Or plusieurs
// outils de ce dépôt portent un nom d'usage différent de leur nom de fichier, pour des raisons
// toutes légitimes et toutes anciennes : `kpi-report.mjs` s'appelle « Tableau de bord »,
// `check-gemini-quota.mjs` s'appelle « Smart Breaker », `the-screener-capture.mjs` est le mécanisme
// de capture de THE-SCREENER. Leurs documents existent, complets, depuis des semaines.
//
// La mesure réclamait donc la création de trois blueprints et trois fiches qui EXISTENT DÉJÀ. C'est
// le pire genre de faux positif : il ne fait pas perdre une information, il fait produire un
// doublon — et un doublon de document divergera du premier au premier changement.
//
// POURQUOI ON LIT LA TABLE PLUTÔT QUE D'ÉCRIRE UNE LISTE D'ALIAS (Article 24). L'inventaire
// documentaire de CLAUDE.md porte déjà, colonne par colonne, le script et ses deux documents. Une
// liste d'alias recopiée ici dirait la même chose une seconde fois et se périmerait au premier
// renommage — exactement la dette que l'Article 24 interdit. On LIT la table ; elle est la
// déclaration, ce fichier n'en est que le lecteur.
//
// CE QU'ELLE NE FAIT PAS : elle n'invente aucun chemin. Un script absent de la table garde la
// dérivation par son nom, qui est le cas majoritaire et reste le comportement par défaut.
export const MOTIF_LIGNE_INVENTAIRE = /^\|(.+)\|\s*$/;
export function aliasDocumentaires({ root = ROOT, readFileImpl = lireFichierPartage, fichier = "CLAUDE.md" } = {}) {
  let texte = "";
  try { texte = readFileImpl(join(root, fichier), "utf8"); } catch { return null; }
  const carte = new Map();
  for (const ligne of String(texte).split("\n")) {
    if (!ligne.startsWith("| ") || !ligne.includes("`scripts/")) continue;
    const cellules = ligne.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cellules.length < 5) continue;
    const script = /`([^`]+)`/.exec(cellules[4]);
    if (!script) continue;
    const blueprint = /`([^`]+)`/.exec(cellules[2]);
    const fiche = /`([^`]+)`/.exec(cellules[3]);
    carte.set(script[1], { blueprint: blueprint?.[1] ?? null, fiche: fiche?.[1] ?? null });
  }
  // UNE TABLE VIDE N'EST JAMAIS UNE TABLE SANS ALIAS (leçons L5/L11) : si le parseur ne trouve plus
  // une seule ligne, c'est le format de la table qui a changé, pas les alias qui ont disparu. On
  // rend null, et l'appelant retombe sur la dérivation par le nom plutôt que sur un silence.
  return carte.size ? carte : null;
}

export function etatDuKit(ligne = {}, niveauVitalite, { root = ROOT, exists = existsSync, readFileImpl = lireFichierPartage, niveaux = NIVEAUX_DE_KIT, pieces = PIECES_DU_KIT, exemptes = EXEMPTES_DU_KIT, aliasImpl = undefined } = {}) {
  const kit = kitAttendu(niveauVitalite, { niveaux });
  if (!kit) return { mesurable: false, pourquoi: `aucun niveau de kit ne correspond à la vitalité « ${niveauVitalite} » — un niveau de vitalité sans kit rendrait l'outil invisible à l'export sans que personne ne le voie` };
  // L'EXEMPTION EST UN ÉTAT À PART, jamais un kit complet par défaut : un fichier dispensé et un
  // fichier en règle ne se comptent pas ensemble, sinon la dispense gonflerait le taux de
  // couverture et le rendrait flatteur au lieu d'être exact.
  const dispense = exemptionDuKit(ligne.chemin, { exemptes });
  if (dispense) return { mesurable: true, exempte: true, pourquoi: dispense.pourquoi, niveau: kit.cle, icone: kit.icone, vitalite: niveauVitalite, detail: [], manquantes: [], complet: true, taux: null };
  const bases = basesDuChemin(ligne.chemin);
  const alias = aliasImpl === undefined ? aliasDocumentaires({ root, readFileImpl }) : aliasImpl;
  let source = null;
  try { source = readFileImpl(join(root, ligne.chemin), "utf8"); } catch { /* voir ci-dessous */ }
  const detail = [];
  for (const cle of kit.pieces) {
    const p = pieces.find((x) => x.cle === cle);
    if (!p) continue;
    if (p.cle === "dependances") {
      // LA DÉPENDANCE NON MESURABLE N'EST JAMAIS UNE ABSENCE DE DÉPENDANCE (leçons L5/L11) : un
      // fichier illisible rendrait « zéro à emporter », qui est le pire résultat possible ici.
      if (source === null) { detail.push({ cle, quoi: p.quoi, present: null, pourquoi: "le fichier n'a pas pu être lu : ses dépendances n'ont PAS été mesurées, ce qui n'est jamais « aucune dépendance »" }); continue; }
      const deps = dependancesInternes(source);
      detail.push({ cle, quoi: p.quoi, present: true, liste: deps, combien: deps.length });
      continue;
    }
    // LE REGISTRE N'EST DÛ QU'À UN FICHIER QUI ÉCRIT. Une bibliothèque n'a rien à historiser, et
    // lui réclamer un index reviendrait à réclamer un document vide — donc à fabriquer du travail
    // qui n'apprend rien. « Sans objet » et « manquant » se ressemblent dans un compte et appellent
    // l'inverse l'un de l'autre : ils sont séparés ici, avec la raison.
    if (p.cle === "registre" && source !== null && !tientUneMemoire(source)) {
      detail.push({ cle, quoi: p.quoi, present: null, sansObjet: true, pourquoi: "ce fichier n'écrit rien : il n'a aucune mémoire à historiser, donc aucun registre à emporter" });
      continue;
    }
    // La pièce compte dès qu'UNE des orthographes existe ; le chemin rapporté est celui qui a
    // répondu, ou le premier essayé quand aucune n'existe — pour que « à créer » nomme une cible.
    // LE CHEMIN DÉCLARÉ PASSE EN PREMIER : un outil dont le document porte un autre nom que son
    // fichier (Tableau de bord, Smart Breaker, THE-SCREENER) se verrait sinon réclamer un doublon
    // de ce qu'il possède déjà. Il s'ajoute aux orthographes dérivées, il ne les remplace pas.
    const declare = alias?.get(ligne.chemin)?.[p.cle] ?? null;
    const essais = [...(declare ? [declare] : []), ...bases.map((b) => p.chemin(b, ligne))];
    const trouve = essais.find((c) => exists(join(root, c)));
    detail.push({ cle, quoi: p.quoi, chemin: trouve ?? essais[0], essais, present: Boolean(trouve) });
  }
  const exigees = detail.filter((d) => d.present !== null);
  const presentes = exigees.filter((d) => d.present);
  return {
    mesurable: true, niveau: kit.cle, icone: kit.icone, vitalite: niveauVitalite, pourquoi: kit.pourquoi,
    detail, manquantes: exigees.filter((d) => !d.present).map((d) => ({ cle: d.cle, chemin: d.chemin, quoi: d.quoi })),
    complet: presentes.length === exigees.length,
    taux: exigees.length ? Math.round((presentes.length / exigees.length) * 100) : null,
  };
}

export function mesurerLesKits({ vitalite = null, root = ROOT, exists = existsSync, readFileImpl = lireFichierPartage, niveaux = NIVEAUX_DE_KIT } = {}) {
  if (!vitalite?.mesurable) {
    return { mesurable: false, pourquoi: "la vitalité du parc n'a pas été fournie ou n'est pas mesurable : sans elle on ne peut pas savoir QUEL kit chaque fichier doit porter, et compter des pièces sans savoir lesquelles sont dues ne mesure rien" };
  }
  const parNiveau = {};
  const incomplets = [];
  for (const n of niveaux) {
    const fichiers = vitalite.parNiveau[n.vitalite] ?? [];
    const etats = fichiers.map((f) => ({ chemin: f.chemin, ...etatDuKit(f, n.vitalite, { root, exists, readFileImpl, niveaux }) }));
    const exemptes = etats.filter((e) => e.exempte);
    const dus = etats.filter((e) => !e.exempte);
    const complets = dus.filter((e) => e.complet);
    parNiveau[n.vitalite] = {
      kit: n.cle, icone: n.icone, pieces: n.pieces, pourquoi: n.pourquoi, rang: n.rang,
      // LE DÉNOMINATEUR EXCLUT LES DISPENSÉS : un taux calculé sur eux serait flatteur et faux.
      total: dus.length, exemptes: exemptes.length, complets: complets.length,
      couverture: dus.length ? Math.round((complets.length / dus.length) * 100) : null,
      // Le taux MOYEN de complétude dit autre chose que le nombre de kits complets : vingt kits à
      // 80 % et vingt kits à 0 % ne se réparent pas de la même façon, et « 0 complet » les confond.
      tauxMoyen: dus.length ? Math.round(dus.reduce((a, e) => a + (e.taux ?? 0), 0) / dus.length) : null,
      etats,
    };
    for (const e of dus) if (!e.complet) incomplets.push({ ...e, vitalite: n.vitalite, rang: n.rang });
  }
  // CE QUI BLOQUE UN EXPORT, revu le 2026-09-26 sur sa correction : TOUT kit incomplet bloque la
  // réinstallation de SON fichier, quel que soit son niveau. La vitalité ne dit plus qui est
  // dispensé — elle donne l'ORDRE dans lequel on répare. D'où un tri, et jamais un filtre : filtrer
  // ferait disparaître de la liste précisément les optionnels qu'il vient de nous faire remarquer.
  const bloquants = [...incomplets].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9) || (b.taux ?? 0) - (a.taux ?? 0));
  return {
    mesurable: true, parNiveau, incomplets, bloquants,
    total: Object.values(parNiveau).reduce((a, x) => a + x.total, 0),
    complets: Object.values(parNiveau).reduce((a, x) => a + x.complets, 0),
    exemptes: Object.values(parNiveau).reduce((a, x) => a + x.exemptes, 0),
    horsPortee: "un kit COMPLET n'est pas un kit SUFFISANT : cette mesure compte des pièces présentes, elle ne lit jamais leur contenu ni ne garantit que le portage réussira. Elle dit ce qui est PRÊT à partir, jamais que ça marchera ailleurs.",
  };
}

// ══════════════════════════════════════════════════════════════════════════
// UNE MESURE ÉCRITE PUIS RETIRÉE LE MÊME SOIR (2026-09-30, tâche #1311)
// ══════════════════════════════════════════════════════════════════════════
//
// LA RAISON RESTE ICI PLUTÔT QUE DE PARTIR AVEC LE CODE (Article 27) : sans elle, quelqu'un
// réécrira la même chose dans six mois, avec les mêmes trois défauts.
//
// CE QUE J'AVAIS ÉCRIT : `piecesInatteignables()`, qui vérifiait qu'une pièce de kit COMPTÉE
// PRÉSENTE est aussi NOMMÉE quelque part. Motivation réelle et bonne : deux blueprints venaient
// d'être trouvés sans une seule citation dans tout le dépôt, et leurs kits passaient au vert.
//
// POURQUOI ELLE A ÉTÉ RETIRÉE — trois défauts, et le troisième est le plus intéressant.
//
// ① ELLE DOUBLONNAIT UNE MESURE EXISTANTE. `findFichesOrphelines()` (ABRAHAM, tâche #629) répond
//    déjà à cette question. L'Article 31 dit d'ÉTENDRE plutôt que d'agir à côté ; j'ai agi à côté
//    sans avoir cherché, ce que l'Article 30 existe précisément pour empêcher.
//
// ② ELLE RE-DÉRIVAIT UN VERDICT DÉJÀ REJETÉ. La mesure existante porte une règle que la mienne
//    n'avait pas : une fiche atteignable par la CONVENTION DE NOMMAGE (`docs/referentiel/<slug>.md`
//    en face de `scripts/<slug>.mjs`) n'est PAS orpheline — on la trouve parce qu'on connaît la
//    règle, pas parce qu'un lien y mène. Son test le dit mot pour mot : « sans ce second critère,
//    le contrôle dénoncerait dix-huit fiches parfaitement atteignables ». La mienne en dénonçait
//    dix-sept. C'était la même population, et le projet avait tranché une semaine plus tôt.
//
// ③ ELLE CONTAMINAIT CE QU'ELLE MESURAIT, et ça n'a été visible que parce qu'un garde-fou
//    ANTÉRIEUR est tombé. Son rapport s'écrit dans `docs/safe-export/`, qui fait partie du corpus
//    balayé : en NOMMANT les dix-sept fiches qu'elle accusait, elle les rendait « citées ». Le
//    compte des fiches tenues par la seule convention est passé de 17 à 5 — non parce que le dépôt
//    s'était amélioré, mais parce que ma mesure avait parlé. **Un second passage se serait donc
//    félicité de son propre bruit.** C'est la forme la plus retorse d'un faux vert rencontrée ici :
//    l'outil ne se trompe pas de calcul, il déplace la réalité qu'il observe.
//
// CE QUI EST GARDÉ DE L'ÉPISODE : les deux blueprints réellement orphelins ont bien été réparés
// (leurs fiches les nomment désormais), et ils avaient été trouvés par `data-archangel orphelins`,
// qui pose une AUTRE question — tous les documents, pas les pièces de kit — et ne doublonne rien.

// ══════════════════════════════════════════════════════════════════════════
// LES SECRETS QUI TRAÎNENT (2026-09-30, tâche #1326)
// ══════════════════════════════════════════════════════════════════════════
//
// POURQUOI ICI : SAFE-EXPORT répond à « l'Agence peut-elle partir ailleurs ? ». Un secret qui
// dort dans un fichier est la réponse NON la plus nette qui soit — il part avec, et il part chez
// quelqu'un d'autre. C'est aussi le seul Gardien qui regarde déjà le dépôt entier plutôt qu'un
// dossier.
//
// CE QUI L'A FAIT NAÎTRE : le 2026-09-30, la protection de GitHub a refusé un envoi. Deux clés
// d'API dormaient depuis QUATORZE JOURS dans un fichier déposé par l'utilisateur que personne
// n'avait jamais ouvert. Elles étaient temporaires et périmées — **ce n'est donc pas la
// surveillance qui nous a protégés, c'est leur durée de vie**, et ça ne se reproduira pas
// forcément. La protection de GitHub, elle, ne joue qu'AU MOMENT DE L'ENVOI : elle ne dit rien
// des quatorze jours d'avant.
//
// TROIS RÈGLES DE CONSTRUCTION, ET LA PREMIÈRE EST NON NÉGOCIABLE.
//
// ① IL NE RECOPIE JAMAIS LA VALEUR TROUVÉE. Ni dans son rapport, ni dans sa sortie écran, ni
//    dans le suivi. Un scanner de secrets qui écrit les secrets qu'il trouve les DUPLIQUE — il
//    aggrave exactement ce qu'il surveille. On rend le fichier, la ligne, et le TYPE. Jamais plus.
//
// ② IL S'EXCLUT LUI-MÊME, ET IL EXCLUT SON PROPRE RAPPORT. Leçon payée deux heures plus tôt ce
//    soir : une mesure dont le rapport vit dans le corpus qu'elle lit fabrique ses propres
//    résultats. Ici le défaut serait pire qu'une statistique faussée — le rapport se signalerait
//    lui-même à chaque passage, et ce bruit permanent ferait cesser de le lire (leçon L4).
//
// ③ IL DÉCLARE CE QU'IL NE VOIT PAS. Il reconnaît des FORMES connues (préfixes d'éditeurs,
//    en-têtes de clés privées). Un secret sans forme reconnaissable — un mot de passe dans une
//    phrase, un jeton maison — lui est invisible. Un vert ne veut donc jamais dire « il n'y a
//    rien » : il veut dire « aucune des formes connues ».
export const FORMES_DE_SECRET = [
  { type: "clé OpenAI", motif: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { type: "clé Groq", motif: /\bgsk_[A-Za-z0-9]{20,}/ },
  { type: "clé Anthropic", motif: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { type: "clé Google/Gemini", motif: /\bAIza[A-Za-z0-9_-]{30,}/ },
  { type: "jeton GitHub", motif: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { type: "clé AWS", motif: /\bAKIA[0-9A-Z]{16}\b/ },
  { type: "jeton Slack", motif: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { type: "clé privée", motif: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
];

// Les fichiers qui ont le DROIT de contenir ces formes, chacun avec sa raison — sans quoi le
// scanner accuserait sa propre définition à chaque passage (leçon L4, le garde-fou qui accuse la
// conformité cesse d'être lu).
export const SANS_OBJET_SECRETS = [
  { motif: /^scripts\/safe-export\.mjs$/, pourquoi: "il PORTE les formes à reconnaître : les y trouver serait se citer soi-même" },
  { motif: /^docs\/safe-export\//, pourquoi: "son propre registre — une mesure qui lit son rapport fabrique ses résultats (leçon du 2026-09-30)" },
  { motif: /^docs\/suivi\//, pourquoi: "le suivi NOMME les incidents par type et par préfixe, jamais par valeur : c'est le compte rendu, pas la fuite" },
  { motif: /^docs\/fils\//, pourquoi: "même raison que le suivi : les fils parlent des incidents, ils ne portent pas de valeur" },
  { motif: /^node_modules\//, pourquoi: "code tiers, jamais le nôtre" },
];

export function chercherLesSecrets({ root = ROOT, readFileImpl = lireFichierPartage, listDirImpl = readdirSync, formes = FORMES_DE_SECRET, exemptes = SANS_OBJET_SECRETS, racines = ["docs", "scripts", "lib", "app", "components"] } = {}) {
  const trouves = [];
  let lus = 0, ignores = 0;
  const balayer = (dossier, profondeur = 0) => {
    let entrees = [];
    try { entrees = listDirImpl(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const rel = `${dossier}/${e.name}`;
      if (e.isDirectory()) { if (profondeur < 5) balayer(rel, profondeur + 1); continue; }
      if (!/\.(md|txt|mjs|js|ts|tsx|json|ya?ml|env|sh|csv)$/i.test(e.name)) continue;
      if (exemptes.some((x) => x.motif.test(rel))) { ignores += 1; continue; }
      let t = "";
      try { t = readFileImpl(join(root, rel), "utf8"); } catch { continue; }
      lus += 1;
      const lignes = t.split("\n");
      for (let i = 0; i < lignes.length; i += 1) {
        for (const f of formes) {
          // ON NE GARDE JAMAIS LA VALEUR — seulement où elle est et de quel type elle est.
          if (f.motif.test(lignes[i])) trouves.push({ fichier: rel, ligne: i + 1, type: f.type });
        }
      }
    }
  };
  for (const r of racines) balayer(r);
  if (!lus) return { mesurable: false, pourquoi: "aucun fichier lu : ce zéro dit qu'on n'a rien regardé, jamais qu'il n'y a pas de secret" };
  return { mesurable: true, lus, ignores, trouves,
    horsPortee: "il reconnaît des FORMES connues (préfixes d'éditeurs, en-têtes de clés privées). Un mot de passe dans une phrase ou un jeton maison lui est invisible : un vert veut dire « aucune forme connue », jamais « il n'y a rien »." };
}

export function formatSecretsLines(r) {
  const l = [];
  if (!r.mesurable) { l.push("=== SECRETS QUI TRAÎNENT — PAS MESURÉ ===", `  ${r.pourquoi}`); return l; }
  l.push(`=== SECRETS QUI TRAÎNENT — ${r.trouves.length} trouvé(s) sur ${r.lus} fichier(s) lus, ${r.ignores} exemptés avec leur raison ===`);
  l.push("");
  if (!r.trouves.length) {
    l.push("  ✅ aucune forme connue de secret dans les fichiers du dépôt.");
  } else {
    l.push("  🚨 LA VALEUR N'EST JAMAIS RECOPIÉE ICI — un scanner qui écrit ce qu'il trouve le duplique :");
    for (const t of r.trouves.slice(0, 20)) l.push(`     · ${t.fichier}:${t.ligne} — ${t.type}`);
    if (r.trouves.length > 20) l.push(`     … et ${r.trouves.length - 20} autre(s)`);
    l.push("", "  À FAIRE, DANS CET ORDRE : révoquer d'abord (une clé retirée d'un fichier reste valable), retirer ensuite.");
  }
  l.push("", `  HORS PORTÉE : ${r.horsPortee}`);
  l.push("  ET LA PROTECTION DE GITHUB NE REMPLACE PAS CECI : elle ne joue qu'AU MOMENT DE L'ENVOI. Les deux clés du 2026-09-30 ont dormi quatorze jours avant qu'elle ne les voie.");
  return l;
}

// ══════════════════════════════════════════════════════════════════════════
// L'INVENTAIRE NOMINATIF — « le livre des kits » (2026-09-26, sa question)
// ══════════════════════════════════════════════════════════════════════════
//
// SA QUESTION : « VÉRIFIER AUSSI QUE "LE LIVRE DES KITS D'EXPORT" RÉPERTORIE BIEN TOUS LES KITS, LE
// NIVEAU DE KIT (normalement un seul), QUI EST ÉQUIPÉ COMMENT ? »
//
// LA RÉPONSE MESURÉE ÉTAIT NON, et le défaut est de ceux qui s'aggravent en se réparant : le
// rapport ne nommait QUE les kits incomplets. Le matin, avec 49 trous, il ressemblait à un
// inventaire. Le soir, à 83/83, **un `grep` des chemins de fichiers dans le rapport rendait ZÉRO**
// — le livre censé dire qui est équipé comment ne nommait plus personne. Le succès l'avait vidé.
//
// C'est pour ça qu'un rapport d'ANOMALIES et un INVENTAIRE ne sont pas le même document, même
// quand ils sortent du même calcul : le premier est utile tant qu'il reste des anomalies, le second
// l'est surtout quand il n'y en a plus. Ils cohabitent ici, dans cet ordre — les trous d'abord,
// parce qu'on les répare ; l'inventaire ensuite, parce qu'on l'emporte.
export function inventaireDesKits(k, { niveaux = NIVEAUX_DE_KIT } = {}) {
  if (!k?.mesurable) return { mesurable: false, pourquoi: k?.pourquoi ?? "les kits n'ont pas été mesurés" };
  const lignes = [];
  for (const n of niveaux) {
    const bloc = k.parNiveau?.[n.vitalite];
    for (const e of bloc?.etats ?? []) {
      lignes.push({
        chemin: e.chemin, vitalite: n.vitalite, icone: n.icone,
        dispense: Boolean(e.exempte), complet: Boolean(e.complet), taux: e.taux,
        // CE QU'IL PORTE, pièce par pièce — c'est la réponse à « qui est équipé comment », et elle
        // n'existait nulle part : le taux seul ne dit pas LAQUELLE des cinq pièces manque.
        pieces: (e.detail ?? []).map((d) => ({ cle: d.cle, etat: d.sansObjet ? "sans-objet" : d.present === null ? "non-verifie" : d.present ? "tenue" : "manquante" })),
      });
    }
  }
  return { mesurable: true, lignes, combien: lignes.length, niveauDeKit: "complet", pieces: KIT_COMPLET };
}

export function formatInventaireLines(inv) {
  if (!inv?.mesurable) return [`=== INVENTAIRE DES KITS : PAS MESURÉ — ${inv.pourquoi} ===`];
  const l = [`=== L'INVENTAIRE NOMINATIF — ${inv.combien} fichier(s), un seul niveau de kit ===`, ""];
  l.push(`  NIVEAU DE KIT : « ${inv.niveauDeKit} » — et il n'y en a qu'un. Les mêmes ${inv.pieces.length} pièces sont dues à tous :`);
  l.push(`  ${inv.pieces.join(" · ")}. La vitalité donne l'ORDRE de réparation, jamais une exigence différente.`);
  l.push("");
  l.push("  fichier                                             vitalité     kit    pièces tenues");
  l.push("  --------------------------------------------------  -----------  -----  -------------");
  for (const x of inv.lignes) {
    const tenues = x.pieces.filter((p) => p.etat === "tenue").map((p) => p.cle);
    const manquantes = x.pieces.filter((p) => p.etat === "manquante").map((p) => p.cle);
    const sansObjet = x.pieces.filter((p) => p.etat === "sans-objet").map((p) => p.cle);
    const etat = x.dispense ? "dispensé" : x.complet ? "✔️ " : "🔴";
    const detail = x.dispense ? "aucune pièce due, par décision écrite"
      : [tenues.join("+"), manquantes.length ? `MANQUE ${manquantes.join("+")}` : "", sansObjet.length ? `(${sansObjet.join("+")} sans objet)` : ""].filter(Boolean).join("  ");
    l.push(`  ${x.chemin.padEnd(50).slice(0, 50)}  ${`${x.icone} ${x.vitalite}`.padEnd(11)}  ${etat.padEnd(5)}  ${detail}`);
  }
  return l;
}

export function formatKitsLines(k, { niveaux = NIVEAUX_DE_KIT, combien = 8, exemptes = EXEMPTES_DU_KIT } = {}) {
  if (!k?.mesurable) return [`KITS D'EXPORT : PAS MESURÉ — ${k?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== LES KITS D'EXPORT — ${k.complets}/${k.total} kit(s) complet(s), ${k.exemptes} dispensé(s) avec raison ===`, ""];
  l.push("  LA RÈGLE, depuis sa correction du 2026-09-26 : le KIT COMPLET est dû à TOUT fichier de l'Agence.");
  l.push("  Un optionnel exporté sans son plan est un optionnel irrécupérable — et il partira quand même,");
  l.push("  puisqu'il fait partie de l'Agence. La vitalité ne dispense plus personne : elle donne l'ORDRE");
  l.push("  dans lequel on répare.");
  l.push("");
  l.push("  ordre de réparation   à jour     dispensés   taux moyen");
  l.push("  --------------------  ---------  ----------  ----------");
  for (const n of niveaux) {
    const x = k.parNiveau[n.vitalite];
    if (!x) continue;
    l.push(`  ${n.icone} ${String(n.rang)}. ${n.vitalite.padEnd(16)} ${String(x.complets).padStart(3)}/${String(x.total).padEnd(3)} ${String(x.couverture ?? "—").padStart(4)} %   ${String(x.exemptes).padStart(6)}      ${String(x.tauxMoyen ?? "—").padStart(3)} %`);
  }
  l.push("");
  l.push(`  PIÈCES DUES, les mêmes pour tous : ${KIT_COMPLET.join(" + ")}`);
  l.push("  · le registre est SANS OBJET pour un fichier qui n'écrit rien — jamais « manquant » : lui");
  l.push("    réclamer un index reviendrait à réclamer un document vide.");
  l.push("");
  for (const n of niveaux) l.push(`  ${n.icone} ${n.vitalite} : ${n.pourquoi}`);
  if (exemptes.length) {
    l.push("");
    l.push(`  ⚪ ${exemptes.length} DISPENSE(S) ÉCRITE(S) — un fichier dispensé n'entre pas dans le taux, sinon la dispense le rendrait flatteur :`);
    for (const e of exemptes) l.push(`     ${String(e.motif)} — ${e.pourquoi}`);
  }
  if (k.bloquants.length) {
    l.push("");
    l.push(`  ⛔ ${k.bloquants.length} KIT(S) INCOMPLET(S), dans l'ordre de réparation — chacun bloque la réinstallation de SON fichier :`);
    for (const b of k.bloquants.slice(0, combien)) {
      l.push(`     [${b.vitalite}] ${b.chemin} (${b.taux} %) — manque : ${b.manquantes.map((m) => m.chemin ?? m.cle).join(", ")}`);
    }
    if (k.bloquants.length > combien) l.push(`     … et ${k.bloquants.length - combien} autre(s)`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${k.horsPortee}`);
  return l;
}


// ══════════════════════════════════════════════════════════════════════════
// LE KIT DE L'AGENCE ELLE-MÊME (2026-09-26) — sa question, et elle manquait
// ══════════════════════════════════════════════════════════════════════════
//
// SA QUESTION : « est-ce que l'agence en elle-même est couverte par ce principe de kit d'export ? »
// La réponse mesurée est NON, et c'est pire qu'un simple manque.
//
// CE QUE LE PREMIER CONTRÔLE AFFIRMAIT, ET POURQUOI C'ÉTAIT FAUX. `mesurerLExportabilite()`
// vérifiait l'existence de `docs/agence-exportable-conception.md` et concluait « le blueprint de
// l'Agence EXISTE ». Or ce fichier dit LUI-MÊME, dans ses dix premières lignes, qu'il n'est pas ça :
// « Il n'est pas un document de travail sur Maison IA vivante. Rien ici ne gouverne le code
// actuel. » C'est le carnet d'idées du projet SUIVANT. Le contrôle lisait la présence d'un fichier
// et en déduisait la présence d'un contenu — le faux vert le plus classique, et il portait sur la
// pièce la plus importante de tout l'export.
//
// POURQUOI LA QUESTION COMPTE AUTANT QU'ELLE EN A L'AIR : quatre-vingts kits d'outils complets ne
// font pas une Agence exportable. Le destinataire recevrait quatre-vingts plans de pièces détachées
// et aucun plan de la machine — il saurait ce que fait chaque outil et rien de la façon dont ils
// s'appellent, ni par où commencer, ni ce qu'il faut installer pour que le premier démarre.
export const PIECES_DU_KIT_AGENCE = [
  { cle: "plan", quoi: "le plan de l'Agence comme un TOUT", chemin: "docs/agence-blueprint.md",
    question: "comment les outils s'articulent-ils, et par où commence-t-on ?" },
  { cle: "installation", quoi: "la procédure de remise en route ailleurs", chemin: "docs/agence-installation.md",
    question: "que dois-je faire, dans l'ordre, pour qu'elle tourne chez moi ?" },
  { cle: "carte", quoi: "la carte des outils, générée", chemin: "docs/referentiel/classification-agence.md",
    question: "qui compose l'équipe, et que vaut chacun ?" },
  { cle: "organisation", quoi: "le référentiel d'organisation", chemin: "docs/referentiel/organisation-agence.md",
    question: "quels rangs, quelles familles, quels axes ?" },
  { cle: "standards", quoi: "les exigences que l'Agence s'impose", chemin: "docs/referentiel/standards.md",
    question: "à quoi reconnaît-on qu'un outil est à niveau ?" },
  { cle: "lecons", quoi: "ce que le projet a appris en se trompant", chemin: "docs/referentiel/lecons.md",
    question: "quelles erreurs n'ai-je pas besoin de refaire ?" },
  // LA SEPTIÈME PIÈCE (2026-10-01, tâche #1342), et sa raison est une distinction que les six
  // premières ne faisaient pas. Sa demande : « je voudrais que tu stockes tes solutions […] la
  // future IA cliente profitera à la fois des outils présents mais aussi de notre expérience
  // consignée et qui part avec l'agence ».
  //
  // POURQUOI `lecons.md` NE SUFFISAIT PAS, alors qu'il était déjà dans le kit : une leçon est un
  // PRINCIPE — « ne fais pas X parce que Y ». Elle dit quoi éviter, jamais comment s'en sortir.
  // Le destinataire qui rencontre le problème pour de vrai a besoin de l'autre moitié : voici le
  // problème concret, voici ce qu'on a essayé qui n'a pas marché, voici ce qui a marché.
  //
  // ET C'EST LA MOITIÉ LA PLUS CHÈRE À REFAIRE : un principe se redécouvre en lisant ; une
  // solution se redécouvre en se trompant.
  { cle: "solutions", quoi: "comment on a résolu, pas seulement ce qu'il ne faut pas faire", chemin: "docs/referentiel/solutions.md",
    question: "j'ai CE problème précis — qu'est-ce qui a déjà marché ?" },
];

// findSolutionsNonConsignees() (2026-10-01, tâche #1342) — LA PROTECTION DU REGISTRE DES SOLUTIONS,
// et elle est faible par construction : je l'écris en le disant plutôt qu'en le taisant.
//
// LE PROBLÈME QU'ELLE ADRESSE : `docs/referentiel/solutions.md` s'écrit à la MAIN. Une entrée y
// naît quand quelqu'un se dit « tiens, ça resservira » — c'est-à-dire pas toujours. Pendant ce
// temps, le registre des tâches accumule des dizaines de solutions concrètes rédigées en prose,
// qui ne remontent jamais. Un registre qui dépend d'un réflexe cesse de grossir en silence.
//
// CE QU'ELLE FAIT, ET SURTOUT CE QU'ELLE NE FAIT PAS. Elle PROPOSE des clôtures qui ressemblent à
// une solution concrète et dont le vocabulaire ne se retrouve pas dans le registre. **Elle n'écrit
// jamais d'entrée** : généraliser un cas particulier est un JUGEMENT, et une entrée produite par
// une machine serait un cas particulier déguisé en principe — exactement ce que le registre existe
// pour éviter. Même partage que check-tasks-details / god-of-all-process sur l'Article 28 : l'un
// propose une forme, l'autre constate un manque, et les fusionner donnerait un outil qui se
// satisfait tout seul.
//
// SA LIMITE, DÉCLARÉE : « ressembler à une solution » se lit sur des MARQUEURS DE TEXTE. Une
// solution rédigée autrement lui échappe, et une ligne qui emploie ces mots sans rien résoudre
// sortira à tort. Elle sous-déclare volontairement — un détecteur qui accuse à tort cesse d'être
// lu (leçon L4) — et elle rend des QUESTIONS, jamais un verdict.
export const MARQUEURS_DE_SOLUTION = Object.freeze([
  /\bCORRIGÉ (?:EN|PAR|LE)\b/i, /\bLA CAUSE\b/i, /\bCAUSE RACINE\b/i,
  /\bCE QUI A ÉTÉ CONSTRUIT\b/i, /\bCE QUI MARCHE\b/i, /\bCE QUI NE MARCHE PAS\b/i,
  /\bLA SOLUTION\b/i, /\bRÉPARÉ\b/i,
]);

// Un extrait trop court ne porte aucune solution ; un extrait énorme est un récit de chantier.
export const TAILLE_MINIMALE_SOLUTION = 400;

// DEUX MARQUEURS, JAMAIS UN — et le chiffre est MESURÉ, pas choisi. À un seul marqueur la sonde
// rend 219 candidats et sa tête de liste est un journal de Ronde qui ne résout rien ; à deux elle
// en rend 31 et sa tête de liste est « le détecteur de documents jumeaux accusait 25 paires »,
// c'est-à-dire exactement une solution à généraliser ; à trois elle n'en rend plus qu'UN et cesse
// de servir. Deux, parce qu'un vrai récit de solution porte presque toujours la CAUSE et le
// REMÈDE, là qu'une ligne qui emploie un seul de ces mots parle le plus souvent d'autre chose.
// Un détecteur dont la tête de liste est un faux positif cesse d'être lu (leçon L4).
export const MARQUEURS_MINIMUM_SOLUTION = 2;

export function findSolutionsNonConsignees({ lignesSuivi = null, registre = null, root = ROOT, readFileImpl = lireFichierPartage, maximum = 8 } = {}) {
  let texteRegistre = registre;
  if (texteRegistre == null) {
    try { texteRegistre = readFileImpl(join(root, "docs/referentiel/solutions.md"), "utf8"); }
    catch { return { mesurable: false, pourquoi: "le registre des solutions est introuvable : sans lui on ne peut pas dire ce qui y manque, et proposer des candidats sur un registre absent reviendrait à proposer TOUT le suivi" }; }
  }
  if (!lignesSuivi) return { mesurable: false, pourquoi: "les lignes de suivi n'ont pas été fournies : l'appelant les lit chez check-tasks-details, jamais ce fichier (anti-doublon §7ter)" };
  if (!lignesSuivi.length) return { mesurable: false, pourquoi: "aucune ligne de suivi lue — « rien à consigner » et « rien à lire » s'écriraient tous les deux zéro (L5)" };

  // Les mots déjà couverts par le registre, pour ne pas reproposer ce qui y est.
  const motsDuRegistre = new Set(String(texteRegistre).toLowerCase().match(/[a-zà-ÿ]{6,}/g) ?? []);
  const candidats = [];
  for (const l of lignesSuivi) {
    const detail = String(l.detail ?? l.description ?? "");
    // Un candidat qu'on ne peut pas retrouver ne sert à rien : une ligne sans numéro lisible sort.
    if (!Number.isFinite(Number(l.numero))) continue;
    if (detail.length < TAILLE_MINIMALE_SOLUTION) continue;
    if (MARQUEURS_DE_SOLUTION.filter((m) => m.test(detail)).length < MARQUEURS_MINIMUM_SOLUTION) continue;
    const mots = new Set(detail.toLowerCase().match(/[a-zà-ÿ]{6,}/g) ?? []);
    if (!mots.size) continue;
    let communs = 0;
    for (const m of mots) if (motsDuRegistre.has(m)) communs += 1;
    const recouvrement = communs / mots.size;
    // Un recouvrement élevé veut dire « le registre parle déjà de ça » — borne HAUTE, jamais une
    // preuve que la solution y figure : deux textes du même projet partagent du vocabulaire.
    if (recouvrement >= 0.6) continue;
    candidats.push({ numero: l.numero, sujet: String(l.sujet ?? "").slice(0, 80), recouvrement: Math.round(recouvrement * 100) });
  }
  candidats.sort((a, b) => a.recouvrement - b.recouvrement);
  return {
    mesurable: true, lues: lignesSuivi.length, candidats: candidats.slice(0, maximum), total: candidats.length,
    horsPortee: "« ressembler à une solution » se lit sur des marqueurs de TEXTE : une solution rédigée autrement échappe, et une ligne qui emploie ces mots sans rien résoudre sort à tort. Ce sont des QUESTIONS, jamais un verdict — et personne d'autre que l'agent ne peut généraliser un cas particulier.",
  };
}

// LA PIÈCE LA PLUS FACILE À FALSIFIER, et donc celle qu'on vérifie autrement : un fichier PRÉSENT
// n'est pas un fichier qui PARLE DU BON SUJET. Le plan de l'Agence a été « présent » pendant des
// jours sous la forme d'un carnet d'idées sur un autre projet. On exige donc, pour cette pièce
// seule, qu'elle se DÉCLARE : une ligne qui dit ce qu'elle est. C'est peu, et c'est déjà beaucoup
// plus qu'un test d'existence.
export const MARQUEUR_PLAN_AGENCE = /plan de l'Agence|blueprint de l'Agence|l'Agence comme un tout/i;

export function mesurerLeKitDeLAgence({ root = ROOT, exists = existsSync, readFileImpl = lireFichierPartage, pieces = PIECES_DU_KIT_AGENCE } = {}) {
  const detail = pieces.map((p) => {
    const present = exists(join(root, p.chemin));
    if (!present) return { ...p, present: false, pourquoi: "le fichier n'existe pas" };
    if (p.cle !== "plan") return { ...p, present: true };
    let texte = "";
    try { texte = readFileImpl(join(root, p.chemin), "utf8"); } catch { return { ...p, present: null, pourquoi: "le fichier existe mais n'a pas pu être lu : sa nature n'a PAS été vérifiée, ce qui n'est jamais « il convient »" }; }
    const parle = MARQUEUR_PLAN_AGENCE.test(texte);
    return { ...p, present: parle, pourquoi: parle ? null : "le fichier existe mais ne se déclare nulle part comme le plan de l'Agence — un fichier présent n'est pas un fichier qui parle du bon sujet" };
  });
  const dues = detail.filter((d) => d.present !== null);
  const tenues = dues.filter((d) => d.present);
  return {
    mesurable: true, detail,
    manquantes: dues.filter((d) => !d.present),
    nonVerifiees: detail.filter((d) => d.present === null),
    complet: tenues.length === dues.length,
    taux: dues.length ? Math.round((tenues.length / dues.length) * 100) : null,
    horsPortee: "cette mesure vérifie qu'une pièce EXISTE, et pour le plan seulement qu'il se déclare comme tel. Elle ne lit pas son contenu et ne garantit pas qu'il suffise à remonter l'Agence ailleurs.",
  };
}

export function formatKitAgenceLines(a) {
  if (!a?.mesurable) return [`KIT DE L'AGENCE : PAS MESURÉ — ${a?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== LE KIT DE L'AGENCE ELLE-MÊME — ${a.taux} % (${a.detail.length - a.manquantes.length - a.nonVerifiees.length}/${a.detail.length - a.nonVerifiees.length}) ===`, ""];
  l.push("  Quatre-vingts kits d'outils complets ne font pas une Agence exportable : le destinataire");
  l.push("  recevrait autant de plans de pièces détachées, et aucun plan de la machine.");
  l.push("");
  for (const d of a.detail) {
    const etat = d.present === null ? "❓ NON VÉRIFIÉ" : d.present ? "✔️  présente   " : "🔴 MANQUANTE  ";
    l.push(`  ${etat} ${d.quoi}`);
    l.push(`      ${d.chemin} — ${d.question}`);
    if (d.pourquoi) l.push(`      ⚠️  ${d.pourquoi}`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${a.horsPortee}`);
  return l;
}

export function formatSolutionsNonConsigneesLines(r) {
  if (!r?.mesurable) return ["=== SOLUTIONS NON CONSIGNÉES : PAS MESURÉ ===", `  ${r?.pourquoi}`];
  if (!r.total) return [`=== LES SOLUTIONS À CONSIGNER — aucune sur ${r.lues} clôture(s) lue(s) ===`, "",
    "  Rien ne ressemble à une solution concrète absente du registre. C'est une QUESTION sans candidat,",
    "  jamais la preuve que le registre est complet : la sonde ne reconnaît que des marqueurs de texte."];
  const l = [`=== LES SOLUTIONS À CONSIGNER — ${r.total} candidat(s) sur ${r.lues} clôture(s) lue(s) ===`, "",
    "  Des clôtures qui racontent une CAUSE et un REMÈDE, et dont le vocabulaire ne se retrouve pas",
    "  dans docs/referentiel/solutions.md. Ce sont des PROPOSITIONS : généraliser un cas particulier",
    "  est un jugement, et une entrée écrite par une machine serait un cas particulier déguisé en",
    "  principe — exactement ce que ce registre existe pour éviter.", ""];
  for (const c of r.candidats) l.push(`  · #${c.numero} — ${c.sujet} (${c.recouvrement} % de vocabulaire déjà couvert)`);
  if (r.total > r.candidats.length) l.push(`  … et ${r.total - r.candidats.length} autre(s), les moins « neuves » d'abord écartées de l'affichage`);
  l.push("");
  l.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

// ══════════════════════════════════════════════════════════════════════════
// L'ALERTE D'EXPORTABILITÉ (2026-09-26) — ce que la Ronde doit VOIR, pas lire
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE : « je veux que ce scan soit fait par un outil à chaque ronde circle avec rapport et
// alerte ». Le rapport existait ; l'ALERTE manquait, et la différence est tout : un rapport de
// quatre-vingts lignes se survole, une alerte de trois lignes se lit.
//
// CE QU'ELLE DIT, ET DANS QUEL ORDRE — du plus grave au moins grave, parce qu'un export bloqué par
// l'absence du plan de la machine ne se rattrape pas en complétant des kits d'outils :
//   1. le KIT DE L'AGENCE incomplet — on exporterait des pièces sans le plan ;
//   2. les kits d'outils VITAUX incomplets — ce sans quoi l'Agence ne tourne pas, irrécupérable ;
//   3. le reste, chiffré, sans le détailler.
//
// ELLE SE TAIT QUAND TOUT EST COMPLET. Une alerte qui parle toujours cesse d'être une alerte
// (leçon L6) — et ce silence-là est mérité, contrairement au silence d'un contrôle qui n'a rien
// regardé : la ligne de verdict reste imprimée dans tous les cas.
// LES QUATRE PALIERS, DÉCLARÉS UNE FOIS. Ils vivaient en clair dans une chaîne de ternaires, donc
// nulle part : impossible de les lire sans lire le code, impossible de les citer dans un document
// sans les recopier. Un registre se LIT (Article 24).
export const NIVEAUX_DE_BADGE = [
  { cle: "bloque", icone: "🔴", rang: 1, libelle: "EXPORT BLOQUÉ",
    quand: "il manque une pièce au kit de l'Agence elle-même — on exporterait des pièces détachées sans le plan de la machine" },
  { cle: "degrade", icone: "🟠", rang: 2, libelle: "EXPORT DÉGRADÉ",
    quand: "au moins un fichier VITAL ou ESSENTIEL porte un kit incomplet" },
  { cle: "possible", icone: "🟡", rang: 3, libelle: "EXPORT POSSIBLE",
    quand: "il ne reste que des fichiers utiles ou optionnels incomplets — mais il en reste" },
  { cle: "pret", icone: "✅", rang: 4, libelle: "EXPORT PRÊT",
    quand: "tout ce qui est dû est tenu, et l'Agence porte son propre kit" },
];

// ══════════════════════════════════════════════════════════════════════════
// LE BADGE DE L'AGENCE — « le pire des deux » (2026-09-26, sa décision)
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE, dans ses mots : « dès qu'un élément de l'Agence, quel que soit son niveau de vitalité,
// n'a pas son badge ✅ PRÊT, je voudrais que l'Agence perde tout de suite son badge ✅ PRÊT aussi en
// conséquence ». Calibrage tranché en fenêtre dédiée le même jour : **le pire des deux**, jamais un
// 🟡 uniforme — un vital cassé et un optionnel cassé n'appellent pas la même urgence, et les
// confondre ferait perdre au badge ce qu'il apporte.
//
// LE TROU RÉEL QU'IL FERME, et ce n'était pas celui qu'on croyait. L'alerte globale appliquait DÉJÀ
// sa règle : un seul kit incomplet, même optionnel, empêchait le ✅. Mais le bloc « KIT DE L'AGENCE
// — 100 % » s'imprimait TOUT SEUL, et pouvait dire 100 % pendant que trente membres étaient cassés.
// Lu isolément — et un bloc titré se lit isolément — c'était une fausse bonne nouvelle sur la
// question la plus importante du dispositif.
//
// LA RÉSERVE, ÉCRITE PLUTÔT QUE TUE : un badge qui tombe au moindre trou sur 82 fichiers sera orange
// presque tout le temps, et un voyant toujours orange cesse d'être lu (leçon L6). Ce qui rend la
// règle jouable est une circonstance, pas un principe : au jour de son adoption le parc est à 82/82.
// On installe un indicateur strict pendant qu'il est vert, donc toute régression saute aux yeux. À
// 60/82 la même règle aurait produit du bruit permanent, et il faudrait la recalibrer.
export function badgeDeLAgence(kits, agence, { niveaux = NIVEAUX_DE_BADGE } = {}) {
  const palier = (cle) => niveaux.find((n) => n.cle === cle);
  if (!kits?.mesurable) {
    return { mesurable: false, pourquoi: `les kits des membres n'ont pas été mesurés — ${kits?.pourquoi ?? "raison non fournie"}. Ce n'est PAS « aucun problème » : c'est un badge qu'on ne peut pas décerner.` };
  }
  const bloquants = kits.bloquants ?? [];
  const vitaux = bloquants.filter((b) => b.vitalite === "vital" || b.vitalite === "essentiel");
  const reste = bloquants.length - vitaux.length;
  // L'AGENCE NON MESURÉE NE VAUT PAS UNE AGENCE COMPLÈTE : sans sa mesure on ignore si le plan de la
  // machine est là, et l'ignorer ne peut jamais valoir un ✅ (leçons L5/L11).
  const agenceMesuree = Boolean(agence?.mesurable);
  const agenceManquantes = agenceMesuree ? (agence.manquantes ?? []) : null;
  const candidats = [];
  if (!agenceMesuree || agenceManquantes.length) candidats.push(palier("bloque"));
  if (vitaux.length) candidats.push(palier("degrade"));
  if (reste) candidats.push(palier("possible"));
  // LE PIRE DES DEUX, littéralement : le rang le plus BAS gagne. Un tri plutôt qu'une cascade de
  // `if`, pour qu'un cinquième palier n'oblige jamais à relire l'ordre des conditions.
  const pire = candidats.sort((a, b) => a.rang - b.rang)[0] ?? palier("pret");
  return {
    mesurable: true, niveau: pire.cle, icone: pire.icone, rang: pire.rang,
    verdict: `${pire.icone} ${pire.libelle}`,
    pourquoi: pire.cle === "pret" ? pire.quand : pire.quand,
    agenceManquantes, vitaux, reste,
    // CE QUE LE BADGE NE DIT PAS, imprimé avec lui : il compte des pièces présentes. Leur QUALITÉ
    // est le domaine de X-Port BLINDTEST, et son verdict à lui ne touche jamais ce badge-ci.
    horsPortee: "ce badge dit que les pièces sont là, jamais ce qu'elles valent — la fidélité d'un kit à son code se mesure séparément (X-Port BLINDTEST) et n'entre jamais dans ce calcul.",
  };
}

export function alerteExport(kits, agence) {
  const badge = badgeDeLAgence(kits, agence);
  if (!badge.mesurable) return { mesurable: false, pourquoi: badge.pourquoi };
  return {
    mesurable: true,
    agenceIncomplete: badge.agenceManquantes, vitaux: badge.vitaux, reste: badge.reste,
    niveau: badge.niveau, icone: badge.icone,
    alerte: badge.rang <= 2,
    // UN SEUL CALCUL DU PALIER, jamais deux : le verdict vient de badgeDeLAgence() et de nulle part
    // ailleurs (Article 3 — deux mesures de la même chose divergent, leçon L29).
    verdict: `${badge.verdict} — ${badge.pourquoi}`,
  };
}

export function alerteExportLines(kits, agence) {
  const a = alerteExport(kits, agence);
  if (!a.mesurable) return [`⚠️  ALERTE D'EXPORTABILITÉ : PAS MESURÉE — ${a.pourquoi}. Ce n'est PAS « aucune alerte ».`];
  const l = [`=== ALERTE D'EXPORTABILITÉ — ${a.verdict} ===`];
  if (a.agenceIncomplete?.length) {
    l.push(`  🔴 Le KIT DE L'AGENCE est incomplet : ${a.agenceIncomplete.map((m) => m.chemin).join(", ")}`);
    l.push("     Quatre-vingts kits d'outils complets ne font pas une Agence exportable.");
  }
  if (a.vitaux.length) l.push(`  🟠 ${a.vitaux.length} kit(s) incomplet(s) sur des fichiers VITAUX ou ESSENTIELS — à réparer en premier.`);
  if (a.reste) l.push(`  🟡 ${a.reste} autre(s) kit(s) incomplet(s), sur des fichiers utiles ou optionnels.`);
  if (!a.alerte && !a.reste) l.push("  Rien à signaler : chaque fichier dû porte son kit complet, et l'Agence porte le sien.");
  return l;
}


// =============================================================================================
// LA PORTABILITÉ — la seconde moitié de l'export, et personne ne la mesurait
// =============================================================================================
// TROUVAILLE DU 2026-09-27, née d'une question de l'utilisateur sur l'exportabilité des documents
// de référence. Elle tient en une phrase : **« l'outil part » ne veut pas dire « l'outil marche
// ailleurs »**, et jusqu'ici seule la première moitié était vérifiée.
//
// LA PREUVE EST DANS CE DÉPÔT, et elle est gênante : EZECHIEL-LES-TESTS a été déclaré exportable le
// jour de sa création — blueprint, fiche, registre, kit complet — et le chemin du filet qu'il
// enquête est écrit EN DUR dans son code. Sur un autre dépôt il cherche un fichier qui n'existe
// pas. Le kit était complet ; l'outil était inutilisable.
//
// POURQUOI LES DEUX CHIFFRES NE DOIVENT JAMAIS FUSIONNER : un taux unique « d'exportabilité » à
// 95 % se lit comme une garantie que 95 % de l'Agence fonctionnera ailleurs. C'est faux, et c'est
// le patron exact des leçons L5/L11 — deux questions différentes, deux mesures, jamais une moyenne.
//
//   EXPORTABLE = l'outil a ses PIÈCES pour partir (blueprint, fiche, registre) — déjà mesuré.
//   PORTABLE   = l'outil FONCTIONNE une fois arrivé, sans qu'on touche à son code — mesuré ici.

// CE QUI TRAHIT UNE DÉPENDANCE À CE DÉPÔT-CI. Vocabulaire fermé et assumé : ce sont les noms de CE
// projet, donc la liste ne peut pas « se périmer » au sens de l'Article 24 — elle décrit un état de
// fait, elle ne reflète aucun autre système. Chaque entrée dit ce qu'elle coûte une fois ailleurs.
export const MARQUEURS_DE_NON_PORTABILITE = [
  { cle: "filet", motif: /["'`][^"'`]*check-house\.mjs["'`]/, quoi: "le chemin du filet de sécurité de CE projet", coute: "l'outil cherche un fichier qui n'existe pas sur l'autre dépôt" },
  { cle: "charte", motif: /["'`][^"'`]*CLAUDE\.md["'`]/, quoi: "le nom du fichier de charte de CE projet", coute: "un autre projet nomme sa charte autrement, ou n'en a pas" },
  { cle: "moteur-du-jeu", motif: /["'`][^"'`]*lib\/(lia|life|simulation|perception|dialogue|story|playback)\.ts["'`]/, quoi: "un fichier du moteur du produit", coute: "rien de tout ça n'existe ailleurs : l'outil est lié au produit, pas à l'outillage" },
  { cle: "dossier-referentiel", motif: /["'`]docs\/referentiel\//, quoi: "l'arborescence documentaire de CE projet", coute: "un autre projet range ses documents autrement" },
  { cle: "dossier-suivi", motif: /["'`]docs\/suivi\//, quoi: "l'emplacement du suivi de CE projet", coute: "idem : l'outil lit un dossier absent et rend zéro, ce qui se lit comme « rien à signaler »" },
  { cle: "personnages", motif: /["'`][^"'`]*\b(Lia|Noé|Noe)\b[^"'`]*["'`]/, quoi: "un nom propre du produit", coute: "l'outil parle d'un personnage qui n'existe pas dans le projet d'accueil" },
];

// UN CHEMIN CITÉ POUR EXPLIQUER N'EST PAS UN CHEMIN EXÉCUTÉ — leçon L38, payée trois fois le même
// jour sur un autre outil. On retire les commentaires AVANT de chercher, jamais après.
export function codeSansCommentaires(src = "") {
  return String(src).replace(/^\s*\/\/[^\n]*$/gm, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

// =============================================================================================
// LE BANC D'ESSAI DU TÉMOIN — la portabilité MESURÉE au lieu d'être lue
// =============================================================================================
// SON ARBITRAGE, MOT POUR MOT (2026-09-27) : « construire le projet témoin d'abord est plus sûr —
// la classification viendrait de la mesure au lieu de la lecture — OK on fait ça ». `mesurerLaPortabilite()`
// juste en dessous LIT le code et compte les chemins de ce dépôt ; ici, on LANCE les outils dans un
// dépôt étranger et on regarde ce qui se passe vraiment. Les deux ne disent pas la même chose, et
// c'est exactement pour ça qu'ils coexistent : un chemin cité n'est pas forcément un défaut, et un
// outil sans aucun chemin suspect peut quand même mourir sur une hypothèse invisible.
//
// TROIS VERDICTS, JAMAIS DEUX, et c'est tout le dispositif : le premier essai a montré qu'Ezechiel
// rendait sept fois « pas mesuré » et rendait la main proprement. Compter ces sept-là comme des
// échecs pousserait les outils à FABRIQUER des réponses là où il n'y a pas de données — l'exact
// contraire de la discipline de ce projet. « Pas mesuré » est un SUCCÈS d'export.
//
// CE N'EST PAS UN OUTIL DE PLUS (Article 31) : c'est le même sujet que la portabilité lue, dans le
// même fichier, et deux rapports séparés sur le même sujet finiraient par se contredire.
export const VERDICTS_DU_TEMOIN = [
  { cle: "portable", icone: "✅", quoi: "il tourne et rend un résultat" },
  { cle: "honnete", icone: "⚪", quoi: "il tourne et DÉCLARE ce qu'il ne peut pas mesurer — un succès d'export, jamais un échec" },
  { cle: "attend-un-argument", icone: "🔤", quoi: "il réclame un argument et refuse correctement — le banc l'a lancé à vide, ce n'est pas un défaut de portabilité" },
  { cle: "attend-une-configuration", icone: "🔑", quoi: "il refuse PROPREMENT faute d'une configuration locale absente (une clé, un fichier de secrets) — un refus n'est pas un plantage" },
  { cle: "dependance-non-installee", icone: "📦", quoi: "il manque un paquet npm que le banc n'a pas installé — une limite du BANC, jamais un défaut de l'outil" },
  { cle: "non-portable", icone: "💥", quoi: "il s'arrête sur une hypothèse qui n'est vraie que chez nous" },
];

export const MOTIFS_D_HONNETETE = /PAS MESUR[ÉE]|pas mesur[ée]|NON MESUR[ÉE]|introuvable ici|aucune donnée/;

// LE QUATRIÈME VERDICT EST NÉ D'UN FAUX POSITIF DE CE BANC (2026-09-27, premier passage complet) :
// il lance chaque outil SANS ARGUMENT, et quatre d'entre eux — check-level-target, tool-usage,
// rapport-gros-prompt, smart-conso-api — sortent en erreur pour la meilleure des raisons : ils
// réclament un argument et refusent proprement. Les compter comme non portables était une erreur du
// MESUREUR, pas un défaut du mesuré, et un garde-fou qui accuse à tort cesse d'être lu (leçon L4).
// LE CINQUIÈME VERDICT, ET IL NAÎT DU MÊME FAUX POSITIF QUE LE QUATRIÈME (2026-09-28, tâche #902).
// `check-gemini-quota` arrivait sur le dépôt témoin, ne trouvait pas `.dev.vars` — un fichier de
// SECRETS LOCAUX, absent de tout dépôt fraîchement cloné, y compris celui-ci chez quelqu'un
// d'autre — et disait proprement « GEMINI_API_KEY introuvable » avant de sortir en 1. Le banc
// comptait ça comme un plantage. C'est un REFUS, et un refus propre est le comportement voulu : un
// outil qui inventerait un résultat sans sa clé serait bien pire.
//
// LE CRITÈRE EST UN FAIT SUR LA SORTIE, JAMAIS UNE LISTE DE MOTS (corollaire de l'Article 17) : un
// outil qui MEURT laisse une trace de pile de Node ; un outil qui refuse imprime une phrase et
// s'arrête. Aucune liste de vocabulaire n'aurait couvert le prochain cas ; cette distinction-là,
// si. Le refus doit AUSSI nommer ce qui manque, sans quoi on absoudrait n'importe quelle sortie
// en erreur sans trace.
// LE SIXIÈME VERDICT, ET C'EST UNE LIMITE DU BANC QU'IL FAUT NOMMER PLUTÔT QUE FACTURER À L'OUTIL
// (2026-09-28, tâche #902). Le banc copie `scripts/` et RIEN D'AUTRE — c'est délibéré, c'est
// exactement ce que l'Agence prétend pouvoir emporter. Mais trois outils importent un paquet npm
// (`typescript`, `playwright`) que le dépôt témoin n'a jamais installé, et Node meurt sur
// ERR_MODULE_NOT_FOUND avant la première ligne de leur code.
//
// LES COMPTER COMME NON PORTABLES SERAIT FAUX, et dans le sens le plus coûteux : l'Agence DÉCLARE
// ses dépendances — c'est l'une des cinq pièces du kit d'export, mesurée à 100 % par ailleurs. Un
// outil qui réclame un paquet qu'on ne lui a pas installé se comporte exactement comme prévu. Ce
// que ce verdict mesure vraiment, c'est que LE BANC ne fait pas `npm install` — et le dire coûte
// une ligne, l'ignorer coûterait un chiffre faux.
//
// CE QU'IL FAUDRAIT POUR MESURER VRAIMENT, écrit ici pour que personne n'ait à le redécouvrir :
// installer les dépendances déclarées dans le dépôt témoin avant de lancer. Ce n'est pas fait,
// parce que ça change le témoin — or son intérêt est justement d'être PAUVRE EN OUTILLAGE.
export const MOTIF_PAQUET_MANQUANT = /ERR_MODULE_NOT_FOUND|Cannot find package/;

export const MOTIF_TRACE_DE_PILE = /\n\s+at\s+\S+/;
export const MOTIF_CONFIGURATION_ABSENTE = /introuvable|manquante?|absente?|non configurée?|not (found|configured)/i;

export const MOTIFS_D_ARGUMENT_MANQUANT = /^\s*(Usage|usage|Utilisation)\s*:|^usage :/m;

// Le verdict se lit sur DEUX choses, jamais une : le code de sortie ET ce qui a été dit. Un outil
// qui sort en 0 sans rien dire n'est pas la même chose qu'un outil qui sort en 0 en déclarant son
// impuissance — et c'est la seconde catégorie qu'il ne faut pas compter comme un échec.
export function verdictDuTemoin({ code, sortie = "" } = {}) {
  if (code !== 0 && MOTIFS_D_ARGUMENT_MANQUANT.test(String(sortie))) return { cle: "attend-un-argument", pourquoi: "il imprime son mode d'emploi et refuse de tourner à vide — le banc l'a lancé sans argument, la faute est au banc" };
  if (code !== 0 && MOTIF_PAQUET_MANQUANT.test(String(sortie))) {
    return { cle: "dependance-non-installee", pourquoi: `il réclame un paquet npm que le banc n'a pas installé : ${(String(sortie).match(/Cannot find package '[^']+'/) ?? ["paquet non nommé dans sa sortie"])[0]} — le banc copie scripts/ et rien d'autre, donc la faute est au banc` };
  }
  if (code !== 0 && !MOTIF_TRACE_DE_PILE.test(String(sortie)) && MOTIF_CONFIGURATION_ABSENTE.test(String(sortie))) {
    return { cle: "attend-une-configuration", pourquoi: `il refuse proprement (code ${code}, aucune trace de pile) en nommant ce qui manque : ${(String(sortie).match(/[^\n]*(?:introuvable|manquante?|absente?|non configurée?)[^\n]*/i) ?? ["une configuration locale"])[0].trim().slice(0, 90)}` };
  }
  if (code !== 0) return { cle: "non-portable", pourquoi: `il s'arrête (code ${code}) : ${(String(sortie).match(/Error: [^\n]{0,90}/) ?? ["cause non lisible dans sa sortie"])[0]}` };
  if (MOTIFS_D_HONNETETE.test(String(sortie))) return { cle: "honnete", pourquoi: "il tourne et déclare ce qu'il ne peut pas mesurer ici — c'est le comportement attendu au moment « AVANT »" };
  return { cle: "portable", pourquoi: "il tourne et rend un résultat sur un dépôt qu'il ne connaît pas" };
}

// UN OUTIL QUI SERT LE PRODUIT N'A PAS À ÊTRE PORTABLE, et le compter comme un échec fausserait le
// chiffre dans le mauvais sens : `check-spirit` provoque les personnages du jeu, `run-framework`
// lance CE site — ils ne partent pas, et c'est écrit depuis longtemps. LA LISTE NE SE RECOPIE PAS
// (Article 24) : c'est le registre `NE_PART_PAS_ET_C_EST_NORMAL` du même fichier, celui-là même
// qui sert déjà à l'exportabilité. Un second registre finirait par diverger du premier.
// POSER L'AGENCE CHEZ L'HÔTE, à chaque passage, et dire ce qui a été posé. La copie porte TOUT le
// dossier `scripts/` et rien d'autre : c'est précisément ce que l'Agence prétend pouvoir emporter,
// donc c'est ce qu'on doit lui donner — ni plus (ce serait tricher), ni moins.
export function installerLAgenceChez(ou, { root = ROOT, copier = null, lister = null, shImpl = sh } = {}) {
  if (!ou) return { mesurable: false, pourquoi: "aucun dépôt témoin donné" };
  try {
    const copie = copier ?? cpSync;
    const listeur = lister ?? readdirSync;
    copie(join(root, "scripts"), join(ou, "scripts"), { recursive: true, force: true });
    const fichiers = listeur(join(ou, "scripts")).length;
    let commit = "commit inconnu";
    try { commit = String(shImpl("git rev-parse --short HEAD")).trim() || commit; } catch { /* un dépôt sans git reste mesurable */ }
    return { mesurable: true, fichiers, commit };
  } catch (e) {
    return { mesurable: false, pourquoi: `la copie de scripts/ vers ${ou} a échoué (${e?.message ?? e}) — et sans copie fraîche, le banc mesurerait ce qui traînait là` };
  }
}

// LE BANC HONORE LES DEUX REGISTRES, jamais un seul (2026-09-28, tâche #902). C'est mot pour mot le
// défaut corrigé sur le détecteur voisin en #668, et il était encore là ici : `NE_PART_PAS` liste
// les outils dont le SUJET est le jeu, `EXEMPTES_DU_KIT` les fichiers qui ne quittent pas ce dépôt
// du tout (crochets git, installeurs de l'environnement d'ici). Reprocher à un installeur de ne pas
// tourner ailleurs, c'est lui reprocher de faire son travail. Corriger une occurrence ne corrige
// pas la CLASSE (leçon L37).
export function synthetiserLeTemoin(passages = [], { exemptes = NE_PART_PAS_ET_C_EST_NORMAL, exemptesDuKit = EXEMPTES_DU_KIT } = {}) {
  if (!passages.length) return { mesurable: false, pourquoi: "aucun outil lancé : un banc d'essai vide rendrait « tout est portable » sur zéro mesure (leçon L5/L11)" };
  const parVerdict = {};
  const horsSujet = [];
  for (const p of passages) {
    if (Object.hasOwn(exemptes, p.outil)) { horsSujet.push({ ...p, pourquoi: exemptes[p.outil] }); continue; }
    const duKit = (exemptesDuKit ?? []).find((e) => e.motif.test(`scripts/${p.outil}.mjs`) || e.motif.test(`scripts/${p.outil}`));
    if (duKit) { horsSujet.push({ ...p, pourquoi: duKit.pourquoi }); continue; }
    (parVerdict[p.verdict.cle] ??= []).push(p);
  }
  // UNE LIMITE DU BANC SORT DU DÉNOMINATEUR, jamais du bon côté ni du mauvais : compter un paquet
  // npm non installé comme un succès serait un faux vert, le compter comme un échec facturerait à
  // l'Agence un choix du banc. On ne mesure pas ce qu'on n'a pas mis en condition de répondre.
  const limiteDuBanc = parVerdict["dependance-non-installee"] ?? [];
  const total = passages.length - horsSujet.length - limiteDuBanc.length;
  // « attend un argument » et « attend une configuration » tiennent debout eux aussi : refuser
  // proprement, en nommant ce qui manque, est un comportement sain — et le compter comme un échec
  // pousserait un outil à fabriquer un résultat plutôt qu'à dire non.
  const tiennentDebout = (parVerdict.portable?.length ?? 0) + (parVerdict.honnete?.length ?? 0)
    + (parVerdict["attend-un-argument"]?.length ?? 0) + (parVerdict["attend-une-configuration"]?.length ?? 0);
  return { mesurable: true, total, parVerdict, tiennentDebout, horsSujet, limiteDuBanc,
    tauxPct: total ? (tiennentDebout / total) * 100 : 0,
    // LE TAUX COMPTE « HONNÊTE » DU BON CÔTÉ, et cette décision est le cœur du dispositif :
    // un taux qui punirait l'honnêteté pousserait à fabriquer des réponses.
    quoi: "part des outils qui TIENNENT DEBOUT sur un dépôt étranger — ceux qui rendent un résultat ET ceux qui déclarent honnêtement ne pas pouvoir" };
}

// =============================================================================================
// LA MÉMOIRE DU BANC — sans elle, le banc mesurait pour personne
// =============================================================================================
// LE DÉFAUT EST LA LEÇON L2 DANS SA FORME LA PLUS PURE (2026-09-28, tâche #902). Le banc témoin
// EXISTE, il TOURNE, il rend un vrai chiffre sur un vrai dépôt étranger — et le rapport central
// écrivait `temoin: { mesurable: false }` EN DUR, donc affichait « aucune mesure disponible
// aujourd'hui » quelques secondes après que la mesure ait été faite. Une mesure qui n'est pas
// rendue n'existe pas : c'est exactement ce que l'Article 28 dit d'un rapport sans suite.
//
// POURQUOI UN REGISTRE ET PAS UN RECALCUL À LA VOLÉE : le banc CLONE un dépôt étranger, y copie
// l'Agence entière et lance soixante-treize outils. Ça prend des minutes et ça demande le réseau.
// Le rapport central, lui, doit rester gratuit et instantané — il rassemble, il ne recalcule
// jamais (leçon L29). Le banc écrit donc son passage, le rapport le lit.
//
// ET LA FRAÎCHEUR EST PART DE LA MESURE, jamais un détail : un taux mesuré sur une Agence de la
// semaine dernière décrit la semaine dernière. Le registre garde donc le commit du dépôt au moment
// du passage, et la lecture DIT si `scripts/` a bougé depuis. Ce n'est pas un seuil choisi — c'est
// une comparaison de faits (Article 24), et elle ne peut pas se périmer.
export const BANC_TEMOIN_PASSAGES = "docs/safe-export/banc-temoin-passages.json";

export function enregistrerPassageDuBanc(passage, { root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, mkdirImpl = mkdirSync } = {}) {
  let journal = [];
  try { journal = JSON.parse(readFileImpl(join(root, BANC_TEMOIN_PASSAGES), "utf8")); } catch { journal = []; }
  if (!Array.isArray(journal)) journal = [];
  journal.push(passage);
  try { mkdirImpl(join(root, "docs/safe-export"), { recursive: true }); } catch { /* déjà là */ }
  writeFileImpl(join(root, BANC_TEMOIN_PASSAGES), JSON.stringify(journal, null, 2) + "\n", "utf8");
  return journal.length;
}

export function dernierPassageDuBanc({ root = ROOT, readFileImpl = readFileSync, commitActuel = null, shImpl = sh } = {}) {
  let journal = [];
  try { journal = JSON.parse(readFileImpl(join(root, BANC_TEMOIN_PASSAGES), "utf8")); } catch {
    return { mesurable: false, pourquoi: "le banc n'a jamais enregistré de passage — et ne pas savoir n'est pas la même chose que savoir que ça ne marche pas" };
  }
  const dernier = Array.isArray(journal) ? journal.at(-1) : null;
  const precedent = Array.isArray(journal) && journal.length > 1 ? journal.at(-2) : null;
  if (!dernier || typeof dernier.taux !== "number") {
    return { mesurable: false, pourquoi: "le registre du banc existe mais ne porte aucun passage chiffré" };
  }
  let actuel = commitActuel;
  if (actuel === null) { try { actuel = String(shImpl("git rev-parse --short HEAD")).trim(); } catch { actuel = null; } }
  // L'AGENCE A-T-ELLE BOUGÉ DEPUIS ? On ne compare pas des dates — on demande à git si `scripts/`
  // a changé entre le commit mesuré et celui d'aujourd'hui. Un fait, jamais une estimation d'âge.
  let bouge = null;
  if (actuel && dernier.commit && actuel !== dernier.commit) {
    try { bouge = String(shImpl(`git diff --name-only ${dernier.commit}..${actuel} -- scripts/`)).trim().split("\n").filter(Boolean).length; }
    catch { bouge = null; }
  } else if (actuel && actuel === dernier.commit) bouge = 0;
  const perime = bouge !== null && bouge > 0;
  return {
    // LE NUMÉRATEUR ET LE DÉNOMINATEUR VOYAGENT AVEC LE TAUX (2026-10-01, tâche #1385). Ils
    // étaient rendus pour le passage PRÉCÉDENT et pas pour le courant : un appelant qui compare
    // `t.debout` à `t.precedent.debout` comparait `undefined` à un nombre. Le registre les
    // stockait pourtant, et le résumé les cite — seule la sortie structurée les perdait.
    // Et ce manque est particulièrement mal placé ICI : le résumé de cet outil explique lui-même
    // qu'« une part de l'écart vient de qui est COMPTÉ, pas de qui tient debout ». Un taux sans
    // son dénominateur est précisément ce que cette phrase met en garde de lire.
    mesurable: true, taux: Math.round(dernier.taux), debout: dernier.debout, examines: dernier.examines,
    date: dernier.date, temoin: dernier.temoin, commit: dernier.commit,
    perime, fichiersChangesDepuis: bouge,
    precedent: precedent ? { taux: Math.round(precedent.taux), debout: precedent.debout, examines: precedent.examines, date: precedent.date } : null,
    // LE PASSAGE PRÉCÉDENT EST DIT, ET SON DÉNOMINATEUR AVEC (2026-09-28). Sans ça, un taux qui monte
    // de 89 à 100 se lit comme onze points de progrès, alors qu'une partie peut venir d'outils SORTIS
    // du calcul — exemptés ou mis hors mesure. Les deux sont légitimes, mais ce ne sont pas les
    // mêmes faits, et un chiffre dont le dénominateur a bougé sans le dire est un chiffre qui ment
    // poliment.
    resume: `${dernier.debout}/${dernier.examines} outils tiennent debout sur ${dernier.temoin ?? "un dépôt étranger"}, mesuré le ${String(dernier.date ?? "").slice(0, 10)} sur ${dernier.commit ?? "un commit inconnu"}`
      + (precedent ? ` (passage précédent : ${precedent.debout}/${precedent.examines} — dénominateur ${precedent.examines === dernier.examines ? "inchangé" : `passé de ${precedent.examines} à ${dernier.examines}, donc une part de l'écart vient de qui est COMPTÉ, pas de qui tient debout`})` : "")
      + (perime ? ` — ⚠️ PÉRIMÉ : ${bouge} fichier(s) de scripts/ ont changé depuis, ce taux décrit une Agence antérieure`
        : bouge === 0 ? " — à jour : l'Agence n'a pas bougé depuis ce passage"
          : " — fraîcheur inconnue : impossible de comparer les commits"),
  };
}

export function formatTemoinLines(t = {}, { ou = "" } = {}) {
  const L = ["", `=== LE BANC D'ESSAI DU TÉMOIN${ou ? ` — ${ou}` : ""} ===`];
  if (!t.mesurable) { L.push(`  🚨 PAS MESURÉ — ${t.pourquoi}`); return L; }
  L.push(`  ${t.tiennentDebout}/${t.total} outils tiennent debout (${t.tauxPct.toFixed(0)} %) — ${t.quoi}`);
  if (t.horsSujet?.length) L.push(`  (${t.horsSujet.length} outil(s) hors sujet, retirés du calcul avec leur raison écrite : ils servent le PRODUIT et n'ont jamais eu à partir — ${t.horsSujet.map((h) => h.outil).join(", ")})`);
  for (const v of VERDICTS_DU_TEMOIN) {
    const liste = t.parVerdict[v.cle] ?? [];
    L.push(`  ${v.icone} ${String(liste.length).padStart(2)} ${v.cle} — ${v.quoi}`);
    for (const p of liste.slice(0, 12)) L.push(`       ${p.outil} : ${p.verdict.pourquoi}`);
  }
  return L;
}

// =============================================================================================
// L'ÉTAPE 2 DU PLAN DE PORTABILITÉ — CLASSER, parce qu'un lien n'est pas forcément un défaut
// =============================================================================================
// ELLE ÉTAIT ÉCRITE DEPUIS LE 2026-09-27 ET JAMAIS FAITE (2026-09-28, tâche #902). La stratégie
// d'export la nomme noir sur blanc : « c'est l'étape que personne ne saute impunément — traiter les
// 43 comme 43 bugs serait un chantier absurde ». Et le rapport continuait d'afficher UN nombre, 43,
// sans dire combien appellent vraiment du travail. Un nombre indifférencié ne se traite pas : il
// décourage, ce qui est la façon la plus sûre de ne jamais commencer.
//
// LES TROIS CATÉGORIES SONT LES SIENNES, reprises mot pour mot de la stratégie — jamais réinventées
// ici, sans quoi le rapport et la stratégie diraient deux choses (leçon L29) :
//   · LÉGITIMEMENT LIÉ — l'outil sert le PRODUIT, ou ne quitte pas ce dépôt. Rien à faire, et c'est
//     écrit depuis longtemps dans les deux registres de dispense.
//   · PARAMÉTRABLE — l'outil OFFRE DÉJÀ un moyen de changer sa cible ; le chemin de ce projet n'est
//     que sa valeur par défaut. Le taux monte vite ici, et sans risque.
//   · À DÉCOUPLER — l'outil SUPPOSE la structure au lieu de la lire. C'est le seul vrai travail.
//
// LE CLASSEMENT SE DÉRIVE, IL NE S'ÉNUMÈRE PAS (Article 24) : les deux registres de dispense sont
// lus, et `estParametrable()` — écrit pour #668 et déjà éprouvé sur les 86 scripts — répond à la
// seconde question. Aucune liste tenue à la main, donc rien qui se périme au prochain outil.
export const CATEGORIES_DE_LIEN = [
  { cle: "legitime", quoi: "l'outil sert le PRODUIT ou ne quitte pas ce dépôt", geste: "rien — c'est écrit dans les registres de dispense" },
  { cle: "parametrable", quoi: "l'outil offre déjà un moyen de changer sa cible ; ce chemin n'est que son défaut", geste: "rien de plus qu'un argument au moment d'arriver — le comportement d'ici ne change pas d'un iota" },
  { cle: "a-decoupler", quoi: "l'outil SUPPOSE la structure au lieu de la lire", geste: "du vrai travail : faire DÉTECTER ce qui est supposé" },
];

export function classerLeLien(chemin, code, { exemptes = NE_PART_PAS_ET_C_EST_NORMAL, exemptesDuKit = EXEMPTES_DU_KIT } = {}) {
  const slug = String(chemin).replace(/^scripts\//, "").replace(/\.mjs$/, "");
  if (Object.hasOwn(exemptes, slug)) return { categorie: "legitime", pourquoi: exemptes[slug] };
  const duKit = (exemptesDuKit ?? []).find((e) => e.motif.test(chemin));
  if (duKit) return { categorie: "legitime", pourquoi: duKit.pourquoi };
  if (estParametrable(code)) return { categorie: "parametrable", pourquoi: "il expose au moins une cible en paramètre par défaut : arriver ailleurs demande de la lui donner, pas de le réécrire" };
  return { categorie: "a-decoupler", pourquoi: "aucune cible paramétrable trouvée : le chemin de ce projet est écrit dans son corps, donc il faut le faire détecter au lieu de le supposer" };
}

export function mesurerLaPortabilite({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage, marqueurs = MARQUEURS_DE_NON_PORTABILITE } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, "scripts")).filter((f) => String(f).endsWith(".mjs")); } catch { /* dossier illisible */ }
  if (!fichiers.length) {
    return { mesurable: false, pourquoi: "aucun script lu : rendre « tout est portable » sur zéro fichier serait un satisfecit sur du vide (leçon L13)" };
  }
  const lignes = [];
  for (const f of fichiers) {
    let src; try { src = readFileImpl(join(root, "scripts", f), "utf8"); } catch { continue; }
    const nu = codeSansCommentaires(src);
    const trouves = marqueurs.filter((m) => m.motif.test(nu));
    if (trouves.length) {
      const classe = classerLeLien(`scripts/${f}`, nu);
      lignes.push({ fichier: `scripts/${f}`, marqueurs: trouves.map((m) => m.cle), combien: trouves.length, ...classe });
    }
  }
  lignes.sort((a, b) => b.combien - a.combien);
  const parMarqueur = {};
  for (const l of lignes) for (const m of l.marqueurs) parMarqueur[m] = (parMarqueur[m] ?? 0) + 1;
  return {
    mesurable: true, examines: fichiers.length, lies: lignes.length,
    portables: fichiers.length - lignes.length,
    tauxPct: ((fichiers.length - lignes.length) / fichiers.length) * 100,
    lignes, parMarqueur,
    parCategorie: Object.fromEntries(CATEGORIES_DE_LIEN.map((c) => [c.cle, lignes.filter((l) => l.categorie === c.cle).length])),
    // LA LIMITE EST LE CŒUR DU RÉSULTAT, pas une note en bas de page : un balayage de texte trouve
    // les chemins écrits en dur. Il ne prouve JAMAIS qu'un outil sans chemin en dur fonctionne
    // ailleurs — seule une exécution contre un autre dépôt le prouverait. « Portable » ici veut
    // donc dire « rien ne le retient visiblement », jamais « vérifié à l'arrivée ».
    horsPortee: "un balayage de texte trouve les chemins écrits en dur ; il ne prouve pas qu'un outil sans chemin en dur FONCTIONNE ailleurs. Seule une exécution contre un autre dépôt le prouve — c'est le banc témoin, et il tourne maintenant. LA LIMITE DU CLASSEMENT, dite plutôt que découverte plus tard : « PARAMÉTRABLE » veut dire que l'outil expose AU MOINS UNE cible en paramètre, pas que CHACUNE de ses mentions en soit une. C'est un indice fort — un outil qui a pris l'habitude de paramétrer une cible l'a généralement prise pour les autres — jamais une preuve par mention. Le trancher exigerait de relier chaque littéral à son paramètre, ce qui coûte une analyse de flot de données ; le dire coûte une phrase.",
  };
}

export function formatPortabiliteLines(p, { combien = 10 } = {}) {
  if (!p?.mesurable) return [`PORTABILITÉ : PAS MESURÉE — ${p?.pourquoi ?? "aucune donnée"}`];
  const L = ["=== PORTABILITÉ — l'outil fonctionne-t-il une fois ARRIVÉ ? ===",
    `  ${p.lies} script(s) sur ${p.examines} portent un chemin ou un nom de CE dépôt DANS LEUR CODE.`,
    `  ${p.tauxPct.toFixed(0)} % ne sont retenus par rien de visible.`, ""];
  // LE CLASSEMENT PASSE AVANT LA LISTE, et c'est délibéré : un lecteur qui voit d'abord « 43 »
  // referme le rapport. Un lecteur qui voit d'abord « 2 à découpler » ouvre les deux.
  if (p.parCategorie) {
    L.push("  CE QUE CES LIENS COÛTENT VRAIMENT — l'étape 2 du plan de portabilité, classer avant de corriger :");
    for (const c of CATEGORIES_DE_LIEN) {
      L.push(`    ${String(p.parCategorie[c.cle] ?? 0).padStart(3)} ${c.cle.toUpperCase().padEnd(14)} ${c.quoi}`);
      L.push(`        → ${c.geste}`);
    }
    const aFaire = (p.lignes ?? []).filter((l) => l.categorie === "a-decoupler");
    if (aFaire.length) {
      L.push(`  LES SEULS QUI APPELLENT DU TRAVAIL (${aFaire.length}) :`);
      for (const l of aFaire) L.push(`    · ${l.fichier} — ${l.marqueurs.join(", ")} — ${l.pourquoi}`);
    }
    L.push("");
  }
  L.push("  Les plus liés :");
  for (const l of p.lignes.slice(0, combien)) L.push(`   ${l.fichier.padEnd(38)} ${l.marqueurs.join(", ")}`);
  if (p.lignes.length > combien) L.push(`   … et ${p.lignes.length - combien} autre(s)`);
  L.push("", "  Par type de dépendance :");
  for (const [k, v] of Object.entries(p.parMarqueur).sort((a, b) => b[1] - a[1])) {
    const m = MARQUEURS_DE_NON_PORTABILITE.find((x) => x.cle === k);
    L.push(`   ${String(v).padStart(3)} × ${k} — ${m?.coute ?? ""}`);
  }
  L.push("", `  ⚠️ EXPORTABLE ET PORTABLE SONT DEUX MESURES, jamais une moyenne : un outil peut avoir son kit complet et rester inutilisable ailleurs. C'est arrivé le jour où ce constat est né.`);
  L.push(`  HORS PORTÉE : ${p.horsPortee}`);
  return L;
}

// --- LES TROIS ZONES DE L'AGENCE (2026-09-29, tâche #1234) ------------------------------------
//
// CE QU'ELLES FERMENT. Mesuré le soir même : l'Agence n'avait AUCUNE existence technique — pas de
// dossier, pas de manifeste, pas de point d'entrée — et elle n'était définie QUE PAR SOUSTRACTION,
// par les deux registres ci-dessus qui disent ce qui ne part pas. Conséquence : déposer un fichier
// dans `scripts/` l'enrôlait dans l'Agence sans que personne ne le décide.
//
// ELLES NE SONT PAS INVENTÉES, ELLES SONT LUES. Le découpage existait déjà, appliqué par
// `NE_PART_PAS_ET_C_EST_NORMAL` et `EXEMPTES_DU_KIT` sans jamais avoir été nommé. Ce code ne crée
// aucune liste nouvelle : il DÉRIVE les zones de ces deux registres, donc une exemption ajoutée
// demain déplace automatiquement son fichier (Article 24 — un registre se LIT).
//
// LA ZONE 1 EST UN RESTE, ET C'EST VOULU : un fichier neuf est DANS l'Agence par défaut et doit se
// justifier pour en sortir. L'inverse laisserait des orphelins invisibles, ce qui est précisément
// le défaut qu'on ferme. Détail et interdits : `docs/manifeste-de-l-agence.md`.
export const ZONES_DE_L_AGENCE = {
  noyau: { icone: "⚙️", quoi: "l'outillage qui part en entier le jour de l'export — il ne parle pas du jeu et ne dépend pas de ce dépôt" },
  produit: { icone: "🎭", quoi: "les outils dont le SUJET est le jeu : chez un client ils n'auraient rien à regarder" },
  cablage: { icone: "🔌", quoi: "ce qui attache l'Agence à CETTE machine et à CE dépôt — ça se réinstalle ailleurs, ça ne voyage pas" },
};

// Le slug d'un fichier tel que `NE_PART_PAS_ET_C_EST_NORMAL` le nomme : sans le dossier, sans
// l'extension, et sans le préfixe `check-` — la même convention que le reste du paysage.
export function slugDuFichierAgence(chemin = "") {
  return String(chemin).replace(/^scripts\//, "").replace(/\.(mjs|js|sh|ts)$/, "").replace(/^check-/, "");
}

export function zoneDuFichier(chemin, { nePartPas = NE_PART_PAS_ET_C_EST_NORMAL, exemptes = EXEMPTES_DU_KIT } = {}) {
  if (estExemptDuKit(chemin, exemptes)) return "cablage";
  const sansDossier = String(chemin).replace(/^scripts\//, "").replace(/\.(mjs|js|sh|ts)$/, "");
  if (nePartPas[slugDuFichierAgence(chemin)] !== undefined || nePartPas[sansDossier] !== undefined) return "produit";
  return "noyau";
}

// LES DEUX SENS, JAMAIS UN SEUL. La zone 1 étant un reste, rien ne peut être « hors zone » par
// accident — ce que ce garde-fou attrape est donc l'AUTRE sens : une zone qui réclame un fichier
// qui n'existe plus, ce qui arrive à chaque renommage. Et il rend le découpage VISIBLE : le jour où
// la zone du produit passe de 9 à 15 outils, quelqu'un le saura.
export function findFichiersHorsZone({ fichiers = null, root = ROOT, listerImpl = null, nePartPas = NE_PART_PAS_ET_C_EST_NORMAL, exemptes = EXEMPTES_DU_KIT } = {}) {
  const tous = fichiers ?? (listerImpl ? listerImpl() : null);
  if (!tous) return { mesurable: false, pourquoi: "la liste des fichiers n'a pas pu être établie — « aucun hors zone » et « je n'ai pas pu regarder » s'écrivent tous les deux zéro (L5)" };
  const parZone = { noyau: [], produit: [], cablage: [] };
  for (const f of tous) parZone[zoneDuFichier(f, { nePartPas, exemptes })].push(f);
  // LES DEUX FORMES DU NOM, parce que le registre utilise les deux — et la première version de ce
  // garde-fou a accusé `check-house`, `check-profile` et `check-spirit` d'avoir disparu alors
  // qu'ils sont là : le registre les nomme AVEC leur préfixe, que le calcul de slug retire. Trois
  // fausses accusations dès le premier passage, sur les trois outils les plus utilisés du dépôt
  // (leçon L4). Le classement en zones, lui, essayait déjà les deux — l'incohérence était ici.
  const slugsReels = new Set(tous.flatMap((f) => [slugDuFichierAgence(f), String(f).replace(/^scripts\//, "").replace(/\.(mjs|js|sh|ts)$/, "")]));
  const reclamesIntrouvables = Object.keys(nePartPas).filter((s) => !slugsReels.has(s));
  return { mesurable: true, parZone, reclamesIntrouvables, total: tous.length };
}


// LE LANCEUR EN TOUT DERNIER (déplacé le 2026-09-26) : les constantes du kit d'export ont
// rejoint la fin du fichier, et main() serait parti avant elles — leur zone morte temporelle,
// que findLanceursPrematures() refuse. Quatrième outil du dépôt à le payer : le défaut se
// déclenche à la seconde où un `const` passe sous la ligne du lanceur, jamais avant.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
