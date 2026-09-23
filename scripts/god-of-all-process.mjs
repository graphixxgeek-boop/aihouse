// GOD-OF-ALL-PROCESS (2026-09-22, demande explicite de l'utilisateur : « je veux un outil qui
// centralise les process : quel est l'interet d'un tel script : trouve comment l'amleiorer »).
//
// CE QU'IL EST, tranché avec l'utilisateur le jour même : **le tool-brain des process**. Avant de
// commencer un gros travail, une seule question — « qu'est-ce qui gouverne ça ? » — et il répond
// quel process s'applique, à quelle étape on en est, et ce qui a été sauté. Même réflexe unique que
// tool-brain pour les outils : jamais un choix recomposé à la main entre trois documents.
//
// POURQUOI IL EXISTE, et ce n'est pas théorique — les quatre risques sont tous déjà arrivés :
//   1. Un process écrit quelque part que plus personne ne surveille. La règle « la phase 2 d'une
//      simulation doit contenir de vrais tours autonomes » a été perdue entre full_sim16 et
//      full_sim18 parce qu'elle ne vivait que dans une conclusion de tâche.
//   2. Un gardien qui existe mais qu'on ne lance jamais — exactement ce qui est arrivé à Doc-Report,
//      qui se comptait lui-même comme « jamais sollicité ».
//   3. Deux process qui se contredisent (le nocturne dit « pousse au fil de l'eau », le protocole de
//      simulation dit « demande avant toute action coûteuse »).
//   4. Une étape oubliée parce qu'on se croit arrivé — l'archivage après une simulation.
//
// AUTORITÉ, tranchée le même jour : **il signale, l'utilisateur décide.** Jamais de correction
// automatique, jamais de commit bloqué — même règle que tout le reste de ce paysage.
//
// AVANCEMENT : il ne tient AUCUN compteur. Il déduit ce qui a eu lieu des traces réelles laissées
// sur le disque (le transcript est-il archivé ? la note existe-t-elle ?). Un compteur se
// désynchronise et devient à son tour un mensonge à surveiller ; une trace, non. Limite honnête, et
// elle est dite : il ne voit que les étapes qui laissent un fichier derrière elles, et le déclare
// pour chaque étape qui n'en laisse pas, plutôt que de la compter faite ou non faite au hasard.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReliabilityNotice, sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
// LE RELAIS D'ANGEL, RENDU RÉEL (2026-09-23). Il existait depuis le 2026-09-22 comme un PARAMÈTRE
// (`sectionAngel`) que god attendait qu'on lui tende — et personne ne le lui tendait jamais :
// `grep sectionAngel` ne trouvait aucun appelant. L'Article 26 promet « une seule voix, jamais une
// par contrôleur », mais god ne récupérait pas cette voix, il attendait qu'on la lui apporte.
//
// C'EST LA RÉPONSE À « POURQUOI ANGEL N'EST-IL JAMAIS UTILISÉ ? » (question de l'utilisateur à la
// Ronde du 2026-09-23, avec son verdict : « c'est un vrai reproche je pense »). Il avait raison sur
// le reproche, et la cause n'était pas mon oubli répété : le relais n'était pas câblé. Un paramètre
// optionnel qui n'est jamais fourni ne produit aucune erreur — il produit simplement un rapport
// silencieusement amputé de sa moitié conduite.
import { auditWorkingRules, angelSectionLines } from "./angel-of-ia-process.mjs";
import { recordFunctionUsage } from "./tool-usage.mjs";
import { readAgentSession, SESSION_FILE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LE REGISTRE DES PROCESS. Chaque entrée déclare où le process est ÉCRIT, qui le SURVEILLE, et
// quelles traces réelles prouvent qu'une étape a eu lieu. Les chemins sont vérifiés à l'exécution
// (findProcessesWithoutGuardian/findProcessDocsMissing ci-dessous) : une entrée qui pointe vers un
// fichier disparu se voit, jamais une promesse tenue à la main (Article 24).
export const PROCESSES = [
  {
    slug: "ronde",
    nom: "Ronde périodique (CIRCLE-TASKS)",
    quand: "les tâches gratuites périodiques qu'on oublie facilement",
    motsCles: ["ronde", "circle", "périodique", "tâches gratuites", "hebdo"],
    doc: "docs/circle-process-detail.txt",
    gardien: "scripts/circle-process-guardian.mjs",
    etapes: [
      { cle: "questionnaire", libelle: "poser la fenêtre à cocher (AUTO/PRIME/GOAT)", preuve: null },
      { cle: "execution", libelle: "exécuter les items cochés", preuve: { dossier: "docs/", motif: /circle-signal-/, recursif: true } },
      { cle: "rapport", libelle: "produire le rapport de fin de Ronde", preuve: { fichier: ".circle-tasks-run-summary-latest.txt" } },
      // AJOUTÉE (2026-09-22) : la voix de l'utilisateur dans sa propre évaluation, et sa place est
      // calibrée — APRÈS le récapitulatif (il répond en ayant vu les constats) et AVANT
      // l'enregistrement (la Ronde n'est pas finie tant qu'il n'a pas répondu, donc l'étape ne peut
      // pas se sauter par oubli). Une étape placée après la clôture serait facultative en pratique.
      // Le trou qu'elle ferme, dans ses mots : « pour que ma voix ait un retour dans la mecanique
      // d'evaluation ». L'évaluation était à sens unique — je jugeais, il lisait.
      { cle: "voix-utilisateur", libelle: "poser la fenêtre de réponses sur les points problématiques de son évaluation, avant de clore", preuve: { fichier: "docs/angel-of-ia-process/reponses-evaluation.md" } },
      // AJOUTÉE (2026-09-23) : alimenter un outil est un geste qui se compte, et le moment opportun
      // est l'écriture elle-même — jamais un rappel à l'agent (cf. Partie 14 du document de process).
      // LES TROIS MAILLONS MANQUANTS (2026-09-23), trouvés en vérifiant le schéma de référence avec
      // l'utilisateur. Ce process s'arrêtait à « enregistrement » : il surveillait le déroulé
      // mécanique de la Ronde et laissait échapper ce à quoi ce déroulé SERT. La moitié de la
      // chaîne que l'Article 28 déclare non négociable n'était donc vérifiée par personne.
      { cle: "analyse", libelle: "trier les constats des rapports — jamais un récapitulatif, un tri", preuve: { dossier: "docs/circle-tasks/", motif: /ANALYSE\.md$/, recursif: true } },
      { cle: "plan-action", libelle: "donner à chaque constat son état : retenu / écarté avec sa raison / à trancher (le plan vit DANS l'analyse, jamais ailleurs)", preuve: { dossier: "docs/circle-tasks/", motif: /ANALYSE\.md$/, recursif: true } },
      { cle: "taches", libelle: "inscrire dans docs/suivi/ les tâches issues des constats retenus", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      { cle: "contributions", libelle: "chaque signal écrit dans le registre d'un outil enregistre la contribution (recordCircleItemReport → recordToolContribution)", preuve: { fichier: ".tool-usage-history.json" } },
      { cle: "enregistrement", libelle: "enregistrer la Ronde comme faite", preuve: { fichier: ".circle-tasks-last-run.json" } },
    ],
  },
  {
    // AJOUTÉ le 2026-09-23 (tâche #613). Ce process est l'un des rares à porter les six maillons du
    // schéma unifié sans qu'aucun soit sans objet — c'est normal : une analyse de la charte EST une
    // enquête, là où une intégration d'outil est une liste de cases à cocher.
    slug: "analyse-charte",
    nom: "Analyse et plan d'action de la charte (MOÏSE-TABLES-DE-LOI)",
    quand: "analyser la charte du projet en profondeur et en tirer un plan d'action",
    motsCles: ["claude.md", "charte", "cartographie", "allègement", "article", "obligation", "moïse", "moise"],
    doc: "docs/analyse-charte-process-detail.md",
    gardien: "scripts/moise-tables-de-loi.mjs",
    etapes: [
      { cle: "memoire", libelle: "relire la mémoire des opérations avant de mesurer quoi que ce soit", preuve: { fichier: "docs/referentiel/charte-operations.md" } },
      { cle: "fraicheur", libelle: "vérifier que l'instrument n'est pas périmé AVANT de mesurer avec lui", preuve: null },
      { cle: "cartographie", libelle: "régénérer la cartographie (poids, citations, porteur, nature)", preuve: { fichier: "docs/referentiel/charte-cartographie.md" } },
      { cle: "table-regles", libelle: "régénérer la table de classification", preuve: { fichier: "docs/referentiel/claude-md-regles.md" } },
      { cle: "accueil", libelle: "vérifier chaque document d'accueil avant de proposer un renvoi", preuve: null },
      // AJOUTÉE le 2026-09-23, sur une consigne explicite de l'utilisateur posée dans la même
      // phrase que la question qui a créé l'analyse de pertinence : « sur ce type de choix,
      // toujours me consulter, process ». L'étape ne dit pas « décider si un Article reste » — elle
      // dit « porter la question ». La nuance est le mécanisme : un process qui autoriserait à
      // conclure laisserait un jour appliquer un retrait que personne n'a validé.
      { cle: "pertinence", libelle: "passer les signaux de pertinence et de logique, et porter chacun à l'utilisateur comme une QUESTION", preuve: null },
      { cle: "analyse", libelle: "l'analyse elle-même — produite par l'agent, jamais par l'outil", preuve: null },
      { cle: "plan-action", libelle: "le plan d'action, chaque constat portant son état (Article 28)", preuve: null },
      { cle: "questions", libelle: "poser les questions de calibrage en fenêtre dédiée avant toute application (Article 16)", preuve: null },
      // Maillon TÂCHES — il manquait à la première écriture de ce process, et c'est le garde-fou de
      // la chaîne de l'Article 28 qui l'a refusé au commit, pas une relecture. Sans lui, le plan
      // d'action aurait pu vivre et mourir dans le rapport : « le rapport a coûté son temps et n'a
      // rien changé », dans les mots exacts du contrôleur.
      { cle: "taches", libelle: "inscrire dans docs/suivi/ les tâches issues des constats retenus", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      { cle: "synthese", libelle: "livrer la vision stratégique à l'utilisateur, jamais le dossier technique", preuve: null },
      { cle: "enregistrement", libelle: "enregistrer chaque geste appliqué, Article par Article", preuve: { fichier: "docs/referentiel/charte-operations.md" } },
    ],
  },
  {
    slug: "simulation",
    nom: "Simulation intégrale (Article 18)",
    quand: "lancer une simulation complète de bout en bout et l'analyser",
    motsCles: ["simulation", "simu", "full_sim", "article 18", "transcript", "dossier retourné"],
    doc: "docs/regles-de-travail.md",
    // Ce fichier est aussi la référence maîtresse du paysage entier : sans cette section, tout
    // mécanisme qu'il nomme au passage comptait comme une règle de la simulation.
    docSection: "## 6bis. Protocole de simulation complète (Article 18 de CLAUDE.md)",
    gardien: "scripts/process-simulation-guardian.mjs",
    // ÉTAPES RÉVISÉES AVEC L'UTILISATEUR le 2026-09-22, sur le fichier qu'il a annoté. Chaque
    // changement porte sa raison ; aucune n'est une initiative de l'agent.
    etapes: [
      // SONDE CORRIGÉE — bug confirmé sur pièces le 2026-09-22 (« vérifie en profondeur cette
      // partie »). L'ancienne cherchait dans docs/smart-conso-api/, qui ne contient QUE des
      // signaux de Ronde écrits par CIRCLE-TASKS : une simulation pouvait consulter correctement
      // sans que la sonde voie rien, et une Ronde la faisait passer au vert sans qu'aucune
      // simulation n'ait eu lieu. Smart Conso API enregistre ses vraies consultations dans
      // .smart-conso-session.json — le journal existait, la sonde regardait ailleurs.
      { cle: "conso", libelle: "consulter Smart Conso API avant de brûler du quota", preuve: { fichier: ".smart-conso-session.json" } },
      // AJOUTÉE à la demande de l'utilisateur : « rédaction du script de simulation : doit être
      // normé, à calibrer finement ». Sous-process à part entière, parce que c'est là que se
      // décide la crédibilité de toute la simulation — notamment la partie où l'agent se fait
      // passer pour un visiteur, qui doit tenir la route (une version passée répétait les mêmes
      // phrases aux deux personnages, ce qui se voit immédiatement à la lecture).
      // MÊME RESSERREMENT, MÊME JOUR, MÊME RAISON (2026-09-23). C'était la SECONDE étape du
      // paysage prouvée par son propre index : le dossier ne contenait que `index.md`, et le motif
      // `/\.md$|\.mjs$/` l'acceptait. L'enquête de la veille avait trouvé les deux cas ensemble ;
      // les corriger séparément aurait laissé la moitié du trou ouvert.
      //
      // L'EXCLUSION EST FORMULÉE EN RÈGLE, JAMAIS EN LISTE (Article 24) : « tout fichier qui n'est
      // pas l'index ». Une fiche de script future y entre sans qu'on touche à ce motif, et aucun
      // nom n'a besoin d'être recopié quelque part.
      { cle: "script", libelle: "rédiger le script de simulation selon la norme (sous-process dédié)", preuve: { dossier: "docs/simulations/scripts/", motif: /^(?!index\.md$).+\.(md|mjs)$/ } },
      // LES QUATRE ÉTAPES QUI NE LAISSAIENT AUCUNE TRACE — solution demandée par l'utilisateur
      // (« trouve une solution »), et elle n'est ni un contournement ni une promesse.
      //
      // Le constat de départ : lancer, livrer, sonder et calibrer se passent DANS LA CONVERSATION.
      // Aucun fichier ne s'écrit, donc aucune sonde ne peut rien voir, donc la moitié du process
      // reposait sur ma parole. Deux mauvaises réponses étaient tentantes : supprimer ces étapes
      // (elles comptent parmi les plus importantes), ou les déclarer vérifiées sans l'être.
      //
      // La bonne : leur DONNER une trace, au lieu d'en chercher une qui n'existe pas. Chaque
      // simulation écrit désormais son JOURNAL DE BORD (`<nom>_journal-de-bord.md`), où ces quatre
      // moments laissent une ligne datée : le commit du serveur au lancement, le fait que le
      // transcript a été livré et le profil diagnostiqué, les trois réponses au sondage, les
      // questions de calibrage posées.
      //
      // Ce que ça change vraiment : ce n'est toujours pas une preuve que le geste a été BIEN fait
      // — c'est une preuve qu'il a été fait, datée, et relisible des mois plus tard par un autre
      // agent (Article 27). C'est exactement le saut qu'on demande partout ailleurs : passer d'une
      // absence de mesure à une mesure imparfaite mais réelle.
      { cle: "lancement", libelle: "lancer contre un serveur à jour", preuve: { dossier: "docs/simulations/", motif: /_journal-de-bord\.md$/ } },
      // ÉTENDUE : le diagnostic du profil de l'utilisateur rejoint la livraison.
      { cle: "livraison", libelle: "livrer le transcript en fichier joint + le diagnostic du profil de l'utilisateur", preuve: { dossier: "docs/simulations/", motif: /_journal-de-bord\.md$/ } },
      { cle: "archivage", libelle: "archiver transcript + dossier + résumé d'actions", preuve: { dossier: "docs/simulations/", motif: /_transcript\.txt$/ } },
      { cle: "note", libelle: "noter la fidélité à la charte (EL-PROFESSOR)", preuve: { dossier: "docs/el-professor/", motif: /^full_sim\d+\.md$/ } },
      // UNE ÉTAPE PAR AGENT QUI PRODUIT UN RAPPORT (demande de l'utilisateur : « il faut une étape
      // pour chaque agent qui va écrire un rapport »). Les quatre ci-dessous étaient capables de
      // juger une simulation et n'étaient jamais sollicités — une heure de quota dont la matière
      // était payée puis jetée.
      { cle: "rendu", libelle: "noter la qualité visuelle réelle (THE-SCREENER)", preuve: { dossier: "docs/the-screener/", motif: /\.md$|\.txt$/ } },
      // MOTIF RESSERRÉ LE 2026-09-23 (correction « C » de l'enquête memory-audit). Il valait
      // `/\.md$/`, donc l'index d'inauguration du dossier — le SEUL fichier qu'il ait jamais
      // contenu — satisfaisait la preuve. L'étape passait pour tracée depuis la création du
      // registre, sans qu'un seul contrôle de mémoire ait jamais eu lieu. Le registre était
      // honnête, ce contrôleur était honnête : c'est leur COMBINAISON qui mentait, et aucune
      // relecture de l'un ou de l'autre ne pouvait le voir (leçon L13).
      //
      // Le motif exige maintenant un fichier de CONSTAT daté, celui qu'écrit ecrireConstatMemoire()
      // à la fin d'une vraie partie. Un index ne peut pas le contrefaire, et un dossier vide ne
      // peut plus rien prouver.
      { cle: "memoire", libelle: "contrôler la mémoire narrative persistée après la partie (memory-audit)", preuve: { dossier: "docs/memory-audit/", motif: /^constat-.+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.md$/ } },
      { cle: "poids", libelle: "relire le poids réel du contexte envoyé à Gemini (memento weight)", preuve: { fichier: ".memento-history.json" } },
      { cle: "cout-reel", libelle: "confronter le coût RÉEL à l'estimation d'avant lancement (Smart Conso API)", preuve: { fichier: ".smart-conso-session.json" } },
      { cle: "index", libelle: "écrire les deux lignes de jugement (simulations + KPI)", preuve: { fichier: "docs/simulations/index.md" } },
      // SONDAGE EN 3 QUESTIONS — écrit noir sur blanc dans l'Article 18 et absent du process
      // jusqu'ici. Sa trace : la fenêtre de questions laisse une réponse, donc l'étape suivante
      // (le calibrage) ne peut pas être franchie honnêtement sans lui.
      // AJOUTÉE (2026-09-22) : l'exigence que l'utilisateur a placée en dernier en validant les
      // rapports individuels des agents, et la plus facile à laisser tomber — « que tu dois lire
      // avant de produire ton analyse, avec les autres rapports dispos ». Sans cette étape, sept
      // rapports peuvent exister sur le disque pendant que l'analyse s'écrit de mémoire, et tout le
      // dispositif ne sert qu'à produire des fichiers que personne n'ouvre. La preuve disque ne
      // prouve que l'EXISTENCE des rapports ; que l'agent les ait lus se déclare et se vérifie par
      // checkReportsReadBeforeAnalysis() (process-simulation-guardian), jamais par supposition.
      { cle: "lecture-rapports", libelle: "lire les rapports individuels des agents AVANT d'écrire l'analyse, jamais après", preuve: { dossier: "docs/simulations/", motif: /_(the-screener|memory-audit|memento-weight|cout-reel)\.txt$/ } },
      { cle: "sondage", libelle: "poser le sondage en 3 questions juste après la livraison, avant toute analyse détaillée", preuve: { dossier: "docs/simulations/", motif: /_journal-de-bord\.md$/ } },
      { cle: "calibrage", libelle: "poser les questions de calibrage avant toute correction", preuve: { dossier: "docs/simulations/", motif: /_journal-de-bord\.md$/ } },
      // LA CHAÎNE DE L'ARTICLE 28, appliquée à la simulation : chaque rapport produit ci-dessus
      // doit porter son plan d'action, et chaque constat retenu sa tâche. C'est ce qui transforme
      // une heure de quota en travail, plutôt qu'en documents qu'on archive.
      { cle: "chaine", libelle: "chaque rapport porte son plan d'action, et chaque constat retenu sa tâche (Article 28)", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
    ],
  },
  {
    // NEUVIÈME PROCESS DÉCLARÉ (2026-09-23). Il tient dans une phrase de l'utilisateur : « c'est
    // comme le mode autonome, sauf que je suis present et je peux repondre aux questions ». Ce qui
    // l'a rendu nécessaire : le projet ne savait exprimer que « présent » OU « non bloquant », par
    // un seul booléen qui confondait les deux. Détail complet : docs/mode-semi-autonome-process-detail.md.
    slug: "semi-autonome",
    // LES QUATRE MAILLONS SANS OBJET, et leur raison est la même : un MODE n'est pas une activité
    // qui produit des constats, c'est une manière de conduire les activités des autres. Les trois
    // maillons de la chaîne de l'Article 28 (rapport → analyse → plan d'action) sont portés par
    // CHAQUE tâche enchaînée, jamais par le mode qui les enchaîne — un rapport « sur le mode »
    // serait un rapport sur rien. Le déclarer ici plutôt que de le laisser manquer, c'est
    // exactement ce que le schéma unifié exige : porter le maillon, ou écrire pourquoi il n'a pas
    // d'objet. Jamais le troisième choix, qui est de le laisser vide en espérant que ça passe.
    maillonsSansObjet: {
      scan: "ce process ne mesure rien de son côté : il ORCHESTRE le travail sur d'autres process, comme son voisin nocturne",
      rapports: "un mode ne produit aucun rapport propre — chaque tâche enchaînée produit le sien, et l'Article 29 exige déjà un compte rendu par tâche",
      analyse: "rien à trier ici : les constats appartiennent au process réellement exécuté, jamais à la manière dont on l'exécute",
      "plan-action": "un mode ne fait aucun constat, donc n'a rien à retenir ni à écarter — le plan d'action vit dans le rapport de chaque tâche enchaînée (Article 28)",
    },
    nom: "mode semi-autonome — travailler seul pendant que l'utilisateur est là",
    quand: "l'utilisateur est présent mais pas devant l'écran : il répondra, plus tard",
    motsCles: ["semi-autonome", "semi autonome", "tu peux enchainer", "je suis là mais", "sans t'arrêter"],
    doc: "docs/mode-semi-autonome-process-detail.md",
    gardien: "scripts/god-of-all-process.mjs",
    etapes: [
      { cle: "mode-declare", libelle: "déclarer le mode sur disque plutôt que le supposer (node scripts/modes-de-travail.mjs semi-autonome)", preuve: { fichier: ".mode-de-travail.json" } },
      { cle: "file-reelle", libelle: "travailler sur une file de tâches tirée du suivi durable, jamais d'une liste improvisée", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      // LES TROIS QUI N'ONT AUCUNE PREUVE POSSIBLE, et le dire est la seule honnêteté disponible :
      // elles ne se jouent que dans la conversation. angel-of-ia-process les DEMANDE et refuse
      // d'être au vert sans réponse — même patron que l'Article 29.
      { cle: "sans-arret", libelle: "enchaîner sans s'arrêter : un message court, une question ou une remarque ne sont JAMAIS une demande d'arrêt", preuve: null },
      { cle: "fenetre-dediee", libelle: "toute question passe par une fenêtre dédiée, jamais une phrase interrogative en texte libre", preuve: null },
      { cle: "question-non-bloquante", libelle: "une question posée ne bloque rien : prendre une tâche de réserve plutôt qu'attendre ou décider à sa place", preuve: null },
    ],
  },
  {
    slug: "nuit",
    maillonsSansObjet: {
      scan: "la nuit ORCHESTRE d'autres process (Ronde, simulation) qui scannent eux-mêmes — elle n'a pas de mesure propre",
      questions: "personne n'est là pour répondre : la borne posée par l'utilisateur (« aucune fenêtre ne doit être bloquante pour le mode autonome ») l'interdit, et les points sont reportés au prochain passage en sa présence",
    },
    nom: "mode-auto-process-guardian — travail autonome (mode nocturne)",
    quand: "travailler seul pendant l'absence de l'utilisateur",
    motsCles: ["autonome", "nuit", "nocturne", "pendant que je dors", "seul"],
    doc: "docs/mode-auto-process-guardian.md",
    gardien: "scripts/god-of-all-process.mjs",
    etapes: [
      { cle: "identite", libelle: "déposer l'identité de session (version de Claude)", preuve: { fichier: SESSION_FILE } },
      // AJOUTÉE (2026-09-22) : avant de reprendre le plan, savoir où on en est. Sans ça, une nuit
      // passe à côté d'une tâche en attente parfaitement traitable pendant que personne ne dort
      // dessus — et l'audit du jour a justement trouvé quatre tâches faites mais jamais closes.
      { cle: "etat-taches", libelle: "analyser l'état des tâches (check-tasks-details) pour repérer ce qui peut être traité cette nuit", preuve: { dossier: "docs/check-tasks-details/", motif: /\.html$|\.txt$/ } },
      { cle: "plan", libelle: "reprendre le plan donné, sans en sauter une étape", preuve: null },
      // LES DEUX GRANDES ACTIVITÉS DE LA NUIT, ajoutées à la demande de l'utilisateur. Chacune
      // produit son PLAN D'ACTION, donc des tâches à traiter dans la MÊME nuit (Article 28) : c'est
      // ce qui transforme un scan nocturne en travail, plutôt qu'en un rapport de plus.
      { cle: "ronde-lourde", libelle: "faire tourner la Ronde en mode lourd, puis traiter son plan d'action dans la nuit", preuve: { fichier: ".circle-tasks-last-run.json" } },
      { cle: "simulation-nuit", libelle: "faire tourner une simulation si la périodicité le justifie, puis traiter son plan d'action", preuve: { dossier: "docs/simulations/", motif: /_transcript\.txt$/ } },
      { cle: "sensible", libelle: "mettre de côté tout ce qui touche au périmètre sensible", preuve: null },
      { cle: "suivi", libelle: "documenter chaque tâche substantielle dans le suivi", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      // LA BORNE, enfin (2026-09-22). L'utilisateur cherchait une limite de temps (« 3h, ou plus ? »)
      // et hésitait à la fixer — à raison : une borne horaire coupe au milieu d'une tâche, ou invite
      // à meubler jusqu'à l'heure dite. Ce qu'il a proposé juste après est meilleur, et c'est sa
      // propre formulation : « une fois que tu as tout terminé, tu fais une dernière ronde. Aussi,
      // tu vérifies toi-même tout ton travail [...] plus aucune action de ta part ne doit être faite
      // au-delà de ce seuil ».
      //
      // Une ÉTAPE TERMINALE plutôt qu'une durée : elle se vérifie (elle laisse une trace), elle se
      // limite d'elle-même (on ne la franchit qu'une fois le reste épuisé), et elle place la
      // dernière action de la nuit sur une VÉRIFICATION plutôt que sur une production — donc sur le
      // seul geste qui ne peut pas créer une nouvelle erreur à corriger.
      { cle: "verification-finale", libelle: "dernière Ronde + relecture de son propre travail de la nuit — AUCUNE action au-delà de ce seuil", preuve: { fichier: ".circle-tasks-run-summary-latest.txt" } },
      { cle: "rapport", libelle: "livrer le rapport de nuit en fichier texte, normé et archivé", preuve: { dossier: "docs/rapports-de-nuit/", motif: /\.txt$/ } },
    ],
  },
  {
    // LE PROCESS MAÎTRE (2026-09-22, question de l'utilisateur : « the god of process a-t-il son
    // propre process, et verifie-t-il son propre process ? »). La réponse était NON, et c'était le
    // seul point aveugle du dispositif : l'outil qui reproche aux autres de ne pas avoir de gardien
    // n'en avait aucun lui-même. Un surveillant qu'aucune règle ne surveille finit par dériver sans
    // que rien ne le dise — exactement le motif que tout ce paysage combat, appliqué cette fois à
    // son sommet. Il se surveille donc lui-même, et `selfCheck()` plus bas rend cette
    // auto-surveillance réellement vérifiable plutôt que simplement déclarée ici.
    slug: "meta",
    // « SOUVENT », PAS « TOUJOURS » (mot de l'utilisateur) : ce process-ci tient le DISPOSITIF des
    // process, il ne produit aucun constat à trier. Lui reprocher l'absence d'analyse apprendrait à
    // ignorer ce contrôle — et un contrôle qu'on apprend à ignorer ne garde plus rien.
    maillonsSansObjet: {
      analyse: "ce process vérifie une structure (registre, documents, sondes), il ne produit aucun constat à trier",
      "plan-action": "son verdict est binaire — un process a son document et son contrôleur, ou il ne les a pas",
      questions: "rien à trancher : ce qui manque se corrige, ça ne se calibre pas",
      taches: "ses écarts sont corrigés dans la foulée par selfCheck(), jamais différés en tâche",
    },
    nom: "Tenue du dispositif de process lui-même (process maître)",
    quand: "ajouter, retirer ou modifier un process, un gardien de process, ou god-of-all-process",
    motsCles: ["process", "gardien de process", "god-of-all-process", "dispositif"],
    doc: "docs/mode-auto-process-guardian.md",
    gardien: "scripts/god-of-all-process.mjs",
    etapes: [
      { cle: "registre", libelle: "le process est déclaré dans PROCESSES avec son document et son gardien", preuve: { fichier: "scripts/god-of-all-process.mjs" } },
      { cle: "document", libelle: "le process est écrit quelque part, pas seulement codé", preuve: null },
      { cle: "sondes", libelle: "chaque étape déclare une preuve réelle, ou déclare honnêtement n'en avoir aucune", preuve: null },
      { cle: "tensions", libelle: "toute tension avec un process voisin est déclarée ET résolue", preuve: null },
      // 2026-09-23, demande explicite : « inscris tout ce que tu fais en lien avec le process, dans
      // le process : comme ça si tu mets le process à jour, tu n'oublies rien. Règle valable pour
      // les autres process aussi. » Vérifiée mécaniquement par findMecanismesAbsentsDuProcess().
      // AJOUTÉE (2026-09-23, demande explicite de l'utilisateur : « ajoute que le process maître
      // indique que toute modification INDIRECTE d'un process doit être suivie d'une mise à jour du
      // process directement »). Elle vise ce que j'ai fait DEUX FOIS le jour même : construire des
      // mécanismes qui servent un process (le compteur de contributions, puis le schéma de
      // référence) sans toucher au document du process — jusqu'à ce qu'il me le rappelle.
      //
      // LA DISTINCTION QU'ELLE POSE : une modification DIRECTE touche le document ; une
      // modification INDIRECTE touche le CODE qui fait vivre le process (son contrôleur, une
      // fonction qu'il invoque, une preuve qu'il déclare). La seconde est la plus dangereuse,
      // parce qu'elle ne ressemble pas à un changement de process — et le document continue de
      // décrire un process qui n'existe plus tel quel. C'est l'Article 13 appliqué aux process :
      // un écart entre le document et le code se corrige le jour même, jamais par une note.
      { cle: "modification-indirecte", libelle: "toute modification INDIRECTE d'un process (son contrôleur, un mécanisme qu'il invoque, une preuve qu'il déclare) est suivie le jour même d'une mise à jour DIRECTE de son document", preuve: { fichier: "scripts/god-of-all-process.mjs" } },
      { cle: "mecanismes-inscrits", libelle: "tout mécanisme servant un process est écrit DANS son document, jamais seulement dans son code ou dans le suivi", preuve: { fichier: "scripts/god-of-all-process.mjs" } },
      { cle: "identite", libelle: "l'identité de session est déposée, sinon chaque rapport porte un trou", preuve: { fichier: SESSION_FILE } },
    ],
  },
  // INTÉGRATION D'UN NOUVEL OUTIL (2026-09-22, demande explicite : « ecris quelque part le process
  // integration ou renforce le si deja existant, pour le rendre plus efficace et te permettre
  // d'integrer plus facilement un outil »). Il n'en existait aucun, alors que c'est l'activité la
  // plus répétée du paysage : vingt-huit outils sont entrés, chacun par une série d'oublis rattrapés
  // à coups de tests rouges.
  //
  // Les étapes sont volontairement dans CET ordre, et il n'est pas décoratif : consulter d'abord
  // (sinon l'outil arrive trop tard, quand les oublis sont déjà des échecs), les onze registres
  // ensuite, la documentation, puis la vérification par le lancement réel. La dernière étape est
  // celle qu'on saute le plus volontiers et celle qui compte le plus (Article 25) : un outil qui n'a
  // jamais tourné contre le vrai dépôt n'est pas un outil, c'est une intention.
  {
    slug: "integration-outil",
    // Une liste de registres à renseigner, pas une enquête : il n'y a rien à scanner ni à rapporter,
    // seulement des cases à remplir dont l'outil dit lesquelles manquent.
    maillonsSansObjet: {
      scan: "rien à mesurer : l'outil LIT les registres réels et dit lesquels manquent, ce n'est pas un scan de découverte",
      rapports: "sa sortie EST la liste des manques — il n'y a pas de rapport séparé à livrer",
      analyse: "aucun tri à faire : un registre est renseigné ou il ne l'est pas",
      "plan-action": "chaque manque appelle exactement un geste, jamais un arbitrage",
      questions: "rien à trancher — les 10 registres sont obligatoires, sans exception",
    },
    nom: "Intégration d'un nouvel outil dans l'Agence",
    quand: "créer un nouvel outil, le faire entrer dans l'équipe, lui donner un rang ou un badge",
    motsCles: ["nouvel outil", "intégrer", "intégration", "registre", "équipe", "badge", "arrivée"],
    doc: "docs/referentiel/integration-outil.md",
    gardien: "scripts/integration-outil.mjs",
    etapes: [
      { cle: "consultation", libelle: "consulter integration-outil AVANT de commencer, pas après le premier test rouge", preuve: { fichier: "scripts/integration-outil.mjs" } },
      { cle: "registres", libelle: "les onze registres obligatoires sont renseignés (planDIntegration le dit, registre par registre)", preuve: { fichier: "scripts/integration-outil.mjs" } },
      { cle: "documents", libelle: "blueprint générique + instanciation + registre avec index existent réellement", preuve: null },
      { cle: "lancement-reel", libelle: "l'outil a TOURNÉ contre le vrai dépôt avant d'être considéré fini (Article 25)", preuve: null },
      { cle: "tests", libelle: "ses fonctions mécaniques sont couvertes par check-house.mjs", preuve: { fichier: "scripts/check-house.mjs" } },
      { cle: "suivi", libelle: "la tâche est documentée dans docs/suivi/ dans LE MÊME commit", preuve: null },
    ],
  },
  {
    slug: "integration-ronde",
    // SÉPARÉ de "integration-outil" sur demande explicite de l'utilisateur (« je veux un process
    // propre pour intégration d'un outil et un process séparé propre pour intégration à circle »),
    // et la preuve est arrivée le soir même : integration-outil a annoncé « tous les registres
    // renseignés » pour THE-EQUALIZER pendant qu'il manquait des raccordements de Ronde qu'il ne connaît
    // pas. Ce ne sont pas deux étapes d'une même arrivée — un Gardien sacré est intégré à l'Agence
    // et volontairement absent de la Ronde, et un item de Ronde peut ne porter aucun outil.
    maillonsSansObjet: {
      scan: "rien à mesurer : le contrôleur LIT les tables réelles de la Ronde et dit quels raccordements manquent",
      rapports: "sa sortie EST le plan de raccordement — il n'y a pas de rapport séparé à livrer",
      analyse: "aucun tri à faire : un raccordement est fait ou il ne l'est pas",
      "plan-action": "chaque manque appelle exactement un geste, jamais un arbitrage",
      questions: "rien à trancher — les cinq raccordements sont obligatoires dès lors que l'item entre dans la Ronde",
    },
    nom: "Intégration d'un item à la Ronde périodique",
    quand: "ajouter, renommer ou retirer un item de la Ronde — jamais la même chose que faire entrer un outil dans l'Agence",
    motsCles: ["ronde", "circle", "item périodique", "raccorder", "circle_items", "changelog"],
    doc: "docs/integration-ronde-process-detail.md",
    gardien: "scripts/circle-process-guardian.mjs",
    etapes: [
      { cle: "consultation", libelle: "consulter circle-process-guardian AVANT de toucher CIRCLE_ITEMS, pas après le test rouge", preuve: { fichier: "scripts/circle-process-guardian.mjs" } },
      { cle: "raccordements", libelle: "les cinq raccordements sont faits (planRaccordementRonde le dit, raccordement par raccordement)", preuve: { fichier: "scripts/circle-process-guardian.mjs" } },
      { cle: "pourquoi", libelle: "le POURQUOI de l'item est consigné dans CIRCLE_ITEMS_CHANGELOG — il n'est déductible d'aucun diff", preuve: { fichier: "scripts/circle-process-guardian.mjs" } },
      { cle: "tests", libelle: "les deux comptes figés de check-house.mjs sont remis à jour", preuve: { fichier: "scripts/check-house.mjs" } },
      { cle: "suivi", libelle: "la tâche est documentée dans docs/suivi/ dans LE MÊME commit", preuve: null },
    ],
  },
  {
    // SIXIÈME PROCESS (2026-09-23, tâche #221). Nom donné par l'utilisateur. Il gouverne la seule
    // chose que ce paysage ne surveillait pas : l'expérience de l'AGENT. Tous les autres process
    // encadrent une activité ; celui-ci encadre ce qui reste d'une activité une fois qu'elle est
    // finie — et c'est précisément ce qui disparaît à chaque fin de session, puisqu'un outil garde
    // son registre et qu'un agent ne garde rien.
    slug: "xp-ia",
    nom: "XP-IA-bonnes-pratiques-et-lecons",
    quand: "une leçon ou une bonne pratique apparaît dans le travail, et il faut qu'elle survive à la session puis qu'elle ressorte au moment où elle s'applique",
    motsCles: ["leçon", "lecon", "bonne pratique", "expérience", "retenir", "apprendre", "registre des leçons", "xp"],
    doc: "docs/xp-ia-process-detail.md",
    // Le contrôleur est celui de la CONDUITE, jamais celui d'un déroulé : ce process ne décrit pas
    // les étapes d'une activité, il décrit un comportement à tenir. C'est la définition même du
    // périmètre d'angel (Article 26), et lui confier autre chose aurait brouillé les deux rôles.
    gardien: "scripts/angel-of-ia-process.mjs",
    // LES ÉTAPES PORTENT EXPLICITEMENT LES SIX MAILLONS DU SCHÉMA UNIFIÉ, et aucune n'est exemptée :
    // les six s'appliquent réellement ici. C'est findMaillonsManquants() qui l'a exigé au premier
    // passage, et la bonne réponse était de couvrir les maillons pour de vrai plutôt que de déclarer
    // quatre exemptions de complaisance — une exemption est faite pour un maillon SANS OBJET, jamais
    // pour un maillon qu'on n'a pas eu envie de construire.
    etapes: [
      { cle: "declencheur-questions", libelle: "aux trois moments déclencheurs, les QUESTIONS sont posées — « y avait-il quelque chose à retenir ? » — et reçoivent une réponse, « rien à retenir » comprise", preuve: null },
      { cle: "enregistrement", libelle: "la réponse est inscrite au journal XP avec sa nature (captation / conclusion / jugement)", preuve: { fichier: "docs/tool-learning/xp-journal.json" } },
      { cle: "scan-du-registre", libelle: "SCAN mécanique du registre : chaque entrée déclare-t-elle son TERRAIN et son PORTEUR, et les cinq maillons de la chaîne sont-ils branchés dans le vrai dépôt", preuve: { fichier: "docs/referentiel/lecons.md" } },
      { cle: "rapports", libelle: "le RAPPORT de TOOL-LEARNING est produit à la Ronde et livré, jamais gardé pour l'agent seul", preuve: { fichier: "scripts/tool-learning.mjs" } },
      { cle: "analyse-ronde", libelle: "ANALYSE de la période : une conclusion écrite sur MA façon de travailler — la seule partie qu'aucune mécanique ne produit", preuve: null },
      { cle: "plan-action", libelle: "PLAN D'ACTION : chaque constat prend l'un des trois états (retenu / écarté avec sa raison / à trancher)", preuve: { fichier: "scripts/tool-learning.mjs" } },
      { cle: "taches", libelle: "les constats retenus deviennent des TÂCHES réelles dans docs/suivi/, jamais une note pour plus tard", preuve: null },
      { cle: "jugement-utilisateur", libelle: "à la Ronde, l'utilisateur dit quelles entrées ont été réellement APPLIQUÉES — jamais l'agent sur son propre travail", preuve: null },
    ],
  },
  {
    // SEPTIÈME PROCESS (2026-09-23, chantier 2 du plan de nuit). Schéma donné étape par étape par
    // l'utilisateur. Son BUT ULTIME, écrit dans ses mots, est de réorganiser la file : « il y a une
    // logique de déroulement des tâches, mais j'ai tendance à souvent la perturber en intercalant
    // de nouvelles tâches ». Une file ne se dégrade pas en perdant des tâches, elle se dégrade en
    // perdant son ordre — et un état des lieux qui ne se solde par aucun réordonnancement a échoué,
    // même exact.
    slug: "etat-des-taches",
    nom: "État des lieux des tâches (faites / en cours / à faire)",
    quand: "l'utilisateur demande un état des lieux des tâches, ou une expression équivalente",
    motsCles: ["état des tâches", "etat des taches", "état des lieux", "etat des lieux", "où on en est", "ou on en est", "file", "priorité des tâches", "flagger", "étiqueter"],
    doc: "docs/etat-des-taches-process-detail.md",
    gardien: "scripts/check-tasks-details.mjs",
    etapes: [
      { cle: "branche", libelle: "demander laquelle des deux branches : l'état complet, ou l'état rapide en conversation", preuve: null },
      { cle: "scan-recuperation", libelle: "SCAN : récupérer la donnée sur les tâches partout où elle est, via check-tasks-details en priorité — l'outil dédié, jamais un second calcul", preuve: { fichier: "scripts/check-tasks-details.mjs" } },
      { cle: "analyse", libelle: "ANALYSE aux trois échelles : à l'instant, plus généralement, au niveau du projet entier", preuve: null },
      { cle: "rapports", libelle: "livrer le RAPPORT et l'archiver — 1re partie de quoi décider VITE, 2e partie le détail complet", preuve: { dossier: "docs/etat-des-taches", motif: {}, recursif: false } },
      { cle: "questions", libelle: "QUESTIONS : la fenêtre de flagage, reportée et jamais supprimée quand l'utilisateur n'est pas là", preuve: null },
      { cle: "plan-action", libelle: "PLAN D'ACTION : analyser ses réponses, commenter, et produire la mini-frise de l'ordre retenu", preuve: null },
      { cle: "taches", libelle: "le plan est mis à jour partout où c'est nécessaire — la file réellement réorganisée, jamais seulement décrite", preuve: null },
      { cle: "enchainement", libelle: "proposer d'enchaîner sur la prochaine tâche prévue", preuve: null },
    ],
  },
];

// ————————————————————————————————————————————————————————————————————————
// L'ARRÊT PRÉMATURÉ D'UNE NUIT AUTONOME (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// POURQUOI CE GARDE-FOU EXISTE, et il a été payé : l'agent s'est arrêté au milieu d'une nuit
// autonome pour rendre un point d'étape. L'utilisateur, qui dormait, a dû se réveiller et relancer.
// Ses mots : « tu t'es arrêté ? [...] la perte de temps est conséquente ».
//
// CE QUI REND CE DÉFAUT DIFFICILE À VOIR : un compte rendu intermédiaire RESSEMBLE à du travail
// sérieux. Il est écrit, honnête, souvent bien fait — et c'est précisément ce qui lui donne
// l'apparence de la rigueur. En mode autonome, un point d'étape n'est pas un livrable : c'est une
// nuit qui s'arrête, parce que personne n'est là pour dire « continue ».
//
// CE QU'IL MESURE, et la limite est déclarée : il compare les chantiers ANNONCÉS dans le plan de
// nuit aux chantiers réellement CLOS dans le suivi. Il ne peut pas savoir pourquoi un chantier n'a
// pas été fait — seulement qu'il ne l'a pas été et qu'aucune raison n'est écrite. C'est le cas
// grossier, pas le subtil, et c'est celui qui s'est produit.
export const MOTIF_CHANTIER_PLAN = /^\*\*(\d+)\.\s+(.+?)\*\*/gm;

// PREMIÈRE VERSION RESSERRÉE IMMÉDIATEMENT (le soir même). Elle cherchait les mots du titre dans le
// suivi et rendait « 13 chantiers sur 15 touchés » alors qu'UN SEUL était fait : les titres
// partagent trop de vocabulaire courant avec des lignes de suivi qui parlent d'autre chose. Un
// garde-fou qui sur-crédite est aussi inutile qu'un garde-fou absent — il dit « tout va bien »
// précisément quand ça ne va pas, ce qui est pire que de se taire (L4, et L5 par l'autre bout).
//
// LA VERSION QUI TIENT repose sur une CONVENTION vérifiable plutôt que sur une ressemblance : toute
// ligne de suivi qui clôt un chantier de nuit cite son numéro sous la forme « chantier N du plan de
// nuit ». Une convention se respecte ou ne se respecte pas ; une ressemblance se discute.
export const MOTIF_CHANTIER_CLOS = /chantier\s+(\d+)\s+du\s+plan(?:\s+de\s+nuit)?/gi;


// Le plan de nuit le plus récent et le suivi qui va avec, LUS sur le disque plutôt que déclarés :
// un chemin recopié se périmerait à la nuit suivante (Article 24).
function latestNightPlan({ root = ROOT } = {}) {
  try {
    const plans = readdirSync(join(root, "docs/plans")).filter((f) => /^nuit-\d{4}-\d{2}-\d{2}-plan\.md$/.test(f)).sort();
    if (!plans.length) return null;
    const sessions = readdirSync(join(root, "docs/suivi/sessions")).filter((f) => f.endsWith(".md"));
    const suivi = sessions.map((f) => { try { return readFileSync(join(root, "docs/suivi/sessions", f), "utf8"); } catch { return ""; } }).join("\n");
    return { chemin: `docs/plans/${plans.at(-1)}`, suivi };
  } catch { return null; }
}

export function findArretPremature({ planPath, suiviTexte = "", readFileImpl = readFileSync, root = ROOT } = {}) {
  if (!planPath) return { mesure: "pas mesuré", raison: "aucun plan de nuit fourni — sans plan, « prématuré » n'a pas de sens", chantiers: [] };
  let plan = "";
  try { plan = readFileImpl(join(root, planPath), "utf8"); } catch { return { mesure: "pas mesuré", raison: `${planPath} est illisible`, chantiers: [] }; }
  const chantiers = [...plan.matchAll(MOTIF_CHANTIER_PLAN)].map((m) => ({ numero: m[1], titre: m[2].trim() }));
  if (!chantiers.length) return { mesure: "pas mesuré", raison: `aucun chantier numéroté trouvé dans ${planPath}`, chantiers: [] };
  const cites = new Set([...String(suiviTexte).matchAll(MOTIF_CHANTIER_CLOS)].map((m) => m[1]));
  const juges = chantiers.map((c) => ({ ...c, clos: cites.has(c.numero) }));
  const restants = juges.filter((c) => !c.clos);
  return {
    mesure: "mesuré", chantiers: juges, total: juges.length, clos: juges.length - restants.length,
    restants: restants.map((c) => `${c.numero}. ${c.titre}`),
    // Il SIGNALE, il ne bloque jamais — même autorité que le reste de god.
    verdict: restants.length
      ? `${restants.length} chantier(s) du plan pas encore clos — s'arrêter maintenant serait un arrêt prématuré, sauf raison écrite`
      : "tous les chantiers du plan sont clos : le seuil de vérification finale est atteint",
  };
}

// ————————————————————————————————————————————————————————————————————————
// TOUT MÉCANISME D'UN PROCESS S'ÉCRIT DANS SON PROCESS (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur : « inscris tout ce que tu fais en lien avec le process, dans
// le process : comme ça si tu mets le process à jour, tu n'oublies rien. Règle valable pour les
// autres process aussi. »
//
// CE QU'ELLE CORRIGE, ET L'EXEMPLE EST DE LA VEILLE. La barrière d'ouverture de la Ronde a été
// construite, testée et committée le 2026-09-23 — et elle n'existait QUE dans le code et dans
// docs/suivi/. Le document de process ne la mentionnait nulle part. Quiconque aurait relu ce
// document pour mettre le process à jour l'aurait ignorée, et aurait pu la défaire sans le savoir.
// C'est le mécanisme exact qui avait produit, vingt-quatre heures plus tôt, une Partie 4 annonçant
// « INTÉGRATION FUTURE, rien codé » sur un protocole construit le jour même — un document périmé
// qui m'a d'abord fait sauter une étape, puis défendre ce saut.
//
// LA DISTINCTION QUI TIENT TOUT : le SUIVI date ce qui a été fait ; le PROCESS dit ce qui EST. Un
// mécanisme consigné seulement dans le suivi est une trace historique, pas une règle en vigueur —
// et personne ne relit trois cents lignes de suivi avant de toucher à un process.
//
// CE QUE LE GARDE-FOU PEUT VRAIMENT VÉRIFIER, et il faut être honnête sur sa portée : aucune
// mécanique ne peut juger si un document DÉCRIT BIEN un mécanisme. Ce qu'elle peut faire, c'est
// vérifier que chaque fichier réellement invoqué par un process (son gardien, les fichiers-preuves
// de ses étapes) est au moins CITÉ dans son document. Un fichier jamais nommé n'y est certainement
// pas décrit ; un fichier nommé peut l'être mal. Le garde-fou attrape donc le cas grossier, pas le
// cas subtil — et c'est déjà celui qui s'est produit deux fois en deux jours.
export function findMecanismesAbsentsDuProcess({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync } = {}) {
  const manques = [];
  for (const p of processes) {
    if (!p.doc) continue;
    let texte;
    try {
      texte = readFileImpl(join(root, p.doc), "utf8");
    } catch {
      continue; // l'absence du document est déjà signalée par findProcessDocsMissing()
    }
    const attendus = new Set();
    if (p.gardien) attendus.add(p.gardien);
    for (const e of p.etapes ?? []) if (e.preuve?.fichier) attendus.add(e.preuve.fichier);
    for (const chemin of attendus) {
      // Le nom de base suffit : un document peut légitimement écrire « circle-tasks.mjs » sans son
      // chemin complet. Exiger le chemin exact produirait des faux positifs sur une écriture
      // parfaitement claire — et un garde-fou qui crie à tort finit par ne plus être lu.
      const base = String(chemin).split("/").pop();
      if (!texte.includes(base)) manques.push({ process: p.slug ?? p.nom, doc: p.doc, mecanisme: chemin });
    }
  }
  return manques;
}

// ————————————————————————————————————————————————————————————————————————
// LE MÊME MÉCANISME, DANS LES DEUX SENS : process ↔ gardien (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur : « vérifie que tous les gardiens, tous les outils concernés
// sont bien connectés avec leur document de process [...] et assure-toi qu'un mécanisme vérifie que
// tout est toujours bien présent dans le process ET CHEZ SON GARDIEN, le cas échéant. »
//
// CE QUI MANQUAIT, ET L'EXEMPLE EST D'IL Y A UNE HEURE. findMecanismesAbsentsDuProcess() ci-dessus
// ne regardait qu'un seul sens (le document cite-t-il les FICHIERS du process ?) et qu'un seul
// grain (le fichier, jamais la fonction). Résultat : la barrière d'ouverture et tout le suivi des
// questions sans réponse ont été construits, documentés dans docs/circle-process-detail.txt
// (Parties 8 et 11) et committés — pendant que scripts/circle-process-guardian.mjs n'en connaissait
// pas un mot. Un `grep` sur les cinq noms rendait 0. Le gardien déclarait pourtant la Ronde
// conforme : il gardait la moitié du process qu'il connaissait, et se taisait sur l'autre.
//
// LES DEUX SENS, ET AUCUN NE SUFFIT SEUL :
//   - un mécanisme ÉCRIT dans le process mais IGNORÉ du gardien → une règle que personne ne fait
//     respecter (le cas ci-dessus) ;
//   - un mécanisme CÂBLÉ dans le gardien mais ABSENT du document → une règle qu'on fait respecter
//     sans l'avoir écrite, donc que le prochain agent défera sans le savoir (Article 27).
//
// RIEN N'EST RECOPIÉ À LA MAIN (Article 24, qui interdirait justement une liste de mécanismes
// tenue ici). Les deux sens se DÉRIVENT à l'exécution : les fichiers-source d'un process sont ceux
// que son gardien importe réellement plus ceux que son document nomme ; les mécanismes sont leurs
// exports RÉELS, lus dans le code. Une fonction renommée, ajoutée ou supprimée change donc le
// verdict toute seule, sans que personne ait à y penser.
//
// LA PORTÉE HONNÊTE, et elle est la même que celle de findMecanismesAbsentsDuProcess() : citer un
// nom n'est pas le décrire, ni le vérifier. Ce garde-fou attrape le cas grossier — le silence
// total — jamais le cas subtil d'une mention creuse. C'est déjà celui qui s'est produit.

const IMPORT_LOCAL = /import\s*\{([^}]*)\}\s*from\s*"\.\/([A-Za-z0-9._-]+\.mjs)"/g;
const EXPORT_NOMME = /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm;

function lireTexte(chemin, readFileImpl) {
  try { return readFileImpl(chemin, "utf8"); } catch { return null; }
}

// Les mécanismes d'un process = les exports RÉELS de ses fichiers-source. Les fichiers-source se
// déduisent de deux endroits, jamais déclarés à la main : ce que le gardien importe localement, et
// ce que le document nomme. Un mécanisme n'est retenu que s'il est cité quelque part — un export
// interne que ni le doc ni le gardien ne nomme n'est pas une règle de process, c'est du code.
// extraireSection() — du titre donné jusqu'au prochain titre de MÊME niveau, jamais jusqu'à la fin
// du fichier. Un titre introuvable rend `null` plutôt que le document entier : se rabattre
// silencieusement sur tout le fichier ramènerait exactement le bruit qu'on vient d'enlever, sans
// que personne ne s'en aperçoive.
export function extraireSection(texte, titre) {
  const source = String(texte ?? "");
  const debut = source.indexOf(titre);
  if (debut === -1) return null;
  const niveau = (titre.match(/^#+/) ?? ["##"])[0];
  const suite = source.slice(debut + titre.length);
  const fin = suite.search(new RegExp(`^${niveau} `, "m"));
  return fin === -1 ? source.slice(debut) : source.slice(debut, debut + titre.length + fin);
}

export function mecanismesDuProcess(p, { root = ROOT, readFileImpl = readFileSync } = {}) {
  // UN PROCESS PEUT VIVRE DANS UNE SECTION, PAS DANS TOUT UN FICHIER (2026-09-23). Le process de
  // simulation déclare `docs/regles-de-travail.md` comme document — or ce fichier est AUSSI la
  // référence maîtresse de tout le paysage, et il nomme au passage des dizaines de mécanismes qui
  // n'ont rien à voir avec une simulation. Résultat : dix « règles écrites que le gardien n'applique
  // pas » dont pas une seule n'était une règle de ce process (`PERSONNAGES`, `walkDocsPaths`…).
  //
  // `docSection` permet donc de dire QUELLE PARTIE du document fait loi pour ce process. Sans elle,
  // le fichier entier compte — comportement inchangé pour les sept autres, qui ont chacun leur
  // document propre.
  const docEntier = p.doc ? lireTexte(join(root, p.doc), readFileImpl) : null;
  const docTexte = p.docSection && docEntier ? extraireSection(docEntier, p.docSection) : docEntier;
  const gardienTexte = p.gardien ? lireTexte(join(root, p.gardien), readFileImpl) : null;
  if (!docTexte || !gardienTexte) return { sources: [], mecanismes: [], docTexte, gardienTexte };

  // LES FICHIERS-SOURCE = UNE INTERSECTION, JAMAIS UNE UNION, et ce choix est le cœur du
  // garde-fou. Première version écrite ce soir : l'union de ce que le gardien importe et de tout
  // `*.mjs` nommé dans le document. Elle a rendu 51 fichiers-source pour le process simulation —
  // parce que docs/regles-de-travail.md nomme les 65 scripts du dépôt — et plus de cent
  // « mécanismes absents » dont pas un seul n'était un vrai manquement. Un garde-fou qui crie à
  // tort finit par ne plus être lu, donc par ne plus rien garder : le rendre bruyant aurait été
  // pire que ne rien construire.
  //
  // L'intersection dit exactement la bonne chose : un fichier que le gardien importe ET que le
  // document nomme est un fichier dont LES DEUX CÔTÉS reconnaissent qu'il sert ce process. C'est
  // le seul périmètre où un écart entre les deux est réellement un écart, et non une différence
  // de sujet. Un module d'infrastructure (lib-shell, tool-usage) tombe de lui-même, sans aucune
  // liste d'exclusion à tenir à jour (Article 24).
  const importes = new Set();
  for (const m of gardienTexte.matchAll(IMPORT_LOCAL)) importes.add(`scripts/${m[2]}`);
  const sources = new Set();
  for (const chemin of importes) {
    if (chemin === p.gardien) continue; // le gardien n'est pas sa propre source à surveiller
    if (docTexte.includes(chemin.split("/").pop())) sources.add(chemin);
  }

  const mecanismes = [];
  for (const src of sources) {
    const texte = lireTexte(join(root, src), readFileImpl);
    if (!texte) continue;
    for (const m of texte.matchAll(EXPORT_NOMME)) {
      const nom = m[1];
      // Un nom trop court produirait des collisions de sous-chaîne (« sh », « add »...) : le
      // garde-fou crierait à tort, et un garde-fou qui crie à tort finit par ne plus être lu.
      if (nom.length < 5) continue;
      const cible = new RegExp(`\\b${nom}\\b`);
      // « CÂBLÉ » VEUT DIRE EMPLOYÉ, JAMAIS SEULEMENT IMPORTÉ (resserré le 2026-09-23). Sans cette
      // distinction, tout nom figurant dans la ligne d'import d'un gardien comptait comme un
      // mécanisme qu'il fait respecter — et le rapport annonçait 66 « mécanismes câblés et jamais
      // écrits », dont l'immense majorité n'étaient que des symboles d'infrastructure traversant
      // l'import. Le vrai signal, lui, tient en douze lignes (des règles ÉCRITES et non appliquées)
      // et se noyait dedans : un garde-fou qui crie à tort finit par ne plus être lu (leçon L4).
      //
      // On retire donc les lignes d'import avant de chercher l'emploi réel. Un mécanisme importé
      // ET appelé reste évidemment compté — c'est le cas normal.
      const gardienHorsImports = gardienTexte.replace(/^import\s[^;]*;$/gm, "");
      mecanismes.push({ nom, fichier: src, dansDoc: cible.test(docTexte), dansGardien: cible.test(gardienHorsImports) });
    }
  }
  return { sources: [...sources], mecanismes, docTexte, gardienTexte };
}

// LES DEUX SENS DE L'ÉCART, dérivés du calcul unique ci-dessous plutôt que recalculés (corrigé le
// 2026-09-23, tâche #218). Ils refaisaient chacun la même traversée que `etatConnexionProcessGardien()`
// — trois fonctions pour une seule vérité, et CLONE-HUNTER l'aurait signalé tôt ou tard.

// SENS 1 — écrit dans le process, ignoré du gardien. Le cas réel du 2026-09-23.
export function findMecanismesAbsentsDuGardien(options = {}) {
  return etatConnexionProcessGardien(options)
    .flatMap((e) => e.docSeul.map((nom) => ({ process: e.process, gardien: e.gardien, mecanisme: nom })));
}

// SENS 2 — câblé dans le gardien, absent du document. Une règle qu'on fait respecter sans l'avoir
// écrite : elle tient tant que l'agent qui l'a posée est là, et pas une session de plus.
export function findMecanismesAbsentsDuDocument(options = {}) {
  return etatConnexionProcessGardien(options)
    .flatMap((e) => e.gardienSeul.map((nom) => ({ process: e.process, doc: e.doc, mecanisme: nom })));
}

// LE VERDICT LISIBLE, process par process : combien de mécanismes des deux côtés, combien d'un seul.
// Jamais un pourcentage vert sur un dénominateur vide — zéro mécanisme trouvé se DIT (« pas
// mesuré »), il ne se rend jamais comme une conformité.
export function etatConnexionProcessGardien({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync } = {}) {
  // UN GARDIEN PEUT SERVIR PLUSIEURS PROCESS, et sans cette précaution chacun se voit reprocher les
  // mécanismes de l'autre. Cas réel du 2026-09-23 : circle-process-guardian garde la Ronde ET
  // l'intégration d'un item à la Ronde ; les 33 mécanismes de la première étaient comptés comme
  // « câblés et jamais écrits » pour la seconde, alors qu'ils sont écrits — dans le document de sa
  // voisine. Un mécanisme documenté chez un process FRÈRE (même gardien) n'est donc pas un
  // mécanisme non écrit : il est écrit ailleurs, et c'est légitime.
  const docsParGardien = new Map();
  for (const p of processes) {
    if (!p.doc || !p.gardien) continue;
    if (!docsParGardien.has(p.gardien)) docsParGardien.set(p.gardien, []);
    docsParGardien.get(p.gardien).push(lireTexte(join(root, p.doc), readFileImpl) ?? "");
  }
  return processes.filter((p) => p.doc && p.gardien).map((p) => {
    const { sources, mecanismes } = mecanismesDuProcess(p, { root, readFileImpl });
    const textesFreres = docsParGardien.get(p.gardien) ?? [];
    const ecritChezUnFrere = (nom) => textesFreres.some((t) => new RegExp(`\\b${nom}\\b`).test(t));
    const partages = mecanismes.filter((m) => m.dansDoc && m.dansGardien);
    const docSeul = mecanismes.filter((m) => m.dansDoc && !m.dansGardien);
    const gardienSeul = mecanismes.filter((m) => !m.dansDoc && m.dansGardien && !ecritChezUnFrere(m.nom));
    return {
      process: p.slug ?? p.nom,
      doc: p.doc,
      gardien: p.gardien,
      sources,
      mesure: mecanismes.length === 0 ? "pas mesuré — aucun fichier-source commun trouvé entre le document et le gardien" : "mesuré",
      partages: partages.length,
      docSeul: docSeul.map((m) => m.nom),
      gardienSeul: gardienSeul.map((m) => m.nom),
    };
  });
}

// ————————————————————————————————————————————————————————————————————————
// LE SCHÉMA DE RÉFÉRENCE D'UN PROCESS (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Posé par l'utilisateur : « on a bien la logique SCAN >> RAPPORTS >> ANALYSE >> QUESTIONS >>
// TÂCHES DE TRAVAIL, ou tout au moins un schéma proche de celui-ci ? Ce schéma est une référence
// dans les process, à enregistrer en tant que tel : un process respecte SOUVENT ce schéma. »
//
// SA LECTURE ÉTAIT JUSTE, et la Ronde du jour l'a suivie de bout en bout. Deux précisions sont
// pourtant sorties de la vérification, et aucune n'est un détail de vocabulaire :
//
//   1. IL MANQUE UN MAILLON À SA FORMULATION : le PLAN D'ACTION, entre l'analyse et les tâches.
//      L'Article 28 le nomme explicitement (« rapport → analyse → plan d'action → tâches »), et
//      c'est LÀ que vivent les trois états d'un constat (retenu / écarté AVEC SA RAISON / à
//      trancher). Sans ce maillon, « écarté » n'existe pas — et un constat qu'on ne retient pas
//      disparaît sans laisser de trace, ce qui est exactement l'abandon déguisé que l'Article 28
//      interdit.
//
//   2. LES QUESTIONS NE SONT PAS UNE ÉTAPE DE LA FILE, C'EST UNE BIFURCATION. Il les place avant
//      les tâches ; le process écrit (Partie 13) les place après. Les deux sont vrais, pour deux
//      choses différentes : un constat RETENU devient une tâche sans qu'on ait rien à demander,
//      un constat À TRANCHER a besoin de la question D'ABORD. Les questions ne suivent donc pas
//      l'analyse, elles sortent du plan d'action — et seulement pour une partie des constats.
//
// LE TROU QUE CETTE VÉRIFICATION A OUVERT, et il est réel : les étapes que ce fichier déclarait
// pour la Ronde s'arrêtaient à « enregistrement ». Ni analyse, ni plan d'action, ni tâches. Le
// contrôleur ne vérifiait donc PAS la moitié de la chaîne que l'Article 28 déclare non
// négociable — il surveillait le déroulé mécanique et laissait échapper ce à quoi ce déroulé sert.
//
// « SOUVENT », PAS « TOUJOURS » — c'est son mot, et il commande le mécanisme. Un maillon absent
// n'est donc jamais une faute en soi : il se DÉCLARE, avec sa raison, comme tout le reste ici. Un
// process de consultation avant action (Smart Conso) n'a pas de rapport à produire ; le lui
// reprocher apprendrait à ignorer ce contrôle.
// DEUX BORNES POSÉES PAR L'UTILISATEUR DANS LA FOULÉE, et elles évitent chacune un contresens :
//
//   · « Attention, ça ne veut pas dire que ce schéma PRÉVAUT sur le process circle existant sur
//     lequel on travaille depuis tout à l'heure. Mais il doit s'en rapprocher. » — Le schéma est
//     une RESSEMBLANCE DE FAMILLE, jamais une loi. Là où un process écrit diffère du schéma, c'est
//     le PROCESS qui fait foi : lui a été calibré étape par étape avec l'utilisateur, le schéma
//     n'est qu'un repère commun. Ce que le schéma mesure, c'est une DISTANCE — « ce process
//     s'éloigne-t-il de la forme habituelle, et l'a-t-on dit ? » — jamais une conformité à
//     atteindre. Un process qui s'en écarte pour une raison écrite est en règle.
//
//   · « C'est normal que la Ronde actuelle ne contienne pas la fin du schéma, car elle n'est pas
//     finie. » — Ce que ces fonctions lisent, ce sont les ÉTAPES DÉCLARÉES d'un process (sa
//     conception), jamais l'état d'une exécution en cours. Une Ronde en train de se dérouler n'a
//     évidemment pas encore ses tâches : ça ne dit rien du process, seulement qu'on est au milieu.
//     Confondre les deux ferait reprocher à un travail en cours de ne pas être terminé — la même
//     famille d'erreur que « lire une absence de mesure comme une mesure ».
// LE SCHÉMA UNIFIÉ, ÉCRIT UNE SEULE FOIS (2026-09-23, demande explicite de l'utilisateur : « je veux
// un seul schéma unifié, complet, pour tout le monde : process, documents, etc. »).
//
// LE PROBLÈME RÉEL, mesuré avant d'écrire ceci : le schéma existait en données depuis la veille,
// mais chaque document le RECOPIAIT en prose, et les copies avaient déjà divergé — « ... QUESTIONS
// >> TÂCHES » ici, « ... QUESTIONS >> TÂCHES DE TRAVAIL » là, et aucune des deux ne mentionnait le
// maillon PLAN D'ACTION, pourtant ajouté le même jour. Trois écritures, trois vérités partielles :
// exactement la liste recopiée à la main que l'Article 24 interdit.
//
// La correction n'est donc pas de choisir la bonne formule et de la recopier partout — ce serait le
// même piège une génération plus tard. C'est de la DÉRIVER du seul endroit qui fait foi, pour qu'un
// septième maillon ajouté un jour se propage sans que personne n'y pense.
export const SCHEMA_SEPARATEUR = " >> ";

export function schemaUnifie(schema = SCHEMA_DE_REFERENCE) {
  return schema.map((m) => m.libelle ?? m.maillon.toUpperCase()).join(SCHEMA_SEPARATEUR);
}

// LA CLAUSE QUI ÉVITE LE CONTRESENS, et l'utilisateur l'a posée lui-même : unifier le schéma ne
// remet JAMAIS en cause un process lourd déjà calibré (la Ronde en tête). Un tel process REPREND
// cette logique et l'habille d'étapes sur mesure, issues de vrais calibrages — il n'y déroge pas,
// il l'instancie. Un maillon qu'il n'exécute pas se déclare avec sa raison (`maillonsSansObjet`),
// ce qui reste une déclinaison, jamais une exception.

// ————————————————————————————————————————————————————————————————————————
// LE GABARIT D'UN DOCUMENT DE PROCESS (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande de l'utilisateur : « le modèle de process et son contrôle + les gabarits ». Le modèle vit
// dans docs/gabarits/process.md ; ceci en est le contrôle.
//
// CE QU'IL VÉRIFIE EST UNE RÉPONSE, JAMAIS UN TITRE, et ce choix décide de tout le reste. Les huit
// process déclarés ont des structures franchement différentes — « Partie 1…6 » chez l'un, des
// titres parlants chez l'autre — et c'est légitime : un process de simulation et un process
// d'intégration n'ont pas la même forme naturelle. Imposer des intitulés identiques aurait recalé
// les huit au premier passage, et un garde-fou qui accuse tout le monde cesse d'être lu (leçon L4).
//
// SA LIMITE, DÉCLARÉE PLUTÔT QUE DÉCOUVERTE : il détecte une PRÉSENCE, jamais une qualité. Il ne
// peut pas juger si le défaut décrit est un vrai défaut, ni si le déclencheur est le bon. Un
// contrôle qu'on croit plus fort qu'il n'est vaut moins qu'un contrôle honnête.
export const EXIGENCES_GABARIT_PROCESS = [
  {
    cle: "empeche",
    quoi: "ce que ce process existe pour EMPÊCHER — un défaut concret, jamais une intention générale",
    // Le motif cherche la formulation de l'empêchement sous ses formes réelles dans ce dépôt, pas
    // un titre exact : « existe pour empêcher », « le problème qu'il ferme », « le trou que ».
    motif: /existe pour empêcher|problème qu'il (?:ferme|règle|résout)|trou que ce|ce qu'il empêche|pourquoi il existe/i,
  },
  {
    cle: "declencheur",
    quoi: "son DÉCLENCHEUR — l'événement, le calendrier ou la demande qui le met en route",
    motif: /déclencheur|se déclenche|quand (?:s'applique|l'utilisateur demande|on)|à chaque Ronde|au moment où/i,
  },
  {
    cle: "etapes",
    quoi: "ses ÉTAPES, chacune avec sa preuve — ou l'aveu écrit qu'elle n'en a aucune",
    motif: /étapes?|maillons?|raccordements?|registres?/i,
  },
  {
    cle: "controleur",
    quoi: "son CONTRÔLEUR nommé par son chemin, ou la raison écrite qu'aucun n'est possible",
    // Vérifié contre le gardien RÉELLEMENT déclaré, jamais contre « un script est cité quelque
    // part » : citer n'importe quel script laisserait passer un document qui nomme le mauvais.
    motifDepuisProcess: (p) => new RegExp(String(p.gardien ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  },
  {
    cle: "limites",
    quoi: "ce qu'il NE fait PAS — ses limites, et les tensions avec les process voisins",
    motif: /ne fait pas|NE fait PAS|sa limite|ses limites|hors périmètre|n'a jamais prétendu|ce qu'il n'est pas/i,
  },
];

export function findProcessHorsGabarit({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync, exigences = EXIGENCES_GABARIT_PROCESS } = {}) {
  const ecarts = [];
  for (const p of processes) {
    if (!p.doc) continue;
    let texte;
    // Un document illisible n'est PAS un document non conforme : le dire, jamais le compter comme
    // un écart de gabarit (même discipline « pas mesuré ≠ mesuré vert » que partout ailleurs).
    try { texte = readFileImpl(join(root, p.doc), "utf8"); }
    catch { ecarts.push({ process: p.slug ?? p.nom, doc: p.doc, cle: "document", quoi: "document introuvable — le gabarit n'a pas pu être vérifié, ce n'est jamais un document conforme" }); continue; }
    for (const e of exigences) {
      const motif = e.motifDepuisProcess ? e.motifDepuisProcess(p) : e.motif;
      if (!motif.test(texte)) ecarts.push({ process: p.slug ?? p.nom, doc: p.doc, cle: e.cle, quoi: e.quoi });
    }
  }
  return ecarts;
}

// findSchemaDivergent() — le garde-fou exigé par l'Article 24 : déclarer le schéma une fois ne sert
// à rien si les documents continuent d'en écrire des variantes à la main. Il cherche, dans les
// documents normatifs, toute phrase qui ÉNUMÈRE le schéma (reconnaissable à « >> » entre deux
// maillons connus) et la compare à la seule écriture qui fasse foi.
//
// Ce qu'il ne fait pas, volontairement : corriger. Une de ces phrases est une CITATION de
// l'utilisateur, et on ne réécrit pas les mots de quelqu'un dans son dos (même règle que le surnom
// R/O-Guardian, Article 20bis/24). Il signale, l'agent tranche au cas par cas.
export function findSchemaDivergent(documents = {}, { canonique = schemaUnifie() } = {}) {
  const ecarts = [];
  for (const [chemin, texte] of Object.entries(documents)) {
    String(texte ?? "").split("\n").forEach((ligne, i) => {
      if (!/\b(SCAN|RAPPORTS|ANALYSE|QUESTIONS)\b\s*>>\s*\b(RAPPORTS|ANALYSE|QUESTIONS|PLAN|TÂCHES|TACHES)\b/.test(ligne)) return;
      if (ligne.includes(canonique)) return;
      ecarts.push({ fichier: chemin, ligne: i + 1, extrait: ligne.trim().slice(0, 120),
        citation: /«|»/.test(ligne) });
    });
  }
  return ecarts;
}

export const SCHEMA_DECLINAISON = "Un process lourd déjà calibré (la Ronde, une simulation Article 18) INSTANCIE ce schéma avec ses étapes sur mesure plutôt que de le répéter tel quel : ses maillons sans objet se déclarent avec leur raison, jamais par omission.";

export const SCHEMA_DE_REFERENCE = [
  { maillon: "scan", libelle: "SCAN", quoi: "produire une mesure réelle sur l'état des choses", sansQuoi: "l'analyse porterait sur une impression" },
  { maillon: "rapports", libelle: "RAPPORTS", quoi: "écrire ET LIVRER ce que le scan a trouvé", sansQuoi: "seul l'agent sait ce qui a été vu (Partie 13 : écrire n'est pas livrer)" },
  { maillon: "analyse", libelle: "ANALYSE", quoi: "trier ce qui compte de ce qui ne compte pas", sansQuoi: "un tas de constats bruts, que personne ne hiérarchise" },
  { maillon: "plan-action", libelle: "PLAN D'ACTION", quoi: "donner à CHAQUE constat un des trois états : retenu / écarté avec sa raison / à trancher", sansQuoi: "un constat écarté disparaît sans trace — l'abandon déguisé de l'Article 28" },
  { maillon: "questions", libelle: "QUESTIONS", quoi: "poser à l'utilisateur les constats « à trancher », et eux seuls", sansQuoi: "l'agent décide à sa place, ou bloque tout en attendant", bifurcation: true },
  { maillon: "taches", libelle: "TÂCHES DE TRAVAIL", quoi: "inscrire dans docs/suivi/ les tâches réelles issues des constats retenus et des réponses", sansQuoi: "le rapport a coûté son temps et n'a rien changé" },
];

// Quels maillons un process porte-t-il réellement ? Dérivé de ses étapes déclarées (leur clé et
// leur libellé), jamais d'une seconde table à tenir en parallèle (Article 24).
export const MOTS_DU_SCHEMA = {
  scan: /scan|exécuter|execution|lancer|mesure|capture|sonde/i,
  rapports: /rapport|livr|transcript|dossier/i,
  analyse: /analyse|relire|lecture|diagnostic/i,
  "plan-action": /plan d'action|plan-action|constat/i,
  questions: /question|fenêtre|calibrage|trancher/i,
  taches: /tâche|tache|suivi\//i,
};

export function maillonsDuProcess(p, { schema = SCHEMA_DE_REFERENCE, mots = MOTS_DU_SCHEMA } = {}) {
  const texte = (p.etapes ?? []).map((e) => `${e.cle} ${e.libelle}`).join(" | ");
  return schema.map(({ maillon, quoi, sansQuoi, bifurcation }) => ({
    maillon, quoi, sansQuoi, bifurcation: Boolean(bifurcation),
    present: mots[maillon].test(texte),
    exempte: (p.maillonsSansObjet ?? {})[maillon] ?? null,
  }));
}

// LES MAILLONS MANQUANTS SANS RAISON ÉCRITE. Un maillon exempté par une raison déclarée n'est
// jamais compté comme un manque — c'est ce que « souvent » veut dire, rendu mécanique.
export function findMaillonsManquants({ processes = PROCESSES, schema = SCHEMA_DE_REFERENCE } = {}) {
  const manques = [];
  for (const p of processes) {
    for (const m of maillonsDuProcess(p, { schema })) {
      if (!m.present && !m.exempte) manques.push({ process: p.slug ?? p.nom, maillon: m.maillon, sansQuoi: m.sansQuoi });
    }
  }
  return manques;
}

// La vue lisible, process par process — ce que l'utilisateur lirait pour vérifier son schéma.
export function etatDuSchema({ processes = PROCESSES, schema = SCHEMA_DE_REFERENCE } = {}) {
  return processes.map((p) => ({
    process: p.slug ?? p.nom,
    maillons: maillonsDuProcess(p, { schema }).map((m) => ({
      maillon: m.maillon,
      etat: m.present ? "présent" : m.exempte ? "sans objet" : "MANQUANT",
      pourquoi: m.present ? null : m.exempte ?? m.sansQuoi,
    })),
  }));
}

// ————————————————————————————————————————————————————————————————————————
// UNE MODIFICATION INDIRECTE NON SUIVIE (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Le garde-fou de l'étape « modification-indirecte » du process maître. Il lit les commits récents
// et cherche ceux qui touchent le CODE d'un process — son contrôleur, ou un fichier qu'une de ses
// étapes déclare comme preuve — sans toucher au document de ce process dans le même commit.
//
// POURQUOI LE MÊME COMMIT, et pas « dans la journée » : c'est la règle que le suivi applique déjà
// (`findCommitsMissingSuiviUpdate`), pour la même raison — « je le ferai après » est la forme que
// prend l'oubli. Un commit est l'unité qui se relit, se cite et se révoque d'un bloc.
//
// SA LIMITE, déclarée : il juge sur les fichiers d'un commit, donc un commit qui groupe plusieurs
// sujets élargit la fenêtre et peut laisser passer un cas. Il attrape le cas net — du code de
// process modifié seul — jamais tous les cas.
export function findChangementsIndirectsSansMiseAJour({ processes = PROCESSES, shImpl = sh, root = ROOT, nbCommits = 15 } = {}) {
  let brut;
  try {
    brut = shImpl(`git log -n ${nbCommits} --name-only --pretty=format:%H%x09%s`, { cwd: root.replace(/\/$/, "") });
  } catch {
    return []; // pas de git lisible : une absence de mesure, jamais un vert (l'appelant le dit)
  }
  const commits = [];
  let courant = null;
  for (const ligne of String(brut).split("\n")) {
    if (/^[0-9a-f]{7,40}\t/.test(ligne)) {
      const [hash, ...sujet] = ligne.split("\t");
      courant = { hash: hash.slice(0, 8), sujet: sujet.join(" "), fichiers: [] };
      commits.push(courant);
    } else if (ligne.trim() && courant) courant.fichiers.push(ligne.trim());
  }
  // DEUX RESSERREMENTS, et chacun est payé par du bruit constaté au premier lancement (12 écarts
  // dont la moitié faux) :
  //
  //   · `check-house.mjs` est EXCLU. C'est le filet de sécurité de tout le dépôt : n'importe quel
  //     changement le touche, donc le compter comme « code d'un process » ferait crier ce contrôle
  //     à chaque commit. Il est déclaré comme preuve par un process, il n'en est pas un mécanisme.
  //   · UN ÉCART PAR (commit, fichier), jamais un par process. god-of-all-process.mjs est le
  //     contrôleur de deux process à la fois : le modifier produisait deux lignes identiques pour
  //     un seul geste. Les process concernés sont NOMMÉS dans l'écart, jamais multipliés par lui.
  const PARTAGES = new Set(["scripts/check-house.mjs"]);
  const parCle = new Map();
  for (const c of commits) {
    for (const p of processes) {
      if (!p.doc) continue;
      const codeDuProcess = new Set();
      if (p.gardien) codeDuProcess.add(p.gardien);
      for (const e of p.etapes ?? []) if (e.preuve?.fichier?.endsWith(".mjs")) codeDuProcess.add(e.preuve.fichier);
      const touche = c.fichiers.filter((f) => codeDuProcess.has(f) && !PARTAGES.has(f));
      if (!touche.length || c.fichiers.includes(p.doc)) continue;
      for (const fichier of touche) {
        const cle = `${c.hash}|${fichier}`;
        if (!parCle.has(cle)) parCle.set(cle, { commit: c.hash, sujet: c.sujet, fichier, processes: [], docs: [] });
        parCle.get(cle).processes.push(p.slug ?? p.nom);
        parCle.get(cle).docs.push(p.doc);
      }
    }
  }
  // LE RATTRAPAGE (2026-09-23) — une dette PAYÉE plus tard cesse d'être une dette impayée, sans
  // cesser d'avoir été un retard.
  //
  // POURQUOI CETTE DISTINCTION EXISTE, et elle est payée par un cas réel de ce soir : quatre écarts
  // légitimes ont été trouvés, les quatre documents ont été mis à jour dans l'heure — et le
  // détecteur a continué d'afficher les mêmes sept lignes, parce qu'il ne regarde que le commit
  // fautif. Un signal qu'aucune action ne peut éteindre devient du décor en deux passages, et on
  // cesse de lire la liste où se cachent les vrais impayés (leçon L6).
  //
  // CE QU'IL NE FAIT PAS : absoudre. Le rattrapage est NOMMÉ avec le commit qui l'a payé — la règle
  // reste « dans le même commit », et le rapport continue de dire qu'elle n'a pas été tenue. Il
  // sépare seulement « en retard, réglé » de « toujours dû », ce que le compte unique mélangeait.
  //
  // Un document mis à jour AVANT le commit fautif ne compte jamais : il ne pouvait pas décrire un
  // changement qui n'existait pas encore. L'ordre de `git log` (du plus récent au plus ancien) rend
  // la comparaison directe — un commit rattrapeur est simplement plus haut dans la liste.
  const rangDuCommit = new Map(commits.map((c, i) => [c.hash, i]));
  const docsMisAJour = new Map();
  for (const c of commits) {
    for (const f of c.fichiers) {
      if (!docsMisAJour.has(f)) docsMisAJour.set(f, []);
      docsMisAJour.get(f).push(c.hash);
    }
  }
  return [...parCle.values()].map((e) => ({ ...e, docs: [...new Set(e.docs)] })).map((e) => {
    const rangFautif = rangDuCommit.get(e.commit);
    const rattrapeurs = e.docs.map((d) => (docsMisAJour.get(d) ?? []).find((h) => rangDuCommit.get(h) < rangFautif)).filter(Boolean);
    // Rattrapé seulement si TOUS les documents concernés l'ont été : en rattraper un sur deux laisse
    // l'autre faux, et un demi-rattrapage affiché comme un rattrapage est pire qu'aucun.
    const rattrape = rattrapeurs.length === e.docs.length ? rattrapeurs[0] : null;
    return { ...e, rattrape,
      pourquoi: `${e.fichier} a changé sans que ${e.docs.join(" ni ")} ne soit mis à jour dans le même commit${rattrape ? ` — RATTRAPÉ depuis, par ${rattrape} : la règle n'a pas été tenue, la dette documentaire l'est` : " — le document décrit désormais un process qui n'existe plus tel quel"} (process concerné${e.processes.length > 1 ? "s" : ""} : ${e.processes.join(", ")})` };
  });
}

// ————————————————————————————————————————————————————————————————————————
// LE RÉFLEXE : quel process gouverne ce que je m'apprête à faire ?
// ————————————————————————————————————————————————————————————————————————

// Même mécanique honnête que tool-brain : une correspondance par mots-clés, jamais une
// compréhension. Elle peut passer à côté — d'où l'avertissement de fiabilité en tête du rapport.
export function whichProcess(tache, { processes = PROCESSES } = {}) {
  const t = String(tache ?? "").toLowerCase();
  if (!t.trim()) return [];
  return processes
    .map((p) => ({ process: p, score: p.motsCles.filter((m) => t.includes(m)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.process);
}

// ————————————————————————————————————————————————————————————————————————
// L'AVANCEMENT : déduit des traces, jamais compté
// ————————————————————————————————————————————————————————————————————————

// Une étape a-t-elle laissé sa trace ? Trois réponses possibles, jamais deux : oui, non, et
// « cette étape ne laisse aucune trace vérifiable » — cette troisième n'est pas un échec, c'est une
// limite déclarée. La confondre avec « non faite » produirait exactement le faux constat que ce
// paysage d'outils passe son temps à corriger.
function contient(chemin, motif, recursif, profondeur = 0) {
  for (const e of readdirSync(chemin, { withFileTypes: true })) {
    if (e.isFile() && motif.test(e.name)) return true;
    if (recursif && e.isDirectory() && profondeur < 3 && contient(join(chemin, e.name), motif, recursif, profondeur + 1)) return true;
  }
  return false;
}

export function etapeTrace(etape, { root = ROOT } = {}) {
  if (!etape.preuve) return { verifiable: false };
  const { fichier, dossier, motif, recursif } = etape.preuve;
  try {
    if (fichier) return { verifiable: true, presente: existsSync(join(root, fichier)) };
    if (dossier) {
      const chemin = join(root, dossier);
      // UNE SONDE QUI POINTE VERS RIEN N'EST PAS UNE ÉTAPE MANQUANTE (2026-09-22, trouvé au premier
      // lancement réel de cet outil : trois de mes propres sondes visaient des chemins inexistants
      // et annonçaient tranquillement des étapes « manquantes » qui avaient parfaitement eu lieu).
      // Confondre les deux, c'est encore lire une absence de mesure comme une mesure — l'erreur que
      // cet outil est précisément censé empêcher. Une sonde cassée le dit, et findBrokenProbes()
      // ci-dessous la fait remonter en tant que défaut de l'outil, jamais du travail surveillé.
      if (!existsSync(chemin)) return { verifiable: false, sondeCassee: `le dossier ${dossier} n'existe pas` };
      return { verifiable: true, presente: contient(chemin, motif ?? /./, recursif === true) };
    }
  } catch {
    return { verifiable: false };
  }
  return { verifiable: false };
}

// Toutes les sondes qui ne pointent nulle part, tous process confondus. C'est un défaut de l'outil,
// à corriger dans l'outil — jamais un reproche adressé au travail qu'il surveille.
export function findBrokenProbes({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.flatMap((p) => p.etapes.map((e) => ({ p, e, t: etapeTrace(e, { root }) }))
    .filter((x) => x.t.sondeCassee)
    .map((x) => `${x.p.nom} / « ${x.e.libelle} » : ${x.t.sondeCassee}`));
}

export function processProgress(slug, { processes = PROCESSES, root = ROOT } = {}) {
  const p = processes.find((x) => x.slug === slug);
  if (!p) return undefined;
  const etapes = p.etapes.map((e) => ({ ...e, ...etapeTrace(e, { root }) }));
  const verifiables = etapes.filter((e) => e.verifiable);
  return {
    slug: p.slug,
    nom: p.nom,
    etapes,
    verifiables: verifiables.length,
    presentes: verifiables.filter((e) => e.presente).length,
    // Les étapes sans trace ne sont JAMAIS comptées comme faites ni comme manquantes — elles sont
    // nommées à part, pour que le lecteur sache exactement ce que ce chiffre ne couvre pas.
    sansTrace: etapes.filter((e) => !e.verifiable && !e.sondeCassee).map((e) => e.libelle),
    sondesCassees: etapes.filter((e) => e.sondeCassee).map((e) => `${e.libelle} (${e.sondeCassee})`),
    manquantes: verifiables.filter((e) => !e.presente).map((e) => e.libelle),
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA SURVEILLANCE DU DISPOSITIF (Article 24)
// ————————————————————————————————————————————————————————————————————————

export function findProcessesWithoutGuardian({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.filter((p) => !p.gardien || !existsSync(join(root, p.gardien))).map((p) => p.nom);
}

export function findProcessDocsMissing({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.filter((p) => !p.doc || !existsSync(join(root, p.doc))).map((p) => `${p.nom} → ${p.doc ?? "aucun document déclaré"}`);
}

// LE POINT EXPLICITEMENT DEMANDÉ PAR L'UTILISATEUR (2026-09-22) : « c'est typiquement le travail du
// gardien de process que de veiller à ce que ce ne soit jamais le cas : grace aux process, tu
// n'oublies jamais rien ». Sans identité de session déposée, chaque rapport produit porte
// « Version de Claude : non renseignée » — honnête, mais c'est un trou qu'on ne devrait jamais voir.
export function checkAgentSessionDeclared({ session } = {}) {
  const s = session ?? readAgentSession();
  if (!s.model) {
    return { ok: false, message: `Identité de session absente : chaque rapport produit maintenant portera « Version de Claude : non renseignée ». À déposer une fois en début de session (recordAgentSession, ${SESSION_FILE}).` };
  }
  return { ok: true, message: `Identité de session déposée : ${s.model}${s.recordedAt ? ` (le ${s.recordedAt.slice(0, 10)})` : ""}.` };
}

// Deux process peuvent se contredire sans qu'aucun test ne le voie. Les tensions connues sont
// déclarées ici À LA MAIN — nature volontairement manuelle, écrite noir sur blanc comme l'Article 24
// l'exige pour ce cas : une contradiction entre deux textes ne se détecte pas mécaniquement, elle
// se constate en les lisant. Ce que le code garantit, lui, c'est que chaque tension déclarée porte
// bien sur deux process qui existent encore.
// L'AUTONOMIE NOCTURNE ÉLARGIE — politique posée par l'utilisateur le 2026-09-22, et son
// raisonnement mérite d'être conservé tel quel parce qu'il n'est pas évident :
//
//   « pourquoi te donner plus d'autonomie sur les choix de circle en mode lourd ? parce que c'est
//   précisément le moment opportun pour faire tourner les scans lourds (selon argument
//   périodicité) : en effet, ça prend du temps et moi je dors. »
//
// Autrement dit : le coût principal d'un scan lourd n'est pas son prix, c'est le TEMPS D'ATTENTE
// qu'il impose à l'utilisateur. La nuit, ce coût-là vaut zéro. Un arbitrage déraisonnable en
// journée devient donc le bon choix à trois heures du matin — ce n'est pas un relâchement de la
// règle, c'est la même règle appliquée à des conditions différentes.
//
// LA FRONTIÈRE EST NETTE, et c'est elle qui empêche que ça devienne un blanc-seing : les choix de
// CALIBRAGE SENSIBLES ne bougent pas d'un pouce. « Pour les choix sensibles de calibrage, on reste
// sur : tu attends. » Et consulter la suite Smart Conso reste obligatoire : l'autorisation porte
// sur le fait de CONSOMMER, jamais sur celui de sauter la consultation.
export const AUTONOMIE_NOCTURNE = {
  autorise: [
    "lancer un outil coûteux quand la périodicité le justifie — le temps d'attente, principal coût en journée, vaut zéro la nuit",
    "consommer de l'API réelle sans validation préalable, dans ce même cadre et ce cadre seul",
    "corriger soi-même une erreur découverte dans son propre travail de la nuit",
  ],
  interdit: [
    "tout choix de calibrage sensible — personnages, expérience du visiteur : ça attend, sans exception",
    "consommer sans avoir consulté la suite Smart Conso : l'autorisation porte sur le fait de consommer, jamais sur celui de sauter la consultation",
    "toute action après l'étape de vérification finale — ce seuil est terminal",
  ],
  pourquoi: "le coût principal d'un scan lourd est le temps d'attente qu'il impose à l'utilisateur ; la nuit ce coût vaut zéro, donc l'arbitrage change légitimement",
};

export const TENSIONS_CONNUES = [
  {
    entre: ["nuit", "simulation"],
    tension: "Le mode nocturne autorise à consommer de l'API sans validation ; le protocole de simulation exige une consultation préalable de Smart Conso API.",
    resolution: "Les deux tiennent ensemble : l'autorisation nocturne porte sur le fait de consommer, jamais sur le fait de sauter la consultation. Tranché par l'utilisateur le 2026-09-22 (« tu es quand meme autorisé à consommer des api, tout en respectant les conseils de smart conso api »).",
  },
  {
    entre: ["nuit", "ronde"],
    tension: "La Ronde exige une vraie fenêtre à cocher posée à l'utilisateur ; le mode nocturne se déroule en son absence.",
    resolution: "Une Ronde lancée en nuit autonome est explicitement dispensée de cette fenêtre — exemption déjà codée dans le gardien de la Ronde, jamais une entorse improvisée.",
  },
  {
    entre: ["nuit", "ronde"],
    tension: "La Ronde doit poser à l'utilisateur une fenêtre de réponses sur les points problématiques de son évaluation ; le mode nocturne se déroule en son absence.",
    // Tranchée le 2026-09-22, et c'est une résolution DIFFÉRENTE de celle de la fenêtre
    // AUTO/PRIME/GOAT juste au-dessus, qui est une vraie dispense. Ici l'absence ne dispense pas,
    // elle diffère : les points partent en attente avec leur date, et la Ronde suivante en sa
    // présence les pose en plus des siens. Sans ça, chaque nuit autonome mangerait sa voix en
    // silence, et le dispositif finirait par ne plus jamais l'interroger tout en paraissant tourner.
    resolution: "L'exemption nocturne est CONDITIONNELLE : les points problématiques sont reportés au prochain passage en sa présence (reporterPointsAuProchainPassage), jamais simplement sautés. Le gardien de la Ronde refuse une Ronde nocturne qui aurait des points à poser et n'aurait rien reporté.",
  },
];

export function findTensionsOnUnknownProcess({ tensions = TENSIONS_CONNUES, processes = PROCESSES } = {}) {
  const connus = new Set(processes.map((p) => p.slug));
  return tensions.flatMap((t) => t.entre.filter((s) => !connus.has(s)).map((s) => `${s} (cité dans une tension déclarée, mais n'est plus un process connu)`));
}

// L'AUTO-SURVEILLANCE, exécutable plutôt que promise. Un surveillant qui se contente de déclarer
// qu'il se surveille ne se surveille pas : ces cinq contrôles portent sur SON propre état, et
// tombent au rouge si le dispositif dérive — y compris s'il dérive par sa faute à lui.
export function selfCheck({ processes = PROCESSES, root = ROOT, tensions = TENSIONS_CONNUES } = {}) {
  const constats = [];
  const meta = processes.find((p) => p.slug === "meta");
  if (!meta) constats.push("god-of-all-process ne se surveille plus lui-même : le process maître a disparu de PROCESSES.");
  if (meta && meta.gardien !== "scripts/god-of-all-process.mjs") constats.push("le process maître a été confié à un autre gardien que god-of-all-process lui-même.");
  for (const m of findProcessesWithoutGuardian({ processes, root })) constats.push(`process sans gardien réel : ${m}`);
  for (const m of findProcessDocsMissing({ processes, root })) constats.push(`process sans document réel : ${m}`);
  for (const m of findBrokenProbes({ processes, root })) constats.push(`sonde cassée : ${m}`);
  for (const m of findTensionsOnUnknownProcess({ tensions, processes })) constats.push(`tension orpheline : ${m}`);
  // Une étape sans preuve est légitime ; une étape qui n'en déclare aucune ET dont personne ne dit
  // qu'elle est invérifiable serait un trou muet. Ici les deux sont le même champ (`preuve: null`),
  // donc rien à vérifier de plus — dit explicitement pour qu'un futur lecteur ne cherche pas en vain.
  const sansGardienDeSoi = !processes.some((p) => p.gardien === "scripts/god-of-all-process.mjs" && p.slug === "meta");
  return { ok: constats.length === 0 && !sansGardienDeSoi, constats };
}

// ————————————————————————————————————————————————————————————————————————
// QUELS SCRIPTS MÉRITERAIENT UN PROCESS ET N'EN ONT PAS
// ————————————————————————————————————————————————————————————————————————

// (2026-09-22, demande de l'utilisateur : « god of process devrait etre l'outil qui scanne si un
// script qui le merite n'a pas de process ».) Le critère, calibré le même jour : un outil MÉRITE un
// process quand son usage suit vraiment une suite d'étapes qu'on peut sauter — lancer une
// simulation, tenir une Ronde. Un outil qu'on lance d'une commande et qui répond (chercher dans un
// fichier, compter des tokens) n'a rien à déclarer, et ne doit jamais être puni pour ça.
//
// Ce que le code peut voir honnêtement : un script qui possède plusieurs SOUS-COMMANDES enchaînables
// ou qui ÉCRIT un artefact durable a, presque toujours, une suite d'étapes autour de lui. C'est un
// indice, jamais une preuve — d'où le mot « mériterait », et d'où le fait que rien ne se déclenche
// tout seul : c'est une liste à regarder, pas un reproche.
const INDICES_MERITE_PROCESS = [
  { marqueur: /process\.argv\[2\]/, indice: "plusieurs sous-commandes — donc un ordre dans lequel on les lance" },
  { marqueur: /writeFileSync\(/, indice: "écrit un artefact durable — donc un avant et un après" },
  { marqueur: /--confirm|--force|override/, indice: "prévoit un passage en force — donc une règle à respecter" },
];

// findActivitiesDeservingProcess() — TROIS TENTATIVES, TROIS ÉCHECS, et c'est le troisième qui a
// tranché la question (2026-09-22).
//
// L'utilisateur a choisi le bon critère : une activité mérite un process quand la rater COÛTE CHER
// et se voit trop tard. Restait à le mesurer, et c'est là que tout a échoué :
//   1. « plusieurs sous-commandes + écrit un fichier + passage en force » → 12 candidats, dont le
//      filet de tests. Ça décrit la FORME d'un script mature, pas l'enjeu d'une activité.
//   2. « consomme du quota + produit un livrable lu » → 19 candidats, PIRE. Le marqueur du livrable
//      attrapait `renderHtmlReport`, que tous les outils importent depuis leur migration.
//   3. « vrais appels sortants dans le texte » → check-spirit, l'outil qui fait SEIZE vrais appels
//      Gemini, sort à ZÉRO (il passe par lib/), pendant que check-house sort à 7 (ses bouchons de
//      test). Le marqueur rate exactement ce qu'il devait attraper.
//
// LA CONCLUSION, et elle est plus utile que l'outil qu'on cherchait : L'ENJEU EST UN JUGEMENT, PAS
// UNE MESURE. Rien dans le texte d'un script ne dit ce que son ratage coûte. S'obstiner aurait
// produit un quatrième marqueur adjacent, et un scan qui donne l'illusion d'une veille est pire
// qu'un scan absent.
//
// D'où la forme retenue : la liste est DÉCLARÉE (l'Article 24 l'autorise explicitement pour un
// contenu curaté à la main, à condition d'écrire noir sur blanc que c'est volontaire — ce que fait
// ce commentaire), et c'est le RÉEL qui la contrôle en sens inverse : toute activité déclarée à
// enjeu doit avoir un process, et findActivitiesWithoutProcess() le vérifie mécaniquement. Le
// jugement est humain, la vérification est mécanique — jamais l'inverse.
export const ACTIVITES_A_ENJEU = [
  { id: "simulation", activite: "Lancer une simulation Article 18", pourquoi: "une heure de vrai quota Gemini ; un ratage se repaie intégralement, et les défauts se voient après coup dans le journal" },
  { id: "ronde", activite: "Mener une Ronde CIRCLE-TASKS", pourquoi: "elle gouverne le déclenchement de tout le reste ; une Ronde bâclée laisse dormir des outils pendant des semaines sans que rien ne le dise" },
  { id: "nuit", activite: "Travailler en autonomie sans l'utilisateur", pourquoi: "personne ne peut corriger le tir avant le lendemain ; une erreur de cadrage coûte une nuit entière" },
  { id: "meta", activite: "Tenir le dispositif de process lui-même", pourquoi: "un surveillant qui dérive ne le dit jamais lui-même — c'est le seul point où l'absence de contrôle est structurellement invisible" },
  { id: "diagnostic-api", activite: "Sonder le quota Gemini (Smart Breaker)", pourquoi: "consomme de vrais appels pour un diagnostic ; lancé au mauvais moment, il aggrave le blocage qu'il mesure (Article 22)" },
  { id: "livraison-charte", activite: "Modifier CLAUDE.md ou un document de référence", pourquoi: "une règle affaiblie par erreur ne se voit pas — elle s'applique en silence pendant des semaines, et c'est le garde-fou non négociable de l'Article 13" },
];

// LE CONTRÔLE MÉCANIQUE, en sens inverse du jugement : chaque activité déclarée à enjeu a-t-elle
// réellement un process ? C'est cette fonction-là qui est vérifiable, jamais la liste elle-même.
export function findActivitiesWithoutProcess({ activites = ACTIVITES_A_ENJEU, processes = PROCESSES } = {}) {
  const couverts = new Set(Object.values(processes).map((p) => p.id ?? p.slug).filter(Boolean));
  const parNom = Object.values(processes).map((p) => String(p.nom ?? p.label ?? "").toLowerCase());
  return activites.filter((a) => {
    if (couverts.has(a.id)) return false;
    return !parNom.some((n) => n.includes(a.id) || a.activite.toLowerCase().split(" ").some((mot) => mot.length > 5 && n.includes(mot)));
  });
}

// Ancien nom conservé : plusieurs appelants (le rapport de conformité, les tests) l'utilisent, et le
// renommer sans raison casserait des renvois pour un gain nul. Il pointe désormais sur la version
// déclarée, jamais sur l'ancien scan de forme.
export function findScriptsDeservingProcess(opts = {}) {
  return findActivitiesWithoutProcess(opts).map((a) => ({ chemin: a.activite, indices: [a.pourquoi] }));
}

export const RESPONSABLES = {
  agent: "l'agent (moi) — étape prévue par le process et simplement pas faite",
  outil: "un outil — il devait produire quelque chose et ne l'a pas fait",
  personne: "personne — aucun mécanisme ne peut vérifier cette étape, elle repose sur la seule discipline",
};

// LA CHAÎNE RAPPORT → PLAN D'ACTION → TÂCHES (2026-09-22) — la moitié « god » du principe
// fondamental posé par l'utilisateur, celle qui CONSTATE le manque sans jamais le combler :
// « god dit : il y a un plan d'action, il faut mettre des tâches associées ».
//
// SON AUTORITÉ, tranchée explicitement : il SIGNALE FORT, il ne bloque JAMAIS. Le manquement est
// nommé, le responsable désigné, et il reste visible tant que ce n'est pas traité — donc impossible
// à oublier, mais rien ne s'arrête. Cohérent avec ce que god est : un référent qui constate, jamais
// un verrou. Un gardien qui bloquerait sur un sujet sans rapport avec le travail en cours pousserait
// justement à le contourner.
//
// LES TROIS MANQUEMENTS DE LA CHAÎNE, dans l'ordre où ils cassent le lien :
export const MANQUEMENTS_CHAINE = {
  "rapport-sans-plan": "un rapport a été produit et ne dit nulle part ce qu'on fait de ce qu'il a trouvé — le cas le plus grave, puisqu'un rapport produit ressemble à un problème traité",
  "constat-sans-tache": "un constat a été RETENU dans un plan d'action, donc jugé digne d'action, et aucune tâche ne le porte",
  "constat-ecarte-sans-raison": "un constat a été écarté sans raison écrite — ce n'est pas une décision, c'est un abandon déguisé",
};

// Vérifie la chaîne pour UN plan d'action, contre le vrai texte du suivi. Ne devine jamais : si le
// suivi n'est pas fourni, il le dit plutôt que de conclure que rien n'existe.
export function checkActionChain({ planDaction, suiviText, rapportProduit = true } = {}) {
  if (!rapportProduit) return { mesurable: true, manquements: [], note: "aucun rapport produit — rien à chaîner" };
  if (!planDaction) {
    return { mesurable: true, manquements: [{ type: "rapport-sans-plan", detail: MANQUEMENTS_CHAINE["rapport-sans-plan"], responsable: "agent" }] };
  }
  if (suiviText == null) {
    // Sans le texte du suivi, on peut voir qu'un constat n'a pas de tâche DÉCLARÉE, mais jamais
    // vérifier qu'une tâche déclarée existe vraiment. Deux questions différentes, et on ne répond
    // qu'à celle qu'on peut réellement trancher.
    return {
      mesurable: false,
      raison: "texte du suivi non fourni — on peut voir qu'un constat n'annonce aucune tâche, jamais vérifier qu'une tâche annoncée existe pour de vrai",
      manquements: (planDaction.sansTache ?? []).map((c) => ({ type: "constat-sans-tache", detail: `« ${c.constat} »`, responsable: "agent" })),
    };
  }
  const manquements = [];
  for (const c of planDaction.retenus ?? []) {
    if (!c.tache) { manquements.push({ type: "constat-sans-tache", detail: `« ${c.constat} » — retenu, donc jugé digne d'action, et rien ne le porte`, responsable: "agent" }); continue; }
    // La tâche annoncée existe-t-elle VRAIMENT dans le suivi ? Une référence à une tâche qui
    // n'existe pas est pire qu'une absence : elle ressemble à un lien.
    const numero = String(c.tache).match(/#?(\d+)/)?.[1];
    const presente = numero ? new RegExp(`\\|\\s*${numero}\\s*\\|`).test(suiviText) : suiviText.includes(String(c.tache));
    if (!presente) manquements.push({ type: "constat-sans-tache", detail: `« ${c.constat} » annonce la tâche ${c.tache}, qui n'existe pas dans le suivi — une référence morte ressemble à un lien, ce qui est pire qu'une absence`, responsable: "agent" });
  }
  return { mesurable: true, manquements };
}

export function actionChainLines(resultats = []) {
  const tous = resultats.flatMap((r) => (r.manquements ?? []).map((m) => ({ ...m, source: r.source })));
  const nonMesurables = resultats.filter((r) => r.mesurable === false);
  const l = ["— Chaîne rapport → plan d'action → tâches (god-of-all-process) —"];
  if (!tous.length && !nonMesurables.length) {
    l.push("✅ Chaque rapport produit porte son plan d'action, et chaque constat retenu porte sa tâche.");
    return l;
  }
  if (tous.length) {
    l.push(`${tous.length} maillon(s) rompu(s) — signalés, jamais bloquants :`);
    for (const m of tous) l.push(`  ✗ [${m.responsable}] ${m.source ? `${m.source} : ` : ""}${m.detail}`);
  }
  for (const r of nonMesurables) l.push(`  ? ${r.source ?? "chaîne"} — non vérifiable : ${r.raison}`);
  return l;
}

export function buildProcessComplianceReport({ processes = PROCESSES, root = ROOT, verdictsSecondaires = [], sectionAngel, chainesAction = [] } = {}) {
  const lignes = [];
  const manquements = [];
  for (const p of processes) {
    const av = processProgress(p.slug, { processes, root });
    for (const libelle of av.manquantes) manquements.push({ process: p.nom, etape: libelle, responsable: "agent" });
    for (const libelle of av.sansTrace) manquements.push({ process: p.nom, etape: libelle, responsable: "personne" });
  }
  // Les verdicts des gardiens secondaires sont RELAYÉS, jamais recalculés : chacun sait juger son
  // domaine mieux que god ne le ferait, et un second calcul divergerait tôt ou tard.
  for (const v of verdictsSecondaires) {
    if (v?.ok === false) manquements.push({ process: v.process ?? "process secondaire", etape: v.detail ?? "verdict négatif de son gardien", responsable: v.responsable ?? "outil", relaye: v.gardien });
  }
  const fautes = manquements.filter((m) => m.responsable !== "personne");
  lignes.push(fautes.length ? `⚠️ ${fautes.length} manquement(s) réel(s) au process :` : "✅ Aucun manquement réel au process sur ce qui est vérifiable.");
  for (const m of fautes) lignes.push(`  · ${m.process} — « ${m.etape} »\n      responsable : ${RESPONSABLES[m.responsable] ?? m.responsable}${m.relaye ? ` (relayé par ${m.relaye}, jamais recalculé ici)` : ""}`);
  const nonVerifiables = manquements.filter((m) => m.responsable === "personne");
  if (nonVerifiables.length) {
    lignes.push("", `${nonVerifiables.length} étape(s) que rien ne peut vérifier — ni reprochées à personne, ni comptées comme faites :`);
    for (const m of nonVerifiables) lignes.push(`  · ${m.process} — « ${m.etape} »`);
  }
  // LA CONDUITE, dans une section clairement à part (décision de l'utilisateur, 2026-09-22) : une
  // seule voix à la Ronde, mais la discipline de l'agent ne se mélange jamais aux étapes de process
  // sautées — ce sont deux natures différentes, et les fondre rendrait les deux illisibles. Relayé
  // depuis angel, jamais recalculé ici, exactement comme les verdicts des autres gardiens.
  if (sectionAngel && sectionAngel.length) lignes.push("", ...sectionAngel);
  // LA CHAÎNE RAPPORT → PLAN D'ACTION → TÂCHES, dans sa propre section (2026-09-22). Signalée fort,
  // jamais bloquante : c'est l'autorité que l'utilisateur a explicitement donnée à god sur ce point.
  lignes.push("", ...actionChainLines(chainesAction));
  const sansProcess = findActivitiesWithoutProcess({ processes });
  if (sansProcess.length) {
    lignes.push("", `${sansProcess.length} activité(s) DÉCLARÉE(S) à enjeu et sans process :`);
    for (const a of sansProcess) lignes.push(`  · ${a.activite} — ${a.pourquoi}`);
  }
  return { lignes, manquements, fautes: fautes.length, scriptsSansProcess: sansProcess.length, texte: lignes.join("\n") };
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT
// ————————————————————————————————————————————————————————————————————————

export function buildGodReportBlocks({ processes = PROCESSES, root = ROOT, session } = {}) {
  const blocks = [];
  const auto = selfCheck({ processes, root });
  blocks.push({ type: "note", text: auto.ok ? "✅ Process maître : god-of-all-process se surveille bien lui-même, et le dispositif est cohérent." : `⚠️ Process maître — ${auto.constats.length} constat(s) sur le dispositif lui-même :\n  ${auto.constats.join("\n  ")}` });
  const identite = checkAgentSessionDeclared({ session });
  blocks.push({ type: "note", text: `${identite.ok ? "✅" : "⚠️"} ${identite.message}` });

  // L'ARRÊT PRÉMATURÉ, affiché dans le rapport de god et pas seulement calculable (2026-09-23).
  // Sans cette sortie, le garde-fou construit contre l'arrêt prématuré serait lui-même muet —
  // L2 commise dans le mécanisme écrit pour l'empêcher.
  const planDeNuit = latestNightPlan();
  if (planDeNuit) {
    const arret = findArretPremature({ planPath: planDeNuit.chemin, suiviTexte: planDeNuit.suivi });
    if (arret.mesure === "mesuré") {
      blocks.push({ type: "note", text: `${arret.restants.length ? "⚠️" : "✅"} Nuit autonome (${planDeNuit.chemin}) — ${arret.clos}/${arret.total} chantier(s) clos. ${arret.verdict}` });
      for (const r of arret.restants.slice(0, 20)) blocks.push({ type: "note", text: `     · reste : ${r}` });
    }
  }

  // LA CONNEXION PROCESS ↔ GARDIEN, ENFIN LIVRÉE (2026-09-23, tâche #218).
  //
  // Ce mécanisme répond à une demande explicite de l'utilisateur du 2026-09-23 : « assure-toi qu'un
  // mécanisme vérifie que tout est toujours bien présent dans le process ET chez son gardien ». Il
  // a été construit ce matin-là, il fonctionne… et il n'était appelé par personne. Pire : un
  // commentaire de circle-process-guardian.mjs affirmait « Il est VÉRIFIÉ, jamais déclaratif », une
  // vérification revendiquée par écrit avec rien derrière.
  //
  // C'est la forme la plus coûteuse du défaut traqué toute cette journée : non pas un mécanisme
  // oublié, mais un mécanisme demandé, construit, documenté, revendiqué — et muet.
  //
  // LES DEUX SENS NE SE VALENT PAS, et les confondre ferait perdre l'essentiel :
  //   · écrit dans le DOCUMENT, absent du GARDIEN → une règle qu'on croit tenue et que rien ne fait
  //     respecter ;
  //   · câblé dans le GARDIEN, absent du DOCUMENT → une règle qu'on fait respecter sans l'avoir
  //     écrite : elle tient tant que l'agent qui l'a posée est là, et pas une session de plus
  //     (Article 27).
  const connexions = etatConnexionProcessGardien({ processes, root });
  const nonMesures = connexions.filter((c) => c.mesure !== "mesuré");
  const ecarts = connexions.filter((c) => c.mesure === "mesuré" && (c.docSeul.length || c.gardienSeul.length));
  blocks.push({
    type: "note",
    text: ecarts.length === 0 && nonMesures.length === 0
      ? "✅ Connexion process ↔ gardien : chaque mécanisme écrit dans un document est câblé chez son gardien, et réciproquement."
      : [
          `⚠️ Connexion process ↔ gardien — ${ecarts.length} process avec des écarts sur ${connexions.length} :`,
          ...ecarts.map((c) => `  · ${c.process} : ${c.docSeul.length} mécanisme(s) écrit(s) dans ${c.doc} que ${c.gardien} ne fait PAS respecter${c.docSeul.length ? ` (${c.docSeul.slice(0, 4).join(", ")}${c.docSeul.length > 4 ? "…" : ""})` : ""} ; ${c.gardienSeul.length} câblé(s) chez le gardien et jamais écrit(s)${c.gardienSeul.length ? ` (${c.gardienSeul.slice(0, 4).join(", ")}${c.gardienSeul.length > 4 ? "…" : ""})` : ""}.`),
          // L'absence de mesure se DIT, elle ne se rend jamais comme une conformité.
          ...nonMesures.map((c) => `  · ${c.process} : PAS MESURÉ — ${c.mesure}. Ce silence ne dit rien sur la connexion, il dit qu'on n'a pas pu la regarder.`),
        ].join("\n"),
  });

  const lignes = processes.map((p) => {
    const av = processProgress(p.slug, { processes, root });
    return `· ${p.nom} — ${av.presentes}/${av.verifiables} étape(s) vérifiable(s) tracée(s)${av.manquantes.length ? ` — manque : ${av.manquantes.join(" ; ")}` : ""}${av.sansTrace.length ? ` — ${av.sansTrace.length} étape(s) sans trace vérifiable, jamais comptée(s) ni dans un sens ni dans l'autre` : ""}`;
  });
  blocks.push({ type: "note", text: `Process suivis (${processes.length}) :\n${lignes.join("\n")}` });

  // La conduite, récupérée par god plutôt qu'attendue. `recordFunctionUsage` enregistre cet appel
  // comme un usage RÉEL d'angel (origine « fonction », ajoutée le même jour) : jusqu'ici, seuls les
  // lancements en ligne de commande étaient comptés, ce qui faisait afficher « 0 sollicitation »
  // pour un outil qui aurait dû parler à chaque Ronde.
  try {
    const auditConduite = auditWorkingRules({ root });
    recordFunctionUsage("angel-of-ia-process", "auditWorkingRules", { foundSomething: auditConduite.manquements?.length > 0 });
    const section = angelSectionLines(auditConduite);
    if (section?.length) blocks.push({ type: "note", text: section.join("\n") });
  } catch (e) {
    // Jamais bloquant, et jamais silencieux : un relais cassé se DIT, sinon god rendrait un rapport
    // amputé qui a l'air complet — exactement le défaut qu'on vient de corriger.
    blocks.push({ type: "note", text: `⚠️ Section conduite indisponible : angel-of-ia-process n'a pas pu être relayé (${e.message}). Le rapport est incomplet, il n'est pas vert.` });
  }

  // LA MODIFICATION INDIRECTE NON SUIVIE (2026-09-23) — sort dans le rapport, sinon le mécanisme
  // resterait une intention, ce que ce fichier a déjà appris à ses dépens.
  const indirects = findChangementsIndirectsSansMiseAJour({ processes, root });
  const impayes = indirects.filter((e) => !e.rattrape);
  blocks.push({ type: "note", text: indirects.length
    ? `${impayes.length ? "⚠️" : "🟡"} ${impayes.length} dette(s) documentaire(s) IMPAYÉE(S)${indirects.length > impayes.length ? `, ${indirects.length - impayes.length} rattrapée(s) depuis (en retard, mais réglée)` : ""} :\n  ${indirects.map((e) => `${e.commit} — ${e.pourquoi}`).join("\n  ")}`
    : "✅ Modifications indirectes : chaque changement du code d'un process a bien mis à jour son document dans le même commit." });

  // LE GABARIT (2026-09-23) — sort dans le rapport pour la même raison que le bloc ci-dessus : un
  // modèle qu'on écrit sans jamais confronter les documents à lui n'est qu'une préférence de mise en
  // page. À sa première exécution il a trouvé 8 réponses manquantes dans 5 documents, dont 3 dans un
  // document de process écrit vingt minutes plus tôt.
  const horsGabarit = findProcessHorsGabarit({ processes, root });
  blocks.push({ type: "note", text: horsGabarit.length
    ? `⚠️ ${horsGabarit.length} réponse(s) manquante(s) au gabarit de process (docs/gabarits/process.md) :\n  ${horsGabarit.map((e) => `${e.process} (${e.doc}) — ${e.quoi}`).join("\n  ")}`
    : "✅ Gabarit de process : chaque document déclaré répond aux cinq questions du modèle (ce qu'il empêche, son déclencheur, ses étapes et leurs preuves, son contrôleur nommé, ses limites). Présence vérifiée, jamais la qualité de la réponse." });

  const sansGardien = findProcessesWithoutGuardian({ processes, root });
  const docsAbsents = findProcessDocsMissing({ processes, root });
  const tensionsOrphelines = findTensionsOnUnknownProcess({ processes });
  for (const [titre, liste] of [
    ["Process sans gardien", sansGardien],
    ["Process dont le document déclaré n'existe pas", docsAbsents],
    ["Tensions déclarées sur un process disparu", tensionsOrphelines],
    ["Sondes cassées (défaut de CET outil, jamais du travail surveillé)", findBrokenProbes({ processes, root })],
  ]) {
    blocks.push({ type: "note", text: liste.length ? `⚠️ ${titre} (${liste.length}) :\n  ${liste.join("\n  ")}` : `✅ ${titre} : aucun.` });
  }

  blocks.push({ type: "note", text: `Tensions connues entre process (${TENSIONS_CONNUES.length}), déclarées à la main et résolues :\n${TENSIONS_CONNUES.map((t) => `· ${t.entre.join(" ↔ ")} — ${t.tension}\n  → ${t.resolution}`).join("\n")}` });
  return blocks;
}

// ————————————————————————————————————————————————————————————————————————
// LA PLANCHE DES SCHÉMAS (2026-09-23, demande explicite de l'utilisateur)
// ————————————————————————————————————————————————————————————————————————
//
// SA DEMANDE, mot pour mot : « quels schémas sont incomplets, ou peuvent etre etendus au debut ou
// à la fin, quels schemas integrent d'autres schemas, quel est le schema global, quels sont les
// schemas maitres », puis « je veux que tu me partages les schemas pertinents sur lesquels je peux
// travailler tout seul, de mon coté » et « il doit etre chez god la ou les schemas qui
// m'interessent se cachent surement ».
//
// LE DÉFAUT QU'ELLE FERME, et il était réel : le schéma maître existait en DONNÉE depuis la veille
// (SCHEMA_DE_REFERENCE) et se dérivait correctement via schemaUnifie() — mais AUCUN document ne le
// MONTRAIT. L'utilisateur l'a cherché et ne l'a pas trouvé : « je n'ai pas trouvé mon bonheur ».
// Une donnée juste que personne ne peut lire vaut, pour qui la cherche, exactement une donnée
// absente. C'est la même famille que la Partie 13 du process XP-IA : écrire n'est pas livrer.
//
// POURQUOI ÇA VIT ICI ET PAS DANS UN DOCUMENT ÉCRIT À LA MAIN : c'est son choix explicite, et il
// est conforme à l'Article 24. Une planche recopiée à la main aurait divergé au premier process
// ajouté — exactement ce qui était déjà arrivé aux trois recopies en prose du schéma unifié.

// LES EMBOÎTEMENTS ENTRE PROCESS (déclarés, parce qu'ils ne sont déductibles d'aucun diff).
//
// DEUX MÉCANIQUES QUI NE SE CONFONDENT JAMAIS, et c'est la distinction utile :
//   · ORCHESTRE — le process A lance le process B en entier, du début à la fin. B garde sa forme.
//   · GREFFE    — le process A s'insère à des MOMENTS à l'intérieur de B, sans lancer B ni en
//                 faire partie. Plus fragile : une greffe dépend d'un moment qui arrive, pas d'une
//                 étape qu'on coche — c'est pour ça qu'angel doit la DEMANDER faute de pouvoir la lire.
//   · SURVEILLE — le process A vérifie la tenue de B sans jamais l'exécuter.
export const EMBOITEMENTS = [
  { de: "meta", type: "surveille", vers: ["ronde", "analyse-charte", "simulation", "semi-autonome", "nuit", "meta", "integration-outil", "integration-ronde", "xp-ia", "etat-des-taches"],
    pourquoi: "le process maître vérifie que chaque process a son document, son contrôleur et ses sondes — y compris lui-même (selfCheck), parce qu'un surveillant que personne ne surveille dérive sans que rien ne le dise." },
  { de: "nuit", type: "orchestre", vers: ["ronde", "simulation"],
    pourquoi: "la nuit n'a aucune mesure propre : elle fait tourner la Ronde en mode lourd et, si la périodicité le justifie, une simulation — puis traite leurs plans d'action." },
  { de: "semi-autonome", type: "orchestre", vers: ["ronde", "analyse-charte", "simulation", "integration-outil", "integration-ronde", "etat-des-taches"],
    pourquoi: "un MODE n'est pas un travail : il décide de la façon d'enchaîner des process qui, eux, produisent quelque chose. D'où ses quatre maillons sans objet." },
  { de: "ronde", type: "contient", vers: ["xp-ia"],
    pourquoi: "l'analyse de période du process XP-IA se fait À la Ronde, et c'est là que l'utilisateur dit quelles leçons ont été réellement APPLIQUÉES." },
  { de: "xp-ia", type: "greffe", vers: ["ronde", "analyse-charte", "simulation", "semi-autonome", "nuit", "integration-outil", "integration-ronde", "etat-des-taches"],
    pourquoi: "ses trois moments déclencheurs (un garde-fou bloque, la fin d'un compte rendu, chaque Ronde) surviennent PENDANT n'importe quel autre process, jamais à sa place." },
  { de: "integration-outil", type: "appele-depuis", vers: ["semi-autonome", "nuit"],
    pourquoi: "jamais lancé pour lui-même : il se déclenche au milieu d'un travail, quand un outil neuf rejoint l'équipe." },
  { de: "integration-ronde", type: "appele-depuis", vers: ["ronde", "integration-outil"],
    pourquoi: "même nature : il se déclenche quand un item entre dans la Ronde, typiquement parce qu'un outil vient d'être intégré." },
];

// GARDE-FOU (Article 24, même patron que findTensionsOnUnknownProcess) : un emboîtement qui nomme
// un process disparu est une carte fausse, et une carte fausse rassure à tort.
export function findEmboitementsSurProcessInconnu({ emboitements = EMBOITEMENTS, processes = PROCESSES } = {}) {
  const connus = new Set(processes.map((p) => p.slug));
  const ecarts = [];
  for (const e of emboitements) {
    if (!connus.has(e.de)) ecarts.push(`${e.de} → (source inconnue)`);
    for (const v of e.vers) if (!connus.has(v)) ecarts.push(`${e.de} ${e.type} ${v} (cible inconnue)`);
  }
  return ecarts;
}

// LES DEUX EXTENSIONS CANDIDATES DU SCHÉMA MAÎTRE — À TRANCHER, jamais appliquées d'office.
//
// CE QU'ELLES SONT : le schéma maître va de SCAN à TÂCHES. Les huit maillons ci-dessous existent
// DÉJÀ dans le travail réel et sont DÉJÀ exigés par des Articles — ils ne sont simplement pas dans
// le schéma, donc rien ne vérifie qu'ils sont branchés. Les inscrire ici les rend visibles sans
// les imposer : l'état « à trancher » de l'Article 28, tenu plutôt que raconté.
//
// LE CONSTAT QUI LES MOTIVE, et il est du même type que celui qui a créé l'Article 28 un cran plus
// tôt : cet Article a fermé « un rapport écrit ressemble à un problème traité ». Personne n'a
// fermé la suite — UNE TÂCHE CRÉÉE RESSEMBLE À UN PROBLÈME TRAITÉ. La chaîne s'arrête au moment
// où elle inscrit la tâche dans docs/suivi/, et ce qu'elle devient ensuite n'est porté par aucun schéma.
export const EXTENSIONS_CANDIDATES = {
  statut: "À TRANCHER — proposées le 2026-09-23, jamais appliquées sans l'arbitrage de l'utilisateur",
  amont: [
    { maillon: "declencheur", libelle: "DÉCLENCHEUR", quoi: "ce qui fait partir ce process", dejaExigePar: "le gabarit de process (EXIGENCES_GABARIT_PROCESS), mais pas le schéma" },
    { maillon: "cadrage", libelle: "CADRAGE", quoi: "demander quel process gouverne ce qu'on s'apprête à faire", dejaExigePar: "Article 26 — « avant un gros travail, demander à god quel process s'applique »" },
    { maillon: "budget", libelle: "BUDGET", quoi: "consulter Smart Conso API / SMART-CONSO-TOKEN avant toute action coûteuse", dejaExigePar: "Article 22" },
    { maillon: "memoire", libelle: "MÉMOIRE", quoi: "ressortir les leçons applicables et la mémoire des opérations AVANT d'agir", dejaExigePar: "process XP-IA (maillon 4) ; le process analyse-charte porte déjà l'étape `memoire`" },
  ],
  aval: [
    { maillon: "execution", libelle: "EXÉCUTION", quoi: "la tâche est FAITE, pas seulement créée", dejaExigePar: "RIEN — c'est le trou" },
    { maillon: "verification", libelle: "VÉRIFICATION", quoi: "y revenir à froid, avec les outils, pas de mémoire", dejaExigePar: "Article 25" },
    { maillon: "jugement", libelle: "JUGEMENT PAR L'UTILISATEUR", quoi: "« c'est moi à la fin qui te dis si elle est propre »", dejaExigePar: "process XP-IA (jugement-utilisateur, parUtilisateur: true)" },
    { maillon: "capitalisation", libelle: "CAPITALISATION", quoi: "« y avait-il quelque chose à retenir ? » — « rien à retenir » étant une réponse pleine", dejaExigePar: "process XP-IA, trois moments déclencheurs" },
  ],
};

// LA PLANCHE ELLE-MÊME. Tout y est DÉRIVÉ : ajouter un process, un maillon ou un emboîtement le
// fait apparaître sans que personne n'ait à toucher cette fonction.
export function planchesDesSchemas({ processes = PROCESSES, schema = SCHEMA_DE_REFERENCE, emboitements = EMBOITEMENTS, extensions = EXTENSIONS_CANDIDATES, tensions = TENSIONS_CONNUES, root = ROOT } = {}) {
  const L = [];
  const etats = etatDuSchema({ processes, schema });
  const parSlug = new Map(etats.map((e) => [e.process, e]));

  L.push("# La planche des schémas de process", "");
  L.push("*Générée par `node scripts/god-of-all-process.mjs schemas` — dérivée des données de god,");
  L.push("jamais recopiée à la main. Un process ajouté demain y apparaît sans que personne n'y pense.*", "");

  L.push("## 1. Le schéma maître — la FORME", "");
  L.push("```", schemaUnifie(schema), "```", "");
  for (const m of schema) {
    L.push(`- **${m.libelle ?? m.maillon.toUpperCase()}**${m.bifurcation ? " *(bifurcation, pas une étape de la file)*" : ""} — ${m.quoi}.`);
    L.push(`  - *Sans lui :* ${m.sansQuoi}`);
  }
  L.push("");
  L.push("**Ce qu'il est, et ce qu'il n'est pas.** Une ressemblance de famille, jamais une loi : là où un");
  L.push("process écrit diffère du schéma, c'est LE PROCESS qui fait foi — lui a été calibré étape par");
  L.push("étape. Un maillon absent n'est jamais une faute en soi, il se DÉCLARE avec sa raison.", "");

  L.push("## 2. Les trois « maîtres », qui ne sont pas la même chose", "");
  L.push("| | Quoi | Où | Ce qu'il gouverne |");
  L.push("|---|---|---|---|");
  L.push("| **Le schéma maître** | la FORME | `SCHEMA_DE_REFERENCE` | une ressemblance de famille |");
  L.push("| **Le process maître** | la TENUE du dispositif | process `meta` | que chaque process ait document, contrôleur, sondes |");
  L.push("| **La chaîne maîtresse** | l'OBLIGATION | Article 28 | `rapport → analyse → plan d'action → tâches` |");
  L.push("");

  L.push(`## 3. Les ${processes.length} process, et leur distance au schéma`, "");
  for (const p of processes) {
    const e = parSlug.get(p.slug);
    const absents = (e?.maillons ?? []).filter((m) => m.etat !== "présent");
    L.push(`### \`${p.slug}\` — ${p.nom}`, "");
    L.push(`- **Écrit dans** : \`${p.doc}\` · **surveillé par** : \`${p.gardien}\``);
    L.push(`- **Déclencheur** : ${p.quand ?? "non déclaré"}`);
    L.push(`- **${p.etapes.length} étapes** : ${p.etapes.map((s) => s.cle).join(" → ")}`);
    if (!absents.length) L.push("- **Schéma maître** : ✅ les six maillons sont présents.");
    else {
      L.push(`- **Schéma maître** : ${absents.length} maillon(s) absent(s), tous déclarés :`);
      for (const a of absents) L.push(`  - **${a.maillon}** — *${a.pourquoi ?? "sans raison déclarée — c'est un écart"}*`);
    }
    L.push("");
  }

  L.push("## 4. Les emboîtements — quel schéma en contient un autre", "");
  L.push("Trois mécaniques, jamais confondues : **orchestre** (lance l'autre en entier) ·");
  L.push("**greffe** (s'insère à des moments à l'intérieur de l'autre) · **surveille** (vérifie sans exécuter).", "");
  L.push("```");
  for (const e of emboitements) {
    const fleche = { surveille: "surveille", orchestre: "ORCHESTRE", contient: "contient", greffe: "SE GREFFE SUR", "appele-depuis": "appelé depuis" }[e.type] ?? e.type;
    L.push(`${e.de.padEnd(18)} ── ${fleche} ──> ${e.vers.join(", ")}`);
  }
  L.push("```", "");
  for (const e of emboitements) L.push(`- **${e.de}** ${e.type} — ${e.pourquoi}`);
  L.push("");

  L.push("## 5. Les deux extensions candidates — À TRANCHER, jamais appliquées d'office", "");
  L.push(`*Statut : ${extensions.statut}*`, "");
  L.push("Le schéma maître va de SCAN à TÂCHES. Les huit maillons ci-dessous **existent déjà dans le");
  L.push("travail réel** et sont **déjà exigés par des Articles** — ils ne sont simplement pas dans le");
  L.push("schéma, donc rien ne vérifie qu'ils sont branchés.", "");
  L.push("**AMONT** — avant SCAN :", "");
  L.push("| Maillon | Ce que c'est | Déjà exigé par |", "|---|---|---|");
  for (const m of extensions.amont) L.push(`| **${m.libelle}** | ${m.quoi} | ${m.dejaExigePar} |`);
  L.push("", "**AVAL** — après TÂCHES :", "");
  L.push("| Maillon | Ce que c'est | Déjà exigé par |", "|---|---|---|");
  for (const m of extensions.aval) L.push(`| **${m.libelle}** | ${m.quoi} | ${m.dejaExigePar} |`);
  L.push("");
  L.push("**Le constat qui les motive.** L'Article 28 a fermé « un rapport écrit ressemble à un problème");
  L.push("traité ». Personne n'a fermé la suite : **une tâche créée ressemble à un problème traité.**");
  L.push("La chaîne s'arrête au moment où elle inscrit la tâche, et ce qu'elle devient ensuite n'est");
  L.push("porté par aucun schéma.", "");
  L.push("**Le schéma étendu, si les deux bouts étaient retenus** *(14 maillons)* :", "");
  L.push("```");
  L.push([...extensions.amont.map((m) => m.libelle), ...schema.map((m) => m.libelle ?? m.maillon.toUpperCase()), ...extensions.aval.map((m) => m.libelle)].join(SCHEMA_SEPARATEUR));
  L.push("```", "");

  L.push("## 6. Les activités à enjeu qui n'ont AUCUN process", "");
  const sans = findActivitiesWithoutProcess({ processes });
  if (!sans.length) L.push("Aucune.", "");
  else { for (const a of sans) L.push(`- **${a.activite}** (\`${a.id}\`) — ${a.pourquoi}`); L.push(""); }

  L.push("## 7. Les tensions déclarées entre process", "");
  for (const t of tensions) { L.push(`- **${t.entre.join(" ↔ ")}** — ${t.tension}`); L.push(`  - *Résolution :* ${t.resolution}`); }
  L.push("");

  const ecarts = findEmboitementsSurProcessInconnu({ emboitements, processes });
  L.push("## 8. Auto-contrôle de cette planche", "");
  L.push(ecarts.length ? `⚠️ ${ecarts.length} emboîtement(s) nommant un process inconnu :\n  - ${ecarts.join("\n  - ")}` : "✅ Tout process nommé dans un emboîtement existe réellement.");
  L.push("");
  L.push("**Ce que cette planche ne dit PAS** : si un process est BON. Elle décrit des formes et des");
  L.push("liens ; juger qu'un process sert vraiment à quelque chose se lit, et se tranche avec l'utilisateur.");
  return L.join("\n");
}

function main() {
  printReliabilityNotice("god-of-all-process");
  recordCliUsage("god-of-all-process");
  const tache = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ");
  // LA PLANCHE DES SCHÉMAS, à la demande. Sortie sur la sortie standard plutôt qu'écrite d'office :
  // un fichier généré à chaque appel se périmerait dès que quelqu'un oublierait de le relancer, et
  // l'utilisateur a demandé qu'elle vive CHEZ GOD, pas dans une copie de plus (Article 24).
  if (tache === "schemas") {
    console.log(planchesDesSchemas());
    return;
  }
  if (tache) {
    const trouves = whichProcess(tache);
    console.log(`=== god-of-all-process — pour : "${tache}" ===\n`);
    if (!trouves.length) {
      console.log("Aucun process connu ne gouverne cette tâche — ce qui ne prouve pas qu'il n'en faut pas un, seulement qu'aucun n'est écrit.");
      return;
    }
    for (const p of trouves) {
      const av = processProgress(p.slug);
      console.log(`${p.nom}\n  écrit dans : ${p.doc}\n  surveillé par : ${p.gardien}\n  étapes :`);
      for (const e of av.etapes) {
        const etat = !e.verifiable ? "  (aucune trace vérifiable — à confirmer soi-même)" : e.presente ? "✔" : "✗";
        console.log(`    ${etat} ${e.libelle}`);
      }
      console.log("");
    }
    return;
  }
  console.log("=== god-of-all-process — état du dispositif ===\n");
  for (const b of buildGodReportBlocks()) console.log(b.text, "\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
