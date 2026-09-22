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
    slug: "simulation",
    nom: "Simulation intégrale (Article 18)",
    quand: "lancer une simulation complète de bout en bout et l'analyser",
    motsCles: ["simulation", "simu", "full_sim", "article 18", "transcript", "dossier retourné"],
    doc: "docs/regles-de-travail.md",
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
      { cle: "script", libelle: "rédiger le script de simulation selon la norme (sous-process dédié)", preuve: { dossier: "docs/simulations/scripts/", motif: /\.md$|\.mjs$/ } },
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
      { cle: "memoire", libelle: "contrôler la mémoire narrative persistée après la partie (memory-audit)", preuve: { dossier: "docs/memory-audit/", motif: /\.md$/ } },
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
  // (sinon l'outil arrive trop tard, quand les oublis sont déjà des échecs), les dix registres
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
      { cle: "registres", libelle: "les dix registres obligatoires sont renseignés (planDIntegration le dit, registre par registre)", preuve: { fichier: "scripts/integration-outil.mjs" } },
      { cle: "documents", libelle: "blueprint générique + instanciation + registre avec index existent réellement", preuve: null },
      { cle: "lancement-reel", libelle: "l'outil a TOURNÉ contre le vrai dépôt avant d'être considéré fini (Article 25)", preuve: null },
      { cle: "tests", libelle: "ses fonctions mécaniques sont couvertes par check-house.mjs", preuve: { fichier: "scripts/check-house.mjs" } },
      { cle: "suivi", libelle: "la tâche est documentée dans docs/suivi/ dans LE MÊME commit", preuve: null },
    ],
  },
];

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
export function mecanismesDuProcess(p, { root = ROOT, readFileImpl = readFileSync } = {}) {
  const docTexte = p.doc ? lireTexte(join(root, p.doc), readFileImpl) : null;
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
      mecanismes.push({ nom, fichier: src, dansDoc: cible.test(docTexte), dansGardien: cible.test(gardienTexte) });
    }
  }
  return { sources: [...sources], mecanismes, docTexte, gardienTexte };
}

// SENS 1 — écrit dans le process, ignoré du gardien. Le cas réel du 2026-09-23.
export function findMecanismesAbsentsDuGardien({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync } = {}) {
  const manques = [];
  for (const p of processes) {
    if (!p.doc || !p.gardien) continue;
    const { mecanismes } = mecanismesDuProcess(p, { root, readFileImpl });
    for (const m of mecanismes) {
      if (m.dansDoc && !m.dansGardien) manques.push({ process: p.slug ?? p.nom, gardien: p.gardien, mecanisme: m.nom, fichier: m.fichier });
    }
  }
  return manques;
}

// SENS 2 — câblé dans le gardien, absent du document. Une règle qu'on fait respecter sans l'avoir
// écrite : elle tient tant que l'agent qui l'a posée est là, et pas une session de plus.
export function findMecanismesAbsentsDuDocument({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync } = {}) {
  const manques = [];
  for (const p of processes) {
    if (!p.doc || !p.gardien) continue;
    const { mecanismes } = mecanismesDuProcess(p, { root, readFileImpl });
    for (const m of mecanismes) {
      if (m.dansGardien && !m.dansDoc) manques.push({ process: p.slug ?? p.nom, doc: p.doc, mecanisme: m.nom, fichier: m.fichier });
    }
  }
  return manques;
}

// LE VERDICT LISIBLE, process par process : combien de mécanismes des deux côtés, combien d'un seul.
// Jamais un pourcentage vert sur un dénominateur vide — zéro mécanisme trouvé se DIT (« pas
// mesuré »), il ne se rend jamais comme une conformité.
export function etatConnexionProcessGardien({ processes = PROCESSES, root = ROOT, readFileImpl = readFileSync } = {}) {
  return processes.filter((p) => p.doc && p.gardien).map((p) => {
    const { sources, mecanismes } = mecanismesDuProcess(p, { root, readFileImpl });
    const partages = mecanismes.filter((m) => m.dansDoc && m.dansGardien);
    const docSeul = mecanismes.filter((m) => m.dansDoc && !m.dansGardien);
    const gardienSeul = mecanismes.filter((m) => !m.dansDoc && m.dansGardien);
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
export const SCHEMA_DE_REFERENCE = [
  { maillon: "scan", quoi: "produire une mesure réelle sur l'état des choses", sansQuoi: "l'analyse porterait sur une impression" },
  { maillon: "rapports", quoi: "écrire ET LIVRER ce que le scan a trouvé", sansQuoi: "seul l'agent sait ce qui a été vu (Partie 13 : écrire n'est pas livrer)" },
  { maillon: "analyse", quoi: "trier ce qui compte de ce qui ne compte pas", sansQuoi: "un tas de constats bruts, que personne ne hiérarchise" },
  { maillon: "plan-action", quoi: "donner à CHAQUE constat un des trois états : retenu / écarté avec sa raison / à trancher", sansQuoi: "un constat écarté disparaît sans trace — l'abandon déguisé de l'Article 28" },
  { maillon: "questions", quoi: "poser à l'utilisateur les constats « à trancher », et eux seuls", sansQuoi: "l'agent décide à sa place, ou bloque tout en attendant", bifurcation: true },
  { maillon: "taches", quoi: "inscrire dans docs/suivi/ les tâches réelles issues des constats retenus et des réponses", sansQuoi: "le rapport a coûté son temps et n'a rien changé" },
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
  // Deux process peuvent partager le même document (nuit et meta) : le nommer deux fois donnerait
  // « docs/x.md ni docs/x.md », ce qui se lit comme un bug du message et fait douter du reste.
  return [...parCle.values()].map((e) => ({ ...e, docs: [...new Set(e.docs)] })).map((e) => ({ ...e,
    pourquoi: `${e.fichier} a changé sans que ${e.docs.join(" ni ")} ne soit mis à jour dans le même commit — le document décrit désormais un process qui n'existe plus tel quel (process concerné${e.processes.length > 1 ? "s" : ""} : ${e.processes.join(", ")})` }));
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
  blocks.push({ type: "note", text: indirects.length
    ? `⚠️ ${indirects.length} modification(s) INDIRECTE(S) d'un process non suivie(s) d'une mise à jour de son document :\n  ${indirects.map((e) => `${e.commit} — ${e.pourquoi}`).join("\n  ")}`
    : "✅ Modifications indirectes : chaque changement du code d'un process a bien mis à jour son document dans le même commit." });

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

function main() {
  printReliabilityNotice("god-of-all-process");
  recordCliUsage("god-of-all-process");
  const tache = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ");
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
