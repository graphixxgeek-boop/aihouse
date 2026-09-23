// Petit assistant partagé pour lancer une commande shell sans jamais faire planter l'appelant sur
// un code de sortie non nul (2026-09-19, extrait après avoir trouvé la même fonction réécrite à
// l'identique dans trois scripts — always-new-code.mjs, check-level-target.mjs,
// hyper-scan-checkpoint.mjs — exactement le genre de duplication que la nouvelle règle de
// mutualisation de docs/regles-de-travail.md §7ter est censée empêcher désormais).

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// PERSONNAGES — HORS DE L'ÉQUIPE, JAMAIS UNE CATÉGORIE DE L'ORGANIGRAMME (2026-09-21, tâche #245,
// corrigé le même soir après un second quasi-recouvrement). Root-cause réelle, en deux temps :
// (1) une confusion commise ce soir-là — proposer d'appliquer MEMENTO (pensé pour la mémoire
// narrative de Lia/Noé) comme condition du badge des membres de l'équipe (scripts comme
// ARGUS/HARMONIA) ; corrigée sur le moment en ajoutant "Personnages" comme une 5e catégorie DE
// L'ORGANIGRAMME lui-même (à côté de Direction/Équipe noyau/Membre de l'équipe/VIP). (2) Cette
// correction était elle-même la mauvaise forme de réparation : en gardant Lia/Noé DANS le même
// tableau que l'équipe (juste une case de plus), elle laissait la porte ouverte à ce que le même
// type de confusion revienne (constaté une seconde fois en construisant le menu PRESTATIONS de
// MEMENTO). Root-cause plus profonde encore, antérieure à #245 : la toute première note de
// conception de CASSANDRA-RH (docs/suivi 2026-09-20T09:40Z) prévoyait déjà qu'elle "noterait TOUS
// les membres de l'équipe [...] les mascottes Lia/Noé" — l'idée fondatrice mélangeait les deux
// avant même qu'une séparation existe. Décision finale (demande explicite de l'utilisateur,
// 2026-09-21) : Lia et Noé n'ont AUCUNE existence dans l'équipe — ce sont des personnages de la
// simulation, un domaine entièrement séparé (charte de contenu CLAUDE.md), jamais une case de
// l'organigramme de travail (docs/regles-de-travail.md). Cette constante n'est donc pas une
// catégorie interne à ranger à côté des autres : c'est une LISTE D'EXCLUSION, un pare-feu au bord
// du domaine équipe. Partagée ici (jamais dans le-coordinateur.mjs, pour que memory-audit puisse
// l'importer aussi sans créer de cycle) : aucun mécanisme pensé pour l'équipe (badge, PRESTATIONS,
// blueprint, couverture AXA-CHECK) ne doit jamais s'appliquer à Lia/Noé, et réciproquement aucun
// mécanisme de mémoire/cohérence narrative pensée pour eux (memory-audit) ne doit jamais s'appliquer
// à un script.
export const PERSONNAGES = new Set(["Lia", "Noé", "Noe"]);

// AGENT_CATEGORIES (2026-09-22, demande explicite de l'utilisateur : « le badge de chaque employé
// de l'agence codex mentionne la catégorie à laquelle il appartient »). Miroir en code de
// `docs/referentiel/organisation-agence.md` — clé = slug (`slugifyAgentName()`, le-coordinateur.mjs),
// valeur = le libellé de catégorie exact du document canonique. Partagée ici (même raison que
// PERSONNAGES ci-dessus, éviter un cycle d'import) pour que `checkAgentOnboarding()` (badge) ET tout
// futur outil (CASSANDRA-RH) lisent la MÊME source, jamais deux copies divergentes. Seuls les outils
// de statut "Agent" (badge-éligibles) sont listés ici — un Utilitaire nommé/Infrastructure n'a
// jamais de badge, donc jamais besoin d'y figurer. À tenir à jour à chaque changement d'organigramme
// (même discipline que la table maîtresse `docs/regles-de-travail.md` §7ter, Article 13).
// ————————————————————————————————————————————————————————————————————————
// LA PORTÉE D'UN OUTIL — ce qu'il analyse (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Décidé par l'utilisateur après une erreur réelle de ma part le 2026-09-23 : j'ai lancé
// memory-audit pendant une Ronde. Il n'y était pas — je l'avais ajouté de ma propre initiative —
// et il n'avait rien à y faire : il juge la mémoire d'un personnage en fin de simulation, jamais
// l'état du dépôt. Sa remarque : « distinguons les outils qui analysent le code ou les outils ou
// l'agence ou l'organisation, etc. des outils qui analysent les simulations. Point important :
// certains outils peuvent peut-être faire les 2, ce qui explique si on les retrouve aux 2
// endroits. »
//
// CE QUE CET ATTRIBUT CORRIGE, ET POURQUOI IL FALLAIT L'ÉCRIRE : la distinction existait dans ma
// tête, nulle part ailleurs. Rien n'empêchait un outil de simulation de se retrouver dans une
// Ronde, et rien ne l'aurait signalé. C'est exactement le motif de l'Article 27 — une obligation
// qui ne repose que sur la mémoire d'un agent n'existe plus à la session suivante.
//
// LA TROISIÈME VALEUR EST LA PLUS IMPORTANTE, et c'est lui qui l'a posée : « les deux » n'est pas
// une facilité pour les cas douteux. C'est ce qui rend LÉGITIME la présence d'un outil aux deux
// endroits, au lieu de la faire passer pour un oubli. Un outil mixte déclare qu'il l'est.
export const PORTEES = {
  agence: "analyse le CODE, l'outillage, l'organisation ou la documentation — se lance à froid sur le dépôt, sans partie en cours",
  simulation: "analyse une SIMULATION ou une partie en cours — n'a rien à dire tant qu'aucun état de jeu ne lui est fourni",
  "les-deux": "les deux réellement, jamais par commodité — sa présence aux deux endroits est alors justifiée, jamais un oubli",
};

// Le registre lui-même. Il se LIT (findToolsMissingPortee ci-dessous vérifie qu'aucun outil réel
// n'y manque), il ne s'énumère jamais de mémoire — Article 24.
export const TOOL_PORTEE = {
  // — Portée simulation : rien à dire sur le dépôt seul —
  "memory-audit": "simulation",
  "memento-weight": "simulation",
  "el-professor": "simulation",
  "the-screener": "simulation",
  "the-ghost": "simulation",
  "le-regisseur": "simulation",
  "process-simulation-guardian": "simulation",
  "check-spirit": "simulation",
  // — Portée « les deux », et chacune pour une raison précise —
  "tableau-de-bord-interne-kpi": "les-deux",   // mesure des familles d'outils ET des indicateurs narratifs d'une simulation
  "smart-conso-api": "les-deux",               // régule le rythme du travail ET le quota brûlé par une simulation
  "smart-conso-token": "les-deux",             // pèse les documents de travail ET le coût d'une analyse de simulation
  "hyper-scan-checkpoint": "les-deux",         // sa version complète inclut une mini-simulation réelle
  "the-final-judge": "les-deux",               // audite le code ET le produit
  // Tout le reste est de portée « agence » — déclaré par défaut plus bas plutôt qu'énuméré ici,
  // pour qu'un nouvel outil hérite du cas majoritaire sans inscription manuelle (Article 24).
};

export const PORTEE_PAR_DEFAUT = "agence";

export function porteeDe(slug, { registre = TOOL_PORTEE, defaut = PORTEE_PAR_DEFAUT } = {}) {
  return registre[slug] ?? defaut;
}

// Un outil lancé hors de sa portée : le cas réel du 2026-09-23. Rend une raison, jamais un booléen —
// « memory-audit est de portée simulation » et « rien à signaler » ne sont pas la même information.
export function outilsHorsPortee(slugsLances = [], contexte = "agence", { registre = TOOL_PORTEE } = {}) {
  return slugsLances
    .map((slug) => ({ slug, portee: porteeDe(slug, { registre }) }))
    .filter(({ portee }) => portee !== "les-deux" && portee !== contexte)
    .map(({ slug, portee }) => `${slug} : portée « ${portee} », lancé dans un contexte « ${contexte} » — ${PORTEES[portee]}`);
}

export const AGENT_CATEGORIES = {
  // Les Agents Cadre (Direction/CODIR) — nom acté le 2026-09-22
  "cassandra-rh": "Agent Cadre",
  "le-coordinateur": "Agent Cadre",
  // Les Gardiens sacrés du code (Article 20 — tourne automatiquement à chaque commit)
  argus: "Gardien sacré du code",
  "safe-export": "Gardien sacré du code",
  harmonia: "Gardien sacré du code",
  "axa-check": "Gardien sacré du code",
  "clean-dirty-old": "Gardien sacré du code",
  "clone-hunter": "Gardien sacré du code",
  // ALWAYS-NEW-CODE (2026-09-21) : sixième Gardien, couche LÉGÈRE seulement (recommendZone() +
  // addendaSignal()/churnSignal(), zéro raisonnement) — le vrai zoom profond, qui exige un
  // raisonnement payant, reste explicitement exclu du statut de Gardien (cf.
  // docs/referentiel/organisation-agence.md §3, critère double : c'est le LIVRABLE qui exige un
  // raisonnement payant qui ne peut jamais devenir un Gardien, jamais le nom de l'outil dans son
  // ensemble — sa couche légère satisfait le critère double exactement comme les 5 autres).
  "always-new-code": "Gardien sacré du code",
  // Suite Suivi-Conso
  "smart-conso-api": "Membre — Suite Suivi-Conso",
  "smart-conso-token": "Membre — Suite Suivi-Conso",
  "objectifs-vs-resultats": "Membre — Suite Suivi-Conso",
  "ecotoken": "Membre — Suite Suivi-Conso",
  // Suite Audit Simulation
  "el-professor": "Membre — Suite Audit Simulation",
  "the-screener": "Membre — Suite Audit Simulation",
  "memory-audit": "Membre — Suite Audit Simulation",
  // Suite Audit lourd
  "the-final-judge": "Membre — Suite Audit lourd",
  "the-deep-reader": "Membre — Suite Audit lourd",
  "hyper-scan-checkpoint": "Membre — Suite Audit lourd",
  // Suite Dette & Structure du code (ALWAYS-NEW-CODE en est retiré le 2026-09-21 — promu Gardien
  // sacré du code ci-dessus, jamais listé deux fois)
  "find-booster": "Membre — Suite Dette & Structure du code",
  // tool-learning (2026-09-22) : rangé dans la Suite Dette & Structure du code parce que c'est de
  // la dette qu'il parle — la dette d'un outil qui n'apprend pas. Volontairement PAS un Gardien :
  // il juge une TRAJECTOIRE, et une trajectoire ne se mesure pas à chaque commit (trois passages
  // minimum avant de conclure), donc il a sa place dans un rythme périodique.
  "tool-learning": "Membre — Suite Dette & Structure du code",
  // A-NIVEAU (2026-09-23) : Membre, jamais Gardien sacré. Il ne remplit AUCUN des deux volets du
  // critère — il ne scanne rien par lui-même (il rassemble ce que les contrôleurs ont déjà dit) et
  // il ne tourne pas à chaque commit (un verdict d'ensemble à chaque commit serait du bruit).
  "a-niveau": "Membre — Suite Dette & Structure du code",
  // integration-outil (2026-09-22) : Membre, jamais Gardien. Il ne scanne pas la qualité du code et
  // ne tourne pas à chaque commit — les deux volets du critère d'appartenance, dont aucun n'est
  // facultatif (Article 20). Il répond à la demande, avant de faire entrer un outil.
  "integration-outil": "Membre — Suite Dette & Structure du code",
  // La Cour du Roi
  "ines-official": "Membre — La Cour du Roi",
  "the-king": "Membre — La Cour du Roi",
  "check-tasks-details": "Membre — La Cour du Roi",
  // Suite Orientation (2026-09-22, calibrage explicite de l'utilisateur). Trois membres certifiés
  // n'appartenaient à AUCUNE suite depuis leur certification — un vrai trou trouvé en construisant
  // l'organigramme de CASSANDRA, jamais une décision : ils ressortaient en « catégorie non
  // répertoriée ». Ils forment bien une famille cohérente, distincte de celles qui produisent un
  // constat : ceux qui disent QUOI faire ensuite et AVEC QUOI, jamais ce qu'il faut en penser.
  "circle-tasks": "Membre — Suite Orientation",
  "process-simulation-guardian": "Membre — Suite Audit Simulation",
  "angel-of-ia-process": "Membre — Suite Orientation",
  "data-archangel": "Membre — Suite Orientation",
  "pure-gold-unity": "Membre — Suite Orientation",
  "god-of-all-process": "Membre — Suite Orientation",
  "tool-brain": "Membre — Suite Orientation",
  "find-deep-booster": "Membre — Suite Orientation",
  // Les Agents Spéciaux
  "check-level-target": "Agent Spécial",
  "smart-breaker": "Agent Spécial",
};

export function assertNotAPersonnage(name, callerLabel) {
  if (PERSONNAGES.has(name)) {
    throw new Error(`${callerLabel} ne s'applique jamais à un Personnage ("${name}") — Lia et Noé n'ont aucune existence dans l'équipe de travail, ce sont des personnages de la simulation (cf. docs/suivi tâche #245 et sa correction du 2026-09-21). Un outil pensé pour la mémoire/cohérence narrative des personnages (ex. memory-audit) ne doit jamais recouper un outil de badge/blueprint/couverture de code.`);
  }
}

export function sh(cmd, { cwd, verbose = false, env } = {}) {
  try {
    return execSync(cmd, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return verbose ? (e.stdout || "") + "\n[erreur: " + e.message + "]" : e.stdout || "";
  }
}

// Extrait le 2026-09-21 de check-tasks-details.mjs (même règle de mutualisation §7ter que sh()
// ci-dessus) : circle-tasks.mjs en a aussi besoin (garde-fou de fraîcheur du catalogue de la
// Ronde) et importer directement depuis check-tasks-details.mjs créerait un cycle avec
// daysSince() ci-dessous — résolu en plaçant les deux ici, jamais dans l'un ou l'autre. `root`
// doit être fourni SANS séparateur final (rappel trouvé le 2026-09-20 : un simple
// `slice(root.length + 1)` grignotait la première lettre de "docs/", faussant silencieusement
// toute vérification de registre en aval).
export function walkDocsPaths(dir, root, out = new Set()) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    out.add(full.slice(root.length).replace(/^[\\/]/, "").replace(/\\/g, "/"));
    if (entry.isDirectory()) walkDocsPaths(full, root, out);
  }
  return out;
}

// Extrait le 2026-09-21 de circle-tasks.mjs (audit d'évolutivité — nouveau signal
// chantier-preliminaire-signal) : circle-tasks.mjs doit désormais importer checkChantierFileFreshness()/
// loadAllTaskRows() de check-tasks-details.mjs, ce qui aurait créé exactement le même cycle que
// walkDocsPaths() ci-dessus si daysSince() était resté dans circle-tasks.mjs (check-tasks-details.mjs
// l'importait déjà de là). Résolu de la même façon : un utilitaire pur, sans dépendance vers l'un ou
// l'autre, vit ici — jamais dans l'un des deux fichiers qui en dépendent tous les deux.
export function daysSince(dateStr, now = Date.now()) {
  if (!dateStr) return undefined;
  const days = Math.floor((now - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : undefined;
}

// shouldSnapshotText() (2026-09-21, extraite ici le 2026-09-22 pour être réutilisée par un second
// appelant, jamais un second calcul divergent — Article 3). Née dans the-king.mjs sous le nom
// shouldSnapshotPhilosophy() (demande explicite : « the-king doit aussi editer une version txt à
// jour de "politique et philo" à chaque ronde [...] propose » — choix assumé : jamais une cadence
// fixe en nombre de Rondes, le déclenchement est le changement RÉEL du contenu). Généralisée le
// même soir pour couvrir aussi la snapshot CLAUDE.md (claude-md-weight-signal, circle-tasks.mjs) —
// même besoin exact, même fonction, jamais une resemblance codée deux fois.
export function shouldSnapshotText(lastSnapshotText, currentText) {
  return lastSnapshotText == null || lastSnapshotText !== currentText;
}

// =============================================================================================
// RÉVEIL CONDITIONNEL DES GARDIENS (2026-09-22, tâche #362).
//
// LE CONSTAT QUI A MOTIVÉ CECI. Les six Gardiens tournaient intégralement à CHAQUE commit, sans
// jamais regarder ce que le commit contenait. Mesuré sur les 20 derniers commits : deux ne
// touchaient aucun fichier de code, et les dix-huit autres ne touchaient `lib/` QUE par
// `lib/reference.ts`. ARGUS a donc rescanné les champs de `lib/life.ts` vingt fois d'affilée sur un
// fichier qui n'avait pas bougé, remontant les six mêmes candidats — avec, ce soir-là, deux
// fichiers de scan archivés identiques octet pour octet hors horodatage.
//
// LA DISTINCTION QUI GOUVERNE TOUT (actée explicitement avec l'utilisateur le 2026-09-22) :
//   • Ce qui GARANTIT le code = check-house.mjs + tsc, dans le crochet pre-commit, BLOQUANTS.
//     Ceux-là tournent sur CHAQUE commit, sans condition, et cette fonction ne les concerne pas.
//   • Ce qui RENFORCE = les six Gardiens, dans le post-commit, qui n'ont jamais rien bloqué.
//     Eux seuls sont soumis au réveil conditionnel ci-dessous.
// Confondre les deux étages serait le vrai danger : conditionner les tests créerait un trou de
// surveillance, conditionner les Gardiens ne fait qu'éteindre du bruit.
export const NOT_REALLY_CODE = [
  // `lib/reference.ts` vit dans un dossier de code mais n'en est pas : c'est le référentiel
  // AFFICHÉ en jeu (panneau Admin), de la donnée narrative versionnée section par section. Il est
  // incrémenté à presque chaque commit, ce qui faisait passer tout commit pour un changement de
  // moteur — la cause racine du gaspillage mesuré. Aucun champ de life.ts ne peut mourir, aucun
  // bloc ne peut se dupliquer, aucune couverture de test ne peut bouger parce qu'il a changé.
  /^lib\/reference\.ts$/,
];

// Ce que chaque Gardien surveille RÉELLEMENT — lu dans leur code, jamais supposé (Article 19).
// ARGUS et CLONE-HUNTER balaient large (marqueurs TODO partout, duplication dans quatre racines) ;
// les autres sont plus ciblés. Un Gardien absent de cette table tourne toujours, par prudence :
// l'oubli d'une entrée ne doit jamais créer un angle mort silencieux.
export const GARDIEN_DOMAINS = {
  argus: [/^lib\//, /^app\//, /^components\//, /^scripts\//],
  harmonia: [/^lib\//, /^scripts\//, /^docs\//],
  "axa-check": [/^lib\//, /^scripts\//],
  "clean-dirty-old": [/^lib\//, /^scripts\//],
  "clone-hunter": [/^lib\//, /^scripts\//, /^app\//, /^components\//],
  // scripts/ ajouté le 2026-09-22 : ses zones ne couvraient que le moteur du jeu, si bien qu'il
  // dormait sur TOUT commit d'outillage — alors que la dette d'empilement y est bien réelle
  // (ecotoken.mjs dépasse 1 500 lignes après une soirée). Ses zones d'outillage se dérivent
  // mécaniquement de AGENT_SCRIPT_FILES × AGENT_CATEGORIES (cf. outillageZones()).
  "always-new-code": [/^lib\//, /^app\//, /^components\//, /^scripts\//],
  // safe-export (2026-09-22) : SEPTIÈME Gardien sacré, couche légère seulement. Ses zones sont
  // docs/ et scripts/ et PAS le moteur du jeu — sa question est l'exportabilité de l'outillage et
  // la lisibilité par une autre IA, or lib/ et app/ ne partiront jamais avec l'Agence. L'y réveiller
  // à chaque commit du jeu lui ferait brûler du temps sur des fichiers qu'il n'a rien à dire.
  "safe-export": [/^docs\//, /^scripts\//],
};

export function realCodeFilesChanged(changedFiles, notReallyCode = NOT_REALLY_CODE) {
  return (changedFiles ?? []).filter((f) => !notReallyCode.some((re) => re.test(f)));
}

// Un Gardien se réveille si au moins un fichier RÉELLEMENT de code, dans son domaine, a changé.
// Répond toujours `true` pour un Gardien inconnu (prudence) et pour une liste de fichiers non
// fournie (on ne devine pas : ne pas savoir ce qui a changé n'autorise jamais à se taire).
export function gardienShouldRun(gardien, changedFiles, domains = GARDIEN_DOMAINS) {
  if (!changedFiles) return true;
  const domain = domains[gardien];
  if (!domain) return true;
  return realCodeFilesChanged(changedFiles).some((f) => domain.some((re) => re.test(f)));
}

// Les fichiers du dernier commit, tels que git les rapporte. Retourne `undefined` plutôt qu'une
// liste vide si git ne répond pas : une absence d'information doit faire tourner les Gardiens,
// jamais les endormir (même principe d'absence honnête que le reste du paysage).
export function lastCommitFiles(shImpl = sh, cwd = undefined) {
  try {
    const out = shImpl("git show --name-only --format= HEAD", cwd ? { cwd } : {});
    const files = String(out).split("\n").map((l) => l.trim()).filter(Boolean);
    return files.length ? files : undefined;
  } catch { return undefined; }
}

// --- FIABILITÉ DÉCLARÉE DE CHAQUE OUTIL (2026-09-22, demande explicite de l'utilisateur :
// « ecotoken devrait indiquer en debut de rapport : "attention mes resultats peuvent etre
// inexactes" [...] on pourrait elargir cette regle à tous les outils concernés, sauf ceux qui sont
// fiables 100% (calculs mathematiques purs) »).
//
// POURQUOI CE REGISTRE EXISTE. Presque tout l'outillage de ce projet produit des SIGNAUX, pas des
// verdicts : ARGUS dit « potentiellement jamais lu », CLONE-HUNTER « jamais une factorisation
// acquise », check-tasks-details « jamais une certitude d'oubli ». Chacun le disait déjà — mais
// chacun à sa façon, à un endroit différent de son rapport, parfois pas du tout. Un lecteur qui
// tombe sur une sortie chiffrée au milieu d'un rapport n'a aucune raison de deviner qu'elle est
// approchée. L'avertissement devient donc une PHRASE UNIQUE, en tête de rapport, identique partout
// — jamais une nuance noyée en bas de page que l'œil saute.
//
// LA FRONTIÈRE, exactement celle posée par l'utilisateur : un outil est « mecanique » quand ce
// qu'il affiche est un FAIT exact (un test passe ou échoue, un fichier existe ou non, un compteur
// compte ce qui a été enregistré) ; il est « heuristique » dès qu'il y a une estimation, un seuil
// choisi, une similarité de vocabulaire, une lecture de sens, ou une mesure vraie dont
// l'INTERPRÉTATION ne l'est pas (la couverture de test d'AXA-CHECK est exacte ; en conclure
// « robuste » ne l'est pas). Dans le doute, on classe « heuristique » : un avertissement de trop ne
// coûte qu'une ligne, un avertissement manquant coûte une décision prise sur un chiffre faux.
//
// CE REGISTRE EST VOLONTAIREMENT TENU À LA MAIN (Article 24, cas explicitement prévu : « un contenu
// explicitement curaté à la main par décision humaine documentée reste légitime tel quel, tant que
// cette nature volontairement manuelle est écrite noir sur blanc à côté ») — aucune mécanique ne
// peut deviner si un calcul est exact ou approché, c'est un jugement. Ce qui est mécanique, et
// obligatoire, ce sont les DEUX garde-fous qui l'entourent (cf. doc-report.mjs) : aucun outil de la
// table maîtresse ne peut manquer à ce registre, et aucun outil classé « heuristique » ne peut
// omettre d'afficher réellement son avertissement.
export const TOOL_RELIABILITY = {
  // --- Mécaniques : ce qu'ils affichent est un fait exact, aucun avertissement à donner.
  "check-house-mjs": { nature: "mecanique", pourquoi: "un test passe ou échoue, il n'y a rien à interpréter" },
  "le-coordinateur": { nature: "mecanique", pourquoi: "chaque point de câblage vérifié est une présence ou une absence sur le disque" },
  "doc-html": { nature: "mecanique", pourquoi: "ne produit aucun constat — il met en page un rapport déjà écrit par un autre" },
  "compteur-d-utilisation-des-outils": { nature: "mecanique", pourquoi: "compte exactement les sollicitations réellement enregistrées, jamais une estimation" },
  "ines-official": { nature: "mecanique", pourquoi: "recopie des fichiers réels dans une édition consolidée, sans rien en juger" },
  "objectifs-vs-resultats": { nature: "mecanique", pourquoi: "compare un chiffre déjà mesuré à un objectif déjà écrit — aucune estimation entre les deux" },

  // --- Heuristiques : estimation, seuil choisi, similarité, lecture de sens, ou interprétation
  // d'une mesure pourtant exacte. Tous doivent afficher l'avertissement en tête de rapport.
  "check-spirit-mjs": { nature: "heuristique", pourquoi: "ses heuristiques ne détectent que les dérives les plus grossières — la lecture humaine des réponses reste indispensable" },
  argus: { nature: "heuristique", pourquoi: "un champ « potentiellement jamais lu » peut l'être par un chemin que ce balayage ne voit pas" },
  harmonia: { nature: "heuristique", pourquoi: "une incohérence de lien est un candidat, jamais une preuve que le lien est faux" },
  "smart-conso-api": { nature: "heuristique", pourquoi: "un quota se lit à un instant donné et peut avoir changé à la seconde suivante" },
  "check-level-target": { nature: "heuristique", pourquoi: "le niveau attendu est une recommandation calculée sur des signaux, jamais une obligation démontrée" },
  "hyper-scan-checkpoint": { nature: "heuristique", pourquoi: "cherche des bugs inconnus — n'en trouver aucun ne prouve jamais qu'il n'y en a pas" },
  "always-new-code": { nature: "heuristique", pourquoi: "l'empilement se devine par des indices, et un choix assumé peut y ressembler de loin" },
  "axa-check": { nature: "heuristique", pourquoi: "la couverture mesurée est exacte, mais en conclure « robuste » ne l'est jamais" },
  "clean-dirty-old": { nature: "heuristique", pourquoi: "l'ancienneté d'un fichier ne dit pas s'il est périmé — seulement qu'on n'y a pas regardé depuis longtemps" },
  "el-professor": { nature: "heuristique", pourquoi: "une note de fidélité à la charte reste une appréciation, jamais une mesure" },
  "the-screener": { nature: "heuristique", pourquoi: "une note graphique est indicative — deux captures ne résument pas un rendu" },
  "the-final-judge": { nature: "heuristique", pourquoi: "un audit par agent séparé est un avis argumenté, jamais un verdict prouvé" },
  "the-deep-reader": { nature: "heuristique", pourquoi: "relire un historique pour y trouver un oubli laisse toujours passer ce qui n'a jamais été écrit" },
  "smart-breaker": { nature: "heuristique", pourquoi: "une disponibilité de modèle sondée maintenant peut être fausse dans une minute" },
  "smart-conso-token": { nature: "heuristique", pourquoi: "aucun compteur réel de tokens n'existe côté agent — tout y est estimation" },
  "circle-tasks": { nature: "heuristique", pourquoi: "ses signaux de fraîcheur disent « possible oubli », jamais « oubli avéré »" },
  "check-tasks-details": { nature: "heuristique", pourquoi: "mesure ce que le SUIVI dit du projet, jamais ce qui a réellement été fait" },
  "charter-spy": { nature: "heuristique", pourquoi: "un candidat de redondance repose sur un vocabulaire partagé, jamais sur le sens réel de deux règles" },
  "doc-report": { nature: "heuristique", pourquoi: "ses seuils de navigabilité et de fraîcheur sont des repères choisis, jamais des vérités" },
  "process-simulation-guardian": { nature: "heuristique", pourquoi: "son contrôle préalable juge un plan que l'agent lui décrit, jamais le script réel — un plan mal décrit passera le contrôle" },
  "data-archangel": { nature: "heuristique", pourquoi: "il mesure une lecture à la citation d'un chemin dans le code — une mention, jamais la preuve que la donnée est réellement exploitée, et un chemin construit dynamiquement lui échappe complètement" },
  "angel-of-ia-process": { nature: "heuristique", pourquoi: "il croise des horodatages : une consultation faite dans une session sans commit lui reste invisible, et un commit groupant plusieurs heures élargit la fenêtre — un signal daté, jamais une preuve" },
  "pure-gold-unity": { nature: "heuristique", pourquoi: "il reconnaît une conversion au gabarit à la présence d'un appel dans le code, jamais en lisant le rapport produit — un outil qui appellerait le cadre sans s'en servir passerait pour conforme" },
  "god-of-all-process": { nature: "heuristique", pourquoi: "il associe une tâche à un process par mots-clés, et ne voit d'une étape que la trace qu'elle laisse sur le disque — une étape faite sans trace lui reste invisible" },
  "the-king": { nature: "heuristique", pourquoi: "lit des titres et du vocabulaire, jamais le sens réel de deux principes ; ses dates dérivées sont des déductions git" },
  "memory-audit": { nature: "heuristique", pourquoi: "une incohérence de mémoire narrative se devine, elle ne se prouve pas mécaniquement" },
  "find-deep-booster": { nature: "heuristique", pourquoi: "propose des points de coupe candidats par heuristique de texte, jamais un vrai parseur" },
  "find-brain": { nature: "heuristique", pourquoi: "recommande un outil de recherche sur des seuils de taille — une recommandation, jamais une obligation" },
  "tool-brain": { nature: "heuristique", pourquoi: "associe une tâche à des outils par mots-clés — il peut passer à côté de l'outil réellement utile" },
  "find-booster": { nature: "heuristique", pourquoi: "retrouve un concept par proximité de vocabulaire, jamais par compréhension du code" },
  "clone-hunter": { nature: "heuristique", pourquoi: "deux blocs qui se ressemblent ne sont pas toujours deux blocs à factoriser" },
  // 2026-09-22 — SIXIÈME et SEPTIÈME inscription manuelle pour ces deux outils, et c'est exactement
  // le défaut d'évolutivité que l'Article 24 nomme depuis le 2026-09-22 : chacun des garde-fous a
  // DÉTECTÉ l'oubli au lieu de l'ÉVITER, un registre après l'autre, en faisant échouer un test à
  // chaque fois. Ils font leur travail — mais l'agent reste le mécanisme d'intégration, et c'est
  // ce que la précision de l'Article 24 juge insuffisant. Constat gardé ici, à côté du symptôme.
  "safe-export": { nature: "heuristique", pourquoi: "une absence d'explication n'est pas une absence de raison, et un terme sans fiche n'est pas forcément mal défini — ses détecteurs sont des indices, jamais des preuves" },
  // Mécanique et pas heuristique : il LIT les registres réels et rapporte présent/absent, sans
  // jamais interpréter. Sa seule vraie faiblesse est ailleurs et elle a son propre garde-fou
  // (findLecteursCasses) : un registre reformaté rendrait son lecteur muet, et un lecteur muet
  // déclarerait tout le monde absent — d'où un chiffre spectaculaire et faux, comme SAFE-EXPORT en a
  // produit un le même jour.
  "integration-outil": { nature: "mécanique", pourquoi: "il lit les registres réels et rapporte présent/absent, jamais une interprétation — findLecteursCasses() refuse de conclure quand un lecteur ne reconnaît plus la forme de son registre" },
  // A-NIVEAU : mécanique par construction — il ne produit aucune estimation propre. Chaque ligne
  // de son verdict est soit une lecture littérale du référentiel, soit un chiffre rendu par un
  // contrôleur qui porte déjà, lui, son propre avertissement s'il en a besoin.
  "a-niveau": { nature: "mecanique", pourquoi: "il n'estime rien : il relit le référentiel des standards et relaie des verdicts déjà calculés ailleurs" },
  "tool-learning": { nature: "heuristique", pourquoi: "il juge une trajectoire : sous trois passages il refuse de conclure, et une baisse de trouvailles peut venir d'un code qui s'est amélioré plutôt que d'un outil qui régresse" },
  "cassandra-rh": { nature: "heuristique", pourquoi: "relaie et recoupe ce que les autres outils estiment — elle hérite de leurs approximations" },
  ecotoken: { nature: "heuristique", pourquoi: "le poids en tokens est estimé et le rangement d'un bloc se devine — un bloc qui cite un fichier n'y appartient pas forcément" },
};

// La phrase unique, en tête de rapport. `null` pour un outil mécanique : pas d'avertissement creux
// qui perdrait sa valeur d'alerte à force d'apparaître partout. `null` aussi pour un slug inconnu —
// un outil non classé ne doit jamais hériter d'un avertissement par défaut qui masquerait le fait
// qu'il manque au registre (c'est le garde-fou de doc-report.mjs qui doit le dire, bruyamment).
export function reliabilityNotice(slug, registry = TOOL_RELIABILITY) {
  const entry = registry[slug];
  if (!entry || entry.nature !== "heuristique") return null;
  return `⚠️  Attention, mes résultats peuvent être inexacts : ${entry.pourquoi}. À vérifier avant d'agir, jamais un verdict acquis.`;
}

// Affichage direct en tête de rapport — le seul appel que chaque outil heuristique doit faire.
// Ne fait rien pour un outil mécanique, ce qui rend l'appel sûr à écrire partout.
export function printReliabilityNotice(slug, registry = TOOL_RELIABILITY, log = console.log) {
  const notice = reliabilityNotice(slug, registry);
  if (notice) log(notice);
  return notice;
}

// ————————————————————————————————————————————————————————————————————————
// UN VERT NON REPRÉSENTATIF EST UNE ALERTE (2026-09-22)
// ————————————————————————————————————————————————————————————————————————
//
// Décision explicite de l'utilisateur, à la fenêtre de clôture de la Ronde du 2026-09-22, en
// réponse à trois chiffres verts de cette Ronde même : « 100 % d'investissement réel » calculé sur
// 2 actions sur 18 ; « 0 tension » trouvée par THE-KING sur un texte fondateur enrichi cinq fois en
// quatre jours ; « 100 % de robustesse » affiché à côté de 39 commits sans Ronde. Question posée :
// faut-il traiter un vert bâti sur un échantillon minuscule comme une alerte ? Réponse : OUI.
//
// Ce que ça coûte, et c'est assumé : plusieurs tableaux deviendront moins flatteurs. C'est
// exactement le but — un pourcentage parfait porté par trois cas n'est pas un succès, c'est une
// mesure qui ne couvre presque rien et qui se présente comme rassurante. C'est la forme la plus
// polie du défaut que ce projet combat depuis le début : une mesure adjacente ou absente servie à
// la place de la mesure visée.
//
// Le seuil est bas et volontairement grossier : en dessous de 30 % de la population, aucun taux ne
// conclut. Un seuil plus fin donnerait une fausse impression de rigueur sur une règle qui vise
// justement à refuser la fausse précision.
export const REPRESENTATIVITE_MINIMUM = 0.3;
export const PLANCHER_ABSOLU_CAS = 4;

// qualifierIndicateur() — rend un troisième état, jamais deux. « non concluant » n'est ni un succès
// ni un échec : c'est le refus de conclure, et c'est une information à part entière.
//
// `mesures` = le nombre de cas réellement mesurés ; `population` = le nombre de cas qui AURAIENT dû
// l'être. Une population inconnue (null) renvoie « non concluant » elle aussi : ne pas savoir sur
// combien porte un taux est pire que de savoir qu'il porte sur peu.
export function qualifierIndicateur({ taux, mesures, population, seuil = REPRESENTATIVITE_MINIMUM, plancher = PLANCHER_ABSOLU_CAS } = {}) {
  if (population == null || mesures == null) {
    return { etat: "non concluant", assiette: "inconnue", pourquoi: "on ignore sur combien de cas ce taux porte — une assiette inconnue ne se lit jamais comme une assiette complète" };
  }
  const couverture = population > 0 ? mesures / population : 0;
  const assiette = `${mesures} cas sur ${population}`;
  if (mesures < plancher) {
    return { etat: "non concluant", assiette, couverture, pourquoi: `moins de ${plancher} cas mesurés : aucun taux ne tient sur si peu, quelle que soit la part que ça représente` };
  }
  if (couverture < seuil) {
    return { etat: "non concluant", assiette, couverture, pourquoi: `${Math.round(couverture * 100)} % de la population mesurée, sous le seuil de ${Math.round(seuil * 100)} % — le taux décrit l'échantillon, jamais le paysage` };
  }
  return { etat: typeof taux === "number" && taux >= 1 ? "vert" : "mesuré", assiette, couverture, pourquoi: null };
}

// formatIndicateur() — l'assiette voyage TOUJOURS avec le taux, y compris quand il est concluant.
// C'était la seconde option proposée à l'utilisateur ; il a choisi la première (l'alerte), mais
// afficher l'assiette reste vrai dans les deux cas et ne coûte rien — un taux sans son assiette est
// une phrase incomplète.
export function formatIndicateur(label, taux, { mesures, population } = {}) {
  const q = qualifierIndicateur({ taux, mesures, population });
  const pct = typeof taux === "number" ? `${Math.round(taux * 100)} %` : String(taux ?? "—");
  if (q.etat === "non concluant") return `${label} : ⚠️ NON CONCLUANT (${pct} affiché, ${q.assiette}) — ${q.pourquoi}`;
  return `${label} : ${pct} (${q.assiette})`;
}
