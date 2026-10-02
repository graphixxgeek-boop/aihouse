// ICEBERG: membre
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
import { printReliabilityNotice, sh, lireFichierPartage } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { dernierPlanDeDepart } from "./check-tasks-details.mjs";
import { recentCommits, findCommitsMissingSuiviUpdate, listerLesFichiersDeTaches } from "./check-suivi-fidelity.mjs";
import { adviseToolBrain } from "./tool-brain.mjs";
import { normaliserNomDOutil } from "./le-coordinateur.mjs";
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
import { fraicheurDuMode, formatFraicheurDuMode } from "./modes-de-travail.mjs";
import { readAgentSession, SESSION_FILE, planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction, printReportHeader} from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LE REGISTRE DES PROCESS. Chaque entrée déclare où le process est ÉCRIT, qui le SURVEILLE, et
// quelles traces réelles prouvent qu'une étape a eu lieu. Les chemins sont vérifiés à l'exécution
// (findProcessesWithoutGuardian/findProcessDocsMissing ci-dessous) : une entrée qui pointe vers un
// fichier disparu se voit, jamais une promesse tenue à la main (Article 24).
export const PROCESSES = [
  // FAIRE LE POINT (2026-09-30, tâche #1301). Sa demande, mot pour mot : « cette démarche de faire
  // le point profondément et revenir avec des infos exactes est une demande que je risque de te
  // répéter : donc enregistre ta méthode pour qu'elle soit fiable ».
  //
  // CE QUI L'A FAIT NAÎTRE EST UN ÉTAT DES LIEUX FAUX, LIVRÉ LE JOUR MÊME. Il annonçait « les
  // obligations de la famille AGENCE n'ont jamais été comptées » — elles l'étaient, 93, et c'est
  // l'utilisateur qui a dû le corriger. Un état des lieux de mémoire RESSEMBLE à un état des
  // lieux, et c'est pire qu'une absence : on décide dessus.
  //
  // LA CAUSE RACINE N'ÉTAIT PAS L'INATTENTION : ses fichiers de demande n'étaient pas dans le
  // dépôt, donc aucun outil ne pouvait confronter ce qui était produit à ce qui était demandé.
  // D'où la première étape, qui n'est pas une formalité : DÉPOSER avant d'analyser.
  {
    slug: "faire-le-point",
    nom: "Faire le point — revenir à niveau avec des informations exactes",
    quand: "quand il demande où on en est, si tout est à jour, si toutes ses demandes ont été traitées, ou de tout reprendre",
    motsCles: ["faire le point", "ou on en est", "à jour", "a jour", "tout reprendre", "toutes mes demandes", "es-tu à jour", "remets tout à jour", "revenir à niveau"],
    doc: "docs/faire-le-point-process-detail.md",
    // MÊME GARDIEN QUE SON VOISIN, ET POUR LA MÊME RAISON : l'exactitude d'un état des lieux ne se
    // lit pas mécaniquement. Ce qu'une mécanique PEUT vérifier est câblé en preuve ci-dessous ;
    // le reste est demandé par angel, qui refuse d'être au vert sans réponse.
    gardien: "scripts/angel-of-ia-process.mjs",
    etapes: [
      { cle: "estimation", libelle: "consulter SMART-CONSO-TOKEN et annoncer la durée et la consommation estimées AVANT de commencer — un point complet est une lecture exhaustive du dépôt, c'est-à-dire exactement le schéma coûteux que l'Article 22 oblige à faire arbitrer ; puis confronter l'estimation au réel à la livraison", preuve: { fichier: "docs/agent-du-temps/estimations.md" } },
      { cle: "deposer-la-saisine", libelle: "déposer toute saisine dans le dépôt AVANT de l'analyser — une demande qui n'est pas sur le disque n'est vérifiable par aucun outil, et c'est ainsi que trois noms d'outils qu'il avait donnés ont été perdus", preuve: { dossier: "docs/grand-projet/00-sources/01-sa-demande/", motif: /\.md$/ } },
      { cle: "recenser-verbatim", libelle: "découper chaque saisine en points VERBATIM avec rapport-gros-prompt, avant de répondre à un seul — le découpage est une interprétation, et archiver l'interprétation sans sa source revient à archiver sa propre lecture à la place de la demande", preuve: { dossier: "docs/rapports-gros-prompt/", motif: /\.json$/ } },
      { cle: "preuve-par-commande", libelle: "LANCER une commande pour chaque point et prendre sa MESURE, jamais chercher dans sa mémoire : un point « fait » sans chemin de fichier n'est pas fait, un point « pas fait » sans la commande qui le montre n'est pas mesuré", preuve: null },
      { cle: "chiffre-reproduit", libelle: "reproduire tout chiffre au moment de l'écrire — un chiffre recopié d'une note ancienne se marque « non revérifié » et se range avec les PAS FAIT jusqu'à preuve du contraire", preuve: null },
      { cle: "croiser-la-couverture", libelle: "croiser avec abraham couverture ET citer la limite que l'outil déclare lui-même : « une demande REPRISE ne prouve qu'une chose, que quelqu'un a écrit sur le même sujet — jamais qu'il l'a traitée »", preuve: null },
      { cle: "ouvrir-deux-cas", libelle: "ouvrir DEUX cas à la main parmi ceux déclarés PAS FAIT, et les nommer dans le rapport (leçon L47) — un chiffre qui désigne du travail se vérifie avant d'être publié", preuve: null },
      { cle: "plan-action", libelle: "mettre l'action en face de chaque constat, avec son état RETENU / ÉCARTÉ (raison écrite) / À TRANCHER, et inscrire les tâches RETENUES dans docs/suivi/ — un état des lieux EST un rapport, donc l'Article 28 s'y applique entièrement", preuve: { fichier: "docs/suivi/index.md" } },
      { cle: "livrer-en-html", libelle: "livrer en HTML et en pièce jointe, jamais collé dans la conversation — sa règle, et le dernier geste du process", preuve: { dossier: "docs/grand-projet/html/", motif: /\.html$/ } },
    ],
  },
  // RÉPONDRE À UN FICHIER DE QUESTIONS (2026-09-30, tâche #1264). Sa demande : « reformalise le
  // format universel de questions/réponses […] je te fais confiance, je découvrirai ».
  //
  // LE TROU ÉTAIT COMPLET, et vérifié auprès de god lui-même avant d'écrire une ligne : la FORME
  // d'une question est écrite depuis longtemps (regles-de-travail §2 et §2bis) ; la forme d'une
  // RÉPONSE ne l'était nulle part. Chaque fichier de réponses a donc été écrit dans un format
  // réinventé sur le moment, et le meilleur d'entre eux portait quatre colonnes qu'il avait fallu
  // lui arracher en cours de route. Ce qu'un utilisateur a demandé une fois ne devrait pas avoir
  // à être redemandé.
  {
    slug: "reponse-aux-questions",
    nom: "Répondre à un fichier de questions de l'utilisateur",
    quand: "quand il dépose un fichier de questions, ou répond à un fichier de questions, et qu'on lui rend les réponses",
    motsCles: ["question", "questions", "réponse", "réponses", "repondre", "fichier de questions", "demande inavouée", "fil de conversation"],
    doc: "docs/reponse-aux-questions-process-detail.md",
    // SON GARDIEN EST ANGEL, ET CE N'EST PAS UN GARDIEN DE COMPLAISANCE. Ce process se joue
    // entièrement dans un document écrit pour un humain : aucune mécanique ne peut lire « la
    // demande inavouée est-elle nommée ? » ni « un non-développeur comprendrait-il ? ». Un
    // contrôle qui compterait des titres rendrait un vert sur la FORME pendant que le FOND manque.
    // Angel est précisément l'outil fait pour ce cas : il porte la règle `format-des-reponses`
    // comme règle NON OBSERVABLE, la DEMANDE, et refuse d'être au vert sans réponse — même
    // dispositif que pour les Articles 29 et 30. Le pointer ici SANS avoir inscrit la règle
    // là-bas aurait fait un gardien décoratif, ce que le filet a raison d'interdire.
    gardien: "scripts/angel-of-ia-process.mjs",
    // AUCUN MAILLON N'EST SANS OBJET ICI, et c'est le filet qui me l'a appris. J'avais d'abord
    // déclaré le maillon « tâches » sans objet, au motif que l'étape ④ les inscrit déjà. C'était
    // faux : un maillon PORTÉ PAR UNE ÉTAPE n'est pas un maillon sans objet, c'est un maillon
    // porté — et le déclarer exempté aurait dispensé ce process d'une obligation qu'il remplit.
    // Les trois autres manquaient parce que mes étapes SOUS-DISAIENT ce qu'elles font : lire un
    // fichier de questions EST une mesure d'entrée, et « RETENU / ÉCARTÉ / À TRANCHER » EST un
    // plan d'action. Les libellés le disent désormais, plutôt que de le laisser deviner.
    etapes: [
      // L'ESTIMATION EST PORTÉE, PAS EXEMPTÉE, et le choix mérite sa raison : répondre à un fichier
      // de questions est l'un des travaux les plus COÛTEUX EN TOKENS que produise ce dépôt — le
      // dernier en comptait 49, et chaque réponse doit être sourcée. C'est aussi un travail dont
      // il ATTEND le résultat, donc la durée annoncée lui sert autant que le coût me sert.
      // Et une estimation qu'on ne confronte jamais ne s'améliore jamais (Article 32, faille 3),
      // d'où la confrontation à la livraison plutôt qu'une promesse en l'air.
      { cle: "estimation", libelle: "consulter SMART-CONSO-TOKEN et annoncer la durée et la consommation estimées AVANT d'écrire la première réponse — puis, à la livraison, confronter l'estimation au réel et consigner l'écart, qui est ce qui corrige l'estimation suivante", preuve: { fichier: "docs/agent-du-temps/estimations.md" } },
      { cle: "recenser", libelle: "lire le fichier ENTIER et recenser les questions avant d'en répondre une seule — c'est la mesure d'entrée du process, et elle donne le « N questions » que l'étape de regroupement devra annoncer. Répondre au fil de la lecture fait manquer les questions qui se répondent l'une l'autre", preuve: null },
      { cle: "reprendre-la-question", libelle: "rouvrir chaque réponse en citant SA question telle qu'il l'a posée, avec le contexte dont elle parlait — jamais le numéro seul : il répond souvent des heures plus tard et mène plusieurs sujets à la fois (Article 29, au grain de la question)", preuve: null },
      { cle: "repondre-et-sourcer", libelle: "répondre franchement : l'analyse distingue toujours ce qui est MESURÉ (avec son chiffre) de ce qui est un AVIS (dit comme tel), parce que les deux se lisent pareil et ne valent pas pareil", preuve: null },
      { cle: "demande-inavouee", libelle: "nommer explicitement, en une phrase, l'inquiétude que la question ne dit pas — et y répondre. S'il n'y en a pas, l'écrire aussi : inventer une arrière-pensée est pire que n'en voir aucune", preuve: null },
      { cle: "action-en-face", libelle: "le plan d'action : mettre l'action en face de chaque constat, réponse ou groupe, avec son état RETENU / ÉCARTÉ (raison écrite) / À TRANCHER — les mêmes trois états que l'Article 28, parce qu'un fichier de réponses EST un rapport", preuve: null },
      { cle: "inscrire-les-taches", libelle: "inscrire dans docs/suivi/ les tâches réelles issues des constats RETENUS — une tâche annoncée qui n'existe pas est pire qu'une absence, parce qu'elle ressemble à un lien (Article 28)", preuve: { fichier: "docs/suivi/index.md" } },
      { cle: "declarer-les-groupes", libelle: "annoncer en tête « N questions, M réponses », et faire dire à chaque groupe lesquelles il couvre et pourquoi elles n'en font qu'une — sans ce compte, une question absorbée disparaît sans que personne puisse le voir", preuve: null },
      { cle: "vocabulaire-non-dev", libelle: "écrire pour quelqu'un qui n'est pas développeur : un nom de fonction ou de fichier n'explique rien seul, ce qui compte est ce que ça CHANGE ; tout mot technique nécessaire porte sa définition simple entre parenthèses", preuve: null },
      { cle: "livrer-en-piece-jointe", libelle: "livrer le fichier en PIÈCE JOINTE, jamais collé dans la conversation — sa règle, et c'est le dernier geste du process", preuve: null },
    ],
  },
  // SONDER LE QUOTA GEMINI (2026-09-28, tâche #1021). Treizième process déclaré, et il ferme le
  // dernier trou trouvé par la vérification à froid du 2026-09-27 : c'était la seule activité à
  // enjeu du dépôt que ne gouvernait AUCUN process écrit.
  //
  // CE QUI LE REND PARTICULIER, et ce n'est pas un détail : sonder consomme de vrais appels API pour
  // un simple diagnostic, et **lancé au mauvais moment il aggrave exactement le blocage qu'il
  // mesure**. Essayer cinq modèles sur trois clés pendant que le quota sature rapproche du plafond
  // au lieu d'en éloigner. D'où une première étape qui peut ARRÊTER le process, ce qu'aucun autre
  // process de ce dépôt ne fait dès son ouverture.
  {
    slug: "sonde-quota",
    nom: "Sonder le quota Gemini (Smart Breaker)",
    quand: "avant de sonder les modèles et les clés, typiquement après un blocage HTTP 429/503 répété",
    motsCles: ["quota", "gemini", "sonder", "sondage", "429", "503", "clé api", "smart breaker"],
    doc: "docs/sonde-quota-process-detail.md",
    gardien: "scripts/smart-conso-api.mjs",
    // TROIS MAILLONS DU SCHÉMA N'ONT PAS D'OBJET ICI, et le déclarer est la seconde issue légitime
    // (la première étant de les porter). Ce process ne produit pas un ENSEMBLE DE CONSTATS à trier :
    // il rend UN état — un modèle et une clé disponibles, ou aucun — puis demande un geste manuel.
    // Lui réclamer un plan d'action à trois états produirait une section vide écrite pour faire
    // taire un contrôle, ce que l'Article 28 interdit explicitement.
    maillonsSansObjet: {
      "plan-action": "il ne produit pas un ensemble de constats à trier mais UN état (un modèle et une clé disponibles, ou aucun) : un plan à trois états serait une section vide écrite pour faire taire un contrôle (Article 28)",
      questions: "la seule décision qu'il puisse appeler — basculer de clé ou de modèle en production — n'est pas la sienne et sort explicitement de son périmètre ; il mesure et propose",
      taches: "un sondage ne crée pas de dette : soit une clé répond et le blocage est levé, soit aucune ne répond et c'est l'attente du quota, pas une tâche à inscrire",
    },
    etapes: [
      { cle: "smart-conso-avant", libelle: "consulter Smart Conso API AVANT de sonder (`node scripts/smart-conso-api.mjs diagnostic --confirm`) — jamais une exception parce que c'est un diagnostic (Article 22). C'est la seule étape qui puisse arrêter le process.", preuve: { fichier: "docs/smart-conso-api/index.md" } },
      { cle: "sonder", libelle: "lancer le sondage (`node scripts/check-gemini-quota.mjs`)", preuve: null },
      { cle: "reporter", libelle: "reporter À LA MAIN la ligne suggérée dans `.dev.vars` — aucun code ne l'écrit, parce que c'est une action difficile à défaire sur un fichier que l'utilisateur possède", preuve: null },
      { cle: "projet-distinct", libelle: "si un second projet Google existe, vérifier qu'il est bien DISTINCT avant d'ajouter sa clé aux replis : deux clés d'un même projet partagent le même quota, donc le repli ne replie rien", preuve: null },
      { cle: "redemarrer", libelle: "redémarrer le serveur de développement, sans quoi `.dev.vars` n'est pas chargé — une variable d'environnement shell seule ne suffit PAS au runtime Cloudflare Workers ; vérifier qu'aucun `workerd` orphelin ne survit", preuve: null },
      { cle: "consigner", libelle: "LIVRER le résultat du sondage à l'utilisateur et le consigner : le sondage a coûté de vrais appels, donc son résultat est une donnée qui se rapporte — écrire n'est pas livrer — et l'écart avec l'estimation rejoint la mémoire des estimations", preuve: { fichier: "docs/agent-du-temps/estimations.md" } },
    ],
  },
  {
    slug: "ronde",
    nom: "Ronde périodique (CIRCLE-TASKS)",
    quand: "les tâches gratuites périodiques qu'on oublie facilement",
    motsCles: ["ronde", "circle", "périodique", "tâches gratuites", "hebdo"],
    doc: "docs/circle-process-detail.txt",
    gardien: "scripts/circle-process-guardian.mjs",
    etapes: [
      { cle: "questionnaire", libelle: "poser la fenêtre à cocher (AUTO/PRIME/GOAT)", preuve: null },
      // ESTIMER AVANT, COMPARER APRÈS (2026-09-23, demande explicite de l'utilisateur, câblée dans
      // le process plutôt que confiée à la mémoire de l'agent). La première mesure justifie à elle
      // seule les deux étapes : « 2 h à 3 h 30 » annoncées à la main pour une Ronde de 27 MINUTES.
      { cle: "estimation", libelle: "annoncer la durée ET la consommation estimées du programme réellement coché, avant de lancer quoi que ce soit", preuve: { fichier: "docs/circle-tasks/estimations.md" } },
      { cle: "comparaison", libelle: "en fin de Ronde, confronter l'estimation au réel et consigner l'écart — c'est lui qui corrige l'estimation suivante, jamais une nouvelle intuition", preuve: { fichier: "docs/circle-tasks/estimations.md" } },
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
      // AJOUTÉE le 2026-09-27 (tâche #769). Elle vient AVANT l'enregistrement, et l'ordre n'est pas
      // décoratif : une Ronde inscrite comme faite sans que les dix questions aient été posées les
      // reporterait à la suivante, où elles seraient reportées encore. Sa demande dit « à la fin »,
      // pas « après ».
      { cle: "alignement", libelle: "poser les 10 questions d'alignement — 5 de fond avec ma réponse PRÉVUE écrite avant la sienne, 5 de détail sur les frontières obscures ; un écart sur le fond est un problème GRAVE, jamais une correction à noter", preuve: { fichier: "docs/circle-tasks/alignement.json" } },
      { cle: "enregistrement", libelle: "enregistrer la Ronde comme faite", preuve: { fichier: ".circle-tasks-last-run.json" } },
    ],
  },
  {
    // LE ONZIÈME PROCESS (2026-09-27, tâche #846). NOM CHOISI PAR L'UTILISATEUR ce jour-là, entre
    // trois pistes qui lui ont été présentées — les noms se choisissent ici par lui, et un process
    // acté sans lui serait un process que personne n'a voulu.
    //
    // LA SURPRISE DE L'INSTRUCTION EST QUE HUIT ÉTAPES SUR DIX EXISTAIENT DÉJÀ, chacune exigée par
    // la charte ET portée par un mécanisme réel. Ce qui manquait n'était pas le contenu : c'est
    // qu'elles ne soient NULLE PART rassemblées en une suite dont on puisse voir les trous. Un
    // agent devait les retrouver de mémoire — précisément ce que l'Article 30 interdit.
    slug: "documents-de-reference",
    nom: "Modifier CLAUDE.md ou un document de référence",
    quand: "avant de toucher une règle de la charte ou d'un document du référentiel",
    motsCles: ["charte", "claude.md", "référentiel", "referentiel", "article", "obligation", "principes.md", "parametres.md", "règle", "regle"],
    doc: "docs/plans/process-documents-de-reference-proposition.md",
    gardien: "scripts/moise-tables-de-loi.mjs",
    // LES QUATRE MAILLONS SANS OBJET, et leur raison est UNE SEULE : ce process APPLIQUE une
    // décision, il n'en produit pas. Les constats qui motivent un changement de règle viennent
    // d'ailleurs — d'une Ronde, d'un rapport d'outil, d'une demande de l'utilisateur — et c'est là
    // qu'ils sont triés, retenus ou écartés. Ce process-ci commence APRÈS, quand il est déjà acquis
    // qu'une règle doit bouger, et sa seule mission est que ça se fasse sans rien casser ni rien
    // perdre. Lui réclamer un rapport reviendrait à demander un rapport sur l'exécution d'une
    // décision déjà rapportée ailleurs — le doublon exact que le schéma unifié cherche à éviter.
    // Déclaré ici plutôt que laissé vide en espérant que ça passe.
    maillonsSansObjet: {
      rapports: "il n'y a rien à rapporter : le constat qui a motivé le changement de règle a déjà été rapporté par le process ou l'outil qui l'a trouvé, et le changement lui-même laisse sa trace dans le registre des opérations et la ligne de suivi",
      analyse: "rien à trier — quand ce process démarre, l'analyse est faite et la décision est prise ; trier ici serait rejuger une décision au moment de l'appliquer, ce qui est le meilleur moyen de l'appliquer à moitié",
      "plan-action": "il n'y a aucun constat à retenir ou à écarter : ce process EST déjà l'action d'un plan, jamais la source d'un nouveau (Article 28, pris par le bon bout)",
      questions: "les arbitrages ont eu lieu avant — au moment de décider que la règle devait bouger. Poser une question ici reviendrait à rouvrir la décision pendant qu'on l'écrit, et une règle à moitié écrite est pire que l'ancienne",
    },
    etapes: [
      { cle: "reprise-des-notes", libelle: "chercher ce que le dépôt sait déjà sur la règle qu'on s'apprête à toucher (Article 30)", preuve: null },
      { cle: "comprendre-la-raison", libelle: "lire la raison d'être de la règle avant d'y toucher — un mécanisme qui semble trop prudent en a presque toujours une (Article 19)", preuve: null },
      { cle: "heure-lue", libelle: "lire l'heure plutôt que la taper : toute date écrite dans un document de référence se LIT (Article 32)", preuve: null },
      { cle: "article-preserve", libelle: "vérifier qu'aucun Article n'a disparu, glissé, ni été vidé de ses obligations (protegerLaCharte)", preuve: { fichier: "CLAUDE.md" } },
      { cle: "chemins-atteignables", libelle: "vérifier qu'aucun chemin cité n'est devenu inatteignable (cheminsPerdus)", preuve: null },
      { cle: "sobriete", libelle: "un Article neuf se pèse : le nombre d'obligations est ce qui sature, jamais le nombre de lignes", preuve: null },
      { cle: "memoire-des-operations", libelle: "inscrire l'opération au registre de la charte, Article par Article", preuve: { fichier: "docs/referentiel/charte-operations.md" } },
      { cle: "ligne-de-suivi", libelle: "inscrire la tâche dans docs/suivi/ DANS LE MÊME commit", preuve: { dossier: "docs/suivi/sessions" } },
      // L'ÉTAPE 9 — LE SEUL TROU SANS PORTEUR, et il est comblé le 2026-09-27 sur sa décision
      // (« la construire — elle demande »). Le mécanisme ne saura JAMAIS si les autres documents
      // devaient bouger ; il sait dire qu'une obligation a changé d'un côté seulement, et poser la
      // question. C'est le même compromis que les six règles qu'angel-of-ia-process DEMANDE au lieu
      // de deviner — et c'est très exactement ce que la charte exige « le jour même » (Article 13)
      // sans que rien ne l'ait jamais vérifié (leçon L1, sur la règle qui gouverne la charte).
      { cle: "repercussion", libelle: "répercuter dans les autres documents le jour même — detteDeRepercussion() signale une obligation qui a bougé dans la charte sans qu'un seul document du référentiel ne soit touché, et DEMANDE si c'était voulu", preuve: { fichier: "docs/referentiel/principes.md" } },
      { cle: "filet", libelle: "lancer le filet de sécurité avant de considérer le changement terminé (Article 13)", preuve: null },
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
    // LE PRÉ-CHANTIER (2026-09-26, son gros prompt) — huitième process déclaré. Il naît d'un constat
    // qu'il a posé lui-même : une idée notée en vrac n'est pas perdue, elle est PIRE que perdue —
    // retrouvable mais inexploitable. Le coût n'est pas payé quand on note, il est payé six semaines
    // plus tard, quand il faut agir et qu'il faut relire trente notes éparses pour deviner
    // lesquelles se contredisent.
    slug: "pre-chantier",
    maillonsSansObjet: {
      scan: "le pré-chantier ORDONNE de la matière existante, il ne scanne rien : sa mesure est celle de la stratégie qu'il produit",
    },
    nom: "PRÉ-CHANTIER — de l'idée validée à la construction effective",
    quand: "une idée de chantier vient d'être VALIDÉE et va devenir un chantier réel",
    motsCles: ["chantier", "strategie", "nouvelle idee", "pre-chantier", "notes"],
    doc: "docs/pre-chantier-process-detail.md",
    gardien: "scripts/check-tasks-details.mjs",
    etapes: [
      { cle: "validation", libelle: "A — lui demander si on crée VRAIMENT ce chantier : la suite ne vaut que si la réponse est OUI", preuve: null },
      { cle: "tache", libelle: "B1 — créer la tâche dans docs/suivi/", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      { cle: "strategie", libelle: "B2 — créer le rapport STRATÉGIE DE CHANTIER tout de suite, à partir des éléments existants à date", preuve: { dossier: "docs/strategies/", motif: /-strategie\.md$/ } },
      { cle: "lien", libelle: "B3 — LIER les deux : la stratégie porte le numéro de tâche et le dit en tête", preuve: { dossier: "docs/strategies/", motif: /-strategie\.md$/ } },
      { cle: "alimenter", libelle: "C — alimenter au fur et à mesure, en CITANT intégralement : la stratégie agrège, elle ne résume JAMAIS", preuve: null },
      { cle: "livrer", libelle: "D — juste avant l'exécution : lui livrer le rapport dans la conversation", preuve: null },
      { cle: "analyser", libelle: "E — analyser le document, faire le point, refaire des calibrages si besoin", preuve: null },
      { cle: "outil-a-jour", libelle: "F — s'assurer que l'OUTIL correspondant au chantier est bien à jour selon la stratégie", preuve: null },
      // LE PLAN D'ACTION DU PRÉ-CHANTIER N'EST PAS AILLEURS : c'est la SECTION 7 de la stratégie,
      // « LE PLAN D'EXÉCUTION », qui ne se remplit qu'à la fin, juste avant la construction. Et la
      // section 6, « CE QUI RESTE À TRANCHER », porte exactement le troisième état de l'Article 28.
      // Un plan qui voyage avec le document qui l'a motivé ne peut pas se perdre.
      { cle: "plan-action", libelle: "PLAN D'ACTION : la section 7 de la stratégie (le plan d'exécution) et sa section 6 (ce qui reste à trancher) — les trois états de l'Article 28 vivent DANS la stratégie, jamais dans un document séparé", preuve: { dossier: "docs/strategies/", motif: /-strategie\.md$/ } },
      { cle: "executer", libelle: "G/H — lancer la construction effective : son début SIGNALE la fin de ce process", preuve: null },
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
      // LA TOUTE PREMIÈRE ÉTAPE, AVANT MÊME L'IDENTITÉ (2026-09-26, sa demande le soir même :
      // « inscris dans le process auto de nuit que la premiere question doit etre : avez-vous un
      // gros prompt ? [...] cette consigne doit etre ecrite dans les process pour la prochaine
      // fois »). Elle est née d'un cas réel arrivé ce soir-là : le plan de nuit venait d'être
      // arrêté et poussé quand il a annoncé « j'ai un gros prompt, j'aurais du te le donner
      // avant pour que tu t'organises ». Le plan était déjà figé sur les mauvaises hypothèses.
      //
      // POURQUOI ELLE PASSE AVANT TOUT LE RESTE : un gros prompt ne s'ajoute pas à un plan de
      // nuit, il le RÉÉCRIT. Le découvrir après coup coûte le travail d'organisation entier, et
      // ce n'est pas un oubli de l'utilisateur — c'est une question que l'agent n'a jamais posée.
      { cle: "gros-prompt-dabord", libelle: "PREMIÈRE question posée à l'utilisateur, avant toute organisation : « avez-vous un gros prompt ? » — si oui, le process GROS PROMPT tourne D'ABORD et le plan de nuit se construit autour de lui", preuve: { dossier: "docs/rapports-gros-prompt/", motif: /\.(txt|md|html)$/ } },
      { cle: "identite", libelle: "déposer l'identité de session (version de Claude)", preuve: { fichier: SESSION_FILE } },
      // L'OUTIL DU MODE NOCTURNE N'ÉTAIT BRANCHÉ SUR RIEN (2026-10-01, tâche #1381).
      //
      // `the-ghost` a été commandé par l'utilisateur pour ce mode précis — « créé un petit agent
      // script "the-ghost" qui gere le mode autonome [...] quand je vais dormir ou quand je te
      // laisse travailler seul » (2026-09-21). Il tient le rituel d'entrée et de sortie, et le
      // rythme de la session en cours : depuis quand elle dure, combien de tâches enchaînées,
      // depuis quand aucune Ronde n'a tourné.
      //
      // **IL N'APPARAISSAIT NULLE PART DANS CE PROCESS.** Zéro occurrence dans le document, zéro
      // étape ici. Résultat mesuré le 2026-10-01, en pleine nuit autonome : `the-ghost pacing`
      // répondait « aucune session de mode nocturne active » après six heures de travail.
      //
      // C'EST EXACTEMENT LE DÉFAUT QUI A FAIT NAÎTRE L'ARTICLE 31 : « un passage par tool-brain a
      // révélé que l'outil qui les produit existait depuis la veille et n'était branché nulle
      // part. Un outil qu'on n'utilise pas ne signale jamais qu'il est mal branché. » Le même
      // motif, sur l'outil même du mode où il se produit.
      //
      // LA PREUVE EST UN FICHIER, jamais une déclaration : `.the-ghost-session.json` n'existe que
      // si le rituel d'entrée a eu lieu. Une étape qu'on ne peut que s'auto-attribuer est une
      // étape qu'on saute sans le savoir.
      { cle: "ghost-start", libelle: "ouvrir la session nocturne (`node scripts/the-ghost.mjs start`) — c'est l'outil commandé pour ce mode, et sans son rituel d'entrée le rythme de la nuit n'est mesuré par personne", preuve: { fichier: ".the-ghost-session.json" } },
      // LE PLAN DE DÉPART SE FIGE AVANT DE COMMENCER (2026-09-26, sa demande du même soir :
      // « verifie aussi que tu vas utiliser la confrontation des listes des taches avant/apres
      // comme prevu par les process »). Le mécanisme existait — `check-tasks-details bilan` sait
      // confronter un plan figé à l'état du jour — mais RIEN N'OBLIGEAIT à figer le plan, donc la
      // confrontation du matin se faisait contre le plan d'une nuit antérieure, ou contre rien.
      // Un avant/après sans « avant » n'est pas une mesure, c'est une impression.
      // LE RÉVEIL A UNE CEINTURE **ET** DES BRETELLES (2026-09-26, tâche #913 — sa demande la plus
      // ferme de la nuit : « assure toi de ne plus jamais t'arreter en mode auto quand je te
      // lance »). La relance normale est une chaîne de réveils courts que l'agent RÉARME à chaque
      // tour ; son défaut est structurel et non théorique — **un seul tour qui se termine sans
      // réarmer et la nuit est finie**, sans que rien ne le signale. Un filet RÉCURRENT, qui ne
      // dépend d'aucun réarmement, tire la chaîne même quand elle a cassé.
      //
      // POURQUOI LES DEUX, ET PAS SEULEMENT LE RÉCURRENT : le récurrent est au mieux horaire, donc
      // une casse coûte jusqu'à une heure de nuit perdue. La chaîne courte donne le rythme, le
      // récurrent garantit qu'elle reprend. Aucun des deux ne remplace l'autre.
      { cle: "reveil-a-deux-etages", libelle: "armer les DEUX réveils avant de commencer : la chaîne courte réarmée à chaque tour (le rythme) ET un filet récurrent qui ne dépend d'aucun réarmement (la garantie) — un seul tour qui se termine sans réarmer suffit à tuer une nuit entière", preuve: null },
      { cle: "plan-depart-fige", libelle: "figer la liste des tâches ouvertes AVANT de commencer, dans docs/rapports-de-nuit/plan-depart-AAAA-MM-JJ.txt — sans ce point de départ, aucune confrontation du matin n'est possible", preuve: { dossier: "docs/rapports-de-nuit/", motif: /^plan-depart-.*\.txt$/ } },
      // AJOUTÉE (2026-09-22) : avant de reprendre le plan, savoir où on en est. Sans ça, une nuit
      // passe à côté d'une tâche en attente parfaitement traitable pendant que personne ne dort
      // dessus — et l'audit du jour a justement trouvé quatre tâches faites mais jamais closes.
      { cle: "etat-taches", libelle: "analyser l'état des tâches (check-tasks-details) pour repérer ce qui peut être traité cette nuit", preuve: { dossier: "docs/check-tasks-details/", motif: /\.html$|\.txt$/ } },
      { cle: "plan", libelle: "reprendre le plan donné, sans en sauter une étape", preuve: null },
      // LA RONDE DE LA NUIT, CALIBRÉE AU DÉPART (2026-10-02, tâche #1480).
      //
      // SA DEMANDE, MOT POUR MOT : « je voudrais que tu puisses lancer une ou plusieurs rondes
      // pendant le mode auto. Ca fait partie du process je pense, du process mode auto. Pourquoi
      // as-tu bloqué le lancement ? Il faudrait qu'on fluidifie cette partie, que : des le
      // lancement du mode auto on calibre ensemble la ronde principale à mener pendant la nuit,
      // et aussi que tu disposes d'une formule "ronde auto" qui te permet de lancer des rondes
      // selon ton propre calibrage, à tout moment pendant la nuit : quand tu penses que c'est
      // pertinent. »
      //
      // POURQUOI LE LANCEMENT AVAIT ÉTÉ BLOQUÉ, ET CE N'ÉTAIT PAS CE QU'IL CROYAIT. Ce n'était
      // pas la règle « aucune fenêtre bloquante la nuit » : le process prévoit déjà la
      // combinaison D (zéro question, les points reportés au prochain passage en présence).
      // C'était qu'aucun PROGRAMME n'existait — une Ronde se calibre avec lui (quels items, quel
      // palier, quels items payants), et ce calibrage n'avait jamais été demandé au coucher.
      // Un process qui n'a pas d'entrée ne se lance pas, même quand rien ne l'interdit.
      //
      // LES DEUX MOITIÉS NE FONT PAS DOUBLON, ET C'EST POURQUOI IL Y A DEUX ÉTAPES. Celle-ci
      // règle le cas PRÉVU : une Ronde décidée ensemble avant qu'il s'endorme. La suivante règle
      // le cas IMPRÉVU : il est 3 h, le programme est fini, une Ronde légère serait utile.
      { cle: "ronde-calibree-au-depart", libelle: "calibrer AVEC LUI, au lancement du mode auto, la Ronde principale de la nuit — quels items, quel palier, quels items payants et leur plafond. Sans ce calibrage la Ronde ne se lance pas : ce n'est pas la règle des fenêtres qui l'interdit, c'est l'absence de programme", preuve: { dossier: "docs/rapports-de-nuit/", motif: /^plan-depart-.*\.txt$/ } },
      // LE RÉVEIL À JOUR (2026-09-29, tâche #1165). Le défaut s'est produit pour de vrai la nuit même :
      // un filet horaire de la veille annonçait comme « ce qui vient maintenant » quatre livrables
      // déjà faits, et il l'a répété À CHAQUE HEURE. Un réveil se répète ; une consigne périmée s'y
      // répète aussi. La leçon existait depuis #831 (« un prompt de réveil est de la mémoire, jamais
      // une source de vérité ») et n'avait aucun porteur — c'est ce trou-là que cette étape ferme.
      //
      // AUCUNE PREUVE SUR LE DISQUE, ET C'EST EXACT : un prompt de réveil vit chez le planificateur,
      // pas dans le dépôt. L'étape est donc déclarée non vérifiable plutôt que comptée faite.
      { cle: "reveil-a-jour", libelle: "relire le prompt des réveils DÉJÀ armés et corriger ce qui y est périmé — un réveil se répète, une consigne fausse aussi", preuve: null },
      // LA FORMULE « RONDE AUTO » (2026-10-02, tâche #1480) — la seconde moitié de sa demande,
      // celle qui couvre le cas imprévu.
      //
      // TROIS BORNES PAR DÉFAUT, ET ELLES SONT DES PROPOSITIONS, PAS DES DÉCISIONS. Il ne les a
      // pas fixées ; les inventer en silence serait trancher à sa place, les laisser vides
      // rendrait l'étape inapplicable. Elles sont donc écrites ICI, visibles, et il peut les
      // changer d'un mot :
      //   · DEUX Rondes auto au maximum par nuit, en plus de la Ronde calibrée. Au-delà, le temps
      //     passe en contrôle plutôt qu'en travail, et la nuit sert à produire.
      //   · ZÉRO appel API par défaut. Dépenser son budget pendant qu'il dort demande son accord
      //     préalable, au calibrage du départ — jamais une décision prise à 3 h du matin.
      //   · Les questions sautées sont reportées EN UN SEUL BLOC au matin, jamais réparties : il
      //     doit pouvoir y répondre d'une traite plutôt que de les retrouver éparpillées.
      //
      // ELLE EST FACULTATIVE, ET C'EST VOULU : une nuit sans Ronde auto est une nuit normale. La
      // compter comme un manquement reprocherait l'absence d'un geste qui n'était pas dû.
      { cle: "ronde-auto-si-pertinent", libelle: "FACULTATIF — lancer une « ronde auto » quand c'est pertinent (programme terminé, doute sur un chantier) : légère, GRATUITE par défaut, DEUX au maximum par nuit, questions reportées en un bloc au matin. Trois bornes proposées, modifiables par l'utilisateur", preuve: null, facultatif: true },
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
      // LA CONFRONTATION AVANT/APRÈS (2026-09-26, sa demande). Elle répond à la seule question qui
      // compte au réveil — « qu'est-ce qui a vraiment bougé cette nuit ? » — et elle y répond par
      // une soustraction, jamais par un récit. Le récit dira toujours que la nuit a été bonne.
      { cle: "confrontation", libelle: "confronter la liste figée au départ à l'état réel du matin (`node scripts/check-tasks-details.mjs bilan`) — ce qui a été fermé, ce qui s'est ouvert, ce qui n'a pas bougé", preuve: { dossier: "docs/check-tasks-details/", motif: /^bilan-taches-.*\.txt$/ } },
      { cle: "verification-finale", libelle: "dernière Ronde + relecture de son propre travail de la nuit — AUCUNE action au-delà de ce seuil", preuve: { fichier: ".circle-tasks-run-summary-latest.txt" } },
      // LE RITUEL DE SORTIE, pendant du précédent : il clôt la session et rend son bilan de
      // rythme. Sans lui, `.the-ghost-session.json` reste ouvert et la nuit suivante repart sur
      // une session fantôme — une donnée qui survit à ce qu'elle décrit est pire qu'une absence.
      { cle: "ghost-end", libelle: "clore la session nocturne (`node scripts/the-ghost.mjs end`) — sinon la session reste ouverte et la nuit suivante repart sur un état fantôme" },
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

export function findArretPremature({ planPath, suiviTexte = "", readFileImpl = lireFichierPartage, root = ROOT } = {}) {
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
export function findMecanismesAbsentsDuProcess({ processes = PROCESSES, root = ROOT, readFileImpl = lireFichierPartage } = {}) {
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

export function mecanismesDuProcess(p, { root = ROOT, readFileImpl = lireFichierPartage } = {}) {
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
export function etatConnexionProcessGardien({ processes = PROCESSES, root = ROOT, readFileImpl = lireFichierPartage } = {}) {
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
// dans docs/templates/process.md ; ceci en est le contrôle.
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

export function findProcessHorsGabarit({ processes = PROCESSES, root = ROOT, readFileImpl = lireFichierPartage, exigences = EXIGENCES_GABARIT_PROCESS } = {}) {
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
// LES AUTRES DOCUMENTS D'UN FICHIER (2026-09-26, tâche #943) — la fiche et le blueprint d'un outil,
// DÉRIVÉS de son nom plutôt qu'énumérés (Article 24) : un outil ajouté demain est couvert sans qu'on
// y pense. Le slug est le nom du fichier sans son extension, la convention sans exception du dépôt.
export function docsAilleurs(fichier, fichiersDuCommit = []) {
  const slug = String(fichier).replace(/^scripts\//, "").replace(/\.mjs$/, "");
  if (!slug) return [];
  const attendus = new Set([`docs/referentiel/${slug}.md`, `docs/${slug}-blueprint.md`]);
  return fichiersDuCommit.filter((f) => attendus.has(f));
}

// UN COMMENTAIRE AJOUTÉ N'EST PAS UN CHANGEMENT DE PROCESS (2026-09-27, tâche #1014). Le
// détecteur ci-dessous juge sur le FICHIER TOUCHÉ, jamais sur ce qui a changé dedans — et le
// 2026-09-27 il a rendu HUIT dettes documentaires d'un coup, les huit fausses : le seul changement
// de ces fichiers était une ligne `// ICEBERG: membre` posée en tête par une commande de rangement.
// Aucun process n'avait bougé. **Un garde-fou qui accuse à tort cesse d'être lu** (leçon L4), et
// huit fausses accusations dans un seul commit sont exactement la dose qui fait cesser de lire —
// avec, derrière, les vraies dettes qui se cachent (le même coût s'est déjà mesuré ici le
// 2026-09-26, tâche #943).
//
// LA RÈGLE EST GÉNÉRALE PLUTÔT QUE TAILLÉE SUR LE CAS DU JOUR (Article 24) : un diff dont TOUTES
// les lignes ajoutées et retirées sont des commentaires ou du vide n'a pas modifié le comportement
// du fichier, donc n'a pas pu déplacer une règle de process. Écrire « ignore la ligne ICEBERG »
// aurait laissé passer le prochain cas sous une autre forme.
//
// LE RISQUE RÉSIDUEL, ASSUMÉ ET ÉCRIT : dans ce dépôt, le POURQUOI vit à côté du QUOI, donc un
// commentaire PEUT porter une règle (Article 27). Un commit qui ne ferait que réécrire un tel
// commentaire cesserait d'être signalé. C'est un échange accepté : ce cas-là documente, il ne
// change pas le process — alors que le cas inverse, huit accusations fausses, éteint le contrôle
// entier. Une mesure impossible (diff illisible) ne fait taire personne : on rend `false`, donc le
// fichier reste compté comme un vrai changement.
export function diffSeulementDesCommentaires(hash, fichier, { shImpl = sh, root = ROOT } = {}) {
  let diff;
  try {
    // L'ORDRE DES ARGUMENTS N'EST PAS DÉCORATIF, et il a mordu tout de suite : écrit
    // `-- <fichier> <hash>`, git prend le HASH POUR UN CHEMIN et rend le diff de HEAD au lieu de
    // celui du commit demandé. Le filtre passait alors de 20 écarts à 0 — il aurait fait taire le
    // contrôle entier, y compris sur de vraies dettes. Trouvé par la MESURE avant/après, jamais en
    // relisant la ligne : elle a l'air juste.
    diff = shImpl(`git show --format= --unified=0 ${hash} -- ${JSON.stringify(fichier)}`, { cwd: String(root).replace(/\/$/, "") });
  } catch {
    return false; // diff illisible : on ne fait taire personne sur une absence de mesure
  }
  const lignes = String(diff).split("\n")
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .map((l) => l.slice(1).trim());
  if (!lignes.length) return false; // rien de lisible : même prudence
  return lignes.every((l) => l === "" || l.startsWith("//") || l.startsWith("*") || l.startsWith("/*") || l.startsWith("*/") || l.startsWith("#"));
}

// ─────────────────────────────────────────────────────────────────────────────
// UNE FICHE EN RETARD SUR SON SCRIPT (2026-09-29, tâche #1159)
//
// LE TROU EST NÉ D'UN CONSTAT DE LA NUIT MÊME : quatre outils ont reçu une capacité nouvelle, et
// AUCUN garde-fou n'a signalé que leur fiche ne le disait pas. `findChangementsIndirectsSansMiseAJour()`
// rendait `[]`, et il avait raison de son point de vue : il surveille les PROCESS, jamais les fiches
// d'outil. **Une dette documentaire qu'aucune mécanique ne voit est exactement celle qui s'installe.**
//
// CE QU'IL NE FAUT SURTOUT PAS MESURER, ET C'EST TOUTE LA DIFFICULTÉ : « le script a changé depuis
// sa fiche » crierait à chaque refactor, à chaque correction de faute de frappe, à chaque
// commentaire ajouté — un garde-fou qui accuse à tort cesse d'être lu (leçon L4), et celui-ci
// accuserait quasiment tous les jours.
//
// CE QUI EST MESURÉ À LA PLACE : le script a-t-il gagné une FONCTION PUBLIQUE nouvelle depuis le
// dernier passage sur sa fiche ? Un export nouveau est une capacité nouvelle — c'est-à-dire
// exactement ce que l'Article 13 oblige à refléter. Un renommage interne, un commentaire, une
// correction ne produisent aucun export nouveau et ne disent donc rien.
//
// IL NE TOURNE PAS AU COMMIT, et c'est assumé : il compare le contenu de deux versions de chaque
// script, ce qui coûte deux appels git par outil. À la demande et à la Ronde, jamais dans un
// crochet — un contrôle qui ralentit chaque commit finit par être décâblé.
export const MOTIF_EXPORT_PUBLIC = /^export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm;

export function exportsPublics(source = "") {
  return new Set([...String(source).matchAll(MOTIF_EXPORT_PUBLIC)].map((m) => m[1]));
}

export function findFichesEnRetardSurLeurScript({ shImpl = sh, root = ROOT, existsImpl = existsSync, readImpl = null } = {}) {
  const cwd = root.replace(/\/$/, "");
  const lire = readImpl ?? ((c) => readFileSync(join(cwd, c), "utf8"));
  let scripts = [];
  try {
    scripts = String(shImpl("git ls-files scripts/*.mjs", { cwd })).split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return { mesurable: false, pourquoi: "git illisible : aucune comparaison possible — et une absence de mesure n'est jamais un vert (leçon L5)" };
  }
  if (!scripts.length) return { mesurable: false, pourquoi: "aucun script listé par git : ce zéro dit qu'on n'a rien lu, jamais que tout est à jour" };

  const ecarts = [];
  let compares = 0, sansFiche = 0;
  for (const script of scripts) {
    const slug = script.replace(/^scripts\//, "").replace(/\.mjs$/, "");
    const fiche = `docs/referentiel/${slug}.md`;
    if (!existsImpl(join(cwd, fiche))) { sansFiche += 1; continue; }
    let dateFiche = "";
    try { dateFiche = String(shImpl(`git log -1 --format=%cI -- "${fiche}"`, { cwd })).trim(); } catch { /* fiche jamais committée */ }
    if (!dateFiche) { sansFiche += 1; continue; }
    let avant = "";
    try { avant = String(shImpl(`git show "$(git rev-list -1 --before='${dateFiche}' HEAD)":${script}`, { cwd })); } catch { continue; }
    let maintenant = "";
    try { maintenant = lire(script); } catch { continue; }
    compares += 1;
    const nouveaux = [...exportsPublics(maintenant)].filter((n) => !exportsPublics(avant).has(n));
    if (!nouveaux.length) continue;
    // LE DERNIER FILTRE, ET IL ÉVITE LE FAUX POSITIF LE PLUS PROBABLE : si la fiche NOMME déjà la
    // fonction, elle n'est pas en retard — même si son commit est antérieur, parce que rien ne dit
    // que la fiche a été écrite après le code plutôt qu'en même temps dans un commit qui l'a touchée
    // pour autre chose.
    let texteFiche = "";
    try { texteFiche = lire(fiche); } catch { /* illisible : on garde l'écart plutôt que de l'absoudre */ }
    const nonDocumentes = nouveaux.filter((n) => !texteFiche.includes(n));
    if (!nonDocumentes.length) continue;
    ecarts.push({ script, fiche, nouveaux: nonDocumentes,
      pourquoi: `${nonDocumentes.length} fonction(s) publique(s) nouvelle(s) depuis le dernier passage sur la fiche — ${nonDocumentes.slice(0, 4).join(", ")}${nonDocumentes.length > 4 ? "…" : ""}` });
  }
  return { mesurable: true, ecarts, compares, sansFiche,
    pourquoi: `${compares} script(s) comparé(s) à leur fiche, ${sansFiche} sans fiche ou sans historique — ${ecarts.length} en retard` };
}

export function formatFichesEnRetardLines(r, { limite = 12 } = {}) {
  if (!r?.mesurable) return ["=== FICHES EN RETARD SUR LEUR SCRIPT : PAS MESURÉ ===", `  ${r?.pourquoi}`, "", "  Ce n'est PAS « tout est à jour »."];
  const L = [`=== FICHES EN RETARD SUR LEUR SCRIPT — ${r.ecarts.length} sur ${r.compares} comparée(s) ===`, "", `  ${r.pourquoi}`, ""];
  if (!r.ecarts.length) {
    L.push("  ✅ Aucune fiche en retard. Ce que ça dit exactement : aucun script n'a gagné de fonction PUBLIQUE");
    L.push("     que sa fiche ne nomme pas. Ce que ça NE dit PAS : que les fiches décrivent JUSTE ce que fait le");
    L.push("     code — un texte faux et un texte absent ne se ressemblent pas, et seul le second se mesure.");
    return L;
  }
  for (const e of r.ecarts.slice(0, limite)) { L.push(`  🟠 ${e.script} → ${e.fiche}`); L.push(`     ${e.pourquoi}`); }
  if (r.ecarts.length > limite) L.push(`  … et ${r.ecarts.length - limite} autre(s)`);
  L.push("");
  L.push("  UN EXPORT NOUVEAU EST UNE CAPACITÉ NOUVELLE, donc une obligation de l'Article 13. Ce contrôle ne dit");
  L.push("  RIEN d'un refactor, d'un commentaire ou d'une correction : ils ne produisent aucun export nouveau.");
  return L;
}

// LA PORTÉE DÉCLARÉE D'UN PROCESS CHEZ SON CONTRÔLEUR (2026-09-29, tâche #1179).
//
// Un document de process peut écrire, en une ligne visible : « **PORTÉE CHEZ SON CONTRÔLEUR :**
// `xp-lecons` ». Il dit alors : *mon contrôleur héberge des règles qui ne me concernent pas, et
// voici la mienne.* Le détecteur de dettes ne lui facture plus qu'un changement qui touche
// vraiment cette portée-là.
//
// POURQUOI UNE DÉCLARATION DU DOCUMENT ET PAS UNE DÉDUCTION : le nombre de process gardés par un
// fichier se dérive du registre, et pour `angel-of-ia-process.mjs` le registre dit « un » quand la
// réalité dit « vingt-cinq règles pour une dizaine de sujets ». Aucune mécanique ne peut deviner
// ça ; l'auteur du document, lui, le sait. Il le déclare, et la déclaration est lisible par les
// deux côtés — c'est l'Article 27 pris par son bon bout.
export const MOTIF_PORTEE_CHEZ_LE_CONTROLEUR = /(?:^|\n)[ \t]*(?:[>*\-|#]|\/\/)*[ \t]*(?:\*\*)?PORT[ÉE]E CHEZ SON CONTR[ÔO]LEUR\s*:?(?:\*\*)?\s*:?\s*`([^`\n]+)`/i;

export function porteeDeclaree(texte = "") {
  const m = String(texte).match(MOTIF_PORTEE_CHEZ_LE_CONTROLEUR);
  return m ? m[1].trim() : null;
}

export function porteeDeclareeDuProcess(p, { root = ROOT, lireDocImpl = null } = {}) {
  if (!p?.doc) return null;
  const lire = lireDocImpl ?? ((chemin) => readFileSync(join(root, chemin), "utf8"));
  try { return porteeDeclaree(lire(p.doc)); } catch { return null; }
}

// Le diff se lit dès que l'une des deux raisons existe : plusieurs process gardés par le même
// fichier (la règle de 2026-09-25), ou une portée déclarée par le document (celle d'aujourd'hui).
export function partageOuPortee(combien, portee) {
  return (combien ?? 0) > 1 || Boolean(portee);
}

export function findChangementsIndirectsSansMiseAJour({ processes = PROCESSES, shImpl = sh, root = ROOT, nbCommits = 15, lireDocImpl = null } = {}) {
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
  // QUI GARDE PLUSIEURS PROCESS ? La question se DÉRIVE des process déclarés, jamais d'une liste
  // recopiée (Article 24) : un treizième process déclaré demain change ce compte tout seul.
  const combienDeProcess = new Map();
  for (const p of processes) {
    if (!p.doc || !p.gardien) continue;
    combienDeProcess.set(p.gardien, (combienDeProcess.get(p.gardien) ?? 0) + 1);
  }
  const parCle = new Map();
  for (const c of commits) {
    for (const p of processes) {
      if (!p.doc) continue;
      const codeDuProcess = new Set();
      if (p.gardien) codeDuProcess.add(p.gardien);
      for (const e of p.etapes ?? []) if (e.preuve?.fichier?.endsWith(".mjs")) codeDuProcess.add(e.preuve.fichier);
      // LA DETTE ET LE SOUPÇON (2026-09-26, tâche #943) — et la distinction porte sur ce que le
      // commit a DOCUMENTÉ, jamais sur la force du lien.
      //
      // LE DÉFAUT CONSTATÉ, SUR MOI : un commit qui ajoutait à `angel-of-ia-process.mjs` une règle
      // de conduite sans aucun rapport avec le process xp-ia annonçait quand même une dette sur
      // `docs/xp-ia-process-detail.md` — alors que la documentation réellement due, la fiche de
      // l'outil, avait été écrite DANS LE MÊME COMMIT. **Un garde-fou qui accuse à tort cesse
      // d'être lu** (L4), et le coût s'est mesuré le jour même : à force d'ignorer cette ligne,
      // TROIS dettes réelles de la même journée se sont cachées derrière.
      //
      // LA PREMIÈRE RÈGLE ESSAYÉE ÉTAIT MAUVAISE, et le filet l'a dit : je séparais « le fichier
      // est la PREUVE d'une étape » de « le fichier n'est que le CONTRÔLEUR ». Un test existant a
      // refusé — et il avait raison, parce que le lien au contrôleur est exactement celui qui avait
      // laissé passer les neuf dettes de 2026-09-25. Affaiblir ce lien rouvrait le trou.
      //
      // LA RÈGLE RETENUE NE FAIT DONC TAIRE PERSONNE, elle DÉGRADE : si le commit a documenté le
      // fichier touché AILLEURS — sa fiche `docs/referentiel/<outil>.md` ou son blueprint — alors
      // le changement n'est pas non documenté, et l'écart devient un SOUPÇON à confirmer plutôt
      // qu'une dette. Un commit qui ne documente RIEN reste une dette pleine et entière.
      const touche = c.fichiers
        .filter((f) => codeDuProcess.has(f) && !PARTAGES.has(f))
        // Un fichier dont le diff ne contient que des commentaires n'a pas déplacé de règle : voir
        // le commentaire de `diffSeulementDesCommentaires()` juste au-dessus, et les huit fausses
        // dettes du 2026-09-27 qui l'ont rendu nécessaire.
        .filter((f) => !diffSeulementDesCommentaires(c.hash, f, { shImpl, root }));
      if (!touche.length || c.fichiers.includes(p.doc)) continue;
      for (const fichier of touche) {
        const cle = `${c.hash}|${fichier}`;
        // LE GARDIEN PARTAGÉ (2026-09-27, vérification à froid des tâches #436/#773). QUATRE
        // gardiens sur douze gardent PLUSIEURS process : god en garde trois (semi-autonome, nuit,
        // meta), moïse deux, circle-process-guardian deux, check-tasks-details deux. Tout
        // changement de l'un d'eux était donc facturé à TOUS ses process, sauf à mettre à jour
        // TOUS leurs documents dans le même commit — c'est-à-dire à documenter des process que le
        // changement ne concernait pas.
        //
        // MESURÉ : huit dettes annoncées sur mes commits du jour, et les huit portaient sur un
        // process frère. Le point de contrôle de nuit était documenté dans le document du mode
        // autonome — correctement — et la dette tombait sur le mode SEMI-autonome, qu'il ne touche
        // pas. Un garde-fou qui accuse à tort cesse d'être lu (L4), et celui-ci le fait
        // STRUCTURELLEMENT, pas par accident : il ne peut pas se corriger tout seul.
        //
        // LA RÈGLE NE FAIT TAIRE PERSONNE, ELLE DÉGRADE — exactement comme la règle voisine du
        // 2026-09-26, et pour la même raison : si le commit a mis à jour le document d'AU MOINS UN
        // process gardé par ce même script, le travail A ÉTÉ documenté, et lequel des process
        // frères était concerné n'est pas connaissable mécaniquement. Un commit qui ne documente
        // RIEN reste une dette pleine et entière.
        // LA RÈGLE RETENUE EST UN PRINCIPE, JAMAIS UNE RUSTINE (corollaire de l'Article 17) : ma
        // première version dégradait quand un process FRÈRE avait été documenté. Mesurée, elle ne
        // rattrapait que 4 des 8 fausses dettes — parce qu'elle décrivait le symptôme (« un frère
        // a bougé ») et pas la cause (« ce changement ne concerne pas ce process-ci »).
        //
        // LE PRINCIPE : un changement de gardien ne concerne un process QUE S'IL LE NOMME. Le
        // diff mentionne-t-il le slug du process, ou le chemin de son document ? Si oui, le lien
        // est DIRECT et la dette reste pleine — la sévérité de 2026-09-25 est intacte là où elle
        // sert. Si non, le changement porte sur autre chose que ce process, et l'écart devient un
        // soupçon à confirmer plutôt qu'une accusation.
        //
        // IL DÉGRADE, IL NE FAIT JAMAIS TAIRE : le soupçon reste affiché, et nommé. Ce qui
        // disparaît est l'accusation structurelle — celle qu'un gardien partagé produit
        // mécaniquement, sur des process que le commit n'a jamais approchés.
        // L'ORDRE DES ARGUMENTS EST LE HASH PUIS `--` PUIS LE CHEMIN, et je viens de refaire
        // l'erreur inverse dans la même session : écrit `-- <fichier> <hash>`, git lit le hash
        // comme un chemin et rend le diff de HEAD pour tous les commits. C'est mot pour mot le
        // défaut payé par la tâche #1014 ce matin — la leçon L37 (« corriger une occurrence ne
        // corrige pas la CLASSE ») vérifiée sur son auteur, quelques heures après l'avoir écrite.
        // Trouvé en vérifiant que les trois dettes restantes nommaient vraiment leur process :
        // aucune ne le faisait, et c'est le diff qui était faux.
        // LA RÈGLE NE S'APPLIQUE QU'À L'AMBIGUÏTÉ QU'ELLE CORRIGE, jamais au-delà. Un gardien qui
        // ne garde QU'UN process ne pose aucune question : le changer, c'est changer ce process-là,
        // et la dette reste pleine sans qu'on ait à lire le diff. C'est le cas fondateur de 2026-09-25
        // et il ne bouge pas d'un pouce. Ma première version appliquait le test du nom à TOUT le
        // monde — le filet a refusé, et il avait raison : elle aurait absous un commit qui change le
        // seul gardien d'un process sans documenter, exactement le trou que ce détecteur bouche.
        // UN DOCUMENT PEUT DÉCLARER LA PORTÉE QU'IL A CHEZ SON CONTRÔLEUR (2026-09-29, tâche #1179),
        // et sans ça la règle fondatrice ci-dessus se trompe de la même façon trois fois de suite.
        //
        // LE CAS RÉEL : `angel-of-ia-process.mjs` est enregistré comme le contrôleur d'UN SEUL
        // process (`xp-ia`), donc `partage` vaut faux et la dette est pleine dès qu'il change. Mais
        // angel porte en réalité TOUTES les règles de conduite du projet — vingt-cinq aujourd'hui,
        // dont une seule concerne l'XP. Le registre dit « un », la réalité dit « beaucoup », et le
        // compte dérivé du registre est donc faux POUR CE FICHIER-LÀ.
        //
        // La conséquence était mesurée avant d'être corrigée : deux règles de conduite ajoutées le
        // 2026-09-27 pour un tout autre sujet ont été facturées à l'XP (tâches #436/#773), le
        // document a alors écrit l'exemption EN PROSE… et trois règles ajoutées le 2026-09-29 ont
        // été facturées à l'identique. Une exemption que seul un humain peut lire n'exempte rien
        // (Article 27) : un garde-fou qui accuse à tort cesse d'être lu (leçon L4).
        //
        // CE QUE ÇA NE DESSERRE PAS : rien, sauf pour un document qui le DEMANDE explicitement. Sans
        // ligne « PORTÉE CHEZ SON CONTRÔLEUR », le comportement est identique au caractère près, et
        // le cas fondateur de 2026-09-25 — un gardien qui ne garde qu'un process, dette pleine sans
        // lire le diff — ne bouge pas d'un pouce.
        const portee = porteeDeclareeDuProcess(p, { root, lireDocImpl });
        const doitLireLeDiff = partageOuPortee(combienDeProcess.get(fichier) ?? 0, portee);
        const partage = (combienDeProcess.get(fichier) ?? 0) > 1;
        const diff = !doitLireLeDiff ? null : (() => { try { return shImpl(`git show --format= ${c.hash} -- ${JSON.stringify(fichier)}`, { cwd: root, maxBuffer: 5e7 }); } catch { return null; } })();
        // UN DIFF ILLISIBLE NE DÉGRADE RIEN : sans lui, on ne peut pas dire que le changement ne
        // nomme pas le process, seulement qu'on n'a pas pu regarder (L5). On reste sur la règle
        // stricte plutôt que d'absoudre par défaut d'information.
        // ON CHERCHE LA DÉCLARATION DU PROCESS, JAMAIS SON NOM EN PROSE. Premier essai : le slug
        // nu. Il a rendu « nuit » trois fois sur un diff qui parlait du « point de contrôle de
        // nuit » — un slug de quatre lettres qui est aussi un mot courant du français collisionne
        // avec la prose, et le commentaire qui EXPLIQUE un changement se met alors à le prouver.
        // Ce qui distingue un vrai lien est la déclaration (`slug: "nuit"`) ou le chemin du
        // document : ni l'un ni l'autre ne s'écrit par accident dans une phrase.
        const declaration = `slug: ${JSON.stringify(p.slug)}`;
        // UN DIFF VIDE EST UNE NON-MESURE, exactement comme un diff illisible : sur un fichier
        // réellement modifié, `git show` ne rend jamais rien. Le traiter comme « le changement ne
        // nomme pas ce process » absoudrait sur une absence d'information (L5) — on reste strict.
        const nomme = !doitLireLeDiff || !diff || diff.includes(declaration) || (p.doc && diff.includes(p.doc)) || (portee ? diff.includes(portee) : false);
        const ailleurs = docsAilleurs(fichier, c.fichiers);
        const lien = nomme ? (ailleurs.length ? "a-confirmer" : "direct") : "a-confirmer";
        const raisonDuSoupcon = portee && !partage
          ? `le diff de ${fichier} ne touche pas \`${portee}\`, la seule portée que ${p.doc} déclare avoir chez ce contrôleur : ce contrôleur héberge des règles d'autres sujets, et ce changement ne semble pas porter sur celui-ci`
          : `le diff de ${fichier} ne nomme ni « ${p.slug} » ni son document : ce gardien en garde plusieurs, et ce changement ne semble pas porter sur celui-ci`;
        const pourquoiSoupcon = nomme ? ailleurs : [...ailleurs, raisonDuSoupcon];
        if (!parCle.has(cle)) parCle.set(cle, { commit: c.hash, sujet: c.sujet, fichier, processes: [], docs: [], lien, documenteAilleurs: pourquoiSoupcon });
        // Un même fichier peut concerner plusieurs process : si l'UN d'eux est nommé, la dette est
        // pleine pour l'entrée entière. Dégrader sur le plus indulgent effacerait le vrai lien.
        else if (lien === "direct") parCle.get(cle).lien = "direct";
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
    const indirect = e.lien === "a-confirmer";
    return { ...e, rattrape,
      pourquoi: `${e.fichier} a changé sans que ${e.docs.join(" ni ")} ne soit mis à jour dans le même commit${rattrape ? ` — RATTRAPÉ depuis, par ${rattrape} : la règle n'a pas été tenue, la dette documentaire l'est` : indirect ? ` — À CONFIRMER, jamais une dette : ce commit a bien documenté ${e.fichier} ailleurs (${(e.documenteAilleurs ?? []).join(", ")}). Reste à vérifier si le process, lui, a changé` : " — le document décrit désormais un process qui n'existe plus tel quel"} (process concerné${e.processes.length > 1 ? "s" : ""} : ${e.processes.join(", ")})` };
  });
}

// ————————————————————————————————————————————————————————————————————————
// LA DETTE SIGNALÉE AU MOMENT OÙ ELLE NAÎT (2026-09-25, tâche #436 partie 2)
// ————————————————————————————————————————————————————————————————————————
//
// LE TROU QUE ÇA FERME, et il est mesuré, jamais craint : le détecteur ci-dessus existait depuis le
// 2026-09-23 et tournait UNIQUEMENT quand on lançait god-of-all-process à la main. Le crochet
// post-commit appelle sept Gardiens sacrés, ecotoken et MOÏSE — jamais god. Résultat vérifié le
// 2026-09-25 : NEUF dettes documentaires accumulées, dont sept payées en retard et deux encore
// dues. Aucune n'était cachée : personne ne regardait, parce que regarder demandait un geste.
//
// POURQUOI SEULEMENT LE DERNIER COMMIT, et pas la fenêtre de quinze : une dette née il y a dix
// commits n'est plus une information au moment du commit onze — c'est une liste qu'on relit chaque
// fois sans pouvoir l'éteindre, donc du décor en deux passages (leçon L6). Ce qu'on peut encore
// corriger d'un `git commit --amend`, c'est ce qu'on vient de faire. Le bilan complet reste chez
// god, à la demande et à la Ronde.
//
// CONSÉQUENCE ASSUMÉE DE CETTE FENÊTRE À UN : le rattrapage ne peut pas s'observer (il vit dans les
// commits SUIVANTS, qui n'existent pas encore). Une dette vue ici est donc toujours impayée par
// construction, et c'est exactement ce qu'on veut dire — pas un jugement plus sévère, une fenêtre
// plus courte.
//
// SA LIMITE, déclarée plutôt que tue : elle hérite de celle du détecteur — un commit qui groupe
// plusieurs sujets élargit la fenêtre de fichiers et peut laisser passer un cas. Elle attrape le
// cas net, jamais tous les cas.
export function detteDuDernierCommit(options = {}) {
  return findChangementsIndirectsSansMiseAJour({ ...options, nbCommits: 1 }).filter((e) => !e.rattrape);
}

// Le rendu du crochet : MUET quand il n'y a rien à dire. Un contrôle qui parle à chaque commit pour
// annoncer que tout va bien cesse d'être lu au troisième — et c'est précisément dans ce bruit que
// les neuf dettes ont pu passer. Il ne rend donc des lignes que lorsqu'il a trouvé.
export function detteDuDernierCommitLines(ecarts = []) {
  if (!ecarts.length) return [];
  // LES DEUX NATURES NE SE MÉLANGENT PLUS (2026-09-26, tâche #943). Un lien INDIRECT — le fichier
  // n'est que le contrôleur du process — est un soupçon, jamais une dette. Les compter ensemble a
  // eu un coût mesuré : le soupçon revenait à chaque commit, j'ai appris à ne plus lire la ligne,
  // et TROIS dettes réelles du même jour se sont cachées derrière (leçon L4, prise sur le fait).
  const dettes = ecarts.filter((e) => e.lien !== "a-confirmer");
  const soupcons = ecarts.filter((e) => e.lien === "a-confirmer");
  const L = [];
  if (dettes.length) {
    L.push(`⚠️  ${dettes.length} dette(s) documentaire(s) NÉE(S) dans ce commit — god-of-all-process, Article 13 :`);
    for (const e of dettes) L.push(`  · ${e.pourquoi}`);
    L.push("  → Corriger maintenant coûte un `git commit --amend` ; découvert à la Ronde, ça coûte de retrouver ce qui a changé.");
  }
  // LE SOUPÇON RESTE AFFICHÉ, jamais étouffé : l'écarter complètement rouvrirait le trou que ce
  // détecteur bouche. Il est seulement dit pour ce qu'il est, et il ne compte pas comme une dette.
  if (soupcons.length) {
    L.push(`ℹ️  ${soupcons.length} écart(s) À CONFIRMER — pas une dette : ce commit a documenté le fichier touché ailleurs.`);
    for (const e of soupcons) L.push(`  · ${e.fichier} → ${e.docs.join(", ")} — documenté dans ${(e.documenteAilleurs ?? []).join(", ")}. Si le process lui-même n'a pas changé, il n'y a rien à faire.`);
  }
  if (L.length) L.push("  (fenêtre : le dernier commit seul — le bilan complet est dans `node scripts/god-of-all-process.mjs`)");
  return L;
}

// ————————————————————————————————————————————————————————————————————————
// LE RÉFLEXE : quel process gouverne ce que je m'apprête à faire ?
// ————————————————————————————————————————————————————————————————————————

// Même mécanique honnête que tool-brain : une correspondance par mots-clés, jamais une
// compréhension. Elle peut passer à côté — d'où l'avertissement de fiabilité en tête du rapport.
// ============================================================================================
// LE PLAN DE DÉPART ↔ LE RAPPORT DE NUIT (2026-09-25, tâche #772)
// ============================================================================================
// SA DEMANDE, dans ses mots : « à chaque début de process mode auto : un rapport txt sur le plan
// de la nuit, à comparer au rapport txt de nuit, qui se construit au fur et à mesure : garantie
// que le rapport de fin sera toujours comparé au rapport de début, et que tout sera exécuté.
// FIABILISE CA STP. fais des tests pour être sûr que ça fonctionne. »
//
// LE TROU QUE ÇA FERME, et il est le plus coûteux de tous les trous de nuit : un rapport de fin
// écrit à la lumière de ce qu'on VIENT de faire ne parle que de ce qu'on a fait. Ce qu'on avait
// prévu et jamais commencé n'y apparaît pas — pas par malhonnêteté, mais parce que rien ne le
// rappelle. Une nuit de huit heures peut donc rendre un rapport impeccable sur vingt tâches en
// ayant silencieusement laissé tomber les quatre-vingts autres.
//
// LA FIABILISATION TIENT EN UNE DÉCISION : un NUMÉRO SEUL NE PROUVE RIEN. Écrire « reste à faire
// #744 » dans le rapport citerait le numéro sans rien avoir fait — et une comparaison qui compte
// les numéros cités rendrait 100 % de couverture sur une nuit vide. Chaque tâche doit donc porter
// une MARQUE explicite, et une tâche du plan sans marque dans le rapport est le vrai constat :
// elle est tombée du radar, ce que personne n'aurait vu autrement.
export const MARQUES_RAPPORT = {
  FAIT: { motif: /\[FAIT\]/, quoi: "terminée et vérifiée", compteCommeTraitee: true },
  AVANCE: { motif: /\[AVANC[ÉE]\]/, quoi: "entamée, pas finie — dit où elle en est", compteCommeTraitee: true },
  "NON-TRAITE": { motif: /\[NON[- ]TRAIT[ÉE]E?\]/, quoi: "pas touchée, et la raison est écrite", compteCommeTraitee: false },
  ECARTE: { motif: /\[[ÉE]CART[ÉE]E?\]/, quoi: "volontairement écartée, avec sa raison", compteCommeTraitee: false },
};

// UN SEUL ENDROIT DÉCIDE CE QU'EST UN NUMÉRO DE TÂCHE (2026-09-30, tâche #1270) — et c'est
// l'idée #1175 mise en œuvre, après que je l'ai moi-même AGGRAVÉE deux heures plus tôt.
//
// CE QU'ELLE DISAIT, et elle avait raison : ce fichier portait DEUX motifs qui lisent le même
// registre sans s'accorder — `{1,5}` d'un côté, `{2,4}` de l'autre. Ils s'accordent sur toute
// la population réelle (le registre est à quatre chiffres), donc rien ne les départage
// aujourd'hui, et à #10000 l'un cesserait de reconnaître ce que l'autre lit, EN SILENCE.
//
// CE QUE J'AI FAIT SANS LE VOIR : en élargissant la chaîne des tâches (#1250), j'ai écrit un
// TROISIÈME motif, `{2,5}`. Trois écritures d'une même notion là où le registre en signalait
// déjà deux comme un défaut — et je ne l'ai vu qu'en relisant à froid la liste des idées en
// attente, ce qui est exactement ce que l'Article 25 existe pour provoquer.
//
// CE QUI EST TRANCHÉ ICI, ET CE QUI NE L'EST PAS. Unifier n'était pas sa décision à prendre :
// l'idée #1175 établit DÉJÀ que trois écritures d'une notion sont un défaut, et aucune de ses
// réponses possibles ne demanderait d'en garder trois. La VALEUR de la borne, elle, reste à lui —
// elle est donc écrite une seule fois, nommée, et se change en un endroit.
export const CHIFFRES_DUN_NUMERO_DE_TACHE = "2,5";
export const MOTIF_NUMERO = new RegExp(`#(\\d{${CHIFFRES_DUN_NUMERO_DE_TACHE}})\\b`, "g");

// LA NOTATION DU NUMÉRO DE SESSION (2026-10-02, tâche #1467 — son arbitrage).
//
// LE DÉFAUT QU'ELLE FERME, et il était INDÉCIDABLE jusqu'ici : `#92` peut désigner une tâche du
// suivi DURABLE ou une tâche du gestionnaire de SESSION, qui est éphémère. Les deux s'écrivent
// pareil. `checkActionChain()` déclare lui-même, dans son `horsPortee`, ne pas savoir les
// distinguer — donc ses quatre dernières alertes n'étaient ni vraies ni fausses.
//
// ET LE CAS VRAIMENT DANGEREUX N'EST PAS CELUI QU'IL SIGNALAIT. Un `#92` introuvable se voit.
// Mais `#236` et `#237`, cités dans deux plans comme des tâches de REFONTE GRAPHIQUE, existent
// pour de vrai dans le suivi durable — où ils désignent « THE-DEEP-READER : factorisation » et
// « CIRCLE-TASKS : sélection recommandée ». **Un futur agent les résoudrait silencieusement vers
// la mauvaise chose**, et aucun contrôle ne pouvait le dire : la chaîne vérifie qu'un numéro
// EXISTE, jamais qu'il désigne ce que la phrase prétend.
//
// SA DÉCISION : une notation distincte. `S92` plutôt que `#92`. Un préfixe de lettre sort
// naturellement du champ de MOTIF_NUMERO, qui cherche un `#` — l'effet voulu, obtenu sans toucher
// au motif existant ni risquer de casser ce qu'il attrape déjà.
//
// CE QUI N'EST PAS FAIT, ET C'EST SA CONSIGNE : l'histoire n'est pas réécrite. Les plans anciens
// gardent ce qu'ils disaient ; seuls les quatre cas nommés par l'outil ont été traités à la main,
// en retrouvant ce que le numéro désignait vraiment.
export const MOTIF_NUMERO_DE_SESSION = /\bS(\d{2,5})\b/g;

// Un numéro de session dans un plan n'est JAMAIS un écart : il est éphémère par nature, donc
// l'absence d'une tâche durable correspondante est normale et non un trou. Le reconnaître sert à
// ne PAS l'accuser — l'inverse exact de ce que faisait le silence.
export function estUnNumeroDeSession(texte = "") {
  return new RegExp(MOTIF_NUMERO_DE_SESSION.source).test(String(texte));
}

// Un numéro et sa marque doivent tenir sur la MÊME LIGNE : une marque trois lignes plus haut
// appartient à une autre tâche, et les rapprocher inventerait un traitement qui n'a pas eu lieu.
export function marquesParNumero(texte = "") {
  const parNumero = new Map();
  for (const ligne of String(texte).split("\n")) {
    const nums = [...ligne.matchAll(MOTIF_NUMERO)].map((m) => Number(m[1]));
    if (!nums.length) continue;
    let marque = null;
    for (const [cle, d] of Object.entries(MARQUES_RAPPORT)) if (d.motif.test(ligne)) { marque = cle; break; }
    if (!marque) continue;
    for (const n of nums) if (!parNumero.has(n)) parNumero.set(n, marque);
  }
  return parNumero;
}

// PREMIER PASSAGE RÉEL, PREMIER DÉFAUT (2026-09-25) : la première version lisait TOUT numéro du
// plan, et le vrai fichier en a rendu 122 au lieu de 117. Les cinq de trop venaient des TITRES —
// une tâche dont le sous-sujet dit « #490 : un seul lecteur pour les douze registres » faisait
// entrer #490 dans le plan une seconde fois, et les interdits cités en tête y ajoutaient les leurs.
// Cinq fantômes dans le dénominateur suffisent à fausser toute la couverture.
//
// LA CORRECTION EST STRUCTURELLE, PAS UN FILTRE : une ligne de plan a une FORME — le numéro en
// tête, suivi d'une barre. Un numéro cité au milieu d'une phrase n'est pas une entrée de plan, et
// aucune heuristique n'avait à en décider.
export const MOTIF_LIGNE_DE_PLAN = /^#(\d{1,5})\s*\|/;

export function numerosDuPlan(texte = "") {
  const nums = new Set();
  for (const ligne of String(texte).split("\n")) {
    const m = ligne.match(MOTIF_LIGNE_DE_PLAN);
    if (m) nums.add(Number(m[1]));
  }
  return [...nums].sort((a, b) => a - b);
}

export function construirePlanDeDepart({ taches = [], date, contexte = "" } = {}) {
  if (!date) throw new Error("construirePlanDeDepart : la date se LIT (AGENT-DU-TEMPS), jamais ne se suppose — Article 32");
  const L = [];
  L.push(`PLAN DE DÉPART — mode auto du ${date}`);
  L.push("=".repeat(70));
  L.push("");
  L.push("À CHAQUE TÂCHE, SANS EXCEPTION : respecter le process, utiliser les outils.");
  L.push("(Sa consigne du 2026-09-25, à écrire en tête de chaque tâche — Articles 26 et 31.)");
  L.push("");
  if (contexte) { L.push(contexte); L.push(""); }
  L.push(`NOMBRE DE TÂCHES AU DÉPART : ${taches.length}`);
  L.push("");
  L.push("Ce fichier est figé au moment du départ. Le rapport de nuit se compare À LUI, jamais");
  L.push("à ce dont l'agent se souvient : une tâche absente du rapport final est une tâche tombée");
  L.push("du radar, et c'est le seul constat que personne d'autre ne peut produire.");
  L.push("");
  for (const t of taches) L.push(`#${t.numero} | ${String(t.sujet ?? "").slice(0, 60)} | ${String(t.titre ?? "").slice(0, 100)}`);
  return L.join("\n") + "\n";
}

export function comparerPlanEtRapport({ planTexte = null, rapportTexte = null } = {}) {
  if (planTexte == null) return { mesurable: false, pourquoi: "le PLAN DE DÉPART est introuvable — sans lui, un rapport de fin ne peut être comparé à rien, et son silence sur une tâche ressemblerait à un travail terminé" };
  if (rapportTexte == null) return { mesurable: false, pourquoi: "le RAPPORT DE NUIT est introuvable — la nuit n'a rien rendu, ce qui n'est pas la même chose qu'une nuit sans écart" };
  const plan = numerosDuPlan(planTexte);
  if (!plan.length) return { mesurable: false, pourquoi: "le plan de départ ne contient AUCUN numéro de tâche — une couverture calculée sur zéro rendrait 100 %, ce qui serait le plus faux des verts" };
  const marques = marquesParNumero(rapportTexte);
  const parEtat = { FAIT: [], AVANCE: [], "NON-TRAITE": [], ECARTE: [], JAMAIS_MENTIONNEE: [] };
  for (const n of plan) {
    const m = marques.get(n);
    if (!m) parEtat.JAMAIS_MENTIONNEE.push(n);
    else parEtat[m].push(n);
  }
  const horsPlan = [...marques.keys()].filter((n) => !plan.includes(n)).sort((a, b) => a - b);
  const traitees = parEtat.FAIT.length + parEtat.AVANCE.length;
  return {
    mesurable: true, pourquoi: null,
    total: plan.length, traitees, parEtat, horsPlan,
    couverture: Math.round((1000 * (plan.length - parEtat.JAMAIS_MENTIONNEE.length)) / plan.length) / 10,
    // « Traitée » et « prise en compte » ne sont pas la même chose, et les confondre serait le
    // faux vert de ce mécanisme : une tâche ÉCARTÉE avec sa raison est prise en compte sans être
    // traitée. Les deux chiffres sortent donc séparément, jamais fondus en un seul pourcentage.
    tauxTraitement: Math.round((1000 * traitees) / plan.length) / 10,
    complet: parEtat.JAMAIS_MENTIONNEE.length === 0,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// LE POINT DE CONTRÔLE DE NUIT (2026-09-27, tâche #732, seconde moitié)
// ══════════════════════════════════════════════════════════════════════════
//
// LA PREMIÈRE MOITIÉ DE #732 EST FAITE DEPUIS LE 2026-09-27 et se lit dans
// `docs/mode-auto-process-guardian.md` : le réveil est passé de 45 à 15 minutes, avec un filet
// horaire derrière, et les deux réglages sont historisés avec leur raison. Ce qui MANQUAIT est la
// raison d'être du réglage, et elle était dans la tâche depuis le premier jour : « ce qu'un rappel
// rapproché apporte vraiment, c'est un POINT DE CONTRÔLE forcé ».
//
// UN RÉVEIL N'EST PAS UN CONTRÔLE, ET C'EST TOUT LE DÉFAUT. Un agent réveillé au milieu d'un
// chantier reprend ce chantier — il ne s'arrête pas pour regarder où il en est. Le réveil donnait
// donc la cadence sans jamais donner le regard, et la tâche nommait précisément ce que ça coûte :
// « c'est exactement ce qui aurait attrapé le décalage de colonnes de ce soir en dix minutes au
// lieu de trois heures ».
//
// LES TROIS QUESTIONS SONT CELLES DE LA TÂCHE, mot pour mot, et chacune est MESURÉE plutôt que
// posée. Une question posée à un agent qui vient de travailler vingt minutes reçoit la réponse que
// l'agent croit vraie ; c'est précisément la mémoire à laquelle on ne peut pas se fier (L11, et
// l'Article 32 par l'autre bout). Les trois se lisent donc sur git et sur le suivi.
//
// IL NE BLOQUE RIEN, il REGARDE. Un point de contrôle qui interromprait la nuit serait pire que
// son absence — et le rythme, lui, est déjà garanti par les deux réveils.
// MÊME BORNE QUE SES DEUX FRÈRES, DÉRIVÉE ET JAMAIS RECOPIÉE (Article 24, tâche #1270).
// DEUX OBJETS, UNE SEULE DÉFINITION — ET C'EST VOLONTAIRE (vérifié le 2026-10-02, tâche #1175).
// La tâche #1175 signalait deux motifs divergents dans ce fichier : l'un acceptait 1 à 5 chiffres,
// l'autre 2 à 4. Cette divergence N'EXISTE PLUS : les deux dérivent `CHIFFRES_DUN_NUMERO_DE_TACHE`
// (ligne 1724), donc elles ne PEUVENT plus s'écarter — le défaut a été fermé à la racine, et
// l'élargir à #10000 se fait désormais en changeant un seul chiffre à un seul endroit.
// POURQUOI ON NE GARDE PAS UN SEUL OBJET, et c'est le piège qu'une « unification » ferait naître :
// une expression régulière avec le drapeau `g` est STATEFUL — elle porte son propre `lastIndex`
// entre deux appels. Partager le même objet entre deux lecteurs qui balaient des textes différents
// ferait reprendre l'un là où l'autre s'est arrêté, et produirait des numéros manqués de façon
// intermittente : le pire type de défaut, puisqu'il dépend de l'ordre d'exécution. Deux objets
// construits depuis une définition unique est donc la forme JUSTE, jamais une duplication.
export const MOTIF_NUMERO_COMMIT = new RegExp(`#(\\d{${CHIFFRES_DUN_NUMERO_DE_TACHE}})\\b`, "g");

export function numerosDesCommits(lignes = []) {
  const parNumero = new Map();
  for (const l of lignes) {
    const vus = new Set();
    for (const m of String(l).matchAll(MOTIF_NUMERO_COMMIT)) {
      const n = Number(m[1]);
      if (vus.has(n)) continue;
      vus.add(n);
      if (!parNumero.has(n)) parNumero.set(n, []);
      parNumero.get(n).push(l);
    }
  }
  return parNumero;
}

export function pointDeControle({ planTexte = null, commits = null, suiviFrais = null, depuis = null } = {}) {
  // TROIS REFUS DE CONCLURE, ET CHACUN COUVRE UN FAUX VERT DIFFÉRENT. Sans plan, « rien n'a dérivé »
  // serait rendu sur zéro donnée. Sans liste de commits, « tout est en ordre » dirait seulement
  // qu'on n'a pas regardé. Un plan sans numéro rendrait 100 % de couverture, le plus faux des verts.
  if (planTexte == null) return { mesurable: false, pourquoi: "aucun PLAN DE DÉPART trouvé — sans lui, « je n'ai pas dérivé » est une affirmation sur rien : il n'y a pas de cap auquel se comparer" };
  if (commits == null) return { mesurable: false, pourquoi: "la liste des commits n'a pas pu être lue — « rien à signaler » dirait alors seulement que personne n'a regardé (leçon L11)" };
  const plan = numerosDuPlan(planTexte);
  if (!plan.length) return { mesurable: false, pourquoi: "le plan de départ ne porte AUCUN numéro de tâche : une couverture calculée sur zéro rendrait 100 %, le plus faux des verts" };

  const faits = numerosDesCommits(commits);
  const touchees = plan.filter((n) => faits.has(n));
  const intouchees = plan.filter((n) => !faits.has(n));
  const horsPlan = [...faits.keys()].filter((n) => !plan.includes(n)).sort((a, b) => a - b);
  return {
    mesurable: true,
    // QUESTION 1 — OÙ J'EN SUIS.
    ou: { total: plan.length, touchees, intouchees, commits: commits.length, depuis },
    // QUESTION 2 — LE CARNET DE BORD DIT-IL LA VÉRITÉ. Relayé de check-suivi-fidelity plutôt que
    // recalculé : deux mesures de la même question finissent par diverger (L29).
    carnet: suiviFrais ?? { mesurable: false, pourquoi: "la fraîcheur du suivi n'a pas été fournie — elle se lit chez check-suivi-fidelity, jamais recalculée ici (L29)" },
    // QUESTION 3 — AI-JE DÉRIVÉ DU PLAN. Une tâche hors plan n'est PAS une faute : une nuit trouve
    // des choses. Elle devient un signal quand elle DOMINE — quand on a passé la nuit ailleurs.
    derive: {
      horsPlan,
      partHorsPlan: faits.size ? Math.round((horsPlan.length / faits.size) * 100) : null,
      dominante: faits.size >= 3 && horsPlan.length > touchees.length,
    },
    horsPortee: "il lit les NUMÉROS des messages de commit : un travail réel qui n'en cite aucun est invisible ici, et c'est un plancher, jamais un compte exact. Il REGARDE, il ne bloque jamais — un point de contrôle qui interromprait la nuit serait pire que son absence.",
  };
}

export function formatPointDeControleLines(p) {
  if (!p?.mesurable) return ["", "🚨 POINT DE CONTRÔLE — PAS MESURÉ", `   ${p?.pourquoi ?? "raison non fournie"}`];
  const L = ["", "🧭 POINT DE CONTRÔLE DE NUIT — les trois questions de la tâche #732, mesurées et non posées", ""];
  L.push(`1. OÙ J'EN SUIS — ${p.ou.touchees.length}/${p.ou.total} tâche(s) du plan touchée(s) par un commit${p.ou.depuis ? ` depuis ${p.ou.depuis}` : ""}, sur ${p.ou.commits} commit(s).`);
  if (p.ou.intouchees.length) L.push(`   Pas encore touchées : ${p.ou.intouchees.map((n) => "#" + n).join(" ")}`);
  L.push("");
  L.push(`2. LE CARNET DE BORD DIT-IL LA VÉRITÉ — ${p.carnet.mesurable === false ? `⚠️ ${p.carnet.pourquoi}` : (p.carnet.retards?.length ? `🟠 ${p.carnet.retards.length} commit(s) substantiel(s) sans mise à jour du suivi` : "✅ aucun commit récent n'a sauté la mise à jour du suivi")}`);
  L.push("");
  if (!p.derive.horsPlan.length) L.push("3. AI-JE DÉRIVÉ DU PLAN — non : tout ce qui a été commité était au plan.");
  else {
    L.push(`3. AI-JE DÉRIVÉ DU PLAN — ${p.derive.horsPlan.length} tâche(s) hors plan (${p.derive.partHorsPlan} % du travail) : ${p.derive.horsPlan.map((n) => "#" + n).join(" ")}`);
    L.push(p.derive.dominante
      ? "   🟠 ET ELLES DOMINENT : plus de travail hors plan que dedans. Ce n'est pas une faute en soi — une nuit trouve des choses — mais c'est le moment de se demander si le plan tient encore."
      : "   Ce n'est pas un écart : une nuit trouve des choses. C'est noté pour que le plan suivant en tienne compte.");
  }
  L.push("");
  L.push(`   HORS PORTÉE : ${p.horsPortee}`);
  return L;
}

// ══════════════════════════════════════════════════════════════════════════
// LA PRÉPARATION AVANT LE PASSAGE EN MODE AUTO (2026-09-27, tâche #770)
// ══════════════════════════════════════════════════════════════════════════
//
// SA DEMANDE, mot pour mot : « tu te prépares psychologiquement pour la nuit : tu prends un moment
// pour relire tous les process qui vont être concernés, tous les outils dont tu vas avoir besoin,
// tu te prépares pour ne rien oublier, tu organises ta mémoire pour la nuit de façon optimale ».
//
// SA RAISON EST EXPLICITE ET ELLE EST JUSTE : « je ne vais pas intervenir pour perturber ta mémoire
// pendant plusieurs heures, alors tu peux organiser ton périmètre interne en fonction ». Ce n'est
// pas une métaphore, c'est une contrainte réelle du travail autonome long : **ce qui n'est pas
// rassemblé avant le départ ne le sera plus**, et une session qui se remplit de recherches
// dispersées finit par oublier la charte qu'elle est censée servir.
//
// LES TROIS GESTES SONT LES SIENS, et chacun est MESURÉ plutôt que coché. Une case « j'ai relu les
// process » est une déclaration ; ce qui suit est une lecture du plan réel.
//
// LE TROISIÈME EST LE PLUS IMPORTANT, ET C'EST LE MOINS ÉVIDENT. « Déclarer ce qu'on met de côté »
// paraît secondaire à côté de « rassembler ce dont on a besoin » — c'est l'inverse. Ce qui n'est
// pas nommé comme écarté ressemble, au matin, à quelque chose qu'on a oublié ; et l'agent de la
// nuit, lui, retombe dessus à trois heures et hésite, parce que rien ne dit que c'était un choix.
//
// IL NE BLOQUE PAS LE DÉPART. Un contrôle de préparation qui refuserait la nuit ferait perdre la
// nuit — exactement ce qu'il existe pour protéger.
// UN PROCESS DÉCLARÉ À MOITIÉ EST PIRE QU'UN PROCESS ABSENT (2026-09-27, trouvé en déclarant le
// onzième) : il apparaît dans les listes, il compte dans les totaux, et il fait planter le premier
// mécanisme qui le lit sur un TypeError qui ne nomme pas le coupable. Ce qui manquait n'était pas
// l'attention — c'est qu'aucun champ n'était EXIGÉ nulle part, donc le douzième aurait fait pareil.
export const CHAMPS_PROCESS_REQUIS = ["slug", "nom", "motsCles", "gardien", "etapes"];

export function findProcessMalDeclares(processes = PROCESSES, { requis = CHAMPS_PROCESS_REQUIS } = {}) {
  const manques = [];
  for (const p of processes) {
    const absents = requis.filter((c) => p?.[c] === undefined || (Array.isArray(p[c]) && !p[c].length));
    if (absents.length) manques.push({ slug: p?.slug ?? "(sans slug)", absents });
  }
  return manques;
}

export function preparationDeNuit({ planTexte = null, taches = [], processes = PROCESSES, outilsPour = null, verifier = null } = {}) {
  if (planTexte == null && !taches.length) {
    return { mesurable: false, pourquoi: "aucun PLAN DE DÉPART et aucune liste de tâches — il n'y a rien à préparer, et rendre « prêt » sur zéro donnée serait le pire des verts la veille d'une nuit entière" };
  }
  const nums = planTexte != null ? numerosDuPlan(planTexte) : taches.map((t) => t.numero).filter(Boolean);
  if (!nums.length) return { mesurable: false, pourquoi: "le plan ne porte aucun numéro de tâche : une préparation calculée sur zéro tâche se déclarerait complète sans avoir rien lu" };

  // GESTE 1 — LES PROCESS CONCERNÉS. Ils se DÉRIVENT des mots du plan contre les process déclarés
  // (Article 24), jamais d'une liste écrite à côté qui se périmerait au prochain process créé.
  const texte = String(planTexte ?? taches.map((t) => `${t.sujet ?? ""} ${t.titre ?? ""}`).join(" ")).toLowerCase();
  const concernes = processes.filter((pr) => {
    const mots = [pr.slug, ...(pr.slug ?? "").split("-")].filter((m) => m.length >= 4);
    return mots.some((m) => texte.includes(m));
  }).map((pr) => ({ slug: pr.slug, document: pr.document ?? pr.doc ?? null, etapes: (pr.etapes ?? []).length }));

  // GESTE 2 — LES OUTILS, ET SURTOUT : EST-CE QU'ILS TOURNENT ? La tâche dit « vérifier qu'ils
  // tournent », et c'est la moitié qui compte : un outil qu'on découvre cassé à trois heures du
  // matin coûte la nuit, alors que le même essai avant le départ coûte deux secondes.
  const outils = [...new Set((outilsPour ? outilsPour(texte) : []).filter(Boolean))];
  const etat = verifier ? outils.map((o) => ({ outil: o, ...verifier(o) })) : [];
  const casses = etat.filter((e) => e.ok === false);

  return {
    mesurable: true,
    processus: { concernes, aucun: concernes.length === 0 },
    outils: { attendus: outils, verifies: etat.length, casses },
    // GESTE 3 — CE QU'ON MET DE CÔTÉ. La liste ne se devine pas : elle se remplit à la main au
    // moment du départ, et l'outil REFUSE de la considérer remplie tant qu'elle ne l'est pas.
    // Une préparation qui se déclarerait complète sans ce geste aurait sauté le seul des trois
    // qu'aucune mesure ne peut produire à la place de l'agent.
    ecarte: { declare: false, pourquoi: "à déclarer à la main au départ : ce qui n'est pas nommé comme écarté ressemble, au matin, à un oubli — et l'agent de la nuit hésite dessus à trois heures parce que rien ne dit que c'était un choix" },
    total: nums.length,
    horsPortee: "il rapproche les process par les MOTS du plan : un process concerné qu'aucun mot n'appelle lui reste invisible, et c'est un plancher. Il ne bloque JAMAIS le départ — un contrôle de préparation qui refuserait la nuit ferait perdre la nuit.",
  };
}

export function formatPreparationLines(p) {
  if (!p?.mesurable) return ["", "🚨 PRÉPARATION — PAS MESURÉE", `   ${p?.pourquoi ?? "raison non fournie"}`];
  const L = ["", `🎒 PRÉPARATION AVANT LA NUIT — les trois gestes de la tâche #770, sur ${p.total} tâche(s) au plan`, ""];
  L.push(`1. LES PROCESS À RELIRE AVANT (pas pendant) — ${p.processus.concernes.length} concerné(s) :`);
  for (const c of p.processus.concernes) L.push(`      · ${c.slug.padEnd(20)} ${c.etapes} étape(s) — ${c.document ?? "document non déclaré"}`);
  if (p.processus.aucun) L.push("      ⚠️ aucun process reconnu dans les mots du plan — c'est possible, mais c'est aussi ce que rendrait un rapprochement cassé : à vérifier à l'œil avant de partir.");
  L.push("");
  L.push(`2. LES OUTILS DONT J'AURAI BESOIN — ${p.outils.attendus.length} attendu(s), ${p.outils.verifies} vérifié(s) :`);
  for (const o of p.outils.attendus) L.push(`      · ${o}`);
  if (p.outils.casses.length) {
    L.push(`   ⛔ ${p.outils.casses.length} NE TOURNE(NT) PAS — à régler AVANT de partir :`);
    for (const c of p.outils.casses) L.push(`      · ${c.outil} — ${c.pourquoi ?? "échec non détaillé"}`);
  } else if (p.outils.verifies) L.push("   ✅ tous répondent. Un outil découvert cassé à trois heures coûte la nuit ; le même essai maintenant coûte deux secondes.");
  L.push("");
  L.push(`3. CE QUE JE METS DE CÔTÉ — ${p.ecarte.declare ? "déclaré" : "🟠 PAS ENCORE DÉCLARÉ"}`);
  L.push(`      ${p.ecarte.pourquoi}`);
  L.push("");
  L.push(`   HORS PORTÉE : ${p.horsPortee}`);
  return L;
}

export function formatComparaisonLines(c) {
  if (!c?.mesurable) return [`⚠️ NON MESURABLE — ${c?.pourquoi ?? "raison inconnue"}`];
  const L = [`=== PLAN DE DÉPART ↔ RAPPORT DE NUIT — ${c.total} tâche(s) au départ ===`, ""];
  for (const [cle, d] of Object.entries(MARQUES_RAPPORT)) {
    L.push(`${cle.padEnd(12)} ${String(c.parEtat[cle].length).padStart(4)} — ${d.quoi}`);
  }
  L.push("");
  L.push(`PRISE EN COMPTE : ${c.couverture} % (une tâche écartée avec sa raison EST prise en compte)`);
  L.push(`TRAITEMENT RÉEL : ${c.tauxTraitement} % (faites ou avancées — et rien d'autre ne compte)`);
  if (c.horsPlan.length) {
    L.push("");
    L.push(`↗️ ${c.horsPlan.length} tâche(s) traitée(s) HORS PLAN : ${c.horsPlan.map((n) => "#" + n).join(" ")}`);
    L.push(`   Ce n'est pas un écart : une nuit trouve des choses. C'est noté pour que le plan suivant en tienne compte.`);
  }
  L.push("");
  if (c.complet) {
    L.push(`✅ AUCUNE TÂCHE TOMBÉE DU RADAR — les ${c.total} du plan portent toutes une marque dans le rapport.`);
    L.push(`   Ce qui ne veut PAS dire qu'elles sont toutes faites : ${c.parEtat["NON-TRAITE"].length + c.parEtat.ECARTE.length} sont déclarées non traitées ou écartées, avec leur raison.`);
  } else {
    L.push(`🔴 ${c.parEtat.JAMAIS_MENTIONNEE.length} TÂCHE(S) DU PLAN N'APPARAISSENT NULLE PART dans le rapport de nuit.`);
    L.push(`   C'est LE constat de ce mécanisme : elles ne sont ni faites, ni écartées, ni même refusées —`);
    L.push(`   elles sont tombées du radar, et personne d'autre que cette comparaison ne pouvait le voir.`);
    L.push(`   ${c.parEtat.JAMAIS_MENTIONNEE.slice(0, 40).map((n) => "#" + n).join(" ")}${c.parEtat.JAMAIS_MENTIONNEE.length > 40 ? ` … +${c.parEtat.JAMAIS_MENTIONNEE.length - 40}` : ""}`);
  }
  return L;
}

export function whichProcess(tache, { processes = PROCESSES } = {}) {
  const t = String(tache ?? "").toLowerCase();
  if (!t.trim()) return [];
  return processes
    // UN PROCESS SANS `motsCles` FAISAIT PLANTER ICI sur un TypeError illisible (2026-09-27, trouvé
    // en déclarant le onzième). Le défaut n'était pas l'oubli — c'est qu'un champ obligatoire
    // n'était exigé nulle part : le douzième l'aurait rencontré aussi. On rend le process
    // INTROUVABLE plutôt que fatal, et `findProcessMalDeclares()` le nomme pour de bon.
    .map((p) => ({ process: p, score: (p.motsCles ?? []).filter((m) => t.includes(m)).length }))
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

// LE MIROIR DE `findBrokenProbes()` — UNE SONDE QUI NE PEUT JAMAIS ÉCHOUER (2026-09-30, tâche #1292)
//
// `findBrokenProbes()` attrape la sonde qui pointe vers rien : elle accuse une étape qui a bien eu
// lieu. Celle-ci attrape l'inverse, et il est plus discret : **une sonde qui ne peut pas échouer
// ABSOUT une étape qui n'a jamais eu lieu.** Les deux défauts sont symétriques ; seul le premier
// avait un détecteur, parce qu'une fausse accusation se remarque et un faux acquittement non.
//
// LE CAS RÉEL QUI L'A FAIT NAÎTRE, ET IL A COÛTÉ SEPT JOURS. L'étape « déclarer le mode sur disque
// plutôt que le supposer » avait pour preuve l'existence de `.mode-de-travail.json`. Le fichier
// existait, il était **versionné**, il datait du 2026-09-23 — et il déclarait l'utilisateur absent
// pendant toutes ses séances de jour. L'étape était verte en permanence. **Une preuve de PRÉSENCE
// n'est pas une preuve de PERFORMANCE.**
//
// LA DÉRIVATION EST EXACTE, ET C'EST CE QUI REND CE CONTRÔLE SÛR : un fichier SUIVI PAR GIT est
// présent dans tout clone neuf, avant qu'aucune étape n'ait été exécutée. Son existence ne peut
// donc jamais distinguer « fait » de « pas fait ». Un fichier NON suivi n'apparaît que si quelque
// chose l'a écrit : lui peut échouer, donc il prouve. Aucune liste à tenir, aucun jugement à
// porter — `git ls-files` répond.
//
// CE QU'IL NE FAIT PAS, ET C'EST DÉLIBÉRÉ (Article 26 : god SIGNALE FORT, il ne bloque JAMAIS).
// Il ne propose pas de remède : ce qu'une vraie preuve serait pour « archiver la simulation » ou
// pour « câbler le mécanisme dans tel script » demande une décision par étape, pas une règle
// générale. Il rend la LISTE et le compte ; les corriger d'un coup fabriquerait trente et une
// sondes inventées, ce qui vaut moins que trente et une sondes honnêtement déclarées faibles.
export function findPreuvesToujoursVraies({ processes = PROCESSES, root = ROOT, shImpl = sh } = {}) {
  let suivis;
  try {
    suivis = new Set(String(shImpl(`git -C ${root} ls-files`)).trim().split("\n").filter(Boolean));
  } catch {
    return { mesurable: false, pourquoi: "git ls-files n'a pas répondu — impossible de savoir quels fichiers voyagent avec le clone, et surtout pas de conclure que toutes les preuves tiennent", toujoursVraies: [], peuventEchouer: [] };
  }
  if (!suivis.size) return { mesurable: false, pourquoi: "aucun fichier suivi par git — le dépôt n'est pas lisible d'ici, et un zéro ici voudrait dire l'inverse de ce qu'il a l'air de dire", toujoursVraies: [], peuventEchouer: [] };
  const toujoursVraies = []; const peuventEchouer = [];
  for (const p of processes) {
    for (const e of (p.etapes ?? [])) {
      const fichier = e?.preuve?.fichier;
      if (!fichier) continue;
      const cas = { process: p.slug, etape: e.cle, libelle: e.libelle, fichier };
      if (suivis.has(fichier)) toujoursVraies.push(cas); else peuventEchouer.push(cas);
    }
  }
  return { mesurable: true, toujoursVraies, peuventEchouer, total: toujoursVraies.length + peuventEchouer.length };
}

export function formatPreuvesToujoursVraiesLines(r) {
  if (!r?.mesurable) return [`🚨 PREUVES D'ÉTAPE — PAS MESURÉ : ${r?.pourquoi ?? "lecture impossible"}`];
  const lignes = [`⚠️  ${r.toujoursVraies.length} preuve(s) d'étape sur ${r.total} ne peuvent JAMAIS échouer : leur fichier est versionné, donc présent dans tout clone neuf avant qu'aucune étape n'ait eu lieu.`];
  lignes.push("   Une preuve de PRÉSENCE n'est pas une preuve de PERFORMANCE — c'est par là que le mode de travail est resté vert sept jours en déclarant l'utilisateur absent.");
  const parProcess = new Map();
  for (const c of r.toujoursVraies) parProcess.set(c.process, [...(parProcess.get(c.process) ?? []), c.fichier]);
  for (const [slug, fichiers] of parProcess) lignes.push(`   · ${slug} : ${[...new Set(fichiers)].join(", ")}`);
  lignes.push(`   ${r.peuventEchouer.length} preuve(s) tiennent vraiment : leur fichier n'est pas versionné, donc il n'existe que si quelque chose l'a écrit.`);
  lignes.push("   Je SIGNALE, je ne corrige jamais (Article 26) : ce qu'une vraie preuve serait se décide étape par étape.");
  return lignes;
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
  // UN VERT SUR ZÉRO DONNÉE N'EST PAS UN VERT (corrigé le 2026-10-02, tâche #1462, leçon L5).
  // Cette fonction rendait « ✅ chaque constat retenu porte sa tâche » sur une liste VIDE — et son
  // unique appelant ne lui passe jamais rien (`chainesAction = []` par défaut, jamais alimenté
  // nulle part dans le dépôt). Autrement dit : le seul contrôle en direct de la chaîne de
  // l'Article 28 était au vert par construction, depuis dix jours, sans avoir jamais mesuré quoi
  // que ce soit. Et son voisin `auditPlansDeDocuments()`, trente lignes plus bas dans le MÊME
  // fichier, refuse explicitement ce piège depuis le 2026-09-25 : deux doctrines opposées sur la
  // même chaîne, et c'est la plus ancienne qui n'avait pas été reprise.
  if (!tous.length && !nonMesurables.length && !resultats.length) {
    l.push("🚨 PAS MESURÉ — aucune chaîne ne m'a été transmise, donc je n'ai rien pu confronter. Ce n'est PAS « tous les plans sont chaînés » : c'est « personne ne m'a donné de quoi regarder ».");
    return l;
  }
  if (!tous.length && !nonMesurables.length) {
    l.push(`✅ Chaque rapport produit porte son plan d'action, et chaque constat retenu porte sa tâche (${resultats.length} chaîne(s) réellement confrontée(s)).`);
    return l;
  }
  if (tous.length) {
    l.push(`${tous.length} maillon(s) rompu(s) — signalés, jamais bloquants :`);
    for (const m of tous) l.push(`  ✗ [${m.responsable}] ${m.source ? `${m.source} : ` : ""}${m.detail}`);
  }
  for (const r of nonMesurables) l.push(`  ? ${r.source ?? "chaîne"} — non vérifiable : ${r.raison}`);
  return l;
}

// ————————————————————————————————————————————————————————————————————————
// LA CHAÎNE NE COUVRAIT QUE LES RAPPORTS — PAS LES DOCUMENTS (2026-09-25, tâche #834)
// ————————————————————————————————————————————————————————————————————————
//
// LE TROU, et il est exactement du type que l'Article 28 a été écrit pour fermer. `checkActionChain()`
// vérifie la chaîne d'un plan d'action qu'on lui PASSE — c'est-à-dire le plan produit par un outil,
// en mémoire, au moment où il tourne. Or ce projet écrit aussi des plans d'action dans des
// DOCUMENTS (`docs/plans/`), destinés à l'utilisateur, et ceux-là n'étaient vérifiés par personne.
// Neuf documents en portaient un au moment de la construction.
//
// POURQUOI ÇA COMPTE AUTANT QUE POUR UN RAPPORT : un document est encore plus durable qu'un
// rapport, donc sa référence morte survit plus longtemps. « → tâche #818 » dans un plan écrit hier
// ressemble à un lien vivant six semaines plus tard, alors que la tâche peut n'avoir jamais été
// créée. **Une référence morte ressemble à un lien, ce qui est pire qu'une absence** — la phrase est
// déjà dans l'Article 28, elle ne s'appliquait simplement pas à cette moitié du terrain.
//
// CE QU'IL NE FAIT PAS : il ne juge ni le contenu du plan, ni la pertinence des tâches annoncées. Il
// vérifie deux choses mécaniques — un plan d'action annonce-t-il au moins une tâche, et ces tâches
// existent-elles pour de vrai dans le suivi.
export const MOTIF_SECTION_PLAN = /^#{1,4}\s*Plan d['’]action/im;
// LE MOTIF EXIGEAIT UN MOT QUE LE DÉPÔT N'ÉCRIT PAS TOUJOURS (2026-09-30, tâche #1250).
// Il réclamait « tâche » juste avant le numéro. Or la moitié des plans de ce dépôt écrivent
// « → **#754** », « **#741**, **#744** » ou « (cf. #818) » — un rattachement parfaitement valide,
// invisible au contrôle. MESURÉ sur les 188 constats RETENU de docs/ : l'ancien motif en voyait
// 47, alors que **89 portent réellement un numéro**. Il en manquait 42, soit près de la moitié.
//
// LE COÛT EST CELUI DE LA LEÇON L4, et il est plus grave ici qu'ailleurs : un contrôle qui accuse
// à tort cesse d'être lu, et celui-ci accusait la discipline la MIEUX tenue du projet. Pire, il
// rendait le taux d'actionnabilité de l'Article 28 « non calculable » alors que la donnée était
// là — un signal ADJACENT (« le mot tâche est absent ») lu comme le signal visé (« aucune tâche
// n'est rattachée »).
//
// POURQUOI ÉLARGIR EST SANS RISQUE ICI, alors qu'ailleurs ce serait ouvrir la porte au bruit :
// le numéro capté n'est jamais cru sur parole — la ligne suivante VÉRIFIE qu'il existe dans le
// suivi durable. Un faux positif (un « #3 » qui n'était pas une tâche) ressort donc en référence
// morte plutôt qu'en faux vert, et c'est le bon sens de l'erreur. Le plancher à deux chiffres
// écarte au passage les « #1 » d'énumération, qui ne sont jamais des numéros de tâche ici.
export const MOTIF_TACHE_ANNONCEE = new RegExp(`(?:t[âa]che\\s*\\*{0,2})?#(\\d{${CHIFFRES_DUN_NUMERO_DE_TACHE}})\\b`, "gi");

// L'ESTIMATION AVANT DE LANCER — DANS TOUS LES PROCESS, OU EXEMPTÉE EXPRÈS (2026-09-25, tâche #843,
// instruction de #242 : « estimation temps + tokens + API : consolider dans TOUS les process »).
//
// MESURÉ AVANT DE CONCLURE : sur 10 process déclarés, **2 seulement** portent une étape d'estimation
// (`ronde` et `simulation`). Ce sont précisément les deux qui coûtent cher — donc le trou n'est pas
// « 8 process négligés », et le dire autrement serait fabriquer une dette comme celle des portées
// (#832) quelques heures plus tôt.
//
// CE QUI MANQUAIT VRAIMENT : rien ne distinguait « ce process n'a rien à estimer » de « personne n'y
// a pensé ». Les deux se lisaient pareil — l'absence d'une étape. Un process ajouté demain serait
// entré dans la même zone grise sans que rien ne le demande.
//
// D'OÙ UNE EXEMPTION DÉCLARÉE, avec sa raison écrite à côté (Article 24 : un contenu curaté à la
// main reste légitime tant que sa nature manuelle est écrite noir sur blanc). Et un garde-fou qui
// refuse le silence : un process NOUVEAU doit soit porter l'étape, soit figurer ici avec sa raison.
export const PROCESS_SANS_ESTIMATION_ASSUMEE = {
  // #846 — modifier un document de référence. Une estimation n'a pas d'objet ici, et pour une
  // raison de FOND plutôt que de commodité : la durée ne dépend pas du process, elle dépend de la
  // règle qu'on touche. Corriger un chemin prend une minute, réécrire un Article en prend une
  // heure, et le process est le même. Annoncer une durée reviendrait à annoncer un chiffre qui ne
  // mesure rien — et un chiffre qui ne mesure rien finit par servir de référence.
  "documents-de-reference": "la durée ne dépend pas du process mais de la règle touchée : corriger un chemin prend une minute, réécrire un Article une heure, et les deux suivent les mêmes dix étapes. Annoncer une durée ici serait annoncer un chiffre qui ne mesure rien — et un chiffre qui ne mesure rien finit par servir de référence.",
  // LE PRÉ-CHANTIER N'ESTIME RIEN, ET C'EST STRUCTUREL, pas un oubli (2026-09-26) : il ORDONNE de
  // la matière déjà là — il range des idées dans une stratégie, il ne construit rien. L'estimation
  // de durée, de tokens et d'API appartient au CHANTIER qu'il précède, jamais à lui : estimer le
  // coût du rangement des notes reviendrait à chiffrer la lecture d'un plan avant de bâtir.
  "pre-chantier": "ce process ORDONNE de la matière existante, il ne construit rien : l'estimation de durée, de tokens et d'API appartient au chantier qu'il précède, et la dupliquer ici donnerait deux chiffres pour un seul travail",
  "analyse-charte": "lecture et rédaction, sans appel API ni durée imprévisible — l'estimation coûterait plus que ce qu'elle informe",
  "semi-autonome": "ce n'est pas une activité mais un MODE de travail : il n'a ni début ni fin à estimer",
  "nuit": "le plan de nuit EST l'estimation — il liste les chantiers avant de commencer, et une seconde estimation par-dessus ferait doublon",
  "meta": "process d'écriture de process : quelques minutes, aucune consommation mesurable",
  "integration-outil": "suite de vérifications gratuites et déterministes, dont la durée ne dépend pas de ce qu'on y met",
  "integration-ronde": "idem — un branchement, jamais un traitement",
  "xp-ia": "enregistrer une leçon coûte une ligne ; estimer ce geste serait plus long que le geste",
  "etat-des-taches": "lecture du suivi, instantanée et gratuite",
};

export function findProcessSansEstimation(processes = PROCESSES, exemptions = PROCESS_SANS_ESTIMATION_ASSUMEE) {
  if (!Array.isArray(processes) || !processes.length) {
    return { mesurable: false, pourquoi: "aucun process déclaré : rien à confronter, ce qui n'est pas la même chose que « tous estiment »" };
  }
  const porte = (p) => (p.etapes ?? []).some((e) => /estim/i.test(e.cle ?? "") || /estim|durée|consommation/i.test(e.libelle ?? ""));
  const avec = []; const exemptes = []; const manquants = [];
  for (const p of processes) {
    if (porte(p)) { avec.push(p.slug); continue; }
    if (exemptions[p.slug]) { exemptes.push({ slug: p.slug, pourquoi: exemptions[p.slug] }); continue; }
    manquants.push(p.slug);
  }
  return {
    mesurable: true, avec, exemptes, manquants, total: processes.length,
    horsPortee: "Il vérifie qu'une ÉTAPE d'estimation est déclarée, jamais qu'elle a été faite ni qu'elle était juste. Un process qui l'annonce et ne l'exécute pas passe ici pour conforme.",
  };
}

export function estimationParProcessLines(r) {
  if (!r?.mesurable) return [`— Estimation avant lancement — PAS MESURÉ : ${r?.pourquoi ?? "aucune donnée"}`];
  const L = [`— Estimation avant lancement (${r.avec.length} process sur ${r.total} la déclarent) —`];
  L.push(`  ✅ portent l'étape : ${r.avec.join(", ") || "aucun"}`);
  L.push(`  ⚪ exemptés AVEC RAISON ÉCRITE (${r.exemptes.length}) : ${r.exemptes.map((e) => e.slug).join(", ") || "aucun"}`);
  if (r.manquants.length) {
    L.push(`  🔴 ${r.manquants.length} process ne portent NI l'étape NI une exemption écrite : ${r.manquants.join(", ")}.`);
    L.push("     Ce n'est pas un reproche automatique : soit l'étape manque, soit l'exemption n'a jamais été écrite. Les deux se lisent pareil, et c'est justement ce que ce contrôle refuse de laisser en l'état.");
  }
  L.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export function auditPlansDeDocuments(documents = [], suiviText = null) {
  const avecPlan = documents.filter((d) => MOTIF_SECTION_PLAN.test(String(d?.texte ?? "")));
  if (!documents.length) {
    return { mesurable: false, pourquoi: "aucun document fourni : répondre « tous les plans sont chaînés » sur zéro fichier lu serait le faux vert que cette chaîne existe pour empêcher" };
  }
  if (suiviText == null) {
    return {
      mesurable: false,
      documentsLus: documents.length, avecPlan: avecPlan.length,
      pourquoi: "texte du suivi non fourni — on peut voir qu'un plan n'annonce aucune tâche, jamais vérifier qu'une tâche annoncée existe pour de vrai",
    };
  }
  const sansAucuneTache = []; const referencesMortes = []; const sains = [];
  for (const d of avecPlan) {
    const numeros = [...String(d.texte).matchAll(MOTIF_TACHE_ANNONCEE)].map((m) => m[1]);
    if (!numeros.length) { sansAucuneTache.push(d.chemin); continue; }
    const mortes = [...new Set(numeros)].filter((n) => !new RegExp(`\\|\\s*${n}\\s*\\|`).test(suiviText));
    if (mortes.length) referencesMortes.push({ chemin: d.chemin, taches: mortes });
    else sains.push(d.chemin);
  }
  return {
    mesurable: true, documentsLus: documents.length, avecPlan: avecPlan.length,
    sansAucuneTache, referencesMortes, sains,
    horsPortee: "Il vérifie qu'un plan annonce des tâches et qu'elles existent dans le suivi DURABLE — jamais qu'elles sont les BONNES, ni que le plan est complet. Et il ne peut pas distinguer une tâche jamais créée d'un numéro emprunté au gestionnaire de session : les deux s'écrivent « #92 », et c'est précisément ce que la notation partagée rend indécidable.",
  };
}

export function plansDeDocumentsLines(a) {
  if (!a?.mesurable) return [`— Chaîne document → tâches — PAS MESURÉ : ${a?.pourquoi ?? "aucune donnée"}`];
  const L = [`— Chaîne document → plan d'action → tâches (${a.avecPlan} plan(s) dans ${a.documentsLus} document(s)) —`];
  if (!a.sansAucuneTache.length && !a.referencesMortes.length) {
    L.push("✅ Chaque plan d'action écrit dans un document annonce des tâches, et toutes existent dans le suivi.");
  } else {
    for (const c of a.sansAucuneTache) L.push(`  ✗ ${c} porte un plan d'action et n'annonce AUCUNE tâche — un plan qui n'engage rien est une formalité`);
    for (const r of a.referencesMortes) L.push(`  ✗ ${r.chemin} annonce ${r.taches.map((t) => `#${t}`).join(", ")}, introuvable(s) dans le suivi durable. DEUX CAUSES, et elles appellent deux gestes : soit la tâche n'a jamais été créée (référence morte — elle ressemble à un lien, ce qui est pire qu'une absence), soit le numéro vient du gestionnaire de session, qui n'est PAS une source durable — et un futur agent ne pourra pas le résoudre (Article 27)`);
  }
  L.push(`  HORS PORTÉE : ${a.horsPortee}`);
  return L;
}

export function buildProcessComplianceReport({ processes = PROCESSES, root = ROOT, verdictsSecondaires = [], sectionAngel, chainesAction = [], plansDeDocuments = null } = {}) {
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
  // La MÊME chaîne, sur l'autre moitié du terrain (2026-09-25, tâche #834) : les plans d'action
  // écrits dans des DOCUMENTS, que rien ne vérifiait. Un document survit plus longtemps qu'un
  // rapport, donc sa référence morte aussi.
  if (plansDeDocuments) lignes.push("", ...plansDeDocumentsLines(plansDeDocuments));
  // L'estimation avant lancement, process par process (2026-09-25, tâche #843) : dérivée de
  // PROCESSES, donc un process ajouté demain y entre sans que personne n'y pense (Article 24).
  lignes.push("", ...estimationParProcessLines(findProcessSansEstimation(processes)));
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
    ? `⚠️ ${horsGabarit.length} réponse(s) manquante(s) au gabarit de process (docs/templates/process.md) :\n  ${horsGabarit.map((e) => `${e.process} (${e.doc}) — ${e.quoi}`).join("\n  ")}`
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

// Les lignes à imprimer quand — et SEULEMENT quand — la déclaration de mode n'a plus de sens.
// Un mode frais ne produit rien : un contrôle qui parle à chaque passage devient du décor (L6).
export function lignesDuModeDate() {
  let ligne = null;
  try {
    const fr = fraicheurDuMode();
    if (!fr.mesurable || fr.date) ligne = formatFraicheurDuMode(fr);
  } catch { /* fichier illisible : pas de relai, jamais un faux vert */ }
  if (!ligne) return [];
  return ["=== MODE DE TRAVAIL — la déclaration a-t-elle encore un sens ? ===", "", ligne.trim(), ""];
}

function main() {
  // LA SOUS-COMMANDE DU CROCHET, traitée AVANT tout le reste (2026-09-25, tâche #436 partie 2).
  // Deux raisons, et aucune n'est cosmétique :
  //   · PAS DE BANNIÈRE. Elle tourne à chaque commit qui touche du code de process. Un
  //     avertissement de fiabilité imprimé là ferait trois lignes de bruit pour zéro information
  //     dans le cas normal — et c'est ce bruit qui rend un contrôle invisible (leçon L6). Le
  //     reste de l'outil continue de l'imprimer, donc le garde-fou qui l'exige reste satisfait.
  //   · PAS DE COMPTEUR D'USAGE. `recordCliUsage` mesure si l'AGENT sollicite ses outils
  //     (Article 31). Un appel déclenché par un crochet n'est pas une sollicitation : l'y compter
  //     ferait passer god pour l'outil le plus consulté du dépôt sans que personne ne l'ait ouvert,
  //     et fausserait le seul chiffre qui dit la vérité sur mes réflexes.
  // `fiches` — le contrôle né du constat du 2026-09-29 (#1159) : quatre outils avaient reçu une
  // capacité et aucune mécanique ne voyait que leur fiche se taisait. À la demande et à la Ronde,
  // jamais au commit : il compare deux versions de chaque script, soit deux appels git par outil.
  if (process.argv[2] === "fiches") {
    recordCliUsage("god-of-all-process");
    for (const l of formatFichesEnRetardLines(findFichesEnRetardSurLeurScript())) console.log(l);
    return;
  }

  if (process.argv[2] === "dette") {
    for (const l of detteDuDernierCommitLines(detteDuDernierCommit())) console.log(l);
    // LE MODE DATÉ SORT PAR ICI, ET C'EST LE SEUL CHEMIN QUI COMPTE (2026-09-30, tâche #1288).
    //
    // MON PREMIER CÂBLAGE A RATÉ SA CIBLE, et le contre-test qui l'accompagnait n'a rien vu :
    // j'avais placé le relai dans le rapport complet, alors que le crochet post-commit appelle
    // `god-of-all-process dette`, qui rend la main bien avant. Le contre-test vérifiait que le
    // FICHIER contenait l'import et le titre — un signal adjacent — au lieu de vérifier que le
    // chemin RÉELLEMENT emprunté imprime la ligne. Le journal de la bannière l'a dit en une
    // seconde : zéro occurrence. C'est la onzième fois de la nuit que ce motif se présente, et
    // la deuxième fois qu'il me prend sur mon propre correctif.
    //
    // ÉCRIT DANS LES DEUX CHEMINS plutôt que déplacé : le rapport complet le montre aussi à qui
    // lance god à la main, et la fonction est la même — il n'y a pas deux vérités, seulement deux
    // sorties.
    for (const l of lignesDuModeDate()) console.log(l);
    return;
  }
  // LE CADRE PARTAGÉ PLUTÔT QUE TROIS GESTES À LA MAIN (2026-09-28, tâche #902, signalé par
  // pure-gold-unity). Ce fichier écrivait son titre en dur, datait sa sortie lui-même et imprimait
  // l'avertissement de fiabilité HORS du cadre — trois des quatre indices d'un rapport non
  // unifié. Le cadre les rend tous les trois, dans le même ordre que les quarante-cinq autres, et
  // l'intérêt n'est pas l'esthétique : un lecteur qui doit deviner où chaque rapport range sa
  // fraîcheur et sa fiabilité finit par ne plus les lire.
  recordCliUsage("god-of-all-process");
  printReportHeader({ tool: "god-of-all-process", title: "god-of-all-process — le référent de la discipline d'exécution", scriptPath: "scripts/god-of-all-process.mjs" });
  const tache = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ");
  // LA PLANCHE DES SCHÉMAS, à la demande. Sortie sur la sortie standard plutôt qu'écrite d'office :
  // un fichier généré à chaque appel se périmerait dès que quelqu'un oublierait de le relancer, et
  // l'utilisateur a demandé qu'elle vive CHEZ GOD, pas dans une copie de plus (Article 24).
  // LE PLAN DE DÉPART ET SA COMPARAISON (2026-09-25, tâche #772). Deux sous-commandes plutôt
  // qu'une : écrire le plan est un geste de DÉPART, le comparer un geste d'ARRIVÉE, et les fondre
  // aurait permis d'écrire le plan à la fin — exactement ce que le mécanisme existe pour empêcher.
  if (tache.startsWith("plan-depart")) {
    const chemin = process.argv[3] ?? `docs/rapports-de-nuit/plan-depart-${new Date().toISOString().slice(0, 10)}.txt`;
    console.log(`Usage attendu depuis l'agent : construirePlanDeDepart({ taches, date }) puis écriture dans ${chemin}.`);
    console.log(`Cette sous-commande ne DEVINE jamais la liste des tâches : elle vient de check-tasks-details, jamais d'ici.`);
    return;
  }
  if (tache.startsWith("comparer")) {
    const lire = (f) => { try { return readFileSync(join(ROOT, f), "utf8"); } catch { return null; } };
    const [planPath, rapportPath] = process.argv.slice(3);
    if (!planPath || !rapportPath) { console.log("Usage : node scripts/god-of-all-process.mjs comparer <plan-depart.txt> <rapport-nuit.txt>"); return; }
    for (const l of formatComparaisonLines(comparerPlanEtRapport({ planTexte: lire(planPath), rapportTexte: lire(rapportPath) }))) console.log(l);
    return;
  }
  if (tache === "schemas") {
    console.log(planchesDesSchemas());
    return;
  }
  // LE POINT DE CONTRÔLE DE NUIT (2026-09-27, tâche #732). Sous-commande plutôt que ligne du rappel
  // post-commit : il n'a de sens qu'EN MODE AUTONOME, et une section de plus à chaque commit de
  // journée serait le bruit qui rend un contrôle invisible (L6).
  // LA PRÉPARATION (2026-09-27, tâche #770) : étape 0 du mode autonome, lancée AVANT de partir.
  // Sous-commande comme le checkpoint, et pour la même raison : elle n'a de sens qu'au départ d'une
  // nuit, jamais à chaque commit de journée.
  if (tache === "preparer") {
    const plan = dernierPlanDeDepart();
    const lire = (f) => { try { return readFileSync(f.startsWith("/") ? f : join(ROOT, f), "utf8"); } catch { return null; } };
    // LES OUTILS SE DEMANDENT À TOOL-BRAIN, le point d'entrée obligatoire (Article 31) — jamais
    // une liste écrite ici, qui se périmerait au premier outil créé (Article 24).
    const outilsPour = (txt) => { try { return (adviseToolBrain({ taskDescription: txt })?.prestations ?? []).flatMap((x) => x.outils ?? []); } catch { return []; } };
    // « VÉRIFIER QU'ILS TOURNENT » est pris au pied de la lettre : `node --check` sur le fichier.
    // Un script cassé découvert à trois heures du matin coûte la nuit ; le même essai maintenant
    // coûte deux secondes.
    //
    // LE PIÈGE, RENCONTRÉ AU PREMIER PASSAGE, ET C'EST LA CLASSE DE DÉFAUT DE LA LEÇON L37 : le
    // catalogue rend des NOMS D'AFFICHAGE (« AGENT-DU-TEMPS », « HARMONIA (nœuds sensibles) »),
    // jamais des noms de fichier. Dériver `scripts/<nom>.mjs` de là accusait VINGT outils d'être
    // introuvables, les vingt à tort — un garde-fou qui accuse à tort cesse d'être lu (L4), et la
    // veille d'une nuit il ferait perdre du temps au pire moment.
    //
    // LE RÉSOLVEUR EXISTAIT DÉJÀ : `normaliserNomDOutil()` est né en 2026-09-25 du même problème,
    // mot pour mot (« la table maîtresse écrit AGENT DES NOMS ; le menu écrit agent-des-noms »).
    // On le réutilise au lieu d'en écrire un second qui finirait par diverger (L29, BP6).
    const scripts = new Set(readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, "")));
    const parNorme = new Map([...scripts].map((f) => [normaliserNomDOutil(f), f]));
    const verifier = (o) => {
      const fichier = scripts.has(o) ? o : parNorme.get(normaliserNomDOutil(o));
      // UN NOM QU'ON N'ARRIVE PAS À RÉSOUDRE N'EST PAS UN OUTIL CASSÉ : c'est une correspondance
      // manquée, et les confondre est exactement le faux positif ci-dessus. On le DIT, sans
      // l'accuser.
      if (!fichier) return { ok: null, pourquoi: `nom non résolu vers un script — ce n'est pas une panne, c'est une correspondance manquée` };
      try { sh(`node --check ${JSON.stringify(join(ROOT, `scripts/${fichier}.mjs`))}`); return { ok: true }; }
      catch (e) { return { ok: false, pourquoi: String(e.message).split("\n")[0].slice(0, 120) }; }
    };
    for (const l of formatPreparationLines(preparationDeNuit({ planTexte: plan ? lire(plan) : null, outilsPour, verifier }))) console.log(l);
    return;
  }
  if (tache === "checkpoint") {
    const plan = dernierPlanDeDepart();
    const lire = (f) => { try { return readFileSync(f.startsWith("/") ? f : join(ROOT, f), "utf8"); } catch { return null; } };
    let commits = null, suiviFrais = null, depuis = null;
    try {
      const cs = recentCommits(30);
      commits = cs.map((c) => c.subject);
      // LA FRAÎCHEUR EST RELAYÉE, jamais recalculée ici : deux mesures de la même question finissent
      // par diverger, et celle-ci a déjà son propriétaire (L29).
      suiviFrais = { mesurable: true, retards: findCommitsMissingSuiviUpdate(cs) };
      depuis = cs.length ? `les ${cs.length} derniers commits` : null;
    } catch (e) {
      suiviFrais = { mesurable: false, pourquoi: `la fraîcheur du suivi n'a pas pu être lue (${e.message})` };
    }
    for (const l of formatPointDeControleLines(pointDeControle({ planTexte: plan ? lire(plan) : null, commits, suiviFrais, depuis }))) console.log(l);
    return;
  }
  // LA CHAÎNE SUR LES DOCUMENTS (2026-09-25, tâche #834) : l'autre moitié du terrain de
  // l'Article 28, que rien ne vérifiait. Sous-commande dédiée parce qu'elle lit deux arborescences
  // entières — jamais imposée au rappel de chaque commit.
  if (tache === "plans") {
    const lireDossier = (dir) => {
      try {
        return readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".md"))
          .map((f) => ({ chemin: `${dir}/${f}`, texte: readFileSync(join(ROOT, dir, f), "utf8") }));
      } catch { return []; }
    };
    // LE SUIVI DURABLE INCLUT LES ARCHIVES, ET L'IGNORER PRODUISAIT 96 % DE FAUSSES ACCUSATIONS
    // (2026-10-02, tâche #1461). Cette lecture ne regardait que `docs/suivi/sessions/`. Or une
    // tâche ARCHIVÉE reste une tâche du projet — c'est écrit noir sur blanc chez le lecteur
    // canonique (`categorizeAllSessions()`, check-suivi-fidelity : « ARCHIVE COMPRISE »), qui
    // porte déjà cette raison depuis le 2026-09-29 (#1024/#1204) après que le MÊME défaut y ait
    // été trouvé et corrigé.
    // MESURÉ AVANT CORRECTION : 605 lignes de tâches dans `archives/` contre 737 dans
    // `sessions/`, soit 45 % du carnet durable invisible. Sur douze numéros tirés parmi les
    // « introuvables » (#206, #754, #742, #756, #741, #214, #215, #152, #199, #223, #730, #658),
    // DOUZE existaient dans `archives/`. L'audit réclamait donc du travail sur des tâches faites
    // — et un garde-fou qui accuse le geste correct cesse d'être lu (leçon L4).
    // LE LECTEUR N'EST PAS RECOPIÉ, IL EST RELAYÉ : `listerLesFichiersDeTaches()` sait déjà quels
    // dossiers portent des tâches et exclut les `index.md`, dont les lignes de sommaire avaient
    // déjà été comptées comme quatre fausses tâches une fois. Dupliquer sa logique ici aurait
    // garanti qu'elle rediverge au prochain dossier d'archive (Article 24).
    let suivi = null;
    try {
      const fichiers = listerLesFichiersDeTaches();
      suivi = fichiers.map(({ dossier, fichier }) => readFileSync(join(dossier, fichier), "utf8")).join("\n");
      if (!fichiers.length) suivi = null;   // rien lu n'est jamais « rien à trouver » (L5)
    } catch { /* absent : l'audit dira PAS MESURÉ plutôt que d'accuser */ }
    for (const l of plansDeDocumentsLines(auditPlansDeDocuments(lireDossier("docs/plans"), suivi))) console.log(l);
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
  console.log("--- ÉTAT DU DISPOSITIF ---\n");
  for (const b of buildGodReportBlocks()) console.log(b.text, "\n");

  // UNE VÉRIFICATION QUI NE SORTAIT JAMAIS D'ICI (2026-09-26, tâche #919) —
  // `findScriptsDeservingProcess()` existait, était testée, et AUCUN CODE HORS DE LA SUITE DE TESTS
  // NE L'APPELAIT (leçon L2 : un mécanisme qui ne sort pas du script est une intention). Elle parle
  // du PROJET, pas d'un invariant de code : elle nomme les activités à enjeu que rien ne gouverne.
  // C'est très exactement le métier de god, et son rapport n'en disait pas un mot.
  // LES PREUVES QUI NE PEUVENT PAS ÉCHOUER (2026-09-30, tâche #1292). DANS LE RAPPORT COMPLET ET
  // PAS AU COMMIT, et c'est un choix : trente et une lignes qui ne bougeront pas d'un commit à
  // l'autre deviendraient un mur, donc du décor (L4/L6). Elles appellent une décision par étape,
  // pas une action à chaque passage.
  const preuves = findPreuvesToujoursVraies();
  console.log("=== PREUVES D'ÉTAPE QUI NE PEUVENT JAMAIS ÉCHOUER (tâche #1292) ===\n");
  for (const l of formatPreuvesToujoursVraiesLines(preuves)) console.log(l);
  console.log("");

  const sansProcess = findScriptsDeservingProcess();
  console.log("=== ACTIVITÉS À ENJEU SANS PROCESS ÉCRIT (tâche #919) ===\n");
  if (!sansProcess.length) {
    console.log("✅ Chaque activité à enjeu déclarée a son process écrit.\n");
  } else {
    console.log(`⚠️  ${sansProcess.length} activité(s) à enjeu sans process écrit — je SIGNALE, je ne corrige jamais (Article 26) :`);
    for (const a of sansProcess) console.log(`   · ${a.chemin}\n     pourquoi ça compte : ${a.indices.join(" · ")}`);
    console.log("   Écrire un process pour chacune, ou déclarer noir sur blanc pourquoi elle n'en a pas besoin.\n");
  }

  // LE MODE DE TRAVAIL, RELAYÉ ICI PARCE QU'IL EST UNE ÉTAPE DE PROCESS (2026-09-30, tâche #1288).
  //
  // POURQUOI CHEZ GOD ET NULLE PART AILLEURS : « déclarer le mode sur disque plutôt que le
  // supposer » est déjà une étape de deux process qu'il gouverne (`mode-declare`). Sa preuve était
  // « le fichier existe » — et c'est exactement par là que le défaut est passé : le fichier
  // existait, il avait SEPT JOURS, et il déclarait l'utilisateur absent pendant toutes ses séances
  // de jour. Une preuve de PRÉSENCE n'est pas une preuve de VALIDITÉ.
  //
  // POURQUOI LE RELAI PLUTÔT QU'UN CONTRÔLE DE PLUS : la mesure vit chez modes-de-travail, qui
  // possède le fichier ; god ne la refait pas, il la SORT. La fraîcheur était déjà calculée le
  // 2026-09-30 et n'était visible que sur deux lignes de commande qu'il faut penser à lancer —
  // c'est-à-dire, à la session suivante, nulle part (leçon L2, et Article 27).
  //
  // ET IL NE CORRIGE RIEN : redéclarer le mode à la place de quelqu'un serait affirmer que
  // l'utilisateur est revenu, ce qu'aucune mécanique ne sait.
  for (const l of lignesDuModeDate()) console.log(l);

  // LE PLAN D'ACTION DE GOD LUI-MÊME (2026-09-26, tâche #803) — et l'ironie était complète : le
  // contrôleur qui CONSTATE qu'un rapport sans plan d'action n'est pas fini (Article 28) était le
  // seul outil du dépôt à scanner, à émettre des constats, et à s'arrêter sans conclure.
  // L'instruction demandée par la tâche a été faite par `findOutilsDevantConclure()`, qui existait
  // déjà : sur 32 scanners, 26 concluent, 5 sont dispensés parce qu'ils rendent un ÉTAT et non des
  // constats, et il en restait UN qui devait conclure. Celui-ci.
  const ecartsGod = [
    ...detteDuDernierCommit().filter((e) => e.lien !== "a-confirmer").map((e) => ({
      fichier: e.fichier, defaut: `dette documentaire née au commit ${e.commit} : ${e.docs.join(", ")} pas mis à jour`,
      tache: `mettre à jour ${e.docs.join(" et ")}, ou déclarer pourquoi ce changement ne les concerne pas`, fausseUneMesure: true })),
    ...sansProcess.map((a) => ({
      fichier: a.chemin, defaut: "activité à enjeu sans process écrit",
      tache: `écrire le process de « ${a.chemin} », ou déclarer noir sur blanc pourquoi elle n'en a pas besoin`, fausseUneMesure: false })),
    // UN SEUL CONSTAT POUR LES TRENTE ET UNE, jamais trente et un : elles ont la même cause et se
    // décident ensemble. Trente et une lignes de plan d'action pour un seul défaut de conception
    // noieraient les autres constats, ce qui est la façon la plus sûre de n'en traiter aucun.
    ...(preuves.mesurable && preuves.toujoursVraies.length
      ? [{ fichier: "scripts/god-of-all-process.mjs",
           defaut: `${preuves.toujoursVraies.length} preuve(s) d'étape sur ${preuves.total} portent sur un fichier VERSIONNÉ : présentes dans tout clone neuf, elles ne peuvent jamais distinguer « fait » de « pas fait »`,
           tache: "décider, étape par étape, ce qu'une vraie preuve serait — ou déclarer par écrit que la présence du fichier suffit et pourquoi",
           // LE NUMÉRO SORT DE LA PROSE ET ENTRE DANS SON EMPLACEMENT (2026-10-01, tâche #1355).
           // Il était écrit « (tâche #1292) » à la fin de la phrase : lisible par un humain,
           // invisible à toute relecture mécanique — c'est exactement le chaînon manquant que
           // JESUS avait nommé.
           //
           // ET LE NUMÉRO ÉTAIT DÉJÀ MORT QUAND JE L'AI DÉPLACÉ (2026-10-01, tâche #1409). #1292 a
           // CONSTRUIT ce détecteur et s'est close là-dessus, à juste titre : bâtir la sonde et
           // DÉCIDER ce qu'une vraie preuve serait sont deux travaux, et le second est une décision
           // de conception qui revient à l'utilisateur. Le constat, lui, se répète à chaque
           // passage — il pointait donc vers une tâche close, ce qui est pire qu'un renvoi absent :
           // un lien mort RASSURE, et le détecteur le dit lui-même du cas « référence morte ».
           // EN LE RENDANT LISIBLE PAR UNE MACHINE, #1355 A AGGRAVÉ LA CHOSE sans le voir : une
           // prose vague n'engage personne, un champ structuré a l'air vérifié. #1409 est la tâche
           // réelle, ouverte et marquée À TRANCHER parce que la décision n'est pas celle de l'agent.
           numeroTache: 1409,
           fausseUneMesure: true }]
      : []),
  ];
  const planGod = planDactionDepuisEcarts(ecartsGod, { toolSlug: "god-of-all-process",
    libelle: (e) => `${e.fichier} — ${e.defaut}`, tache: (e) => e.tache });
  imprimerPlanDaction(planGod);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
