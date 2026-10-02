// ICEBERG: membre
// tool-brain — cerveau central des rappels d'outils (2026-09-21, demande explicite de l'utilisateur :
// « ca ne doit pas seulement pointer vers find brain, mais aussi vers tous les outils et pour ce
// faire via le catalogue du coordinateur [...] resoud ce point definitivement [...] adapte avec
// l'existant mis en place pour find brain »).
//
// Généralise find-brain.mjs (qui reste inchangé, spécialisé sur les 2 outils de recherche dans le
// code) à TOUT le catalogue PRESTATIONS de LE-COORDINATEUR. Ne réimplémente rien : réutilise
// suggestPrestationsForTask()/formatMenu() (LE-COORDINATEUR), recommendFindBrain()/
// flagFindDeepBoosterCandidates() (find-brain.mjs), flagFindBoosterCandidates() (Doc-Report) et
// toolUsageStats()/toolsNeverUsed() (tool-usage.mjs) telles quelles — tool-brain n'ajoute que des
// points d'entrée uniques qui centralisent ce qui existe déjà, jamais un second calcul.
//
// Statut : « Membre certifié (classique) » — badge 🎖️ réel, mais SANS instanciation/registre/
// blueprint séparés (2026-09-21, reclarification explicite de l'utilisateur : « il y a des membres
// certifiés qui ont une connaissance propre au projet et d'autres qui n'en ont pas [...] oui ce sont
// tous des membres certifiés » puis « membre certifié couvre les deux catégories »). tool-brain n'a
// AUCUNE connaissance propre au projet à documenter à part — il appelle/agrège ce que LE-COORDINATEUR/
// find-brain/tool-usage.mjs disent déjà — exactement la même catégorie que LE-COORDINATEUR/
// CIRCLE-TASKS/route-booster. Documenté directement dans `docs/regles-de-travail.md` (carte des
// outils + §7ter), jamais de blueprint ni de registre séparés (`checkAgentOnboarding()`,
// `le-coordinateur.mjs`, paramètre `ownKnowledge: false`).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { PRESTATIONS, suggestPrestationsForTask, formatMenu, slugifyAgentName, primaryToolName, inventaireDesFonctions, chercherUneFonctionExistante, formatFonctionExistanteLines } from "./le-coordinateur.mjs";
import { recommendFindBrain, flagFindDeepBoosterCandidates, FIND_DEEP_BOOSTER_NICKNAME } from "./find-brain.mjs";
import { flagFindBoosterCandidates } from "./doc-report.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE, PLAN_QUOI_QUOIFAIRE } from "./report-template.mjs";
import { toolUsageStats, toolsNeverUsed, recordCliUsage, usagesSpontanes, formatUsagesSpontanesLines, findOriginesJamaisEcrites, formatOriginesJamaisEcritesLines, findOutilsCitesSansPassage, horizonDuJournal, formatHorizonLine } from "./tool-usage.mjs";
import { assessCriticality } from "./ecotoken.mjs";
import { printReliabilityNotice, lireFichierPartage } from "./lib-shell.mjs";

import { auditLecons, leconsPourTache, enregistrerRemontee } from "./tool-learning.mjs";

export const TOOL_BRAIN_SLUG = "tool-brain";
const USAGE_HISTORY_URL = new URL("../.tool-usage-history.json", import.meta.url);
// La racine du dépôt, pour lire les registres `docs/<slug>/` (tâche #1379). Injectable partout où
// elle sert, pour qu'un test puisse pointer un faux dossier sans toucher au vrai.
const ROOT = fileURLToPath(new URL("..", import.meta.url));

// LE LECTEUR A DÉMÉNAGÉ CHEZ LE PROPRIÉTAIRE DU MAGASIN (2026-09-27, tâche #715) : il est défini
// dans tool-usage.mjs, le fichier qui ÉCRIT ces événements. Il restait ici pour des raisons
// d'histoire — tool-brain se trouvait être son premier lecteur — et forçait tout autre lecteur à
// importer tool-brain, donc le catalogue, donc un cycle. Réexporté pour ne casser aucun appelant.
// PIÈGE ESM, PAYÉ DEUX FOIS DANS LA MÊME NUIT (2026-09-27) : `export { X } from "..."` réexporte X
// pour les appelants SANS le lier dans la portée locale de ce fichier. `rapportDesMuets()` appelle
// `loadToolUsageHistory()` juste en dessous — avec le seul réexport, elle plantait sur « is not
// defined », et le verrou de Ronde qui s'appuie dessus passait de « propre » à « pas mesuré ».
// Rien dans la relecture ne le montre : la ligne a l'air parfaitement correcte. On importe ET on
// réexporte.
import { loadToolUsageHistory } from "./tool-usage.mjs";
// LA PORTÉE DU COMPTEUR SE DEMANDE À CASSANDRA-RH, jamais recalculée ici (tâche #1383) : elle
// exclut la suite de tests, les crochets git et le compteur lui-même, et chacune de ces trois
// exclusions a coûté un faux verdict avant d'être écrite.
import { invisiblesAuCompteur } from "./cassandra-rh.mjs";
export { loadToolUsageHistory };

// --- 1. Consultation à la demande (inchangé depuis la première version) ---
// Seuil de correspondance déjà fixé par suggestPrestationsForTask() elle-même (score >= 2) —
// jamais un second seuil divergent ici. Le score n'est PLUS un simple compte de mots depuis le
// 2026-09-29 (tâche #1247) : chaque champ de la prestation pèse différemment (nom 2, demande 1,
// description 0,5), parce que le rapprochement ne lisait qu'un champ sur trois et que 69 des 74
// prestations étaient alors introuvables par leur propre nom.
export function adviseToolBrain({ taskDescription, filePath } = {}) {
  const prestations = taskDescription ? suggestPrestationsForTask(taskDescription) : [];
  const fileAdvice = filePath ? recommendFindBrain(filePath) : undefined;
  // CRITICITÉ (2026-09-22, règle de travail 3quater : « la criticité d'un fichier doit toujours être
  // évaluée avant d'y mener une action spécifique »). La mesure existait déjà dans ecotoken, mais
  // elle n'était atteignable qu'en lançant ecotoken SUR ce fichier — donc jamais au moment où elle
  // sert, c'est-à-dire juste avant d'agir. tool-brain étant le seul réflexe obligatoire avant de
  // toucher un fichier, c'est ici qu'elle doit apparaître : la règle devient atteignable au lieu de
  // rester une bonne intention. Jamais un second calcul — assessCriticality() est appelée telle
  // quelle, l'unique source de cette échelle à 6 niveaux.
  let criticite;
  if (filePath) { try { criticite = assessCriticality(filePath); } catch { criticite = undefined; } }
  // L'EXPÉRIENCE DÉJÀ PAYÉE (2026-09-23, process XP-IA-bonnes-pratiques-et-lecons, tâche #221).
  //
  // POURQUOI ICI, et pas dans un rapport à part. Le registre des leçons existait, il était audité à
  // chaque Ronde, et il ne changeait rien à ma façon de travailler le mardi suivant — parce qu'une
  // leçon relue une fois par période n'atteint jamais le moment où elle s'applique. Objectif posé
  // par l'utilisateur : « que tu mettes en pratique ces leçons, en plus de t'auto-analyser ».
  // tool-brain est le SEUL réflexe que l'agent a l'obligation d'avoir avant d'agir (« c'est lui qui
  // est plugué directement à moi ») : c'est donc le seul endroit d'où une leçon peut arriver à
  // temps. Même geste que la criticité juste au-dessus, pour la même raison exactement.
  //
  // JAMAIS LES ONZE À CHAQUE FOIS : le tri vient du TERRAIN que chaque entrée déclare elle-même, et
  // une correspondance nulle rend une liste vide plutôt qu'un repêchage « au cas où ». Un rappel qui
  // sort à chaque fois devient un meuble — c'est la leçon L6, appliquée au mécanisme qui la publie.
  //
  // LE FICHIER COMPTE AUTANT QUE LA PHRASE (2026-09-23, amélioration ③). Une même tâche se formule
  // de dix façons : si je dis « je reprends ce bout de code » sans employer le mot « test », la
  // leçon sur les tests ne remontait pas alors qu'elle s'applique. Le chemin du fichier, lui, ne
  // ment pas sur ce qu'on s'apprête à toucher.
  let experience = [];
  if (taskDescription || filePath) {
    try {
      const audit = auditLecons();
      if (audit.mesure === "mesuré") experience = leconsPourTache(taskDescription, { lecons: audit.lecons, fichiers: filePath ? [filePath] : [] });
    } catch { experience = []; }
  }
  return { prestations, fileAdvice, criticite, experience };
}

// Le rendu de ces entrées, gardé à côté de leur sélection pour qu'un appelant n'ait jamais à
// réinventer la mise en forme — et silencieux quand rien ne correspond, ce qui est le cas normal.
export function formatExperience(experience = []) {
  if (!experience.length) return [];
  const l = ["🧪 Expérience déjà payée — ce que ce projet a appris sur ce terrain :"];
  for (const e of experience) l.push(`   ${e.id} (${e.nature}) — ${String(e.titre).replace(/^(L\d+|BP\d+)\s*—\s*/, "")}`);
  l.push("   (registre complet : docs/referentiel/lecons.md — une entrée qui ne sert jamais est à supprimer ou à reformuler)");
  return l;
}

// --- 2. Rappel centralisé post-commit (2026-09-21, remplace 3 blocs auparavant éparpillés dans
// scripts/hooks/check-last-commit.mjs : find-booster, find-deep-booster, et le menu PRESTATIONS nu
// — demande explicite : « je veux un rappel centralisé sur tool-brain : c'est sa vocation profonde
// plutôt que des rappels éparpillés »). Une seule bannière, une seule fonction à appeler.
export function formatToolBrainReminder({ prestations = PRESTATIONS } = {}) {
  const findBoosterCandidates = flagFindBoosterCandidates();
  const findDeepBoosterCandidates = flagFindDeepBoosterCandidates();
  const lines = ["🧠 tool-brain — rappel centralisé des outils :"];
  if (findBoosterCandidates.length) {
    lines.push(`\n🧭 find-booster : ${findBoosterCandidates.map((c) => `${c.label} (~${c.tokens} tokens)`).join(", ")} méritent une recherche par concept avant toute lecture intégrale.`);
  }
  if (findDeepBoosterCandidates.length) {
    lines.push(`\n🔧 ${FIND_DEEP_BOOSTER_NICKNAME} : ${findDeepBoosterCandidates.map((c) => `${c.label} (${c.lineCount} lignes, ${c.cutPointCount} points de coupe)`).join(", ")} méritent un vrai zoom de découpage avant toute lecture intégrale.`);
  }
  lines.push("\n\n📋 Prestations disponibles via le réseau d'outils (rappel automatique) :\n", formatMenu(prestations));
  return lines.join("");
}

// --- 3. KPI d'usage global (2026-09-21, demande explicite : « il a son KPI (tres important) [...]
// pour te dire si tu as suffisamment utilisé les outils »). La liste des outils connus vient de
// PRESTATIONS elle-même (slugifyAgentName() sur chaque nom cité dans `outils`) — jamais une
// deuxième liste maintenue à la main qui pourrait diverger du catalogue réel.
//
// `primaryName` (2026-09-21, bug réel trouvé en lançant `node scripts/tool-brain.mjs rapport`
// contre le vrai dépôt) : un `outils` de PRESTATIONS porte parfois une précision entre parenthèses
// ("ARGUS (mécanique)", "THE-FINAL-JUDGE (mandat sécurité inclus)", "Smart Breaker
// (check-gemini-quota.mjs)") — slugifier le texte ENTIER produisait un faux slug distinct
// ("argus-m-canique") jamais utilisé nulle part par `recordToolUsage()`, faisant apparaître à tort
// le même outil comme "jamais sollicité" sous deux identités différentes. Même découpage déjà
// établi ailleurs dans ce fichier (`badgeWarningsForOutils()`, `findToolsMissingFromMenu()`) —
// jamais une troisième règle divergente.
// UN CHEMIN DE FICHIER N'EST PAS UN OUTIL (2026-09-23). Deux entrées de PRESTATIONS nomment un
// document ou un script en guise d'outil (« docs/simulations/correctifs-a-revalider.md »,
// « scripts/... »). Le découpage sur « / » en tirait alors le premier segment — « docs »,
// « scripts » — et fabriquait des outils FANTÔMES, comptés comme « jamais sollicités » alors
// qu'ils n'existent pas et ne pourront jamais l'être. Un compteur qui reproche une inaction sur
// une entité inexistante use la crédibilité de tous ses autres reproches (leçon L4).
// La distinction est un CHEMIN (avec un dossier devant) contre un NOM DE FICHIER NU. Ce projet
// nomme réellement certains outils par leur fichier — « check-house.mjs » est son nom, pas une
// référence. Couper sur l'extension seule les effaçait tous les deux, ce qui remplaçait un faux
// positif par un angle mort : un outil disparu du compteur n'est pas un outil dont le compteur
// dit la vérité. Seul un chemin comportant un dossier est écarté.
const EST_UN_CHEMIN = /^(?:docs|scripts|lib|app|components)\//i;

export function knownToolSlugsFromPrestations(prestations = PRESTATIONS) {
  return [...new Set(
    prestations
      .flatMap((p) => p.outils)
      .filter((o) => !EST_UN_CHEMIN.test(String(o).trim()))
      .map((o) => slugifyAgentName(primaryToolName(o))),
  )];
}

// COUVERT PAR LE CROCHET ≠ JAMAIS SOLLICITÉ (2026-09-23). `check-house.mjs` tourne à CHAQUE commit,
// avant et après, et n'a jamais enregistré une sollicitation de sa vie : le compteur ne voit que
// les appels qui passent par lui. Le déclarer « jamais sollicité » était exact au sens du registre
// et faux au sens de la réalité — la pire espèce d'indicateur, celui qui a techniquement raison.
// La liste ne s'énumère pas : elle se DÉRIVE du code du crochet lui-même (Article 24), donc un
// outil câblé demain y entrera sans qu'une ligne bouge ici.
export function outilsCouvertsParLeCrochet(sourceCrochet = "", slugs = []) {
  const texte = String(sourceCrochet);
  return slugs.filter((slug) => {
    const script = slug.replace(/-mjs$/, ".mjs");
    return texte.includes(`${script}`) || texte.includes(`"${slug}"`) || texte.includes(`'${slug}'`);
  });
}

// LES COMBINAISONS, ET POURQUOI ON MESURE LE FAIT PLUTÔT QUE LA DÉCLARATION (2026-09-23, question
// directe de l'utilisateur : « est-ce que tu utilises les COMBINAISONS d'outils AUSSI : celles du
// catalogue du coordinateur ? »).
//
// LA RÉPONSE HONNÊTE ÉTAIT : PERSONNE N'EN SAVAIT RIEN. Le compteur n'enregistre qu'un `toolSlug`
// à la fois — sur 1 184 événements, aucun ne mentionne un pack. Cinq packs du catalogue nomment
// pourtant une vraie combinaison, de deux à huit outils.
//
// LA MAUVAISE SOLUTION aurait été d'ajouter un champ « pack » que l'agent remplit en lançant le
// pack. On aurait alors mesuré une DÉCLARATION — « j'ai pensé au pack » — et pas un fait. Ce projet
// a déjà payé pour cette confusion plusieurs fois dans la même journée.
//
// CE QU'ON MESURE À LA PLACE : la combinaison A-T-ELLE EU LIEU. Si tous les outils d'un pack ont
// été sollicités dans une même fenêtre de temps, le pack a été réalisé — que l'agent l'ait nommé
// ou même qu'il en ait eu conscience. C'est plus honnête et c'est plus intéressant : ça distingue
// « le pack existe et personne ne le fait » de « le pack se fait tout seul, le nommer n'apporterait
// rien ». Deux diagnostics opposés qu'un champ déclaratif aurait confondus.
export const FENETRE_COMBINAISON_MINUTES = 30;

export function packsRealises(history, prestations = PRESTATIONS, { fenetreMinutes = FENETRE_COMBINAISON_MINUTES } = {}) {
  const evenements = (history?.events ?? []).filter((e) => e.at).sort((a, b) => a.at - b.at);
  const fenetre = fenetreMinutes * 60 * 1000;
  const multi = prestations.filter((p) => p.outils.length > 1);
  return multi.map((p) => {
    const slugs = p.outils
      .filter((o) => !EST_UN_CHEMIN.test(String(o).trim()))
      .map((o) => slugifyAgentName(primaryToolName(o)));
    let realisations = 0;
    // Pour chaque événement, on regarde si la fenêtre qui s'ouvre là contient tous les outils du
    // pack. Fenêtre glissante simple : un pack réalisé deux fois de suite compte deux fois, mais
    // jamais une fois par outil.
    for (let i = 0; i < evenements.length; i++) {
      const fin = evenements[i].at + fenetre;
      const vus = new Set();
      for (let j = i; j < evenements.length && evenements[j].at <= fin; j++) vus.add(evenements[j].toolSlug);
      if (slugs.every((sl) => vus.has(sl))) { realisations++; i += slugs.length - 1; }
    }
    // MOINS DE DEUX OUTILS APRÈS FILTRAGE = ce n'est pas une combinaison. « Pack Décollage »
    // nomme deux entrées dont l'une est un DOCUMENT (un carnet de correctifs), pas un outil : le
    // compter comme une combinaison réalisée 157 fois aurait été un chiffre flatteur et faux.
    return { pack: p.nom, outils: slugs, taille: slugs.length, realisations, estUneCombinaison: slugs.length >= 2 };
  }).sort((a, b) => a.realisations - b.realisations);
}

// QUATRE ÉTATS DEPUIS LE 2026-09-25 (tâche #763, « tu retrouves la vérité »), et le quatrième est
// né d'une mesure qui a donné exactement le contraire de ce qu'elle affichait.
//
// CE QUI S'EST PASSÉ, et c'est le fil rouge du projet appliqué au compteur lui-même. Le rapport
// annonçait 5 outils « jamais sollicités ». Ces 5 sont, trait pour trait, les 5 seuls du catalogue
// qui n'appellent pas `recordCliUsage` — 44 autres l'appellent. Leur zéro ne mesurait pas leur
// inactivité, il mesurait LEUR SILENCE. Deux preuves, l'une vivante et l'autre d'archive :
// l'AGENT DES NOMS a été lancé trois fois dans l'heure qui a précédé cette correction et le
// compteur affichait toujours 0 ; THE-FINAL-JUDGE a rendu 20 constats le 2026-09-23, archivés dans
// `docs/the-final-judge/`, et le compteur affichait toujours 0.
//
// LE COÛT ÉTAIT SUR LE POINT D'ÊTRE PAYÉ : la conclusion naturelle d'un zéro est « relançons-le ».
// Relancer THE-FINAL-JUDGE — le plus cher du paysage, un agent séparé — pour refaire ce qui avait
// été fait deux jours plus tôt, c'est exactement le gaspillage que tout ce paysage existe pour
// éviter. D'où l'ordre imposé par l'utilisateur : retrouver la vérité D'ABORD, relancer ensuite,
// et seulement ce qui ressort vraiment à zéro.
//
// LE QUATRIÈME ÉTAT : un outil SANS ligne de commande du tout. THE-FINAL-JUDGE et THE-DEEP-READER
// sont des bibliothèques qui mettent en forme le rapport d'un AGENT SÉPARÉ ; aucun `node
// scripts/x.mjs` ne les lance, donc aucun compteur d'appels CLI ne pourra jamais les voir. Leur
// zéro n'est pas un fait sur leur usage, c'est une absence de mesure — et les deux ne se rendent
// jamais pareil. Ce que dit leur activité réelle, c'est leur REGISTRE, pas ce compteur.
// « Peut-on le lancer ? » se lit sur DEUX sources, jamais une seule — et la seconde a été ajoutée
// après un vrai faux verdict. La première version ne cherchait qu'un garde d'entrée dans le code
// (`import.meta.url ===`, `process.argv`), et rangeait `check-spirit` parmi les outils qu'aucun
// compteur ne peut voir. C'est faux : son corps s'exécute directement au chargement, et la charte
// écrit sa commande noir sur blanc. Même leçon que l'iceberg de CASSANDRA (L24) : **une COMMANDE
// ÉCRITE dans un document est une preuve, là où l'absence d'un motif dans le code n'est qu'un
// silence.** Les deux ensemble se trompent beaucoup moins que l'une des deux.
export function aUneLigneDeCommande(source = "", { offert = "", slug = "" } = {}) {
  if (/import\.meta\.url\s*===|process\.argv\.slice\(2\)|process\.argv\[2\]/.test(String(source))) return true;
  const nu = String(slug).replace(/-mjs$/, "");
  return nu ? new RegExp(`node\\s+scripts/(?:check-)?${nu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.mjs`).test(String(offert)) : false;
}

export function classerLesSilencieux(slugs = [], { lireSource, offert = "" } = {}) {
  if (typeof lireSource !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de source fourni — classer un silence sans lire le script revient à deviner pourquoi il se tait, et c'est précisément l'erreur que cette fonction existe pour empêcher" };
  }
  const sansCli = [], muets = [], inconnus = [];
  for (const slug of slugs) {
    const src = lireSource(slug);
    if (typeof src !== "string") { inconnus.push(slug); continue; }
    if (!aUneLigneDeCommande(src, { offert, slug })) sansCli.push(slug);
    else if (!/recordCliUsage/.test(src)) muets.push(slug);
  }
  return { mesurable: true, sansCli, muets, inconnus };
}

// ————————————————————————————————————————————————————————————————————————
// LE GARDE-FOU QUI EMPÊCHERA LE PROCHAIN OUTIL MUET (2026-09-26, tâche #778)
// ————————————————————————————————————————————————————————————————————————
//
// LE TROU QU'IL FERME : `classerLesSilencieux()` sait déjà reconnaître un outil MUET — il a une
// ligne de commande et n'enregistre jamais son passage — mais ce classement n'apparaissait que
// dans le rapport de Ronde, lancé à la main. **Un outil créé demain sans `recordCliUsage` rejoint
// donc la zone muette en silence, et son zéro se lit ensuite comme un verdict sur lui**, alors
// qu'il dit seulement que personne ne compte. Un compteur faux empoisonne toutes les décisions
// d'usage qui s'appuient dessus.
//
// CE QU'IL FAIT ET CE QU'IL NE FAIT PAS : il SIGNALE au commit, il ne bloque pas. Le choix entre
// signaler et bloquer revient à l'utilisateur et lui est posé (tâche #778, à trancher) ; en
// attendant, le comportement retenu est le moins brutal des deux, et c'est celui qu'on peut
// revenir en arrière sans rien perdre.
//
// MUET QUAND TOUT VA BIEN, jamais une ligne « 0 muet » à chaque commit : c'est ce bruit-là qui
// rend un contrôle invisible (leçon L6). Et un silence NON MESURABLE se dit, il ne se tait pas
// (leçons L5/L11) — sans lecteur de source, « aucun muet » et « rien n'a pu être lu » se
// ressembleraient trait pour trait.
export function muetsAuCompteurLines(rapport) {
  if (!rapport?.silenceMesurable) {
    return [`❓ Outils muets au compteur : PAS MESURÉ — ${rapport?.pourquoiSilenceNonMesure ?? "raison non fournie"}`];
  }
  const muets = rapport.muetsAuCompteur ?? [];
  if (!muets.length) return [];
  return [
    `⚠️  ${muets.length} outil(s) MUET(S) au compteur d'usage : ${muets.join(", ")}`,
    "   Ils ont une ligne de commande et n'appellent jamais `recordCliUsage` — leur zéro d'usage ne veut donc RIEN dire,",
    "   et il se lira pourtant comme un verdict sur eux. Ajouter l'appel, ou déclarer pourquoi cet outil n'est pas comptable.",
  ];
}

// rapportDesMuets() — LE CÂBLAGE RÉEL, sorti du main() le 2026-09-26 (tâche #778, décision de
// l'utilisateur « bloquer la Ronde, pas le commit »). Il vivait à l'intérieur de la sous-commande
// `muets` ; le verrou d'ouverture de Ronde (circle-tasks.mjs) en avait besoin à son tour, et le
// recopier aurait fabriqué exactement le doublon que CLONE-HUNTER traque. Un seul câblage, deux
// appelants : la sous-commande qui SIGNALE au commit, et le verrou qui BLOQUE l'ouverture.
// LES DOCUMENTS QUI DÉCLARENT L'OFFRE, PARAMÉTRABLES (2026-09-28, tâche #902). Deux endroits de ce
// fichier énuméraient la charte et les règles de travail directement dans leur corps — les deux
// derniers scripts du dépôt, avec hyper-scan-checkpoint, à n'offrir aucun moyen d'en changer. Une
// seule déclaration pour les deux : deux listes du même contenu finiraient par diverger (leçon
// L29), et l'ordre différait déjà entre elles sans qu'aucune raison ne l'explique.
export const DOCUMENTS_QUI_DECLARENT_L_OFFRE = ["../CLAUDE.md", "../docs/regles-de-travail.md"];

export function rapportDesMuets({ readFileImpl = lireFichierPartage, history = null, documentsDeLOffre = DOCUMENTS_QUI_DECLARENT_L_OFFRE } = {}) {
  let sourceCrochet = "";
  try { sourceCrochet = readFileImpl(new URL("./hooks/post-commit", import.meta.url), "utf8"); } catch { /* le classement reste juste, en moins large */ }
  let offert = "";
  for (const d of documentsDeLOffre) {
    try { offert += readFileImpl(new URL(d, import.meta.url), "utf8"); } catch { /* idem */ }
  }
  const lireSource = (slug) => {
    for (const c of [`./${slug}.mjs`, `./check-${slug}.mjs`]) {
      try { return readFileImpl(new URL(c, import.meta.url), "utf8"); } catch { /* essai suivant */ }
    }
    return null;
  };
  return buildToolBrainUsageReport(history ?? loadToolUsageHistory(), PRESTATIONS, { sourceCrochet, lireSource, offert });
}

// ─────────────────────────────────────────────────────────────────────────────
// LE REGISTRE SUR DISQUE EST UNE PREUVE, LE COMPTEUR N'EST QU'UN TÉMOIGNAGE
// (2026-10-01, tâche #1379)
//
// LE DÉFAUT, ET IL FAISAIT DIRE AU RAPPORT LE CONTRAIRE DE LA VÉRITÉ. Le compteur
// n'enregistre que les passages qui passent PAR LUI. Un outil lancé à la main en dehors de ce
// chemin reste à zéro, et le rapport le rangeait parmi les « jamais sollicités » avec, en plan
// d'action, « les lancer une fois pour de vrai, ou décider de les retirer ». Pour un outil qui a
// déjà tourné et déposé ses rapports, les deux moitiés de la phrase sont fausses.
//
// MESURÉ LE JOUR OÙ C'EST TROUVÉ : sur les **20** outils annoncés jamais sollicités, **7 avaient
// laissé de vrais fichiers dans leur propre registre** — the-screener (8), ines-official (6),
// check-spirit (3), x-port-blindtest (2), the-final-judge (2), objectifs-vs-resultats (2),
// kpi-report (1). Soit **35 % de la liste**, présentés comme inactifs alors qu'ils travaillaient.
//
// POURQUOI ÇA COMPTAIT CE JOUR-LÀ : la question posée était « quels outils peut-on fusionner ou
// retirer pour réduire l'effectif ? ». Décider une suppression sur un compteur qui rate un tiers
// de l'usage réel, c'est supprimer des outils qui servent.
//
// ET J'AVAIS DÉJÀ FAIT L'ERREUR MOI-MÊME quelques heures plus tôt, en écrivant que `check-spirit`
// n'avait jamais tourné — démenti par son registre, qui portait deux passages. La règle en est
// sortie : **quand un outil a un registre sur disque, c'est LUI qui dit s'il a tourné.** Elle
// vivait dans une note de session ; elle est mécanique à partir d'ici.
//
// TROIS ÉTATS, JAMAIS DEUX, et le troisième est le plus important (leçons L5 et L11) :
//   • A LAISSÉ DES TRACES — des fichiers dans `docs/<slug>/` : il a tourné, point.
//   • REGISTRE VIDE — le dossier existe et ne contient rien : aucune trace, vrai candidat.
//   • PAS DE REGISTRE — on ne peut pas savoir, et c'est légitime : tout outil n'écrit pas
//     forcément quelque chose (une pièce du kit peut être SANS OBJET). Rendre « aucune trace »
//     pour ce cas-là confondrait « je n'ai rien trouvé » avec « je n'ai pas pu regarder ».
//
// `index.md` EST EXCLU, et c'est indispensable : il est écrit par data-archangel, pas par l'outil.
// Le compter ferait passer chaque dossier indexé pour un outil actif — le faux vert symétrique.
export const FICHIERS_NON_PROBANTS = Object.freeze(["index.md"]);

export function tracesSurDisque(slug, { root = ROOT, listDirImpl = readdirSync, nonProbants = FICHIERS_NON_PROBANTS } = {}) {
  const dossier = join(root, "docs", slug);
  let entrees;
  try { entrees = listDirImpl(dossier, { withFileTypes: true }); }
  catch { return { etat: "pas-de-registre", fichiers: 0, pourquoi: `aucun dossier docs/${slug}/ — cet outil n'écrit peut-être rien, donc son silence ne prouve rien dans un sens ni dans l'autre` }; }
  let n = 0;
  const pile = [{ dir: dossier, entrees }];
  while (pile.length) {
    const { dir, entrees: es } = pile.pop();
    for (const e of es) {
      if (e.isDirectory()) {
        try { pile.push({ dir: join(dir, e.name), entrees: listDirImpl(join(dir, e.name), { withFileTypes: true }) }); } catch { /* illisible : il ne prouve rien */ }
      } else if (!nonProbants.includes(e.name)) n++;
    }
  }
  return n > 0
    ? { etat: "a-laisse-des-traces", fichiers: n, pourquoi: `${n} fichier(s) déposés dans docs/${slug}/ : il a tourné, quoi qu'en dise le compteur` }
    : { etat: "registre-vide", fichiers: 0, pourquoi: `docs/${slug}/ existe et ne contient aucun rapport : aucune trace d'un passage` };
}

// UNE LIBRAIRIE N'EST PAS UN OUTIL QU'ON « SOLLICITE » (2026-10-01, tâche #1380)
//
// INSTRUIT UN PAR UN, et c'est l'instruction qui a renversé la conclusion. Après le croisement
// avec les registres (#1379), il restait 8 « candidats au retrait ». Les lire un par un en a
// laissé ZÉRO :
//   • `tool-usage` est importé par **64 scripts** — c'est le compteur lui-même. Il tourne à chaque
//     appel de tout le paysage ; son zéro mesure qu'on ne le lance pas EN TANT QUE commande, ce
//     qui n'a aucun rapport avec son utilité. `check-level-target` est dans le même cas, à 4.
//   • `smart-breaker` ne sert qu'en PANNE de quota, `sauvegarde-projet` que le jour où il perd
//     l'accès, `run-simulation` / `le-regisseur` / `process-simulation-guardian` que pendant une
//     simulation. Pour tous ceux-là, **zéro est la valeur attendue et souhaitable** : un outil
//     d'urgence qui n'a jamais servi est une bonne nouvelle.
//   • `the-ghost` orchestre le mode nocturne — et il n'a pas été utilisé pendant une nuit
//     autonome. Celui-là est un vrai constat, mais sur MA pratique, jamais sur l'outil.
//
// CE QUI EST MÉCANISABLE ICI, ET CE QUI NE L'EST PAS. « Est-ce une librairie ? » se LIT : un
// fichier importé par un autre script est appelé, point. « Est-ce un outil de circonstance ? » ne
// se lit pas — il faudrait savoir si la circonstance s'est produite. On mécanise donc le premier
// et on DÉCLARE le second (Article 27 : quand un mécanisme est impossible, l'écrire EST la
// protection).
//
// LA CONCLUSION QUI COMPTE POUR LA QUESTION POSÉE : le compteur d'usage **ne peut pas** produire
// une liste de candidats au retrait. Ce n'est pas un défaut à corriger, c'est sa nature — il
// mesure des APPELS, et l'utilité d'un outil ne se lit pas dans son nombre d'appels.
// CE QUI SUIT ÉTAIT UN DOUBLON PLUS FAIBLE D'UN MÉCANISME QUI EXISTAIT DÉJÀ (2026-10-01, #1383).
//
// J'avais écrit ici un `estUneLibrairie()` qui comptait les importeurs d'un script. Il marchait.
// Mais `invisiblesAuCompteur()` (CASSANDRA-RH, tâche #1007, 2026-09-27) répondait DÉJÀ à la même
// question, et mieux : il exclut la SUITE DE TESTS — « tester un outil n'est pas l'exécuter », et
// `check-house.mjs` importe 81 % du parc, donc la compter promouvait presque tout en bibliothèque
// — il couvre aussi les crochets git et le compteur lui-même. Les deux rendaient les deux mêmes
// outils aujourd'hui ; le mien tombait dans le piège dès qu'un script serait importé par la seule
// suite de tests. **Un défaut latent est un défaut.**
//
// POURQUOI JE NE L'AVAIS PAS VU : ma reprise des notes (Article 30) a cherché « fusion outils
// effectif » puis « outils qui se chevauchent ». Le dépôt range ce sujet sous **« outils à retirer
// ou refondre »**, et c'est la tâche elle-même qui le disait — « trace probable dans CASSANDRA-RH ».
// L'Article 30 prévoit exactement ce cas : un zéro n'est pas la preuve qu'il n'y a rien à savoir,
// c'est la preuve que CE MOT-LÀ ne ressort pas.
export function separerLesLibrairies(slugs = [], { horsDePortee = null, ...options } = {}) {
  const r = horsDePortee ?? invisiblesAuCompteur(options);
  // Si la mesure échoue, on ne suppose PAS que personne n'est une bibliothèque : on laisse tout
  // dans « autres » ET on le dit, plutôt que de rendre un verdict sur une base inconnue (L5/L11).
  if (!r?.mesurable) return { mesurable: false, pourquoi: r?.pourquoi ?? "la portée du compteur n'a pas pu être mesurée", librairies: [], autres: [...(slugs ?? [])] };
  const librairies = [], autres = [];
  for (const slug of slugs ?? []) {
    const raison = r.invisibles.get(slug);
    if (raison) librairies.push({ slug, raison });
    else autres.push(slug);
  }
  return { mesurable: true, librairies, autres };
}


export function separerCeuxQuiOntLaisseDesTraces(slugs = [], options = {}) {
  const ontTourne = [], sansTrace = [], indecidables = [];
  for (const slug of slugs ?? []) {
    const t = tracesSurDisque(slug, options);
    if (t.etat === "a-laisse-des-traces") ontTourne.push({ slug, ...t });
    else if (t.etat === "registre-vide") sansTrace.push(slug);
    else indecidables.push(slug);
  }
  ontTourne.sort((a, b) => b.fichiers - a.fichiers);
  return { ontTourne, sansTrace, indecidables };
}

// `root` et `listDirImpl` sont injectables depuis la tâche #1379 : sans ça, un test qui vérifie le
// classement des silences dépendrait du contenu réel de `docs/`, c'est-à-dire du disque du jour
// (leçon L40 : un test qui lit une donnée VIVANTE ne juge pas le code, il juge le disque).
export function buildToolBrainUsageReport(history, prestations = PRESTATIONS, { sourceCrochet = "", lireSource, offert = "", root = ROOT, listDirImpl = readdirSync, horsDePortee = null } = {}) {
  const slugs = knownToolSlugsFromPrestations(prestations);
  const perTool = slugs
    .map((slug) => ({ slug, ...toolUsageStats(history, slug) }))
    .sort((a, b) => a.total - b.total);
  const bruts = toolsNeverUsed(history, slugs);
  // QUATRE états, jamais deux : réellement jamais sollicité · couvert par le crochet (donc sollicité
  // à chaque commit sans passer par le compteur) · MUET (il a un CLI mais n'enregistre pas son
  // passage — un défaut à corriger, jamais un constat d'inactivité) · SANS CLI (le compteur ne peut
  // structurellement pas le voir) · sollicité.
  const couverts = new Set(outilsCouvertsParLeCrochet(sourceCrochet, bruts));
  const restants = bruts.filter((s) => !couverts.has(s));
  const silences = classerLesSilencieux(restants, { lireSource, offert });
  const sansCli = new Set(silences.mesurable ? silences.sansCli : []);
  const muets = new Set(silences.mesurable ? silences.muets : []);
  const candidats = restants.filter((s) => !sansCli.has(s) && !muets.has(s));
  // LA PREUVE MATÉRIELLE PASSE AVANT LE TÉMOIGNAGE DU COMPTEUR (voir le commentaire ci-dessus).
  const traces = separerCeuxQuiOntLaisseDesTraces(candidats, { root, listDirImpl });
  // UNE LIBRAIRIE SORT AUSSI DE LA LISTE : elle est appelée en permanence, jamais « sollicitée ».
  const lib = separerLesLibrairies(traces.sansTrace, { horsDePortee, root, listDirImpl });
  return {
    perTool,
    // `neverUsed` ne retient QUE les sans-trace. Y laisser les indécidables affirmerait ce qu'on
    // ne sait pas — et le plan d'action proposerait de RETIRER un outil dont rien ne dit s'il
    // travaille. Ils sont listés à part, et vus, mais jamais comptés comme inactifs.
    neverUsed: lib.autres,
    librairiesImportees: lib.librairies,
    ontTourneSansPasserParLeCompteur: traces.ontTourne,
    sansTraceSurDisque: traces.sansTrace,
    traceIndecidable: traces.indecidables,
    couvertsParLeCrochet: [...couverts],
    sansLigneDeCommande: [...sansCli],
    muetsAuCompteur: [...muets],
    silenceMesurable: silences.mesurable,
    pourquoiSilenceNonMesure: silences.pourquoi,
  };
}

// --- 4. Auto-diagnostic borné au périmètre de tool-brain lui-même (2026-09-21, précision explicite
// de l'utilisateur : « je parle des ameliorations sur le perimetre de tool-brain et de ses
// objectifs uniquement » — jamais un audit du paysage entier, déjà couvert ailleurs par ARGUS/
// HARMONIA). Réutilise toolUsageStats() tel quel, sur le seul slug "tool-brain" ; le câblage
// réciproque (est-il bien appelé dans le crochet post-commit ?) est une simple recherche de texte
// dans le code source déjà en mémoire, même patron que checkHtmlWiring() (circle-tasks.mjs).
// CORRIGÉ le 2026-09-25 (constat DEEP-READER 6) — ET C'ÉTAIT LE MÊME DÉFAUT QUE PARTOUT AILLEURS,
// pris ici par son pire bout. La ligne d'origine lisait `usage.byOrigin?.spontane`, une origine que
// le vocabulaire déclare mais qu'AUCUN chemin de code n'écrit : `recordCliUsage()` écrit toujours
// « cli_direct ». Ce compteur valait donc 0 depuis le premier jour, quoi qu'il arrive — et tool-brain
// imprimait sans faiblir « jamais spontanément — signe que le réflexe n'est pas encore acquis »,
// c'est-à-dire un REPROCHE rendu sur une sonde incapable de matcher. Un faux rouge, exactement aussi
// menteur qu'un faux vert, et plus discret : personne ne conteste une mauvaise note.
export function diagnoseToolBrainSelf(history, { checkLastCommitSource, spontaneousCount: spontaneousInjecte } = {}) {
  const usage = toolUsageStats(history, TOOL_BRAIN_SLUG);
  // Trois états, jamais deux : un nombre dérivé (mesuré), ou `null` (PAS MESURÉ). Jamais un zéro
  // par défaut, qui serait indistinguable d'une absence réelle d'initiative.
  const spontaneousCount = Number.isInteger(spontaneousInjecte) ? spontaneousInjecte : null;
  const wiredInPostCommitHook = checkLastCommitSource != null ? /tool-brain\.mjs/.test(checkLastCommitSource) : undefined;
  const findings = [];
  if (usage.total === 0) {
    findings.push("tool-brain n'a jamais été sollicité (ni spontanément, ni sur demande) — son rappel automatique post-commit reste alors la seule chose qui tourne réellement.");
  } else if (spontaneousCount === null) {
    findings.push(`tool-brain a été sollicité ${usage.total} fois ; la part d'initiative n'est PAS MESURÉE ici (la liste des items de Ronde et la source des crochets n'ont pas été fournies) — et ne rien savoir ne se dit jamais « zéro ».`);
  } else if (spontaneousCount === 0) {
    findings.push(`tool-brain a été sollicité ${usage.total} fois, mais jamais de ma propre initiative (toujours un item de Ronde ou un crochet) — signe que le réflexe n'est pas encore acquis, seulement le rappel mécanique.`);
  } else {
    findings.push(`✨ tool-brain a été sollicité ${spontaneousCount} fois de ma propre initiative sur ${usage.total} au total — le réflexe existe pour de vrai, il n'est pas que mécanique.`);
  }
  if (wiredInPostCommitHook === false) {
    findings.push("tool-brain ne semble plus câblé dans le crochet post-commit (scripts/hooks/check-last-commit.mjs) — vérifier le câblage réciproque.");
  }
  return { usage, spontaneousCount, wiredInPostCommitHook, findings };
}

// --- 5. Rapport de Ronde, texte (2026-09-21, demande explicite : « delivre un rapport txt à chaque
// ronde [...] te faire des recommandations [...] eventuellement diagnostiquer des ameliorations à
// apporter sur le systeme global "tool-brain" »). Disponible aux deux déclenchements demandés : à
// chaque Ronde (cf. circle-tasks.mjs, item "tool-brain-report") ET à la demande (CLI ci-dessous).
export function formatToolBrainReport({ history, prestations = PRESTATIONS, checkLastCommitSource, lireSource, offert = "", itemsRonde, sourceCrochets, sourcesDesOutils, now = Date.now(), heuresDuDepot = null } = {}) {
  // `checkLastCommitSource` sert deux fois : à l'auto-diagnostic (est-ce que tool-brain est câblé ?)
  // et désormais à distinguer « jamais sollicité » de « couvert par le crochet ». Un seul fichier
  // lu, deux questions répondues — jamais une seconde lecture pour la même source.
  const usage = buildToolBrainUsageReport(history, prestations, { sourceCrochet: checkLastCommitSource ?? "", lireSource, offert });
  const { perTool, neverUsed, couvertsParLeCrochet, sansLigneDeCommande, muetsAuCompteur, silenceMesurable, pourquoiSilenceNonMesure } = usage;
  // LE SEUL SIGNAL POSITIF DU RAPPORT (2026-09-25, constat DEEP-READER 6, sa demande mot pour mot :
  // « les utilisations spontanées des outils (de ta part ET hors process mecaniques) sont à flagger
  // comme "signe trés positif" de cette mesure »). Tout le reste de ce rapport compte ce qui manque ;
  // celui-ci est le seul à compter ce qui va bien — et un paysage qui ne sait que se reprocher des
  // choses finit par n'être plus lu.
  const spontane = usagesSpontanes(history, {
    itemsRonde: itemsRonde instanceof Set ? itemsRonde : new Set(itemsRonde ?? []),
    sourceCrochets: sourceCrochets ?? checkLastCommitSource ?? "",
  });
  const spontaneToolBrain = spontane.mesurable
    ? (spontane.spontanes.find((t) => t.slug === TOOL_BRAIN_SLUG)?.appels ?? 0)
    : undefined;
  const self = diagnoseToolBrainSelf(history, { checkLastCommitSource, spontaneousCount: spontaneToolBrain });
  const lines = [
    "=== tool-brain — rapport de Ronde ===",
    `Date : ${new Date(now).toISOString()}`,
    "",
    // L'HORIZON AVANT LE CHIFFRE, jamais après (2026-09-29, tâche #1244) : le journal d'usage n'est
    // pas commité, donc il se reconstruit à chaque clone. Mesuré ce jour-là, il couvrait 6 % de la
    // vie du dépôt — et ce rapport annonçait « 29 outils jamais sollicités » sans un mot là-dessus,
    // avec un plan d'action qui propose de les RETIRER. La phrase passe DEVANT parce qu'un lecteur
    // qui voit le chiffre d'abord ne revient pas sur la réserve.
    formatHorizonLine(horizonDuJournal(history), { heuresDuDepot: heuresDuDepot ?? null }),
    "",
    neverUsed.length ? `${neverUsed.length} outil(s) jamais sollicité(s) ET sans aucune trace sur disque : ${neverUsed.join(", ")}.` : "Aucun outil n'est à la fois à zéro au compteur et sans trace sur disque.",
    couvertsParLeCrochet.length ? `${couvertsParLeCrochet.length} outil(s) n'apparaissent pas au compteur mais tournent à CHAQUE commit via le crochet : ${couvertsParLeCrochet.join(", ")} — leur silence n'est pas une inaction.` : "",
    !silenceMesurable ? `⚠️ SILENCE NON CLASSÉ — ${pourquoiSilenceNonMesure}` : "",
    muetsAuCompteur?.length ? `🔴 ${muetsAuCompteur.length} outil(s) ONT une ligne de commande et n'enregistrent PAS leur passage : ${muetsAuCompteur.join(", ")}. Leur zéro ne mesure pas leur inactivité, il mesure leur silence — c'est un défaut du compteur, à corriger, jamais un constat sur eux.` : "",
    sansLigneDeCommande?.length ? `📗 ${sansLigneDeCommande.length} outil(s) qu'AUCUN compteur d'appels ne peut voir : ${sansLigneDeCommande.join(", ")}. Deux causes possibles, et elles appellent deux gestes différents : soit le travail passe par un agent séparé et le script ne fait que mettre en forme son rapport (rien à corriger — ce qui dit s'il a tourné est son registre \`docs/<outil>/\`), soit sa commande n'est écrite NULLE PART dans les documents, et c'est un vrai manque (constat déjà remonté séparément par l'iceberg de CASSANDRA). Dans les deux cas ce n'est pas zéro, c'est PAS MESURABLE.` : "",
    "",
    ...formatUsagesSpontanesLines(spontane),
    "",
    // LA CAUSE RACINE À CÔTÉ DU SYMPTÔME, jamais l'une sans l'autre : le signal ci-dessus DÉRIVE
    // l'initiative faute de pouvoir la lire. Ce qui l'en empêche — une origine déclarée que rien
    // n'écrit — est imprimé juste en dessous, sinon le contournement finirait par tenir lieu de
    // correction et personne ne saurait plus qu'il y avait un trou.
    ...formatOriginesJamaisEcritesLines(findOriginesJamaisEcrites(sourcesDesOutils ?? [], { historique: history })),
    "",
    "COMBINAISONS du catalogue — réalisées en FAIT, jamais déclarées :",
    ...packsRealises(history, prestations).map((p) => (p.estUneCombinaison
      ? `- ${p.pack} (${p.taille} outils) : ${p.realisations === 0 ? "JAMAIS réalisé" : `${p.realisations} fois`}`
      : `- ${p.pack} : PAS une combinaison — une de ses entrées est un document, pas un outil`)),
    "",
    "Outils les moins sollicités (total cumulé, jamais remis à zéro) :",
    ...perTool.slice(0, 10).map((t) => `- ${t.slug} : ${t.total} sollicitation(s)${t.foundSomethingRate != null ? `, ${t.foundSomethingRate}% de trouvailles confirmées` : ""}`),
    // LA PREUVE MATÉRIELLE PASSE DEVANT LE TÉMOIGNAGE (2026-10-01, tâche #1379). Ces outils-là
    // SONT sortis de « jamais sollicité » : les y laisser faisait dire au plan d'action « lancez-les
    // une fois pour de vrai, ou retirez-les » à propos d'outils qui avaient déjà déposé leurs
    // rapports. 7 sur 20 le jour où c'est trouvé.
    usage.ontTourneSansPasserParLeCompteur?.length ? `🟢 ${usage.ontTourneSansPasserParLeCompteur.length} outil(s) à zéro au compteur ONT POURTANT TOURNÉ — leur registre sur disque le prouve : ${usage.ontTourneSansPasserParLeCompteur.map((t) => `${t.slug} (${t.fichiers} fichier(s))`).join(", ")}. Ce n'est pas eux qu'il faut relancer, c'est le compteur qui ne les voit pas : ils sont lancés hors du chemin qui enregistre.` : "",
    usage.traceIndecidable?.length ? `❓ ${usage.traceIndecidable.length} outil(s) sans registre sur disque, donc INDÉCIDABLES : ${usage.traceIndecidable.join(", ")}. Un outil n'écrit pas forcément quelque chose — leur silence ne prouve rien dans un sens ni dans l'autre, et les compter comme inactifs serait confondre « je n'ai rien trouvé » avec « je n'ai pas pu regarder ».` : "",
    // UNE LIBRAIRIE EST APPELÉE EN PERMANENCE, JAMAIS « SOLLICITÉE » (2026-10-01, tâche #1380).
    usage.librairiesImportees?.length ? `📘 ${usage.librairiesImportees.length} de ces outil(s) sont en fait des LIBRAIRIES, hors de portée du compteur (importées par d'autres scripts, lancées par un crochet, ou le compteur lui-même) : ${usage.librairiesImportees.map((l) => `${l.slug}`).join(", ")}. Elles tournent à chaque appel du paysage ; leur zéro mesure qu'on ne les lance pas EN TANT QUE commande, ce qui ne dit rien de leur utilité.` : "",
    // CE QU'AUCUN COMPTEUR NE SAURA JAMAIS DIRE, et le déclarer EST la protection (Article 27).
    "\u2139\uFE0F CE QUE CE COMPTEUR NE PEUT PAS FAIRE, et ce n'est pas un défaut à corriger : produire une liste de candidats AU RETRAIT. Il mesure des APPELS. Un outil de CIRCONSTANCE — smart-breaker en panne de quota, sauvegarde-projet le jour d'une perte d'accès, run-simulation pendant une simulation — reste à zéro tant que la circonstance ne se produit pas, et ce zéro est alors la BONNE nouvelle. Instruits un par un le 2026-10-01, les six derniers candidats n'en contenaient aucun de réel.",
    "",
    "Auto-diagnostic (périmètre tool-brain uniquement, jamais un audit du paysage entier) :",
    self.findings.length ? self.findings.map((f) => `- ${f}`).join("\n") : "- Aucun signal d'anomalie sur le périmètre propre de tool-brain.",
  ];

  // LE PLAN D'ACTION (2026-09-25, tâche #855) — tranché par l'utilisateur en fenêtre dédiée, contre
  // la raison qui figurait jusqu'ici dans SANS_CONSTAT_PROPRE (« aiguilleur : il ne constate rien
  // sur le code »). Cette raison N'EST PLUS VRAIE : elle datait d'avant le rapport d'usage réel.
  // tool-brain constate bien quelque chose — pas sur le code du jeu, mais sur l'ÉQUIPE et sur MON
  // usage d'elle, et un outil jamais sollicité est un vrai problème qui doit devenir une tâche.
  //
  // CE QUI DEVIENT UN CONSTAT ET CE QUI N'EN DEVIENT PAS, et la frontière est la même que partout
  // ailleurs ici : un zéro dont la cause est CONNUE et bénigne n'est pas un écart. Les outils
  // couverts par le crochet tournent à chaque commit (leur silence n'est pas une inaction), et ceux
  // qu'aucun compteur ne peut voir sont « pas mesurable », jamais « pas utilisé ». Les faire
  // remonter produirait un plan qui réclame de corriger ce qui va bien.
  const ecarts = [];
  if (neverUsed.length) ecarts.push({
    quoi: `${neverUsed.length} outil(s) jamais sollicité(s) ET sans aucune trace sur disque : ${neverUsed.join(", ")}`,
    quoiFaire: "les lancer une fois pour de vrai, ou décider de les retirer — un outil construit et jamais appelé n'a jamais protégé personne (leçon L2), et le défaut est du côté de l'agent, jamais de l'outil",
  });
  // DEUX ÉCARTS SÉPARÉS, ET LA SÉPARATION EST LE FOND (2026-10-01, tâche #1379) : « aucune trace »
  // appelle une décision, « pas de registre » appelle une mesure. Les fondre faisait proposer de
  // RETIRER des outils dont rien ne disait s'ils travaillaient.
  if (usage.ontTourneSansPasserParLeCompteur?.length) ecarts.push({
    quoi: `${usage.ontTourneSansPasserParLeCompteur.length} outil(s) à zéro au compteur ONT POURTANT TOURNÉ, leur registre le prouve : ${usage.ontTourneSansPasserParLeCompteur.map((t) => t.slug).join(", ")}`,
    quoiFaire: "ne rien leur reprocher : c'est le COMPTEUR qui ne les voit pas, parce qu'ils sont lancés hors du chemin qui enregistre. Le geste est de brancher l'enregistrement sur ce chemin-là, jamais de relancer un outil qui travaille déjà",
  });
  if (usage.traceIndecidable?.length) ecarts.push({
    quoi: `${usage.traceIndecidable.length} outil(s) sans registre sur disque : on ne peut PAS savoir s'ils ont tourné (${usage.traceIndecidable.join(", ")})`,
    quoiFaire: "les instruire un par un : un outil qui n'écrit rien est légitime (une pièce du kit peut être SANS OBJET), mais alors son usage ne se mesurera jamais par là. Décider, pour chacun, s'il doit enregistrer son passage ou s'il reste hors mesure avec sa raison écrite",
  });
  if (muetsAuCompteur?.length) ecarts.push({
    quoi: `${muetsAuCompteur.length} outil(s) ont une ligne de commande et n'enregistrent PAS leur passage : ${muetsAuCompteur.join(", ")}`,
    quoiFaire: "ajouter recordCliUsage() à leur point d'entrée — leur zéro mesure leur silence, jamais leur inactivité, donc tout verdict d'usage les concernant est faux tant que ce n'est pas corrigé",
  });
  if (!silenceMesurable) ecarts.push({
    quoi: `le silence des outils n'a pas pu être classé — ${pourquoiSilenceNonMesure}`,
    quoiFaire: "rétablir la source manquante avant de se fier au moindre chiffre d'usage de ce rapport — un silence non classé se lit comme un silence choisi",
  });
  for (const f of self.findings ?? []) {
    // L'auto-diagnostic contient aussi des signaux POSITIFS (le ✨ de l'usage spontané). Un
    // compliment n'est pas un écart, et le pousser en constat retenu produirait une tâche
    // « corriger le fait que tout va bien ».
    if (/^✨/.test(f)) continue;
    ecarts.push({ quoi: `auto-diagnostic : ${f}`, quoiFaire: "traiter dans le périmètre de tool-brain lui-même, jamais en élargissant le diagnostic au reste du paysage" });
  }
  const plan = planDactionDepuisEcarts(ecarts, {
    toolSlug: "tool-brain",
    ...PLAN_QUOI_QUOIFAIRE,
  });
  lines.push("", `=== ${PLAN_ACTION_TITRE} ===`, ...plan.lignes);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// LA FAILLE 8 DE L'ARTICLE 31, AU RAPPORT (2026-09-28, tâche #765)
// ─────────────────────────────────────────────────────────────────────────────
//
// « LA PLUS VICIEUSE », dans les mots de l'Article : citer un outil sans l'avoir lancé. La preuve
// existait — le compteur d'usage garde chaque passage — et RIEN ne la confrontait : une obligation
// sans vérificateur ne survit pas au changement de session (Article 27).
//
// POURQUOI CHEZ TOOL-BRAIN plutôt que dans un outil de plus : c'est lui qui est « plugué
// directement » à l'agent, et lui qui délivre déjà le KPI d'usage réel à chaque Ronde. La faille 8
// est une question d'usage : elle est chez elle.
//
// CE QU'IL LIT : les rapports les plus récents déposés par les outils. Un rapport qui NOMME un
// outil sans qu'aucun passage de cet outil ne soit enregistré dans la fenêtre est un rapport qui
// cite sans avoir lancé.
// =============================================================================================
// TOOL-BRAIN EST-IL VRAIMENT LE POINT D'ENTRÉE ? (2026-09-28, tâche #575)
// =============================================================================================
// SA QUESTION, mot pour mot : « est-ce que tout fonctionne bien : c'est devenu ton point d'entree
// pour les outils ? tu utilises ? tout fonctionne ? ». Et son exigence, la même que pour #573 :
// **une mesure réelle depuis le compteur d'usage, jamais une déclaration d'intention.**
//
// CE QUI SE MESURE, ET CE QUI NE SE MESURE PAS. Le compteur sait qu'un outil a tourné et quand.
// Il ne saura jamais si la consultation a SERVI — un agent peut consulter puis faire autre chose.
// Ce qu'on peut établir est donc une PRÉCÉDENCE : un appel spontané a-t-il été précédé, de peu,
// par un passage de tool-brain. C'est un indice fort de la discipline réelle, jamais une preuve
// qu'elle a été suivie.
//
// POURQUOI « SPONTANÉ » ET PAS TOUS LES APPELS : un outil lancé par le crochet post-commit ou
// dicté par un process n'avait pas à passer par tool-brain — le compter accuserait l'agent d'un
// manquement qui n'existe pas (leçon L4). Seuls les appels que l'agent décide lui-même comptent.
//
// LA FENÊTRE EST DÉCLARÉE, PAS DEVINÉE : dix minutes. Assez large pour couvrir une consultation
// suivie d'une vraie lecture de code, assez étroite pour qu'un passage du matin ne crédite pas
// tout l'après-midi. C'est un choix, et le changer change le chiffre — d'où le fait qu'il soit
// rendu dans le rapport plutôt que caché.
export const FENETRE_DE_PRECEDENCE_MS = 10 * 60 * 1000;
export const ORIGINE_SPONTANEE = "cli_direct";

export function precedenceDeToolBrain(events = [], { fenetre = FENETRE_DE_PRECEDENCE_MS, maintenant = null, sur24h = true } = {}) {
  const tries = events.filter((e) => typeof e?.at === "number").sort((a, b) => a.at - b.at);
  if (!tries.length) {
    return { mesurable: false, pourquoi: "aucun événement horodaté dans le compteur : rendre un taux de discipline sur zéro passage serait un verdict sur du vide (leçon L13)" };
  }
  const passages = tries.filter((e) => e.toolSlug === "tool-brain").map((e) => e.at);
  const spontanes = tries.filter((e) => e.origin === ORIGINE_SPONTANEE && e.toolSlug !== "tool-brain");
  if (!spontanes.length) {
    return { mesurable: false, passages: passages.length,
      pourquoi: "aucun appel SPONTANÉ enregistré : seuls ceux-là avaient à passer par tool-brain, et sans eux il n'y a pas de discipline à mesurer" };
  }
  const precede = (e) => passages.some((t) => e.at - t >= 0 && e.at - t <= fenetre);
  const total = spontanes.filter(precede).length;
  const fin = maintenant ?? tries.at(-1).at;
  const recents = sur24h ? spontanes.filter((e) => fin - e.at < 24 * 3600 * 1000) : [];
  const recentsPrecedes = recents.filter(precede).length;
  return {
    mesurable: true, passages: passages.length,
    spontanes: spontanes.length, precedes: total, taux: Math.round((total / spontanes.length) * 100),
    recents: recents.length, recentsPrecedes, tauxRecent: recents.length ? Math.round((recentsPrecedes / recents.length) * 100) : null,
    fenetreMinutes: Math.round(fenetre / 60000),
    horsPortee: "une PRÉCÉDENCE, jamais un USAGE : le compteur sait qu'un outil a tourné et quand, il ne saura jamais si la consultation a servi. Et la fenêtre est un CHOIX — la changer change le chiffre.",
  };
}

export function formatPrecedenceLines(p = {}) {
  if (!p.mesurable) return ["", `\u{1F6A8} POINT D'ENTRÉE : PAS MESURÉ — ${p.pourquoi}`];
  const L = ["", "=== TOOL-BRAIN EST-IL LE POINT D'ENTRÉE ? — mesuré, jamais déclaré ==="];
  L.push(`  ${p.passages} passage(s) de tool-brain enregistrés au compteur.`);
  L.push(`  ${p.precedes}/${p.spontanes} appels SPONTANÉS ont été précédés d'une consultation dans les ${p.fenetreMinutes} minutes — ${p.taux} % sur tout l'historique.`);
  if (p.tauxRecent !== null) {
    const sens = p.tauxRecent > p.taux ? "la discipline s'est AMÉLIORÉE" : p.tauxRecent < p.taux ? "la discipline a RECULÉ" : "la discipline est stable";
    L.push(`  Sur les 24 dernières heures : ${p.recentsPrecedes}/${p.recents} — ${p.tauxRecent} %, donc ${sens}.`);
    L.push("  LES DEUX CHIFFRES COMPTENT : le cumul dit l'habitude installée, les 24 h disent celle d'aujourd'hui — et c'est la seconde qui se corrige.");
  }
  L.push("  (Un outil lancé par le crochet ou dicté par un process est EXCLU : il n'avait pas à passer par ici, et le compter accuserait d'un manquement qui n'existe pas.)");
  L.push(`  HORS PORTÉE : ${p.horsPortee}`);
  return L;
}

export const FENETRE_RAPPORTS_EXAMINES = 12;

export async function lignesFaille8({ history, now = Date.now(), racine = null } = {}) {
  const L = ["", "=== ARTICLE 31, FAILLE 8 — un outil CITÉ a-t-il vraiment TOURNÉ ? ==="];
  let slugs = [];
  try {
    const { AGENT_CATEGORIES } = await import("./lib-shell.mjs");
    slugs = Object.keys(AGENT_CATEGORIES);
  } catch { /* le rapport dira PAS MESURÉ plutôt que d'inventer un vert */ }
  if (!slugs.length) {
    L.push("  ⬜ PAS MESURÉ — la liste des outils connus n'a pas pu être lue. Ce n'est PAS « aucun outil cité à tort ».");
    return L;
  }
  const base = racine ?? fileURLToPath(new URL("../docs/", import.meta.url));
  let rapports = [];
  try {
    for (const d of readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const dossier = join(base, d.name);
      for (const f of readdirSync(dossier).filter((f) => f.endsWith(".txt"))) {
        try { rapports.push({ chemin: `docs/${d.name}/${f}`, mtime: statSync(join(dossier, f)).mtimeMs, complet: join(dossier, f) }); } catch { /* suivant */ }
      }
    }
  } catch { /* idem */ }
  if (!rapports.length) {
    L.push("  ⬜ PAS MESURÉ — aucun rapport déposé n'a pu être lu. Ce n'est PAS « aucun outil cité à tort ».");
    return L;
  }
  rapports = rapports.sort((a, b) => b.mtime - a.mtime).slice(0, FENETRE_RAPPORTS_EXAMINES);
  const fautifs = [];
  for (const r of rapports) {
    let texte = "";
    try { texte = readFileSync(r.complet, "utf8"); } catch { continue; }
    // La fenêtre part de la DATE DU RAPPORT, jamais de maintenant : un rapport d'il y a trois jours
    // doit être jugé sur ce qui avait tourné à ce moment-là, sinon tout le passé serait fautif.
    // L'AUTEUR SE DÉDUIT DU DOSSIER, jamais d'une liste tenue à la main : un rapport déposé dans
    // `docs/<outil>/` a été produit par cet outil-là. Une convention déjà vraie partout ici.
    const auteur = r.chemin.split("/")[1];
    const v = findOutilsCitesSansPassage(texte, slugs, { history, now: r.mtime, auteur });
    if (v.mesurable && v.sansPassage.length) fautifs.push({ rapport: r.chemin, outils: v.sansPassage });
  }
  if (!fautifs.length) {
    L.push(`  ✅ aucun, sur les ${rapports.length} rapport(s) les plus récents : chaque outil nommé a un passage enregistré dans les 24 h précédant son rapport.`);
  } else {
    L.push(`  🚨 ${fautifs.length} rapport(s) sur ${rapports.length} nomment un outil sans passage enregistré :`);
    for (const f of fautifs.slice(0, 8)) L.push(`     · ${f.rapport} — ${f.outils.join(", ")}`);
  }
  L.push("  HORS PORTÉE : il vérifie qu'un outil a TOURNÉ, jamais que ce qu'on en dit est exact — un rapport peut citer un vrai passage et en tirer une conclusion fausse.");
  return L;
}

async function main() {
  printReliabilityNotice("tool-brain");
  recordCliUsage("tool-brain");
  const [, , ...rest] = process.argv;

  // « EST-CE QUE ÇA EXISTE DÉJÀ ? » (2026-09-26, tâche #746) — un MODE de tool-brain, jamais un
  // 79e script, comme la tâche le demandait explicitement. Le point d'entrée reste unique.
  //
  // LE TROU QU'IL FERME EST UNE QUESTION DE MOMENT : `suggestPrestationsForTask` répond « quel
  // OUTIL utiliser », CLONE-HUNTER trouve les doublons APRÈS qu'ils sont écrits. Personne ne
  // regardait AVANT — et le projet a déjà payé ça, ABRAHAM-LES-REFERENCES étant né de trente
  // fonctions génériques enfermées dans l'agent d'un seul document faute d'avoir cherché.
  if (rest[0] === "existe") {
    const intention = rest.slice(1).join(" ");
    for (const l of formatFonctionExistanteLines(chercherUneFonctionExistante(intention, inventaireDesFonctions()), intention)) console.log(l);
    return;
  }

  // LA SOUS-COMMANDE DU CROCHET (2026-09-26, tâche #778) — muette quand il n'y a rien à dire.
  if (rest[0] === "muets") {
    for (const l of muetsAuCompteurLines(rapportDesMuets())) console.log(l);
    return;
  }

  // `aide-ou-encombre` — sa question Q7, celle qu'il a posée en demandant l'honnêteté (2026-09-29,
  // tâche #1155). À la demande, jamais dans le crochet : elle lit tout le registre des tâches et
  // tout le recensement, et une mesure de cette taille n'a pas sa place dans un post-commit.
  if (rest[0] === "aide-ou-encombre") {
    recordCliUsage(TOOL_BRAIN_SLUG);
    for (const l of formatAideOuEncombreLines(await mesurerAideOuEncombre())) console.log(l);
    return;
  }

  if (rest[0] === "rapport") {
    const history = loadToolUsageHistory();
    let checkLastCommitSource;
    try {
      checkLastCommitSource = readFileSync(new URL("./hooks/check-last-commit.mjs", import.meta.url), "utf8");
    } catch { /* best-effort, jamais bloquant */ }
    // LES TROIS SOURCES, jamais la seule qui était déjà là (2026-09-25). Le signal d'initiative
    // retire du compte les outils qu'un crochet lance tout seul ; s'il ne lisait que
    // check-last-commit.mjs, tout outil lancé par `pre-commit` ou `post-commit` passerait pour une
    // initiative. C'est le piège exact évité la première fois — écrit ici pour ne pas y retomber
    // par une source oubliée plutôt que par une logique fausse.
    let sourceCrochets = checkLastCommitSource ?? "";
    for (const h of ["./hooks/pre-commit", "./hooks/post-commit"]) {
      try { sourceCrochets += "\n" + readFileSync(new URL(h, import.meta.url), "utf8"); } catch { /* best-effort */ }
    }
    // Le lecteur de source est passé ICI plutôt que codé dans la fonction, pour la même raison que
    // partout ailleurs dans ce paysage : sans lui, le rapport DÉCLARE qu'il n'a pas pu classer les
    // silences au lieu de les compter comme des zéros (#763).
    const lireSource = (slug) => {
      for (const nom of [slug, `check-${slug}`, slug.replace(/-mjs$/, "")]) {
        try { return readFileSync(new URL(`./${nom}.mjs`, import.meta.url), "utf8"); } catch { /* suivant */ }
      }
      return undefined;
    };
    // L'OFFRE DÉCLARÉE en seconde source (leçon L24) : ce qui dit qu'un outil se lance, c'est une
    // commande écrite dans un document, jamais l'absence d'un motif dans son code.
    let offert = "";
    for (const doc of DOCUMENTS_QUI_DECLARENT_L_OFFRE) {
      try { offert += readFileSync(new URL(doc, import.meta.url), "utf8"); } catch { /* best-effort */ }
    }
    // Les items de Ronde viennent de circle-tasks.mjs LUI-MÊME, jamais d'une liste recopiée ici
    // (Article 24 : un registre se LIT). Import dynamique et seulement sur ce sous-commande : la
    // bannière post-commit, qui passe par le même fichier, ne doit pas payer cette chaîne.
    let itemsRonde;
    try {
      const { CIRCLE_ITEMS } = await import("./circle-tasks.mjs");
      itemsRonde = new Set(CIRCLE_ITEMS.map((i) => i.id));
    } catch { /* absent : le rapport dira PAS MESURÉ plutôt que d'inventer un zéro */ }
    // Les sources réelles du dossier scripts/, jamais une liste recopiée (Article 24).
    let sourcesDesOutils = [];
    try {
      const dossier = fileURLToPath(new URL("./", import.meta.url));
      sourcesDesOutils = readdirSync(dossier).filter((f) => f.endsWith(".mjs"))
        .map((f) => { try { return readFileSync(join(dossier, f), "utf8"); } catch { return ""; } });
    } catch { /* absent : le garde-fou dira PAS MESURÉ plutôt que d'inventer un vert */ }
    console.log(formatToolBrainReport({ history, checkLastCommitSource, lireSource, offert, itemsRonde, sourceCrochets, sourcesDesOutils }));
    for (const l of await lignesFaille8({ history })) console.log(l);
    // LA RÉPONSE À SA QUESTION DE #575, rendue à chaque rapport plutôt que mesurée une fois : un
    // chiffre produit dans une conversation disparaît avec elle, et la question « est-ce devenu ton
    // point d'entrée ? » se repose à chaque période.
    for (const l of formatPrecedenceLines(precedenceDeToolBrain(history?.events ?? []))) console.log(l);
    return;
  }

  const taskDescription = rest.join(" ");
  if (!taskDescription) {
    console.log('Usage : node scripts/tool-brain.mjs "<description de la tâche>" [--file <chemin>]');
    console.log("        node scripts/tool-brain.mjs rapport");
    return;
  }
  const fileFlagIndex = rest.indexOf("--file");
  const filePath = fileFlagIndex >= 0 ? rest[fileFlagIndex + 1] : undefined;
  const cleanDescription = fileFlagIndex >= 0 ? rest.slice(0, fileFlagIndex).join(" ") : taskDescription;
  const { prestations, fileAdvice, criticite, experience } = adviseToolBrain({ taskDescription: cleanDescription, filePath });

  console.log(`tool-brain — pour : "${cleanDescription}"${filePath ? ` (fichier : ${filePath})` : ""}\n`);
  if (prestations.length) {
    console.log(`${prestations.length} prestation(s) du catalogue LE-COORDINATEUR pertinente(s) :`);
    for (const p of prestations) console.log(`- ${p.nom} → ${p.outils.join(" + ")} (mots-clés : ${p.matched.join(", ")}) — ${p.cout}`);
  } else {
    console.log("Aucune correspondance dans le catalogue PRESTATIONS pour cette description.");
  }
  if (fileAdvice) {
    if (fileAdvice.findBooster.notFound && fileAdvice.findDeepBooster.notFound) {
      console.log("\n🧠 find-brain : fichier introuvable (pas encore créé ?) — rien à recommander tant qu'il n'existe pas.");
    } else {
      console.log(fileAdvice.recommend.length ? `\n🧠 find-brain : ${fileAdvice.recommend.join(" + ")} recommandé(s) pour ce fichier.` : "\n🧠 find-brain : aucun des deux outils de recherche n'est nécessaire pour ce fichier.");
    }
  }
  // La criticité passe AVANT tout le reste dans la lecture : savoir qu'on s'apprête à toucher un
  // fichier maître change la façon de mener l'action, pas seulement l'outil qu'on choisit.
  // Affichée AVANT le reste, et c'est délibéré : savoir quel outil prendre ne sert à rien si on
  // reproduit le piège que le projet a déjà payé. Silencieuse quand rien ne correspond au terrain.
  const expLignes = formatExperience(experience);
  if (expLignes.length) { console.log(""); for (const l of expLignes) console.log(l); }
  // On compte l'OCCASION ici, dans le CLI, et jamais dans adviseToolBrain() : cette fonction-là est
  // appelée par la suite de tests et par des appelants qui n'affichent rien, et compter leurs appels
  // remplirait la mesure de bruit d'outillage — la rendant inutilisable pour juger quoi que ce soit.
  if (taskDescription || filePath) {
    try {
      const audit = auditLecons();
      if (audit.mesure === "mesuré") enregistrerRemontee(experience.map((e) => e.id), { toutes: audit.lecons });
    } catch { /* un compteur illisible ne casse jamais une consultation */ }
  }

  if (criticite && !criticite.absent) {
    // Formulation corrigée le 2026-09-22 : « risque maximal applicable : faible » se lisait comme
    // « ce fichier est peu risqué », soit l'inverse exact du sens. Le niveau classe le FICHIER ; la
    // limite porte sur les ACTIONS qu'on y applique. Plus le fichier est critique, MOINS on a le
    // droit d'y faire de choses risquées. La phrase le dit désormais dans cet ordre-là.
    console.log(`\n⚖️  criticité du fichier : ${String(criticite.niveau).toUpperCase()} (score ${criticite.score}) — donc seules les modifications à RISQUE « ${criticite.risqueMaxAutorise.toUpperCase()} » peuvent y être appliquées directement ; au-delà, ça se propose, jamais ça ne s'applique.`);
    for (const sig of (criticite.signaux ?? []).slice(0, 4)) console.log(`     · ${typeof sig === "string" ? sig : `${sig.nom}${sig.detail ? ` — ${sig.detail}` : ""}`}`);
    if (["maitre", "tuyauterie", "critique"].includes(criticite.niveau)) {
      console.log("     ⚠️  Relecture humaine et contrôle de perte de références OBLIGATOIRES avant d'appliquer quoi que ce soit ici.");
    }
  }
  if (!prestations.length && !fileAdvice) {
    console.log("Vérifier manuellement si un outil existant répond déjà au besoin avant de foncer (Article 3, anti-doublon).");
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// « EST-CE QUE L'AGENCE M'AIDE, OU EST-CE QUE JE M'Y PERDS ? » (2026-09-29, tâche #1155)
//
// SA QUESTION, MOT POUR MOT, avec sa consigne : « est-ce que l'agence m'aide ou est-ce que je m'y
// perds ? Sois honnête, pas besoin de me ménager. Cette mesure existe-t-elle aujourd'hui ? Il faut
// qu'elle soit mesurée. » Elle n'existait pas. Une question posée sur la valeur de TOUT le paysage
// ne peut pas rester sans instrument.
//
// CHEZ TOOL-BRAIN ET NULLE PART AILLEURS : c'est lui qui est « plugué directement » à l'agent, il
// tient déjà le compteur d'usage réel et le KPI des outils jamais sollicités. L'étendre coûte une
// fonction ; un outil de plus coûterait dix registres — le coût d'entrée que JESUS mesure, et qui
// est précisément l'un des chiffres de cette mesure-ci.
//
// AUCUN SCORE UNIQUE, ET C'EST LA DÉCISION CENTRALE. Un chiffre unique sur « l'Agence est-elle
// utile ? » serait exactement le satisfecit que ce projet refuse : il dépendrait entièrement de la
// pondération choisie, donc de l'humeur de qui la choisit. **Les deux plateaux se rendent SÉPARÉS,
// et c'est au lecteur de peser.** Même doctrine que le pourcentage refusé pour la couverture d'une
// commande (#1145).
//
// LE PIÈGE ÉVITÉ, ET IL EST GROS : mesurer « combien de tâches NOMMENT un outil » rend 881 sur
// 1 090 — un chiffre flatteur et faux, parce que nommer n'est pas devoir. Ce qui est mesuré ici est
// la colonne ORIGINE seule : « d'où vient cette tâche ». Une tâche dont l'ORIGINE nomme un outil a
// vraiment été ouverte par lui.
// LES DEUX IMPORTS SONT DYNAMIQUES, et ce n'est pas un détail de style : `check-tasks-details` et
// `cassandra-rh` tirent chacun une bonne partie du paysage derrière eux. Les importer en tête ferait
// de tool-brain — qui est appelé par le crochet post-commit — un point de passage obligé vers eux,
// et une erreur chez l'un casserait le crochet de tout le monde. Le même refus a déjà été opposé à
// HARMONIA le 2026-09-25, pour exactement cette raison.
export async function mesurerAideOuEncombre({ rows = null, recensement = null, history = null } = {}) {
  let taches = rows, parc = recensement, usage = history;
  try {
    if (!taches) taches = (await import("./check-tasks-details.mjs")).loadAllTaskRows().filter(Boolean);
    if (!parc) parc = (await import("./cassandra-rh.mjs")).recenserLesScripts();
    if (!usage) usage = loadToolUsageHistory();
  } catch (e) {
    return { mesurable: false, pourquoi: `une des trois sources n'a pas pu être lue (${e.message}) — et une source manquante ne se remplace pas par un zéro (leçon L5)` };
  }
  if (!taches?.length || !parc?.lignes?.length) {
    return { mesurable: false, pourquoi: "registre de tâches ou recensement d'outils vide : ce zéro dit qu'on n'a rien lu, jamais que l'Agence n'aide pas" };
  }

  const nomsOutils = parc.lignes
    .map((l) => String(l.chemin ?? "").replace(/^scripts\//, "").replace(/\.mjs$/, "").toLowerCase())
    .filter((n) => n.length > 5);

  let ouvertesParUnOutil = 0, etCloses = 0;
  const parOutil = {};
  for (const r of taches) {
    const origine = String(r.sousSujet ?? "").toLowerCase();
    const trouve = nomsOutils.filter((n) => origine.includes(n));
    if (!trouve.length) continue;
    ouvertesParUnOutil += 1;
    for (const n of trouve) parOutil[n] = (parOutil[n] ?? 0) + 1;
    if (/^termin/i.test(String(r.statut ?? "").normalize("NFD").replace(/[̀-ͯ]/g, ""))) etCloses += 1;
  }

  const jamaisSollicites = (() => { try { return toolsNeverUsed(usage, knownToolSlugsFromPrestations()).length; } catch { return null; } })();

  return {
    mesurable: true,
    // LE PLATEAU « ÇA RAPPORTE » — mesuré sur l'origine seule, jamais sur une mention.
    rapporte: {
      taches: taches.length,
      ouvertesParUnOutil,
      partOuvertes: Math.round((ouvertesParUnOutil / taches.length) * 100),
      closes: etCloses,
      partCloses: ouvertesParUnOutil ? Math.round((etCloses / ouvertesParUnOutil) * 100) : null,
      meilleurs: Object.entries(parOutil).sort((a, b) => b[1] - a[1]).slice(0, 5),
    },
    // LE PLATEAU « ÇA COÛTE » — tout ce qu'il faut payer pour que le premier existe.
    coute: {
      outils: parc.lignes.length,
      jamaisSollicites,
      pourquoiJamais: jamaisSollicites === null ? "compteur d'usage illisible — déclaré, jamais compté comme zéro" : null,
    },
    pourquoi: `${ouvertesParUnOutil} tâche(s) sur ${taches.length} ont été OUVERTES par un outil (leur colonne origine le nomme), dont ${etCloses} closes · le parc compte ${parc.lignes.length} fichier(s)`,
  };
}

export function formatAideOuEncombreLines(m) {
  if (!m?.mesurable) return ["=== L'AGENCE AIDE-T-ELLE, OU ENCOMBRE-T-ELLE ? : PAS MESURÉ ===", `  ${m?.pourquoi}`, "", "  Ce n'est PAS « elle aide »."];
  const L = ["=== L'AGENCE AIDE-T-ELLE, OU ENCOMBRE-T-ELLE ? — deux plateaux, jamais une note ===", ""];
  L.push(`  ⚖️  CE QUE ÇA RAPPORTE`);
  L.push(`     ${m.rapporte.ouvertesParUnOutil} tâche(s) sur ${m.rapporte.taches} ont été OUVERTES par un outil (${m.rapporte.partOuvertes} %)`);
  L.push(`     dont ${m.rapporte.closes} closes (${m.rapporte.partCloses} %) — un travail trouvé par un outil est donc un travail qui aboutit`);
  L.push(`     les plus trouveurs : ${m.rapporte.meilleurs.map(([n, c]) => `${n} (${c})`).join(" · ")}`);
  L.push("");
  L.push(`  ⚖️  CE QUE ÇA COÛTE`);
  L.push(`     ${m.coute.outils} fichier(s) d'outillage à tenir`);
  L.push(`     ${m.coute.jamaisSollicites === null ? m.coute.pourquoiJamais : `${m.coute.jamaisSollicites} outil(s) jamais sollicité(s)`}`);
  L.push("");
  L.push("  AUCUN SCORE UNIQUE N'EST PRODUIT, et c'est la décision centrale de cette mesure : un chiffre unique sur");
  L.push("  « l'Agence est-elle utile ? » dépendrait entièrement de la pondération choisie, donc de l'humeur de qui");
  L.push("  la choisit — ce serait le satisfecit que ce projet refuse. Les deux plateaux se pèsent, ils ne s'additionnent pas.");
  L.push("");
  L.push("  LA LIMITE, DÉCLARÉE : le plateau « rapporte » lit la colonne ORIGINE seule, jamais le détail. Mesurer les");
  L.push("  tâches qui NOMMENT un outil rendrait 881 sur 1 090 — flatteur et faux, parce que nommer n'est pas devoir.");
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
