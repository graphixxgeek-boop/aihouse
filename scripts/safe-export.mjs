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

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { mesurerCorpus, ligneCorpus, findGardiensSansMesureDeCorpus, formatGardiensSansMesureLines, GARDIENS_SACRES } from "./corpus-mesure.mjs";
import { join } from "node:path";
import { printReliabilityNotice, porteeDe } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";
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
export const MARQUES_DE_CE_PROJET = /\bLia\b|\bNoé\b|la maison|l'enquête|Gemini|aihouse/;
export function findFuitesDeSpecificite(fichiers = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
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
export function gardeFousCitesParLesRegistres({ root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_CITANT_DES_GARDE_FOUS } = {}) {
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

export function findGardeFousSansRaison(fichiers = [], { readFileImpl = readFileSync, root = ROOT, cites } = {}) {
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
export function findDependancesOutillage(fichiers = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
  const trouvees = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    if (declarationDuFichier(texte) !== "générique") continue;
    const lignes = texte.split("\n").filter((l) => DEPENDANCES_OUTILLAGE.test(l));
    // Une dépendance CITÉE POUR ÊTRE ÉCARTÉE n'en est pas une — le texte qui dit « une IA sans
    // crochet git doit pouvoir travailler » nomme forcément le crochet git. Sans cette distinction,
    // le détecteur signalerait le plus fort des garde-fous d'exportabilité comme un défaut.
    const reelles = lignes.filter((l) => !/sans |jamais |ne dépend|indépendam|plutôt que/i.test(l));
    if (reelles.length) trouvees.push({ fichier: f, occurrences: reelles.length, exemple: reelles[0].trim().slice(0, 100) });
  }
  return trouvees;
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

export function findScriptsNonPortables(scripts = [], { readFileImpl = readFileSync, root = ROOT, portee = porteeDe, exemptes = NE_PART_PAS_ET_C_EST_NORMAL } = {}) {
  const trouves = [];
  for (const f of scripts) {
    const slug = f.replace(/^scripts\//, "").replace(/\.mjs$/, "");
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
    const code = texte.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    const fuites = [];
    for (const a of ARTEFACTS_DU_JEU) if (a.motif.test(code)) fuites.push(a.quoi);
    const cheminsDurs = [...code.matchAll(MOTIF_CHEMIN_PROJET)].map((m) => m[1]);
    // Un chemin en dur n'est un défaut que s'il n'est PAS paramétrable : tout ce paysage passe ses
    // chemins en option avec une valeur par défaut, et c'est exactement la forme portable.
    const parametrables = /\{\s*(root|registres?|fichiers?|chemin|dossiers?)\s*=/.test(code);
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

// LE MANIFESTE D'EXPORT — la seconde moitié du muscle, et la plus utile le jour où ça sert
// vraiment. Jusqu'ici SAFE-EXPORT disait si un outil AVAIT L'AIR exportable ; il ne disait jamais
// CE QU'IL FAUDRAIT EMPORTER. Une exportabilité qu'on ne sait pas exécuter n'est pas une
// exportabilité, c'est une opinion sur du code.
export function manifesteDExport(slug, { root = ROOT, readFileImpl = readFileSync, exists = existsSync } = {}) {
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
  { cle: "probleme", motif: /problème qu'il résout|le problème|pourquoi il existe|vocation|ce que ce patron résout|se justifie/i, pourquoi: "sans le problème résolu, personne ne saura si cet outil vaut la peine d'être repris" },
  { cle: "garde-fous", motif: /garde-fou|limite honnête|ce qu'il ne|jamais/i, pourquoi: "sans ses limites, l'outil sera cru au-delà de ce qu'il sait faire" },
];

export function findBlueprintsMalConstruits(blueprints = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
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
export function findOutilsSansBlueprint(outils = [], { root = ROOT, exists = existsSync, exemptes = SANS_BLUEPRINT_ASSUME, alias = BLUEPRINT_SOUS_UN_AUTRE_NOM } = {}) {
  return outils
    .filter((o) => !(o in exemptes))
    .filter((o) => exists(join(root, `scripts/${o}.mjs`)) || o in alias)
    .filter((o) => !exists(join(root, alias[o] ?? `docs/${o}-blueprint.md`)))
    .map((o) => ({ outil: o, pourquoi: "aucun blueprint : cet outil ne partira pas avec l'Agence le jour de l'export" }));
}

// ————————————————————————————————————————————————————————————————————————
// L'ESCALADE INTELLIGENTE — « elle avertit et propose une sonde plus poussée de façon intelligente »
// ————————————————————————————————————————————————————————————————————————

// Ce qui rend la proposition INTELLIGENTE plutôt que systématique : elle ne se déclenche que quand
// les indices se CONCENTRENT. Trois écarts éparpillés dans trois fichiers sont du bruit ordinaire ;
// trois écarts dans le même fichier disent qu'il s'y passe quelque chose. Proposer un scan payant à
// chaque avertissement reviendrait à le proposer toujours, donc à n'être jamais écouté.
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
export function loadMemoire({ root = ROOT, readFileImpl = readFileSync, fichier = MEMOIRE_FILE } = {}) {
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

function main() {
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
  console.log(`  fuites de spécificité : ${fuites.length}`);
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
      if (e.exemple) return `${ou}:${e.ligne} — jargon propre au projet : « ${String(e.exemple).trim().slice(0, 90)} »`;
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

  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);

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
export function findGardienAmbigu(texte, options = {}) {
  return findVocabulaireAmbigu(texte, VOCABULAIRE_RESERVE.find((v) => v.terme === "gardien"), options);
}

// LE BALAYAGE RÉEL, sur les documents normatifs seulement (cf. portée ci-dessus). C'est ce que
// SAFE-EXPORT fait remonter dans ses écarts : une dette de vocabulaire est une dette de REPRISE,
// donc son domaine, jamais celui d'un Gardien sacré du code.
export function scanVocabulaire({ root = ROOT, termes = VOCABULAIRE_RESERVE, readFileImpl = readFileSync, listDirImpl = readdirSync } = {}) {
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

// LE LANCEUR EN DERNIER, ET C'EST UNE CONTRAINTE RÉELLE, pas une préférence de rangement : il
// était placé au milieu du fichier, donc main() s'exécutait avant que les `const` écrits en
// dessous n'existent (zone morte temporelle). scanVocabulaire() a planté au premier vrai
// lancement — l'outil aurait paru fini et n'aurait jamais tourné. Toute section ajoutée plus bas
// hérite désormais de la garantie : au moment où main() part, tout le module est initialisé.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
