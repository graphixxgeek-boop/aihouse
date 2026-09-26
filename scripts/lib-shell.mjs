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
  // Ajoutés le 2026-09-25 (tâche #832) : trouvés par la suspicion mécanique, pas par une revue —
  // les deux OUVRENT réellement `docs/simulations/`, ils ne la citent pas en passant.
  "run-simulation": "simulation",
  "summarize-simulation-log": "simulation",
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

// La forme d'une catégorie est « Rang — Famille » (#754, 2026-09-25) : le RANG dit l'autorité
// (Article 20bis : Gardien sacré du code, Membre, Agent Cadre, Agent Spécial), la FAMILLE dit le
// voisinage de travail, et c'est elle qui doit coïncider avec `doc-report.REGISTRIES[].family`.
// Les deux se LISENT ici plutôt que d'être redécoupées chez chaque lecteur : deux découpages du
// même libellé auraient fini par diverger, ce qui est exactement le défaut que #754 vient de fermer.
export const SEPARATEUR_RANG_FAMILLE = " — ";
export function rangDeLaCategorie(categorie) {
  const t = String(categorie ?? "");
  const i = t.indexOf(SEPARATEUR_RANG_FAMILLE);
  return (i === -1 ? t : t.slice(0, i)).trim() || null;
}
export function familleDeLaCategorie(categorie) {
  const t = String(categorie ?? "");
  const i = t.indexOf(SEPARATEUR_RANG_FAMILLE);
  return i === -1 ? null : t.slice(i + SEPARATEUR_RANG_FAMILLE.length).trim() || null;
}

export const AGENT_CATEGORIES = {
  // Membre, jamais Gardien sacré : il scanne un DOCUMENT, pas la qualité du code — le premier
  // volet du critère double n'est donc pas rempli, même si le second (gratuit à chaque commit) l'est.
  // Membre, jamais Gardien sacré : il analyse un DOCUMENT, pas la qualité du code.
  "abraham-les-references": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",
  "moise-tables-de-loi": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",
  // Les Agents Cadre (Direction/CODIR) — nom acté le 2026-09-22
  "cassandra-rh": "Agent Cadre — (f) 👑 La Gouvernance Royale",
  // Né le 2026-09-26 de la scission de CASSANDRA : elle juge les gens, lui range les choses.
  "le-classificateur": "Membre premium — (f) 👑 La Gouvernance Royale",
  "le-coordinateur": "Agent Cadre — (f) 👼 Les Anges de la coordination",
  // Les Gardiens sacrés du code (Article 20 — tourne automatiquement à chaque commit)
  argus: "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  "safe-export": "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  harmonia: "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  "axa-check": "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  "clean-dirty-old": "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  "clone-hunter": "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  // ALWAYS-NEW-CODE (2026-09-21) : sixième Gardien, couche LÉGÈRE seulement (recommendZone() +
  // addendaSignal()/churnSignal(), zéro raisonnement) — le vrai zoom profond, qui exige un
  // raisonnement payant, reste explicitement exclu du statut de Gardien (cf.
  // docs/referentiel/organisation-agence.md §3, critère double : c'est le LIVRABLE qui exige un
  // raisonnement payant qui ne peut jamais devenir un Gardien, jamais le nom de l'outil dans son
  // ensemble — sa couche légère satisfait le critère double exactement comme les 5 autres).
  "always-new-code": "Gardien sacré du code — (f) 🛡️ Les Gardiens Sacrés du Code",
  // Suite Suivi-Conso
  "smart-conso-api": "Membre premium — (f) 👑 La Gouvernance Royale",
  "smart-conso-token": "Membre premium — (f) 👑 La Gouvernance Royale",
  "objectifs-vs-resultats": "Membre premium — (f) 👑 La Gouvernance Royale",
  "ecotoken": "Membre premium — (f) 👑 La Gouvernance Royale",
  // Suite Audit Simulation
  "el-professor": "Membre premium — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  "the-screener": "Membre premium — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  "memory-audit": "Membre premium — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  // Suite Audit lourd
  "the-final-judge": "Membre premium — (f) 🕵️ Les Agents Externes - Audit indépendant",
  "the-deep-reader": "Membre premium — (f) 🕵️ Les Agents Externes - Audit indépendant",
  "hyper-scan-checkpoint": "Membre premium — (f) ✨ Exceptionnel (page blanche / audit lourd)",
  // Suite Dette & Structure du code (ALWAYS-NEW-CODE en est retiré le 2026-09-21 — promu Gardien
  // sacré du code ci-dessus, jamais listé deux fois)
  "find-booster": "Membre premium — (f) 🚀 Les Boosters de Navigation",
  // tool-learning (2026-09-22) : rangé dans la Suite Dette & Structure du code parce que c'est de
  // la dette qu'il parle — la dette d'un outil qui n'apprend pas. Volontairement PAS un Gardien :
  // il juge une TRAJECTOIRE, et une trajectoire ne se mesure pas à chaque commit (trois passages
  // minimum avant de conclure), donc il a sa place dans un rythme périodique.
  "tool-learning": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",
  // THE-EQUALIZER (2026-09-23) : Membre, jamais Gardien sacré. Il ne remplit AUCUN des deux volets du
  // critère — il ne scanne rien par lui-même (il rassemble ce que les contrôleurs ont déjà dit) et
  // il ne tourne pas à chaque commit (un verdict d'ensemble à chaque commit serait du bruit).
  "the-equalizer": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",
  // Membre, jamais Gardien sacré : il ne scanne aucune qualité de code — il rend l'heure et
  // garde la mémoire des estimations. Le premier volet du critère double n'est pas rempli.
  "agent-du-temps": "Membre premium — (f) 👑 La Gouvernance Royale",
  "agent-des-noms": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",   // Membre et jamais Gardien sacré : son scan ne tourne pas à CHAQUE commit — il répond à un ÉVÉNEMENT, un renommage envisagé
  // integration-outil (2026-09-22) : Membre, jamais Gardien. Il ne scanne pas la qualité du code et
  // ne tourne pas à chaque commit — les deux volets du critère d'appartenance, dont aucun n'est
  // facultatif (Article 20). Il répond à la demande, avant de faire entrer un outil.
  "integration-outil": "Membre premium — (f) 📜 Les Prophètes - Dette & Structure du code",
  // La Cour du Roi
  "ines-official": "Membre premium — (f) ✨ Exceptionnel (page blanche / audit lourd)",
  "the-king": "Membre premium — (f) 👑 La Gouvernance Royale",
  "check-tasks-details": "Membre premium — (f) 👼 Les Anges de la coordination",
  // Suite Orientation (2026-09-22, calibrage explicite de l'utilisateur). Trois membres certifiés
  // n'appartenaient à AUCUNE suite depuis leur certification — un vrai trou trouvé en construisant
  // l'organigramme de CASSANDRA, jamais une décision : ils ressortaient en « catégorie non
  // répertoriée ». Ils forment bien une famille cohérente, distincte de celles qui produisent un
  // constat : ceux qui disent QUOI faire ensuite et AVEC QUOI, jamais ce qu'il faut en penser.
  "circle-tasks": "Membre premium — (f) 👼 Les Anges de la coordination",
  "process-simulation-guardian": "Membre premium — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  "angel-of-ia-process": "Membre premium — (f) 👼 Les Anges de la coordination",
  "data-archangel": "Membre premium — (f) 👼 Les Anges de la coordination",
  "pure-gold-unity": "Membre premium — (f) 👼 Les Anges de la coordination",
  "god-of-all-process": "Membre premium — (f) 👼 Les Anges de la coordination",
  "tool-brain": "Membre premium — (f) 👼 Les Anges de la coordination",
  "find-deep-booster": "Membre premium — (f) 🚀 Les Boosters de Navigation",
  // Les Agents Spéciaux
  "check-level-target": "Membre premium — (f) 👑 La Gouvernance Royale",
  // SEULE famille de ce tableau qui ne soit PAS dérivée d'un registre doc-report : Smart Breaker
  // n'en possède aucun (son domaine est la PRODUCTION, pas un rapport de travail). Rangé ici avec
  // AGENT-DU-TEMPS parce que les deux pilotent une ressource qui s'épuise — proposé par l'agent le
  // 2026-09-25, reste à confirmer par l'utilisateur, à qui revient tout nommage (#754).
  "smart-breaker": "Membre premium — (f) 👑 La Gouvernance Royale",
  // LES 17 QUI REJOIGNENT L'ÉQUIPE (2026-09-26, ses trois décisions sur les 22 Postulants). Ils
  // étaient documentés et lançables depuis des semaines, et absents du seul registre qui dit qui
  // fait partie de l'équipe — une file d'attente que personne ne regardait. Deux rangs, parce que
  // deux situations : ceux dont la valeur est d'APPELER ce que les autres savent (Membre classique,
  // deux obligations), et ceux qui portent un JUGEMENT propre au projet (Membre, poste complet).
  "doc-report": "Membre classique — (f) 👼 Les Anges de la coordination",
  "kpi-report": "Membre classique — (f) 👑 La Gouvernance Royale",
  "tool-usage": "Membre classique — (f) 👑 La Gouvernance Royale",
  "find-brain": "Membre classique — (f) 🚀 Les Boosters de Navigation",
  "le-regisseur": "Membre classique — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  "route-booster": "Membre classique — (f) 🚀 Les Boosters de Navigation",
  criticite: "Membre classique — (f) 👼 Les Anges de la coordination",
  "messages-courts": "Membre classique — (f) 👼 Les Anges de la coordination",
  "modes-de-travail": "Membre classique — (f) 👼 Les Anges de la coordination",
  "ou-on-en-est": "Membre classique — (f) 👼 Les Anges de la coordination",
  "rapport-gros-prompt": "Membre classique — (f) 👼 Les Anges de la coordination",
  "check-spirit": "Membre premium — (f) 🎬 La Suite Tarantino - Simulation & qualité narrative",
  // check-profile GELÉ hors de l'équipe le 2026-09-26, et c'est un doute réel, pas une prudence :
  // son propre en-tête, daté du 2026-09-17, dit que « le mécanisme réel n'existe pas encore dans le
  // code ». Or ce mécanisme existe désormais (62 mentions du dossier dans route.ts). Soit l'outil a
  // suivi et son en-tête est périmé, soit il teste quelque chose qui a changé sous lui. Le promouvoir
  // sans avoir tranché reviendrait à certifier un outil dont on ignore s'il mesure encore. Il reste
  // Postulant — un état de passage avec une marche connue.

  // Redescendu de « Membre » à « Membre classique » le 2026-09-26, sur sa relecture : 110 lignes
  // qui vérifient qu'une fiche a bien sa ligne d'index. C'est un GARDE-FOU MÉCANIQUE, pas un
  // jugement (Article 20bis) — je l'avais promu en bloc avec cinq autres sans les relire un par un.
  "check-profil-utilisateur": "Membre classique — (f) 👼 Les Anges de la coordination",
  "check-suivi-fidelity": "Membre premium — (f) 👼 Les Anges de la coordination",
  "circle-process-guardian": "Membre premium — (f) 👼 Les Anges de la coordination",
  // Même correction, même raison : 137 lignes qui ORCHESTRENT le mode nuit — sa valeur est
  // d'appeler les autres, ce qui est la définition exacte du rang classique.
  "the-ghost": "Membre classique — (f) 👑 La Gouvernance Royale",
};

// sansAccents() (2026-09-23) — une SEULE normalisation, partagée, jamais deux qui divergeraient.
// Née d'un bug en deux moitiés : « MOÏSE-TABLES-DE-LOI » donnait le slug `mo-se-tables-de-loi`
// (le « ï » tombait dans un filtre `[^a-z0-9]`), et corriger la dérivation du slug sans corriger la
// RECHERCHE dans les documents aurait laissé la moitié du défaut en place — la même règle qui
// réapparaît ailleurs sous une autre forme, ce que l'Article 3 interdit. Le projet travaille en
// français : ce n'est pas un cas limite, c'est le cas normal à partir du prochain outil nommé.
export function sansAccents(texte) {
  return String(texte ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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
  // 2026-09-26 : les trois que le garde-fou a réclamés en même temps que leur ligne de table.
  "check-spirit": { nature: "heuristique", pourquoi: "il détecte le vocabulaire de service client, pas la fadeur — un ton plat sans un seul mot interdit passerait au vert, et la lecture humaine reste obligatoire" },
  "check-profile": { nature: "heuristique", pourquoi: "même famille que check-spirit, et gelé depuis le 2026-09-26 : son en-tête dit qu'il teste un mécanisme absent, or il existe" },
  "route-booster": { nature: "heuristique", pourquoi: "il PROPOSE des points de coupe dans un gros fichier, par motifs de texte — jamais un parseur, donc jamais une découpe garantie juste" },
  "le-classificateur": { nature: "mecanique", pourquoi: "un type se constate sur le fichier, un rang se lit dans un registre — aucune interprétation, sauf la liste « Hors Agence » qui est tenue à la main et le dit" },
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
  // LIMITE MESURÉE, PAS SUPPOSÉE (2026-09-24). La recherche 2026 sur les agents de code mesure un
  // taux de « faux succès » de 44 à 52 % — un agent qui déclare avoir réussi alors que non — et
  // montre qu'un JUGE IA échoue systématiquement à le détecter : aucune configuration testée
  // n'atteint un score de détection utile, parce que le juge s'accroche au ton confiant du message
  // de clôture, or un faux succès produit exactement ce ton. La même étude ramène ce taux à 3 %
  // par une vérification INDÉPENDANTE de l'état réel. Conséquence pour cet outil : il reste
  // excellent pour ce qu'il sait faire — un avis argumenté sur la conception et le produit — et il
  // n'est JAMAIS le dernier mot sur « est-ce réellement fait ». Ce mot-là revient au filet de
  // tests et au crochet git, qui mesurent un état plutôt que de lire une prose.
  "the-final-judge": { nature: "heuristique", pourquoi: "un audit par agent séparé est un avis argumenté, jamais un verdict prouvé — et sur la question « est-ce vraiment fait ? » un juge IA est un MAUVAIS détecteur, mesuré comme tel : il se fie au ton confiant de la conclusion, que produit justement un faux succès. Pour cette question-là, croire le filet de tests et le crochet git, jamais ce rapport" },
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
  // THE-EQUALIZER : mécanique par construction — il ne produit aucune estimation propre. Chaque ligne
  // de son verdict est soit une lecture littérale du référentiel, soit un chiffre rendu par un
  // contrôleur qui porte déjà, lui, son propre avertissement s'il en a besoin.

  "abraham-les-references": { nature: "heuristique", pourquoi: "la forme de numérotation d'un document est DÉRIVÉE par essais successifs, le poids en tokens est estimé, et une règle dont le mécanisme est décrit en prose sans être nommé compte comme sans porteur — il sous-déclare plutôt qu'il n'invente, et refuse de découper un document dont aucune forme ne ressort" },
  "moise-tables-de-loi": { nature: "heuristique", pourquoi: "le poids en tokens est estimé, la nature d'un Article est PROPOSÉE depuis des signaux mécaniques, et un porteur décrit en prose sans être nommé compte comme absent — elle sous-déclare plutôt qu'elle n'invente, mais ne remplace jamais une lecture" },
  "the-equalizer": { nature: "mecanique", pourquoi: "il n'estime rien : il relit le référentiel des standards et relaie des verdicts déjà calculés ailleurs" },
  "agent-des-noms": { nature: "heuristique", pourquoi: "la NATURE d'une occurrence est déduite de son emplacement et de la forme de sa ligne — un motif, jamais un parseur : une prose vivante rangée dans un dossier d'archives sera classée historique, et c'est le sens sûr de l'erreur, celui qui laisse une mention périmée plutôt que de réécrire une archive" },
  "agent-du-temps": { nature: "heuristique", pourquoi: "l'heure elle-même est un fait, mais sa SOURCE ne l'est pas : quand le réseau est refusé il rend l'horloge locale, invérifiable depuis le conteneur — et un facteur d'ajustement calculé sur trois mesures reste une tendance, jamais une loi" },
  "tool-learning": { nature: "heuristique", pourquoi: "il juge une trajectoire : sous trois passages il refuse de conclure, et une baisse de trouvailles peut venir d'un code qui s'est amélioré plutôt que d'un outil qui régresse" },
  "cassandra-rh": { nature: "heuristique", pourquoi: "relaie et recoupe ce que les autres outils estiment — elle hérite de leurs approximations" },
  ecotoken: { nature: "heuristique", pourquoi: "le poids en tokens est estimé et le rangement d'un bloc se devine — un bloc qui cite un fichier n'y appartient pas forcément" },

  // ————————————————————————————————————————————————————————————————————————
  // LES 22 ABSENTS, INSCRITS LE 2026-09-25 (tâche #653 → #808)
  // ————————————————————————————————————————————————————————————————————————
  //
  // CE QUE LA MESURE A RÉELLEMENT DIT, et ce n'était pas ce que le constat d'origine annonçait :
  // ZÉRO outil déclaré heuristique ne restait muet — les 24 disaient bien leur marge. Le constat
  // « 21 outils n'appellent jamais printReliabilityNotice() » était un artefact de sonde : il
  // ignorait que `report-template.mjs` relaie l'avertissement pour qui passe par lui.
  //
  // LE VRAI TROU ÉTAIT AILLEURS ET PLUS SILENCIEUX : 17 SCRIPTS D'OUTIL n'étaient rattachés à
  // AUCUNE entrée de ce registre. Pour eux `reliabilityNotice()` rendait `null` — ni avertissement,
  // ni signal qu'il en manquait un.
  //
  // TROISIÈME ERREUR, LA PLUS INSTRUCTIVE, ET ELLE EST GARDÉE ICI PARCE QU'ELLE A FAILLI PASSER :
  // la première correction a inscrit 22 entrées en dérivant la clé du NOM DE FICHIER. Or ce
  // registre est indexé par SLUG D'OUTIL, et `RELIABILITY_SCRIPT_FILES` fait le pont slug→script.
  // Cinq des 22 étaient donc des DOUBLONS d'outils déjà inscrits sous leur vrai nom — `check-argus`
  // pour ARGUS, `check-harmonia` pour HARMONIA, `route-booster` pour find-deep-booster,
  // `the-screener-capture` pour THE-SCREENER, `check-gemini-quota` pour Smart Breaker. Deux
  // entrées pour un seul outil, c'est exactement la divergence silencieuse que l'Article 24
  // interdit : elles auraient fini par ne plus dire la même chose. Les cinq ont été retirées, et
  // le détecteur part désormais du SCRIPT en résolvant par la table de correspondance — jamais
  // d'une seconde règle de nommage.
  //
  // LA RÈGLE D'ARBITRAGE, ÉCRITE PARCE QU'ELLE A ÉTÉ APPLIQUÉE 22 FOIS : en cas de doute,
  // HEURISTIQUE. Un avertissement de trop se lit et s'ignore ; un avertissement manquant transforme
  // une estimation en certitude. « Mécanique » est réservé à un outil qui rapporte un FAIT qu'il a
  // lu, sans aucune inférence entre la lecture et la phrase rendue.
  "check-profil-utilisateur": { nature: "heuristique", pourquoi: "il déduit une habitude de travail d'un comptage de traces — une habitude réelle qui ne laisse pas de trace lui échappe entièrement" },
  "check-suivi-fidelity": { nature: "heuristique", pourquoi: "il confronte le texte d'une clôture à ce que le dépôt montre : une correspondance de mots, jamais une preuve que la tâche a vraiment été faite" },
  "circle-process-guardian": { nature: "heuristique", pourquoi: "il ne voit d'une étape que la trace qu'elle laisse sur le disque, et une sonde cassée rend exactement ce que rend une étape non faite — c'est l'erreur qu'il a lui-même commise sur trois de ses propres sondes" },
  "kpi-report": { nature: "heuristique", pourquoi: "ses scores sont des moyennes de composantes elles-mêmes estimées, et une famille non mesurée sort du calcul plutôt que d'y peser — le chiffre est une tendance, jamais une note" },
  "le-regisseur": { nature: "heuristique", pourquoi: "il orchestre des étapes et relaie ce que chacune rend : il hérite de l'approximation de tout ce qu'il appelle, sans jamais pouvoir la corriger" },
  "ou-on-en-est": { nature: "heuristique", pourquoi: "il résume un chemin parcouru à partir de lignes de suivi écrites à la main — ce que le suivi dit du projet, jamais ce qui a réellement été fait" },
  "rapport-gros-prompt": { nature: "heuristique", pourquoi: "il découpe une demande longue en points par des marqueurs de texte : une demande formulée sans marqueur ressort en un seul bloc" },
  "summarize-simulation-log": { nature: "heuristique", pourquoi: "il reconstitue des événements depuis un journal brut dont il connaît deux formes : d'une troisième forme il ne tirerait rien, et un zéro d'événements se lirait comme une simulation calme" },
  "the-ghost": { nature: "heuristique", pourquoi: "il cherche ce qui manque, et une absence se déduit toujours de ce qu'on a pensé à chercher" },
  // Les huit suivants rapportent un FAIT qu'ils ont lu, sans inférence entre la lecture et la
  // phrase rendue. Un avertissement chez eux serait creux, et un avertissement creux use l'alerte
  // partout ailleurs — c'est la raison même pour laquelle `reliabilityNotice()` rend `null` sur un
  // outil mécanique plutôt qu'une phrase polie.
  criticite: { nature: "mécanique", pourquoi: "une échelle de paliers fixe : il range, il n'estime rien" },
  "messages-courts": { nature: "mécanique", pourquoi: "il rend un texte déjà écrit, sans jugement" },
  "modes-de-travail": { nature: "mécanique", pourquoi: "il rapporte le mode déclaré, tel qu'il est stocké" },
  "sites-env": { nature: "mécanique", pourquoi: "il liste la configuration réellement présente, sans l'interpréter" },
  "tool-usage": { nature: "mécanique", pourquoi: "un compteur d'événements enregistrés : il compte ce qui a été écrit, ni plus ni moins" },
  "run-framework": { nature: "mécanique", pourquoi: "il lance le serveur et rapporte ce que le processus a dit" },
  "run-simulation": { nature: "mécanique", pourquoi: "il exécute une simulation et rapporte ce qui s'est passé — le JUGEMENT sur la simulation appartient à EL-PROFESSOR, qui porte son propre avertissement" },
  "sauvegarde-projet": { nature: "mécanique", pourquoi: "il archive des fichiers réels et dit lesquels — une opération, pas une mesure" },
};

// LE VOCABULAIRE DE `nature` EST FERMÉ, ET CE GARDE-FOU EXISTE POUR UNE RAISON PRÉCISE : la seule
// valeur qui DÉCLENCHE un avertissement est exactement « heuristique ». Toute faute de frappe
// (« heuristque », « heuristic ») ferait donc silencieusement passer un outil estimatif pour un
// outil mécanique — un faux vert invisible, du type le plus dangereux de ce paysage. Le registre
// porte d'ailleurs déjà les deux orthographes de l'autre valeur (« mecanique » et « mécanique »),
// tolérées ici parce qu'aucune des deux ne déclenche quoi que ce soit ; l'une d'elles mal tapée ne
// change rien, alors qu'une « heuristique » mal tapée change tout.
export const NATURES_DE_FIABILITE = ["heuristique", "mecanique", "mécanique"];
export function findNaturesInvalides(registre = TOOL_RELIABILITY, natures = NATURES_DE_FIABILITE) {
  return Object.entries(registre)
    .filter(([, e]) => !natures.includes(String(e?.nature ?? "")))
    .map(([slug, e]) => ({ slug, nature: e?.nature ?? null,
      pourquoi: `« ${e?.nature} » n'est pas une nature connue : seul « heuristique » déclenche un avertissement, donc toute autre valeur rend cet outil silencieux sans que rien ne le signale` }));
}

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

// ————————————————————————————————————————————————————————————————————————
// LE BALAYAGE DES SCRIPTS D'UN REGISTRE (2026-09-23, chantier 13)
// ————————————————————————————————————————————————————————————————————————
//
// SORTI DE DEUX COPIES LITTÉRALES, signalées par CLONE-HUNTER comme sa plus grosse duplication
// (12 lignes × 2 outils) : `flagFindBoosterCandidates()` (doc-report) et
// `flagFindDeepBoosterCandidates()` (find-brain). Le parcours était identique au caractère près ;
// seuls les CHAMPS retenus au bout différaient, et cette différence-là est légitime — les deux
// outils mesurent réellement des choses différentes (poids en tokens contre points de coupe), et
// les forcer dans un même vocabulaire pour paraître uniformes aurait été pire que la duplication.
//
// D'OÙ LA FORME : le parcours est partagé, l'extraction reste à l'appelant. C'est la seule façon de
// factoriser sans effacer une distinction que les deux outils avaient raison de faire.
//
// POURQUOI ICI, et pas chez l'un des deux : `find-brain` importe déjà `REGISTRIES` de `doc-report`,
// donc l'inverse créerait un cycle d'imports. Ce fichier-ci est l'infrastructure partagée, il
// n'importe rien du paysage — c'est exactement le rôle pour lequel il existe.
//
// LES DEUX SILENCES SONT VOLONTAIRES, et ils viennent du code d'origine : un script sans chemin ou
// déjà vu est sauté (jamais compté deux fois), et un script introuvable est sauté AUSSI — une
// absence honnête plutôt qu'un faux candidat fabriqué à partir d'une erreur de lecture.
export function balayerScriptsDesRegistres(registries = [], recommendImpl, extraire, { root = "." } = {}) {
  const seen = new Set();
  const candidates = [];
  for (const r of registries) {
    if (!r.scriptPath || seen.has(r.scriptPath)) continue;
    seen.add(r.scriptPath);
    let verdict;
    try {
      verdict = recommendImpl(join(root, r.scriptPath));
    } catch {
      continue; // absence honnête : script introuvable, jamais un faux positif fabriqué.
    }
    if (verdict?.worthwhile) candidates.push({ label: r.label, scriptPath: r.scriptPath, ...extraire(verdict) });
  }
  return candidates;
}

// ————————————————————————————————————————————————————————————————————————
// DEUX MÉCANIQUES DE LECTURE DE DOCUMENT, PARTAGÉES (2026-09-23, chantier 13)
// ————————————————————————————————————————————————————————————————————————
//
// SORTIES DE DEUX COPIES CROISÉES entre SMART-CONSO-TOKEN et THE-KING, signalées par CLONE-HUNTER.
// Les deux outils lisent un document normatif différent (la charte pour l'un, le texte fondateur
// pour l'autre) et en tirent des conclusions sans rapport — mais ils le DÉCOUPENT de la même façon
// et comparent leurs unités de la même façon. Ce sont ces deux mécaniques-là qui sont partagées,
// jamais les jugements qu'elles nourrissent.

// decouperEnUnites() — découpe un document en unités délimitées par un motif de titre, chaque unité
// s'arrêtant au PLUS PROCHE de deux bornes : le titre suivant de même niveau, ou le prochain titre
// de niveau supérieur. Cette seconde borne est la partie subtile, et elle est indispensable : sans
// elle, la dernière unité d'une section avalerait tout le reste du document.
export function decouperEnUnites(texte, motifUnite, { motifBorneSuperieure = /^## /gm, champs = () => ({}) } = {}) {
  const source = String(texte ?? "");
  const unites = [...source.matchAll(motifUnite)];
  const bornes = [...source.matchAll(motifBorneSuperieure)].map((m) => m.index ?? source.length);
  return unites.map((m, i) => {
    const start = m.index ?? 0;
    const suivante = i + 1 < unites.length ? (unites[i + 1].index ?? source.length) : source.length;
    const borne = bornes.find((h) => h > start) ?? source.length;
    return { ...champs(m), texte: source.slice(start, Math.min(suivante, borne)).trim() };
  });
}

// pairesParJaccard() — compare toutes les paires d'ensembles de mots et rend celles qui dépassent un
// seuil de similarité de Jaccard.
//
// POURQUOI JACCARD ET PAS UN COMPTE DE MOTS PARTAGÉS, raison reprise du code d'origine : un simple
// compte favoriserait les textes les plus longs, qui partagent mécaniquement plus de mots avec tout
// le monde. Le rapport intersection/union corrige exactement ce biais.
//
// CE QU'ELLE NE FAIT PAS : conclure. Deux appelants tirent des conclusions opposées du même chiffre
// — l'un y voit une redondance à alléger, l'autre le TERRAIN COMMUN sur lequel chercher une tension.
// Le seuil et la suite restent donc entièrement à l'appelant.
export function pairesParJaccard(ensembles = [], { seuil = 0.22 } = {}) {
  const paires = [];
  for (let i = 0; i < ensembles.length; i++) {
    for (let j = i + 1; j < ensembles.length; j++) {
      const a = ensembles[i], b = ensembles[j];
      if (!a?.size || !b?.size) continue;
      const intersection = [...a].filter((w) => b.has(w)).length;
      const union = new Set([...a, ...b]).size;
      const jaccard = union ? intersection / union : 0;
      if (jaccard >= seuil) paires.push({ i, j, jaccard, motsPartages: intersection });
    }
  }
  return paires;
}
