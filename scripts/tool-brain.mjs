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

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { PRESTATIONS, suggestPrestationsForTask, formatMenu, slugifyAgentName } from "./le-coordinateur.mjs";
import { recommendFindBrain, flagFindDeepBoosterCandidates, FIND_DEEP_BOOSTER_NICKNAME } from "./find-brain.mjs";
import { flagFindBoosterCandidates } from "./doc-report.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";
import { toolUsageStats, toolsNeverUsed, recordCliUsage, usagesSpontanes, formatUsagesSpontanesLines, findOriginesJamaisEcrites, formatOriginesJamaisEcritesLines } from "./tool-usage.mjs";
import { assessCriticality } from "./ecotoken.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";

import { auditLecons, leconsPourTache, enregistrerRemontee } from "./tool-learning.mjs";

export const TOOL_BRAIN_SLUG = "tool-brain";
const USAGE_HISTORY_URL = new URL("../.tool-usage-history.json", import.meta.url);

// Même discipline honnête que le reste du paysage (loadJson() de circle-tasks.mjs/tool-usage.mjs) :
// un historique absent ou corrompu retombe sur "aucun événement connu", jamais une erreur qui
// bloquerait un simple rappel.
export function loadToolUsageHistory(readFile = (u) => readFileSync(u, "utf8")) {
  try {
    return JSON.parse(readFile(USAGE_HISTORY_URL));
  } catch {
    return { events: [] };
  }
}

// --- 1. Consultation à la demande (inchangé depuis la première version) ---
// Seuil de correspondance déjà fixé par suggestPrestationsForTask() elle-même (score >= 2 mots
// significatifs partagés) — jamais un second seuil divergent ici.
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
      .map((o) => slugifyAgentName(o.split(/[/(]/)[0].trim())),
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
      .map((o) => slugifyAgentName(o.split(/[/(]/)[0].trim()));
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

export function buildToolBrainUsageReport(history, prestations = PRESTATIONS, { sourceCrochet = "", lireSource, offert = "" } = {}) {
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
  return {
    perTool,
    neverUsed: restants.filter((s) => !sansCli.has(s) && !muets.has(s)),
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
export function formatToolBrainReport({ history, prestations = PRESTATIONS, checkLastCommitSource, lireSource, offert = "", itemsRonde, sourceCrochets, sourcesDesOutils, now = Date.now() } = {}) {
  // `checkLastCommitSource` sert deux fois : à l'auto-diagnostic (est-ce que tool-brain est câblé ?)
  // et désormais à distinguer « jamais sollicité » de « couvert par le crochet ». Un seul fichier
  // lu, deux questions répondues — jamais une seconde lecture pour la même source.
  const { perTool, neverUsed, couvertsParLeCrochet, sansLigneDeCommande, muetsAuCompteur, silenceMesurable, pourquoiSilenceNonMesure } =
    buildToolBrainUsageReport(history, prestations, { sourceCrochet: checkLastCommitSource ?? "", lireSource, offert });
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
    neverUsed.length ? `${neverUsed.length} outil(s) du catalogue jamais sollicité(s) : ${neverUsed.join(", ")}.` : "Tous les outils connus du catalogue ont déjà été sollicités au moins une fois.",
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
    quoi: `${neverUsed.length} outil(s) du catalogue jamais sollicité(s) : ${neverUsed.join(", ")}`,
    quoiFaire: "les lancer une fois pour de vrai, ou décider de les retirer — un outil construit et jamais appelé n'a jamais protégé personne (leçon L2), et le défaut est du côté de l'agent, jamais de l'outil",
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
    libelle: (e) => e.quoi,
    tache: (e) => e.quoiFaire,
  });
  lines.push("", `=== ${PLAN_ACTION_TITRE} ===`, ...plan.lignes);
  return lines.join("\n");
}

async function main() {
  printReliabilityNotice("tool-brain");
  recordCliUsage("tool-brain");
  const [, , ...rest] = process.argv;

  // LA SOUS-COMMANDE DU CROCHET (2026-09-26, tâche #778) — muette quand il n'y a rien à dire.
  if (rest[0] === "muets") {
    let sourceCrochet = "";
    try { sourceCrochet = readFileSync(new URL("./hooks/post-commit", import.meta.url), "utf8"); } catch { /* le classement reste juste, en moins large */ }
    let offert = "";
    for (const d of ["../docs/regles-de-travail.md", "../CLAUDE.md"]) {
      try { offert += readFileSync(new URL(d, import.meta.url), "utf8"); } catch { /* idem */ }
    }
    const lireSource = (slug) => {
      for (const c of [`./${slug}.mjs`, `./check-${slug}.mjs`]) {
        try { return readFileSync(new URL(c, import.meta.url), "utf8"); } catch { /* essai suivant */ }
      }
      return null;
    };
    for (const l of muetsAuCompteurLines(buildToolBrainUsageReport(loadToolUsageHistory(), PRESTATIONS, { sourceCrochet, lireSource, offert }))) console.log(l);
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
    for (const doc of ["../CLAUDE.md", "../docs/regles-de-travail.md"]) {
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

if (import.meta.url === `file://${process.argv[1]}`) main();
