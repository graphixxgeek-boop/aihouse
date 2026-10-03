// ICEBERG: membre
// LE-COORDINATEUR — petit orchestrateur des vérifications gratuites déjà existantes (2026-09-19,
// nommé ainsi par l'utilisateur, calibré via l'Article 16 : « est-ce qu'il est possible de le
// créer à moindre coût, simplement comme un coordinateur de fonctions existantes ? juste là pour
// fiabiliser et fluidifier l'existant [...] assure-toi que le coordinateur est spécialement bien
// câblé avec tous les autres outils, qu'il a un accès facile et privilégié pour communiquer avec
// les autres outils, puisque son but est de fluidifier le processus. »
//
// Volontairement mince : il ne réimplémente AUCUNE logique de vérification lui-même. Il importe
// et appelle directement les fonctions pures déjà exportées par chaque outil (accès "privilégié"
// demandé explicitement) plutôt que de reparser leur sortie texte à l'aveugle une seconde fois —
// exactement la règle de mutualisation de docs/regles-de-travail.md §7ter :
//   - lib-shell.mjs::sh                              → lancer les scripts qui n'exposent pas
//     (encore) toute leur logique en fonctions pures (ARGUS, HARMONIA, ALWAYS-NEW-CODE).
//   - hyper-scan-checkpoint.mjs::summarizeArgusOutput / summarizeHarmoniaOutput → mêmes résumés
//     que HYPER-SCAN-CHECKPOINT utilise déjà, jamais une seconde regex réinventée à côté.
//   - axa-check.mjs::collectCoverage / robustnessScore → réutilise LE MÊME lancement de
//     check-house.mjs pour la couverture par fonction, jamais un second (règle anti-doublon).
//   - always-new-code.mjs::THEMES / parseCoverage / recommendZone → la même mémoire de rotation,
//     jamais une deuxième zone recommandée qui pourrait diverger de celle d'ALWAYS-NEW-CODE.
//   - clean-dirty-old.mjs::lastTouchDays / relativeStaleness → même calcul de stagnation relative,
//     jamais un second calcul divergent, et sans reshell check-house.mjs pour ce seul signal.
//   - check-level-target.mjs::classifyCheckLevel → exposé en passthrough (classifyRequest
//     ci-dessous) pour qu'un appelant puisse classer une demande sans réimporter le module lui-même,
//     jamais appelé automatiquement dans le passage périodique (il a besoin d'un texte de demande).
//
// Ce qu'il ne fait JAMAIS (cf. calibrage explicite du 2026-09-19, "Aucun de ces outils n'est
// autonome", docs/regles-de-travail.md) : il ne déclenche jamais, de sa propre initiative,
// HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — tout ce qui coûte
// un vrai appel API reste une décision explicite séparée de l'agent ou de l'utilisateur. Il ne
// décide rien sur le fond : il lance ce qui est déjà gratuit, agrège, et affiche un tableau très
// court — jamais un verdict qui remplacerait la lecture de la sortie complète de chaque outil.
//
// Contrairement aux autres outils de ce paysage, LE-COORDINATEUR n'a pas de blueprint/instanciation
// séparés ni de registre dédié : il n'a aucune connaissance propre au projet à documenter à part —
// sa seule valeur est de savoir appeler les autres. Documenté directement dans
// docs/regles-de-travail.md §7ter, à côté du reste du paysage.
//
// Déclenchement : automatique à chaque changement de code (même convention qu'ARGUS/HARMONIA —
// l'agent le relance en routine après un changement, pas un démon qui tourne en continu, Article 8).
// Doublon : si le commit HEAD n'a pas bougé depuis le dernier passage complet, le signale avant de
// relancer pour rien (jamais une fenêtre de temps, qui pourrait rater un vrai changement fait vite).

import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
// La racine du dépôt, pour relever les sources que chaque outil lit (tâche #1382). Injectable
// partout où elle sert, pour qu'un test puisse pointer un faux dossier sans toucher au vrai.
const ROOT_COORD = fileURLToPath(new URL("..", import.meta.url));
import { sh, assertNotAPersonnage, assertNomPropreDAgent, AGENT_CATEGORIES, sansAccents, rangDeLaCategorie, familleDeLaCategorie, lireLeDocumentGouvernant, ligneDocumentAbsent, scriptPourSlug } from "./lib-shell.mjs";
import { collectCoverage, robustnessScore, LIB_MAP, AGENT_SCRIPT_FILES } from "./axa-check.mjs";
import { findOrphanReportFiles, REGISTRIES as REGISTRIES_DOC_REPORT } from "./doc-report.mjs";
import { summarizeArgusOutput, summarizeHarmoniaOutput } from "./hyper-scan-checkpoint.mjs";
import { THEMES, parseCoverage, recommendZone } from "./always-new-code.mjs";
import { classifyCheckLevel } from "./check-level-target.mjs";
import { lastTouchDays, relativeStaleness } from "./clean-dirty-old.mjs";
// #714 — le catalogue se mesure contre le DÉPÔT RÉEL : le recensement dérive qui est lançable,
// l'inventaire de la charte rattache un script à son nom d'outil. Aucun cycle : le-classificateur
// ne nous importe pas (vérifié avant, Article 19).
import { recenserLesScripts, inventaireDeLaCharte } from "./le-classificateur.mjs";
import { findUnconfirmedBursts } from "./smart-conso-api.mjs";
import { summarizeHistory, findJudgeSpawnsWithoutConsultation, filterIndexRowsByVersion } from "./smart-conso-token.mjs";
import { checkWeightBudget } from "./ecotoken.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { loadJson, recordCliUsage, loadToolUsageHistory } from "./tool-usage.mjs";
import { buildPlanDaction, imprimerPlanDaction } from "./report-template.mjs";
import { BLOCS_GENERES } from "./lib-shell.mjs";
const MARQUEUR_GENERE_DEBUT = BLOCS_GENERES.at(-1).debut;
const MARQUEUR_GENERE_FIN = BLOCS_GENERES.at(-1).fin;

const ROOT = new URL("..", import.meta.url).pathname;
const BADGE_CEREMONY_HISTORY_PATH = join(ROOT, ".badge-ceremony-history.json");
// Best-effort, local, jamais committé — même statut que .gemini-key-health.json (mémoire de
// process/session, jamais une garantie inter-redémarrage, cf. CLAUDE.md section Smart Breaker).
const STATE_FILE = join(ROOT, ".le-coordinateur-last-run.json");
const ALWAYS_NEW_CODE_INDEX = join(ROOT, "docs/always-new-code/index.md");

// --- Relevé des 6 signaux de Gardien (2026-09-22) ---------------------------------------------
//
// Écart trouvé en vérifiant la divergence notée plus tôt (« le badge d'ecotoken affiche "en cours"
// alors qu'AXA-CHECK le mesure à 82 % ») : le crochet post-commit est le SEUL appelant qui fournit
// réellement les 6 signaux (couverture AXA-CHECK par script + les 4 comptes de Gardien + le drapeau
// ALWAYS-NEW-CODE) à checkAgentOnboarding(). Les deux autres appelants réels — CASSANDRA-RH
// (badgeOversightSummary) et check-tasks-details.mjs — n'en fournissent aucun : leurs badges
// affichent donc tous « en cours (jamais scanné ou très faible) », y compris pour un outil que le
// commit d'il y a trente secondes a mesuré à 100 %. Pire dans le rapport complet de CASSANDRA, où
// la couverture réelle est calculée DEUX LIGNES plus bas que des badges qui la disent inconnue.
//
// Corrigé à la racine plutôt qu'appelant par appelant (Article 3) : le producteur qui a déjà tout
// mesuré (le post-commit) DÉPOSE son relevé ici ; tout appelant le relit gratuitement. Jamais un
// second calcul, jamais un relancement de check-house.mjs pour un simple affichage de badge —
// exactement le patron déjà éprouvé de .gemini-key-health.json et .badge-ceremony-history.json
// (journal local, gitignored, best-effort, perdu à chaque nouveau conteneur : une absence de relevé
// redevient alors un honnête « jamais scanné », jamais une valeur périmée présentée comme fraîche).
//
// `commit` est enregistré avec le relevé pour que le lecteur sache de QUEL état du dépôt il parle ;
// `date` alimente le « (vérifié le ...) » du message de badge, jamais une date fabriquée au moment
// de la lecture.
const BADGE_SIGNALS_PATH = join(ROOT, ".badge-signals-snapshot.json");

export function saveBadgeSignals(signals, path = BADGE_SIGNALS_PATH) {
  try { writeFileSync(path, JSON.stringify(signals, null, 1)); } catch { /* best-effort, jamais bloquant */ }
}

// LES SIX SIGNAUX QUI PEUVENT ÊTRE MESURÉS. Déclarés une fois, lus partout — un septième Gardien
// rejoint l'équipe en ajoutant sa clé ici, jamais en retouchant les trois endroits qui les listaient
// chacun de leur côté (Article 24).
export const CLEFS_SIGNAUX_GARDIEN = ["argusFindingsCount", "harmoniaFindingsCount", "cleanDirtyOldFlagged", "cloneHunterFindingsCount", "alwaysNewCodeFlagged", "coverageBySlug"];

// mergeBadgeSignals() (2026-09-23, tâche #558) — LE CŒUR DE LA CORRECTION, et le défaut qu'elle
// ferme méritait son nom.
//
// CE QUI SE PASSAIT. Le relevé était ÉCRASÉ à chaque commit avec les seules valeurs mesurées CE
// commit-là. Un Gardien qui ne tournait pas (le crochet ne les lance pas tous à chaque fois)
// perdait donc sa dernière mesure connue, et le badge retombait sur « non consulté ». Au commit
// suivant il retournait, et le badge remontait. Résultat mesuré le 2026-09-23 : 67 cérémonies en
// attente, dont 34 « partiel → en cours » et 33 « en cours → partiel », sur les MÊMES outils, dont
// aucun n'avait changé. Le palier affiché ne mesurait pas l'outil, il mesurait le relevé.
//
// CE QUE ÇA CASSAIT VRAIMENT, au-delà du bruit : la cérémonie existe pour marquer un franchissement
// réel, et la règle « à afficher TEL QUEL, jamais résumé » suppose qu'il y en ait peu. Soixante-sept
// blocs identiques rendent cette règle inapplicable — donc contournable, ce qui est pire qu'une
// règle absente.
//
// LA RÈGLE, ET SON HONNÊTETÉ. Une mesure fraîche l'emporte toujours et prend la date du jour. Une
// clé non mesurée ce commit-ci garde sa valeur précédente ET SA PROPRE DATE — jamais rafraîchie au
// passage, ce qui reviendrait à dater d'aujourd'hui une mesure d'avant-hier. Une clé jamais mesurée
// reste absente : un badge doit pouvoir dire « personne n'a regardé », et des zéros fabriqués le
// lui interdiraient.
export function mergeBadgeSignals(precedent, frais, { date = new Date().toISOString().slice(0, 10), clefs = CLEFS_SIGNAUX_GARDIEN } = {}) {
  const fusion = { ...(precedent ?? {}), ...(frais ?? {}) };
  const mesureLe = { ...(precedent?.mesureLe ?? {}) };
  for (const clef of clefs) {
    const valeurFraiche = frais?.[clef];
    if (valeurFraiche !== undefined && valeurFraiche !== null) { fusion[clef] = valeurFraiche; mesureLe[clef] = date; }
    else if (precedent?.[clef] !== undefined && precedent?.[clef] !== null) fusion[clef] = precedent[clef];
    else delete fusion[clef];
  }
  for (const clef of Object.keys(mesureLe)) if (fusion[clef] === undefined) delete mesureLe[clef];
  fusion.mesureLe = mesureLe;
  fusion.date = date;
  return fusion;
}

export function loadBadgeSignals(path = BADGE_SIGNALS_PATH, readFile = (f) => readFileSync(f, "utf8")) {
  try {
    const data = JSON.parse(readFile(path));
    return data && typeof data === "object" ? data : null;
  } catch { return null; }
}

// Traduit un relevé en champs de contexte directement consommables par checkAgentOnboarding() —
// jamais une seconde interprétation des mêmes données chez chaque appelant. Un relevé absent rend
// un objet VIDE (jamais des zéros fabriqués) : les badges retombent alors honnêtement sur « jamais
// consulté », ce qui est la vérité quand personne n'a encore mesuré quoi que ce soit.
export function badgeSignalsAsContext(snapshot = loadBadgeSignals()) {
  if (!snapshot) return {};
  const contexte = {};
  const datesUtilisees = [];
  for (const clef of CLEFS_SIGNAUX_GARDIEN) {
    if (snapshot[clef] === undefined || snapshot[clef] === null) continue;
    if (clef === "coverageBySlug") contexte.axaCoverageBySlug = snapshot.coverageBySlug;
    else contexte[clef] = snapshot[clef];
    if (snapshot.mesureLe?.[clef]) datesUtilisees.push(snapshot.mesureLe[clef]);
  }
  // « Vérifié le » prend la date la PLUS ANCIENNE parmi les mesures réellement utilisées, jamais la
  // plus récente ni celle du dernier passage. Un verdict qui s'appuie sur une mesure d'avant-hier
  // n'a pas été vérifié aujourd'hui, même si une autre de ses six entrées l'a été — afficher la
  // date fraîche donnerait au verdict entier une fraîcheur que sa moitié n'a pas.
  const plusAncienne = datesUtilisees.length ? datesUtilisees.slice().sort()[0] : null;
  if (plusAncienne ?? snapshot.date) contexte.lastVerifiedAt = plusAncienne ?? snapshot.date;
  return contexte;
}

export function currentHead() {
  return sh("git rev-parse HEAD", { cwd: ROOT }).trim() || undefined;
}

export function loadState(readFile = (f) => readFileSync(f, "utf8")) {
  try { return JSON.parse(readFile(STATE_FILE)); } catch { return {}; }
}

function saveState(state) {
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch { /* best-effort, jamais bloquant */ }
}

// Un doublon n'est signalé que si RIEN n'a changé dans le dépôt depuis le dernier passage complet
// (même commit HEAD) — jamais une fenêtre de temps fixe, qui pourrait à tort couvrir un vrai
// changement fait vite, ou à l'inverse rater un vrai doublon si on relance après un long moment
// d'inactivité sans avoir touché au code.
export function isDuplicateRun(state, head) {
  return Boolean(state?.lastHead) && Boolean(head) && state.lastHead === head;
}

export function formatTable(rows) {
  const lines = ["| Outil | Résultat | Dernier passage |", "|---|---|---|"];
  for (const r of rows) lines.push(`| ${r.name} | ${r.result} | ${r.when} |`);
  return lines.join("\n");
}

// MENU DES PRESTATIONS (2026-09-20, demande explicite de l'utilisateur : « le coordinateur est
// capable de proposer de nouvelles prestations, quand les outils évoluent ou quand un nouvel outil
// est créé [...] ce menu est très utile pour toi [...] il te rappelle les prestations que tu peux
// commander au réseau d'outils [...] il est aussi utile pour moi, via toi »). Traduit chaque outil
// coûteux ou occasionnel du paysage en une DEMANDE EN LANGAGE COURANT, jamais un nom d'outil interne
// — le but est que l'agent (et l'utilisateur à travers lui) sache ce qu'il peut commander sans avoir
// à se souvenir des noms internes. Volontairement une simple liste de données, jamais un mécanisme :
// EXACTEMENT le même principe de sobriété que le reste de LE-COORDINATEUR (aucune connaissance
// propre, juste agréger/rappeler ce qui existe déjà).
//
// ÉVOLUTIF PAR CONSTRUCTION : quand un nouvel outil est créé, ou qu'un outil existant change ce
// qu'il peut faire, une entrée s'ajoute ou se met à jour ICI — fait partie du cahier des charges de
// tout nouvel outil au même titre que son blueprint (cf. docs/regles-de-travail.md §7ter, « un outil
// n'est jamais fini tant que ses points d'intégration ne sont pas câblés »). Jamais une liste figée
// à réciter de mémoire : toujours relue avant de répondre à une demande qui pourrait y correspondre.
// Chaque coût donne, quand c'est pertinent, une estimation CHIFFRÉE en tokens (schémas connus de
// SMART-CONSO-TOKEN, jamais un vrai compteur) en plus du coût en appels API — demande explicite de
// l'utilisateur du 2026-09-20 : « assure-toi que le coordinateur donne toujours une estimation du
// coût de l'utilisation des outils, en token et en API [...] raison pour laquelle tu dois ouvrir le
// catalogue en auto, pour te rappeler des prix ». Un outil qui appelle un agent séparé (outil
// `Agent`) porte systématiquement le repère "~37k tokens fixes" (KNOWN_COSTLY_PATTERNS.agent_subagent_spawn),
// jamais un chiffre inventé au cas par cas.
// `nom` (2026-09-21, tâche #154 — « toutes les combinaisons outils, un nom pour chaque prestation »)
// : un identifiant court et mémorable par offre, pour pouvoir parler du "Pack X" plutôt que de
// redécrire la combinaison d'outils à chaque fois — jamais un renommage des outils eux-mêmes,
// seulement de la COMBINAISON packagée ici.
//
// Écart réel trouvé et corrigé le 2026-09-21 (question directe de l'utilisateur : « on est d'accord
// que le coordinateur a pris le soin de réfléchir aux différentes combinaisons possibles... ? ») :
// vérifié en relisant la liste — NON, seules 2 des 14 lignes d'origine combinaient réellement
// plusieurs outils (Pack Sentinelle, Pack Rénovation), le reste était un mapping un-besoin-un-outil
// construit incrémentalement. Un vrai trou trouvé au passage : la synthèse complète et gratuite du
// réseau (`runNetworkCheck()`, déjà exposée dans la Ronde via l'item `network-check-run`) n'avait
// AUCUNE ligne PRESTATIONS — jamais proposée comme "offre" alors qu'elle combine 6 outils gratuits.
// Corrigé : "Pack Panorama" ajouté. Systématisé pour l'avenir (demande explicite : « je veux que ce
// soit le coordinateur qui réalise systématiquement cette passe [...] avant de délivrer le
// catalogue ») dans l'`execute` de l'item CIRCLE-TASKS `coordinateur-catalogue` (circle-tasks.mjs) —
// une vraie relecture combinatoire par l'agent avant chaque appel à recordCatalog(), jamais une
// heuristique mécanique inventée ici : LE-COORDINATEUR ne raisonne jamais lui-même (§7ter), décider
// qu'une combinaison est réellement utile reste un jugement, pas un calcul.
//
// Structure enrichie le 2026-09-21, deuxième vérification directe de l'utilisateur : « on est ok
// qu'il y a à chaque fois un prix en token ET api ? [...] avec une courte description, quelle que
// soit la combinaison ? ». Vérifié : NON — plusieurs lignes n'avaient aucun coût token chiffré
// (Pack Provocation) ou aucune mention explicite du coût API (Pack Ronde), les deux coûts mélangés
// dans une seule phrase libre selon les lignes. Corrigé en adoptant la MÊME séparation déjà validée
// dans CIRCLE_ITEMS (`cout` = appels Gemini/API réels, `tokensEstimes` = coût en tokens Claude,
// jamais confondus, cf. commentaire en tête de circle-tasks.mjs) — jamais un second vocabulaire
// inventé ici. `description` ajoutée : ce que la prestation délivre concrètement, distincte de
// `demande` (dans quel cas s'en servir) — pour que chaque ligne se lise comme une vraie offre de
// catalogue, pas seulement un renvoi vers un nom d'outil.
// Deuxième passe combinatoire le même jour (déjà systématisée ci-dessus, appliquée une seconde fois
// tout de suite à la demande explicite : « je imagine qu'il va y avoir beaucoup de combinaisons
// possibles [...] TOUTES CELLES qui peuvent être utiles pour toi ou pour le projet ») : deux
// nouveaux packs trouvés — "Pack Éclaireur" (AXA-CHECK + CLEAN-DIRTY-OLD + nœuds sensibles HARMONIA,
// jamais combinés avant pour un contrôle ciblé PRÉ-modification d'un fichier précis, distinct du
// balayage global de Pack Panorama) et "Pack Décollage" (Smart Conso API + le carnet de correctifs,
// jamais combinés avant pour un vrai contrôle pré-simulation, cf. Article 18 étape 0).
// Ordre du catalogue (2026-09-21, demande explicite de l'utilisateur : « en premier, sont présentés
// les outils seuls, tous les outils seuls, avant les combinaisons plus complexes ») : les 13
// prestations à un seul outil d'abord, puis les 5 combinaisons multi-outils ensuite (elles-mêmes
// triées par nombre d'outils croissant) — jamais un ordre historique arbitraire (Pack Sentinelle, un
// combo à 3 outils, était auparavant en toute première ligne).
export const PRESTATIONS = [
  // LES DEUX ARRIVANTS (2026-10-01). `fils-de-discussion` était construit depuis le 30/09 et
  // n'avait AUCUNE offre déclarée : invisible à tool-brain, donc jamais recommandé, donc jamais
  // lancé — et son zéro d'usage se serait lu ensuite comme un verdict sur son utilité plutôt que
  // comme la conséquence de son absence. Exactement le défaut relevé le 2026-09-29 pour
  // ezechiel-les-tests et html-report, et commis une troisième fois sur un outil que j'ai écrit.
  { nom: "Pack Suis-je à jour", description: "Répond mécaniquement à « es-tu à jour ? » par SIX contrôles et TROIS verdicts (OUI / NON / PAS ENTIÈREMENT MESURÉ), fil de discussion par fil : qui a la balle, depuis quand, où le sujet se place dans la stratégie, et si chaque engagement pris porte une tâche qui existe vraiment.", demande: "Savoir si je suis à jour sur tous ses sujets, et ce qui attend une réponse de qui", outils: ["fils-de-discussion"], cout: "0 appel API — il relit des documents locaux", tokensEstimes: "faible — un verdict, six lignes de contrôle et la liste des fils" },
  { nom: "Pack Chiffrage de refonte", description: "Chiffre ce que coûterait de tout reprendre à zéro : le volume par famille, le nombre de RAISONS déjà écrites qu'une refonte devrait relire ou regagner (le vrai coût, et il est concentré, pas réparti), et les acquis que la refonte remettrait en jeu. Il rend des volumes ; il ne recommande jamais.", demande: "Décider s'il faut tout reprendre à zéro, sur des chiffres plutôt que sur une impression", outils: ["cout-de-la-refonte"], cout: "0 appel API — il relit le dépôt", tokensEstimes: "faible — trois sections chiffrées et un plan d'action" },
  // JESUS-LE-SAUVEUR (2026-09-28) — la prestation réclamée par le garde-fou d'intégration le jour
  // de sa naissance, comme pour filet-en-parts juste en dessous.
  { nom: "Pack Anti-lourdeurs", description: "Cherche tout ce qui freine le projet, y compris là où on ne regarde pas : le temps machine, les obligations qui coûtent plus qu'elles ne rapportent, les alertes que plus personne ne lit, et le temps qu'une décision passe en attente. Il mesure l'ATTENTE plutôt que le travail, et croise ses sondes — une cause indirecte naît de la rencontre de deux mesures dont aucune n'alerte seule. Il signale et propose, il ne corrige jamais seul.", demande: "Savoir pourquoi le projet ralentit, avant un gros chantier ou quand quelque chose traîne sans qu'on sache quoi", outils: ["jesus-le-sauveur"], cout: "0 appel API — il lit des registres déjà écrits", tokensEstimes: "faible : quelques milliers de tokens pour lire son rapport et son plan d'action" },
  // FILET-EN-PARTS (2026-09-27) — la prestation réclamée nommément par le garde-fou d'intégration
  // à la seconde où l'outil est né.
  { nom: "Pack Filet en parts", description: "Lance la suite de tests en plusieurs parts simultanées au lieu d'une seule qui se déroule du début à la fin, puis remet la sortie dans l'ordre du fichier. Ne modifie jamais le filet : il en écrit des copies dérivées, donc le mode séquentiel reste la référence en cas de doute.", demande: "Lancer le filet de sécurité plus vite, en parallèle, pendant un gros chantier ou une vague de commits", outils: ["filet-en-parts"], cout: "0 appel API — mais sature les processeurs le temps du lancement", tokensEstimes: "négligeable" },
  // 2026-09-22 — les trois derniers arrivés, absents du catalogue depuis leur naissance. Aucun des
  // sept garde-fous d'intégration ne couvrait PRESTATIONS : ils vérifient chacun leur registre, et
  // celui-ci n'avait personne. Trouvé au premier vrai passage d'integration-outil.mjs, qui existe
  // précisément pour rendre la liste des registres DEMANDABLE avant de commencer.
  // LE-CLASSIFICATEUR (2026-09-26) — la prestation que son rang lui impose dès sa naissance, et
  // c'est le garde-fou d'intégration qui l'a réclamée à la seconde, par son nom.
  // Les quatre entrées que le garde-fou d'intégration a réclamées NOMMÉMENT le 2026-09-26, à la
  // seconde où ces outils ont rejoint l'équipe. Aucune n'a été devinée : chacune ferme un manque cité.
  { nom: "Pack Fidélité du ton", description: "Envoie de vraies provocations au vrai modèle et affiche les réponses telles quelles, pour une lecture humaine. Le seul outil qui touche la sortie RÉELLE des personnages.", demande: "Analyser et vérifier la qualité du ton, des dialogues et des répliques des personnages Lia et Noé, et détecter une dérive de personnalité (Article 0)", outils: ["check-spirit"], cout: "réel — 16 vrais appels Gemini, consulter Smart Conso API avant", tokensEstimes: "faible côté agent ; le coût est en appels API, pas en tokens" },
  { nom: "Pack Message court", description: "Met en forme un message court sans le noyer dans du préambule.", demande: "Écrire un message court et lisible", outils: ["messages-courts"], cout: "0 appel API", tokensEstimes: "négligeable" },
  { nom: "Pack Où on en est", description: "Rend l'état d'avancement réel, lu dans le suivi plutôt que raconté de mémoire.", demande: "Savoir où on en est", outils: ["ou-on-en-est"], cout: "0 appel API — lit docs/suivi/", tokensEstimes: "faible" },
  // LES QUATRE ABSENTS DU CATALOGUE (2026-09-26), trouvés par un chemin inattendu : la classification
  // des rapports range par SUJET en dérivant le sujet de la `demande` du catalogue — et six dossiers
  // sont sortis « sujet non déterminé ». La cause n'était pas la classification : c'était que quatre
  // outils bien réels n'ont jamais eu d'entrée ici. Un outil absent du catalogue est invisible à
  // tool-brain, donc jamais recommandé, donc jamais lancé — et son zéro d'usage se lit ensuite
  // comme un verdict sur lui.
  { nom: "Pack Réseau de vérifications", description: "Lance d'affilée les vérifications gratuites déjà existantes et rend un seul tableau, plutôt que treize commandes à enchaîner à la main.", demande: "Lancer d'un coup toutes les vérifications gratuites du dépôt et voir le réseau d'un seul coup d'œil", outils: ["le-coordinateur"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Rapports non unifiés", description: "Repère les outils qui produisent un rapport sans passer par le gabarit commun — donc dont la sortie ne ressemble à aucune autre.", demande: "Vérifier que tous les rapports du projet suivent le même gabarit, et trouver les outils qui y échappent", outils: ["pure-gold-unity"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Tableau de bord", description: "Les indicateurs chiffrés du projet, run après run, avec leur évolution — jamais un instantané isolé.", demande: "Suivre les indicateurs chiffrés du projet et leur évolution dans le temps", outils: ["kpi-report"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Sauvegarde", description: "Fabrique le coffre du projet et sa notice, pour le cas où l'accès à git ou à l'agent disparaîtrait.", demande: "Sauvegarder le projet entier dans une archive que je peux garder moi-même", outils: ["sauvegarde-projet"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Profil utilisateur", description: "Vérifie qu'une fiche d'observation a bien sa ligne d'index, et l'inverse — jamais une fiche orpheline.", demande: "Vérifier la cohérence du profil de collaboration", outils: ["check-profil-utilisateur"], cout: "0 appel API", tokensEstimes: "négligeable" },
  { nom: "Pack Rangement", description: "Dit ce qu'un fichier de l'outillage EST (son type), ce qu'il VAUT (son rang), ce sur quoi il travaille (sa famille) et ce qu'il DOIT (son poste) — et régénère le document officiel de classification, en texte et en HTML.", demande: "Savoir ce qu'est un fichier de l'outillage, quel rang il porte et ce qu'il doit — ou régénérer le document officiel de classification", outils: ["le-classificateur"], cout: "0 appel API — lit le dépôt réel", tokensEstimes: "nul : tout est mécanique, aucun raisonnement" },
  { nom: "Pack Départ", description: "Vérifie si l'outillage et le code sont exportables : jargon propre au projet resté dans un blueprint, terme employé sans fiche qui le définisse, mécanisme sans sa raison écrite.", demande: "Exportabilité de l'Agence, reprise par une autre IA (Article 27)", outils: ["SAFE-EXPORT"], cout: "0 appel API — couche légère mécanique", tokensEstimes: "nul en couche légère ; la sonde profonde, elle, se propose et se valide avant" },
  // Pack Aveugle (2026-09-26) — le PENDANT du Pack Départ, et la distinction est tout : celui-ci
  // vérifie que les pièces SONT LÀ, celui-là ce qu'elles VALENT. SAFE-EXPORT déclare lui-même ne
  // jamais lire le contenu de ce qu'il compte.
  { nom: "Pack Aveugle", description: "Donne à un agent séparé les DOCUMENTS d'un outil, jamais son code, lui demande d'annoncer ce que le code contient, et compare — pour savoir si la documentation dit la vérité.", demande: "Vérifier qu'un kit d'export est fidèle, pas seulement complet — la documentation décrit-elle vraiment le code ?", outils: ["X-Port BLINDTEST"], cout: "COÛTEUX — un agent séparé pour l'étape du milieu ; les deux autres étapes sont gratuites", tokensEstimes: "élevé (~37 000 par lancement) — consulter Smart Conso API et SMART-CONSO-TOKEN AVANT" },
  // THE-EQUALIZER (2026-09-23) — la prestation que personne ne rendait : un verdict d'ENSEMBLE. Chaque
  // pack ci-dessous répond de sa part ; celui-ci répond de la question que l'utilisateur a posée
  // telle quelle (« qui se charge de vérifier que tout est à niveau »), et surtout nomme ce que
  // personne ne vérifie — ce qu'aucun contrôleur ne peut dire de lui-même.
  // MOÏSE-TABLES-DE-LOI (2026-09-23) — la prestation du périmètre de la charte, et d'elle seule.
  // Elle ne recouvre pas le Pack Token : celui-ci pèse N'IMPORTE QUEL document rechargé, celle-là
  // ne parle que de la charte et répond à des questions qu'aucun autre pack ne pose — qui tient
  // réellement cette règle, et qu'a-t-on déjà tenté dessus.
  { nom: "Pack Références", description: "Analyse N'IMPORTE QUEL document de règles numérotées : reconnaît sa forme sans configuration, dit qui tient réellement chaque règle, quelle nature elle a donc, laquelle ouvre une question et lesquelles se recouvrent sans le dire.", demande: "Analyser un document de règles autre que la charte", outils: ["ABRAHAM-LES-REFERENCES"], cout: "0 appel API", tokensEstimes: "nul — relit un document local et le dépôt" },
  { nom: "Pack Tables de Loi", description: "Diagnostic complet de la charte : ce que pèse chaque règle, qui la tient réellement (porté / sans porteur / fantôme), quelle nature elle a donc et quel geste elle appelle, ce qui a déjà été tenté dessus et qui n'a pas tenu, et si l'instrument de mesure lui-même est encore à jour.", demande: "Analyser la charte du projet en profondeur, ou préparer une décision qui la touche", outils: ["MOÏSE-TABLES-DE-LOI"], cout: "0 appel API", tokensEstimes: "nul — relit la charte et le dépôt local, et appelle les outils existants plutôt que de recalculer" },
  { nom: "Pack Niveau", description: "Rend UN verdict par domaine (l'Agence, les documents, le code, le jeu) contre les exigences écrites du référentiel des standards, et nomme les exigences que personne ne vérifie ainsi que les outils restés en retard sur l'équipe.", demande: "Est-ce que tout est à niveau ? (standards, formats, gabarits)", outils: ["THE-EQUALIZER"], cout: "0 appel API", tokensEstimes: "nul — relit un document et relaie des verdicts déjà calculés" },
  // Pack Heure (2026-09-24) — la prestation la plus modeste du catalogue, et elle règle une erreur
  // réelle : la nuit de sa construction, j'ai daté une ligne de suivi de quinze minutes dans le
  // futur parce que j'avais TAPÉ l'heure au lieu de la lire. Un agent ne sait pas l'heure.
  // 2026-09-24 — les capacités ajoutées cette nuit à des outils EXISTANTS n'avaient rejoint aucune
  // prestation, donc tool-brain ne savait pas les proposer. Une capacité que personne ne peut
  // trouver est une capacité que personne n'utilise : le trou était le même que celui de tout le
  // reste de cette nuit, l'artefact existe et rien ne mène à lui. Trouvé en INTERROGEANT tool-brain
  // sur ce que je venais de construire, jamais en relisant le catalogue.
  { nom: "Pack Convocation", description: "Convoque ce qui échoue, stagne ou ne progresse pas — et le convoqué n'est pas toujours l'outil : un outil jamais appelé convoque l'AGENT, une exigence tenue par moins de la moitié des outils convoque l'UTILISATEUR. Rend une question, un plan d'action et des tâches, et refuse toute clôture sans accord daté.", demande: "Savoir quels outils stagnent, échouent ou n'ont jamais servi, et qui doit en répondre", outils: ["CASSANDRA-RH"], cout: "0 appel API — relaie ce que le reste du réseau sait déjà", tokensEstimes: "faible" },
  { nom: "Pack Classification", description: "Classe les règles d'un document sur deux axes croisés — la GRAVITÉ que le texte porte lui-même et la FORCE DE GARANTIE que le dépôt lui donne réellement — et rend une page HTML avec une carte visuelle montrant d'un coup d'œil où l'enjeu dépasse la protection.", demande: "Classer les règles d'un document par gravité et par force de garantie", outils: ["ABRAHAM-LES-REFERENCES"], cout: "0 appel API", tokensEstimes: "faible — relit un document et le dépôt" },
  { nom: "Pack Recensement", description: "Recense les scripts du dépôt par TYPE (ce qu'un fichier EST) et par CLASSES transverses (ce qu'il SAIT FAIRE), mesure le nivellement — quelle exigence chaque classe appelle et qui ne l'atteint pas — et rend les trois niveaux de scan, les versions dérivées de git et la richesse de chaque outil.", demande: "Savoir ce que contient vraiment l'outillage, ce que chaque outil sait faire, et qui n'est pas à niveau", outils: ["CASSANDRA-RH"], cout: "0 appel API — lit le dépôt et git", tokensEstimes: "faible" },
  { nom: "Pack Uniformité", description: "Regroupe les scripts par famille (ce qu'un fichier EST) et signale les membres qui s'écartent de ce que leurs semblables font déjà majoritairement — la norme est DÉRIVÉE de la population, jamais d'une règle écrite ailleurs. Une famille de moins de trois membres n'est pas mesurée, et chaque écart sort comme une question.", demande: "Savoir si un outil fait autrement que ses semblables sans raison, et uniformiser une famille d'outils", outils: ["CASSANDRA-RH"], cout: "0 appel API — lit le dépôt", tokensEstimes: "faible" },
  { nom: "Pack Découpe", description: "Pèse chaque tâche du suivi sur des faits lisibles dans sa ligne (longueur, livrables annoncés, énumération, fichiers et outils nommés), rend une vignette par tâche lourde avec le découpage que la ligne énumère déjà, signale les lignes longues qui ne diraient plus rien d'elles-mêmes si elles étaient tronquées, et répartit les tâches par origine — utilisateur, outil, agent, ou silencieuse.", demande: "Savoir si une tâche est trop grosse et doit être découpée en plusieurs avant d'être lancée, et d'où vient le travail en file", outils: ["check-tasks-details"], cout: "0 appel API — lit docs/suivi/", tokensEstimes: "faible — lecture du registre déjà sur le disque" },
  { nom: "Pack Heure", description: "Rend l'heure et la date au référentiel France en disant toujours D'OÙ elles viennent (réseau ou horloge locale), donne l'horodatage UTC exact qu'attend docs/suivi/, et garde la mémoire des estimations de durée et de consommation pour ajuster les suivantes.", demande: "Savoir l'heure réelle avant de dater quoi que ce soit, ou estimer la durée et le coût d'un travail à venir", outils: ["AGENT-DU-TEMPS"], cout: "0 appel API — une requête HTTP de temps, gratuite, et l'horloge système en repli", tokensEstimes: "négligeable — quelques lignes" },
  { nom: "Pack Trajectoire", description: "Juge si chaque outil PROGRESSE vraiment (relit-il sa mémoire, se trompe-t-il moins) ou s'il archive sans rien apprendre — et me juge, moi, sur les diagnostics que j'ai laissés sans suite.", demande: "Apprentissage réel de l'outillage, et mon apport à cet apprentissage", outils: ["TOOL-LEARNING"], cout: "0 appel API", tokensEstimes: "nul — lecture de registres déjà sur le disque" },
  { nom: "Pack Accueil", description: "Dit, registre par registre, ce qui reste à renseigner pour faire entrer un nouvel outil dans l'Agence — lu dans les fichiers réels, jamais une liste recopiée.", demande: "Intégrer un nouvel outil sans découvrir les oublis un test après l'autre", outils: ["integration-outil"], cout: "0 appel API", tokensEstimes: "nul — lecture de fichiers déjà sur le disque" },
  { nom: "Pack Empreinte", description: "Note la fidélité d'un texte déjà écrit (transcript, extrait) à l'esprit rugueux des personnages.", demande: "Fidélité de l'esprit des personnages (Article 0)", outils: ["EL-PROFESSOR"], cout: "0 appel API — relit un texte déjà produit", tokensEstimes: "variable — proportionnel à la taille du texte relu" },
  { nom: "Pack Provocation", description: "Envoie 16 provocations réelles au modèle Gemini et affiche les réponses de Lia/Noé pour lecture humaine.", demande: "Diagnostic direct du ton face à une provocation réelle", outils: ["check-spirit.mjs"], cout: "réel — 16 vrais appels Gemini, consulter Smart Conso API avant", tokensEstimes: "modéré — lecture des 16 réponses produites" },
  { nom: "Pack Vitrine", description: "Capture 2 écrans du rendu 3D réel (session déjà en cours) et les note contre la charte graphique.", demande: "Qualité visuelle du rendu", outils: ["THE-SCREENER"], cout: "0 appel API — capture Playwright locale", tokensEstimes: "faible — lecture vision de 2 images" },
  { nom: "Pack Blindage", description: "Mesure la couverture de test réelle par fonction (V8) sur les fichiers du dépôt.", demande: "Robustesse et couverture de test réelle", outils: ["AXA-CHECK"], cout: "0 appel API", tokensEstimes: "nul — 0 token, 0 appel API" },
  { nom: "Pack Chasse", description: "Orchestre ARGUS/HARMONIA/check-house.mjs/le tableau de bord en version légère gratuite ; version complète ajoute une double perspective par agent séparé.", demande: "Chasse aux bugs cachés avant une étape importante", outils: ["HYPER-SCAN-CHECKPOINT"], cout: "version légère : 0 appel API ; version complète : appels Gemini réels — consulter Smart Conso API avant", tokensEstimes: "version légère : faible ; version complète : ~37k tokens fixes (agent séparé) — consulter SMART-CONSO-TOKEN avant" },
  { nom: "Pack Verdict", description: "Un agent séparé, sans mémoire du projet, incarne un professionnel senior et rend un verdict opiniâtre sur le code et le produit.", demande: "Audit global indépendant (code + produit + reprise potentielle)", outils: ["THE-FINAL-JUDGE"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes par appel (quasi le même quel que soit le palier d'intensité) — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { nom: "Pack Bouclier", description: "Même agent séparé que Pack Verdict, mandat explicitement étendu aux risques de sécurité/production.", demande: "Sécurité et préparation à la mise en production", outils: ["THE-FINAL-JUDGE (mandat sécurité inclus)"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes — consulter Smart Conso API ET SMART-CONSO-TOKEN avant" },
  { nom: "Pack Mémoire Longue", description: "Un agent séparé archiviste relit la conversation entière contre docs/suivi/ pour trouver ce qui n'a jamais été tracé.", demande: "Relire l'historique de la conversation pour vérifier qu'aucune idée, leçon ou tâche n'a été oubliée dans le suivi (relecture lourde, agent séparé)", outils: ["THE-DEEP-READER"], cout: "0 appel API — agent séparé, jamais de Gemini", tokensEstimes: "~37k tokens fixes minimum + volume réel de conversation à relire, jamais un chiffre fixe comme Pack Verdict — consulter Smart Conso API ET SMART-CONSO-TOKEN avant, préférer d'abord la version légère gratuite (docs/systeme-de-suivi.md)" },
  { nom: "Pack Dépannage", description: "Sonde plusieurs modèles/clés Gemini avec un appel minimal réel pour identifier ce qui est encore disponible.", demande: "Diagnostiquer un blocage/quota Gemini épuisé (429/503 répétés)", outils: ["Smart Breaker (check-gemini-quota.mjs)"], cout: "réel — quelques appels Gemini minimaux de diagnostic", tokensEstimes: "négligeable" },
  { nom: "Pack Sobriété", description: "Donne un avis fiabilisé avant une action coûteuse en tokens, combinant schémas connus et historique observé.", demande: "Réguler ma propre consommation de tokens avant une action coûteuse", outils: ["SMART-CONSO-TOKEN"], cout: "0 appel API", tokensEstimes: "nul — 0 token, 0 appel API" },
  { nom: "Pack Ronde", description: "Ouvre la fenêtre à cocher de la Ronde périodique (profil, référentiels, KPI, signaux ALWAYS-NEW-CODE/CLEAN-DIRTY-OLD, scans Smart Conso, catalogue, photo de la dream team, THE-SCREENER).", demande: "Lancer la ronde périodique des tâches gratuites mal automatisées", outils: ["CIRCLE-TASKS"], cout: "0 appel API — sauf si THE-FINAL-JUDGE (⚠️🔴) est explicitement coché", tokensEstimes: "faible à modéré selon la sélection — ~37k tokens fixes seulement si THE-FINAL-JUDGE est explicitement coché" },
  { nom: "Pack Boussole", description: "Génère l'état des lieux des tâches en cours (zoom + forme liste/arborescence) en rapport HTML, strictement en lecture seule sur docs/suivi/.", demande: "État des lieux des tâches en cours", outils: ["check-tasks-details"], cout: "0 appel API — lecture seule de docs/suivi/", tokensEstimes: "variable — proportionnel à la taille du suivi relu" },
  // CHARTER-SPY N'EXISTE PLUS COMME ENTITÉ SÉPARÉE (corrigé le 2026-09-23). Ses sept fonctions ont
  // migré dans MOÏSE-TABLES-DE-LOI, mais cette ligne continuait d'annoncer « extension de
  // SMART-CONSO-TOKEN » — une offre de service qui désignait un outil dissous, et un slug fantôme
  // « charter-spy » compté comme « jamais sollicité » alors qu'il ne pouvait plus l'être. Le Pack
  // garde son nom et sa promesse, qui restent justes : c'est le PORTEUR qui a changé.
  { nom: "Pack Espion", description: "Classe chaque Article de la charte par sensibilité et importance, et repère une redondance possible entre deux règles.", demande: "Préparer un allègement de la charte en identifiant les vrais candidats", outils: ["MOÏSE-TABLES-DE-LOI"], cout: "0 appel API — relit le document ciblé et le reste du dépôt", tokensEstimes: "faible — un seul fichier local relu par le script, pas par l'agent" },
  { nom: "Pack Registre", description: "Index global des registres du réseau d'outils : décision HTML/texte vérifiée contre le vrai code, âge du dernier rapport, croisement avec le compteur d'usage pour repérer un outil dont les rapports ne sont jamais consultés.", demande: "Vérifier que chaque outil livre ses rapports comme prévu (décision HTML/texte, fraîcheur, usage réel)", outils: ["Doc-Report"], cout: "0 appel API — relit les registres et le code local", tokensEstimes: "faible — sortie compacte, un tableau par famille" },
  { nom: "Pack Régence", description: "Rappelle de consulter docs/philosophie-et-politique.md avant une décision à haut niveau (6 catégories), signale sa fraîcheur, son évolution datée et une tension possible entre deux principes.", demande: "Vérifier qu'une décision de fond respecte la philosophie et la politique du projet", outils: ["THE-KING"], cout: "0 appel API — relit un document local", tokensEstimes: "faible — sortie compacte, un rappel ciblé" },
  { nom: "Pack Secrétariat", description: "Aplatit le dépôt (code seul ou code + documentation) en une édition consolidée, annotée par fraîcheur/couverture, avec table des matières et versionnage — jamais une réécriture réelle.", demande: "Obtenir une version de référence unique et lisible du code (ou code + docs) du projet", outils: ["INES-official"], cout: "0 appel API — relit les fichiers locaux", tokensEstimes: "élevé si le corps complet est relu par l'agent — le corps reste local, jamais committé" },
  { nom: "Pack Rénovation", description: "Repère la zone de code la plus négligée (ALWAYS-NEW-CODE) et la stagnation relative (CLEAN-DIRTY-OLD).", demande: "Dette technique / code qui s'empile plutôt que d'être pensé", outils: ["ALWAYS-NEW-CODE", "CLEAN-DIRTY-OLD"], cout: "0 appel API — raisonnement, pas de Gemini", tokensEstimes: "élevé pour ALWAYS-NEW-CODE (vrai zoom, consulter SMART-CONSO-TOKEN avant) ; nul pour CLEAN-DIRTY-OLD (délègue sans raisonner)" },
  { nom: "Pack Décollage", description: "Avant de lancer une simulation Article 18 : vérifie le quota Gemini réellement disponible (Smart Conso API) et le carnet des correctifs encore en observation à revalider — jamais combinés avant.", demande: "Contrôle pré-simulation complet (quota + correctifs en attente de confirmation)", outils: ["Smart Conso API", "docs/simulations/correctifs-a-revalider.md"], cout: "0 appel API pour le contrôle lui-même — la simulation qui suit, elle, en fera beaucoup", tokensEstimes: "faible — lecture de deux sorties compactes" },
  { nom: "Pack Sentinelle", description: "Relance la suite de tests, ARGUS et HARMONIA sur le code réel du commit qui vient d'être fait.", demande: "Vérification rapide après un changement de code", outils: ["check-house.mjs", "ARGUS (mécanique)", "HARMONIA (mécanique)"], cout: "0 appel API, déjà automatique à chaque commit", tokensEstimes: "nul pour l'agent — tourne dans un processus séparé (post-commit), seul le résultat est lu" },
  { nom: "Pack Éclaireur", description: "Avant de toucher un fichier précis : sa couverture de test réelle (AXA-CHECK), sa stagnation relative (CLEAN-DIRTY-OLD) et sa proximité avec un nœud sensible HARMONIA, en un coup d'œil ciblé — jamais le balayage global de Pack Panorama.", demande: "Contrôle pré-modification d'un fichier précis avant un changement risqué", outils: ["AXA-CHECK", "CLEAN-DIRTY-OLD", "HARMONIA (nœuds sensibles)"], cout: "0 appel API", tokensEstimes: "faible — signal ciblé sur un seul fichier, jamais tout le dépôt" },
  { nom: "Pack Panorama", description: "Synthèse en un seul tableau des 4 outils noyau (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD) + le rythme des deux Smart Conso, sur tout le dépôt.", demande: "Vue d'ensemble croisée et gratuite de tout le réseau d'outils avant une décision de priorisation", outils: ["check-house.mjs", "ARGUS", "HARMONIA", "AXA-CHECK", "CLEAN-DIRTY-OLD", "ALWAYS-NEW-CODE (préparation)", "Smart Conso API", "SMART-CONSO-TOKEN"], cout: "0 appel API", tokensEstimes: "modéré à élevé — sortie complète de la synthèse, plus lourd que les autres lignes (relance check-house.mjs avec instrumentation de couverture V8)" },
  { nom: "Pack Memory-Audit", description: "Vérifie la cohérence mécanique de la mémoire persistée de Lia/Noé (ordre chronologique, remise à zéro suspecte, régression de gravité) sur une partie réelle, et relit au passage le poids moyen réel envoyé à Gemini par tour et par personnage (memento weight).", demande: "Contrôle de la mémoire narrative des personnages après une simulation, ou suspicion d'un bug de sauvegarde de type loveRealized", outils: ["memory-audit"], cout: "0 appel API — mécanique, jamais un second appel Gemini", tokensEstimes: "faible — comparaison de structures de données, jamais une lecture de contenu narratif" },
  { nom: "Pack Découpage", description: "Détecte des points de coupe candidats et un indice de risque lexical dans une fonction géante d'un fichier donné, pour préparer un découpage manuel en sous-fonctions testées à chaque étape (find-deep-booster, anciennement affiché « route-booster » — scripts/route-booster.mjs inchangé).", demande: "Avant/pendant un chantier de découpage d'un fichier fourre-tout (ex. route.ts)", outils: ["find-deep-booster"], cout: "0 appel API — heuristique texte, jamais un vrai parseur", tokensEstimes: "faible à modéré — dépend de la taille du fichier ciblé" },
  { nom: "Pack Boussole", description: "Indexe par concept les fonctions nommées ou les blocs commentés d'un fichier déjà découpé (route.ts une fois découpé, ou check-house.mjs dès aujourd'hui), avec un rattachement indicatif aux thèmes HARMONIA.", demande: "Retrouver rapidement où se trouve une logique précise dans un gros fichier déjà structuré", outils: ["find-booster"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Cerveau de recherche", description: "Rend un jugement unifié — find-booster et/ou find-deep-booster (surnom de route-booster) pour un fichier donné, jamais un choix exclusif — en réutilisant leurs fonctions telles quelles, sans rien recalculer.", demande: "Savoir lequel des deux outils de recherche (ou les deux) utiliser avant de lire un fichier potentiellement volumineux ou complexe", outils: ["find-brain"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Boussole des process", description: "Le tool-brain des PROCESS : à partir d'une description de tâche, indique quel process écrit la gouverne, où il est documenté, qui le surveille, et quelles étapes ont réellement laissé leur trace sur le disque. Distingue toujours une étape non faite d'une étape sans trace vérifiable, et une sonde cassée d'une étape manquante.", demande: "Savoir quel process encadre ce que je m'apprête à faire, et où on en est dedans", outils: ["god-of-all-process"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Discipline d'exécution", description: "Vérifie que les règles de travail ont été TENUES, des deux côtés (agent et utilisateur). Son apport propre : croiser le compteur d'usage des outils avec l'historique git pour savoir si les outils à consulter avant d'agir l'ont vraiment été avant. Ne désigne un manquement que sur une origine déclarée sciemment ; une trace qui ne prouve rien est montrée sans accuser personne.", demande: "Savoir si les règles de travail ont été respectées, et par qui", outils: ["angel-of-ia-process"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Circulation des données", description: "Inventorie tout ce que l'équipe a accumulé (journaux, registres, séries chiffrées), dit qui relit quoi, et repère la donnée qu'on paie à produire sans que rien ne l'exploite. Sert aussi l'agent directement : « briefing <sujet> » liste tout ce que l'équipe sait déjà sur un sujet, avant de repartir de zéro.", demande: "Savoir ce que l'équipe sait déjà sur un sujet, ou repérer une donnée produite que rien n'exploite", outils: ["data-archangel"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Discipline de simulation", description: "Référent du protocole de simulation, consulté AVANT le lancement plutôt qu'après : récite les cinq leçons déjà payées par une simulation entière, vérifie que le scénario couvre les neuf moments exigés et que Smart Conso API a été consultée, bloque un lancement défaillant (passage en force possible avec raison écrite archivée), puis contrôle le journal réel et les cinq étapes d'archivage.", demande: "Lancer une simulation sans refaire une erreur qui a déjà coûté une heure de quota, et vérifier ensuite que rien n'a été sauté", outils: ["process.simulation.guardian"], cout: "0 appel API pour le contrôle lui-même — la simulation qui suit, elle, en fera beaucoup", tokensEstimes: "faible" },
  // LES ONZE MUETS (2026-09-27, tâche #714). Ils ne manquaient pas par négligence : le garde-fou qui
  // veillait sur ce catalogue comparait deux listes ÉCRITES À LA MAIN l'une à l'autre, et rendait
  // « aucun outil muet » pendant que la table sur laquelle il se fondait ignorait 27 des 90 scripts
  // réels. Mesurés cette fois contre le DÉPÔT (findOutilsMuets()), onze outils parfaitement
  // lançables n'avaient jamais eu d'entrée ici — donc invisibles à tool-brain, donc jamais
  // recommandés, donc jamais lancés, et leur zéro d'usage se lisait ensuite comme un verdict sur eux.
  { nom: "Pack Niveau attendu", description: "Calcule, AVANT de vérifier quoi que ce soit, le niveau de vérification que mérite le changement en cours et quelle combinaison d'outils l'atteint — plutôt que de choisir au jugé une fois lancé.", demande: "Savoir jusqu'où pousser la vérification avant de commencer, et avec quels outils", outils: ["CHECK-LEVEL-TARGET"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Fidélité du suivi", description: "Relit chaque fichier de session et signale les clôtures qui ont sauté la déclaration de fidélité, les fichiers annoncés mais absents, et les horodatages datés dans le futur.", demande: "Vérifier que le suivi des tâches dit la vérité — clôtures incomplètes, fichiers fantômes, dates impossibles", outils: ["check-suivi-fidelity"], cout: "0 appel API — lit docs/suivi/", tokensEstimes: "faible" },
  { nom: "Pack Déroulé de Ronde", description: "Vérifie mécaniquement que le processus complet de la Ronde a bien été suivi, et peut la bloquer. Contrôleur de process, jamais un Gardien sacré : il surveille des ÉTAPES, pas la qualité du code.", demande: "Savoir si la Ronde a été menée jusqu'au bout, ou par où elle a été écourtée", outils: ["circle-process-guardian"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Criticité", description: "Sépare la CRITICITÉ d'une tâche (sa gravité intrinsèque) de son RETARD (depuis combien de temps elle attend) — deux axes que l'ancienne échelle mélangeait en un seul rang.", demande: "Savoir ce qui est grave, distinctement de ce qui traîne", outils: ["criticite"], cout: "0 appel API — lit docs/suivi/", tokensEstimes: "faible" },
  { nom: "Pack Régie de simulation", description: "Orchestre les étapes purement MÉCANIQUES du protocole de simulation complète (Article 18) : archivage des fichiers, extraction du résumé compact, rapport KPI. Jamais les deux index de jugement, qui restent la plume de l'agent.", demande: "Ne pas dépendre de ma mémoire pour les étapes sans jugement d'une simulation complète", outils: ["LE-RÉGISSEUR"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Mode de travail", description: "Dit dans quel mode on travaille en ce moment — l'utilisateur est-il là pour répondre, une fenêtre de question est-elle possible — au lieu de le supposer. Déclaré une fois, lu partout.", demande: "Savoir si je peux poser une question bloquante maintenant, ou si l'utilisateur dort", outils: ["modes-de-travail"], cout: "0 appel API", tokensEstimes: "négligeable" },
  { nom: "Pack Points de coupe", description: "Propose mécaniquement des points de coupe candidats dans une fonction géante, par motifs de texte — jamais un parseur, donc jamais une découpe garantie juste.", demande: "Découper une fonction devenue trop grosse sans la lire ligne à ligne", outils: ["route-booster"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Lancement de simulation", description: "LE pilote committé de la simulation intégrale (Article 18, étape 1) — celui qui existe pour de bon, là où le script était autrefois réécrit à la volée puis perdu avec son dossier temporaire.", demande: "Lancer une simulation complète de bout en bout", outils: ["run-simulation"], cout: "réel — c'est la simulation elle-même, consulter Smart Conso API avant (Article 22)", tokensEstimes: "élevé côté agent si le transcript est relu" },
  { nom: "Pack Résumé de journal", description: "Extrait un résumé compact des actions d'un journal de simulation brut (tirages de bonus, changements de pièce, révélation, progression de l'enquête) — ce qui permet d'archiver l'essentiel avant de jeter un journal de plusieurs mégaoctets.", demande: "Garder ce qui compte d'une simulation sans archiver un fichier énorme", outils: ["summarize-simulation-log"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Nuit autonome", description: "Petit orchestrateur du mode nocturne autonome : il tient le déroulé quand l'utilisateur dort ou laisse l'agent travailler seul.", demande: "Travailler seul pendant la nuit sans perdre le fil ni m'arrêter", outils: ["THE-GHOST"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Compteur d'usage", description: "Le cumul de qui a réellement été lancé — la donnée qui permet à CASSANDRA-RH de juger si un outil a toujours sa place. DEUX RÉSERVES, et elles ne se devinent pas : un zéro y mesure un silence, jamais une inactivité prouvée ; et le journal est dans .gitignore, donc il ne couvre PAS le projet depuis son début mais seulement depuis le conteneur en cours — 23 h le 2026-09-30, sur un dépôt de deux semaines. L'horizon réel s'imprime à côté de chaque chiffre (horizonDuJournal).", demande: "Savoir quels outils ne sont jamais sollicités, et depuis quand", outils: ["tool-usage"], cout: "0 appel API", tokensEstimes: "négligeable" },
  { nom: "Pack Cerveau central", description: "Généralise find-brain à tout le catalogue PRESTATIONS : à partir d'une description de tâche et/ou d'un fichier ciblé, indique quelle(s) prestation(s) et quel(s) outil(s) de recherche utiliser, sans rien recalculer soi-même. Délivre aussi le rapport de Ronde (outils jamais sollicités, auto-diagnostic borné à son propre périmètre).", demande: "Savoir quel outil ou quelle combinaison d'outils déjà existante utiliser pour une tâche donnée, sans avoir à y réfléchir soi-même", outils: ["tool-brain"], cout: "0 appel API", tokensEstimes: "faible" },
  { nom: "Pack Le filet lui-même", description: "L'enquête sur le FILET DE SÉCURITÉ et sur tout ce qui l'entoure : combien de temps il coûte à chaque commit, où ce temps part, et ce que ses tests valent réellement (assertions conditionnelles, état partagé entre blocs). Périmètre voulu plus large que « les tests » — la mécanique QUI ENTOURE le filet compte autant que le filet.", demande: "Le filet met trop longtemps, ou je me demande si ses tests prouvent vraiment quelque chose — mesurer sa durée, sa santé, et la qualité de ses assertions", outils: ["ezechiel-les-tests"], cout: "0 appel API — mesure locale, zéro parseur", tokensEstimes: "modéré — la sortie chiffre la durée par zone" },
  { nom: "Pack Page HTML d'un document", description: "Transforme un document Markdown en page HTML autonome et lisible, inscrite à son registre — une page régénérée REMPLACE sa ligne au lieu de l'empiler.", demande: "Rendre un document lisible comme une page web, pour le livrer ou le relire hors de l'éditeur", outils: ["html-report"], cout: "0 appel API — conversion locale", tokensEstimes: "quasi nul pour l'agent : le fichier est écrit sur disque, jamais relu dans le contexte" },
  { nom: "Pack Chasse aux clones", description: "Scanne lib/scripts/app/components (hors components/ui, vendored) à la recherche de blocs dupliqués — v1 littérale (lignes identiques après normalisation d'espaces) ET v2 (blocs structurellement identiques sous renommage bijectif cohérent d'identifiants) — regroupés par cluster et triés par impact réel.", demande: "Trouver un bloc de logique recopié au lieu d'être factorisé, même renommé — duplication réelle dans le code", outils: ["clone-hunter"], cout: "0 appel API — heuristique texte, zéro parseur AST", tokensEstimes: "faible à modéré — sortie compacte des clusters trouvés" },
  { nom: "Pack Même notion, deux écritures", description: "Relève les littéraux d'expression régulière qui se ressemblent à une ou deux modifications près sans être identiques, et les regroupe en FAMILLES classées par nombre de fichiers concernés. La distance se dérive du corpus. Chaque famille sort comme une QUESTION — deux motifs proches peuvent viser deux choses opposées.", demande: "La même notion est-elle testée à plusieurs endroits avec des motifs légèrement différents ? Deux lecteurs du même registre peuvent-ils répondre différemment à la même question ?", outils: ["clone-hunter"], cout: "0 appel API — comparaison de chaînes, zero parseur", tokensEstimes: "faible — des familles, jamais des paires" },
  { nom: "Pack Objectifs", description: "Confronte chaque objectif chiffré du registre (par entité/période) au résultat réel déjà mesuré par tool-usage.mjs, avec un statut atteint/en dessous/dépassé/pas de données. Surnom : R/O-Guardian (2026-09-21).", demande: "Vérifier si un objectif fixé sur un outil ou une entité a été atteint sur sa période", outils: ["objectifs-vs-resultats"], cout: "0 appel API — relit un historique déjà écrit, jamais un second calcul", tokensEstimes: "faible — sortie compacte, une ligne par objectif" },
  { nom: "Pack Diète", description: "Mesure la pertinence réelle de chaque passage de CLAUDE.md (citations effectives ÷ lignes occupées), classe en règle/narration/inventaire, et rédige le texte de remplacement chiffré — jamais une coupe automatique. Repère aussi les consignes qu'un crochet applique déjà tout seul.", demande: "Mesurer et réduire le poids et le coût en tokens de la charte CLAUDE.md, le seul document rechargé à chaque message", outils: ["ecotoken"], cout: "0 appel API — relit la charte et le dépôt local", tokensEstimes: "faible — sortie compacte ; le plan détaillé ne se lit qu'à la demande" },
  // Trou trouvé en UTILISANT tool-brain plutôt qu'en l'auditant (2026-09-25) : il a répondu
  // « aucune correspondance » à « produire le rapport d'une commande-en-masse », alors que
  // l'outil existait depuis la veille. Un outil absent du catalogue est un outil que le cerveau
  // central ne peut pas recommander — donc un outil que je refais à la main sans m'en rendre compte.
  { nom: "Pack Saisine", description: "Reprend une commande-en-masse point par point au gabarit unifié : chaque point porte son sort (RETENU · ÉCARTÉ · À TRANCHER), sa citation exacte, et pour un point retenu la vignette de la VRAIE tâche lue dans le suivi. REFUSE de produire le rapport si un point retenu n'a pas de tâche associée, et affiche une référence morte plutôt que de la laisser passer pour un lien.", demande: "Produire le rapport d'une commande-en-masse, d'une saisine ou d'un gros prompt qui contient plusieurs demandes distinctes, sans qu'aucun point se perde", outils: ["rapport-gros-prompt"], cout: "0 appel API — relit la saisine et le suivi local", tokensEstimes: "faible — un bloc par point" },
  // NOM PROVISOIRE depuis 2026-09-24 — « Pack Baptême » est mon mot, pas le sien, et la règle qu'il
  // vient de poser veut que ce soit lui qui tranche. La marque est cherchée à chaque passage, donc
  // l'oubli est impossible : c'est exactement le mécanisme que porte l'outil que cette ligne présente.
  { nom: "Pack Baptême", description: "Avant un renommage : inventorie toutes les occurrences du nom sur le vrai dépôt et les trie par NATURE — import de code, commande écrite, chemin de registre, mention vivante, et trace historique qui ne se touche jamais. Produit le plan fichier par fichier, signale les noms qui CONTIENNENT le nom visé (le piège qu'un remplacement aveugle ne voit pas), et vérifie après coup qu'aucun reste vivant ne subsiste. Tient aussi le registre de qui a nommé quoi, et alerte sur un nom provisoire qui traîne.", demande: "Renommer un outil, un process, une constante ou un rapport, préparer un renommage et traiter une collision de noms homonymes, sans casser le code ni falsifier l'histoire", outils: ["agent-des-noms"], cout: "0 appel API — un git grep et des motifs, jamais un parseur", tokensEstimes: "faible — le plan est compact ; seule la liste des fichiers de code grandit avec le nom visé" },
  { nom: "Pack Direction RH", description: "Constat chiffré de l'effectif de l'équipe par catégorie, supervision du badge (lit checkAgentOnboarding(), jamais ne le recalcule), tendance KPI lue depuis kpi-historique.csv, outils à retirer/refondre — jamais un jugement automatique, toujours l'utilisateur qui décide.", demande: "Bilan RH de l'équipe de l'Agence Codex, effectif, badges, tendance KPI, outils à reconsidérer", outils: ["CASSANDRA-RH"], cout: "0 appel API — relit ce que le reste du réseau d'outils sait déjà", tokensEstimes: "faible pour le signal léger, modéré pour le bilan HTML complet" },
];

export function formatMenu(prestations = PRESTATIONS) {
  const lines = ["| Si tu veux... | Ça déclenche | Coût |", "|---|---|---|"];
  for (const p of prestations) lines.push(`| ${p.demande} | ${p.outils.join(" + ")} | ${p.cout} |`);
  return lines.join("\n");
}

// Catalogue d'offres nommé, historisé — tâche #154 (2026-09-19, demande explicite : « sur demande,
// le coordinateur peut produire une version à jour du catalogue d'offres [...] il historise chaque
// version du catalogue dans un dossier local avec index »). Exception ÉTROITE et explicite au
// principe général de LE-COORDINATEUR (« jamais de registre dédié », §7ter) : ce catalogue EST un
// artefact versionné dans le temps, contrairement à la synthèse `runNetworkCheck()` elle-même, qui
// reste toujours éphémère/live. Une nouvelle version n'est écrite que si son contenu diffère
// réellement de la dernière déjà archivée (même discipline anti-doublon que `isDuplicateRun()`) —
// jamais une entrée par simple relance sans rien de neuf.
//
// Nom de fichier à la MINUTE, pas au jour (2026-09-21, vrai bug trouvé en conditions réelles : le
// décalage d'horloge du conteneur — déjà documenté ailleurs dans ce projet — a fait tomber deux
// vrais changements de contenu, à quelques minutes d'écart, sur la même date calendaire ; un nom de
// fichier `YYYY-MM-DD.md` a silencieusement écrasé la première version tout en laissant une ligne
// d'index périmée pointer vers un fichier qui ne correspondait plus à ce qu'elle décrivait). Même
// convention que les scans ARGUS (`scan-YYYY-MM-DD-HH-MM.txt`), déjà éprouvée dans ce projet pour
// exactement cette raison.
export const CATALOGUE_DIR = join(ROOT, "docs/le-coordinateur-catalogue");
export const CATALOGUE_INDEX_PATH = join(CATALOGUE_DIR, "index.md");
const CATALOGUE_INDEX_HEADER = "# Catalogue d'offres nommé — historique\n\n*(Cf. docs/regles-de-travail.md §7ter et la tâche #154. Chaque ligne est une version datée (à la minute, cf. commentaire ci-dessus) du catalogue de `PRESTATIONS`, écrite uniquement quand son contenu a réellement changé — jamais une entrée par simple relance sans rien de neuf. Exception étroite au principe général de LE-COORDINATEUR — \"jamais de registre dédié\" — qui reste vrai pour sa synthèse `runNetworkCheck()`, toujours éphémère.)*\n\n| Date | Nombre d'offres | Fichier |\n|---|---|---|\n";

export function renderNamedCatalog(prestations = PRESTATIONS) {
  const lines = [
    "| Nom | Description | Si tu veux... | Ça déclenche | Coût API | Coût tokens |",
    "|---|---|---|---|---|---|",
  ];
  for (const p of prestations) {
    lines.push(
      `| ${p.nom ?? "—"} | ${p.description ?? "—"} | ${p.demande} | ${p.outils.join(" + ")} | ${p.cout} | ${p.tokensEstimes ?? "—"} |`
    );
  }
  return lines.join("\n");
}

export function recordCatalog(prestations = PRESTATIONS, now = new Date(), fsImpl = { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync }) {
  const dateLabel = now.toISOString().slice(0, 10);
  const timestampLabel = now.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const table = renderNamedCatalog(prestations);
  let latestFile;
  if (fsImpl.existsSync(CATALOGUE_DIR)) {
    const files = fsImpl.readdirSync(CATALOGUE_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.md$/.test(f)).sort();
    latestFile = files[files.length - 1];
  }
  if (latestFile) {
    const previousContent = fsImpl.readFileSync(join(CATALOGUE_DIR, latestFile), "utf8");
    if (previousContent.includes(table)) {
      return { written: false, message: `Catalogue déjà à jour depuis ${latestFile.replace(".md", "")} — aucun changement réel de PRESTATIONS depuis.` };
    }
  }
  if (!fsImpl.existsSync(CATALOGUE_DIR)) fsImpl.mkdirSync(CATALOGUE_DIR, { recursive: true });
  const fileName = `${timestampLabel}.md`;
  fsImpl.writeFileSync(join(CATALOGUE_DIR, fileName), `# Catalogue d'offres nommé — ${dateLabel}\n\n${table}\n`);
  const indexExisting = fsImpl.existsSync(CATALOGUE_INDEX_PATH) ? fsImpl.readFileSync(CATALOGUE_INDEX_PATH, "utf8") : CATALOGUE_INDEX_HEADER;
  fsImpl.writeFileSync(CATALOGUE_INDEX_PATH, indexExisting + `| ${dateLabel} | ${prestations.length} | [${fileName}](${fileName}) |\n`);
  return { written: true, fileName, dateLabel };
}

// Livraison du catalogue à chaque Ronde CIRCLE-TASKS (2026-09-21, demande explicite de l'utilisateur :
// « à chaque ronde, en même temps que le rapport de ronde, le coordinateur révèle la version à jour
// du catalogue d'outils : en format html si c'est un nouveau catalogue jamais produit, en txt si
// c'est un catalogue qui n'a pas changé »). Réutilise DIRECTEMENT le booléen `written` de
// recordCatalog() — le signal exact de nouveauté réelle, déjà anti-doublon — jamais une seconde
// détection de changement divergente construite à côté.
export function buildCatalogDelivery(recordResult, prestations = PRESTATIONS) {
  if (recordResult.written) {
    return {
      format: "html",
      content: renderHtmlReport({
        title: "LE-COORDINATEUR — catalogue d'offres nommé",
        subtitle: `Nouvelle version réelle du catalogue (${recordResult.dateLabel}) — archivée dans docs/le-coordinateur-catalogue/${recordResult.fileName}.`,
        dateLabel: recordResult.dateLabel,
        blocks: [{ type: "table", headers: ["Nom", "Description", "Si tu veux...", "Ça déclenche", "Coût API", "Coût tokens"], rows: prestations.map((p) => [p.nom ?? "—", p.description ?? "—", p.demande, p.outils.join(" + "), p.cout, p.tokensEstimes ?? "—"]) }],
        footer: "Catalogue régénéré à chaque Ronde CIRCLE-TASKS — HTML seulement quand son contenu a réellement changé, texte simple sinon.",
      }),
    };
  }
  return { format: "text", content: `${recordResult.message}\n\n${renderNamedCatalog(prestations)}` };
}

// GARDE-FOU DE FRAÎCHEUR DU CATALOGUE (2026-09-20, demande explicite de l'utilisateur : « il doit y
// avoir un test dédié pour être sûr que le catalogue est bien mis à jour [...] quand un nouvel outil
// est créé, il comprend de façon autonome quelles nouvelles prestations peuvent être proposées »).
// Honnêteté de conception, même principe que ARGUS/HARMONIA/EL-PROFESSOR/AXA-CHECK : aucun script ne
// peut créativement INVENTER une nouvelle combinaison d'outils — ça reste un vrai jugement (Article
// 19). Ce que ce garde-fou PEUT garantir mécaniquement : qu'aucun outil coûteux ou occasionnel de la
// carte de référence (docs/regles-de-travail.md §7ter) ne reste durablement absent du menu — un
// signal sur l'ABSENCE, jamais une proposition fabriquée à sa place (corollaire Article 17).
//
// "Coûteux ou occasionnel" est lu directement dans la carte elle-même (colonnes Coût/Déclenchement),
// jamais une liste séparée d'exclusions à maintenir à la main : un outil gratuit et "toujours déployé"
// (ARGUS, HARMONIA, AXA-CHECK, CLEAN-DIRTY-OLD, check-house.mjs) ou un outil de régulation interne à
// l'agent (Smart Conso API, CHECK-LEVEL-TARGET, LE-COORDINATEUR lui-même) n'a naturellement aucune
// des deux marques ("réel"/"sur demande") et n'a donc pas besoin d'apparaître comme une "prestation"
// commandable.
// Colonnes lues par NOM sur la ligne d'en-tête, jamais par position fixe (2026-09-20, bug réel
// trouvé et corrigé le jour même : l'ajout d'une colonne "Statut" dans la carte des outils avait
// décalé "Coût"/"Déclenchement" d'un cran, et l'ancienne lecture positionnelle
// (`[tool, , cout, declenchement]`) aurait silencieusement lu les mauvaises colonnes sans jamais
// planter — exactement le genre de dépendance fragile qu'un futur ajout de colonne recasserait à
// nouveau si elle restait positionnelle).
// `description` (2026-09-21, demande explicite de l'utilisateur : « j'ai besoin d'une courte
// description [...] à chaque fois » dans le gabarit de certification) — extraite par NOM de la
// colonne "Ce qu'il détecte/régule" déjà présente dans la table maîtresse, jamais un second texte
// hand-maintained ailleurs qui pourrait diverger. `undefined` pour une table de test qui n'a pas
// cette colonne (jamais un texte fabriqué) — même discipline que statutIdx ci-dessous.
// CHEMIN_TABLE_MAITRESSE / lireTableMaitresse() (2026-09-25) — ajoutés après un VRAI passage de
// Ronde, jamais sur une intuition : l'item `organigramme-signal` dit « appeler buildOrganigramme() »
// et cet appel-là plantait (`Cannot read properties of undefined`), comme ceux de
// findScriptsMissingFromAgentFiles() et findToolsMissingFromMenu() sans argument. La consigne écrite
// décrivait donc un geste impossible, et personne ne le savait parce que les seuls appelants réels
// passaient déjà la table. Deux corrections distinctes, et les confondre aurait été pire que le bug :
//   · l'entrée MANQUANTE se refuse par une erreur qui la NOMME — jamais par un `[]`, qui se lirait
//     « aucun outil dans l'équipe » exactement comme un dépôt réellement vide (c'est ainsi que
//     l'effectif est déjà tombé à zéro une fois, cf. le commentaire de l'en-tête juste en dessous) ;
//   · l'entrée NON FOURNIE se lit toute seule sur le dépôt, pour que le geste documenté marche.
export const CHEMIN_TABLE_MAITRESSE = "docs/regles-de-travail.md";

export function lireTableMaitresse({ root = ROOT, readFile = readFileSync, exists = existsSync } = {}) {
  const chemin = join(root, CHEMIN_TABLE_MAITRESSE);
  return exists(chemin) ? readFile(chemin, "utf8") : "";
}

export function parseToolsTable(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError(
      `parseToolsTable : aucune table maîtresse reçue (attendu le texte de ${CHEMIN_TABLE_MAITRESSE}). `
      + "Passer son contenu, ou appeler lireTableMaitresse() — jamais laisser un zéro tenir lieu de réponse.",
    );
  }
  const lines = markdown.split("\n").filter((l) => l.trim().startsWith("|"));
  if (!lines.length) return [];
  // La table maîtresse se RECONNAÎT à ses colonnes, elle n'est jamais « le premier tableau du
  // document » (corrigé le 2026-09-22, régression réelle provoquée le jour même : ajouter une
  // section avec un tableau de six lignes AVANT §7ter dans docs/regles-de-travail.md faisait lire
  // cet autre tableau comme en-tête, donc renvoyer une liste vide — effectif de l'équipe à zéro,
  // tous les badges perdus d'un coup, sur un document de 56 000 tokens qui contient plusieurs
  // tableaux légitimes. La même hypothèse implicite aurait cassé au prochain tableau ajouté, par
  // quiconque. On cherche donc la ligne d'en-tête qui porte réellement les colonnes attendues.
  const enTete = lines.findIndex((l) => {
    const cells = l.split("|").slice(1, -1).map((c) => c.trim());
    return cells.includes("Coût") && cells.includes("Déclenchement");
  });
  if (enTete === -1) return [];
  const headerCells = lines[enTete].split("|").slice(1, -1).map((c) => c.trim());
  const coutIdx = headerCells.indexOf("Coût");
  const declenchementIdx = headerCells.indexOf("Déclenchement");
  const statutIdx = headerCells.indexOf("Statut");
  const descriptionIdx = headerCells.indexOf("Ce qu'il détecte/régule");
  const rows = [];
  for (const line of lines.slice(enTete + 1)) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length <= Math.max(coutIdx, declenchementIdx)) continue;
    const tool = cells[0];
    if (!tool || tool === "Outil" || /^-+$/.test(tool)) continue;
    const statut = statutIdx !== -1 ? cells[statutIdx] : null;
    const description = descriptionIdx !== -1 ? cells[descriptionIdx] : undefined;
    rows.push({ tool: tool.replace(/`/g, ""), cout: cells[coutIdx], declenchement: cells[declenchementIdx], statut, description });
  }
  return rows;
}

// toolCompanions() (2026-09-21, même demande : « savoir aussi avec quels outils cet outil est
// susceptible de se plugger ») — jamais une nouvelle donnée hand-maintained : dérive la réponse du
// catalogue PRESTATIONS déjà existant, en listant les autres outils qui apparaissent dans au moins
// une même prestation que `agentName`. Un outil absent de toute prestation combinée (aucune entrée
// PRESTATIONS ne le cite aux côtés d'un autre) rapporte honnêtement une liste vide, jamais une
// combinaison inventée.
export function toolCompanions(agentName, prestations = PRESTATIONS) {
  const nameLower = agentName.toLowerCase();
  const companions = new Set();
  for (const p of prestations) {
    const selfIdx = p.outils.findIndex((o) => o.toLowerCase().includes(nameLower));
    if (selfIdx === -1) continue;
    for (let i = 0; i < p.outils.length; i++) {
      if (i !== selfIdx) companions.add(p.outils[i]);
    }
  }
  return [...companions];
}

// LA NÉGATION SE LIT, SINON ELLE SE RETOURNE (2026-09-25). Une ligne qui dit « JAMAIS un item de
// Ronde » contient les mots « item de Ronde » : un motif qui les cherche sans regarder ce qui les
// précède conclut l'exact contraire de ce que la phrase affirme. Vérifié : SAFE-EXPORT et
// integration-outil déclarent tous deux « jamais un item de Ronde », et mon premier motif les
// rangeait parmi les périodiques. Deux faux positifs sur six — la moitié de ce que je m'apprêtais
// à corriger n'avait rien à corriger (leçon L4).
export const MOTIF_NEGATION = /\b(jamais|ni|aucun|sans)\b[^.;·]{0,40}$/i;

export function affirmeVraiment(texte = "", motif) {
  return String(texte).split(/[.;·]/).some((bout) => motif.test(bout) && !MOTIF_NEGATION.test(bout.slice(0, bout.search(motif) + 1)));
}

// EST-CE UN OUTIL PÉRIODIQUE ? Question posée à part, parce que sa réponse a changé de conséquence :
// jusqu'au 2026-09-25 un périodique restait HORS du menu (il tourne tout seul, donc on ne le lance
// pas), et l'utilisateur a tranché l'inverse — « les faire entrer au catalogue », avec la mention
// qu'il tourne déjà seul à la Ronde.
//
// POURQUOI IL A TRANCHÉ AINSI, et le cas qui l'a montré : tool-brain est le SEUL point d'entrée que
// l'Article 31 autorise pour choisir un outil. Interrogé le 2026-09-25 sur « mesurer si les outils
// apprennent », il n'a pas su recommander TOOL-LEARNING — l'outil dont c'est littéralement le
// métier — parce qu'un périodique n'entrait dans aucune prestation. Un outil que le seul point
// d'entrée obligatoire ne peut jamais nommer est inatteignable pour une question posée hors cycle,
// même s'il tourne parfaitement à son rythme.
export function estPeriodique(row) {
  return affirmeVraiment(row?.declenchement ?? "", /périodique|item de Ronde/i);
}

export function isMenuWorthy(row) {
  return /réel/i.test(row.cout)
    || /sur demande|à la main|à la demande/i.test(row.declenchement)
    // Une ligne qui annonce une COMMANDE se lance à la demande, quels que soient les mots employés :
    // AGENT DES NOMS déclare « deux commandes : `renommage <ancien> <nouveau>` … » et n'était retenu
    // par aucun des motifs ci-dessus. La forme dit ce que la formulation ne disait pas.
    || /\bcommandes?\b|`[a-z-]+ <|--confirm/i.test(row.declenchement ?? "")
    || estPeriodique(row);
}

// suggestPrestationsForTask() (2026-09-20, demande explicite de l'utilisateur : « check-tasks-details
// travaille en étroite collaboration avec le coordinateur : pour chaque tâche à accomplir, il
// consulte le coordinateur qui lui dit quelles prestations permettent de remplir la tâche »).
// Jusqu'ici, PRESTATIONS n'était qu'un menu pour un LECTEUR humain/agent — cette fonction transforme
// LE-COORDINATEUR en un vrai service qu'un AUTRE SCRIPT peut appeler directement (accès "privilégié",
// même doctrine que le reste de ce fichier : importer une fonction pure plutôt que reparser une
// sortie texte). Un simple chevauchement de mots-clés entre le libellé d'une tâche et le champ
// `demande` de chaque prestation — JAMAIS une intelligence qui devine une intention : un
// rapprochement mécanique, à vérifier toujours par une vraie lecture, même honnêteté de conception
// que ARGUS/ALWAYS-NEW-CODE (un signal "correspondance possible", jamais une certitude). Documenté
// comme principe général (pas seulement pour check-tasks-details) dans docs/regles-de-travail.md
// §7ter — n'importe quel outil du paysage peut importer et appeler cette fonction.
const STOPWORDS_FR = new Set([
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "à", "au", "aux", "pour", "sur",
  "dans", "en", "avec", "sans", "que", "qui", "ne", "pas", "est", "être", "ce", "cette", "son", "sa",
  "ses", "tout", "toute", "tous", "toutes", "plus", "déjà", "jamais", "cet", "cette",
  // « non » a rejoint la liste le 2026-09-27 (tâche #1034) en MESURANT, pas en supposant : c'est un
  // mot purement grammatical qui se trouve n'employé que par une seule offre du catalogue, donc le
  // rapprochement par mot rare ci-dessous le prenait pour un signal fort. Un mot vide qui passe
  // pour rare est exactement le faux positif qui fait cesser de lire un point d'entrée (leçon L4).
  "non",
]);

// Exportée (2026-09-20) pour que check-tasks-details.mjs réutilise EXACTEMENT le même tokenizer
// pour corroborer une tâche avec les registres ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD — jamais un
// second jeu de mots-vides réinventé (anti-duplication, docs/regles-de-travail.md §7ter).
export function significantWords(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS_FR.has(w));
}

// LA RACINE D'UN MOT (2026-09-25, tâche #776) — et le défaut qu'elle ferme a été trouvé en se
// SERVANT de l'outil, ce qui est exactement ce que l'Article 31 promet. En demandant à tool-brain
// « deux constantes homonymes DOMAINES, mesurer le risque et préparer un renommage », il n'a PAS
// proposé l'AGENT DES NOMS, dont l'offre dit pourtant « RENOMMER un outil [...] sans casser le code
// ni falsifier l'histoire ». La cause est bête et générale : « renommage » et « Renommer » sont deux
// chaînes différentes, et le rapprochement se faisait caractère pour caractère.
//
// LE COÛT DE CE DÉFAUT EST EXACTEMENT CELUI QUE LE PROJET REDOUTE : l'agent consulte le point
// d'entrée, n'obtient rien, et fait à la main un travail qu'un outil savait faire. « Aucune
// correspondance » se lit comme « aucun outil ne sait faire ça », et les deux sont indiscernables.
//
// LA RACINE EST VOLONTAIREMENT COURTE ET BÊTE, jamais un vrai algorithme de radicalisation : on
// retire les terminaisons françaises les plus fréquentes, et rien d'autre. Un stemmer agressif
// rapprocherait des mots sans rapport, et un faux positif sur un point d'entrée obligatoire coûte
// plus cher que le silence qu'il remplace. Les mots courts (5 lettres ou moins) ne sont jamais
// tronqués, pour la même raison. Le seuil de DEUX mots partagés reste inchangé.
// Chaque terminaison porte la LONGUEUR MINIMALE du reste, parce qu'une seule valeur pour toutes se
// trompe forcément dans un sens ou dans l'autre. Exemple réel : « renommage » doit donner
// « renomm » (6 lettres restantes, on coupe), mais « message » ne doit surtout pas donner « mess »
// (4 lettres, on ne coupe pas) — même terminaison, deux verdicts opposés, et seule la longueur du
// reste les sépare. Les terminaisons sont essayées de la plus longue à la plus courte.
const TERMINAISONS_FR = [
  ["issement", 4], ["issant", 4], ["ements", 4], ["ations", 4], ["ement", 4], ["ation", 4],
  ["aient", 4], ["ages", 5], ["age", 5], ["ions", 4], ["ment", 4], ["eurs", 4], ["eur", 4],
  ["ant", 4], ["ent", 4], ["ees", 4], ["ee", 4], ["es", 4], ["er", 4], ["ir", 4],
  ["e", 4], ["s", 4],
  // « re » a été retiré après un vrai essai : il donnait « mesure » → « mesu » pendant que
  // « mesurer » → « mesur », donc le mot ne retrouvait plus sa propre conjugaison. Une terminaison
  // qui SÉPARE deux formes du même mot fait exactement l'inverse de ce qu'on lui demande.
];
export function racineDuMot(mot) {
  const m = String(mot ?? "");
  if (m.length <= 5) return m;
  for (const [t, minReste] of TERMINAISONS_FR) {
    if (m.endsWith(t) && m.length - t.length >= minReste) return m.slice(0, m.length - t.length);
  }
  return m;
}

export function racinesSignificatives(text) {
  return significantWords(text).map(racineDuMot);
}

// Seuil de 2 mots-clés partagés (pas 1) — un seul mot commun (souvent un mot très général du
// domaine, ex. "tâche", "outil") produirait trop de faux positifs pour rester un signal honnête.
// badgeCheck (2026-09-20, demande explicite de l'utilisateur : « si un membre de l'équipe est
// sollicité alors qu'il n'a pas de badge, une alerte doit nous être remontée »). Portée calibrée
// explicitement avec l'utilisateur : PAS un nouveau passage obligé pour tout appel (aucun n'existe
// aujourd'hui, ça resterait un chantier lourd hors de propos) — seulement le point de passage déjà
// construit, celui par lequel un autre outil demande "quel membre utiliser pour cette tâche".
// `onboardingContext` est optionnel et rétrocompatible : sans lui, `suggestPrestationsForTask()` se
// comporte exactement comme avant (aucun appelant existant ne casse). Seules les lignes de statut
// "Agent" peuvent porter un badge (cf. docs/regles-de-travail.md, section badge) — un outil
// Utilitaire nommé ou Infrastructure référencé dans `outils` ne déclenche jamais cette vérification.
// LE MÊME TRAVAIL REFAIT SEPT MILLE FOIS (2026-09-28, tâche #1010). Mesuré avant de toucher quoi que
// ce soit, parce qu'une cause supposée n'est pas une cause (Article 19) : l'état des tâches mettait
// QUATRE MINUTES, et un seul appel à `suggestPrestationsForTask()` coûtait **2 272 ms avec le
// contexte de badge contre 2 ms sans**. Le reste du rapport est négligeable à côté — lire les 985
// lignes du suivi prend 22 ms.
//
// LA CAUSE, une fois mesurée, est bête : cette fonction est appelée pour CHAQUE prestation du
// catalogue (70) sur CHAQUE tâche ouverte (89), soit plus de six mille fois — et chaque appel
// reparse la table des outils puis relance `checkAgentOnboarding()`, qui relit le dépôt. Le même
// contexte, les mêmes outils, le même verdict, recalculés du début à chaque fois.
//
// POURQUOI UNE MÉMOÏSATION ET PAS UNE RÉÉCRITURE : le verdict est une fonction PURE du couple
// (contexte, outil). Rien à repenser, rien à déplacer — seulement à ne pas refaire. Le cache est
// une `WeakMap` sur l'OBJET contexte : un contexte reconstruit est une clé neuve, donc le cache ne
// peut pas servir une réponse périmée, et il disparaît tout seul quand le contexte n'est plus
// référencé. Un cache qu'il faudrait penser à vider serait un bug en attente.
//
// CE QUE ÇA NE CHANGE PAS, et c'est la seule chose qui compte : la réponse. Le filet compare la
// sortie mémoïsée à la sortie directe sur le vrai catalogue.
const cacheBadgeParContexte = new WeakMap();

function memoireDuContexte(ctx) {
  let m = cacheBadgeParContexte.get(ctx);
  if (!m) { m = { rows: parseToolsTable(ctx.toolsTableMarkdown), verdicts: new Map() }; cacheBadgeParContexte.set(ctx, m); }
  return m;
}

function badgeWarningsForOutils(outils, onboardingContext) {
  if (!onboardingContext?.toolsTableMarkdown) return [];
  const { rows, verdicts } = memoireDuContexte(onboardingContext);
  const warnings = [];
  for (const outil of outils) {
    const primaryName = primaryToolName(outil);
    const row = rows.find((r) => r.tool.toLowerCase().includes(primaryName.toLowerCase()) || primaryName.toLowerCase().includes(r.tool.toLowerCase()));
    if (!row || !CERTIFIABLE_STATUTS.includes(row.statut)) continue;
    if (!verdicts.has(row.tool)) {
      // LE NOM PROPRE, JAMAIS LA CELLULE BRUTE (2026-09-28, tâche #1077). Le commentaire
      // d'integrationAudit() affirmait depuis le 2026-09-21 que « le même découpage est déjà établi
      // ailleurs dans ce fichier (badgeWarningsForOutils(), findToolsMissingFromMenu()) » — ici il
      // ne l'était PAS. Le correctif de l'époque a été appliqué à deux appelants sur trois, et
      // l'écrit a certifié les trois. `row.tool` vaut « SAFE-EXPORT (`scripts/safe-export.mjs`) » :
      // slugifié entier, il donne `safe-export-scripts-safe-export-mjs`, un chemin qui n'existera
      // jamais, donc CINQ manques fabriqués pour un Agent parfaitement complet. `agentOverrides`
      // est indexé par nom propre lui aussi — le lire avec la cellule brute ratait l'override.
      const primaire = primaryToolName(row.tool);
      const overrides = onboardingContext.agentOverrides?.[primaire] ?? {};
      verdicts.set(row.tool, checkAgentOnboarding(primaire, { ...onboardingContext, ownKnowledge: row.statut !== CLASSIQUE_STATUT, ...overrides }));
    }
    const result = verdicts.get(row.tool);
    if (!result.complet) warnings.push(`${row.tool} n'a pas son badge (${result.gaps.join(" ; ")})`);
  }
  return warnings;
}


// ————————————————————————————————————————————————————————————————————————
// « EST-CE QUE ÇA EXISTE DÉJÀ ? » (2026-09-26, tâche #746)
// ————————————————————————————————————————————————————————————————————————
//
// SA DEMANDE, DANS SES MOTS : « l'idee que le coordinateur puisse dire au codeur (moi) si une
// fonction existe deja dans le code. du genre le codeur veut creer un outil, mais le coordinateur
// verifie si la fonction n'existe pas deja ».
//
// LE BESOIN EST RÉEL ET DÉJÀ PAYÉ PLUSIEURS FOIS : ABRAHAM-LES-REFERENCES est né exactement de ça —
// trente fonctions génériques enfermées dans l'agent d'un seul document, faute d'avoir cherché si
// elles existaient ailleurs.
//
// CE QUI EXISTAIT ET NE SUFFISAIT PAS, et c'est une question de MOMENT :
//   · `suggestPrestationsForTask()` répond « quel OUTIL utiliser », jamais « est-ce que cette
//     FONCTION existe déjà » ;
//   · CLONE-HUNTER trouve les doublons APRÈS qu'ils sont écrits.
// Personne ne regardait AVANT. C'est le trou, et c'est le seul.
//
// CE QU'IL NE FAIT PAS, et le dire est la moitié de l'outil : il ne juge PAS qu'une fonction
// trouvée fait vraiment ce qu'on veut. Il rend des CANDIDATES à lire, jamais un verdict « c'est
// déjà fait ». Un outil qui trancherait à ma place ferait réutiliser du code au petit bonheur, ce
// qui coûte plus cher que de le réécrire.
export const MOTIF_FONCTION_EXPORTEE = /^export function ([A-Za-z0-9_$]+)\s*\(/;

// Le nom d'une fonction est écrit en camelCase : `findLignesFantomes` porte trois mots, et les
// séparer est la seule façon de rapprocher « lignes fantômes » de son nom. Fait ici plutôt que par
// le lecteur, sinon chaque appelant réinventerait la règle (Article 24).
export function motsDuNomDeFonction(nom = "") {
  return String(nom).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_$]/g, " ");
}

export function inventaireDesFonctions({ root = ROOT, lireDossier = readdirSync, lireFichier = readFileSync } = {}) {
  let fichiers = [];
  try { fichiers = lireDossier(join(root, "scripts")).filter((f) => String(f).endsWith(".mjs")); }
  catch { return { mesurable: false, pourquoi: "scripts/ illisible — rien n'a pu être inventorié, ce qui n'est jamais la même chose qu'aucune fonction", fonctions: [] }; }
  const fonctions = [];
  for (const f of fichiers) {
    let texte = "";
    try { texte = lireFichier(join(root, "scripts", f), "utf8"); } catch { continue; }
    const lignes = texte.split("\n");
    for (let i = 0; i < lignes.length; i += 1) {
      const m = lignes[i].match(MOTIF_FONCTION_EXPORTEE);
      if (!m) continue;
      // L'EN-TÊTE EST LA MOITIÉ DU SIGNAL, et c'est propre à ce dépôt : ici le POURQUOI vit à côté
      // du QUOI (Article 27), donc le commentaire au-dessus d'une fonction dit souvent mieux que
      // son nom ce qu'elle fait. On remonte le bloc contigu de `//`, et rien d'autre.
      const entete = [];
      for (let j = i - 1; j >= 0 && /^\s*\/\//.test(lignes[j]) && entete.length < 12; j -= 1) entete.unshift(lignes[j].replace(/^\s*\/\/\s?/, ""));
      fonctions.push({ fichier: `scripts/${f}`, nom: m[1], entete: entete.join(" ").slice(0, 400) });
    }
  }
  if (!fonctions.length) return { mesurable: false, pourquoi: "aucune fonction exportée trouvée dans scripts/ — un inventaire vide ne se lit jamais comme « rien n'existe »", fonctions: [] };
  return { mesurable: true, fonctions };
}

// Le SEUIL EST LE MÊME QUE CELUI DU CATALOGUE — deux mots partagés — et pour la même raison : un
// seul mot commun rapproche n'importe quoi de n'importe quoi, et un point d'entrée qui rend du
// bruit cesse d'être consulté (leçon L4). Un mot du NOM pèse double : un nom de fonction est choisi,
// là où un en-tête raconte.
// NATURE DÉCLARÉE (2026-10-01, tâche #1378) : seuil de PRINCIPE — un mot commun rapproche
// n'importe quoi, deux font un signal. Il ne vient d'aucune distribution, donc il ne peut pas
// passer au-dessus d'elle comme #1377 : rien à re-vérifier quand le corpus grandit.
export const SEUIL_CANDIDATE = 2;

// LE POIDS D'UN MOT SE DÉRIVE DU CORPUS, il ne se décrète pas (2026-09-26, tâche #746, et la mesure
// est la raison d'être de cette fonction). Le premier classement mettait en tête, pour « lire
// l'heure », trois fonctions qui partagent seulement le verbe « lire » — et il en rendait 34 pour
// « compter les lignes du suivi ». **Un verbe générique ne dit rien** : « lire », « vérifier »,
// « détecter » sont dans des centaines de fonctions ici, « fantôme » ou « doublon » dans trois.
// Le poids classique log(N/df) le dit tout seul, sans aucune liste de mots vides à tenir à jour
// (Article 24) — et il se recalcule sur le corpus réel à chaque passage, donc il suit le dépôt.
//
// CE QU'IL NE CHANGE PAS : le seuil de DEUX mots partagés. C'est la mesure de la tâche #777 qui le
// dit — sur un petit corpus, un mot rare est souvent un mot vide qui se trouve rare. Ici le corpus
// fait plus de mille fonctions, donc la rareté veut dire quelque chose, mais elle sert à CLASSER,
// jamais à faire entrer une candidate que le seuil refuse.
export function poidsDesMots(fonctions = []) {
  const df = new Map();
  for (const f of fonctions) {
    const vus = new Set([...significantWords(motsDuNomDeFonction(f.nom)), ...significantWords(f.entete)].map(racineDuMot));
    for (const r of vus) df.set(r, (df.get(r) ?? 0) + 1);
  }
  const n = Math.max(1, fonctions.length);
  const poids = (mot) => Math.log(n / ((df.get(racineDuMot(mot)) ?? 0) + 1));
  // LE POIDS MÉDIAN DU CORPUS — dérivé, jamais choisi. Il sert de « valeur d'un mot ordinaire »,
  // et c'est lui qui rend le seuil exprimable autrement qu'en comptant des mots (voir plus bas).
  const tous = [...df.keys()].map(poids).sort((a, b) => a - b);
  poids.median = tous.length ? tous[Math.floor(tous.length / 2)] : 0;
  return poids;
}

export function chercherUneFonctionExistante(intention, inventaire, { max = 6, seuil = SEUIL_CANDIDATE } = {}) {
  if (!inventaire?.mesurable) return { mesurable: false, pourquoi: inventaire?.pourquoi ?? "aucun inventaire fourni", candidates: [] };
  const mots = new Set(significantWords(intention));
  if (!mots.size) return { mesurable: false, pourquoi: "intention vide : sans mots à rapprocher il n'y a rien à chercher, et rendre « aucune candidate » laisserait croire que le dépôt a été fouillé", candidates: [] };
  const racines = new Set([...mots].map(racineDuMot));
  const correspond = (texte) => [...new Set(significantWords(texte).filter((w) => mots.has(w) || racines.has(racineDuMot(w))))];
  const poids = poidsDesMots(inventaire.fonctions);
  const notees = inventaire.fonctions.map((f) => {
    const parNom = correspond(motsDuNomDeFonction(f.nom));
    const parEntete = correspond(f.entete).filter((w) => !parNom.includes(w));
    // Le SEUIL compte des mots ; le SCORE les pèse. Les confondre ferait entrer une candidate sur
    // un seul mot rare, ce que la mesure de #777 a montré dangereux.
    //
    // ET IL COMPTE DES RACINES DISTINCTES, jamais des mots (corrigé par un contre-test, 2026-09-26) :
    // un en-tête reprend presque toujours le mot du nom — « compterLesDoublons » commenté « compte
    // les blocs » — donc compter les deux faisait franchir le seuil de deux à une candidate qui ne
    // partageait en réalité qu'UNE seule idée. Le seuil devenait un seuil à un mot sans que rien ne
    // le dise, ce qui est exactement la dérive que la mesure de #777 interdisait.
    const partages = new Set([...parNom, ...parEntete].map(racineDuMot)).size;
    const score = parNom.reduce((a, w) => a + 2 * poids(w), 0) + parEntete.reduce((a, w) => a + poids(w), 0);
    // Le mot le plus informatif qu'elle partage, NON pondéré par sa position : c'est lui qui décide
    // si une seule racine peut suffire. Comparé au médian du corpus, il se normalise tout seul —
    // sur un petit corpus aucun mot ne se détache, donc aucune candidate ne passe par cette porte,
    // et c'est exactement ce que la mesure de #777 exigeait sur un catalogue de cinquante offres.
    const motLePlusFort = Math.max(0, ...[...parNom, ...parEntete].map((w) => poids(w)));
    return { ...f, parNom, parEntete, partages, motLePlusFort, score };
    // LE SEUIL, EXPRIMÉ EN INFORMATION PLUTÔT QU'EN NOMBRE DE MOTS (2026-09-26, et les deux
    // versions précédentes sont gardées écrites parce que chacune ratait un cas réel).
    //
    //   · compter les MOTS : « compterLesDoublons » commenté « compte les blocs » franchissait le
    //     seuil sur une seule idée répétée — un seuil à un mot qui ne se disait pas.
    //   · compter les RACINES distinctes : corrige ça, et fait tomber la MEILLEURE réponse à
    //     « détecter un doublon de code », `planDoublons()`, qui ne partage qu'une racine — pendant
    //     qu'une fonction sans rapport passait avec le verbe « detect » plus le mot « code ».
    //     **Deux mots génériques valaient mieux qu'un mot précis**, soit l'inverse de ce qu'on veut.
    //
    // La règle retenue demande qu'une candidate apporte AU MOINS AUTANT D'INFORMATION QUE DEUX MOTS
    // ORDINAIRES — le poids médian du corpus, dérivé de lui à chaque passage (Article 24). Un mot
    // très spécifique suffit donc, deux mots creux ne suffisent pas. Ce n'est pas un assouplissement
    // du seuil de #777 : c'est la même exigence, mesurée en information plutôt qu'en occurrences,
    // et sur un corpus de plus de mille fonctions où la rareté veut vraiment dire quelque chose.
  }).filter((f) => f.partages >= seuil || f.motLePlusFort >= seuil * poids.median).sort((a, b) => b.score - a.score || a.nom.localeCompare(b.nom));
  return { mesurable: true, examinees: inventaire.fonctions.length, candidates: notees.slice(0, max), total: notees.length };
}

export function formatFonctionExistanteLines(r, intention = "") {
  if (!r.mesurable) return [`❓ « ça existe déjà ? » : PAS MESURÉ — ${r.pourquoi}`];
  if (!r.candidates.length) {
    return [
      `Aucune fonction existante ne ressemble à « ${intention} » (${r.examinees} fonctions exportées examinées).`,
      "  Ce n'est PAS la preuve qu'il n'y a rien : c'est la preuve que CES MOTS-LÀ ne ressortent pas. Réessayer avec le vocabulaire du sujet avant de conclure qu'on part de zéro.",
    ];
  }
  const L = [`${r.total} fonction(s) existante(s) ressemblent à « ${intention} » (${r.examinees} examinées) — À LIRE avant d'en écrire une de plus :`];
  for (const c of r.candidates) L.push(`  · ${c.nom}() — ${c.fichier}${c.parNom.length ? ` · par son nom : ${c.parNom.join(", ")}` : ""}${c.parEntete.length ? ` · par son en-tête : ${c.parEntete.join(", ")}` : ""}`);
  L.push("  Ce sont des CANDIDATES, jamais un verdict « c'est déjà fait » : aucune mécanique ne peut juger qu'une fonction trouvée fait vraiment ce que tu veux.");
  return L;
}

// DEUX OUTILS QUI RÉPONDENT À LA MÊME DEMANDE (2026-09-26, tâche #979, troisième des trois trous
// qu'il a demandé de traiter : « il y a des outils qui se chevauchent ? »).
//
// CE QUE LA REPRISE DES NOTES A CHANGÉ À MON IDÉE DE DÉPART (Article 30). Je croyais le sujet
// vierge : il ne l'est pas. Le dépôt porte un PRINCIPE anti-duplication écrit noir sur blanc
// (`docs/regles-de-travail.md` §7ter), et il a déjà corrigé deux chevauchements réels — un
// `checkHtmlWiring()` dupliqué entre circle-tasks et doc-report, et un troisième script
// d'orchestration refusé avant d'exister. Les deux fois, c'est un humain qui a remarqué. Ce qui
// manquait n'était donc pas la règle mais le MÉCANISME, c'est-à-dire exactement la forme que
// l'Article 24 interdit : une promesse sans garde-fou.
//
// LE SIGNAL CHOISI, ET POURQUOI C'EST LE BON. Deux outils ne « se chevauchent » pas dans l'absolu :
// ils se chevauchent quand ils répondent à LA MÊME DEMANDE, puisque c'est là que l'agent doit
// choisir — et tool-brain existe précisément pour lui épargner ce choix. On mesure donc le
// recouvrement des champs `demande` du catalogue, AVEC LA MÉCANIQUE DU MATCHEUR LUI-MÊME
// (significantWords + racineDuMot) : une seconde implémentation finirait par diverger de celle qui
// décide vraiment (leçon L29), et le détecteur mesurerait alors autre chose que ce qui se passe.
//
// LE SEUIL NE SE CHOISIT PAS, IL SE LIT DANS LA DISTRIBUTION. Sur les 58 prestations réelles,
// 1 321 paires ne partagent AUCUN mot, 268 en partagent un, 59 deux, 4 trois — et une seule en
// partage SEPT. Le trou entre 3 et 7 est franc, donc le seuil se pose dedans, et la distribution
// est imprimée avec le résultat pour qu'un lecteur puisse vérifier que le trou existe encore.
export const SEUIL_OFFRES_CONCURRENTES = 4;

export function findOffresConcurrentes(prestations = PRESTATIONS, { seuil = SEUIL_OFFRES_CONCURRENTES, lireSource = null } = {}) {
  if (!Array.isArray(prestations) || prestations.length < 2) {
    return { mesurable: false, pourquoi: "moins de deux prestations : il n'y a rien à comparer, et rendre « aucun chevauchement » sur rien serait un satisfecit sur du vide" };
  }
  const racines = (t) => new Set(significantWords(t ?? "").map(racineDuMot));
  const prepare = prestations.map((p) => ({ nom: p.nom, outils: p.outils ?? [], racines: racines(p.demande) }));
  const distribution = {};
  const paires = [];
  for (let i = 0; i < prepare.length; i++) {
    for (let j = i + 1; j < prepare.length; j++) {
      const partages = [...prepare[i].racines].filter((w) => prepare[j].racines.has(w));
      distribution[partages.length] = (distribution[partages.length] ?? 0) + 1;
      if (partages.length < seuil) continue;
      // DEUX OFFRES DU MÊME OUTIL NE SE CONCURRENCENT PAS : un outil a le droit d'être proposé sous
      // deux angles, et le lui reprocher serait reprocher au catalogue de faire son travail.
      if (prepare[i].outils.some((o) => prepare[j].outils.includes(o))) continue;
      paires.push({ a: prepare[i].nom, b: prepare[j].nom, outilsA: prepare[i].outils, outilsB: prepare[j].outils, partages });
    }
  }
  // LE SEUIL PEUT PASSER AU-DESSUS DE TOUT CE QU'ON OBSERVE, ET ALORS « 0 » NE VEUT PLUS RIEN DIRE
  // (2026-10-01, tâche #1377). Ce détecteur a été calibré le 2026-09-26 sur 58 prestations, où une
  // paire partageait SEPT mots quand la suivante en partageait trois : le trou était franc, et le
  // seuil a été posé dedans. Le catalogue en compte 76 aujourd'hui et la distribution PLAFONNE À
  // TROIS. Aucune paire ne peut donc plus atteindre 4, et le rapport annonçait pourtant « Aucune
  // paire d'offres concurrentes » du même ton que lorsqu'il mesurait vraiment.
  //
  // C'EST LE FAUX VERT QUE CE PROJET TRAQUE PARTOUT AILLEURS (leçons L5 et L11) : une absence de
  // CAPACITÉ À VOIR rendue avec les mots d'une absence de PROBLÈME. Le commentaire du seuil le
  // prévoyait déjà — « si le trou se referme, le seuil est à remesurer plutôt qu'à défendre » —
  // mais rien ne le vérifiait, donc personne ne pouvait savoir que le cas était arrivé.
  //
  // ON NE RETOUCHE PAS LE SEUIL EN SILENCE, et c'est volontaire. La distribution d'aujourd'hui
  // (2281 · 470 · 88 · 11) décroît régulièrement : il n'y a PLUS DE TROU où poser un seuil. Le
  // signal a perdu sa puissance, ce n'est pas le réglage qui a glissé — et choisir un nouveau
  // seuil dans une pente continue reviendrait à inventer la frontière qu'on prétend lire.
  const observes = Object.keys(distribution).map(Number).filter((n) => distribution[n] > 0);
  const maxObserve = observes.length ? Math.max(...observes) : 0;
  const seuilAuDessusDeLaDistribution = maxObserve < seuil;
  return {
    mesurable: true, seuil, examinees: prepare.length, distribution,
    maxObserve, seuilAuDessusDeLaDistribution,
    paires: paires.sort((x, y) => y.partages.length - x.partages.length),
    horsPortee: "elle compare les DEMANDES déclarées au catalogue, jamais ce que les outils font vraiment. Deux outils qui font la même chose sous deux libellés sans mot commun lui échappent — c'est CLONE-HUNTER qui répond à cette question-là, sur le code.",
  };
}

// DEUX OUTILS QUI LISENT LES MÊMES SOURCES (2026-10-01, tâche #1382)
//
// IL REMPLACE UN SIGNAL QUI VENAIT DE PERDRE SA PUISSANCE. `findOffresConcurrentes()`, juste
// au-dessus, compare les DEMANDES déclarées au catalogue ; sa limite est écrite depuis sa
// création — « jamais ce que les outils font vraiment » — et le 2026-10-01 son seuil est passé
// au-dessus de sa propre distribution (#1377). La question posée par l'utilisateur le 2026-09-28,
// « Oui, cherche les fusions possibles », n'avait donc plus aucun instrument.
//
// LE SIGNAL, ET POURQUOI IL EST STRUCTUREL PLUTÔT QUE TEXTUEL. Deux outils qui lisent les mêmes
// FICHIERS travaillent sur la même matière. Ce n'est pas une ressemblance de mots — c'est une
// intersection d'ensembles, et elle ne dépend d'aucun vocabulaire. C'est précisément ce que la
// leçon L44 recommande après trois élargissements ratés d'un détecteur de prose.
//
// UNE SOURCE LUE PAR TOUT LE MONDE NE DISCRIMINE RIEN, et c'est la moitié du dispositif :
// `scripts/` est lu par 45 outils, `docs/referentiel/` par 19, `CLAUDE.md` par 18. Les compter
// rapprocherait le paysage entier de lui-même. Seules les sources RARES comptent.
//
// LES DEUX SEUILS SE LISENT DANS LEUR DISTRIBUTION, ils ne se choisissent pas — et les deux
// distributions sont imprimées avec le résultat, pour qu'un lecteur vérifie que le trou existe
// encore (BP5, et sa troisième question ajoutée le même jour) :
//   · POPULARITÉ d'une source : 158 sources lues par 1 outil, 41 par 2, 18 par 3, 10 par 4, 8 par
//     5, 7 par 6, 3 par 7, **rien par 8**, puis 9, 12, 18, 19… Le trou est à 8, le seuil est 7.
//   · NOMBRE de sources rares communes à une paire : 70 paires à 1, 23 à 2, puis 6, 8, 3, 1, 3,
//     1, 1 jusqu'à 9 — **rien à 10 ni 11** — puis 12, 16, 30, 32. Le trou est franc, le seuil
//     est 10.
//
// CE QU'IL A TROUVÉ AU PREMIER PASSAGE, et c'est ce qui valide le signal plutôt qu'une opinion :
// la paire de tête est `circle-tasks ↔ doc-report`, à 32 sources communes quand la suivante est à
// 16. **Ces deux-là ont un historique documenté de duplication réelle** — un `checkHtmlWiring()`
// dupliqué entre eux, corrigé le 2026-09-26. Le signal retrouve donc un cas connu qu'aucun humain
// ne lui avait indiqué.
//
// CE QU'IL NE DIT PAS, ET IL FAUT LE LIRE EN LE SACHANT : lire les mêmes fichiers n'est pas faire
// la même chose. Un auditeur et un rapporteur peuvent légitimement lire tout le dépôt. Ce sont des
// CANDIDATES à instruire, jamais un verdict de fusion — et la fusion elle-même reste une décision
// de l'utilisateur.
// LE SCANNER TROUVE LE SCANNER, ET CE N'EST PAS UNE FUSION (ajouté le jour même, après mesure).
// Au premier passage, 4 des 5 paires impliquaient `check-house` ou `doc-report` — deux outils qui
// lisent le dépôt ENTIER par métier. Leur recouvrement est attendu, jamais un défaut.
//
// DEUX NORMALISATIONS ESSAYÉES ET ÉCARTÉES, avec leur mesure, parce qu'un écart sans raison n'est
// pas une décision (Article 28) :
//   · diviser par le plus petit ensemble donne 1,00 à un outil qui lit 3 sources toutes incluses
//     dans un scanner. C'est de l'INCLUSION, pas du recouvrement, et la distribution obtenue est
//     une pente continue (0,2×3 · 0,3×4 · 0,5×7 · 0,8×8 · 1,0×7) : aucun seuil ne s'y lit.
//   · le Jaccard pénalise les grands ensembles et enterre justement la paire la plus intéressante.
//
// CE QUI MARCHE : séparer les deux populations. La taille des ensembles de sources rares se lit
// 141 · 74 · 40 · 21 · 18 · 12 · 11 · 10 · 9 · 7 … — le trou est franc entre 40 et 21, donc un
// scanner est un outil qui lit 40 sources rares ou plus. HORS scanners, le maximum tombe à 4 et
// la distribution redevient une pente (1×56 · 2×9 · 3×2 · 4×2) : **aucune paire ne se détache**.
//
// LA CONCLUSION QUE ÇA DONNE À LA QUESTION « quels outils fusionner ? » : sur cet axe non plus,
// il n'y a pas de candidat. Ce n'est pas un échec de la mesure — c'est la mesure.
export const SEUIL_SCANNER = 40;
// ————————————————————————————————————————————————————————————————————————
// DEUX OUTILS QUI ÉCRIVENT LA MÊME CHOSE (2026-10-03, tâche #1460, son arbitrage du 2026-10-02)
// ————————————————————————————————————————————————————————————————————————
//
// SON ARBITRAGE, EN FENÊTRE DÉDIÉE : « mesurer le chevauchement autrement » — comparer ce que les
// outils FONT plutôt que les mots de leur libellé. Le détecteur textuel (`findOffresConcurrentes`,
// plus haut) a vu son seuil passer AU-DESSUS de sa propre distribution le 2026-10-01 : son zéro ne
// mesurait plus rien. `findOutilsQuiLisentLesMemesSources()` a répondu pour la moitié ENTRÉE ; ceci
// répond pour la moitié SORTIE, et les deux ensemble couvrent sa phrase.
//
// POURQUOI LA SORTIE DISCRIMINE MIEUX QUE L'ENTRÉE : tout le monde lit `scripts/`. Presque personne
// n'écrit au même endroit — un registre appartient à son outil, c'est la convention du dépôt. Deux
// outils qui écrivent le MÊME fichier ne se ressemblent pas, ils se marchent dessus.
//
// LA DISTRIBUTION A ÉTÉ MESURÉE AVANT QUE LE SEUIL NE SOIT POSÉ, et c'est la condition qu'il a
// explicitement attachée à son arbitrage : sur 33 outils ayant une sortie déclarée, soit 528
// paires — **523 paires à 0 sortie commune, 4 à 1, 1 à 2**. Le maximum réel est 2.
//
// LE SEUIL EST DONC 1, ET C'EST LE SEUL CHOIX HONNÊTE SUR CETTE DISTRIBUTION : il n'y a pas de trou
// où poser une frontière plus haute, et une seule sortie partagée est déjà un fait qui se constate.
// Le poser à 2 ferait exactement ce qui vient d'être corrigé chez son voisin — un seuil au-dessus
// de presque toute sa distribution, dont le zéro ne voudrait rien dire (BP5).
//
// LE PREMIER JET NE DISCRIMINAIT RIEN, et c'est écrit ici parce que l'erreur est instructive : il
// tronquait chaque chemin à son DOSSIER, si bien que 190 paires « partageaient docs/ ». Un signal
// où la moitié des paires sont positives ne dit rien de plus qu'un signal où aucune ne l'est.
export const SEUIL_SORTIE_PARTAGEE = 1;
// La banalité se DÉRIVE du corpus (Article 24) : une sortie écrite par plus de 15 % des outils est
// un emplacement commun, pas un chevauchement. Aucune ne l'atteint aujourd'hui — et c'est une
// information, pas une raison de retirer le filtre : le jour où un emplacement devient commun, le
// signal ne doit pas se mettre à accuser tout le monde (L4).
export const PART_POUR_UNE_SORTIE_BANALE = 0.15;

export const MOTIFS_D_ECRITURE = [
  /(?:writeFileSync|appendFileSync|ecrireImpl|writeFileImpl)\s*\(\s*(?:join\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*)?["'`]((?:docs|\.)[^"'`\n]+)["'`]/g,
  /\b[A-Z_0-9]{3,}\s*=\s*["'`]((?:docs|\.)[^"'`\n]+)["'`]/g,
];

export function sortiesParOutil({ dossier = "scripts", listDirImpl = readdirSync, readFileImpl = readFileSync, root = ROOT_COORD } = {}) {
  let fichiers = [];
  try { fichiers = listDirImpl(join(root, dossier)); }
  catch { return { mesurable: false, pourquoi: `le dossier ${dossier} n'a pas pu être lu — zéro outil lu n'est jamais « aucun chevauchement » (L5)`, parOutil: {} }; }
  const parOutil = {};
  for (const f of fichiers) {
    if (!f.endsWith(".mjs")) continue;
    let src = "";
    try { src = String(readFileImpl(join(root, dossier, f), "utf8")); } catch { continue; }
    const sorties = new Set();
    for (const motif of MOTIFS_D_ECRITURE) for (const m of src.matchAll(motif)) sorties.add(m[1]);
    if (sorties.size) parOutil[f.replace(/\.mjs$/, "")] = [...sorties].sort();
  }
  return { mesurable: true, parOutil };
}

export function findOutilsQuiEcriventLaMemeChose({ seuil = SEUIL_SORTIE_PARTAGEE, partBanale = PART_POUR_UNE_SORTIE_BANALE, ...options } = {}) {
  const rel = sortiesParOutil(options);
  if (!rel.mesurable) return { mesurable: false, pourquoi: rel.pourquoi, paires: [] };
  const noms = Object.keys(rel.parOutil);
  if (noms.length < 2) return { mesurable: false, pourquoi: "moins de deux outils déclarent une sortie : il n'y a rien à comparer, et rendre « aucun chevauchement » sur rien serait un satisfecit sur du vide", paires: [] };
  const popularite = {};
  for (const n of noms) for (const c of rel.parOutil[n]) popularite[c] = (popularite[c] ?? 0) + 1;
  const plancherBanal = Math.max(3, Math.round(noms.length * partBanale));
  const banales = Object.keys(popularite).filter((c) => popularite[c] > plancherBanal);
  const distribution = {}; const paires = [];
  for (let i = 0; i < noms.length; i++) {
    for (let j = i + 1; j < noms.length; j++) {
      const communes = rel.parOutil[noms[i]].filter((c) => rel.parOutil[noms[j]].includes(c) && !banales.includes(c));
      distribution[communes.length] = (distribution[communes.length] ?? 0) + 1;
      if (communes.length >= seuil) paires.push({ a: noms[i], b: noms[j], communes });
    }
  }
  const observes = Object.keys(distribution).map(Number).filter((n) => distribution[n] > 0);
  const maxObserve = observes.length ? Math.max(...observes) : 0;
  return {
    mesurable: true, seuil, examines: noms.length, distribution, maxObserve, banales, plancherBanal,
    // MÊME GARDE-FOU QUE CHEZ SON VOISIN, et pour la même raison : un seuil au-dessus de tout ce
    // qu'on observe rend « aucun chevauchement » et « je ne peux pas en voir » avec les mêmes mots.
    seuilAuDessusDeLaDistribution: maxObserve < seuil,
    paires: paires.sort((x, y) => y.communes.length - x.communes.length),
    horsPortee: "elle lit les chemins ÉCRITS EN DUR dans le code. Un chemin construit à l'exécution lui échappe, et deux outils qui écrivent au même endroit ne font pas forcément doublon — un registre partagé peut être une décision assumée. Elle NOMME une collision, elle ne juge jamais qu'elle est fautive.",
  };
}

export function outilsQuiEcriventLaMemeChoseLines(r) {
  if (!r?.mesurable) return [`— Deux outils qui ÉCRIVENT la même chose — PAS MESURÉ : ${r?.pourquoi ?? "aucune donnée"}`];
  const L = [`— Deux outils qui ÉCRIVENT la même chose (${r.examines} outils ayant une sortie déclarée, seuil ${r.seuil}) —`];
  L.push(`  Distribution des sorties communes : ${Object.entries(r.distribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([n, c]) => `${n} × ${c} paire(s)`).join(" · ")} — maximum observé : ${r.maxObserve}`);
  if (r.seuilAuDessusDeLaDistribution) {
    L.push(`  🚨 PAS MESURÉ — le seuil (${r.seuil}) est AU-DESSUS du maximum observé (${r.maxObserve}) : aucune paire ne PEUT l'atteindre, donc un zéro ici ne dirait rien (leçons L5/L11, BP5).`);
    return L;
  }
  if (!r.paires.length) L.push("  ✅ aucune paire d'outils n'écrit au même endroit — et le seuil reste à l'intérieur de sa distribution, donc ce zéro mesure vraiment quelque chose.");
  for (const p of r.paires) L.push(`  ⚠️  ${p.a} ↔ ${p.b} — ${p.communes.length} sortie(s) commune(s) : ${p.communes.join(", ")}`);
  if (r.banales.length) L.push(`  ⚪ ${r.banales.length} emplacement(s) écarté(s) comme communs (écrits par plus de ${r.plancherBanal} outils) : ${r.banales.join(", ")}`);
  L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export const SEUIL_SOURCE_PARTAGEE = 7;
export const SEUIL_SOURCES_COMMUNES = 10;
export const MOTIF_SOURCE_LUE = /["'`]((?:docs|scripts|lib|app|components)\/[A-Za-z0-9._/-]*|CLAUDE\.md)["'`]/g;

export function sourcesParOutil({ dossier = "scripts", listDirImpl = readdirSync, readFileImpl = readFileSync, root = ROOT_COORD } = {}) {
  let fichiers;
  try { fichiers = listDirImpl(join(root, dossier)).filter((f) => String(f).endsWith(".mjs")); }
  catch { return { mesurable: false, pourquoi: `${dossier}/ est illisible : aucune source ne peut être relevée, et un « aucun chevauchement » rendu ici serait un satisfecit sur du vide` }; }
  const parOutil = {};
  for (const f of fichiers) {
    let src;
    try { src = readFileImpl(join(root, dossier, f), "utf8"); } catch { continue; }
    // Les commentaires racontent l'histoire du projet sans que le CODE en dépende : on ne juge que
    // le code (même raison, et même geste, que findScriptsNonPortables dans safe-export).
    const code = src.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    const slug = f.replace(/\.mjs$/, "");
    const set = new Set([...code.matchAll(MOTIF_SOURCE_LUE)].map((m) => m[1].replace(/\/[^/]*\.[a-z]+$/, "/")));
    // Son PROPRE registre n'est pas une source partagée : il lui appartient.
    set.delete(`docs/${slug}/`);
    if (set.size) parOutil[slug] = set;
  }
  return { mesurable: true, parOutil };
}

export function findOutilsQuiLisentLesMemesSources({ seuilPopularite = SEUIL_SOURCE_PARTAGEE, seuilCommunes = SEUIL_SOURCES_COMMUNES, seuilScanner = SEUIL_SCANNER, ...options } = {}) {
  const rel = sourcesParOutil(options);
  if (!rel.mesurable) return { mesurable: false, pourquoi: rel.pourquoi, paires: [] };
  const { parOutil } = rel;
  const noms = Object.keys(parOutil);
  if (noms.length < 2) return { mesurable: false, pourquoi: "moins de deux outils lisent une source : il n'y a rien à comparer", paires: [] };
  const popularite = {};
  for (const n of noms) for (const s of parOutil[n]) popularite[s] = (popularite[s] ?? 0) + 1;
  const distributionPopularite = {};
  for (const c of Object.values(popularite)) distributionPopularite[c] = (distributionPopularite[c] ?? 0) + 1;
  const rares = new Set(Object.entries(popularite).filter(([, c]) => c <= seuilPopularite).map(([s]) => s));
  // LES SCANNERS SE DÉRIVENT DE LA TAILLE DE LEUR LECTURE, ils ne se recopient pas (Article 24) :
  // un outil ajouté demain qui lit tout le dépôt sera reconnu sans qu'une ligne bouge.
  const tailleRare = {};
  for (const n of noms) tailleRare[n] = [...parOutil[n]].filter((x) => rares.has(x)).length;
  const scanners = new Set(noms.filter((n) => tailleRare[n] >= seuilScanner));
  const distributionCommunes = {};
  const paires = [];
  for (let i = 0; i < noms.length; i++) {
    for (let j = i + 1; j < noms.length; j++) {
      const a = [...parOutil[noms[i]]].filter((x) => rares.has(x));
      const b = new Set([...parOutil[noms[j]]].filter((x) => rares.has(x)));
      const communes = a.filter((x) => b.has(x));
      if (!communes.length) continue;
      distributionCommunes[communes.length] = (distributionCommunes[communes.length] ?? 0) + 1;
      if (communes.length >= seuilCommunes) paires.push({ a: noms[i], b: noms[j], communes: communes.sort(), entreScanners: scanners.has(noms[i]) || scanners.has(noms[j]) });
    }
  }
  // LE GARDE-FOU DE #1377 EST CÂBLÉ DÈS LE PREMIER JOUR (Article 24 : une capacité nouvelle
  // s'applique à tous le jour où elle est écrite, y compris à l'outil qu'on est en train d'écrire).
  const observes = Object.keys(distributionCommunes).map(Number);
  const maxObserve = observes.length ? Math.max(...observes) : 0;
  return {
    mesurable: true, examines: noms.length, seuilPopularite, seuilCommunes, seuilScanner,
    scanners: [...scanners].sort((x, y) => tailleRare[y] - tailleRare[x]).map((n) => ({ outil: n, sourcesRares: tailleRare[n] })),
    distributionPopularite, distributionCommunes, maxObserve,
    seuilAuDessusDeLaDistribution: maxObserve < seuilCommunes,
    paires: paires.sort((x, y) => y.communes.length - x.communes.length),
    horsPortee: "lire les mêmes fichiers n'est pas faire la même chose : un auditeur et un rapporteur peuvent légitimement lire tout le dépôt. Ce sont des CANDIDATES à instruire, jamais un verdict de fusion.",
  };
}

export function formatOutilsMemesSourcesLines(r, { detail = 6 } = {}) {
  if (!r?.mesurable) return [`=== OUTILS QUI LISENT LES MÊMES SOURCES : PAS MESURÉ — ${r?.pourquoi} ===`, "", "Ce n'est PAS « aucun chevauchement »."];
  const L = [`=== OUTILS QUI LISENT LES MÊMES SOURCES — ${r.paires.length} paire(s) sur ${r.examines} outils ===`, ""];
  const d = (o) => Object.entries(o).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => `${k}×${v}`).join(" · ");
  L.push(`  Popularité d'une source (combien d'outils la lisent) : ${d(r.distributionPopularite)}`);
  L.push(`  Seuil de rareté : ${r.seuilPopularite}. Au-delà, une source est lue par trop d'outils pour discriminer quoi que ce soit.`);
  L.push(`  Sources rares communes par paire : ${d(r.distributionCommunes)}`);
  L.push(`  Seuil : ${r.seuilCommunes}, POSÉ DANS LE TROU de cette distribution — si le trou se referme, il est à remesurer, jamais à défendre.`);
  L.push("");
  if (r.seuilAuDessusDeLaDistribution) {
    L.push(`  🚨 CE ZÉRO N'EST PAS UNE MESURE — le seuil (${r.seuilCommunes}) est au-dessus de tout ce qu'on observe (maximum : ${r.maxObserve}).`);
    L.push("     Aucune paire ne PEUT l'atteindre : « aucun chevauchement » et « je ne peux pas en voir » rendent ici le même texte (leçons L5 et L11).");
  } else if (!r.paires.length) {
    L.push("  Aucune paire au-dessus du seuil : aucun couple d'outils ne travaille sur la même matière rare.");
  }
  const horsScanners = r.paires.filter((p) => !p.entreScanners);
  L.push(`  SCANNERS (≥ ${r.seuilScanner} sources rares, ils lisent le dépôt par métier) : ${(r.scanners ?? []).map((s) => `${s.outil} (${s.sourcesRares})`).join(", ") || "aucun"}.`);
  L.push(`  ${r.paires.length - horsScanners.length} paire(s) impliquent un scanner — attendu, jamais un défaut. ${horsScanners.length} paire(s) HORS scanners, et ce sont les seules qui posent une question de fusion.`);
  L.push("");
  for (const p of r.paires) {
    L.push(`  ${p.entreScanners ? "⚪" : "🟠"} ${p.communes.length} sources rares communes — ${p.a} ↔ ${p.b}${p.entreScanners ? "  (un scanner est en cause : attendu)" : ""}`);
    L.push(`      ${p.communes.slice(0, detail).join(", ")}${p.communes.length > detail ? `, … (+${p.communes.length - detail})` : ""}`);
    L.push("      → À INSTRUIRE : travaillent-ils la même matière pour la même raison ? La fusion, elle, reste une décision de l'utilisateur.");
  }
  L.push("");
  L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export function formatOffresConcurrentesLines(r) {
  if (!r?.mesurable) return [`=== OUTILS QUI SE CHEVAUCHENT : PAS MESURÉ — ${r?.pourquoi} ===`, "", "Ce n'est PAS « aucun chevauchement »."];
  const l = [`=== OUTILS QUI RÉPONDENT À LA MÊME DEMANDE — ${r.paires.length} sur ${r.examinees} prestations ===`, ""];
  l.push(`  Distribution des mots partagés entre paires d'offres : ${Object.entries(r.distribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([n, c]) => `${n} mot(s) × ${c}`).join(" · ")}`);
  l.push(`  Seuil : ${r.seuil} mots. Il est POSÉ DANS LE TROU de cette distribution, jamais choisi — si le trou se referme, le seuil est à remesurer plutôt qu'à défendre.`);
  l.push("");
  if (r.seuilAuDessusDeLaDistribution) {
    l.push(`  🚨 CE ZÉRO N'EST PAS UNE MESURE — le seuil (${r.seuil}) est AU-DESSUS de tout ce qu'on observe (maximum réel : ${r.maxObserve} mot(s) partagés).`);
    l.push("     Aucune paire ne PEUT l'atteindre, donc « aucun chevauchement » et « je ne peux pas en voir » rendent ici le même texte (leçons L5 et L11).");
    l.push("     Le seuil avait été posé dans un TROU franc de la distribution (3 puis 7, sur 58 prestations). Le catalogue en compte plus aujourd'hui et la pente est devenue continue :");
    l.push("     il n'y a PLUS de trou où poser un seuil. Choisir un nouveau chiffre dans une pente régulière reviendrait à inventer la frontière qu'on prétend lire — donc rien n'est retouché ici,");
    l.push("     et le constat remonte en décision : soit ce signal a fait son travail et s'arrête, soit il faut mesurer le chevauchement sur autre chose que les mots de la demande.");
  } else if (!r.paires.length) l.push("  Aucune paire d'offres concurrentes : chaque demande du catalogue mène à un outil, et tool-brain peut trancher seul.");
  for (const p of r.paires) {
    l.push(`  🟠 ${p.partages.length} mots communs — « ${p.a} » (${p.outilsA.join(", ")}) et « ${p.b} » (${p.outilsB.join(", ")})`);
    l.push(`      mots : ${p.partages.join(", ")}`);
    l.push(`      → tool-brain rendra TOUJOURS les deux sur ces mots-là, et l'agent devra choisir : c'est exactement ce que le point d'entrée unique existe pour éviter. Le geste est de rendre chaque demande DISCRIMINANTE, jamais de retirer une offre.`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

// L'IDÉE DU MOT RARE, ESSAYÉE ET ÉCARTÉE LE MÊME JOUR — avec sa raison, parce qu'un écart sans
// raison n'est pas une décision (Article 28). Elle est écrite ici plutôt que perdue : le prochain
// agent aura la même idée, et il doit trouver la mesure qui la referme (Article 27).
//
// LE DÉFAUT DE DÉPART ÉTAIT RÉEL, lui, et trouvé en SE SERVANT du point d'entrée. Demande exacte :
// « relire l'historique de conversation et en extraire les leçons, bonnes pratiques et éléments de
// stratégie non encore enregistrés ». Réponse : « Aucune correspondance dans le catalogue ». Or le
// **Pack Mémoire Longue** dit dans sa description « relit la CONVERSATION entière contre
// docs/suivi/ ». L'offre existait, elle répondait, et l'agent est reparti convaincu que personne ne
// savait faire — le coût exact que ce fichier redoute depuis la tâche #776.
//
// L'IDÉE : admettre UN seul mot partagé quand ce mot n'est employé que par une offre du catalogue
// (df = 1), au motif qu'un mot rare pèse plus que deux mots banals — la doctrine de `poidsDesMots()`
// plus bas, jamais appliquée ici.
//
// CE QUE LA MESURE A DIT, ET ELLE L'A TUÉE : sur les 70 offres réelles, 851 racines dont **508
// (60 %) n'apparaissent que dans UNE offre**. « Rare » n'y distingue donc presque rien. Le contre-
// test d'inflation déjà en place (« enchainer sur le bloc suivant de taches ouvertes », une méta-
// demande qu'aucun outil ne sert) est passé de 0 à TROIS pistes : « bloc » (sens « bloc de code
// dupliqué »), « enchaîner » (sens « enchaîner les vérifications »), « suivent ». Trois faux sens
// pour un vrai. Un point d'entrée obligatoire qui rend du bruit cesse d'être lu (leçon L4), et
// c'est plus cher que le silence qu'on voulait corriger.
//
// ESSAYÉ AUSSI, ET ÉCARTÉ POUR LA MÊME RAISON : compter les mots sur la SURFACE (demande +
// description) avec le seuil de deux inchangé. Zéro inflation, mais zéro gain — la bonne offre ne
// partage qu'UN mot avec la demande, quelle que soit la surface lue — et un classement déplacé sur
// « renommage », où Pack Espion passait devant Pack Baptême. Aucune des deux mécaniques ne gagne.
//
// CE QUI A ÉTÉ FAIT À LA PLACE, et c'est le geste que ce fichier prescrit déjà lui-même
// (`formatOffresConcurrentesLines` : « rendre chaque demande DISCRIMINANTE ») : la DEMANDE de
// l'offre a été enrichie du vocabulaire qu'un lecteur emploie vraiment. Corriger la donnée, pas le
// matcheur. Même geste que la tâche #777, qui avait refermé deux trous identiques de cette façon.

// LE RAPPROCHEMENT NE LISAIT QUE 28 % DU CATALOGUE (2026-09-29, tâche #1247), et c'est la MÊME
// faute que la racine des mots juste au-dessus (#776), prise par l'autre bout : là on comparait
// deux ORTHOGRAPHES du même mot, ici on compare la demande à UN SEUL des trois champs qui
// décrivent une prestation. Corriger la première sans voir la seconde, c'est corriger
// l'occurrence et laisser la classe (leçon L37).
//
// MESURÉ AVANT DE TOUCHER QUOI QUE CE SOIT (Article 19), sur le vrai catalogue de 74 entrées :
// 1 032 mots lus dans `demande`, 2 478 ignorés dans `description`, 204 ignorés dans `nom` —
// et surtout **69 prestations sur 74 étaient introuvables par leur propre nom**.
//
// LE CAS QUI L'A RÉVÉLÉ : « ce qui freine le projet » ne trouvait PAS le Pack Anti-lourdeurs,
// dont la description dit mot pour mot « Cherche tout ce qui freine le projet ». Le coût est
// celui que le commentaire de #776 décrivait déjà, et il est pire ici parce que tool-brain est le
// SEUL point d'entrée que l'Article 31 rend obligatoire : « aucune correspondance » se lit comme
// « aucun outil ne sait faire ça », l'agent refait à la main ce qu'un outil savait faire, et
// c'est mot pour mot l'échappatoire n°1 que ce même Article dit de fermer.
//
// POURQUOI UN POIDS PAR CHAMP, ET PAS UNE SIMPLE CONCATÉNATION DES TROIS. Coller les champs bout
// à bout mettrait le seuil de deux mots à la portée de n'importe quelle demande : 2 478 mots de
// description rendent deux recoupements triviaux, et un point d'entrée qui répond « oui » à tout
// ne vaut pas mieux que celui qui répondait « non » à tout (leçon L5 — un axe qui classe tout ne
// classe rien). Un NOM propre est au contraire un signal fort et peu bruyant : un seul mot suffit.
// Une DESCRIPTION est le champ le plus long, donc le plus bavard : il en faut quatre.
export const POIDS_DES_CHAMPS = Object.freeze({ nom: 2, demande: 1, description: 0.5 });

// LE MOT GÉNÉRIQUE SE DÉRIVE, IL NE SE RECOPIE PAS (Article 24). Les 74 noms du catalogue
// commencent tous par « Pack » : compté comme un mot de nom, il donnerait 2 points à TOUTES les
// prestations dès qu'une demande contient ce mot. Une liste écrite à la main se périmerait au
// premier préfixe suivant — on mesure donc ce qui est partagé par plus de la moitié des noms.
export function motsGeneriquesDesNoms(prestations = PRESTATIONS) {
  const compte = new Map();
  for (const p of prestations) for (const w of new Set(significantWords(p.nom))) compte.set(w, (compte.get(w) ?? 0) + 1);
  return new Set([...compte].filter(([, n]) => n > prestations.length / 2).map(([w]) => w));
}

// LE CATALOGUE SE DÉCOUPE UNE FOIS, PAS SIX MILLE (même raison mesurée que la mémoïsation des
// badges ci-dessus, tâche #1010) : check-tasks-details appelle cette fonction pour chaque tâche
// ouverte, et redécouper les 3 700 mots du catalogue à chaque passage referait le même travail
// pour le même résultat. Clé WeakMap sur le TABLEAU de prestations : un catalogue reconstruit est
// une clé neuve, donc jamais une réponse périmée, et rien à vider à la main.
const cacheMotsDuCatalogue = new WeakMap();

function motsDeLaPrestation(prestations) {
  let m = cacheMotsDuCatalogue.get(prestations);
  if (!m) {
    const generiques = motsGeneriquesDesNoms(prestations);
    m = new Map(prestations.map((p) => [p, {
      nom: [...new Set(significantWords(p.nom))].filter((w) => !generiques.has(w)),
      demande: [...new Set(significantWords(p.demande))],
      description: [...new Set(significantWords(p.description))],
    }]));
    cacheMotsDuCatalogue.set(prestations, m);
  }
  return m;
}

export function suggestPrestationsForTask(taskLabel, prestations = PRESTATIONS, onboardingContext = null) {
  const taskWords = new Set(significantWords(taskLabel));
  if (!taskWords.size) return [];
  // Le rapprochement se fait sur les RACINES (#776) : « renommage » doit trouver « renommer ».
  // Le mot d'origine est celui qu'on RESTITUE dans `matched`, jamais la racine — un lecteur qui
  // voit « renomm » ne reconnaît pas sa propre demande, et ce champ existe pour qu'il la reconnaisse.
  const taskRacines = new Set([...taskWords].map(racineDuMot));
  const mots = motsDeLaPrestation(prestations);
  const recoupe = (liste) => liste.filter((w) => taskWords.has(w) || taskRacines.has(racineDuMot(w)));
  return prestations
    .map((p) => {
      const champs = mots.get(p);
      const parChamp = { nom: recoupe(champs.nom), demande: recoupe(champs.demande), description: recoupe(champs.description) };
      const score = Object.entries(parChamp).reduce((s, [champ, l]) => s + l.length * POIDS_DES_CHAMPS[champ], 0);
      // `matched` reste la liste à plat que les appelants existants lisent, la demande d'abord :
      // c'est le champ le plus proche des mots de l'utilisateur, donc celui qu'il reconnaît.
      const matched = [...new Set([...parChamp.demande, ...parChamp.nom, ...parChamp.description])];
      return { ...p, score, matched, parChamp, badgeWarnings: badgeWarningsForOutils(p.outils, onboardingContext) };
    })
    .filter((p) => p.score >= 2)
    .sort((a, b) => b.score - a.score);
}

// LA MÊME CHOSE ÉCRITE DE DEUX FAÇONS N'EST PAS DEUX CHOSES (2026-09-25). La table maîtresse écrit
// « AGENT DES NOMS » ; le menu écrit « agent-des-noms ». Une comparaison littérale conclut à une
// absence là où il y a une prestation parfaitement en place — et elle l'aurait fait au moment même
// où le menu s'est ouvert aux outils périodiques, c'est-à-dire en accusant à tort un outil conforme
// dès le premier passage de la nouvelle règle (leçon L4, la forme qui S'AGGRAVE quand on élargit).
// On compare donc des formes NORMALISÉES des deux côtés, jamais deux orthographes.
export function normaliserNomDOutil(nom = "") {
  // La précision entre parenthèses part AVANT la normalisation : le menu écrit « Smart Breaker
  // (check-gemini-quota.mjs) » là où la table écrit « Smart Breaker », et sans ce retrait le
  // rapprochement échoue sur un nom pourtant présent — même découpage que primaryToolName() côté
  // table, jamais une seconde règle qui divergerait (Article 24).
  return String(nom).replace(/\([^)]*\)/g, " ").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function findToolsMissingFromMenu(toolsTableMarkdown = lireTableMaitresse(), prestations = PRESTATIONS) {
  const auMenu = new Set(prestations.flatMap((p) => p.outils).map(normaliserNomDOutil));
  return parseToolsTable(toolsTableMarkdown)
    .filter(isMenuWorthy)
    .map((row) => primaryToolName(row.tool))
    .filter((primaryName) => !auMenu.has(normaliserNomDOutil(primaryName)));
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CATALOGUE MESURÉ DEPUIS LE DÉPÔT, JAMAIS DEPUIS UNE SECONDE LISTE ÉCRITE À LA MAIN
// (2026-09-27, tâche #714 — sa question était « est-ce que le catalogue du coordinateur se met à
// jour en auto ? », et la réponse mesurée reste non.)
//
// CE QUI EXISTAIT DÉJÀ, ET POURQUOI CE N'ÉTAIT PAS SUFFISANT. `findToolsMissingFromMenu()`
// ci-dessus compare la TABLE MAÎTRESSE (un tableau Markdown écrit à la main dans
// docs/regles-de-travail.md §7ter) au catalogue PRESTATIONS (une liste écrite à la main ici). Deux
// listes manuelles confrontées l'une à l'autre : elles peuvent parfaitement s'accorder pendant que
// les deux ignorent la même chose. Mesure du jour — le garde-fou rendait « aucun outil muet », et
// la table sur laquelle il se fonde ne connaissait que 63 des 90 scripts réels. Son vert ne disait
// pas « tout le monde a une offre », il disait « je n'ai pas regardé les autres » (leçon L11 : un
// zéro mesure un silence, jamais une absence de problème). Les deux fonctions restent, parce
// qu'elles ne posent pas la même question — celle-ci demande « qui, dans le DÉPÔT, n'a pas
// d'offre ? », l'autre « la table et le catalogue se contredisent-ils ? ».
//
// QUI DOIT UNE OFFRE SE DÉRIVE, IL NE SE LISTE PAS (Article 24). Le catalogue existe pour qu'on
// sache quoi COMMANDER : en doit une exactement ce qu'on peut lancer, c'est-à-dire tout fichier
// dont le classificateur a dérivé une porte « ligne de commande ». Un crochet git, une bibliothèque
// partagée, un script d'installation n'ont rien à offrir à un lecteur et ne sont jamais accusés —
// sans qu'aucun de leurs noms soit écrit ici, donc sans que la règle se périme au prochain arrivant.
//
// LE RAPPROCHEMENT PASSE PAR L'INVENTAIRE DE LA CHARTE, JAMAIS PAR LE NOM DU FICHIER. C'est une
// erreur que ce dépôt a déjà payée (« SANS FICHE, 22 fois », le-classificateur) : le catalogue cite
// ARGUS, le script s'appelle `check-argus.mjs`, et une comparaison sur le nom de fichier accuse un
// outil parfaitement catalogué. L'inventaire de CLAUDE.md porte déjà le lien script → fiche, et le
// nom de l'outil est celui de sa fiche. Trois candidats sont donc essayés pour chaque script : le
// nom du fichier, ce nom sans son extension, et le nom d'outil résolu par l'inventaire.
export const PORTE_COMMANDABLE = "ligne de commande";

export function nomsCandidatsDUnScript(chemin, inventaire = []) {
  const base = String(chemin).replace(/^scripts\//, "");
  const noms = [base, base.replace(/\.(mjs|js|sh)$/, "")];
  for (const e of inventaire) {
    if (e?.script !== chemin) continue;
    const fiche = String(e.instanciation ?? "").split("/").pop() ?? "";
    if (fiche) noms.push(fiche.replace(/\.md$/, ""));
  }
  return noms.filter(Boolean);
}

export function findOutilsMuets({ recensement = null, inventaire = null, prestations = PRESTATIONS, charteText = null } = {}) {
  if (!recensement?.lignes?.length) {
    return { mesurable: false, pourquoi: "aucun recensement de scripts fourni — sans lui, « personne n'est muet » et « je n'ai regardé personne » s'écrivent tous les deux zéro (leçon L11)", muets: [], commandables: 0 };
  }
  const inv = inventaire ?? (charteText ? inventaireDeLaCharte(charteText) : []);
  const auMenu = new Set(prestations.flatMap((p) => p.outils ?? []).map(normaliserNomDOutil));
  // UN CROCHET NE SE COMMANDE PAS, il est lancé par git — et il lui arrive d'avoir une porte
  // « ligne de commande » parce qu'un document écrit comment l'exécuter à la main pour le déboguer.
  // L'exclusion se lit sur le TYPE dérivé par le classificateur, jamais sur un nom de fichier.
  const commandables = recensement.lignes.filter((l) => (l.portes ?? []).includes(PORTE_COMMANDABLE) && l.type !== "crochet");
  const muets = commandables
    .filter((l) => !nomsCandidatsDUnScript(l.chemin, inv).some((n) => auMenu.has(normaliserNomDOutil(n))))
    .map((l) => ({ chemin: l.chemin, type: l.type ?? "?", candidats: nomsCandidatsDUnScript(l.chemin, inv) }));
  return { mesurable: true, muets, commandables: commandables.length, total: recensement.lignes.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES COMBINAISONS D'OUTILS, ENFIN — ET ELLES SE MESURENT, ELLES NE S'IMAGINENT PAS
// (2026-09-27, tâche #715. Sa demande, et elle durait depuis le début de l'Agence : « je veux un
// calcul complexe pour imaginer des combinaisons pertinentes [...] c'est une des vocations du
// catalogue que je n'ai toujours pas réussi à mettre en place correctement depuis le début de
// l'agence : HELP ! »)
//
// POURQUOI ÇA N'AVAIT JAMAIS MARCHÉ, et c'est le vrai apport de cette tâche : les tentatives
// précédentes partaient des OUTILS. 75 outils font 2 775 paires et 67 525 trios ; un classement sur
// ce volume aurait l'air intelligent et serait du bruit, sans aucun moyen de faire la différence.
// Une combinaison utile ne se déduit pas d'un stock disponible — elle se lit dans ce qui se passe
// déjà, ou dans un besoin auquel personne ne répond.
//
// DEUX GÉNÉRATEURS MÉCANIQUES ICI, UN TROISIÈME DÉLÉGUÉ — jamais un calcul sur toutes les paires.
// (1) CE QUI ARRIVE DÉJÀ TOUT SEUL. Le compteur d'usage horodate chaque lancement : deux outils qui
//     tombent sans cesse dans la même fenêtre de travail forment une combinaison que l'agent fait
//     déjà sans lui avoir donné de nom. La nommer, c'est tout ce qu'il reste à faire.
// (2) CE QUI S'EMBOÎTE. A écrit un registre que B sait lire : la chaîne existe dans le dépôt, il
//     suffit de la suivre.
// (3) LES EXIGENCES QUE PERSONNE NE VÉRIFIE → cette question-là est déjà celle de THE-EQUALIZER
//     (`confronterCadreExterne()`, tâche #1003). La refaire ici serait un second calcul divergent
//     sur la même donnée (leçon L29) : on renvoie vers lui, on ne le réimplémente pas (Article 31).
//
// LE PIÈGE DU GÉNÉRATEUR (1), MESURÉ AVANT D'ÊTRE CRAINT : compté en brut, le palmarès est trusté
// par `agent-du-temps` — 70 fenêtres avec moïse, 69 avec ecotoken, 38 avec tool-brain. Ce n'est pas
// une combinaison, c'est un RITUEL : on lit l'heure avant d'écrire, donc il accompagne tout le
// monde. Le compte brut mesure la fréquence, jamais l'affinité. On lit donc l'ÉCART À L'ATTENDU :
// combien de fois cette paire tombe ensemble, rapporté à ce que leurs fréquences respectives
// prédiraient si elles ne s'appelaient jamais l'une l'autre. Un outil omniprésent a un écart de 1
// avec tout le monde et disparaît de lui-même ; `argus + harmonia` ressort à 20, et ces deux-là
// sont effectivement les deux moitiés d'un même geste.
export const FENETRE_DE_TRAVAIL_MS = 10 * 60 * 1000;
export const MIN_FENETRES_PARTAGEES = 8;
export const ECART_MINIMUM = 3;
// Les lancements du crochet ne comptent PAS : le post-commit lance un lot fixe à chaque commit, ce
// qui n'est pas une combinaison choisie mais une seule commande. Les compter ferait ressortir le
// contenu du crochet comme une découverte, ce qui est l'inverse d'une trouvaille.
export const ORIGINE_SPONTANEE = "cli_direct";

export function fenetresDeTravail(events = [], { fenetreMs = FENETRE_DE_TRAVAIL_MS, origine = ORIGINE_SPONTANEE } = {}) {
  const ev = events.filter((e) => e?.origin === origine && e?.at).sort((a, b) => a.at - b.at);
  if (!ev.length) return [];
  const out = []; let cur = [ev[0]];
  for (const e of ev.slice(1)) {
    if (e.at - cur[cur.length - 1].at <= fenetreMs) cur.push(e);
    else { out.push(cur); cur = [e]; }
  }
  out.push(cur);
  return out;
}

// LA PAIRE DÉJÀ NOMMÉE : UNE SEULE ÉCRITURE DE LA CLÉ, POUR LES DEUX CÔTÉS (2026-09-29, #1206).
// CLONE-HUNTER signalait les cinq lignes qui construisent cet index, recopiées dans
// `combinaisonsSpontanees` et `emboitements`. La construction n'était que la moitié visible : la
// CLÉ était écrite QUATRE fois — deux fois pour la poser, deux fois pour l'interroger, chaque fois
// avec le même trio normaliser / trier / joindre.
//
// CE QUE CETTE DISPERSION RISQUAIT, ET C'EST UN FAUX POSITIF SILENCIEUX : si un seul des quatre
// endroits oubliait la normalisation ou le tri, l'interrogation ne trouverait rien, la paire
// passerait pour inédite, et le rapport proposerait fièrement une association que le catalogue
// réunit déjà. Rien ne planterait, rien ne serait rouge — le rapport se féliciterait simplement de
// ce qui existe. Une clé se construit à UN endroit, ou elle finit par ne plus se correspondre.
export function clePaireDOutils(a, b) {
  return [normaliserNomDOutil(a), normaliserNomDOutil(b)].sort().join("|");
}

// DÉJÀ NOMMÉE = DÉJÀ TROUVÉE : une paire que le catalogue réunit déjà dans une même offre n'est pas
// une découverte, et la proposer ferait un rapport qui se félicite de ce qui existe.
export function pairesDejaNommees(prestations = []) {
  const set = new Set();
  for (const p of prestations) {
    const o = (p.outils ?? []).map(normaliserNomDOutil).sort();
    for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) set.add(clePaireDOutils(o[i], o[j]));
  }
  return set;
}

export function dejaNommee(set, a, b) {
  return set.has(clePaireDOutils(a, b));
}

export function combinaisonsSpontanees(events = [], prestations = PRESTATIONS, { fenetreMs = FENETRE_DE_TRAVAIL_MS, minFenetres = MIN_FENETRES_PARTAGEES, ecartMin = ECART_MINIMUM, max = 8 } = {}) {
  const fen = fenetresDeTravail(events, { fenetreMs });
  if (fen.length < minFenetres) {
    return { mesurable: false, pourquoi: `seulement ${fen.length} fenêtre(s) de travail dans le compteur — trop peu pour distinguer une habitude d'un hasard`, paires: [], fenetres: fen.length };
  }
  const N = fen.length, seul = {}, ensemble = {};
  for (const f of fen) {
    const s = [...new Set(f.map((x) => x.toolSlug))].sort();
    for (const a of s) seul[a] = (seul[a] ?? 0) + 1;
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) ensemble[`${s[i]}|${s[j]}`] = (ensemble[`${s[i]}|${s[j]}`] ?? 0) + 1;
  }
  // DÉJÀ NOMMÉE = DÉJÀ TROUVÉE : une paire que le catalogue réunit déjà dans une même offre n'est
  // pas une découverte, et la proposer ferait un rapport qui se félicite de ce qui existe.
  const dejaNommees = pairesDejaNommees(prestations);
  const paires = Object.entries(ensemble)
    .filter(([, v]) => v >= minFenetres)
    .map(([k, v]) => {
      const [a, b] = k.split("|");
      const attendu = (seul[a] / N) * (seul[b] / N) * N;
      return { a, b, ensemble: v, ecart: +(v / attendu).toFixed(1), deja: dejaNommee(dejaNommees, a, b) };
    })
    .filter((p) => p.ecart >= ecartMin && !p.deja)
    .sort((x, y) => y.ecart - x.ecart)
    .slice(0, max);
  return { mesurable: true, paires, fenetres: N };
}

// CE QUI S'EMBOÎTE — A écrit un registre, B le lit. La chaîne est dans le dépôt : les registres se
// LISENT dans la liste déclarée de Doc-Report (jamais recopiés), et les lecteurs se cherchent dans
// la source réelle de chaque script.
//
// LE MÊME PIÈGE QUE CI-DESSUS, SOUS UNE AUTRE FORME : quatre outils lisent PRESQUE TOUS les
// registres — Doc-Report, le contrôleur de Ronde, le filet de sécurité, HYPER-SCAN-CHECKPOINT. Ce
// sont des AGRÉGATEURS : leur métier est de tout relire, pas de former un duo avec chacun. Le seuil
// se DÉRIVE de la distribution (un lecteur qui couvre plus de la moitié des registres agrège), il
// ne se liste pas — le jour où un cinquième agrégateur naît, il sera écarté sans qu'on y pense.
// LE SEUIL NE SE CHOISIT PAS, IL SE LIT — même discipline que le seuil des offres concurrentes.
// Distribution mesurée le 2026-09-27 sur 55 registres : doc-report 98 %, circle-tasks 56 %,
// check-house 38 %, hyper-scan-checkpoint 31 %, puis une CHUTE FRANCHE à 16 % et en dessous. Le
// trou entre 31 et 16 est net, le seuil se pose dedans, et la distribution s'imprime avec le
// résultat pour qu'on puisse vérifier que le trou tient encore.
export const PART_AGREGATEUR = 0.25;

export function emboitements({ registres = [], sourceParOutil = {}, prestations = PRESTATIONS, partAgregateur = PART_AGREGATEUR, max = 8 } = {}) {
  if (!registres.length || !Object.keys(sourceParOutil).length) {
    return { mesurable: false, pourquoi: "sans la liste des registres déclarés ET la source des outils, « rien ne s'emboîte » et « je n'ai rien lu » s'écrivent pareil", chaines: [], agregateurs: [] };
  }
  // UN OUTIL QUI LIT SON PROPRE REGISTRE N'EST PAS UN EMBOÎTEMENT, et le rater est l'erreur déjà
  // payée deux fois ici : ARGUS s'appelle `check-argus.mjs`, donc comparer au seul slug le faisait
  // sortir comme « argus → check-argus ». Le registre déclare lui-même son `scriptPath` : on s'en
  // sert, plutôt que de deviner le nom du fichier depuis celui de l'outil.
  const dossiers = registres
    .map((r) => ({ proprio: r.slug, script: String(r.scriptPath ?? "").replace(/^scripts\//, "").replace(/\.mjs$/, ""), dossier: String(r.path ?? "").replace(/\/$/, "") }))
    .filter((r) => r.proprio && r.dossier);
  const lecteursPar = {};
  const combien = {};
  for (const { proprio, script, dossier } of dossiers) {
    const l = Object.entries(sourceParOutil).filter(([slug, src]) => slug !== proprio && slug !== script && String(src).includes(`${dossier}/`)).map(([slug]) => slug);
    lecteursPar[`${proprio}|${dossier}`] = l;
    for (const s of l) combien[s] = (combien[s] ?? 0) + 1;
  }
  const distribution = Object.entries(combien).map(([slug, n]) => ({ slug, lus: n, part: Math.round((n / dossiers.length) * 100) })).sort((a, b) => b.lus - a.lus);
  const agregateurs = distribution.filter((d) => d.lus >= dossiers.length * partAgregateur).map((d) => d.slug);
  const dejaNommees = pairesDejaNommees(prestations);
  const chaines = [];
  for (const [cle, lecteurs] of Object.entries(lecteursPar)) {
    const [proprio, dossier] = cle.split("|");
    for (const l of lecteurs) {
      if (agregateurs.includes(l)) continue;
      if (dejaNommee(dejaNommees, proprio, l)) continue;
      chaines.push({ produit: proprio, lit: l, via: `${dossier}/` });
    }
  }
  return { mesurable: true, chaines: chaines.slice(0, max), total: chaines.length, agregateurs, distribution, registres: dossiers.length };
}

export function formatCombinaisonsLines(spont, emb) {
  const out = ["", "🔗 COMBINAISONS D'OUTILS — ce que le dépôt fait déjà sans lui avoir donné de nom (tâche #715)"];
  out.push("   HORS PORTÉE, et c'est ce qui sépare une proposition d'un verdict : rien ici ne dit qu'une combinaison est UTILE. Elle dit qu'elle est RÉELLE — déjà pratiquée, ou déjà branchée. Décider qu'elle mérite un nom reste un jugement.");
  out.push("");
  out.push("   ① CE QUI ARRIVE DÉJÀ TOUT SEUL (fenêtres de travail du compteur d'usage)");
  if (!spont?.mesurable) out.push(`      🚨 PAS MESURÉ — ${spont?.pourquoi ?? "raison non fournie"}`);
  else if (!spont.paires.length) out.push(`      ✅ sur ${spont.fenetres} fenêtres, aucune paire hors catalogue ne dépasse le seuil d'affinité — tout ce qui se pratique porte déjà un nom.`);
  else {
    out.push(`      ${spont.paires.length} paire(s) sur ${spont.fenetres} fenêtres, classées par ÉCART À L'ATTENDU et non par fréquence brute (sans quoi l'outil qu'on lance avant tout le monde raflerait la tête sans former de duo avec personne) :`);
    for (const p of spont.paires) out.push(`      · ${p.a} + ${p.b} — ${p.ensemble} fenêtres ensemble, ×${p.ecart} l'attendu`);
  }
  out.push("");
  out.push("   ② CE QUI S'EMBOÎTE (A écrit un registre, B le lit)");
  if (!emb?.mesurable) out.push(`      🚨 PAS MESURÉ — ${emb?.pourquoi ?? "raison non fournie"}`);
  else if (!emb.chaines.length) out.push("      ✅ aucune chaîne producteur → lecteur hors catalogue et hors agrégateurs.");
  else {
    out.push(`      ${emb.total} chaîne(s) sur ${emb.registres} registres, dont les ${emb.chaines.length} premières.`);
    out.push(`      Agrégateurs écartés (ils relisent tout par métier, ce n'est pas un duo) : ${emb.agregateurs.join(", ") || "aucun"}`);
    out.push(`      Distribution des lecteurs, imprimée pour qu'on vérifie que le trou où se pose le seuil tient encore : ${(emb.distribution ?? []).slice(0, 8).map((d) => `${d.slug} ${d.part}%`).join(" · ")}`);
    for (const c of emb.chaines) out.push(`      · ${c.produit} → ${c.lit} (via ${c.via})`);
  }
  out.push("");
  out.push("   ③ LES EXIGENCES QUE PERSONNE NE VÉRIFIE → c'est la question de THE-EQUALIZER, pas la nôtre : `node scripts/the-equalizer.mjs confronter`. La refaire ici serait un second calcul sur la même donnée, qui finirait par diverger de celui qui décide vraiment (leçon L29).");
  return out;
}

export function formatOutilsMuetsLines(r) {
  const out = ["", "🗂️  CATALOGUE — qui, dans le dépôt, n'a aucune offre ? (tâche #714)"];
  if (!r?.mesurable) {
    out.push(`   🚨 PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"}`);
    return out;
  }
  out.push(`   ${r.commandables} fichier(s) lançables en ligne de commande sur ${r.total} — les autres (crochets, bibliothèques, scripts d'installation) n'ont rien à offrir à un lecteur et ne sont jamais comptés.`);
  if (!r.muets.length) {
    out.push("   ✅ chacun d'eux est cité par au moins une offre du catalogue.");
    return out;
  }
  out.push(`   ⚠️  ${r.muets.length} outil(s) lançables et ABSENTS du catalogue — invisibles à tool-brain, donc jamais recommandés, donc jamais lancés : leur zéro d'usage se lira ensuite comme un verdict sur eux.`);
  for (const m of r.muets) out.push(`      · ${m.chemin} (${m.type})`);
  out.push("   Une offre manquante se corrige en ajoutant une entrée à PRESTATIONS — jamais en retirant l'outil de la mesure.");
  return out;
}

// Garde-fou de fraîcheur (2026-09-21, audit d'évolutivité) : `AGENT_SCRIPT_FILES` (axa-check.mjs,
// qui alimente la couverture AXA-CHECK des badges ET la stagnation relative lue par CASSANDRA-RH)
// n'avait jamais eu de vérification mécanique contre la table maîtresse réelle — seul un test
// check-house.mjs affirmait une borne basse figée ("au moins 14"), qu'il faudrait remonter à la
// main à chaque nouvel Agent sans que rien ne le signale. Réutilise `parseToolsTable()` (déjà ici,
// jamais une seconde lecture), `slugifyAgentName()` (même découpage `primaryName` que partout
// ailleurs dans ce fichier) — jamais un second calcul.
// ————————————————————————————————————————————————————————————————————————
// LA TABLE MAÎTRESSE EST TENUE À LA MAIN, ET PERSONNE NE VÉRIFIAIT CE QU'ELLE IGNORE (#1016)
// ————————————————————————————————————————————————————————————————————————
//
// LE TROU : `docs/regles-de-travail.md` §7ter porte un tableau — une ligne par outil, avec son
// coût, son déclenchement, son statut — que plusieurs garde-fous lisent comme s'il était le
// recensement du dépôt. Il est écrit à la main. Mesuré le 2026-09-28 : **62 lignes pour 83 scripts
// réels**. Et la démonstration est déjà payée : `findToolsMissingFromMenu()` rendait « aucun outil
// muet » en se fondant sur cette table — un vert qui mesurait l'ignorance de la table, pas la
// couverture du catalogue.
//
// LE PIÈGE, ET IL S'EST REFERMÉ DEUX FOIS CETTE NUIT AILLEURS (L43, L46) : la comparaison naïve
// — slug du nom de l'outil contre nom de fichier — rend **33 absents, dont une large majorité de
// faux**. Deux causes, toutes deux évitables : la table nomme « ARGUS » là où le fichier s'appelle
// `check-argus.mjs` (le slug ne peut pas tomber juste), et la moitié du dossier `scripts/` n'est
// pas faite d'outils du tout — bibliothèques partagées, infrastructure, scripts du produit.
// Un garde-fou qui accuse trente-trois fois pour sept vrais manques cesse d'être lu (leçon L4).
//
// D'OÙ LES DEUX FILTRES, tous deux DÉRIVÉS et jamais recopiés (Article 24) :
//   1. un script est « déclaré » si la table cite son NOM d'outil **ou** son nom de FICHIER —
//      c'est la table elle-même qui fournit les deux, on ne devine rien ;
//   2. un script n'est jugé que s'il est un OUTIL, ce que le classement iceberg de CASSANDRA sait
//      déjà dire : plomberie et infrastructure n'ont rien à faire dans une table d'outils.
// Mesure après les deux filtres : **33 → 16 → 7 vrais manques**. Les 9 écartés sont COMPTÉS et
// nommés dans le résultat, jamais tus — un dénominateur qu'on réduit sans dire qui on retire est
// un dénominateur qu'on choisit (leçon L5).
//
// CE QU'IL NE FAIT PAS, et c'est l'arbitrage de l'utilisateur, pas le mien : il n'écrit RIEN dans
// la table. Deux issues restent ouvertes — la dériver (elle perdrait ses colonnes de jugement : le
// coût réel en API, le déclenchement, le statut, qu'aucune sonde ne peut deviner) ou la garder
// manuelle en acceptant de la compléter. Ce garde-fou ne tranche pas : il rend le chiffre sans
// lequel la question ne peut pas être posée.
export function findScriptsAbsentsDeLaTable({ toolsTableMarkdown = lireTableMaitresse(), fichiers = null, groupeDe = null, lister = readdirSync, root = ROOT } = {}) {
  if (typeof toolsTableMarkdown !== "string" || !toolsTableMarkdown.trim()) {
    return { mesurable: false, pourquoi: `${CHEMIN_TABLE_MAITRESSE} est vide ou illisible — « aucun script absent » serait alors un satisfecit rendu sur zéro donnée (leçon L5)`, manquants: [], horsSujet: [] };
  }
  let scripts = fichiers;
  if (!scripts) {
    try { scripts = lister(join(root, "scripts")).map(String).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, "")); }
    catch { return { mesurable: false, pourquoi: "scripts/ illisible — rien n'a pu être recensé, ce qui n'est jamais la même chose qu'aucun manque", manquants: [], horsSujet: [] }; }
  }
  const declares = new Set();
  for (const m of toolsTableMarkdown.matchAll(/([a-z0-9._-]+)\.mjs/gi)) declares.add(m[1]);
  for (const row of parseToolsTable(toolsTableMarkdown)) declares.add(slugifyAgentName(primaryToolName(row.tool)));
  const absents = scripts.filter((slug) => !declares.has(slug));
  if (typeof groupeDe !== "function") {
    return { mesurable: true, filtreIceberg: false, declares: declares.size, examines: scripts.length,
      manquants: absents, horsSujet: [],
      pourquoi: "sans le classement iceberg, tout script absent est rendu — y compris les bibliothèques et l'infrastructure, qui n'ont rien à faire dans une table d'outils" };
  }
  const estUnOutil = (slug) => ["membre", "oublie"].includes(groupeDe(slug));
  return { mesurable: true, filtreIceberg: true, declares: declares.size, examines: scripts.length,
    manquants: absents.filter(estUnOutil),
    horsSujet: absents.filter((s) => !estUnOutil(s)) };
}

export function formatScriptsAbsentsLines(r) {
  if (!r?.mesurable) return ["=== SCRIPTS ABSENTS DE LA TABLE MAÎTRESSE : PAS MESURÉ ===", `  ${r?.pourquoi}`, "", "  Ce n'est PAS « aucun script absent »."];
  const L = [`=== SCRIPTS ABSENTS DE LA TABLE MAÎTRESSE — ${r.manquants.length} outil(s) sur ${r.examines} scripts examinés ===`, ""];
  L.push(`  ${r.declares} nom(s) déclarés par la table (nom d'outil ou fichier cité).`);
  if (r.horsSujet.length) L.push(`  ⚪ ${r.horsSujet.length} script(s) écartés parce qu'ils ne sont pas des outils (bibliothèque, infrastructure, plomberie) : ${r.horsSujet.join(", ")}.`);
  if (!r.filtreIceberg) L.push("  ⚠️ Classement iceberg non fourni : la liste ci-dessous mélange les outils et le reste.");
  L.push("");
  if (!r.manquants.length) L.push("  ✅ Chaque outil du dépôt a sa ligne dans la table.");
  for (const m of r.manquants) L.push(`  🟠 ${m} — aucune ligne de la table ne le nomme, ni par son nom ni par son fichier`);
  if (r.manquants.length) L.push("      La table porte des colonnes qu'aucune sonde ne devine (coût réel, déclenchement, statut) : la compléter est une décision humaine, jamais une génération.");
  return L;
}

export function findScriptsMissingFromAgentFiles(toolsTableMarkdown = lireTableMaitresse(), agentScriptFiles = AGENT_SCRIPT_FILES) {
  const known = new Set(Object.keys(agentScriptFiles));
  return parseToolsTable(toolsTableMarkdown)
    .filter((row) => row.statut === "Agent")
    .map((row) => primaryToolName(row.tool))
    .map((primaryName) => slugifyAgentName(primaryName))
    .filter((slug) => !known.has(slug));
}

// checkAgentOnboarding() — la « séance d'accueil du nouveau collaborateur » (2026-09-20, demande
// explicite de l'utilisateur : « le coordinateur a pour rôle également de s'assurer que tous les
// outils sont bien câblés entre eux [...] lors de l'arrivée d'un nouveau membre de l'équipe, il y a
// un check bien défini pour être sûr de le câbler avec tous les autres »). Formalise ce qui était
// fait à la main, de façon incomplète, à chaque nouvel Agent cette session (3 raccordements
// oubliés pour THE-DEEP-READER, retrouvés seulement après coup). Réutilise `parseToolsTable()`
// (lecture par nom de colonne, jamais par position — cf. le bug corrigé le même jour) et
// `PRESTATIONS`, jamais une seconde lecture de la table.
//
// Vérifie les points de câblage DÉCIDÉS pour un Agent (cf. définition du statut Agent ci-dessus,
// docs/regles-de-travail.md) : présence dans la table maîtresse, présence dans le menu PRESTATIONS,
// instanciation (`docs/referentiel/<slug>.md`), registre (`docs/<slug>/`), et blueprint
// (`docs/<slug>-blueprint.md`) — sauf si l'agent est explicitement déclaré `cousinOf` un autre
// (seul cas actuel : THE-DEEP-READER, cousin de THE-FINAL-JUDGE). Jamais une vérification des
// TESTS eux-mêmes (check-house.mjs le fait déjà à chaque commit, aucune raison de le refaire ici).
// primaryToolName() (2026-09-23) — LE NOM PRINCIPAL D'UNE CELLULE DE LA TABLE MAÎTRESSE, isolé ici
// parce que le même découpage était recopié à l'identique dans trois fonctions de ce fichier
// (`badgeWarningsForOutils`, `findToolsMissingFromMenu`, `findScriptsMissingFromAgentFiles`) et
// OUBLIÉ dans un quatrième appelant écrit le même jour (THE-EQUALIZER), qui a aussitôt fabriqué
// dix-sept faux écarts : la cellule entière, parenthèse de précision comprise, devenait le slug
// (« docs/referentiel/cassandra-rh-scripts-cassandra-rh-mjs.md »), donc tout manquait.
//
// LA RAISON DU DÉCOUPAGE, pour qui la modifierait : une cellule de la table maîtresse porte le nom
// de l'outil, puis une précision entre parenthèses ou après une barre oblique (le fichier de
// script, un ancien nom, un surnom). Seul ce qui précède fait identité — c'est la convention de la
// table elle-même, pas une heuristique.
export function primaryToolName(tool) {
  return String(tool ?? "").split(/[/(]/)[0].trim();
}

// Les accents sont TRANSLITÉRÉS avant d'être filtrés, jamais jetés (2026-09-23). Sans cette
// normalisation, « MOÏSE-TABLES-DE-LOI » donnait le slug `mo-se-tables-de-loi` : le « ï » tombait
// dans le filtre `[^a-z0-9]` et coupait le mot en deux, si bien que l'audit d'intégration cherchait
// six fichiers qui n'existeraient jamais et déclarait l'outil incomplet alors qu'il était complet.
// Le premier outil au nom français a suffi à le révéler — et le projet travaille EN FRANÇAIS, donc
// le prochain l'aurait heurté aussi. C'est un défaut d'évolutivité au sens exact de l'Article 24 :
// la dérivation ne supportait qu'un alphabet qu'on avait eu jusque-là par hasard.
export function slugifyAgentName(name) {
  return sansAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// toolIdentitySlug() (2026-09-22) — RECONNAÎTRE LE MÊME OUTIL VU DE DEUX ENDROITS, ce qui n'est pas
// la même question que slugifyAgentName(). Cette dernière construit un CHEMIN de documentation
// (`docs/referentiel/<slug>.md`) et ne doit donc jamais changer : les fichiers existent sous ces
// noms. Celle-ci construit une IDENTITÉ pour comparer deux mentions du même outil entre sources
// différentes, où les conventions divergent honnêtement : la table maîtresse écrit « Doc-Report »
// et « check-spirit.mjs », le disque écrit `scripts/doc-report.mjs`, le registre écrit
// « check-spirit ». Trouvé en lisant le premier rendu réel de l'organigramme, où Doc-Report
// apparaissait deux fois et check-spirit à deux rangs différents. Retire donc le complément entre
// parenthèses ou après une barre oblique, PUIS l'extension de fichier, avant de slugifier — jamais
// une troisième règle de nommage inventée à côté, toujours slugifyAgentName() au bout.
export function toolIdentitySlug(name) {
  const principal = primaryToolName(name).replace(/\.(mjs|js|ts|tsx)$/i, "");
  return slugifyAgentName(principal);
}

// CLASSIQUE_STATUT (2026-09-21, reclarification explicite : « membre certifié couvre les deux
// catégories ») : la valeur exacte attendue dans la colonne Statut de la table maîtresse pour un
// « Membre certifié (classique) » — LE-COORDINATEUR, CIRCLE-TASKS, route-booster, tool-brain.
// CERTIFIABLE_STATUTS regroupe les deux statuts éligibles au badge (Agent = connaissance propre,
// classique = sans), jamais recopié en dur ailleurs.
export const CLASSIQUE_STATUT = "Membre certifié (classique)";
export const CERTIFIABLE_STATUTS = ["Agent", CLASSIQUE_STATUT];

export function checkAgentOnboarding(agentName, {
  toolsTableMarkdown,
  prestations = PRESTATIONS,
  existingPaths = new Set(),
  cousinOf = null,
  registryPathPrefix = null,
  // blueprintPath (2026-09-22, en certifiant Smart Breaker) — même patron que registryPathPrefix
  // juste au-dessus, et pour la même raison : un chemin qui dévie de la convention doit être
  // DÉCLARÉ par l'appelant, jamais deviné ni silencieusement toléré. Cas réel : le blueprint de
  // Smart Breaker s'appelle `docs/outil-resilience-api.md` parce qu'il a été écrit AVANT que le
  // surnom n'existe ; le renommer casserait les renvois croisés de plusieurs documents. Distinct de
  // `cousinOf`, qui dit « cet Agent n'a PAS de blueprint propre, et c'est voulu » — ici il en a bien
  // un, simplement ailleurs.
  blueprintPath = null,
  claudeMdText = null,
  suiviText = null,
  axaCoveragePct = undefined,
  // axaCoverageBySlug (2026-09-22) : la couverture de TOUS les outils, indexée par slug, telle que
  // le relevé du post-commit la dépose (badgeSignalsAsContext()). Repli seulement — un appelant qui
  // fournit `axaCoveragePct` pour CET outil précis a forcément une mesure plus fraîche ou plus
  // ciblée, elle gagne toujours. Évite à chaque appelant de devoir refaire le lien slug→outil
  // lui-même (le bug primaryName déjà trouvé trois fois cette semaine vivait exactement là).
  axaCoverageBySlug = null,
  argusFindingsCount = undefined,
  harmoniaFindingsCount = undefined,
  cleanDirtyOldFlagged = undefined,
  cloneHunterFindingsCount = undefined,
  alwaysNewCodeFlagged = undefined,
  lastVerifiedAt = null,
  hasDocReportDecision = undefined,
  reciprocalWiring = null,
  // ownKnowledge (2026-09-21, reclarification explicite de l'utilisateur : « il y a des membres
  // certifiés qui ont une connaissance propre au projet et d'autres qui n'en ont pas [...] oui ce
  // sont tous des membres certifiés, mais créons 2 catégories » puis « membre certifié couvre les
  // deux catégories »). Par défaut `true` (comportement inchangé pour tout Agent/Sage/Gardien déjà
  // couvert par les tests existants) : la connaissance propre au projet exige une instanciation, un
  // registre et un blueprint. `false` désigne un « Membre certifié (classique) » — LE-COORDINATEUR,
  // CIRCLE-TASKS, route-booster, tool-brain — qui n'a AUCUNE connaissance propre à documenter à
  // part (il appelle/agrège ce que d'autres outils disent déjà) : ces 3 exigences ne le concernent
  // jamais, il reste néanmois un vrai membre certifié badgé 🎖️, jamais un simple Utilitaire nommé.
  ownKnowledge = true,
} = {}) {
  assertNotAPersonnage(agentName, "checkAgentOnboarding()");
  assertNomPropreDAgent(agentName, "checkAgentOnboarding()");
  const gaps = [];
  const slug = slugifyAgentName(agentName);
  const nameLower = agentName.toLowerCase();

  const tableRow = parseToolsTable(toolsTableMarkdown).find((row) => row.tool.toLowerCase().includes(nameLower));
  if (!tableRow) gaps.push("absent de la table maîtresse (docs/regles-de-travail.md, carte des outils)");

  // PRESTATIONS n'est requis QUE pour un outil "menu-worthy" (cf. isMenuWorthy(), même exemption que
  // findToolsMissingFromMenu()) — sans cette exemption, un outil de régulation interne à l'agent
  // (Smart Conso API, CHECK-LEVEL-TARGET) ressortait à tort comme un vrai manque, un faux positif
  // réel trouvé le 2026-09-20 en calibrant le badge ci-dessous contre les Agents existants.
  // MÊME RÈGLE QUE findToolsMissingFromMenu(), jamais une seconde (2026-09-25) : ce comparateur-ci
  // faisait sa propre correspondance littérale, et les deux se sont mises à diverger dès que le
  // menu s'est ouvert aux périodiques — l'un accusait AGENT DES NOMS, l'autre non. Deux garde-fous
  // qui répondent différemment à la même question sont pires qu'un seul.
  const cible = normaliserNomDOutil(nameLower);
  const inMenu = prestations.some((p) => p.outils.some((o) => normaliserNomDOutil(o) === cible));
  if (!inMenu && (!tableRow || isMenuWorthy(tableRow))) gaps.push("absent du menu PRESTATIONS (scripts/le-coordinateur.mjs)");

  // Instanciation/registre/blueprint : exigés seulement pour un membre à connaissance propre au
  // projet (Sage/Gardien) — un « Membre certifié (classique) » (ownKnowledge: false) n'a par
  // définition rien de propre à documenter à part, ces 3 gaps ne le concernent jamais.
  const registryPrefix = registryPathPrefix ?? `docs/${slug}/`;
  // Calculé UNE fois ici plutôt que dans le bloc de vérification : le contrôle plus bas et la ligne
  // de validation affichée plus loin doivent nommer exactement le même chemin (cf. le commentaire
  // de cette ligne de validation — un chemin annoncé différent du chemin vérifié envoie le lecteur
  // vers un fichier fantôme).
  const attenduBlueprint = blueprintPath ?? `docs/${slug}-blueprint.md`;
  if (ownKnowledge) {
    if (!existingPaths.has(`docs/referentiel/${slug}.md`)) gaps.push(`instanciation manquante (docs/referentiel/${slug}.md)`);

    // Registre : chemin standard docs/<slug>/, SAUF déviation explicitement déclarée (trouvaille
    // réelle en calibrant contre THE-DEEP-READER, dont le registre vit dans
    // docs/suivi/relectures-lourdes/ — jamais un chemin deviné, toujours déclaré par l'appelant).
    if (![...existingPaths].some((p) => p.startsWith(registryPrefix))) gaps.push(`registre manquant (${registryPrefix})`);

    if (!cousinOf && !existingPaths.has(attenduBlueprint)) {
      gaps.push(`blueprint manquant (${attenduBlueprint}) — si c'est volontaire (cousin d'un autre Agent), le déclarer via l'option cousinOf plutôt que de laisser ce point sans réponse`);
    }
  }

  // 6e type de gap (tâche #165, Doc-Report, 2026-09-21) : un nouvel outil qui produit un registre
  // mais n'a reçu AUCUNE décision HTML/texte enregistrée dans scripts/doc-report.mjs::REGISTRIES.
  // `undefined` (jamais vérifié) est distinct de `false` (vérifié et manquant) — même discipline que
  // axaCoveragePct ci-dessus, un appelant qui ne fournit pas cette info ne doit jamais fabriquer un
  // gap qu'il n'a pas réellement constaté.
  if (hasDocReportDecision === false) {
    gaps.push("aucune décision HTML/texte enregistrée pour ce nouvel outil (Doc-Report, scripts/doc-report.mjs::REGISTRIES) — à trancher explicitement, jamais un défaut silencieux");
  }

  // CLAUDE.md lui-même (2026-09-20, demande explicite de l'utilisateur : « fiabilise/enrichis ce
  // process [...] pour en tirer de vrais bénéfices ») — angle mort réel du premier jet : la table
  // maîtresse et PRESTATIONS étaient vérifiées, jamais CLAUDE.md, alors que c'est le document TOUJOURS
  // relu (Article 13) et que j'ai dû l'éditer à la main pour chaque nouvel Agent cette session.
  // Même dispense pour les 2 sous-vérifications CLAUDE.md liées à la connaissance propre : un
  // Membre certifié (classique) n'a ni bullet docs/referentiel/<slug>.md ni section blueprint —
  // il vit entièrement dans docs/regles-de-travail.md §7ter (cf. LE-COORDINATEUR/CIRCLE-TASKS).
  if (claudeMdText != null && ownKnowledge) {
    if (!claudeMdText.includes(`docs/referentiel/${slug}.md`)) {
      gaps.push("absent de la section « Référentiel technique » de CLAUDE.md (bullet docs/referentiel/<slug>.md)");
    }
    // Deux formes valent DÉCLARATION dans CLAUDE.md, jamais une seule (élargi le 2026-09-22) :
    // la section dédiée historique, OU une ligne dans le tableau « ## Catalogue — blueprint
    // exportable » qui les condense. Sans cette seconde forme, le jour où ecotoken remplace les 22
    // sections par leur catalogue, les 22 outils perdraient leur badge d'un coup — une régression
    // provoquée par un allègement, exactement ce que le garde-fou de la charte interdit. Ce qui est
    // réellement exigé n'a jamais été « une section » mais « être déclaré ici », et le tableau le
    // fait mieux, avec le renvoi vers le blueprint sur la même ligne.
    const nomEnTitre = slug.replace(/-/g, "[- ]");
    // Le texte cherché est normalisé comme l'est le slug : sans ça, un nom accentué dans le tableau
    // ne serait jamais reconnu par un slug qui, lui, ne porte plus d'accent (cf. sansAccents()).
    const charteSansAccents = sansAccents(claudeMdText);
    const aSaSection = new RegExp(`^## .*${nomEnTitre}.*blueprint exportable`, "im").test(charteSansAccents);
    // La ligne doit citer un vrai document : un nom seul dans une cellule ne déclare rien. On ne
    // cherche PAS le mot « blueprint » dans la ligne — l'Outil de résilience API prouve qu'un
    // blueprint peut s'appeler autrement (`docs/outil-resilience-api.md`).
    const aSaLigneDeCatalogue = new RegExp(`^\\|\\s*${nomEnTitre}\\s*\\|.*\`docs/[^\`]+\\.md\``, "im").test(charteSansAccents);
    if (!cousinOf && !aSaSection && !aSaLigneDeCatalogue) {
      gaps.push(`absent de CLAUDE.md, ni comme section "## ... — blueprint exportable" ni comme ligne du tableau « Inventaire documentaire des outils » (attendu puisqu'il a un blueprint propre)`);
    }
  }

  // docs/suivi/ (réel si le texte est fourni, jamais un chemin deviné en son absence) — un Agent
  // construit sans une seule ligne de suivi violerait la règle "toute tâche substantielle DOIT être
  // documentée dans docs/suivi/" (docs/systeme-de-suivi.md), au même titre qu'un test manquant.
  if (suiviText != null && !sansAccents(suiviText).toLowerCase().includes(sansAccents(nameLower))) {
    gaps.push("aucune mention trouvée dans docs/suivi/ — sa construction ne serait pas tracée dans le système de suivi durable");
  }

  // Câblage réciproque (2026-09-22, demande explicite de l'utilisateur : « je veux [...] celle qui
  // dit que l'agent-script est bien câblé avec tous les autres, et tous les autres sont bien câblés à
  // lui »). Généralise et rend mécanique le type de trou trouvé deux fois le même soir à l'arrivée de
  // CLONE-HUNTER comme Gardien (câblé dans le post-commit hook, oublié dans HYPER-SCAN-CHECKPOINT) :
  // les 6 vérifications ci-dessus regardent seulement "cet Agent existe-t-il aux bons endroits ?",
  // jamais "les AUTRES systèmes le mentionnent-ils réellement là où ils le devraient ?". L'appelant
  // fournit un tableau hétérogène de {label, ok} — le contenu exact dépend du type d'Agent (pour un
  // Gardien sacré : présence dans check-last-commit.mjs, dans hyper-scan-checkpoint.mjs, exclusion de
  // CIRCLE_ITEMS ; pour un Membre ordinaire : présence dans le menu PRESTATIONS, référence dans
  // organisation-agence.md) — checkAgentOnboarding() reste agnostique du détail, il ne fait
  // qu'agréger honnêtement ce que l'appelant a déjà vérifié. `null` (jamais fourni) reste silencieux,
  // jamais un gap fabriqué — même discipline que axaCoveragePct/claudeMdText ci-dessus.
  if (reciprocalWiring) {
    for (const { label, ok } of reciprocalWiring) {
      if (!ok) gaps.push(`câblage réciproque manquant : ${label}`);
    }
  }

  // Rappels : jamais vérifiables mécaniquement avec une confiance suffisante pour compter comme un
  // vrai "gap" (un faux positif serait pire qu'un oubli réel), mais des points RÉELLEMENT oubliés au
  // moins une fois cette session (THE-DEEP-READER) — toujours rendus, jamais un blocage.
  const rappels = [
    "Canaux de consultation documentés (qui peut déclencher cet Agent : moi, l'utilisateur, un autre outil ?) — cf. le modèle « Trois canaux de consultation » de THE-DEEP-READER dans docs/regles-de-travail.md.",
    "CASSANDRA-RH a-t-elle consigné ce nouvel Agent dans la liste de l'équipe (une fois CASSANDRA-RH construite) ?",
  ];

  // Badge (2026-09-20, demande explicite de l'utilisateur : « la remise de son badge [...] c'est
  // cassandra qui supervise ces opérations, le coordinateur vérifie que tous les membres de
  // l'équipe ont bien leur badge »). Jamais un fait persisté à part : le badge N'EST QUE le résumé
  // lisible de `complet`, recalculé à chaque appel — décision explicite de l'utilisateur (« photo
  // instantanée », jamais un acquis qui pourrait rester vrai après coup alors que l'état réel a
  // changé). Un Agent SANS ce badge est un signal d'anomalie à investiguer (cf. `rappels`
  // ci-dessus), jamais un verrou qui empêcherait l'Agent de fonctionner (Article 0 : rien ne doit
  // jamais bloquer le jeu réel pour une question d'outillage de travail). LE-COORDINATEUR est
  // aujourd'hui celui qui délivre ce badge de fait (CASSANDRA-RH n'existe pas encore) ; une fois
  // construite, elle affichera/consultera ce même résultat, jamais un second calcul indépendant.
  //
  // Catégorie (2026-09-22, demande explicite de l'utilisateur : « le badge de chaque employé de
  // l'agence codex mentionne la catégorie à laquelle il appartient »). Lue depuis la même source que
  // CASSANDRA-RH utilisera plus tard (`AGENT_CATEGORIES`, lib-shell.mjs — miroir de
  // docs/referentiel/organisation-agence.md), jamais une seconde classification recalculée ici.
  // `undefined` pour un Agent absent de cette table (oubli de mise à jour, ou script pas encore un
  // Agent statutaire) — affiché tel quel comme un signal d'écart, jamais masqué par une valeur par
  // défaut inventée.
  // Le badge affiche le RANG seul, jamais le libellé brut (2026-09-25, #754) : depuis que chaque
  // catégorie porte « Rang — Famille », l'afficher tel quel aurait allongé un badge que
  // l'utilisateur a validé dans sa forme courte, sans qu'il l'ait demandé. Sa demande d'origine
  // portait sur LA CATÉGORIE, c'est-à-dire le rang ; la famille est un second axe, qui a sa propre
  // sortie chez CASSANDRA-RH et n'a rien à faire sur un badge.
  const category = rangDeLaCategorie(AGENT_CATEGORIES[slug]);
  const categoryLabel = category ? ` (${category})` : " (catégorie non répertoriée — à ajouter dans AGENT_CATEGORIES)";
  // « (classique) » (2026-09-21, reclarification explicite ci-dessus) : même icône 🎖️ pour tous les
  // membres certifiés — seule la mention textuelle distingue un Membre certifié (classique, sans
  // connaissance propre) d'un Sage/Gardien (icône supplémentaire propre à ces deux sous-catégories,
  // gérée dans la documentation, jamais recalculée ici).
  const badge = gaps.length === 0
    ? `🎖️ Membre certifié${ownKnowledge ? "" : " (classique)"}${categoryLabel}`
    : `⚠️ Pas encore certifié${categoryLabel}`;

  // Échelle de couverture à 3 niveaux (tâche #224, 2026-09-20T23:50Z, texte source reproduit à
  // l'identique par l'utilisateur) : « en cours » (jamais scanné/très faible), « partiel »
  // (couverture réelle incomplète), « OK 100% ». Jamais une promesse de "zéro bug" — AXA-CHECK ne
  // peut mécaniquement prouver qu'une ligne EXÉCUTÉE est une ligne JUSTE. Format du "partiel" précisé
  // le 2026-09-21 (tâche #226, retrouvé sur relecture explicite de l'utilisateur, jamais deviné) :
  // chaque vérification KO nommée séparément, jointes par une virgule quand plusieurs — un
  // pourcentage entre parenthèses UNIQUEMENT pour AXA-CHECK (seul signal chiffré ; ARGUS/HARMONIA/
  // CLEAN-DIRTY-OLD restent binaires, jamais un KO nu accompagné d'un faux pourcentage). « OK 100% »
  // exige les 6 Gardiens sacrés du code (Article 20) au vert ensemble — AXA-CHECK 100%, zéro
  // trouvaille ARGUS, zéro trouvaille HARMONIA, zéro signal CLEAN-DIRTY-OLD, zéro trouvaille
  // CLONE-HUNTER, zéro signal ALWAYS-NEW-CODE — jamais un sous-ensemble (déjà corrigé une première fois le 2026-09-21
  // quand le premier jet oubliait CLEAN-DIRTY-OLD, puis une seconde fois le même soir à l'arrivée de
  // CLONE-HUNTER comme 5e Gardien, puis ALWAYS-NEW-CODE (couche légère seulement) comme 6e le
  // 2026-09-21 — même défaut structurel à chaque fois : un nouveau Gardien doit systématiquement
  // rejoindre CETTE liste, jamais seulement le post-commit hook). Distinct du badge lui-même (jamais
  // conditionné par la couverture).
  const pctEffectif = axaCoveragePct ?? axaCoverageBySlug?.[slug];
  const koParts = [];
  if (argusFindingsCount) koParts.push("KO ARGUS");
  if (harmoniaFindingsCount) koParts.push("KO HARMONIA");
  if (cleanDirtyOldFlagged) koParts.push("KO CLEAN-DIRTY-OLD");
  if (cloneHunterFindingsCount) koParts.push("KO CLONE-HUNTER");
  if (alwaysNewCodeFlagged) koParts.push("KO ALWAYS-NEW-CODE");
  if (pctEffectif != null && pctEffectif < 100) koParts.push(`KO AXA-CHECK ${Math.round(pctEffectif)}%`);

  // Second défaut de la même famille, trouvé le 2026-09-22 en fiabilisant le relevé ci-dessus : un
  // Gardien NON CONSULTÉ (signal `undefined` — il dormait à ce commit, ou l'appelant ne le fournit
  // pas) était traité exactement comme un Gardien consulté et vert, puisque `if (compte)` ne
  // distingue pas `undefined` de `0`. Un outil pouvait donc décrocher « OK 100% » — palier qui
  // EXIGE explicitement les 6 Gardiens au vert ENSEMBLE — alors que trois d'entre eux n'avaient
  // jamais regardé son code. C'est la même confusion « absence de mesure = mesure verte » corrigée
  // partout ailleurs cette semaine (mention ≠ lancement, clé absente ≠ clé saine).
  //
  // Corrigé SANS ajouter un 4e palier : l'échelle à 3 niveaux est calibrée par l'utilisateur (tâche
  // #224), on ne la réécrit pas pour un cas qu'elle couvre déjà — une vérification incomplète EST
  // « en cours », au sens propre. Seule la précision du libellé change, pour ne jamais confondre
  // « personne n'a rien mesuré » et « 4 Gardiens sur 6 ont répondu, au vert ».
  const nonConsultes = [];
  if (pctEffectif == null) nonConsultes.push("AXA-CHECK");
  if (argusFindingsCount === undefined) nonConsultes.push("ARGUS");
  if (harmoniaFindingsCount === undefined) nonConsultes.push("HARMONIA");
  if (cleanDirtyOldFlagged === undefined) nonConsultes.push("CLEAN-DIRTY-OLD");
  if (cloneHunterFindingsCount === undefined) nonConsultes.push("CLONE-HUNTER");
  if (alwaysNewCodeFlagged === undefined) nonConsultes.push("ALWAYS-NEW-CODE");

  let couvertureTier;
  let couvertureLabel;
  if (koParts.length) {
    couvertureTier = "partiel";
    couvertureLabel = `partiel (${koParts.join(", ")})`;
  } else if (nonConsultes.length === 6) {
    couvertureTier = "en cours";
    couvertureLabel = "en cours (jamais scanné ou très faible)";
  } else if (nonConsultes.length) {
    couvertureTier = "en cours";
    couvertureLabel = `en cours (${6 - nonConsultes.length}/6 Gardiens au vert — ${nonConsultes.join(", ")} non consulté(s) à ce relevé)`;
  } else {
    couvertureTier = "OK 100%";
    couvertureLabel = "OK 100%";
  }
  const couverture = { tier: couvertureTier, label: couvertureLabel };
  // Date de dernière vérification (2026-09-21, demande explicite) : jamais une donnée fabriquée —
  // seulement affichée quand l'appelant la fournit réellement (moment du scan AXA-CHECK/ARGUS/
  // HARMONIA/CLEAN-DIRTY-OLD ayant produit ces chiffres), jamais devinée ni datée du jour courant.
  const verifiedSuffix = lastVerifiedAt ? ` (vérifié le ${lastVerifiedAt})` : "";

  // Message (2026-09-22, demande explicite de l'utilisateur : « je veux toutes les validations,
  // surtout celle qui dit que l'agent-script est bien câblé avec tous les autres [...] et ses
  // prestations figurent bien au catalogue du coordinateur »). Remplace l'ancienne liste FIXE
  // ("blueprint, instanciation, registre, mention CLAUDE.md, présence PRESTATIONS", toujours
  // affichée à l'identique quels que soient les paramètres réellement fournis) par une énumération
  // CONSTRUITE à partir de ce qui a été réellement vérifié — même discipline que le reste de la
  // fonction (`undefined`/`null` = jamais vérifié, jamais listé comme si ça l'avait été).
  const validations = ["table maîtresse (docs/regles-de-travail.md §7ter)"];
  // Nommé « le-catalogue-du-coordinateur » le 2026-09-22 à la demande explicite de l'utilisateur :
  // « je veux nommer ce catalogue [...] besoin de ce nom pour éviter les confusions ». Le surnom
  // désigne la liste PRESTATIONS et elle seule — à ne jamais confondre avec le catalogue d'offres
  // NOMMÉ et historisé (docs/coordinateur-catalogue/), qui en est une photo datée, ni avec la table
  // maîtresse de docs/regles-de-travail.md §7ter, qui décrit les outils et non les prestations.
  if (inMenu) validations.push("ajouté au catalogue du coordinateur (le-catalogue-du-coordinateur)");
  if (ownKnowledge) {
    validations.push(`instanciation (docs/referentiel/${slug}.md)`);
    validations.push(`registre (${registryPrefix})`);
    // Le chemin ANNONCÉ doit être celui réellement VÉRIFIÉ (corrigé le 2026-09-22 en lisant le bloc
    // de certification de Smart Breaker, qui annonçait fièrement « blueprint
    // (docs/smart-breaker-blueprint.md) » — un fichier qui n'existe pas, alors que le contrôle avait
    // bien lu le vrai chemin déclaré). Une validation qui nomme autre chose que ce qu'elle a
    // contrôlé est pire qu'une validation absente : elle envoie le lecteur vers un fichier fantôme.
    validations.push(cousinOf ? `blueprint (cousin de ${cousinOf})` : `blueprint (${attenduBlueprint})`);
  }
  if (claudeMdText != null && ownKnowledge) validations.push("mention CLAUDE.md");
  if (suiviText != null) validations.push("trace docs/suivi/");
  if (hasDocReportDecision != null) validations.push("décision Doc-Report (HTML/texte)");
  if (reciprocalWiring) {
    for (const { label, ok } of reciprocalWiring) if (ok) validations.push(label);
  }
  const message = `🎖️ ${agentName} obtient son badge — toutes les validations réunies : ${validations.join(", ")}. Couverture de code : ${couvertureLabel}${verifiedSuffix}.`;

  // description/companions (2026-09-21, demande explicite de l'utilisateur pour fiabiliser le
  // gabarit du bloc de certification : « une courte description, savoir si tout est bien pluggé,
  // savoir aussi avec quels outils cet outil est susceptible de se plugger », même format assuré à
  // chaque fois) — jamais une 2e donnée hand-maintained : `description` vient de la colonne "Ce
  // qu'il détecte/régule" déjà présente dans la table maîtresse (tableRow, jamais fabriquée si la
  // ligne ou la colonne est absente), `companions` de toolCompanions() sur le catalogue PRESTATIONS
  // déjà fourni à cette fonction (jamais un second catalogue).
  const description = tableRow?.description || undefined;
  const companions = toolCompanions(agentName, prestations);

  return { agentName, slug, gaps, rappels, badge, complet: gaps.length === 0, couverture, message, description, companions };
}

// Cérémonie de certification (2026-09-21, demande explicite de l'utilisateur : « quand tu affiches
// "membre certifié" tu ne donnes pas l'état des infos du badge ni l'icône badge [...] le moment de
// l'intégration doit être bien repérable [...] imagine un système autour de ce moment pour que je
// sois bien informé »). Trois choix calibrés explicitement : un bloc visuellement à part (jamais
// mêlé au reste du compte rendu), déclenché SEULEMENT la première fois qu'un Agent devient certifié
// (jamais répété à chaque mention ultérieure du même badge), via une petite fonction dédiée plutôt
// qu'une habitude d'écriture non vérifiable. Qui délivre le badge reste déjà tranché ailleurs
// (§"Le badge" ci-dessus, docs/regles-de-travail.md) : LE-COORDINATEUR aujourd'hui, CASSANDRA-RH en
// consultation/affichage une fois construite — cette cérémonie ne change rien à cette règle, elle
// rend seulement le moment VISIBLE.
//
// `loadBadgeCeremonyHistory()` réutilise `loadJson()` de tool-usage.mjs (jamais une 4e copie — la
// duplication exacte que CLONE-HUNTER venait de trouver ce même soir entre smart-conso-api.mjs et
// smart-conso-token.mjs). Journal local, jamais committé (`.badge-ceremony-history.json`, déclaré
// dans .gitignore et dans Doc-Report LOCAL_JOURNALS), qui ne retient qu'UNE date par agent : la
// première fois où `complet` a été vu vrai — jamais mis à jour ensuite, exactement ce qui permet de
// détecter mécaniquement "première fois" plutôt que de compter sur ma seule mémoire de session.
export function loadBadgeCeremonyHistory(historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  return loadJson(historyPath, { certifications: {} });
}

export function hasBeenCertifiedBefore(slug, history) {
  return Boolean(history?.certifications?.[slug]);
}

export function recordCertification(slug, now = Date.now(), historyPath = BADGE_CEREMONY_HISTORY_PATH, { texte } = {}) {
  const history = loadBadgeCeremonyHistory(historyPath);
  history.certifications = history.certifications ?? {};
  if (!history.certifications[slug]) history.certifications[slug] = new Date(now).toISOString();
  // PRODUITE ≠ REÇUE (2026-09-22, manquement réel : ecotoken a été certifié, le bloc a bien été
  // imprimé par le crochet post-commit… et je l'ai filtré en lisant la sortie, puis résumé en une
  // phrase — exactement ce que cette cérémonie existe pour empêcher, et exactement ce que
  // l'utilisateur avait déjà signalé pour clone-hunter). La règle était écrite, précise, et sans
  // aucun mécanisme : rien ne distinguait « bloc affiché dans un terminal » de « bloc arrivé dans
  // la conversation ». On marque donc chaque cérémonie NON RELAYÉE jusqu'à ce qu'elle le soit
  // explicitement ; tant qu'elle ne l'est pas, elle est rappelée à chaque passage réseau.
  enregistrerARelayer(history, slug, texte, now);
  writeFileSync(historyPath, JSON.stringify(history, null, 1));
  return history;
}

// enregistrerARelayer() — LE POINT UNIQUE où une cérémonie due est consignée (2026-09-23, tâche
// #210). Avant ce jour, les deux voies (certification initiale, mise à jour de badge) faisaient
// chacune le même geste en double, et toutes deux n'inscrivaient QU'UNE DATE.
//
// LE TROU, ET IL REND SA PROPRE RÈGLE IMPOSSIBLE À TENIR. Le crochet exige d'afficher le bloc
// « TEL QUEL dans la réponse (jamais résumé en une phrase) ». Or ce qui était conservé — un slug et
// une date — ne permet pas de réafficher quoi que ce soit : le texte ne vivait que dans la valeur
// de retour, imprimée une fois par le crochet puis perdue. Une cérémonie non relayée le jour même
// devenait donc définitivement non relayable, et le rappel qui revenait à chaque commit réclamait
// quelque chose que plus personne ne pouvait produire.
//
// Constaté pour de vrai le 2026-09-22 : safe-export et tool-learning, produites à 16h51, réclamées
// à chaque commit pendant des heures, et irrécupérables — `formatBadgeCeremonyAnnouncement()` exige
// un objet `result` complet que `checkAllAgentBadges()` ne rend plus sans son contexte d'origine.
//
// C'est la même faute que partout ailleurs dans ce paysage, à un cran de plus : ailleurs un
// mécanisme calculait sans rien imprimer ; ici il imprime une fois et ne garde rien. Ce qui doit
// être relayé, c'est le TEXTE — on garde donc le texte, et la date à côté.
export function enregistrerARelayer(history, slug, texte, now = Date.now()) {
  history.aRelayer = history.aRelayer ?? {};
  // Jamais d'écrasement : la PREMIÈRE production fait foi, comme la date de première certification.
  // Réécrire à chaque passage ferait glisser la cérémonie due vers un état plus récent, et on
  // relaierait autre chose que ce qui avait été annoncé.
  if (slug in history.aRelayer) return history;
  history.aRelayer[slug] = { produiteLe: new Date(now).toISOString(), texte };
  return history;
}

// LECTURE TOLÉRANTE AU FORMAT ANCIEN, et surtout HONNÊTE sur ce qu'elle ne sait plus. Les entrées
// écrites avant ce commit sont de simples chaînes de date : leur texte n'existe nulle part et
// aucune reconstruction n'est possible. On le DIT (`texteConserve: false`) plutôt que de rendre un
// `texte: undefined` que l'appelant afficherait en « undefined » — troisième état, jamais un vide
// qui se ferait passer pour un contenu.
export function ceremonieDue(slug, entree) {
  if (typeof entree === "string") return { slug, produiteLe: entree, texte: undefined, texteConserve: false };
  const texte = entree?.texte;
  return { slug, produiteLe: entree?.produiteLe, texte, texteConserve: typeof texte === "string" && texte.trim().length > 0 };
}

// Les cérémonies produites mais jamais relayées à l'utilisateur. Une liste non vide est un
// manquement en cours, jamais une information de confort.
export function pendingCeremonies(historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  const h = loadBadgeCeremonyHistory(historyPath);
  return Object.entries(h.aRelayer ?? {}).map(([slug, entree]) => ceremonieDue(slug, entree));
}

// grouperCeremonies() (2026-09-25, tâche #860) — LA RÈGLE QUE L'UTILISATEUR A TRANCHÉE : « une
// cérémonie par CHANGEMENT RÉEL, jamais une par outil et par passage ».
//
// CE QUE LA MESURE A MONTRÉ, ET ELLE CONTREDISAIT MES DEUX HYPOTHÈSES. Vingt cérémonies attendaient
// d'être relayées, toutes sur le même motif. J'ai d'abord soupçonné un bruit d'oscillation (un
// badge qui fait l'aller-retour à chaque commit), puis un vrai changement collectif. C'était la
// seconde, en plus précis : **les vingt portent le même horodatage à la milliseconde près**
// (2026-09-25T08:06:24.838Z) et le même diff — la FAMILLE a disparu du libellé du badge.
//
// Et ce n'était pas un défaut : la tâche #754, le matin même, a délibérément scindé la catégorie en
// « Rang — Famille » et retiré la famille du badge (« elle sort chez CASSANDRA-RH et n'a rien à
// faire sur un badge »). Les vingt lignes sont donc la trace FIDÈLE d'un seul changement voulu qui
// touchait vingt membres.
//
// LE MANQUE N'ÉTAIT DONC PAS LÀ OÙ JE LE CROYAIS. Le code ne réannonçait déjà que sur un vrai
// changement — ça, c'était en place. Ce qui manquait : quand UNE cause change N membres d'un coup,
// il faut annoncer LA CAUSE une fois, pas la conséquence N fois. Vingt blocs identiques ne
// transportent pas vingt informations ; ils transportent une information et dix-neuf occasions de
// cesser de lire.
//
// CE QU'ON NE PERD PAS EN GROUPANT : la liste complète des membres touchés reste dans le bloc, donc
// rien n'est effacé. On change la FORME, jamais le contenu — et c'est la nuance qui distingue un
// regroupement d'un étouffement.
export function signatureDuChangement(c) {
  // La signature est la ligne « Ce qui a changé », pas le texte entier : deux membres qui subissent
  // le MÊME changement ont des blocs différents (leur nom, leur description, leurs compagnons) mais
  // la même cause. Grouper sur le texte entier n'aurait donc jamais rien groupé.
  const ligne = String(c?.texte ?? "").split("\n").find((l) => l.startsWith("Ce qui a changé :"));
  return ligne ? ligne.slice("Ce qui a changé :".length).trim() : null;
}

export function grouperCeremonies(enAttente = []) {
  const groupes = new Map();
  const isolees = [];
  for (const c of enAttente) {
    const sig = signatureDuChangement(c);
    // Une cérémonie dont le texte n'a pas été conservé n'a pas de signature lisible : elle reste
    // ISOLÉE plutôt que d'être rangée dans un groupe « inconnu » qui mélangerait des causes
    // différentes sous une même bannière — le contraire de ce que ce regroupement cherche.
    if (!sig) { isolees.push(c); continue; }
    if (!groupes.has(sig)) groupes.set(sig, []);
    groupes.get(sig).push(c);
  }
  const collectifs = [...groupes.entries()].filter(([, l]) => l.length > 1).map(([signature, membres]) => ({ signature, membres }));
  // Un groupe d'UN seul membre n'est pas un groupe : il est rendu tel quel, avec son bloc complet.
  for (const [, l] of groupes) if (l.length === 1) isolees.push(l[0]);
  return { collectifs, isolees, total: enAttente.length,
    economise: collectifs.reduce((t, g) => t + g.membres.length - 1, 0) };
}

export function formatCeremonieCollective(groupe) {
  const border = "━".repeat(60);
  return [
    border,
    `🔄 MISE À JOUR DE BADGE — ${groupe.membres.length} membres, une seule cause`,
    border,
    `Ce qui a changé, pour tous : ${groupe.signature}`,
    `Membres touchés : ${groupe.membres.map((c) => c.slug).sort().join(", ")}`,
    "Un seul changement a touché tous ces membres à la fois : il est annoncé une fois plutôt que",
    `${groupe.membres.length} fois. Aucun membre n'est perdu — ils sont nommés ci-dessus.`,
    border,
  ].join("\n");
}

// LE TEXTE DOIT SORTIR DU SCRIPT, sinon on n'a fait que déplacer le problème d'un cran : garder le
// bloc sans l'afficher vaudrait exactement ce que valait le fait de l'afficher sans le garder.
// Cette fonction rend le bloc prêt à être recopié tel quel dans la réponse.
export function formatPendingCeremonies(enAttente = []) {
  if (!enAttente.length) return "";
  const lignes = ["", "🎖️  CÉRÉMONIE(S) NON RELAYÉE(S) — à afficher TEL QUEL dans la réponse, jamais résumé en une phrase :"];
  // UNE CAUSE = UN BLOC (tâche #860). Les changements collectifs passent d'abord, groupés ; les
  // cérémonies vraiment individuelles gardent leur bloc complet juste après.
  const { collectifs, isolees, economise } = grouperCeremonies(enAttente);
  for (const g of collectifs) {
    lignes.push("");
    lignes.push(formatCeremonieCollective(g));
    lignes.push(`   → une fois affichée : node -e "import('./scripts/le-coordinateur.mjs').then(c=>${JSON.stringify(g.membres.map((m) => m.slug))}.forEach(s=>c.markCeremonyRelayed(s)))"`);
  }
  if (economise) lignes.push("", `(${economise} bloc(s) identique(s) évité(s) par regroupement — une cause, une annonce.)`);
  for (const c of isolees) {
    lignes.push("");
    if (c.texteConserve) {
      lignes.push(c.texte);
    } else {
      // L'aveu explicite, plutôt qu'une ligne vide qui passerait pour un oubli de l'agent.
      lignes.push(`⚠️  ${c.slug} — cérémonie produite le ${c.produiteLe}, mais son TEXTE n'a pas été conservé (entrée au format d'avant le 2026-09-23). Elle n'est pas récupérable : le dire est la seule réponse honnête, jamais en reconstituer une plausible.`);
    }
    lignes.push(`   → une fois affichée : node -e "import('./scripts/le-coordinateur.mjs').then(c=>c.markCeremonyRelayed('${c.slug}'))"`);
  }
  return lignes.join("\n");
}

// L'ARCHIVE DES CÉRÉMONIES (2026-09-25, tâche #510) — « la cérémonie enregistre qu'elle a eu lieu,
// jamais ce qu'elle disait ».
//
// LE DÉFAUT, MESURÉ : sur les 38 certifications du registre, **zéro** portait son texte. `aRelayer`
// est une FILE D'ATTENTE, pas une mémoire : elle tient le texte le temps que la cérémonie soit
// relayée, puis `markCeremonyRelayed()` faisait `delete` et il disparaissait pour de bon. Le seul
// reste durable était une date nue dans `certifications`. La tâche #210 avait ajouté le texte À LA
// FILE, ce qui est le bon geste à moitié : le texte existait, mais seulement en transit.
//
// POURQUOI ÇA COMPTE, et ce n'est pas de la nostalgie : la cérémonie est le seul endroit où sont
// écrits, ensemble, ce qu'un outil détecte, comment il est câblé et quelle couverture il avait le
// jour où il a été certifié. Reconstituer ça après coup demande de relire six registres — et la
// couverture de ce jour-là, elle, n'existe plus nulle part.
//
// TROIS ÉTATS, JAMAIS DEUX, et c'est la même honnêteté que `ceremonieDue()` juste au-dessus : une
// archive AVEC texte · une archive SANS texte (produite avant le 2026-09-23, irrécupérable, et on
// le dit) · pas d'archive du tout (jamais relayée, ou jamais certifiée). Fabriquer un texte
// plausible pour les 38 anciennes serait inventer une mesure là où il n'y en a plus.
export function archiverCeremonie(history, slug, entree, now = Date.now()) {
  history.archives = history.archives ?? {};
  // Jamais d'écrasement, même règle que la file : la PREMIÈRE cérémonie archivée fait foi. Une
  // seconde passe ne doit pas remplacer le texte d'origine par un texte recalculé plus tard.
  if (slug in history.archives) return history;
  const c = ceremonieDue(slug, entree);
  history.archives[slug] = {
    produiteLe: c.produiteLe,
    relayeeLe: new Date(now).toISOString(),
    texte: c.texteConserve ? c.texte : null,
    texteConserve: c.texteConserve,
  };
  return history;
}

// Le lecteur, avec ses trois états nommés — jamais un `undefined` que l'appelant afficherait tel quel.
export function ceremonieArchivee(slug, historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  const h = loadBadgeCeremonyHistory(historyPath);
  const a = h.archives?.[slug];
  if (!a) return { slug, etat: "aucune archive", pourquoi: "cette cérémonie n'a jamais été relayée, ou l'outil n'a jamais été certifié — deux choses différentes, que le registre des certifications distingue" };
  if (!a.texteConserve) return { slug, etat: "archivée sans texte", produiteLe: a.produiteLe, relayeeLe: a.relayeeLe, pourquoi: "produite avant le 2026-09-23, quand le texte n'était pas retenu : il n'existe nulle part et aucune reconstruction n'est possible — le dire est la seule réponse honnête" };
  return { slug, etat: "archivée", produiteLe: a.produiteLe, relayeeLe: a.relayeeLe, texte: a.texte };
}

// Marquer relayé n'est PAS automatique : ce serait se décerner l'acquittement à soi-même. C'est un
// geste explicite, fait une fois le bloc réellement écrit dans la réponse.
export function markCeremonyRelayed(slug, historyPath = BADGE_CEREMONY_HISTORY_PATH) {
  const h = loadBadgeCeremonyHistory(historyPath);
  if (!h.aRelayer || !(slug in h.aRelayer)) return { slug, deja: true };
  // ARCHIVER AVANT DE SUPPRIMER (#510) — l'ordre est tout : l'inverse perdrait exactement ce qu'on
  // cherche à garder, et c'est la faute que la version précédente commettait sans le savoir.
  archiverCeremonie(h, slug, h.aRelayer[slug]);
  delete h.aRelayer[slug];
  writeFileSync(historyPath, JSON.stringify(h, null, 1));
  return { slug, relayee: true, archivee: true };
}

// --- Le badge qui CHANGE, pas seulement le badge qui NAÎT (2026-09-22) --------------------------
//
// Manquement réel constaté par l'utilisateur (« tu n'as pas affiché le bloc badge ») : la cérémonie
// ne se déclenche QUE la toute première fois qu'un Agent devient complet. Passé ce jour-là, son
// badge est recalculé à chaque commit (photo instantanée, décision explicite) mais n'est plus jamais
// MONTRÉ — même quand il change réellement. Un outil qui perd une validation, qui voit sa couverture
// passer de « en cours » à 95 %, ou qui retombe à « pas encore certifié » ne produisait donc aucun
// événement visible : exactement le trou que la cérémonie existait pour fermer, décalé d'un cran.
//
// On retient donc, à côté de la date de première certification, le DERNIER ÉTAT annoncé de chaque
// badge. Un état différent produit un bloc « MISE À JOUR », distinct de la certification initiale
// (jamais la même en-tête : on ne re-certifie pas quelqu'un qui l'est déjà), et passe par le même
// mécanisme `aRelayer` — produire ne vaut jamais relayer.
//
// Bootstrap honnête : un Agent dont aucun état n'a encore été enregistré est enregistré EN SILENCE,
// jamais annoncé comme un changement. Affirmer « son badge a changé » alors qu'on n'a simplement
// jamais regardé avant serait la même confusion absence/mesure corrigée partout ailleurs.
export function badgeState(result) {
  return { badge: result.badge, tier: result.couverture?.tier, gaps: result.gaps?.length ?? 0 };
}

export function announceBadgeChange(result, { historyPath = BADGE_CEREMONY_HISTORY_PATH, now = Date.now() } = {}) {
  const history = loadBadgeCeremonyHistory(historyPath);
  if (!hasBeenCertifiedBefore(result.slug, history)) return null; // la certification initiale a sa propre voie
  const avant = history.etats?.[result.slug];
  const apres = badgeState(result);
  history.etats = history.etats ?? {};
  history.etats[result.slug] = apres;
  const change = avant && (avant.badge !== apres.badge || avant.tier !== apres.tier || avant.gaps !== apres.gaps);
  // Le texte se compose AVANT l'écriture du journal, jamais après : c'est lui qu'on consigne.
  // L'ordre inverse est précisément ce qui faisait perdre le bloc.
  const texte = change ? formatBadgeChangeAnnouncement(result, avant, apres) : undefined;
  if (change) enregistrerARelayer(history, result.slug, texte, now);
  writeFileSync(historyPath, JSON.stringify(history, null, 1));
  if (!change) return null;
  return texte;
}

export function formatBadgeChangeAnnouncement(result, avant, apres) {
  const border = "━".repeat(Math.max(20, result.agentName.length + 20));
  const diffs = [];
  if (avant.badge !== apres.badge) diffs.push(`statut : ${avant.badge} → ${apres.badge}`);
  if (avant.tier !== apres.tier) diffs.push(`couverture : ${avant.tier} → ${apres.tier}`);
  if (avant.gaps !== apres.gaps) diffs.push(`validations manquantes : ${avant.gaps} → ${apres.gaps}`);
  return [
    border,
    `🔄 MISE À JOUR DE BADGE — ${result.agentName}`,
    border,
    `Ce qui a changé : ${diffs.join(" · ")}`,
    ...lignesGarantiesDuBloc(result),
    border,
  ].join("\n");
}

// LES CINQ LIGNES GARANTIES, ÉCRITES UNE SEULE FOIS (2026-09-27, tâche #993, constat de
// CLONE-HUNTER). Les deux blocs — CERTIFICATION et MISE À JOUR — restent bien deux fonctions
// distinctes : l'enquête du 2026-09-22 avait tranché que cette séparation est DÉLIBÉRÉE (certifier
// n'est pas mettre à jour), et elle le reste. Ce qui était recopié, c'est leur CORPS commun.
//
// Et c'est précisément ce corps qui ne pouvait pas se permettre d'être écrit deux fois : le
// commentaire d'en-dessous PROMET « les mêmes lignes garanties dans CET ORDRE à chaque annonce ».
// Une garantie recopiée est une garantie qui peut diverger — il suffisait d'ajouter une ligne à la
// certification et de l'oublier à la mise à jour pour que la promesse cesse d'être vraie sans que
// rien ne le dise. Elle est désormais tenue par construction.
function lignesGarantiesDuBloc(result) {
  return [
    `Description : ${result.description || "non renseignée (colonne « Ce qu'il détecte/régule » absente de la table maîtresse)"}`,
    `Câblage : ${result.message}`,
    `Statut : ${result.badge}`,
    `Combine typiquement avec : ${result.companions?.length ? result.companions.join(", ") : "aucune combinaison connue dans le catalogue PRESTATIONS"}`,
    `Couverture : ${result.couverture.label}`,
  ];
}

// Le bloc lui-même : toujours visuellement séparé (bordures ASCII, jamais une phrase noyée dans un
// paragraphe), reprend tel quel le `message` déjà produit par checkAgentOnboarding() (jamais une
// seconde formulation qui pourrait diverger) plus le badge et la couverture en évidence.
// Gabarit fiabilisé (2026-09-21, demande explicite de l'utilisateur : « fiabilise le gabarit du
// bloc certification : même format assuré à chaque fois : j'ai besoin d'une courte description, de
// savoir si tout est bien pluggé, de savoir aussi avec quels outils cet outil est susceptible de se
// plugger ») — 3 lignes garanties dans CET ORDRE à chaque annonce, jamais un sous-ensemble variable
// selon ce qui a été calculé cette fois-là. Une absence réelle de donnée reste dite explicitement
// (« non renseignée », « aucune connue ») — jamais une ligne simplement omise, qui laisserait croire
// que la question n'a pas été posée.
export function formatBadgeCeremonyAnnouncement(result) {
  const border = "━".repeat(Math.max(20, result.agentName.length + 20));
  return [
    border,
    `🎖️ CERTIFICATION — ${result.agentName}`,
    border,
    ...lignesGarantiesDuBloc(result),
    border,
  ].join("\n");
}

// Point d'entrée unique à appeler après checkAgentOnboarding() : ne produit le bloc que si
// `complet` est vrai ET que ce n'est jamais arrivé avant pour ce slug — sinon `null` (rien à
// annoncer), jamais un bloc vide affiché quand même. Persiste la première certification au passage.
export function announceBadgeCeremony(result, { historyPath = BADGE_CEREMONY_HISTORY_PATH, now = Date.now() } = {}) {
  if (!result?.complet) return null;
  const history = loadBadgeCeremonyHistory(historyPath);
  if (hasBeenCertifiedBefore(result.slug, history)) return null;
  // Même ordre qu'ci-dessus : on FORME le bloc, puis on le consigne. Avant ce commit, la
  // certification était enregistrée d'abord et le texte produit en dernier, donc jamais retenu.
  const texte = formatBadgeCeremonyAnnouncement(result);
  recordCertification(result.slug, now, historyPath, { texte });
  // L'état de départ est enregistré ici même : sans ça, la toute première comparaison
  // d'announceBadgeChange() se ferait contre rien et le bloc « mise à jour » tomberait au commit
  // suivant sans qu'aucun changement réel n'ait eu lieu.
  const h = loadBadgeCeremonyHistory(historyPath);
  h.etats = h.etats ?? {};
  h.etats[result.slug] = badgeState(result);
  writeFileSync(historyPath, JSON.stringify(h, null, 1));
  return texte;
}

// checkAllAgentBadges() (2026-09-22, demande explicite de l'utilisateur : « tu crées un petit script
// pour gérer toute cette partie validation/intégration/badge/message [...] avec déclenchement auto
// quand le script reçoit son badge réellement dans le code »). Décision explicite prise avec
// l'utilisateur : jamais un nouveau fichier séparé — LE-COORDINATEUR porte déjà `checkAgentOnboarding()`
// et `announceBadgeCeremony()`, cette fonction ne fait que balayer TOUTE la table maîtresse plutôt que
// de dépendre d'un appel manuel outil par outil (ce que `badgeWarningsForOutils()` ci-dessus fait déjà,
// mais seulement pour les outils cités dans UNE prestation précise, jamais pour l'ensemble).
// `onboardingContext` suit exactement la même forme que `checkAgentOnboarding()` (mêmes clés,
// `agentOverrides` inclus) — le vrai rassemblement des données (CLAUDE.md, docs/suivi, couverture
// AXA-CHECK par script, câblage réciproque des Gardiens) reste la responsabilité de l'appelant
// (`scripts/hooks/check-last-commit.mjs`), jamais de cette fonction elle-même : elle reste pure et
// testable sans toucher au disque, exactement comme `checkAgentOnboarding()`.
// `primaryName` (2026-09-21, bug réel trouvé en fiabilisant CASSANDRA-RH le même soir) : passer
// `row.tool` BRUT à checkAgentOnboarding() slugifiait le texte ENTIER de la cellule Outil, y compris
// une précision entre parenthèses ("CASSANDRA-RH (scripts/cassandra-rh.mjs)", "CLONE-HUNTER
// (`scripts/clone-hunter.mjs`)") — produisant un slug jamais présent dans AGENT_CATEGORIES ni sur le
// disque, donc `complet:false` à tort pour TOUT Agent dont la cellule Outil porte une précision
// entre parenthèses, jamais annoncé même une fois réellement complet. Même découpage déjà établi
// ailleurs dans ce fichier (badgeWarningsForOutils(), findToolsMissingFromMenu()) — jamais une
// troisième règle divergente. `agentOverrides` est également indexé par ce nom propre, jamais la
// cellule brute (buildRealOnboardingContext() déclare ses overrides par nom propre, ex.
// "THE-DEEP-READER").
// integrationAudit() (2026-09-22) — RÉPONSE À UNE QUESTION DE L'UTILISATEUR, et la réponse était
// « non » : « lors de la ronde, on est ok qu'il y a un check pour chaque nouveau outil : bien
// intégré à tout, bien certifié, etc. ? ».
//
// Ce qui existait, et pourquoi ça ne suffisait pas :
//   · checkAllAgentBadges() n'annonce QUE des changements — une certification neuve ou un badge qui
//     bouge. Un membre incomplet depuis trois jours ne produit rien du tout : le silence d'un outil
//     d'annonce ne dit jamais « tout va bien », il dit « rien n'a bougé ». Encore une absence de
//     signal lue comme un signal positif.
//   · les garde-fous d'intégration (findScriptsMissingFromAgentFiles, findToolsMissingFromMenu,
//     findReportingToolsMissingFromCircle) tournent bien, mais à CHAQUE COMMIT via check-house —
//     jamais dans la Ronde, et jamais regroupés en une seule vue lisible.
//   · CASSANDRA ne voit que les membres DÉCLARÉS : un script d'outil posé sur le disque et jamais
//     inscrit dans l'organigramme lui est parfaitement invisible.
//
// Celui-ci répond à la question telle qu'elle est posée, d'un coup : QUI, à cet instant, n'est pas
// complètement intégré — qu'il vienne d'arriver ou qu'il traîne depuis longtemps. Il n'annonce rien
// et ne fête rien : il fait l'état des lieux. Il ne recalcule aucune règle d'intégration, il appelle
// checkAgentOnboarding() membre par membre (anti-doublon, §7ter).
export function integrationAudit(onboardingContext, { scriptsNonDeclares = [], absentsDuMenu = [], absentsDeLaRonde = [] } = {}) {
  if (!onboardingContext?.toolsTableMarkdown) {
    // Sans la table maîtresse, l'audit est IMPOSSIBLE, jamais « tout va bien » : un retour vide
    // serait lu comme un verdict propre alors qu'aucune mesure n'a eu lieu.
    return { mesurable: false, raison: "table maîtresse (docs/regles-de-travail.md) illisible ou absente — aucun membre n'a pu être vérifié" };
  }
  const rows = parseToolsTable(onboardingContext.toolsTableMarkdown).filter((r) => CERTIFIABLE_STATUTS.includes(r.statut));
  const incomplets = [];
  const nonVerifiables = [];
  for (const row of rows) {
    const primaryName = primaryToolName(row.tool);
    const overrides = onboardingContext.agentOverrides?.[primaryName] ?? {};
    let res;
    try {
      res = checkAgentOnboarding(primaryName, { ...onboardingContext, ownKnowledge: row.statut !== CLASSIQUE_STATUT, ...overrides });
    } catch (e) {
      // Un membre qu'on n'a pas pu évaluer n'est NI complet NI fautif — il est à part, nommé.
      nonVerifiables.push({ nom: primaryName, raison: e?.message?.slice(0, 120) ?? "erreur inconnue" });
      continue;
    }
    if (res.gaps?.length) incomplets.push({ nom: primaryName, statut: row.statut, gaps: res.gaps });
  }
  return {
    mesurable: true,
    membresVerifies: rows.length,
    incomplets,
    nonVerifiables,
    // Les trois angles morts que l'audit membre par membre ne peut PAS voir, puisqu'ils concernent
    // justement ce qui n'est déclaré nulle part. Fournis par l'appelant depuis les garde-fous déjà
    // existants — jamais recalculés ici.
    scriptsNonDeclares,
    absentsDuMenu,
    absentsDeLaRonde,
    ok: rows.length > 0 && !incomplets.length && !nonVerifiables.length && !scriptsNonDeclares.length && !absentsDuMenu.length && !absentsDeLaRonde.length,
  };
}

export function integrationAuditLines(audit) {
  if (!audit.mesurable) return [`⚠️ Audit d'intégration impossible : ${audit.raison}`];
  const l = [];
  if (audit.ok) {
    l.push(`✅ ${audit.membresVerifies} membre(s) vérifié(s) : chacun est complètement intégré, et aucun script d'outil ne traîne hors de l'organigramme.`);
    return l;
  }
  l.push(`${audit.membresVerifies} membre(s) vérifié(s) — ${audit.incomplets.length} incomplet(s).`);
  for (const m of audit.incomplets) l.push(`  ✗ ${m.nom} (${m.statut}) : ${m.gaps.join(" · ")}`);
  for (const n of audit.nonVerifiables) l.push(`  ? ${n.nom} — non vérifiable : ${n.raison}`);
  // Les trois angles morts, nommés séparément : ce ne sont pas des membres incomplets, ce sont des
  // outils que l'organisation ne connaît pas encore du tout.
  if (audit.scriptsNonDeclares.length) l.push(`  ⚠ ${audit.scriptsNonDeclares.length} script(s) d'outil jamais déclaré(s) dans l'organigramme : ${audit.scriptsNonDeclares.join(", ")}`);
  if (audit.absentsDuMenu.length) l.push(`  ⚠ ${audit.absentsDuMenu.length} outil(s) absent(s) du catalogue du coordinateur : ${audit.absentsDuMenu.join(", ")}`);
  if (audit.absentsDeLaRonde.length) l.push(`  ⚠ ${audit.absentsDeLaRonde.length} membre(s) n'apparaissant ni comme item de Ronde ni comme exclusion motivée : ${audit.absentsDeLaRonde.join(", ")}`);
  return l;
}

export function checkAllAgentBadges(onboardingContext, { historyPath = BADGE_CEREMONY_HISTORY_PATH, now = Date.now() } = {}) {
  if (!onboardingContext?.toolsTableMarkdown) return [];
  const rows = parseToolsTable(onboardingContext.toolsTableMarkdown).filter((r) => CERTIFIABLE_STATUTS.includes(r.statut));
  const announcements = [];
  for (const row of rows) {
    const primaryName = primaryToolName(row.tool);
    const overrides = onboardingContext.agentOverrides?.[primaryName] ?? {};
    let result;
    try {
      result = checkAgentOnboarding(primaryName, { ...onboardingContext, ownKnowledge: row.statut !== CLASSIQUE_STATUT, ...overrides });
    } catch {
      continue; // garde-fou Personnage ou nom malformé — jamais un balayage cassé pour un seul outil
    }
    // Deux voies, jamais confondues : la certification initiale (une fois dans la vie de l'Agent)
    // ou, pour un Agent déjà certifié, un vrai changement d'état de son badge depuis la dernière
    // fois qu'on l'a regardé. Un Agent stable ne produit rien, comme avant.
    const announcement = announceBadgeCeremony(result, { historyPath, now })
      ?? announceBadgeChange(result, { historyPath, now });
    if (announcement) announcements.push(announcement);
  }
  return announcements;
}

// Passthrough vers CHECK-LEVEL-TARGET (accès "privilégié" direct, jamais une réimplémentation) —
// à appeler explicitement par l'agent pour classer UNE demande précise ; jamais invoqué tout seul
// dans runNetworkCheck() ci-dessous, qui n'a pas de texte de demande à classer. Même signature que
// classifyCheckLevel() elle-même (un seul paramètre) — la pression de registre et les nœuds
// sensibles récents restent la responsabilité de check-level-target.mjs (combineWithRegistryPressure/
// recentlyChangedSensitiveNodes), jamais dupliqués ici.
export function classifyRequest(requestText) {
  return classifyCheckLevel(requestText);
}

export function runNetworkCheck({ shImpl = sh } = {}) {
  const head = currentHead();
  const state = loadState();
  const duplicate = isDuplicateRun(state, head);
  const now = new Date().toISOString();
  const rows = [];

  // Un seul lancement de check-house.mjs, dont la couverture V8 nourrit AXA-CHECK — jamais un
  // second run (règle anti-doublon, §7ter), exactement le même principe que kpi-report.mjs.
  const covDir = mkdtempSync(join(tmpdir(), "coordinateur-cov-"));
  const testOut = shImpl("node scripts/check-house.mjs 2>&1", { cwd: ROOT, env: { ...process.env, NODE_V8_COVERAGE: covDir } });
  const testsOk = !/AssertionError/.test(testOut);
  rows.push({ name: "check-house.mjs (suite de tests)", result: testsOk ? "ok" : "⚠️ à regarder", when: now });

  let coverageScore;
  try {
    const perFile = collectCoverage(covDir);
    coverageScore = robustnessScore(Object.values(perFile).flat());
  } finally {
    rmSync(covDir, { recursive: true, force: true });
  }
  rows.push({ name: "AXA-CHECK (couverture réelle par fonction)", result: coverageScore === undefined ? "N/A" : `${Math.round(coverageScore)}%`, when: now });

  const argusOut = shImpl("node scripts/check-argus.mjs", { cwd: ROOT });
  const argusSummary = summarizeArgusOutput(argusOut);
  // On lit le compte d'ARGUS, jamais ses étiquettes : les candidats déjà tranchés avec l'utilisateur
  // ne doivent pas remonter comme du travail (cf. summarizeArgusOutput, 2026-09-23).
  const argusResultat = argusSummary.ecartsARegarder === undefined
    ? `pas mesuré (ARGUS n'a pas écrit sa ligne de compte — ${argusSummary.candidatsDetectes} étiquette(s) brute(s) vues)`
    : argusSummary.ecartsARegarder > 0
      ? `à regarder (${argusSummary.ecartsARegarder} écart(s))`
      : argusSummary.ecartesAvecAccord > 0
        ? `ok (${argusSummary.ecartesAvecAccord} déjà tranché(s) avec vous, jamais reposé(s))`
        : "ok";
  rows.push({ name: "ARGUS (mécanique)", result: argusResultat, when: now });

  const harmoniaOut = shImpl("node scripts/check-harmonia.mjs", { cwd: ROOT });
  const harmoniaSummary = summarizeHarmoniaOutput(harmoniaOut);
  rows.push({ name: "HARMONIA (mécanique)", result: harmoniaSummary.frictions ? `à regarder (${harmoniaSummary.frictions} friction(s))` : "ok", when: now });

  const alwaysNewCodeIndexText = existsSync(ALWAYS_NEW_CODE_INDEX) ? readFileSync(ALWAYS_NEW_CODE_INDEX, "utf8") : "";
  const zone = recommendZone(THEMES, parseCoverage(alwaysNewCodeIndexText));
  rows.push({ name: "ALWAYS-NEW-CODE (préparation)", result: `zone recommandée : ${zone.zone}`, when: now });

  const lastTouchByFile = Object.fromEntries(Object.values(LIB_MAP).map((f) => [f, lastTouchDays(f)]));
  const staleness = relativeStaleness(lastTouchByFile);
  const staleCount = Object.values(staleness).filter((s) => s.stale).length;
  rows.push({ name: "CLEAN-DIRTY-OLD (repérage seul)", result: staleCount > 0 ? `à regarder (${staleCount} zone(s) stagnante(s))` : "ok", when: now });

  // Trouvaille réelle du 2026-09-19 : l'agent n'avait jamais consulté Smart Conso API avec
  // --confirm avant une action coûteuse. Ce garde-fou compare l'activité réelle déjà enregistrée
  // (.gemini-key-health.json) au carnet de session — sans dépendre de l'agent qui pense à le lancer.
  const healthPath = join(ROOT, ".gemini-key-health.json");
  const sessionPath = join(ROOT, ".smart-conso-session.json");
  const healthData = existsSync(healthPath) ? JSON.parse(readFileSync(healthPath, "utf8")) : { keys: {} };
  const sessionLog = existsSync(sessionPath) ? JSON.parse(readFileSync(sessionPath, "utf8")) : { actions: [] };
  const unconfirmedBursts = findUnconfirmedBursts(healthData, sessionLog);
  rows.push({ name: "Smart Conso API (salves jamais confirmées)", result: unconfirmedBursts.length > 0 ? `à regarder (${unconfirmedBursts.length} salve(s))` : "ok", when: now });

  // Rythme SMART-CONSO-TOKEN (2026-09-20, demande explicite de l'utilisateur : « le coordinateur
  // doit être rapproché de smart-conso-token pour veiller sur ce point »). Même principe que la
  // ligne Smart Conso API ci-dessus : un simple affichage du rythme récent, jamais un jugement — la
  // lecture reste toujours humaine/agent.
  const tokenHistoryPath = join(ROOT, ".smart-conso-token-history.json");
  const tokenHistory = existsSync(tokenHistoryPath) ? JSON.parse(readFileSync(tokenHistoryPath, "utf8")) : { actions: [] };
  const tokenSummary = summarizeHistory(tokenHistory, Date.now());
  rows.push({ name: "SMART-CONSO-TOKEN (rythme 7 derniers jours)", result: `${tokenSummary.totalRecent} action(s) — ${JSON.stringify(tokenSummary.byType)}`, when: now });

  // Autorité réelle sur THE-FINAL-JUDGE/THE-DEEP-READER (tâche #137, 2026-09-21 : « auditer et
  // fiabiliser l'exploitation de Smart Conso API/SMART-CONSO-TOKEN partout où la charte l'exige »).
  // findJudgeSpawnsWithoutConsultation() existait déjà, entièrement testé par fixtures, mais n'était
  // jamais appelé nulle part en production — exactement le même angle mort que les deux items
  // "Passages réels" ajoutés à CIRCLE-TASKS plus tôt ce soir. Compare chaque passage RÉELLEMENT
  // archivé (preuve externe et vérifiable) à l'historique local de consultation SMART-CONSO-TOKEN.
  const judgeIndexPath = join(ROOT, "docs/the-final-judge/index.md");
  const judgeIndex = existsSync(judgeIndexPath) ? readFileSync(judgeIndexPath, "utf8") : "";
  const judgeMissing = findJudgeSpawnsWithoutConsultation(judgeIndex, tokenHistory);
  rows.push({ name: "SMART-CONSO-TOKEN (spawns THE-FINAL-JUDGE sans consultation confirmée)", result: judgeMissing.length ? `à regarder (${judgeMissing.length} : ${judgeMissing.join(", ")})` : "ok", when: now });

  const deepReaderIndexPath = join(ROOT, "docs/suivi/relectures-lourdes/index.md");
  const deepReaderIndex = existsSync(deepReaderIndexPath) ? readFileSync(deepReaderIndexPath, "utf8") : "";
  const deepReaderMissing = findJudgeSpawnsWithoutConsultation(deepReaderIndex, tokenHistory);
  rows.push({ name: "SMART-CONSO-TOKEN (spawns THE-DEEP-READER sans consultation confirmée)", result: deepReaderMissing.length ? `à regarder (${deepReaderMissing.length} : ${deepReaderMissing.join(", ")})` : "ok", when: now });

  // Même autorité étendue à HYPER-SCAN-CHECKPOINT (2026-09-22, demande explicite : « l'equipe smart
  // conso pouvait aussi venir piocher de la donnée »). Son registre archive AUSSI des passages en
  // version LÉGÈRE (zéro appel réseau, aucune consultation requise) — filterIndexRowsByVersion()
  // réduit d'abord l'index aux seules lignes "complète" avant de le passer, inchangé, à
  // findJudgeSpawnsWithoutConsultation() : jamais un second calcul de date, seulement une réduction
  // du texte en amont.
  const hyperScanIndexPath = join(ROOT, "docs/hyper-scan-checkpoint/index.md");
  const hyperScanIndex = existsSync(hyperScanIndexPath) ? readFileSync(hyperScanIndexPath, "utf8") : "";
  const hyperScanCompleteIndex = filterIndexRowsByVersion(hyperScanIndex, /complète|complet/i);
  const hyperScanMissing = findJudgeSpawnsWithoutConsultation(hyperScanCompleteIndex, tokenHistory);
  rows.push({ name: "SMART-CONSO-TOKEN (passages HYPER-SCAN-CHECKPOINT complets sans consultation confirmée)", result: hyperScanMissing.length ? `à regarder (${hyperScanMissing.length} : ${hyperScanMissing.join(", ")})` : "ok", when: now });

  // Garde-fou de fraîcheur AGENT_SCRIPT_FILES (2026-09-21, audit d'évolutivité) — un Agent réel de
  // la table maîtresse jamais ajouté à AGENT_SCRIPT_FILES (axa-check.mjs) échapperait sinon
  // silencieusement à toute couverture AXA-CHECK et à toute stagnation CASSANDRA-RH.
  const rulesMdPath = join(ROOT, "docs/regles-de-travail.md");
  const rulesMdText = existsSync(rulesMdPath) ? readFileSync(rulesMdPath, "utf8") : "";
  const missingAgentFiles = findScriptsMissingFromAgentFiles(rulesMdText);
  rows.push({ name: "AXA-CHECK (Agents absents d'AGENT_SCRIPT_FILES)", result: missingAgentFiles.length ? `à regarder (${missingAgentFiles.join(", ")})` : "ok", when: now });

  // LA TABLE MAÎTRESSE CONTRE LE DÉPÔT RÉEL : la fonction vit ici, avec la table, mais son
  // BRANCHEMENT vit chez CASSANDRA (#1016). Le filtre dont elle a besoin — « ce script est-il un
  // outil ? » — est le classement iceberg, et cassandra-rh importe déjà ce fichier : l'importer en
  // retour créerait un cycle. L'appelant qui possède les DEUX moitiés est donc CASSANDRA, et c'est
  // là que la ligne est rendue. Sans le filtre, le garde-fou rendrait seize lignes pour sept vrais
  // manques, et un garde-fou bruyant cesse d'être lu (leçon L4).

  // ecotoken (2026-09-22) : le poids de la charte est une donnée de réseau au même titre
  // que la couverture de test — c'est le seul document rechargé à chaque message. Lecture seule du
  // budget, jamais le plan complet (qui demande de lire tout le dépôt, trop cher pour une synthèse).
  // PAS DE CHARTE ICI EST UN RÉSULTAT, JAMAIS UNE PANNE (2026-09-27, tâche #1034) : sur un dépôt
  // qui n'a pas encore de CLAUDE.md, cette ligne tuait tout le coordinateur avant la première
  // sortie. Elle DÉCLARE désormais ce qu'elle n'a pas pu mesurer, comme les cinq outils qui ont
  // tourné du premier coup sur le dépôt témoin.
  const charteDoc = lireLeDocumentGouvernant("CLAUDE.md", { root: ROOT });
  const budgetCharte = charteDoc.trouve ? checkWeightBudget(charteDoc.texte) : null;
  rows.push({ name: "ecotoken (poids de la charte)", result: !budgetCharte ? "⚪ pas mesuré (CLAUDE.md introuvable ici)" : budgetCharte.depasse ? `à regarder (${budgetCharte.tokens} tk, +${budgetCharte.depassement} au-dessus du budget)` : `ok (${budgetCharte.tokens} tk, marge ${budgetCharte.margePct} %)`, when: now });

  // Doc-Report (2026-09-21, tâche #340, trouvaille réelle : 6 fichiers de scan ARGUS restés
  // orphelins avant d'être indexés rétroactivement) — vérifie qu'un registre à "un fichier par
  // passage" (ARGUS aujourd'hui, périmètre curaté explicitement, cf. REPORT_PER_RUN_REGISTRIES)
  // n'accumule pas de fichiers jamais référencés dans son propre index.md.
  const orphanReportFindings = findOrphanReportFiles();
  rows.push({ name: "Doc-Report (rapports orphelins jamais indexés)", result: orphanReportFindings.length ? `à regarder (${orphanReportFindings.map((f) => `${f.slug}: ${f.orphans.length}`).join(", ")})` : "ok", when: now });

  saveState({ lastHead: head, lastWhen: now });
  return { duplicate, previousRun: state, rows };
}

// ============================================================================
// LA CARTE DES MODULES — sa demande d'un SCHÉMA, pas d'un texte (tâche #1536)
// ============================================================================
// SA DEMANDE, MOT POUR MOT : « une VRAIE carte schématique, pas un texte », en DEUX documents —
// la carte ACTUELLE et la carte CIBLE — « schéma en tête, pas de long texte, tout compréhensible
// par le visuel ». Et sa consigne de contenu est tranchante : « oublier les familles qu'il a
// créées, reprendre la classification par type et par axe transverse CONSTATÉS ».
//
// SA DÉFINITION D'UN MODULE, qu'il a donnée le même jour : « un ensemble d'agents qui œuvrent
// dans un sens commun pour produire UNE PRESTATION DE L'AGENCE ». La carte ACTUELLE se dérive donc
// du catalogue des prestations, et non d'un découpage que j'inventerais.
//
// ⚠️ CE QUE LA CARTE ACTUELLE MONTRE, ET QUI N'EST PAS CE QU'ON ESPÉRAIT : sur 76 prestations,
// la grande majorité n'est portée que par UN SEUL outil. « Un ensemble d'agents » ne décrit donc
// pas le catalogue d'aujourd'hui. Ce n'est pas un défaut de sa définition : c'est la mesure qui
// dit que le catalogue est découpé plus fin que ses modules. La carte le montre au lieu de le
// lisser, parce qu'une carte qui dessinerait de beaux modules groupés serait une carte de ce que
// je souhaite, pas du dépôt.
//
// LA JOINTURE PASSE PAR `normaliserNomDOutil`, ET C'EST UNE ERREUR PAYÉE : ma première mesure
// joignait les deux registres sur leurs clés brutes et annonçait « 41 prestations hors
// organigramme ». Faux : PRESTATIONS nomme les outils par leur nom d'affichage
// (`ABRAHAM-LES-REFERENCES`), `AGENT_CATEGORIES` par leur slug (`abraham-les-references`). Le
// résolveur existait depuis le 2026-09-25 et je ne l'avais pas appelé. 66 des 75 se résolvent.
// ————————————————————————————————————————————————————————————————————————
// LA PARTIE INDÉTACHABLE ET LE CŒUR, DÉRIVÉS DU GRAPHE RÉEL (tâche #1538)
// ————————————————————————————————————————————————————————————————————————
//
// SES TROIS DÉFINITIONS, dans ses mots : un MODULE est « un ensemble d'agents qui œuvrent dans un
// sens commun pour produire UNE PRESTATION » · la PARTIE INDÉTACHABLE est « ce que toute
// prestation réclame quoi qu'il arrive » · le CŒUR est « le cœur de la partie indétachable ». Et
// sa phrase qui commande tout le reste : « encore faut-il définir le cœur ».
//
// POURQUOI ON LE DÉRIVE PLUTÔT QUE DE LE DÉCLARER, et c'est le seul point qui compte : un cœur
// déclaré à la main serait la liste des fichiers que je trouve importants. Sa définition à lui est
// une PROPRIÉTÉ VÉRIFIABLE — « ce que TOUTE prestation réclame » — donc elle se calcule sur le
// graphe réel des imports. Si le calcul rend autre chose que ce qu'on imaginait, c'est le calcul
// qui a raison, et ça vaut mieux qu'un accord de façade.
//
// CE QUE LE CALCUL NE PEUT PAS DIRE, et le taire serait le pire service : il lit les imports, donc
// il voit ce qu'un outil CHARGE, jamais ce qu'il SUPPOSE. Un outil qui lit `docs/suivi/` sans
// importer personne ne montrera aucune dépendance ici et sera pourtant inséparable de ce dépôt.
// C'est précisément ce que mesure l'autre moitié du sujet (les ancres réglables, mesurées le
// 2026-09-30 : 5 % seulement) — les deux se lisent ensemble, jamais l'une à la place de l'autre.

export function grapheDesImports({ root = ".", dossier = "scripts", listDirImpl = readdirSync, readFileImpl = readFileSync, extraire = null } = {}) {
  let noms = [];
  try { noms = listDirImpl(join(root, dossier)).filter((n) => n.endsWith(".mjs")); } catch { noms = []; }
  const arcs = new Map();
  for (const n of noms) {
    let code = "";
    try { code = readFileImpl(join(root, dossier, n), "utf8"); } catch { continue; }
    const cibles = extraire ? extraire(code) : [...new Set([...code.matchAll(/from\s+["']\.\/([a-z0-9._/-]+)["']/gi)].map((m) => `${dossier}/${m[1]}`))];
    arcs.set(`${dossier}/${n}`, cibles.filter((c) => c !== `${dossier}/${n}`).sort());
  }
  return arcs;
}

// L'ATTEINT DEPUIS UN POINT D'ENTRÉE, cycles compris — ce dépôt en porte (deux outils qui
// s'importent mutuellement), et une descente naïve y tournerait sans fin.
export function atteintDepuis(depart, arcs = new Map()) {
  const vus = new Set();
  const pile = [depart];
  while (pile.length) {
    const courant = pile.pop();
    for (const suivant of arcs.get(courant) ?? []) {
      if (vus.has(suivant)) continue;
      vus.add(suivant);
      pile.push(suivant);
    }
  }
  return vus;
}

export function partieIndetachable({ root = ".", prestations = PRESTATIONS, arcs = null, existsImpl = existsSync } = {}) {
  const g = arcs ?? grapheDesImports({ root });
  if (!g.size) return { mesurable: false, pourquoi: "aucun script lu : un graphe vide rendrait « tout est indétachable », qui est l'inverse exact d'une mesure" };
  // LE POINT D'ENTRÉE D'UNE PRESTATION EST LE SCRIPT DE SON OUTIL. On le DÉRIVE du nom déclaré
  // plutôt que de tenir une seconde table (Article 24), et un outil dont le script est introuvable
  // est COMPTÉ À PART : l'ignorer en silence rétrécirait le dénominateur et gonflerait le cœur.
  const entrees = [];
  const sansScript = [];
  // LE RÉSOLVEUR PARTAGÉ, JAMAIS UNE CORRESPONDANCE RÉINVENTÉE ICI. La première version comparait
  // `scripts/<nom>.mjs` à la main et déclarait 51 outils sur 89 « sans script » — donc un
  // dénominateur amputé de moitié et une intersection calculée sur ce qui restait. Le résolveur
  // existait, avec ses exceptions documentées (argus → check-argus.mjs, memory-audit →
  // memento.mjs) : c'est exactement l'erreur déjà payée le 2026-10-03 sur la carte des modules,
  // commise une seconde fois dans la même journée.
  for (const p of prestations) {
    for (const nom of p.outils ?? []) {
      // LE NOM EST NORMALISÉ AVANT D'ÊTRE RÉSOLU : le catalogue écrit « MOÏSE-TABLES-DE-LOI » et
      // « X-Port BLINDTEST », le disque écrit des minuscules sans accent. Sauter cette étape
      // cherchait `scripts/MOÏSE-TABLES-DE-LOI.mjs` et déclarait l'outil introuvable.
      const chemin = scriptPourSlug(normaliserNomDOutil(nom));
      if (g.has(chemin)) { entrees.push({ prestation: p.nom, outil: nom, chemin }); continue; }
      sansScript.push({ prestation: p.nom, outil: nom, cherche: chemin });
    }
  }
  if (!entrees.length) return { mesurable: false, pourquoi: "aucune prestation n'a de script atteignable : le calcul porterait sur zéro point d'entrée" };
  let commun = null;
  const parEntree = [];
  // COMBIEN DE POINTS D'ENTRÉE ATTEIGNENT CHAQUE FICHIER. L'intersection stricte — « ce que TOUTE
  // prestation réclame », sa définition au mot près — est un critère DUR : il suffit d'un outil
  // autonome pour vider le résultat, et le premier passage l'a montré en rendant UN SEUL fichier.
  // Ce n'est pas une erreur de mesure, c'est la réponse exacte à la question exacte ; mais elle ne
  // montre pas le centre de gravité. La part d'atteinte, elle, le montre, et les deux se lisent
  // ensemble — rendre la seconde seule aurait adouci sa définition sans le dire.
  const atteintPar = new Map();
  for (const e of entrees) {
    const atteint = atteintDepuis(e.chemin, g);
    parEntree.push({ ...e, atteint: atteint.size });
    for (const f of atteint) atteintPar.set(f, (atteintPar.get(f) ?? 0) + 1);
    commun = commun === null ? new Set(atteint) : new Set([...commun].filter((x) => atteint.has(x)));
  }
  const centreDeGravite = [...atteintPar.entries()]
    .map(([chemin, n]) => ({ chemin, atteintPar: n, part: n / entrees.length }))
    .sort((a, b) => b.atteintPar - a.atteintPar || a.chemin.localeCompare(b.chemin));
  // LE DEGRÉ ENTRANT CLASSE LE CŒUR : parmi ce que tout le monde réclame, le cœur est ce que le
  // plus de monde CHARGE DIRECTEMENT. Un fichier atteint par tous mais importé par deux autres
  // seulement est indétachable sans être central, et les confondre effacerait la distinction
  // qu'il demande précisément d'établir.
  const degre = new Map();
  for (const [, cibles] of g) for (const c of cibles) degre.set(c, (degre.get(c) ?? 0) + 1);
  const indetachables = [...commun].sort((a, b) => (degre.get(b) ?? 0) - (degre.get(a) ?? 0) || a.localeCompare(b))
    .map((chemin) => ({ chemin, importePar: degre.get(chemin) ?? 0 }));
  return {
    mesurable: true, scripts: g.size, prestations: prestations.length,
    pointsDentree: entrees.length, sansScript, parEntree,
    indetachables, total: indetachables.length, centreDeGravite,
  };
}

// LE CŒUR EST LE HAUT DE LA PARTIE INDÉTACHABLE, et le seuil se LIT dans la distribution plutôt
// que de se choisir : on coupe au plus grand saut de degré entrant. Un seuil rond — « les cinq
// premiers » — aurait coupé au milieu d'un palier, et personne n'aurait pu dire pourquoi.
export function coeurDeLAgence(centreDeGravite = []) {
  if (centreDeGravite.length < 2) return { mesurable: false, pourquoi: `il faut au moins deux fichiers pour qu'un saut existe (actuellement ${centreDeGravite.length}) — sur moins, « le cœur » serait un choix et non une mesure` };
  // LE SEUIL SE LIT DANS LA DISTRIBUTION, IL NE SE CHOISIT PAS. On coupe au plus grand saut de
  // part d'atteinte. Un seuil rond — « au-dessus de 90 % » — aurait pu tomber au milieu d'un
  // palier, et personne n'aurait su dire pourquoi là plutôt qu'un cran plus bas. Le saut, lui,
  // est un fait du dépôt : s'il se déplace, la coupe se déplace avec lui (Article 24).
  let meilleurSaut = 0;
  let coupe = centreDeGravite.length;
  for (let i = 1; i < centreDeGravite.length; i += 1) {
    const saut = centreDeGravite[i - 1].atteintPar - centreDeGravite[i].atteintPar;
    if (saut > meilleurSaut) { meilleurSaut = saut; coupe = i; }
  }
  if (!meilleurSaut) return { mesurable: false, pourquoi: "tous les fichiers sont atteints par le même nombre de points d'entrée : aucune coupe ne ressort, et en inventer une serait un classement déguisé en mesure" };
  return { mesurable: true, coeur: centreDeGravite.slice(0, coupe), saut: meilleurSaut, reste: centreDeGravite.length - coupe };
}

// SA DÉFINITION D'UN MODULE CONFRONTÉE AU CATALOGUE RÉEL. Elle dit « un ENSEMBLE d'agents » ; le
// catalogue dit autre chose, et le lui montrer vaut mieux que de le lisser.
export function prestationsParNombreDOutils({ prestations = PRESTATIONS } = {}) {
  const parNombre = new Map();
  for (const p of prestations) {
    const n = (p.outils ?? []).length;
    parNombre.set(n, (parNombre.get(n) ?? 0) + 1);
  }
  return [...parNombre.entries()].sort((a, b) => a[0] - b[0]).map(([outils, prestationsCount]) => ({ outils, prestations: prestationsCount }));
}

export function lignesDuCoeurEtDuModule({ r, c, distribution = [], date = "" } = {}) {
  const L = [];
  L.push("<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->");
  L.push("# Le module, la partie indétachable, le cœur — tes trois définitions mises à l'épreuve");
  L.push("");
  L.push(`> Produit par \`node scripts/le-coordinateur.mjs coeur\` le ${date}, sur le graphe réel des imports.`);
  L.push("> Tu demandais : « ai-je bien compris ta vision ? » — voici la réponse que le dépôt donne, pas celle que j'ai en tête.");
  L.push("");
  if (!r?.mesurable) { L.push(`**PAS MESURÉ** — ${r?.pourquoi ?? "mesure indisponible"}`); L.push("<!-- /DOCUMENT GÉNÉRÉ -->"); return L; }
  L.push("## ① Ta définition d'un MODULE, confrontée au catalogue réel");
  L.push("");
  L.push("> « Un module est **un ensemble d'agents** qui œuvrent dans un sens commun pour produire UNE PRESTATION. »");
  L.push("");
  L.push("| Nombre d'outils derrière une prestation | Combien de prestations |");
  L.push("|---|---|");
  for (const d of distribution) L.push(`| ${d.outils} | ${d.prestations} |`);
  L.push("");
  const seul = (distribution.find((d) => d.outils === 1) ?? {}).prestations ?? 0;
  const total = distribution.reduce((n, d) => n + d.prestations, 0);
  L.push(`**${seul} prestations sur ${total} ne sont portées que par UN SEUL outil.** Ta définition dit « un ensemble » ;`);
  L.push("le catalogue d'aujourd'hui dit « un outil ». Ce n'est pas que ta définition soit fausse — c'est qu'elle décrit");
  L.push("une CIBLE et non l'état actuel. Et le dire est plus utile que de faire comme si les deux coïncidaient.");
  L.push("");
  L.push("## ② Ta définition de la PARTIE INDÉTACHABLE, prise au mot");
  L.push("");
  L.push("> « La partie indétachable est **ce que toute prestation réclame quoi qu'il arrive**. »");
  L.push("");
  L.push(`Prise à la lettre — ce que les **${r.pointsDentree} points d'entrée** atteignent TOUS — elle rend **${r.total} fichier(s)** :`);
  L.push("");
  for (const i of r.indetachables) L.push(`- \`${i.chemin}\` — importé directement par ${i.importePar} fichier(s)`);
  L.push("");
  L.push("**Ce n'est pas une erreur de mesure, c'est la réponse exacte à la question exacte** : il suffit d'un outil");
  L.push("autonome pour vider une intersection. Ce que ça dit vraiment, et c'est important pour ta question");
  L.push("« est-ce réaliste ? » : **l'Agence est déjà presque entièrement modulaire.** Ses outils ne partagent presque rien.");
  L.push("Ce qui manque n'est pas la modularité — c'est le cœur.");
  L.push("");
  L.push("## ③ Le CŒUR, dérivé et non décrété");
  L.push("");
  L.push("> « Le cœur est **le cœur de la partie indétachable** », et : « encore faut-il définir le cœur ».");
  L.push("");
  L.push("Au lieu d'une intersection tout-ou-rien, on mesure **quelle part des points d'entrée atteint chaque fichier**,");
  L.push("et on coupe **au plus grand saut de la distribution** — jamais à un seuil rond, qui pourrait tomber au milieu");
  L.push("d'un palier sans que personne puisse dire pourquoi là.");
  L.push("");
  if (!c?.mesurable) { L.push(`**PAS MESURÉ** — ${c?.pourquoi}`); }
  else {
    L.push(`**Le saut est de ${c.saut} points d'entrée**, et il est franc. Le cœur est donc de **${c.coeur.length} fichiers** :`);
    L.push("");
    L.push("| Fichier | Atteint par |");
    L.push("|---|---|");
    for (const x of c.coeur) L.push(`| \`${x.chemin}\` | ${x.atteintPar} / ${r.pointsDentree} (${Math.round(x.part * 100)} %) |`);
    L.push("");
    L.push(`Les ${c.reste} fichiers suivants retombent sous la barre, le premier d'entre eux à ${Math.round((r.centreDeGravite[c.coeur.length]?.part ?? 0) * 100)} %.`);
    L.push("");
  }
  L.push("## ④ Les dix fichiers les plus partagés, pour voir la pente");
  L.push("");
  L.push("| Part des points d'entrée | Fichier |");
  L.push("|---|---|");
  for (const x of r.centreDeGravite.slice(0, 10)) L.push(`| ${Math.round(x.part * 100)} % | \`${x.chemin}\` |`);
  L.push("");
  L.push("## ⑤ Ce que cette mesure NE dit pas, et c'est la moitié du sujet");
  L.push("");
  L.push("Elle lit les **imports**, donc elle voit ce qu'un outil CHARGE — jamais ce qu'il SUPPOSE. Un outil qui lit");
  L.push("`docs/suivi/` sans importer personne n'apparaît lié à rien ici, et reste pourtant inséparable de ce dépôt.");
  L.push("C'est l'autre moitié du sujet, déjà mesurée le 30 septembre : **5 % seulement** des fichiers du noyau ont");
  L.push("toutes leurs ancres réglables de l'extérieur. Les deux se lisent ensemble, jamais l'une à la place de l'autre.");
  L.push("");
  L.push("# PLAN D'ACTION");
  L.push("");
  L.push("| État | Constat | Suite |");
  L.push("|---|---|---|");
  L.push(`| ✅ MESURÉ | ta définition du module décrit une CIBLE : ${seul} prestations sur ${total} n'ont qu'un seul outil aujourd'hui | #1538 |`);
  L.push(`| ✅ MESURÉ | prise au mot, la partie indétachable est de ${r.total} fichier(s) — l'Agence est déjà presque entièrement modulaire | #1538 |`);
  if (c?.mesurable) L.push(`| ✅ MESURÉ | le cœur, dérivé du plus grand saut de la distribution : ${c.coeur.length} fichiers, de ${Math.round(c.coeur[c.coeur.length - 1].part * 100)} % à 100 % | #1538 |`);
  L.push("| ? À TRANCHER | ta définition du module décrit la cible : faut-il la garder telle quelle, ou la reformuler pour décrire aussi l'état actuel ? | #1538 |");
  if (r.sansScript.length) L.push(`| ? À INSTRUIRE | ${r.sansScript.length} entrée(s) du catalogue nomment un « outil » dont aucun script n'existe : ${r.sansScript.map((x) => x.outil).join(", ")} | #1538 |`);
  L.push("");
  L.push("<!-- /DOCUMENT GÉNÉRÉ -->");
  return L;
}

export function carteDesModules({ prestations = PRESTATIONS, categories = AGENT_CATEGORIES, familleDe = familleDeLaCategorie } = {}) {
  if (!prestations?.length) {
    return { mesurable: false, pourquoi: "catalogue de prestations vide : une carte dessinée sur zéro prestation ressemblerait à une Agence sans modules, ce qui est faux (leçons L5/L11)" };
  }
  const parNorme = new Map(Object.entries(categories).map(([slug, cat]) => [normaliserNomDOutil(slug), { slug, famille: familleDe(cat) }]));
  const resolu = (nom) => parNorme.get(normaliserNomDOutil(nom)) ?? null;

  const modules = prestations.map((p) => {
    const outils = (p.outils ?? []).map((o) => ({ nom: o, ...(resolu(o) ?? { slug: null, famille: null }) }));
    const familles = [...new Set(outils.map((o) => o.famille).filter(Boolean))];
    return {
      prestation: p.nom,
      demande: p.demande ?? "",
      outils,
      // UN MODULE AU SENS DE SA DÉFINITION exige PLUSIEURS agents. Un outil seul rend bien une
      // prestation, mais ce n'est pas « un ensemble d'agents » — et confondre les deux ferait
      // compter 76 modules là où il y en a une poignée.
      estUnEnsemble: outils.length > 1,
      familles,
      // Un module dont les outils viennent de plusieurs familles est TRANSVERSE : c'est le cas qui
      // prouve qu'une famille n'est pas un module, et il répond directement à sa question P29-5.
      transverse: familles.length > 1,
      inconnus: outils.filter((o) => !o.slug).map((o) => o.nom),
    };
  });
  const ensembles = modules.filter((m) => m.estUnEnsemble);
  return {
    mesurable: true,
    total: modules.length,
    ensembles: ensembles.length,
    solitaires: modules.length - ensembles.length,
    transverses: modules.filter((m) => m.transverse).length,
    outilsCites: [...new Set(prestations.flatMap((p) => p.outils ?? []))].length,
    outilsInconnus: [...new Set(modules.flatMap((m) => m.inconnus))],
    modules,
  };
}

// LE SCHÉMA EST EN CARACTÈRES, et c'est un choix plutôt qu'un pis-aller : un schéma dessiné en
// texte se régénère à chaque passage, se lit dans un terminal comme dans un navigateur, et ne
// peut pas se périmer sans que son générateur le sache. Une image devrait être redessinée à la
// main au premier outil ajouté — exactement la copie que l'Article 24 interdit.
export function schemaDeLaCarteActuelle(c, { maxParFamille = 6 } = {}) {
  if (!c?.mesurable) return [`❓ PAS MESURÉ — ${c?.pourquoi}`];
  const parFamille = new Map();
  for (const m of c.modules) {
    const cle = m.transverse ? "⇄ TRANSVERSE (plusieurs familles)" : (m.familles[0] ?? "∅ hors organigramme");
    if (!parFamille.has(cle)) parFamille.set(cle, []);
    parFamille.get(cle).push(m);
  }
  const ordonne = [...parFamille.entries()].sort((a, b) => b[1].length - a[1].length);
  // LE TITRE EST HORS DU BLOC, pas dedans (règle de format du 2026-10-03, tâche #1537) : un titre
  // à l'intérieur du dessin ne peut pas être lu par un sommaire, et un dessin qui arrive sans
  // annonce oblige à le déchiffrer avant de savoir ce qu'on regarde.
  const out = ["**Carte ACTUELLE des modules de l'Agence** — un module = les outils qui rendent UNE prestation.", "", "```"];
  out.push(`   ${c.total} prestations  ·  ${c.ensembles} portées par PLUSIEURS outils  ·  ${c.solitaires} par UN SEUL`);
  out.push("");
  for (const [famille, liste] of ordonne) {
    const ens = liste.filter((m) => m.estUnEnsemble).length;
    out.push(`┌─ ${famille}`);
    out.push(`│    ${liste.length} prestation(s), dont ${ens} vrai(s) module(s) au sens « plusieurs agents »`);
    const montres = liste.slice(0, maxParFamille);
    for (const m of montres) {
      const marque = m.estUnEnsemble ? "▣" : "▫";
      out.push(`│    ${marque} ${m.prestation}  ←  ${m.outils.map((o) => o.slug ?? o.nom).join(" + ")}`);
    }
    if (liste.length > montres.length) out.push(`│    … et ${liste.length - montres.length} autre(s)`);
    out.push("└─");
    out.push("");
  }
  out.push("   ▣ = plusieurs outils (un module au sens de sa définition)");
  out.push("   ▫ = un seul outil (une prestation, pas encore un module)");
  out.push("```");
  return out;
}

// ============================================================================
// LA CARTE CIBLE — une PROPOSITION, et elle dit qu'elle en est une
// ============================================================================
// TROIS TENTATIVES MÉCANIQUES, TROIS ÉCHECS MESURÉS, et c'est le vrai résultat de ce chantier.
// Avant de proposer quoi que ce soit, on a cherché un axe DÉJÀ CONSTATÉ par le dépôt qui
// regrouperait les 76 prestations en modules. Les trois réponses, chiffrées :
//
//   ① par FAMILLE de l'organigramme → écarté par lui-même : « oublier les familles que j'ai
//      créées ». Et la mesure lui donne raison, elles sont déclarées à la main à 100 %.
//   ② par OUTIL PARTAGÉ (deux prestations qui emploient le même outil sont du même module) →
//      7 groupes seulement, 22 prestations dedans, 54 restent seules.
//   ③ par DOMAINE CONSTATÉ (ce que les outils LISENT du dépôt) → 19 prestations tombent dans
//      « transverse » et 17 dans « non mesurable » : 36 sur 76 inclassables.
//
// LA CONCLUSION EST DONC UN NON, ET ELLE RÉPOND DIRECTEMENT À SA QUESTION P29-7 (« sait-on
// constater des familles par l'axe PRESTATION RENDUE ? ») : non, pas aujourd'hui. Aucun axe
// mécanique du dépôt ne produit un découpage en modules utilisable.
//
// D'OÙ UNE LISTE CURATÉE, ET SA NATURE MANUELLE EST ÉCRITE ICI PLUTÔT QUE SUBIE (Article 24, qui
// l'autorise à cette seule condition). Ce qui la rend légitime et non périssable : un GARDE-FOU
// mécanique vérifie qu'aucune prestation n'échappe au découpage, donc une prestation ajoutée
// demain se signalera au lieu de disparaître dans un silence.
//
// LA RÈGLE DE REGROUPEMENT EST LA SIENNE, pas la mienne : « un ensemble d'agents qui œuvrent dans
// un sens commun pour produire UNE PRESTATION ». Les modules ci-dessous regroupent donc par
// QUESTION POSÉE, jamais par parenté de rôle — c'est ce qui les distingue des familles.
// ⚠️ IL EXISTE UNE AUTRE CARTE CIBLE, ET ELLE EST ANTÉRIEURE (2026-10-02, tâche #1420) :
// `docs/referentiel/carte-cible-des-modules.md`, bâtie sur les 7 FAMILLES de l'organigramme et
// mesurée par `node scripts/cassandra-rh.mjs carte-cible`. Celle-ci est bâtie sur les 76
// PRESTATIONS, parce que c'est l'axe de sa définition du 2026-10-03. Les deux ne répondent pas à
// la même question et aucune n'annule l'autre à cette heure — mais deux porteurs de la même
// intention finissent par diverger (leçon L29), donc le choix lui revient et il est ouvert.
// Le rapprochement complet est écrit dans l'autre document, pas ici : une seule des deux doit
// porter la comparaison, sinon elle aussi existera en double.
export const MODULES_CIBLES = [
  { cle: "gouvernance", titre: "GOUVERNANCE", quoi: "la loi du projet : la charte, la philosophie, les règles, et ce qui les allège",
    prestations: ["Pack Tables de Loi", "Pack Références", "Pack Régence", "Pack Classification", "Pack Diète", "Pack Espion", "Pack Criticité"] },
  { cle: "qualite-du-code", titre: "QUALITÉ DU CODE", quoi: "ce que le code vaut : dette, duplication, tests, robustesse, découpage",
    prestations: ["Pack Rénovation", "Pack Blindage", "Pack Chasse", "Pack Chasse aux clones", "Pack Même notion, deux écritures", "Pack Points de coupe", "Pack Découpage", "Pack Le filet lui-même", "Pack Filet en parts", "Pack Sentinelle", "Pack Éclaireur", "Pack Uniformité"] },
  { cle: "pilotage", titre: "PILOTAGE DU TRAVAIL", quoi: "ce qu'on fait, dans quel ordre, et si les règles de travail ont été tenues",
    prestations: ["Pack Boussole", "Pack Découpe", "Pack Ronde", "Pack Déroulé de Ronde", "Pack Boussole des process", "Pack Discipline d'exécution", "Pack Niveau attendu", "Pack Mode de travail", "Pack Nuit autonome", "Pack Saisine", "Pack Suis-je à jour", "Pack Où on en est", "Pack Fidélité du suivi", "Pack Objectifs"] },
  { cle: "memoire", titre: "CONNAISSANCE ET MÉMOIRE", quoi: "ce que l'équipe sait déjà, et comment on le retrouve",
    prestations: ["Pack Circulation des données", "Pack Mémoire Longue", "Pack Registre", "Pack Secrétariat", "Pack Page HTML d'un document", "Pack Message court", "Pack Rapports non unifiés", "Pack Cerveau de recherche"] },
  { cle: "outillage", titre: "ORGANISATION DE L'OUTILLAGE", quoi: "ce qu'est chaque outil, ce qu'il vaut, qui l'emploie et qui le nomme",
    prestations: ["Pack Rangement", "Pack Recensement", "Pack Convocation", "Pack Direction RH", "Pack Accueil", "Pack Trajectoire", "Pack Compteur d'usage", "Pack Cerveau central", "Pack Baptême", "Pack Niveau"] },
  { cle: "export", titre: "EXPORT ET LIVRAISON", quoi: "ce qui part, ce qui reste, et ce que coûterait de tout reprendre",
    prestations: ["Pack Départ", "Pack Aveugle", "Pack Sauvegarde", "Pack Chiffrage de refonte"] },
  { cle: "le-jeu", titre: "LE JEU", quoi: "l'esprit des personnages, le rendu, et les simulations — le seul module qui regarde le PRODUIT",
    prestations: ["Pack Fidélité du ton", "Pack Empreinte", "Pack Provocation", "Pack Vitrine", "Pack Memory-Audit", "Pack Lancement de simulation", "Pack Discipline de simulation", "Pack Régie de simulation", "Pack Résumé de journal", "Pack Décollage"] },
  { cle: "ressources", titre: "RESSOURCES ET COÛTS", quoi: "le temps, les quotas, les tokens, et ce qui ralentit le projet",
    prestations: ["Pack Heure", "Pack Dépannage", "Pack Sobriété", "Pack Tableau de bord", "Pack Anti-lourdeurs"] },
  { cle: "audit", titre: "AUDIT INDÉPENDANT", quoi: "le regard extérieur, celui qui n'est juge et partie d'aucun chantier",
    prestations: ["Pack Verdict", "Pack Bouclier", "Pack Panorama", "Pack Réseau de vérifications", "Pack Profil utilisateur"] },
];

// LE GARDE-FOU QUI REND LA LISTE CURATÉE ACCEPTABLE : il va dans LES DEUX SENS (BP4). Une
// prestation du catalogue absente du découpage est un trou ; un nom cité par le découpage qui
// n'existe plus au catalogue est une référence morte, et une référence morte ressemble à un lien,
// ce qui est pire qu'une absence (Article 28, même doctrine que checkActionChain).
export function findPrestationsHorsModule({ prestations = PRESTATIONS, modules = MODULES_CIBLES } = {}) {
  if (!prestations?.length) {
    return { mesurable: false, pourquoi: "catalogue vide : un découpage mesuré sur zéro prestation serait complet par accident, jamais par vérification (leçon L11)" };
  }
  const nommees = new Set(modules.flatMap((m) => m.prestations));
  const auCatalogue = new Set(prestations.map((p) => p.nom));
  const doublons = [];
  const vus = new Set();
  for (const m of modules) for (const n of m.prestations) { if (vus.has(n)) doublons.push(n); vus.add(n); }
  return {
    mesurable: true,
    total: auCatalogue.size,
    // Au catalogue, dans aucun module : la prestation n'appartient à rien, donc elle ne partira
    // avec rien le jour d'un export par module.
    orphelines: [...auCatalogue].filter((n) => !nommees.has(n)),
    // Dans un module, plus au catalogue : le découpage promet une prestation qui n'existe pas.
    mortes: [...nommees].filter((n) => !auCatalogue.has(n)),
    // Dans DEUX modules : un module n'est plus une partition, et « détachable » perd son sens.
    doublons,
  };
}

// LE DÉCOUPAGE SUPPOSE QU'UN NOM DÉSIGNE UNE SEULE PRESTATION, ET CE N'ÉTAIT PAS VRAI
// (2026-10-03, trouvé en construisant la carte). Le catalogue porte 76 prestations pour 75 noms :
// DEUX s'appellent « Pack Boussole » — l'une rend l'état des tâches, l'autre retrouve une logique
// dans un gros fichier. Ce sont les noms par lesquels on COMMANDE une prestation ; un homonyme
// rend donc la commande ambiguë, et c'est très exactement la leçon L21 que ce fichier cite déjà
// plus bas (« un nom qui existe dans le monde d'un lecteur et pas dans celui d'un autre »).
//
// POURQUOI L'OUTIL NE RENOMME RIEN : c'est l'utilisateur qui nomme, et il nomme par SÉRIES dans
// une même famille, jamais au cas par cas. Un renommage décidé ici produirait un nom isolé — et
// le ferait sur la pièce même qui sert à commander le travail.
export function findPrestationsHomonymes({ prestations = PRESTATIONS } = {}) {
  if (!prestations?.length) return { mesurable: false, pourquoi: "catalogue vide : zéro homonyme sur zéro prestation n'est pas une bonne nouvelle, c'est une absence de mesure (L11)" };
  const parNom = new Map();
  for (const p of prestations) {
    if (!parNom.has(p.nom)) parNom.set(p.nom, []);
    parNom.get(p.nom).push(p);
  }
  const homonymes = [...parNom.entries()].filter(([, l]) => l.length > 1)
    .map(([nom, l]) => ({ nom, combien: l.length, demandes: l.map((p) => p.demande ?? ""), outils: l.map((p) => (p.outils ?? []).join(", ")) }));
  return { mesurable: true, total: prestations.length, nomsDistincts: parNom.size, homonymes };
}

export function schemaDeLaCarteCible(r, { prestations = PRESTATIONS, modules = MODULES_CIBLES } = {}) {
  if (!r?.mesurable) return [`❓ PAS MESURÉ — ${r?.pourquoi}`];
  const parNom = new Map(prestations.map((p) => [p.nom, p]));
  const out = ["**Carte CIBLE des modules — une PROPOSITION**, regroupée par QUESTION POSÉE et jamais par parenté de rôle.", "", "```"];
  out.push(`   ${modules.length} modules proposés pour ${r.total} prestations`);
  out.push("");
  out.push("                        ┌───────────────────────────┐");
  out.push("                        │   PARTIE INDÉTACHABLE     │");
  out.push("                        │  (ce que toute prestation │");
  out.push("                        │      réclame quoi qu'il   │");
  out.push("                        │          arrive)          │");
  out.push("                        └─────────────┬─────────────┘");
  out.push("                                      │");
  out.push("        ┌─────────────────────────────┼─────────────────────────────┐");
  for (const m of modules) {
    const n = m.prestations.filter((p) => parNom.has(p)).length;
    out.push("        │");
    out.push(`        ├── ▣ ${m.titre}  (${n} prestation${n > 1 ? "s" : ""})`);
    out.push(`        │      ${m.quoi}`);
  }
  out.push("        │");
  out.push("        └─────────────────────────────────────────────────────────────┘");
  out.push("```");
  return out;
}

export function formatCarteLines(actuelle, cible) {
  const out = [];
  out.push(...schemaDeLaCarteActuelle(actuelle));
  out.push("");
  out.push(...schemaDeLaCarteCible(cible));
  out.push("");
  if (cible?.mesurable) {
    if (cible.orphelines.length) out.push(`⚠️ ${cible.orphelines.length} prestation(s) du catalogue n'appartiennent à AUCUN module proposé : ${cible.orphelines.join(" · ")}`);
    if (cible.mortes.length) out.push(`⚠️ ${cible.mortes.length} nom(s) cité(s) par le découpage n'existent plus au catalogue — une référence morte ressemble à un lien : ${cible.mortes.join(" · ")}`);
    if (cible.doublons.length) out.push(`⚠️ ${cible.doublons.length} prestation(s) rangée(s) dans DEUX modules : ${cible.doublons.join(" · ")} — un module cesse alors d'être détachable`);
    if (!cible.orphelines.length && !cible.mortes.length && !cible.doublons.length) out.push("✅ Le découpage est une vraie partition : chaque prestation du catalogue appartient à un module, et un seul.");
  }
  const h = findPrestationsHomonymes();
  if (h.mesurable && h.homonymes.length) {
    out.push("");
    out.push(`⚠️ ${h.total} prestations pour seulement ${h.nomsDistincts} noms : le catalogue porte ${h.homonymes.length} homonyme(s), et ce sont les noms par lesquels on COMMANDE une prestation.`);
    for (const x of h.homonymes) {
      out.push(`   · « ${x.nom} » désigne ${x.combien} prestations différentes :`);
      x.demandes.forEach((d, i) => out.push(`       ${i + 1}. ${d} — ${x.outils[i]}`));
    }
    out.push("   L'outil ne renomme rien : c'est lui qui nomme, et par séries dans une même famille, jamais au cas par cas.");
  }
  return out;
}

function main() {
  recordCliUsage("le-coordinateur");
  // Sous-commande "catalogue" (tâche #154) : sur demande seulement, jamais mêlée à la synthèse
  // gratuite ci-dessous — `node scripts/le-coordinateur.mjs catalogue`.
  // UN ARGUMENT INCONNU REFUSE, il ne retombe pas en silence sur la synthèse (2026-09-23).
  // Trouvé en lançant Pack Panorama pour de vrai sur demande de l'utilisateur : `le-coordinateur.mjs
  // panorama` — le nom exact que le catalogue donne à ce pack — a exécuté la synthèse par défaut
  // sans un mot. Le résultat était le bon par hasard, et c'est précisément ce qui rend le défaut
  // méchant : le jour où un nom de pack ne correspondra PAS au comportement par défaut, on lira une
  // sortie en croyant en avoir demandé une autre. Même forme que la leçon L21 — un nom qui existe
  // dans le monde d'un lecteur et pas dans celui d'un autre.
  const sousCommande = process.argv[2];
  const SOUS_COMMANDES = ["catalogue", "memes-sources", "carte", "coeur"];
  if (sousCommande && !SOUS_COMMANDES.includes(sousCommande)) {
    console.log(`❌ « ${sousCommande} » n'est pas une sous-commande de cet outil.`);
    console.log(`   Sous-commandes réelles : ${SOUS_COMMANDES.join(", ")}`);
    console.log(`   Sans argument : la synthèse gratuite du réseau — c'est elle que le catalogue appelle « Pack Panorama ».`);
    console.log(`   Un nom de PACK n'est pas une commande : un pack nomme une COMBINAISON d'outils, il ne s'exécute pas d'un seul mot.`);
    process.exitCode = 1;
    return;
  }
  // `memes-sources` (2026-10-01, tâche #1382) — l'axe « ce que les outils FONT », que le détecteur
  // d'offres concurrentes déclarait hors de sa portée depuis sa création.
  if (sousCommande === "memes-sources") {
    const r = findOutilsQuiLisentLesMemesSources();
    console.log(formatOutilsMemesSourcesLines(r).join("\n"));
    // LES DEUX MOITIÉS DE SA PHRASE, DANS LA MÊME SORTIE (2026-10-03, tâche #1460). Il a demandé de
    // « mesurer le chevauchement autrement », en comparant ce que les outils FONT. L'entrée et la
    // sortie sont les deux faces de ce « font », et les séparer en deux commandes ferait qu'on
    // n'en lirait qu'une — exactement le sort du détecteur textuel, lu seul pendant des jours
    // pendant que son zéro ne mesurait plus rien.
    console.log("");
    console.log(outilsQuiEcriventLaMemeChoseLines(findOutilsQuiEcriventLaMemeChose()).join("\n"));
    return;
  }
  // `carte` (2026-10-03, tâche #1536) — sa demande d'un SCHÉMA et non d'un texte. Le livrable est
  // le FICHIER (Article 31, faille 3), et il porte les DEUX cartes : l'actuelle, qui se dérive, et
  // la cible, qui est une proposition et le dit.
  // `coeur` (tâche #1538) — ses trois définitions mises à l'épreuve du graphe réel. À la main :
  // la question se pose au moment où l'on décide d'une refonte, jamais à chaque commit.
  if (sousCommande === "coeur") {
    const r = partieIndetachable({ root: ROOT });
    if (!r.mesurable) { console.log(`🚨 PAS MESURÉ — ${r.pourquoi}`); process.exitCode = 1; return; }
    const c = coeurDeLAgence(r.centreDeGravite);
    const distribution = prestationsParNombreDOutils();
    console.log(`${r.scripts} script(s) · ${r.pointsDentree} point(s) d'entrée · ${r.total} fichier(s) strictement indétachable(s)`);
    console.log(c.mesurable ? `Cœur dérivé (saut de ${c.saut} points d'entrée) : ${c.coeur.map((x) => `${x.chemin} ${Math.round(x.part * 100)} %`).join(" · ")}` : `Cœur PAS MESURÉ — ${c.pourquoi}`);
    for (const d of distribution) console.log(`  ${d.prestations} prestation(s) portée(s) par ${d.outils} outil(s)`);
    const dossier = join(ROOT, "docs/livrables");
    try { mkdirSync(dossier, { recursive: true }); } catch { /* déjà là */ }
    const jour = new Date().toISOString().slice(0, 10);
    const sortie = join(dossier, `le-module-la-partie-indetachable-le-coeur-${jour}.md`);
    writeFileSync(sortie, `${lignesDuCoeurEtDuModule({ r, c, distribution, date: jour }).join("\n")}\n`, "utf8");
    console.log(`\nRapport déposé : ${sortie.replace(`${ROOT}/`, "")}`);
    return;
  }
  if (sousCommande === "carte") {
    const actuelle = carteDesModules();
    const partition = findPrestationsHorsModule();
    const lignes = formatCarteLines(actuelle, partition);
    console.log(lignes.join("\n"));
    // LE DÉPÔT VA DANS `docs/livrables/`, PAS DANS LE REGISTRE DU CATALOGUE : ce registre tient
    // une SÉRIE de versions datées du catalogue, et son index est une table tenue à la main de
    // cette série. Y glisser un document d'une autre nature l'aurait rendu faux au premier
    // passage du contrôle d'index — trouvé en le faisant, et le filet l'a refusé.
    const dossier = join(ROOT, "docs/livrables");
    try { mkdirSync(dossier, { recursive: true }); } catch { /* déjà là */ }
    const jour = new Date().toISOString().slice(0, 10);
    const sortie = join(dossier, `carte-des-modules-${jour}.md`);
    // LES MARQUEURS DISENT « CECI EST UNE SORTIE D'OUTIL » (voir BLOCS_GENERES, lib-shell) : sans
    // eux, ce document — qui énumère 76 prestations et 9 modules — ressemble forcément à un index
    // du dépôt, et le détecteur de documents jumeaux l'a signalé le jour même de son premier dépôt.
    writeFileSync(sortie, ["# La carte des modules de l'Agence", "", MARQUEUR_GENERE_DEBUT, "", ...lignes, "", MARQUEUR_GENERE_FIN, ""].join("\n"), "utf8");
    console.log(`\nRapport déposé : docs/livrables/carte-des-modules-${jour}.md`);
    const constats = [];
    if (actuelle.mesurable && actuelle.solitaires > actuelle.ensembles) {
      constats.push({ constat: `${actuelle.solitaires} prestations sur ${actuelle.total} ne sont portées que par UN outil : sa définition d'un module (« un ensemble d'agents ») ne décrit pas le catalogue actuel`, etat: "a-trancher", pourquoi: "soit le catalogue est découpé plus fin que ses modules et il faut regrouper, soit la définition vise la cible et non l'existant — c'est son arbitrage, pas une mesure" });
    }
    const h = findPrestationsHomonymes();
    if (h.mesurable && h.homonymes.length) {
      constats.push({ constat: `${h.homonymes.length} nom(s) de prestation désignent plusieurs prestations différentes, alors que ce sont les noms par lesquels on les commande`, etat: "a-trancher", pourquoi: "renommer est son privilège, et il nomme par séries dans une même famille — un nom choisi ici serait un nom isolé, sur la pièce même qui sert à commander le travail" });
    }
    if (partition.mesurable && (partition.orphelines.length || partition.mortes.length)) {
      constats.push({ constat: `le découpage proposé n'est plus une partition : ${partition.orphelines.length} prestation(s) sans module, ${partition.mortes.length} référence(s) morte(s)`, etat: "retenu", tache: 1536 });
    }
    console.log("");
    imprimerPlanDaction(buildPlanDaction(constats, { toolSlug: "le-coordinateur" }));
    return;
  }
  if (sousCommande === "catalogue") {
    const result = recordCatalog();
    console.log("=== LE-COORDINATEUR — catalogue d'offres nommé ===\n");
    console.log(renderNamedCatalog());
    console.log("");
    console.log(result.written ? `✅ Nouvelle version archivée : docs/le-coordinateur-catalogue/${result.fileName}` : `ℹ️  ${result.message}`);
    return;
  }

  const { duplicate, previousRun, rows } = runNetworkCheck();
  if (duplicate) {
    console.log(`⏭️  Aucun commit nouveau depuis le dernier passage complet (${previousRun.lastWhen}) — relancé quand même, purement informatif.\n`);
  }
  console.log("=== LE-COORDINATEUR — synthèse gratuite du réseau d'outils ===\n");
  console.log(formatTable(rows));
  console.log("\nCeci reste un tableau de synthèse, jamais un verdict : relire la sortie complète de l'outil concerné avant d'agir sur une ligne \"à regarder\" (cf. docs/regles-de-travail.md, aucun de ces outils n'est autonome).");
  console.log("Jamais déclenché ici : HYPER-SCAN-CHECKPOINT (version complète), Smart Conso API, ou une simulation — toujours une décision explicite séparée, jamais une initiative du coordinateur.");
  console.log("\n=== Menu des prestations disponibles via le réseau d'outils ===\n");
  console.log(formatMenu());
  console.log("\nRappel ouvert à chaque passage automatique (demande explicite de l'utilisateur) : ce menu n'exécute rien tout seul — il rappelle ce qui PEUT être commandé, à l'agent comme à l'utilisateur à travers lui.");
  // LE CHEVAUCHEMENT SE DIT ICI, dans le rapport du catalogue, plutôt que dans un quarante-et-unième
  // item de Ronde : c'est une question SUR le catalogue, et la poser ailleurs que là où le catalogue
  // se rend obligerait à tenir un rendez-vous de plus pour une ligne (Article 31 — étendre plutôt
  // qu'ajouter). Muet quand tout va bien, sauf la distribution, qui est la preuve que le seuil
  // tient encore.
  console.log("");
  for (const ligne of formatOffresConcurrentesLines(findOffresConcurrentes())) console.log(ligne);
  // LE MÊME RAPPORT PORTE LES DEUX QUESTIONS, parce qu'aucune ne remplace l'autre : celle
  // ci-dessus demande si deux offres se marchent dessus, celle-ci qui n'a AUCUNE offre. Mesurée
  // contre le dépôt réel plutôt que contre la table écrite à la main (#714) : c'est la différence
  // entre « les deux listes s'accordent » et « tout le monde est couvert ».
  console.log("");
  for (const ligne of formatOutilsMuetsLines(findOutilsMuets({ recensement: recenserLesScripts(), charteText: lireLaCharte() }))) console.log(ligne);
  // LES COMBINAISONS (#715) SORTENT DANS LE MÊME RAPPORT, et c'est cohérent avec les deux blocs
  // ci-dessus : ce rapport répond aux questions SUR le catalogue. « Deux offres se marchent-elles
  // dessus ? », « qui n'a pas d'offre ? », « quelle offre manque encore un nom ? » sont trois
  // faces du même sujet, et les répartir sur trois rendez-vous les rendrait invisibles.
  console.log("");
  for (const ligne of formatCombinaisonsLines(...mesurerLesCombinaisons())) console.log(ligne);
}

export function mesurerLesCombinaisons({ history = null, registres = null, root = ROOT, lireDossier = readdirSync, lireFichier = readFileSync } = {}) {
  let evenements = [];
  try { evenements = (history ?? loadToolUsageHistory()).events ?? []; } catch { /* le bloc dira « pas mesuré » plutôt que de rendre zéro */ }
  let regs = registres;
  const sourceParOutil = {};
  try {
    for (const f of lireDossier(join(root, "scripts"))) {
      if (!f.endsWith(".mjs")) continue;
      try { sourceParOutil[f.replace(/\.mjs$/, "")] = lireFichier(join(root, "scripts", f), "utf8"); } catch { /* fichier suivant */ }
    }
  } catch { /* idem */ }
  return [combinaisonsSpontanees(evenements), emboitements({ registres: regs ?? REGISTRIES_DOC_REPORT, sourceParOutil })];
}

export function lireLaCharte({ root = ROOT, readFile = readFileSync, exists = existsSync } = {}) {
  const chemin = join(root, "CLAUDE.md");
  return exists(chemin) ? readFile(chemin, "utf8") : "";
}

if (import.meta.url === `file://${process.argv[1]}`) main();
