// circle-process-guardian.mjs (2026-09-22) — vérifie mécaniquement que le processus complet de la
// Ronde CIRCLE-TASKS a bien été suivi, tel que documenté dans docs/circle-process-detail.txt
// (Parties 5 et 7). JAMAIS un second calcul divergent : réutilise findOrphanReportFiles()/
// findRegistriesMissingFromCircle() déjà écrites, CIRCLE_ITEMS/CIRCLE_REPORT_FOLDERS déjà réels,
// jamais une liste recopiée à la main (Article 24).
//
// Portée honnête : certains faits (la question AUTO/PRIME/GOAT a bien été posée, quels items ont
// réellement été cochés en conversation, le nombre de points trouvés par l'analyse) ne sont PAS
// observables depuis le code seul — l'agent qui pilote doit les fournir explicitement. Ce module
// ne devine jamais ces faits, il les VÉRIFIE quand ils sont fournis, et signale honnêtement leur
// absence plutôt que de les supposer vrais.
//
// Jamais une correction automatique (cf. Article 20/circle-process-detail.txt : « signaler
// seulement, comme tout le reste de ce paysage d'outils »).
//
// Double communication (alerte console + rapport) — rappel permanent (2026-09-22) : par
// construction, chaque item de CIRCLE_ITEMS écrit dans son rapport (recordCircleItemReport())
// exactement le même texte qu'il annonce à l'oral (son `execute` le dit littéralement). Le vrai
// point de vigilance n'est donc jamais un bug de conception, mais la discipline d'exécution de
// l'agent qui pilote une vraie Ronde : suivre cette instruction à chaque item, sans jamais
// improviser un contenu de rapport différent de ce qui vient d'être annoncé en conversation. Ce
// commentaire EST une part du mécanisme de mémoire pour ce point (le fichier n'a aucune autre
// mémoire persistante) — jamais à retirer au prétexte qu'« il n'y a rien à vérifier mécaniquement » :
// verifyDoubleCommunication() ci-dessous rend le point réellement vérifiable dès que l'agent fournit
// les deux textes, jamais un simple rappel qui resterait sans prise sur un vrai manquement.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  CIRCLE_ITEMS, CIRCLE_REPORT_FOLDERS, ITEMS_SANS_DOSSIER_ASSUME, NOT_RECOMMENDED_BY_DEFAULT, COSTLY_SUBSTITUTES, loadLastRun, findRegistriesMissingFromCircle,
  // LA BARRIÈRE D'OUVERTURE ET LE SUIVI DES QUESTIONS (câblés ici le 2026-09-23). Ces mécanismes
  // vivaient dans circle-tasks.mjs et dans docs/circle-process-detail.txt (Parties 8 et 11) — le
  // gardien du process, lui, n'en savait rien : `grep` n'en trouvait pas une seule mention. Un
  // process dont le gardien ignore la moitié des règles ne garde que l'autre moitié, et le dit
  // pourtant conforme. Jamais un second calcul : ce sont les fonctions RÉELLES qui sont importées,
  // jamais une logique réécrite ici (Article 24).
  loadOuverture, findFaitsManquants, ouvertureEstFraiche, autoriseCloture, OUVERTURE_VALIDE_HEURES,
  loadQuestionsSansReponse, questionsAReposer, enAttenteProchaineRonde, prochaineAction,
  MAX_TENTATIVES_PAR_RONDE, loadSeriesPassees, effetDUneSeriePassee, HYPOTHESE_SILENCE,
  findEtapesDeQuestionsManquantes, findEtapesDivergentesDuDocument,
} from "./circle-tasks.mjs";
import { findOrphanReportFiles, REGISTRIES, findEcrivainsDeRegistreSansContribution } from "./doc-report.mjs";
import { walkDocsPaths, sh, outilsHorsPortee, porteeDe, GARDIEN_DOMAINS, pairesParJaccard } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// seuilAlerteOuvertureHeures() — combien d'heures avant l'expiration de l'ouverture le gardien
// commence à prévenir. DÉRIVÉ de OUVERTURE_VALIDE_HEURES, jamais un second chiffre recopié qui
// pourrait diverger le jour où la fenêtre change (Article 24) : un quart de la fenêtre, soit 6 h
// sur 24. Assez tôt pour qu'il reste le temps de rouvrir, assez tard pour ne pas crier à chaque
// passage — un avertissement permanent n'avertit plus de rien.
//
// UNE FONCTION ET PAS UNE CONSTANTE, et ce n'est pas un détail de style : c'était une constante
// jusqu'au 2026-09-23, et elle a introduit un VRAI BUG le jour même. circle-tasks.mjs et ce fichier
// s'importent mutuellement ; une constante de module s'évalue au chargement, donc
// `OUVERTURE_VALIDE_HEURES / 4` explosait (« Cannot access before initialization ») dès qu'on
// chargeait circle-tasks.mjs EN PREMIER. La suite de tests ne l'a pas vu parce qu'elle charge
// toujours dans l'autre ordre — un bug invisible au vert, trouvé par hasard en important les deux
// modules pour une mesure sans rapport.
//
// LA LEÇON, générale : dériver une valeur d'un module qui vous importe en retour ne se fait jamais
// au chargement. Une fonction diffère le calcul jusqu'au premier appel, quand tout est initialisé —
// on garde la dérivation (Article 24) sans payer le cycle.
export function seuilAlerteOuvertureHeures(fenetre = OUVERTURE_VALIDE_HEURES) {
  return fenetre / 4;
}

// Un item produit-il bien un fichier daté d'AUJOURD'HUI dans son dossier ? Réutilise le même
// motif de nom que recordCircleItemReport()/recordSnapshotIfChanged() (circle-signal-*/snapshot-*),
// jamais un second format de nom de fichier inventé ici.
export function hasFreshReportFile(itemId, { folders = CIRCLE_REPORT_FOLDERS, now = Date.now(), listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []) } = {}) {
  const folder = folders[itemId];
  if (!folder) return undefined; // cassandra-rh-signal notamment : jamais ce mécanisme, cf. son propre `execute`.
  const todayLabel = new Date(now).toISOString().slice(0, 10);
  const files = listDirImpl(join(ROOT, folder));
  return files.some((f) => (f.startsWith("circle-signal-") || f.startsWith("snapshot-")) && f.includes(todayLabel));
}

// verifyDoubleCommunication() (2026-09-22, point 3 réel du message de l'utilisateur : « Double
// communication (alerte console + rapport) [...] on parle de discipline d'execution »). Rend le
// point réellement vérifiable dès que l'agent qui pilote fournit les DEUX textes (jamais deviné) —
// une vraie comparaison mécanique, pas seulement un rappel écrit en commentaire (cf. ci-dessus).
// Comparaison volontairement stricte après un simple `trim()` (espaces de bord ignorés, jamais le
// fond) : une vraie divergence de fond entre les deux canaux est exactement ce que ce garde-fou doit
// attraper, jamais masquée par une tolérance approximative.
export function verifyDoubleCommunication(entries = []) {
  const findings = [];
  for (const { itemId, announcedText, recordedText } of entries) {
    if (announcedText == null || recordedText == null) {
      findings.push({ check: "double-communication", message: `Item "${itemId}" : le texte annoncé en conversation et/ou le texte réellement écrit via recordCircleItemReport() n'ont pas été fournis — comparaison impossible, jamais supposée conforme.` });
      continue;
    }
    if (String(announcedText).trim() !== String(recordedText).trim()) {
      findings.push({ check: "double-communication", message: `Item "${itemId}" : le texte annoncé en conversation diffère de celui écrit dans le rapport — la discipline "une seule chaîne, deux canaux" n'a pas été suivie.` });
    }
  }
  return { ok: findings.length === 0, findings };
}

// ————————————————————————————————————————————————————————————————————————
// CE QUE CE GARDIEN COUVRE DU PROCESS, MÉCANISME PAR MÉCANISME (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Demande explicite de l'utilisateur : « assure-toi qu'un mécanisme vérifie que tout est toujours
// bien présent dans le process ET CHEZ SON GARDIEN ». Ce bloc est la moitié « chez son gardien ».
// Il est VÉRIFIÉ, jamais déclaratif : etatConnexionProcessGardien() (god-of-all-process.mjs) croise
// les exports réels de scripts/circle-tasks.mjs avec docs/circle-process-detail.txt et avec ce
// fichier-ci, et fait remonter tout mécanisme qu'un seul des deux côtés connaît.
//
// POURQUOI UNE LISTE ÉCRITE PLUTÔT QUE DES IMPORTS. Importer une fonction qu'on n'appelle pas
// serait un faux témoignage : le gardien paraîtrait la surveiller alors qu'il ne fait que la
// nommer. Ce qui suit dit donc, pour chaque mécanisme du process, COMMENT il est couvert — ou
// pourquoi il ne relève pas de ce gardien. Une ligne « non couvert » est une limite déclarée, pas
// un trou caché : c'est la même discipline des trois états que partout ailleurs (couvert / non
// couvert avec raison / pas mesurable).
export const COUVERTURE_MECANISMES = {
  // — Sélection et lancement (Étapes 1-2) —
  recommendCircleSelection: "couvert indirectement par le contrôle auto-prime-goat : c'est la fenêtre qui détermine la sélection, et c'est elle qui est exigée.",
  recommendCircleSelectionWithPeriodicity: "idem — la périodicité ne change pas l'obligation de poser la fenêtre, seulement ce qu'elle propose.",
  primeAddableItems: "idem : le mode PRIME n'existe que par la fenêtre, déjà exigée.",
  COSTLY_DUE_THRESHOLD_DAYS: "non couvert ici, et c'est volontaire : un seuil de périodicité relève du calibrage de la Ronde, jamais de la discipline d'exécution.",
  // — Exécution et traces (Étapes 3-4) —
  recordCircleItemReport: "couvert par hasFreshReportFile() : c'est la trace que cette fonction laisse qui est vérifiée, jamais son appel.",
  recordCircleTasksRun: "couvert par le contrôle record-run, via loadLastRun() — l'écart de commits, jamais la parole de l'agent.",
  shouldRemindCircleTasks: "non couvert : c'est le rappel qui pousse à lancer une Ronde, donc l'amont du process, jamais son déroulé.",
  REMINDER_COMMIT_THRESHOLD: "idem — seuil du rappel amont.",
  // — Barrière d'ouverture (Partie 8) —
  FAITS_D_OUVERTURE: "couvert par autoriseCloture(), qui s'appuie sur findFaitsManquants() : les faits manquants sont nommés un par un, jamais un simple « incomplet ».",
  // — Questions (Partie 11) —
  ETATS_QUESTION: "couvert par le contrôle questions-a-reposer : les trois états sont ce que loadQuestionsSansReponse() restitue.",
  PALIERS_QUESTION: "couvert par prochaineAction(), qui applique les paliers — le gardien relaie son verdict plutôt que de recalculer l'escalade.",
  enregistrerQuestionsSansReponse: "couvert par l'écart : si une série reste sans réponse sans être enregistrée, series-non-declarees le dit.",
  marquerRepondue: "couvert de la même façon — une question répondue sans être marquée reste au registre et ressort au contrôle suivant.",
  passerLaSerie: "couvert par serie-passee-inconnue : le registre des séries passées est la seule preuve d'une décision de passer.",
  // — Rendu (jamais du ressort de ce gardien) —
  buildCircleRunSummaryText: "non couvert : la FORME du rapport appartient à Doc-Report et report-template, jamais à la discipline d'exécution.",
  groupCircleReportByTheme: "non couvert — présentation.",
  ALERT_ICON: "non couvert — présentation.",
  // — Domaine de Doc-Report (Article 26 : un gardien ne garde jamais le domaine d'un autre) —
  REPORT_PER_RUN_REGISTRIES: "non couvert ici : c'est findOrphanReportFiles() qui en tire la conséquence, et ce gardien relaie son verdict (contrôle orphan-reports).",
  checkHtmlWiring: "non couvert : décision HTML/texte, domaine de Doc-Report.",
  auditHtmlDecisions: "non couvert : même domaine.",
};

// verifyRondeProcess() — le point d'entrée unique. `checkedItemIds`/`executedItemIds` et les
// signaux de l'Étape 5 (recapHtml, analysisPointsFound, questionsAsked, reportsDeliveredBeforeAnalysis)
// sont fournis par l'agent qui pilote, jamais déduits — cf. portée honnête ci-dessus.
export function verifyRondeProcess({
  autoPrimeGoatAsked,
  nightAutonomousMode = false,
  checkedItemIds,
  executedItemIds,
  recapHtml,
  analysisPointsFound,
  questionsAsked,
  reportsDeliveredBeforeAnalysis,
  now = Date.now(),
  circleItems = CIRCLE_ITEMS,
  reportFolders = CIRCLE_REPORT_FOLDERS,
  hasFreshReportFileImpl = hasFreshReportFile,
  findOrphanReportFilesImpl = findOrphanReportFiles,
  findRegistriesMissingFromCircleImpl = findRegistriesMissingFromCircle,
  existingPaths,
  shImpl = sh,
  loadLastRunImpl = loadLastRun,
  voixUtilisateurPosee,
  pointsReportes,
  pointsAInterrogerCount = 0,
  changementModelePosee,
  changementModeleReponse,
  retourModeleQuand,
  retourModeleRappelPose,
  // Les faits de la barrière d'ouverture et du suivi des questions : lus sur disque par défaut
  // (ils Y vivent réellement), injectables pour les tests. Jamais fournis par l'agent : ces
  // deux-là sont les rares faits du process qui LAISSENT une trace — les demander à l'agent
  // reviendrait à préférer sa parole à la preuve.
  loadOuvertureImpl = loadOuverture,
  loadQuestionsSansReponseImpl = loadQuestionsSansReponse,
  loadSeriesPasseesImpl = loadSeriesPassees,
  seriesReellementPosees,
  // Le DÉTAIL par étape, jamais un total : { ouverture: 3, "constats-analyse": 4, ... }
  questionsParEtape,
  // Les Gardiens sacrés dont le verdict a été LIVRÉ à l'utilisateur avec la Ronde.
  gardiensLivres,
  rapportsLivresIndividuellement,
  nombreDeRapportsEcrits,
  nombreDeRapportsLivres,
  // LES CINQ RÈGLES MUETTES (câblées le 2026-09-23, décision explicite de l'utilisateur : « les
  // cinq d'un coup »). Elles étaient écrites dans docs/circle-process-detail.txt et importées ici,
  // et pas une seule n'était APPELÉE : le contrôleur portait leur nom sans faire leur travail.
  // Un import n'est pas un câblage — c'est exactement la forme de défaut que la nuit du 2026-09-23
  // a trouvée quatre fois, et celle-ci en est la cinquième. Injectables pour les tests, lues sur
  // disque par défaut : ces faits-là Y vivent réellement, les demander à l'agent reviendrait à
  // préférer sa parole à la preuve.
  findEtapesDivergentesDuDocumentImpl = findEtapesDivergentesDuDocument,
  findEcrivainsDeRegistreSansContributionImpl = findEcrivainsDeRegistreSansContribution,
  registries = REGISTRIES,
  existsImpl = (chemin) => existsSync(join(ROOT, chemin)),
  tendanceDesSignauxDeRondeImpl = tendanceDesSignauxDeRonde,
} = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

  // 0. CHANGEMENT DE MODÈLE IA (Q1/Q2/Q3) — câblé le 2026-09-22 au soir, et il porte le numéro 0
  // parce que sa place dans le process est AVANT la question AUTO/PRIME/GOAT, dans les 3 modes sans
  // exception (docs/regles-de-travail.md, docs/circle-process-detail.txt Partie 4).
  //
  // POURQUOI IL EXISTE, ET CE QUI L'A DÉCLENCHÉ. Le protocole était construit depuis le 2026-09-22
  // et déclarait lui-même sa limite : « aucun garde-fou mécanique ne peut vérifier que Q1/Q2/Q3 ont
  // bien été posées ». Le soir même, j'ai lancé une Ronde sans poser Q1. Rien ne l'a attrapé — ni
  // pendant, ni après — et quand l'utilisateur a demandé si cette partie n'avait pas été oubliée,
  // j'ai d'abord répondu qu'elle n'était pas applicable, en m'appuyant sur une Partie 4 restée
  // périmée. Un manquement invisible, puis défendu.
  //
  // La limite déclarée était vraie pour le mauvais objet : personne ne peut PROUVER mécaniquement
  // qu'une question a été posée en conversation — mais on peut exiger que l'agent le DÉCLARE, et
  // compter son silence comme un manquement plutôt que comme un blanc-seing. C'est exactement le
  // patron de auto-prime-goat juste en dessous, qui vit avec la même impossibilité depuis toujours.
  //
  // LA BORNE, identique à celle de la fenêtre AUTO/PRIME/GOAT et pour la même raison : « aucune
  // fenêtre y compris GOAT/AUTO ne doit être bloquante pour le mode autonome ». Q1 est intégralement
  // sautée sans utilisateur présent — une question posée à personne n'est pas une vérification,
  // c'est un blocage.
  if (!nightAutonomousMode && changementModelePosee !== true) {
    add("changement-de-modele", "La question Q1 (« Voulez-vous changer de modèle/agent IA pour exécuter cette Ronde ? ») n'a pas été posée avant la fenêtre AUTO/PRIME/GOAT. Elle est obligatoire dans les 3 modes, reposée à chaque Ronde et jamais mémorisée de l'une à l'autre — un « ne t'arrête pas » général ne vaut jamais dispense d'une étape précise. Seul le mode autonome en dispense.");
  }
  // Q3 n'est due que si l'utilisateur a réellement répondu « oui » à Q1 : la réclamer autrement
  // ferait crier le gardien sur le cas le plus fréquent et de loin (pas de changement de modèle),
  // ce qui apprend à ignorer ses alertes. Les deux branches de Q2 ont chacune leur rappel — « avant »
  // une pause après les scans, « après » un dernier rappel une fois l'analyse écrite — mais
  // l'obligation est la même : il est posé, ou il manque.
  if (!nightAutonomousMode && changementModeleReponse === "oui" && retourModeleRappelPose !== true) {
    add("retour-de-modele", `Le rappel de retour au modèle précédent (Q3, branche « ${retourModeleQuand ?? "non précisée"} ») n'a pas été posé. Il est systématique une fois le changement accepté, même si rien ne laisse penser à un oubli — et une réponse négative n'est jamais suivie d'insistance.`);
  }

  // 1. AUTO/PRIME/GOAT — DURCI LE 2026-09-22, et la borne autonome élargie le même jour.
  //
  // Ce qui a changé, et pourquoi. À la Ronde du 2026-09-22 j'avais choisi AUTO tout seul, en
  // écrivant ma raison, parce que l'utilisateur venait de demander qu'on ne l'arrête plus. Je lui
  // ai posé la question à la clôture : était-ce la bonne conduite ? Réponse : NON, « demande
  // toujours ». La fenêtre coûte un clic et détermine tout le reste de la Ronde — elle n'est donc
  // jamais ce qu'on sacrifie pour aller plus vite, et ma latitude de la sauter en écrivant une
  // raison est retirée. Un « ne t'arrête pas » ne vaut plus dispense.
  //
  // LA BORNE, posée explicitement dans le même échange : « attention, aucune fenêtre y compris
  // GOAT/AUTO ne doit être bloquante pour le mode autonome ». L'exemption `nightAutonomousMode`
  // ci-dessous n'est donc pas une tolérance qu'on pourrait resserrer plus tard : c'est une
  // garantie. Une fenêtre posée à personne n'est pas une vérification, c'est un blocage — et un
  // travail autonome qui s'arrête devant une question sans répondant ne produit rien du tout.
  //
  // Les deux règles ne s'opposent pas, elles se partagent le terrain sans recouvrement : présent,
  // on demande TOUJOURS ; absent, on ne demande JAMAIS et le mode AUTO s'applique seul.
  if (!nightAutonomousMode && autoPrimeGoatAsked !== true) add("auto-prime-goat", "La question AUTO/PRIME/GOAT n'a pas été posée avant l'exécution de la Ronde. Depuis le 2026-09-22 elle est obligatoire en présence de l'utilisateur, même s'il a demandé de ne pas être arrêté — elle coûte un clic et détermine toute la Ronde. Seul le mode autonome en dispense, et cette dispense est une garantie, jamais une tolérance.");

  // 2bis. LA VOIX DE L'UTILISATEUR (2026-09-22) — et l'exemption nocturne est CONDITIONNELLE, ce
  // qui la distingue de celle de la fenêtre AUTO/PRIME/GOAT juste au-dessus. Celle-là supprime
  // vraiment l'obligation (une question de lancement n'a aucun sens sans personne pour y répondre) ;
  // celle-ci ne fait que la DIFFÉRER. Exempter sans reporter perdrait les points problématiques de
  // chaque Ronde nocturne en silence — et plus les nuits se multiplient, plus sa voix se réduit,
  // jusqu'à un dispositif qui ne l'interroge plus jamais tout en paraissant fonctionner.
  if (nightAutonomousMode) {
    if (pointsReportes !== true && pointsAInterrogerCount > 0) {
      add("voix-utilisateur", `Ronde nocturne : ${pointsAInterrogerCount} point(s) problématique(s) n'ont pas été reportés au prochain passage — l'absence de l'utilisateur diffère la question, elle ne l'efface jamais.`);
    }
  } else if (voixUtilisateurPosee !== true) {
    add("voix-utilisateur", "La fenêtre de réponses sur les points problématiques de son évaluation n'a pas été confirmée comme posée avant la clôture de la Ronde.");
  }

  // 3. Items cochés vs réellement exécutés — ET L'INVERSE, ajouté le 2026-09-23 après un cas réel.
  //
  // CE QUI MANQUAIT, ET C'EST MOI QUI L'AI RÉVÉLÉ. Pendant la Ronde de ce jour j'ai lancé
  // memory-audit, qui n'est pas dans CIRCLE_ITEMS : je l'avais ajouté de ma propre initiative. Rien
  // ne l'a signalé — ce contrôle ne regardait que les items cochés et NON exécutés, jamais les
  // items exécutés et non choisis. L'utilisateur a tranché : « oui, le contrôleur doit le voir ».
  //
  // Pourquoi ce n'est pas un excès de zèle inoffensif : du travail non demandé reste du travail non
  // tracé. Il ne figure dans aucun rapport de Ronde, son résultat n'est rattaché à rien, et il
  // consomme un temps que la sélection n'avait pas prévu. Surtout, il masque le vrai problème —
  // dans mon cas, un outil de portée SIMULATION lancé dans un contexte Agence, ce que le contrôle
  // de portée juste en dessous nomme désormais explicitement.
  if (checkedItemIds && executedItemIds) {
    const missing = checkedItemIds.filter((id) => !executedItemIds.includes(id));
    if (missing.length) add("checked-vs-executed", `${missing.length} item(s) coché(s) jamais exécuté(s) : ${missing.join(", ")}.`);
    const enTrop = executedItemIds.filter((id) => !checkedItemIds.includes(id));
    if (enTrop.length) add("execute-hors-selection", `${enTrop.length} outil(s) exécuté(s) sans avoir été choisi(s) dans la fenêtre : ${enTrop.join(", ")}. Du travail non demandé reste du travail non tracé — il n'apparaît dans aucun rapport de Ronde et masque parfois un vrai défaut de portée.`);
    // LA PORTÉE (2026-09-23) : un outil de simulation n'a rien à dire sur le dépôt seul. Le
    // registre est lu tel quel, jamais recopié ici (Article 24), et « les deux » n'est jamais
    // signalé — un outil mixte est légitimement aux deux endroits.
    for (const ecart of outilsHorsPortee(executedItemIds, "agence")) add("outil-hors-portee", ecart);
  } else {
    add("checked-vs-executed", "La liste réelle des items cochés et/ou exécutés n'a pas été fournie — ce fait n'est jamais déductible du code seul.");
  }

  // 4. Chaque item exécuté avec producesReport:true a bien laissé un fichier daté d'aujourd'hui.
  if (executedItemIds) {
    const reportItems = circleItems.filter((i) => i.producesReport && executedItemIds.includes(i.id) && reportFolders[i.id]);
    for (const item of reportItems) {
      const fresh = hasFreshReportFileImpl(item.id, { folders: reportFolders, now });
      if (fresh === false) add("missing-report-artifact", `L'item "${item.id}" (producesReport:true) n'a laissé aucun fichier daté d'aujourd'hui dans ${reportFolders[item.id]}.`);
    }
  }

  // 5/5bis/5ter. Récapitulatif HTML, analyse mise en évidence, séquence et questions forcées.
  // ÉTAPE 5 / 5bis NON FOURNIES = ÉCART, JAMAIS UN LAISSEZ-PASSER (corrigé le 2026-09-23).
  //
  // CE QUI N'ALLAIT PAS. Tout ce bloc était gardé par `!== undefined` : ne rien fournir suffisait à
  // rendre ok:true. J'ai clôturé une Ronde sans récapitulatif ni fenêtre 5bis, et le gardien l'a
  // déclarée conforme — j'ai relayé ce verdict à l'utilisateur, qui a corrigé : « je préfère que tu
  // dises 1ère Ronde conforme une fois que les analyses et tout ce qui doit se passer dans le
  // process est terminé ». Il avait raison sur le fond ET la cause était mécanique.
  //
  // C'est le défaut récurrent de ce projet dans sa forme la plus coûteuse : une absence de mesure
  // rendue comme une réussite. Un fait qu'on ne peut pas observer depuis le disque se DEMANDE, et
  // son silence compte comme un manquement — exactement le patron déjà retenu pour
  // auto-prime-goat, voix-utilisateur et changement-de-modele.
  //
  // Exempté en mode autonome, comme toutes les étapes qui supposent quelqu'un en face.
  if (!nightAutonomousMode && recapHtml === undefined) {
    add("recap-absent", "Le récapitulatif de fin de Ronde (Étape 5) n'a pas été fourni. Ne pas le fournir n'est pas la même chose que ne pas en avoir besoin : tant qu'il manque, la Ronde n'est pas terminée, quoi que disent les autres vérifications.");
  }
  if (!nightAutonomousMode && reportsDeliveredBeforeAnalysis === undefined) {
    add("sequence-non-declaree", "La séquence de l'Étape 5 (rapports livrés AVANT la construction de l'analyse) n'a pas été déclarée. Un ordre non déclaré n'est pas un ordre respecté.");
  }
  if (recapHtml !== undefined) {
    if (!/<!DOCTYPE html>/i.test(recapHtml)) add("recap-format", "Le récapitulatif fourni n'est pas un vrai document HTML.");
    if ((analysisPointsFound ?? 0) > 0 && !/class="highlight"/.test(recapHtml)) add("recap-highlight", "Des points ont été trouvés mais le récapitulatif ne porte aucun bloc d'analyse mis en évidence (class=\"highlight\").");
  }
  if (reportsDeliveredBeforeAnalysis === false) add("sequence-order", "La séquence stricte de l'Étape 5 n'a pas été respectée : les rapports doivent être livrés AVANT que l'agent ne construise son analyse.");

  // ÉCRIRE UN FICHIER N'EST PAS LE LIVRER (2026-09-23, écart réel de la Ronde du jour, relevé par
  // l'utilisateur : « erreur dans le process : tu dois d'abord me livrer tous les rapports en
  // fichier txt. Consolide le respect du process stp », puis « n'oublie pas les livraisons de
  // fichier, consolide le process »).
  //
  // CE QUI S'EST PASSÉ, ET POURQUOI LE CONTRÔLE EXISTANT NE POUVAIT PAS L'ATTRAPER. J'ai écrit les
  // 26 rapports sur le disque, je les ai committés, puis j'ai enchaîné sur l'analyse. De mon point
  // de vue les rapports « existaient » ; du sien, il n'avait rien reçu. `reportsDeliveredBeforeAnalysis`
  // portait sur l'ORDRE (rapports avant analyse) et je pouvais honnêtement le déclarer vrai — les
  // fichiers étaient bien écrits avant. Le fait manquant n'était pas l'ordre, c'était la LIVRAISON.
  //
  // Deux faits distincts, donc, et c'est la distinction qui fait le mécanisme : un fichier écrit
  // est une trace pour les outils, un fichier livré est un document pour l'utilisateur. Le second
  // ne se déduit jamais du premier. Le comptage croisé rend l'écart visible plutôt que déclaratif :
  // 26 écrits et 13 livrés se voit, là où un simple « oui » ne dirait rien.
  if (!nightAutonomousMode) {
    if (rapportsLivresIndividuellement === undefined) {
      add("rapports-non-livres", "La livraison des rapports individuels à l'utilisateur n'a pas été déclarée. Écrire un fichier sur le disque et le committer n'est PAS le livrer : le premier est une trace pour les outils, le second un document pour lui. Tant que ce fait manque, l'étape de livraison est réputée non faite.");
    } else if (rapportsLivresIndividuellement === false) {
      add("rapports-non-livres", "Les rapports individuels n'ont pas été livrés avant l'analyse. L'utilisateur lit les rapports pendant que l'agent construit son analyse — livrer après, c'est lui retirer cette lecture parallèle et lui demander de croire la synthèse sur parole.");
    }
    if (Number.isFinite(nombreDeRapportsEcrits) && Number.isFinite(nombreDeRapportsLivres) && nombreDeRapportsLivres < nombreDeRapportsEcrits) {
      add("rapports-partiellement-livres", `${nombreDeRapportsEcrits} rapport(s) écrit(s) mais seulement ${nombreDeRapportsLivres} livré(s) — ${nombreDeRapportsEcrits - nombreDeRapportsLivres} rapport(s) n'existent que pour moi.`);
    }
  }
  // LE COMPTE DES QUESTIONS, PAR ÉTAPE (refondu le 2026-09-23 après un écart ressenti par
  // l'utilisateur : « pourquoi un tel écart dans le nombre de questions : 14 seulement, alors
  // qu'on aurait dû en avoir plus de 30 ? »).
  //
  // CE QUI ÉTAIT FAUX ICI, ET C'ÉTAIT PIRE QU'UN TROU. Ce contrôle comparait un TOTAL NU à une
  // fourchette de 5 à 10 questions. Or la Partie 11 du process détaille un inventaire par étape
  // totalisant 28 à 44. Les deux règles se contredisaient, et c'est la restrictive qui était
  // câblée : le contrôleur aurait SIGNALÉ UN ÉCART si l'agent avait posé les 28 questions dues.
  // Une règle écrite la veille, jamais réconciliée avec celle du lendemain.
  //
  // ET UN TOTAL NU NE PEUT RIEN GARANTIR : 14 questions prises dans deux étapes et 14 réparties
  // sur six ne décrivent pas le même travail. Deux étapes entières ont été sautées ce jour-là sans
  // que rien ne le voie, parce que rien ne comptait PAR ÉTAPE. Le détail est donc exigé, et un
  // total seul est refusé — c'est la même discipline que partout : une mesure trop grossière pour
  // distinguer deux situations différentes n'est pas une mesure.
  if (!nightAutonomousMode) {
    for (const e of findEtapesDeQuestionsManquantes(questionsParEtape, { changementModeleReponse }, { seriesPassees: (loadSeriesPasseesImpl() ?? []).map((x) => x.serie) })) {
      add("questions-par-etape", `Questions — ${e.etape}${e.attendu ? ` (${e.posees}/${e.attendu})` : ""} : ${e.manque}`);
    }
  }

  // 6. record-run — le compteur de fraîcheur doit être retombé à (quasi) 0 juste après la Ronde :
  // au plus 1 commit d'écart toléré (le commit du record-run lui-même, souvent le dernier geste de
  // la Ronde) — jamais un second calcul de comptage divergent de celui déjà utilisé ailleurs.
  try {
    const commitCount = Number(shImpl("git rev-list --count HEAD", { cwd: ROOT.replace(/\/$/, "") }).trim());
    const { lastRunCommitCount } = loadLastRunImpl();
    if (Number.isFinite(commitCount) && Number.isFinite(lastRunCommitCount)) {
      const commitsSinceLastRun = commitCount - lastRunCommitCount;
      if (commitsSinceLastRun > 1) add("record-run", `record-run() n'a pas été appelé à la fin de cette Ronde : ${commitsSinceLastRun} commit(s) d'écart avec le dernier passage enregistré.`);
    } else {
      add("record-run", "record-run() n'a jamais été appelé une seule fois (aucun état local trouvé).");
    }
  } catch { /* best-effort, jamais bloquant */ }

  // 7. findOrphanReportFiles() — aucun fichier ARGUS (ou futur registre "un fichier par passage") orphelin.
  const orphans = findOrphanReportFilesImpl();
  if (orphans.length) add("orphan-reports", `${orphans.length} registre(s) avec des rapports jamais indexés : ${orphans.map((o) => o.slug).join(", ")}.`);

  // 8. findRegistriesMissingFromCircle() — aucun registre orphelin.
  const realExistingPaths = existingPaths ?? walkDocsPaths("docs", "");
  const missingFromCircle = findRegistriesMissingFromCircleImpl(realExistingPaths);
  if (missingFromCircle.length) add("registries-missing-from-circle", `${missingFromCircle.length} registre(s) réel(s) sans entrée CIRCLE_ITEMS ni exclusion documentée : ${missingFromCircle.join(", ")}.`);

  // 8bis. LES 7 GARDIENS SACRÉS — relayés, jamais relancés (cf. bloc dédié plus bas).
  if (!nightAutonomousMode) {
    for (const g of findGardiensNonLivres({ gardiensLivres })) add("gardiens-non-livres", `Gardien sacré ${g.gardien} : ${g.pourquoi}.`);
  }
  for (const g of findGardiensSansRegistreDeclare()) add("gardien-sans-registre", `${g} est déclaré Gardien sacré mais aucun registre n'est déclaré pour lui — son verdict ne peut donc jamais être livré.`);

  // 9. LA BARRIÈRE D'OUVERTURE (docs/circle-process-detail.txt Partie 8). Elle bloque déjà
  // `record-run` côté circle-tasks.mjs ; ici elle est VÉRIFIÉE plutôt que subie, pour que le
  // rapport du gardien dise POURQUOI une Ronde ne pourra pas se clore, au lieu de laisser
  // l'agent le découvrir au dernier geste. Jamais un second calcul : autoriseCloture() est la
  // fonction réelle, appelée telle quelle.
  //
  // La borne autonome est celle de tout le reste de ce fichier, et pour la même raison :
  // autoriseCloture() rend `autorise: true` sans condition en mode autonome. Une barrière qui
  // arrêterait une Ronde de nuit serait exactement le blocage que l'utilisateur interdit.
  {
    const ouverture = loadOuvertureImpl();
    const verdict = autoriseCloture({ ouverture, nightAutonomousMode, now });
    if (!verdict.autorise) add("ouverture-barriere", `La Ronde ne pourra pas être clôturée : ${verdict.raison}. Tant que l'ouverture manque, record-run refuse, le compteur « N commits sans Ronde » continue de monter, et la Ronde ne compte pas comme faite.`);
  }

  // 10. LE SUIVI DES QUESTIONS SANS RÉPONSE (Partie 11). Trois états, jamais deux : répondue,
  // sans réponse, jamais posée — et une question sans réponse est d'abord un ACCIDENT, jamais un
  // refus tant qu'il n'est pas formulé.
  //
  // CE QUE CE BLOC ATTRAPE VRAIMENT, et c'est le trou réel : une série laissée sans réponse qui
  // ne serait ni reposée, ni passée, ni reportée — donc disparue en silence. C'est précisément
  // ce que tout le mécanisme existe pour empêcher, et rien ne le vérifiait.
  {
    const registre = loadQuestionsSansReponseImpl();
    const suite = prochaineAction({ registre });
    if (suite.quoi === "reposer" || suite.quoi === "reposer-et-offrir-de-passer") {
      add("questions-a-reposer", `${suite.questions.length} question(s) en attente au palier ${suite.fois} : ${suite.action}. Hypothèse en vigueur : ${suite.hypothese}. La Ronde ne se clôt pas en les laissant derrière elle.`);
    }
    // LE DÉTAIL PAR PALIER (câblé le 2026-09-23, cinquième des règles muettes). prochaineAction()
    // ci-dessus retient LE PIRE palier et applique son action à toute la liste : une question qui
    // en est à sa première tentative se retrouve annoncée sous l'action d'une question qui en est
    // à sa troisième. Les deux ne demandent pourtant pas le même geste — l'une se repose telle
    // quelle, l'autre s'accompagne d'une offre de passer. Agréger les deux fait perdre exactement
    // l'information que le système de paliers existe pour produire.
    const parPalier = new Map();
    for (const q of questionsAReposer(registre)) {
      const cle = q.fois ?? 1;
      if (!parPalier.has(cle)) parPalier.set(cle, []);
      parPalier.get(cle).push(q);
    }
    if (parPalier.size > 1) {
      const detail = [...parPalier.entries()].sort((a, b) => b[0] - a[0])
        .map(([fois, qs]) => `${qs.length} au palier ${fois} (${qs[0].action})`).join(" ; ");
      add("questions-paliers-melanges", `Les questions en attente ne sont pas toutes au même palier : ${detail}. Le geste attendu diffère d'un palier à l'autre — les traiter d'un bloc applique à chacune l'action de la plus insistante, ce qui revient à perdre le palier.`);
    }
    const reportees = enAttenteProchaineRonde(registre);
    if (reportees.length) {
      add("questions-reportees", `${reportees.length} question(s) au-delà du plafond de ${MAX_TENTATIVES_PAR_RONDE} tentatives : l'insistance s'arrête, le suivi non — elles doivent apparaître dans le rapport de fin de Ronde, jamais disparaître.`);
    }
    // Une série déclarée passée par l'agent sans décision réelle de l'utilisateur : le registre des
    // séries passées est la SEULE preuve valable. Une série inconnue de DEFAUTS_SERIE_PASSEE ne
    // prend aucun défaut improvisé — effetDUneSeriePassee() le dit, ce contrôle le relaie.
    for (const passee of loadSeriesPasseesImpl()) {
      const effet = effetDUneSeriePassee(passee.serie);
      if (!effet.connu) add("serie-passee-inconnue", `Série passée « ${passee.serie} » inconnue de DEFAUTS_SERIE_PASSEE : ${effet.avertissement} — aucun défaut ne sera appliqué, l'agent doit demander plutôt que d'improviser.`);
    }
    // Les séries réellement posées pendant cette Ronde : fait non observable depuis le disque
    // (une fenêtre posée ne laisse aucune trace tant qu'elle n'a pas reçu de réponse). Son absence
    // compte comme un manquement, jamais comme un laissez-passer — même patron que l'Étape 5.
    if (!nightAutonomousMode && seriesReellementPosees === undefined) {
      add("series-non-declarees", `La liste des séries de questions réellement posées pendant cette Ronde n'a pas été déclarée. Sans elle, une série oubliée est indiscernable d'une série répondue — et l'hypothèse en vigueur reste « ${HYPOTHESE_SILENCE} ».`);
    }
  }

  // ————————————————————————————————————————————————————————————————————————
  // 11 à 14 — LES RÈGLES QUI ÉTAIENT ÉCRITES ET QUE PERSONNE N'APPLIQUAIT (2026-09-23)
  // ————————————————————————————————————————————————————————————————————————
  //
  // Chacune de ces quatre vérifications (la cinquième est le resserrement du bloc 10 juste
  // au-dessus) porte sur un mécanisme que ce fichier IMPORTAIT sans jamais l'appeler. Le détecteur
  // de god-of-all-process les a nommées une par une ; elles sont câblées ici plutôt que retirées,
  // parce qu'aucune n'a jamais eu l'occasion de montrer ce qu'elle trouverait.
  //
  // AUCUNE N'EST EXEMPTÉE EN MODE AUTONOME, et c'est délibéré : les quatre lisent des faits
  // observables sur le disque, sans jamais rien demander à personne. La borne de l'utilisateur
  // (« aucune fenêtre ne doit être bloquante pour le mode autonome ») protège les questions posées
  // à un humain absent — elle n'a jamais dispensé d'une vérification qui se fait seule.

  // 11. L'INVENTAIRE DES QUESTIONS CONTRE LE DOCUMENT (Article 24). Le code totalise une fourchette
  // de questions dues par étape ; le document en annonce une. Les deux doivent dire la même chose.
  // Si l'un des deux bouge sans l'autre, le contrôle du bloc 5 ci-dessus mesure contre un barème
  // périmé — et ce barème périmé avait déjà, une fois, contredit le process qu'il vérifiait.
  for (const e of findEtapesDivergentesDuDocumentImpl()) {
    add("inventaire-questions-divergent", `Inventaire des questions : ${e.pourquoi}. Tant que les deux ne concordent pas, le contrôle « questions par étape » mesure contre un barème dont on ne sait plus lequel fait foi.`);
  }

  // 12. L'OUVERTURE QUI VA EXPIRER, dite AVANT qu'elle expire. autoriseCloture() (bloc 9) refuse
  // déjà une ouverture périmée — mais elle le refuse au dernier geste de la Ronde, quand tout le
  // travail est fait. C'est exactement la leçon de la nuit : détecter n'est pas empêcher, et la
  // différence se paie en travail déjà fourni. Une Ronde ouverte il y a 22 h se clôturera dans deux
  // heures ou jamais ; le dire maintenant coûte une ligne, le découvrir à la clôture coûte la Ronde.
  if (!nightAutonomousMode) {
    const ouvertureFraicheur = loadOuvertureImpl();
    if (ouvertureEstFraiche(ouvertureFraicheur, now)) {
      const heuresRestantes = OUVERTURE_VALIDE_HEURES - (now - new Date(ouvertureFraicheur.at).getTime()) / 3600000;
      if (heuresRestantes <= seuilAlerteOuvertureHeures()) {
        add("ouverture-bientot-perimee", `L'ouverture de cette Ronde expire dans ${heuresRestantes.toFixed(1)} h (fenêtre de ${OUVERTURE_VALIDE_HEURES} h). Passé ce délai, record-run refusera la clôture et toute la Ronde devra être rouverte — le dire maintenant, jamais au dernier geste.`);
      }
    }
  }

  // 13. LES REGISTRES DÉCLARÉS QUI N'EXISTENT PLUS. findOrphanReportFiles() (bloc 7) attrape le
  // sens inverse — des rapports sans index. Celui-ci attrape un registre annoncé dans REGISTRIES
  // dont le dossier a disparu : son outil a beau tourner, son verdict n'atterrit nulle part et
  // personne ne le saura jamais. Un registre absent ne contredit rien, donc il rassure à tort —
  // c'est le même défaut que la preuve satisfaite par son propre registre vide.
  for (const r of registries.filter((r) => !existsImpl(r.path))) {
    add("registre-declare-absent", `${r.label} déclare écrire dans ${r.path}, qui n'existe pas. Son verdict ne peut atterrir nulle part, et un dossier absent ne contredira jamais personne : l'outil passera pour muet plutôt que pour cassé.`);
  }

  // 15. LA TENDANCE DES SIGNAUX DE RONDE — le seul contrôle de ce fichier qui regarde PLUSIEURS
  // passages plutôt qu'un seul. Un item muet depuis toujours, ou qui redit la même chose depuis
  // trois Rondes, ne se voit dans aucune Ronde prise isolément.
  for (const t of tendanceDesSignauxDeRondeImpl()) {
    if (t.etat === "jamais écrit" || t.etat === "dossier absent") add("item-sans-signal", `L'item « ${t.item} » n'a jamais écrit un seul signal dans ${t.dossier} — son étape passe pour faite à chaque Ronde et rien ne l'atteste.`);
    if (t.etat === "répété") add("item-qui-se-repete", `L'item « ${t.item} » : ${t.pourquoi}`);
  }

  // 14. LES OUTILS QUI ALIMENTENT UN REGISTRE SANS LE DÉCLARER. Le compteur d'usage sert à répondre
  // à une question que la Ronde pose vraiment (« quels outils ne servent jamais ? »). Un outil qui
  // écrit son registre sans enregistrer sa contribution est compté comme inutilisé alors qu'il
  // travaille — le KPI de la Ronde dit alors le contraire de la vérité, ce qui est pire que de ne
  // rien dire.
  for (const e of findEcrivainsDeRegistreSansContributionImpl()) {
    add("ecrivain-sans-contribution", `${e.fichier} : ${e.pourquoi}`);
  }

  return { ok: findings.length === 0, findings };
}

// ————————————————————————————————————————————————————————————————————————
// LA TENDANCE DES SIGNAUX DE RONDE (2026-09-23, tâche #490) — le lecteur qui manquait à douze registres
// ————————————————————————————————————————————————————————————————————————
//
// LE CONSTAT DE DÉPART, mesuré par data-archangel : douze registres d'items de Ronde sont écrits à
// chaque passage et AUCUN outil ne les relit. Chacun est lu par un humain le jour où il est produit,
// et jamais après. Or, comme data-archangel le dit lui-même : « ce qu'aucun humain ne fera jamais,
// c'est comparer trente passages pour en tirer une tendance ».
//
// CE QUE CE LECTEUR EXPLOITE, ET QU'AUCUNE LECTURE PONCTUELLE NE PEUT DONNER : un item qui signale
// EXACTEMENT LA MÊME CHOSE depuis plusieurs Rondes d'affilée. Pris un par un, ces signaux sont
// tous « normaux » — c'est leur répétition qui est l'information : personne n'a agi entre-temps, et
// la Ronde est en train de re-constater un problème installé au lieu d'en trouver un nouveau.
//
// UN SEUL LECTEUR POUR LES DOUZE, ET POUR TOUS LES SUIVANTS (Article 24). Il parcourt
// CIRCLE_REPORT_FOLDERS, la table réelle des items ; un treizième registre est couvert le jour où
// il rejoint la Ronde, sans qu'une ligne bouge ici. C'était la condition pour que ce chantier ne
// consiste pas à recopier douze chemins en dur — ce qui aurait créé la dette que l'Article 24
// interdit, juste pour verdir le compteur de data-archangel.
//
// TROIS ÉTATS, JAMAIS DEUX : « jamais écrit » (l'item n'a produit aucun signal — c'est le cas de
// docs/relecture-referentiel/, tâche #556), « répété » (même substance sur plusieurs passages) et
// « varie » (des signaux différents, donc une Ronde qui trouve du neuf). Confondre le premier et le
// troisième ferait passer un item muet pour un item sain, ce que tout ce paysage refuse.

// Combien de passages identiques d'affilée avant de le dire. Deux serait du bruit (deux Rondes
// rapprochées trouvent légitimement la même chose) ; trois est le premier chiffre où « personne n'a
// agi » devient une lecture plus probable que « ça vient de se produire ».
// ————————————————————————————————————————————————————————————————————————
// LA CLÔTURE NE PEUT PAS SE PRENDRE POUR ACQUISE (2026-09-24, chantier 4 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : « une Ronde ne doit pas pouvoir se clore si le process n'a pas été
// entièrement déroulé ».
//
// CE QUI L'A FAIT ÉCRIRE, ET C'EST MOI : le 2026-09-23, j'ai clos une Ronde GOAT MAX en sautant
// CINQ des huit étapes de fin. Sa phrase : « tu n'as rien livré à la fin, tu t'es sauvé en
// courant ! ». Mon premier rattrapage était lui-même incomplet, et il a dû le redire : « tu n'as
// toujours pas respecté le process ». La cause, qu'il a nommée mieux que moi : « tu lis les
// raccourcis plutôt que les documents » — j'avais lu la liste d'étapes du contrôleur, qui en
// décrit onze pour toute la Ronde, au lieu du document, qui en décrit HUIT rien que pour la fin.
//
// POURQUOI `verifyRondeProcess()` NE POUVAIT PAS L'ATTRAPER, et c'est la vraie leçon : il est
// DÉCLARATIF. On lui passe `questionsAsked`, `recapHtml`, `analysisPointsFound` — c'est-à-dire ce
// que l'agent AFFIRME avoir fait. Un agent qui saute une étape ne le déclare pas, par définition.
// Un contrôle qui demande à celui qu'il surveille de s'auto-déclarer ne surveille rien.
//
// CE QUI CHANGE ICI : chaque étape est vérifiée contre la TRACE qu'elle laisse sur le disque.
// Un rapport écrit existe ou n'existe pas ; une analyse HTML existe ou n'existe pas. Le disque ne
// se souvient pas de ce qu'on avait l'intention de faire.
export const ETAPES_DE_CLOTURE = [
  { cle: "A", quoi: "les rapports individuels, en fichiers txt, AVANT toute chose", trace: (d) => (d.rapportsIndividuels ?? 0) > 0 },
  { cle: "B", quoi: "l'analyse, en HTML aux normes", trace: (d) => !!d.analyseHtml },
  { cle: "C", quoi: "les questions qui évaluent l'agent, posées AVANT EVAL-IA", trace: (d) => !!d.questionsEvaluationPosees },
  { cle: "D", quoi: "les deux rapports d'évaluation, livrés À PART l'un de l'autre", trace: (d) => !!d.evalDev && !!d.evalIa },
  { cle: "E", quoi: "les quatre rapports de tâches, livrés ici et pas au début", trace: (d) => (d.rapportsDeTaches ?? 0) >= 4 },
  { cle: "F", quoi: "les quatre séries de questions, dans l'ordre", trace: (d) => (d.seriesDeQuestions ?? 0) >= 4 },
  { cle: "G", quoi: "le dernier rappel de modèle, si et seulement si la réponse à Q1 l'appelait", trace: (d) => d.rappelModeleRequis === false || !!d.rappelModeleFait },
  { cle: "H", quoi: "record-run, EN TOUT DERNIER", trace: (d) => !!d.recordRunFait },
];

export function verifyClotureDeRonde(faits = {}, { etapes = ETAPES_DE_CLOTURE } = {}) {
  // Aucun fait fourni : on ne conclut RIEN. Un contrôle de clôture qui rend « conforme » sur une
  // absence de données serait précisément le vert le plus dangereux de tout ce paysage (leçon L5).
  if (!faits || Object.keys(faits).length === 0) {
    return { mesurable: false, peutClore: false, pourquoi: "aucun fait de clôture fourni — rien n'est vérifié, donc rien n'autorise à clore. Un contrôle qui rend « conforme » sur une absence de données est pire qu'aucun contrôle." };
  }
  const manquantes = etapes.filter((e) => !e.trace(faits));
  // L'ORDRE COMPTE POUR H, ET SEULEMENT POUR H : record-run scelle la Ronde. Le lancer avant que
  // les autres étapes soient faites est exactement l'erreur commise le 2026-09-23, et elle est
  // irréversible — une Ronde enregistrée comme close ne se rouvre pas.
  const hAvantLesAutres = !!faits.recordRunFait && manquantes.some((e) => e.cle !== "H");
  return {
    mesurable: true,
    peutClore: manquantes.length === 0,
    manquantes: manquantes.map((e) => ({ cle: e.cle, quoi: e.quoi })),
    hAvantLesAutres,
    pourquoi: manquantes.length === 0
      ? "les huit étapes de fin ont laissé leur trace : la Ronde peut se clore"
      : `${manquantes.length} étape(s) de fin sans trace sur le disque : ${manquantes.map((e) => e.cle).join(", ")} — la Ronde ne peut pas se clore`,
    grave: hAvantLesAutres
      ? "record-run (étape H) a été lancé alors que des étapes précédentes manquent encore. C'est l'erreur exacte du 2026-09-23, et elle est IRRÉVERSIBLE : une Ronde enregistrée comme close ne se rouvre pas."
      : null,
  };
}

export const PASSAGES_AVANT_REPETITION = 3;

// Le seuil de « même substance ». Volontairement haut : on cherche un signal REDIT, jamais deux
// signaux du même domaine. En dessous, deux constats différents sur le même outil se ressembleraient
// assez pour être confondus — et un garde-fou qui crie à tort finit par ne plus être lu (leçon L4).
export const SEUIL_MEME_SUBSTANCE = 0.6;

const motsDuSignal = (texte) => new Set(String(texte ?? "").toLowerCase().match(/[a-zà-ÿ]{4,}/g) ?? []);

// LECTEUR_DE_TABLE — déclaration lue par data-archangel (2026-09-23, tâche #564).
//
// `tendanceDesSignauxDeRonde()` ci-dessous OUVRE réellement chaque dossier de signaux de Ronde, à
// chaque passage, pour comparer les passes et en tirer une tendance. Il ne cite aucun de ces
// chemins : il itère `CIRCLE_REPORT_FOLDERS` et les dérive, comme l'Article 24 l'exige.
//
// Conséquence mesurée avant cette déclaration : data-archangel comptait ces dix-neuf dossiers
// « données fraîches que personne ne lit », parce qu'il mesure la lecture à la citation d'un
// chemin. La bonne conception était punie, et vingt chemins recopiés à la main auraient été
// récompensés. La déclaration corrige la mesure sans affaiblir la règle : data-archangel ne la
// croit pas sur parole, il vérifie que ce fichier lit vraiment le disque avant de la créditer.
export const LECTEUR_DE_TABLE = [
  { table: "CIRCLE_REPORT_FOLDERS", quoi: "ouvre le contenu de chaque dossier de signaux pour comparer les passes et en tirer une tendance — jamais seulement le chemin" },
];

export function tendanceDesSignauxDeRonde({
  folders = CIRCLE_REPORT_FOLDERS,
  root = ROOT,
  listDirImpl = (dir) => (existsSync(dir) ? readdirSync(dir) : []),
  readFileImpl = readFileSync,
  passages = PASSAGES_AVANT_REPETITION,
  seuil = SEUIL_MEME_SUBSTANCE,
} = {}) {
  const resultats = [];
  for (const [item, dossier] of Object.entries(folders)) {
    if (!dossier) continue; // un item sans dossier déclaré n'utilise pas ce mécanisme (cf. son propre execute)
    // Les signaux, du plus ancien au plus récent : le nom de fichier porte l'horodatage, donc
    // l'ordre alphabétique EST l'ordre chronologique — jamais une date de fichier, qui bouge à
    // chaque copie de dépôt.
    // MÊMES MOTIFS DE NOM QUE hasFreshReportFile() ci-dessus, jamais un troisième inventé ici :
    // recordCircleItemReport() écrit `circle-signal-*`, recordSnapshotIfChanged() écrit `snapshot-*`.
    const contenu = listDirImpl(join(root, dossier));
    const fichiers = contenu.filter((f) => f.startsWith("circle-signal-") || f.startsWith("snapshot-")).sort();
    if (!fichiers.length) {
      // TROIS SITUATIONS QUI N'ONT PAS LE MÊME SENS, et les confondre ferait accuser à tort.
      // Trouvé en vérifiant la toute première sortie : docs/hyper-scan-checkpoint/ contient bien des
      // rapports (`scan-*`), simplement aucun SIGNAL DE RONDE — écrire « n'a jamais rien écrit »
      // aurait été faux et l'aurait fait passer pour mort alors qu'il travaille.
      const autresFichiers = contenu.filter((f) => f !== "index.md" && !f.endsWith("-index.md"));
      const etat = !contenu.length ? "dossier absent" : autresFichiers.length ? "produit hors Ronde" : "jamais écrit";
      resultats.push({ item, dossier, etat, passages: 0, autresFichiers: autresFichiers.length });
      continue;
    }
    const derniers = fichiers.slice(-passages);
    if (derniers.length < passages) { resultats.push({ item, dossier, etat: "varie", passages: derniers.length, pourquoi: `seulement ${derniers.length} passage(s) enregistré(s) : il en faut ${passages} pour qu'une répétition veuille dire quelque chose` }); continue; }
    const ensembles = derniers.map((f) => { try { return motsDuSignal(readFileImpl(join(root, dossier, f), "utf8")); } catch { return new Set(); } });
    // Une répétition n'en est une que si TOUTES les paires se ressemblent : deux passages identiques
    // encadrant un troisième différent ne sont pas une stagnation, c'est un aller-retour.
    const pairesAttendues = (passages * (passages - 1)) / 2;
    const semblables = pairesParJaccard(ensembles, { seuil });
    if (semblables.length === pairesAttendues) {
      resultats.push({ item, dossier, etat: "répété", passages, fichiers: derniers, pourquoi: `les ${passages} derniers signaux disent la même chose — la Ronde re-constate au lieu de trouver, donc personne n'a agi entre-temps` });
    } else {
      resultats.push({ item, dossier, etat: "varie", passages: fichiers.length });
    }
  }
  return resultats;
}

export function formatTendanceSignaux(resultats = []) {
  const jamais = resultats.filter((r) => r.etat === "jamais écrit" || r.etat === "dossier absent");
  const horsRonde = resultats.filter((r) => r.etat === "produit hors Ronde");
  const repetes = resultats.filter((r) => r.etat === "répété");
  const l = [];
  if (!jamais.length && !horsRonde.length && !repetes.length) {
    l.push(`Tendance des signaux de Ronde : ${resultats.length} item(s) suivi(s), aucun muet et aucun qui se répète — chaque passage trouve du neuf.`);
    return l.join("\n");
  }
  if (jamais.length) {
    l.push(`🔇 ${jamais.length} item(s) de Ronde n'ont JAMAIS écrit un signal — l'étape passe pour faite à chaque Ronde et rien ne l'atteste :`);
    for (const r of jamais) l.push(`  · ${r.item} (${r.dossier})${r.etat === "dossier absent" ? " — le dossier lui-même n'existe pas" : " — le dossier ne contient que son index"}`);
  }
  if (horsRonde.length) {
    if (l.length) l.push("");
    l.push(`📄 ${horsRonde.length} item(s) produisent des rapports mais AUCUN signal de Ronde — ce n'est pas forcément un défaut, c'est une question à trancher : l'item doit-il vraiment passer par le mécanisme de la Ronde ?`);
    for (const r of horsRonde) l.push(`  · ${r.item} (${r.dossier}) — ${r.autresFichiers} fichier(s) produits hors du mécanisme de signal`);
  }
  if (repetes.length) {
    if (l.length) l.push("");
    l.push(`🔁 ${repetes.length} item(s) redisent la même chose depuis ${PASSAGES_AVANT_REPETITION} passages — pris isolément chacun est normal, c'est leur répétition qui est l'information :`);
    for (const r of repetes) l.push(`  · ${r.item} — ${r.pourquoi}`);
  }
  return l.join("\n");
}

// ————————————————————————————————————————————————————————————————————————
// LES 7 GARDIENS SACRÉS, RELAYÉS PLUTÔT QU'ABSENTS (2026-09-23)
// ————————————————————————————————————————————————————————————————————————
//
// Constat de l'utilisateur après la clôture : « Je ne vois pas les rapports d'ARGUS et HARMONIA
// dans les livraisons de la dernière Ronde, peux-tu voir cela ? »
//
// CE QUI EST NORMAL, ET CE QUI NE L'EST PAS. Leur absence des items de Ronde est DÉLIBÉRÉE : les
// sept Gardiens sacrés tournent à CHAQUE commit (c'est la moitié de leur critère d'appartenance,
// Article 20), donc les relancer pendant une Ronde ne mesurerait rien de neuf. Ça, c'est juste.
//
// CE QUI NE L'EST PAS : leurs verdicts n'arrivaient JAMAIS jusqu'à l'utilisateur. Il lisait 25
// rapports de Ronde sans une ligne des sept outils qui scannent réellement la qualité du code.
// Tourner sans être lu, c'est tourner pour rien — et il a fallu qu'il le remarque lui-même, ce
// qu'aucun mécanisme n'aurait dû laisser arriver.
//
// LA CORRECTION EST LE MÊME PATRON QUE POUR ANGEL, quelques heures plus tôt : on RELAIE au lieu
// de relancer. Un Gardien sacré dont le registre n'a produit aucun signal récent est signalé —
// il tourne à chaque commit, donc un registre muet veut dire qu'il ne tourne plus vraiment.
export const GARDIENS_SACRES_REGISTRES = {
  argus: "docs/argus/", harmonia: "docs/harmonia/", "axa-check": "docs/axa-check/",
  "clean-dirty-old": "docs/clean-dirty-old/", "clone-hunter": "docs/clone-hunter/",
  "always-new-code": "docs/always-new-code/", "safe-export": "docs/safe-export/",
};

// GARDE-FOU D'ÉVOLUTIVITÉ (Article 24) : cette table reflète GARDIEN_DOMAINS, la source unique du
// rang. Un huitième Gardien sacré qui y serait ajouté sans registre déclaré ici se signalerait
// plutôt que de disparaître silencieusement de la livraison — exactement le trou qu'on corrige.
export function findGardiensSansRegistreDeclare({ domains = GARDIEN_DOMAINS, registres = GARDIENS_SACRES_REGISTRES } = {}) {
  return Object.keys(domains).filter((g) => !registres[g]);
}

// Les Gardiens sacrés dont le verdict n'a pas été livré avec la Ronde. `gardiensLivres` est fourni
// par l'agent : livrer un fichier n'est pas observable depuis le disque (Partie 13, même leçon).
export function findGardiensNonLivres({ gardiensLivres, domains = GARDIEN_DOMAINS } = {}) {
  if (gardiensLivres === undefined) {
    return [{ gardien: "(tous)", pourquoi: `la liste des Gardiens sacrés réellement livrés n'a pas été déclarée — ils tournent à chaque commit, mais un verdict que personne ne lit ne sert à rien, et c'est l'utilisateur qui a dû remarquer leur absence` }];
  }
  return Object.keys(domains)
    .filter((g) => !gardiensLivres.includes(g))
    .map((g) => ({ gardien: g, pourquoi: `${g} tourne à chaque commit mais son verdict n'a pas été livré avec la Ronde` }));
}

// verifyHyperScanProcess() (2026-09-22, demande explicite : « l'outil process.circle doit aussi
// l'avoir en tete [HYPER-SCAN-CHECKPOINT], on parle de discipline d'execution, il est la pour ca »).
// **Intégration réelle depuis le même soir** (« vois comment integrer hyper-scan dans circle sinon
// ca n'a pas trop de sens que circle.process verifie hyper-scan ») : HYPER-SCAN-CHECKPOINT a
// désormais un vrai item CIRCLE_ITEMS (`hyper-scan-checkpoint-light`, jamais coché par défaut,
// périodicité suivie comme un item costly sans jamais en être un — cf. circle-tasks.mjs), ce qui
// donne à cette fonction un contexte concret plutôt qu'une vérification hors sol. Le mandat de ce
// module (discipline d'exécution d'un protocole à plusieurs étapes) s'applique tout aussi bien à SES
// PROPRES garde-fous (docs/referentiel/hyper-scan-checkpoint.md) qu'à ceux de la Ronde ci-dessus.
// Même portée honnête : aucun de ces faits n'est observable depuis le disque seul (la consultation
// de Smart Conso API/SMART-CONSO-TOKEN avant une version complète, la version légère lancée
// d'abord, le plafond de 3 tentatives respecté, la relecture complète de CLAUDE.md, la double
// perspective) — l'agent qui pilote doit les fournir explicitement, jamais devinés.
export function verifyHyperScanProcess({
  version, // "légère" | "complète" — quelle version a été demandée/exécutée
  claudeMdFullyReread,
  smartConsoApiConsulted,
  smartConsoTokenConsulted,
  lightVersionRanFirst,
  iterationsUsed,
  doublePerspectiveUsed,
  indexEntryRecorded,
} = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

  if (claudeMdFullyReread !== true) add("claude-md-reread", "La relecture complète et littérale de CLAUDE.md n'est pas confirmée — garde-fou non négociable, exigé même en version légère (docs/referentiel/hyper-scan-checkpoint.md).");

  if (version === "complète") {
    if (smartConsoApiConsulted !== true) add("smart-conso-api", "La version complète a été lancée sans confirmation que Smart Conso API a été consulté avant (Article 22).");
    if (smartConsoTokenConsulted !== true) add("smart-conso-token", "La version complète (double perspective = agent_subagent_spawn) a été lancée sans confirmation que SMART-CONSO-TOKEN a été consulté avant.");
    if (lightVersionRanFirst !== true) add("light-first", "La version légère doit toujours tourner avant la version complète — non confirmé ici.");
    if (typeof iterationsUsed === "number" && iterationsUsed > 3) add("iteration-cap", `${iterationsUsed} tentative(s) de mini-simulation utilisée(s) — dépasse le plafond non négociable de 3 (docs/referentiel/hyper-scan-checkpoint.md).`);
    if (doublePerspectiveUsed !== true) add("double-perspective", "La version complète doit inclure une double perspective (un second agent réellement séparé, qui ne voit pas les conclusions du premier) — non confirmée ici.");
  }

  if (indexEntryRecorded === false) add("index-entry", "Aucune ligne n'a été ajoutée à docs/hyper-scan-checkpoint/index.md après la checklist qualitative — la mémoire du prochain passage (depuis quel commit reprendre) serait faussée.");

  return { ok: findings.length === 0, findings };
}

// --- Aide à la mise à jour de CIRCLE-TASKS (2026-09-22, demande explicite : « je veux que
// circle.process t'aide quand tu mets à jour circle [...] je veux qu'il soit à la fois là pour
// t'aider, à la fois la pour veiller à ce que tu respectes bien les process de circles [...] 2
// niveaux »). Ces deux fonctions servent DOUBLEMENT : consultées AVANT de committer un changement de
// CIRCLE_ITEMS (aide), elles évitent exactement la classe de bug trouvée en construisant
// hyper-scan-checkpoint-light ce soir (un test `CIRCLE_ITEMS.length` resté à l'ancien chiffre) ;
// jamais consultées, elles restent le filet qui l'aurait attrapé quand même au commit suivant
// (vigilance). Jamais un second calcul divergent d'un invariant déjà vérifié ailleurs — ces deux
// fonctions couvrent des invariants qu'aucun autre outil du paysage ne vérifie aujourd'hui.

// findCircleItemsMapDrift() — un item RETIRÉ ou RENOMMÉ doit laisser AUCUNE trace orpheline dans les
// 3 tables qui le référencent par id (NOT_RECOMMENDED_BY_DEFAULT, COSTLY_SUBSTITUTES,
// CIRCLE_REPORT_FOLDERS) ; et un item costly/periodicityTracked DOIT avoir un substitut déclaré
// (sinon la ligne d'alerte imprimerait littéralement "undefined" — un vrai bug déjà possible
// aujourd'hui, jamais hypothétique). Signal CONFIRMÉ dans les deux cas, jamais une supposition.
// CIRCLE_ITEMS_CHANGELOG (2026-09-22, tâche #357, demande explicite de l'utilisateur au moment
// d'ajouter l'item check-tasks-report : « que process.circle soit là pour consigner ce
// changement »). circle-process-guardian ne se contentait jusqu'ici que de VÉRIFIER la discipline
// d'exécution d'une Ronde ; il consigne désormais aussi l'histoire de la Ronde elle-même — quel
// item est apparu, quand, et pourquoi.
//
// Pourquoi ici plutôt que dans circle-tasks.mjs : le gardien est déjà celui qui compare CIRCLE_ITEMS
// à ses tables satellites (findCircleItemsMapDrift) et qui traque les références périmées à son
// nombre d'items (findStaleItemCountReferences). L'historique des changements appartient à la même
// famille — la mémoire de ce qui a bougé, séparée de ce qui bouge. circle-tasks.mjs reste la
// définition, jamais son propre historien.
//
// Nature volontairement MANUELLE, écrite noir sur blanc comme l'Article 24 l'exige d'une liste
// curatée : le « pourquoi » d'un changement n'est déductible d'aucun diff. Ce que l'Article 24
// exige en revanche, et qui est bien mécanique ici, c'est le GARDE-FOU :
// findItemsMissingFromChangelog() compare ce registre aux vrais CIRCLE_ITEMS et refuse qu'un item
// apparaisse sans jamais avoir été consigné.
export const CIRCLE_ITEMS_CHANGELOG = [
  {
    date: "2026-09-24",
    itemId: "agent-du-temps",
    changement: "ajout",
    pourquoi: "Demande explicite de l'utilisateur dans le prompt de la nuit du 2026-09-23, en trois mots : « teste l'agent à la Ronde ». Ce n'est pas un item de plus pour faire nombre, et le besoin était prouvé avant d'être formulé : la nuit même, une ligne de docs/suivi/ a été datée de quinze minutes dans le futur parce que j'avais TAPÉ l'heure au lieu de la lire, et findHorodatagesFuturs() a refusé le commit. Une IA n'a pas d'horloge — elle déduit la date du dernier horodatage vu passer, et cette déduction dérive à chaque minute de travail. Ce que cet item vérifie n'est donc pas que l'outil tourne, mais D'OÙ VIENT L'HEURE : c'est le seul item de la Ronde dont le vrai résultat est une PHRASE à lire (« SOURCE : réseau » ou « SOURCE : système »), jamais un compte. Sans cette lecture, un agent du temps dont personne ne vérifie la source finirait par rendre l'horloge locale en silence, et une heure fausse ressemble trait pour trait à une heure juste — le pire type d'erreur, invisible. Au 2026-09-24, les deux API de temps essayées rendent HTTP 403, refusées par la politique réseau de l'environnement : la source est « système », l'outil le dit, et la décision d'ouvrir un domaine appartient à l'utilisateur.",
  },
  {
    date: "2026-09-23",
    itemId: "ou-on-en-est",
    changement: "ajout",
    pourquoi: "Demande explicite de l'utilisateur, dans ses mots : « peux-tu me faire un compte rendu global de ce qui a été fait dernièrement ? me dire comment le projet a évolué, avec quelles améliorations ? […] est-ce que ce récap peut être fait à chaque Ronde ? » — et il a posé lui-même la question de l'harmonisation avec les deux autres dispositifs qui lisent les mêmes tâches. La réponse tient à l'angle : la Ronde demande « rien n'a-t-il DÉRIVÉ ? », l'état des tâches demande « qu'est-ce qu'on FAIT maintenant ? », celui-ci demande « qu'est-ce qui a été FAIT, et qu'est-ce que ça a changé ? ». Les deux premiers regardent la FILE, le troisième le CHEMIN PARCOURU. Les fusionner perdrait un angle à chaque fois : une surveillance qui réclame une décision cesse d'être une surveillance, et un bilan de progression noyé dans une file de tâches ne se lit jamais.",
  },
  {
    date: "2026-09-22",
    itemId: "ecotoken-scan",
    ancienId: "claude-md-weight-signal",
    changement: "renommage",
    pourquoi: "L'item ne portait plus son vrai périmètre. Il s'appelait « poids de CLAUDE.md » à une époque où c'était bien son seul sujet ; ecotoken ayant été élargi à n'importe quel document (portées global/partiel/zoome/focus, budgets sur trois documents et non plus un), garder un nom qui ne parle que de la charte aurait fait croire que rien d'autre n'est surveillé. Le contenu de l'item n'a pas changé, seulement son nom — d'où un renommage consigné comme tel, plutôt qu'une réécriture de KNOWN_ITEMS_BEFORE_CHANGELOG qui aurait effacé le fait que cet item existait bien avant ce registre.",
  },
  {
    date: "2026-09-22",
    itemId: "ecotoken-scan",
    changement: "modification",
    pourquoi: "Harmonisation demandée explicitement par l'utilisateur au moment de construire ecotoken : « je crois qu'il y a deja un rapport sur claude.md dans circle. vois comment tu peux tout harmoniser sur ce sujet. » Il y en avait bien un. Plutôt que d'ajouter un 26e item qui aurait dit la même chose en mieux, CET item lance désormais ecotoken — un seul item de Ronde sur le sujet CLAUDE.md, jamais deux. Le signal n'a rien perdu (il relit toujours SMART-CONSO-TOKEN) et gagne le rendement par article, le plan de réduction chiffré, le budget anti-regrossissement et la mémoire des passages.",
  },
  {
    date: "2026-09-22",
    itemId: "check-tasks-report",
    changement: "ajout",
    pourquoi: "Demande explicite de l'utilisateur : un rapport txt de check-tasks-details dans les Rondes, en plusieurs parties traitant de sujets différents — chiffres vérifiés du suivi, où en est le projet vu de haut, œil critique, et l'état détaillé aux trois zooms dans un seul fichier. Calibré par quatre questions (parties retenues, zooms, format, questions forcées).",
  },
  {
    date: "2026-09-22",
    itemId: "hyper-scan-checkpoint-light",
    changement: "ajout",
    pourquoi: "Rentabiliser une erreur de compréhension : verifyHyperScanProcess() avait été construit sur une mauvaise lecture d'une demande, et vérifiait la discipline d'un outil qui ne faisait pas partie de la Ronde. Plutôt que de retirer ce travail, l'utilisateur a demandé d'y faire entrer HYPER-SCAN-CHECKPOINT pour que la vérification ait un sens.",
  },

  // LES HUIT ENTRÉES CI-DESSOUS ONT ÉTÉ ÉCRITES LE 2026-09-23, APRÈS COUP, et il faut le dire :
  // `findItemsMissingFromChangelog()` existait depuis le 2026-09-22 mais n'avait AUCUN appelant. Il
  // a veillé dans le vide pendant que huit items rejoignaient la Ronde sans leur « pourquoi » —
  // dont deux que j'ai ajoutés moi-même les deux jours suivants. Chaque « pourquoi » ci-dessous est
  // reconstitué depuis le commentaire réel de l'item dans circle-tasks.mjs ou depuis sa ligne de
  // suivi, jamais inventé : là où la trace ne disait pas tout, la ligne le déclare plutôt que de
  // combler. C'est la valeur qu'on récupère ; celle qui a été perdue entre-temps ne revient pas.
  {
    date: "2026-09-22", itemId: "organigramme-signal", changement: "ajout",
    pourquoi: "Reconstitué après coup. CASSANDRA reconstruit l'organigramme depuis les données réelles (tâches #171/#172/#179). Délibérément PAS fusionné avec cassandra-rh-signal : celui-là juge l'équipe, celui-ci ne fait que montrer sa structure et qui n'y figure nulle part — deux questions que le même item aurait mélangées.",
  },
  {
    date: "2026-09-22", itemId: "god-of-all-process-conformite", changement: "ajout",
    pourquoi: "Reconstitué après coup. god-of-all-process livre LE rapport de process de la Ronde, et lui seul : les contrôleurs secondaires gardent leur verdict mais ne le livrent jamais eux-mêmes, god les relaie. Architecture tranchée explicitement par l'utilisateur ce jour-là pour garder UNE voix plutôt qu'une par contrôleur.",
  },
  {
    date: "2026-09-22", itemId: "pure-gold-unity-scan", changement: "ajout",
    pourquoi: "Reconstitué après coup. Ajouté après une simple QUESTION de l'utilisateur (« pour pure gold que tu viens de créer : il est bien dans circle ? ») — il ne l'était pas, et findRegistriesMissingFromCircle() ne pouvait structurellement pas le dire, puisqu'il part des registres présents sur le disque et que cet outil n'en avait aucun. Le trou vivait à l'intérieur du garde-fou censé le trouver.",
  },
  {
    date: "2026-09-22", itemId: "integration-audit", changement: "ajout",
    pourquoi: "Reconstitué après coup. Même forme de trouvaille, même origine : l'utilisateur a simplement DEMANDÉ si la Ronde vérifie que chaque nouvel outil est réellement intégré et certifié. Elle ne le faisait pas — checkAllAgentBadges() n'annonce que les badges qui CHANGENT, donc un membre incomplet depuis trois jours ne produit rien du tout.",
  },
  {
    date: "2026-09-22", itemId: "data-archangel-scan", changement: "ajout",
    pourquoi: "Reconstitué après coup. Le rattrapage périodique de la veille sur la circulation des données — la troisième de ses trois livraisons calibrées, aux côtés de la commande à la demande et de l'alerte rare de fraîcheur.",
  },
  {
    date: "2026-09-22", itemId: "recap-evaluations", changement: "ajout",
    pourquoi: "Reconstitué après coup. Le récapitulatif complet des évaluations, demandé par l'utilisateur en toutes lettres, Y COMPRIS l'évaluation de SA PROPRE participation, qu'il a réclamée lui-même pour que le projet reste la priorité même au prix de frictions. CASSANDRA le publie, angel produit la partie utilisateur, personne ne centralise.",
  },
  {
    date: "2026-09-22", itemId: "tool-learning", changement: "ajout",
    pourquoi: "Reconstitué après coup, sur demande explicite : « intégré à circle pour un suivi au top, comme le reste ». Seconde moitié de l'évolutivité (SAFE-EXPORT porte la première). Il juge une TRAJECTOIRE, donc il appartient à un rythme périodique et pas au commit : sous trois passages il refuse de conclure.",
  },
  {
    date: "2026-09-23", itemId: "the-equalizer", changement: "ajout",
    pourquoi: "Le verdict d'ensemble contre le référentiel des standards. À la Ronde plutôt qu'au commit pour une raison de fond : « tout est-il à niveau ? » est une question de période — répétée à chaque commit elle rendrait le même verdict des dizaines de fois d'affilée, et un signal qui ne change jamais cesse d'être lu.",
  },
];

// Garde-fou mécanique du registre ci-dessus (Article 24) : un item réel jamais consigné est une
// dérive silencieuse exactement comme une entrée de map oubliée. Les items ANTÉRIEURS au registre
// ne sont pas signalés — le registre naît le 2026-09-22 et n'a jamais prétendu reconstruire
// l'histoire des 23 items qui existaient déjà (absence honnête, jamais un faux historique
// fabriqué après coup pour faire nombre).
export function findItemsMissingFromChangelog(items = CIRCLE_ITEMS, changelog = CIRCLE_ITEMS_CHANGELOG, knownBefore = KNOWN_ITEMS_BEFORE_CHANGELOG) {
  // Seuls les AJOUTS rendent un item "consigné" : une modification documente un item qui existait
  // déjà, elle n'a jamais vocation à faire passer un item inconnu pour connu.
  const consigned = new Set(changelog.filter((e) => e.changement === "ajout").map((e) => e.itemId));
  // Troisième cas, ajouté le 2026-09-22 en renommant réellement un item : un RENOMMAGE n'est ni un
  // ajout (rien de neuf n'existe) ni une modification (l'id change). Sans ce cas, il fallait
  // réécrire KNOWN_ITEMS_BEFORE_CHANGELOG — c'est-à-dire falsifier la liste figée de ce qui
  // existait AVANT le registre. Un renommage n'est accepté que s'il nomme son ancien id et que
  // celui-ci était réellement connu (ou lui-même consigné) : un id inventé ne se blanchit jamais
  // en se déclarant "renommé".
  for (const e of changelog) {
    if (e.changement !== "renommage" || !e.ancienId) continue;
    if (knownBefore.has(e.ancienId) || consigned.has(e.ancienId)) consigned.add(e.itemId);
  }
  return items
    .filter((i) => !consigned.has(i.id) && !knownBefore.has(i.id))
    .map((i) => ({ check: "item-missing-from-changelog", message: `L'item "${i.id}" existe dans CIRCLE_ITEMS mais n'a jamais été consigné dans CIRCLE_ITEMS_CHANGELOG — son "pourquoi" est déjà perdu.` }));
}

// Les 23 items présents avant la création du registre, figés une fois pour toutes : cette liste ne
// grandit JAMAIS. Tout item ajouté après le 2026-09-22 doit passer par le changelog, sans exception.
export const KNOWN_ITEMS_BEFORE_CHANGELOG = new Set([
  "profil", "the-king-signal", "kpi", "clean-dirty-old-signal", "html-wiring-check",
  "claude-md-weight-signal", "correctifs", "suivi-open-tasks-signal", "chantier-preliminaire-signal",
  "idee-a-trancher-signal", "smart-conso-api-scan", "smart-conso-token-scan", "tool-brain-report",
  "ines-official-signal", "cassandra-rh-signal", "profil-utilisateur-guard", "network-check-run",
  "coordinateur-catalogue", "referentiel", "dream-team-photo", "the-screener", "the-final-judge",
  "the-deep-reader", "clone-hunter-run",
]);

export function findCircleItemsMapDrift(items = CIRCLE_ITEMS, {
  notRecommendedByDefault = NOT_RECOMMENDED_BY_DEFAULT,
  costlySubstitutes = COSTLY_SUBSTITUTES,
  reportFolders = CIRCLE_REPORT_FOLDERS,
} = {}) {
  const findings = [];
  const ids = new Set(items.map((i) => i.id));
  const danglingKeys = (map, mapName) => {
    if (!map) return;
    for (const key of Object.keys(map)) {
      if (!ids.has(key)) findings.push({ check: "dangling-map-entry", message: `${mapName}["${key}"] référence un id qui n'existe plus dans CIRCLE_ITEMS — item retiré ou renommé sans nettoyer cette entrée.` });
    }
  };
  danglingKeys(notRecommendedByDefault, "NOT_RECOMMENDED_BY_DEFAULT");
  danglingKeys(costlySubstitutes, "COSTLY_SUBSTITUTES");
  danglingKeys(reportFolders, "CIRCLE_REPORT_FOLDERS");

  if (costlySubstitutes) {
    for (const item of items) {
      if ((item.costly || item.periodicityTracked) && !(item.id in costlySubstitutes)) {
        findings.push({ check: "missing-substitute", message: `L'item "${item.id}" (costly ou periodicityTracked) n'a aucune entrée dans COSTLY_SUBSTITUTES — l'alerte de fraîcheur afficherait littéralement "undefined" le jour où il devient dû.` });
      }
    }
  }
  return findings;
}

// findStaleItemCountReferences() — la classe de bug réellement trouvée ce soir : un commentaire ou
// un test cite un nombre figé d'items ("CIRCLE_ITEMS.length, 23", "les 23 items de la Ronde") qui ne
// correspond plus au vrai compte après un ajout/retrait. Jamais une liste de fichiers à surveiller
// recopiée à la main (Article 24) : l'appelant fournit le texte à vérifier (n'importe quel fichier
// réel), cette fonction reste agnostique de la source.
const ITEM_COUNT_REFERENCE_PATTERN = /CIRCLE_ITEMS\.length,\s*(\d+)|les\s+(\d+)\s+items?\s+(?:de la Ronde|libres|gratuits)/gi;
export function findStaleItemCountReferences(text, realCount) {
  const findings = [];
  for (const m of String(text ?? "").matchAll(ITEM_COUNT_REFERENCE_PATTERN)) {
    const cited = Number(m[1] ?? m[2]);
    if (cited !== realCount) findings.push({ check: "stale-item-count", message: `Une référence cite ${cited} item(s), alors que CIRCLE_ITEMS en compte réellement ${realCount} aujourd'hui : "${m[0]}".` });
  }
  return findings;
}

// ————————————————————————————————————————————————————————————————————————
// LE PROCESS D'INTÉGRATION À LA RONDE (2026-09-23) — SÉPARÉ de l'intégration à l'Agence
// ————————————————————————————————————————————————————————————————————————
//
// SÉPARATION DEMANDÉE EXPLICITEMENT par l'utilisateur : « je veux un process propre pour intégration
// d'un outil et un process séparé propre pour intégration à circle ». Il avait raison, et la preuve
// est arrivée le soir même : en faisant entrer THE-EQUALIZER, `integration-outil` a annoncé « tous les
// registres renseignés » alors qu'il manquait QUATRE raccordements propres à la Ronde. Rejoindre
// l'Agence et rejoindre la Ronde ne sont pas la même chose — l'un donne un rang et des documents,
// l'autre donne une place dans un rythme périodique, avec ses tables satellites à lui.
//
// POURQUOI CE PROCESS VIT ICI, chez le contrôleur de la Ronde, et pas dans un nouvel outil :
// circle-tasks.mjs DÉFINIT les items, il n'est pas son propre vérificateur ; ce fichier-ci compare
// déjà CIRCLE_ITEMS à ses tables satellites. Un outil de plus aurait fait trois endroits au lieu de
// deux pour une seule question.
//
// CE QUE CE RACCORDEMENT EXIGE RÉELLEMENT — établi non pas en théorie mais en relevant, une par
// une, les choses qu'il a fallu faire à la main pour THE-EQUALIZER alors qu'aucun outil ne les demandait.
export const RACCORDEMENTS_RONDE = [
  {
    cle: "item",
    quoi: "une entrée dans CIRCLE_ITEMS (id, thème, libellé, coût, tokens estimés, execute)",
    verifie: ({ items, id }) => items.some((i) => i.id === id),
    forme: (id) => `  { id: "${id}", theme: "...", label: "...", cout: "...", tokensEstimes: "...", execute: "...", producesReport: true },  // dans CIRCLE_ITEMS`,
  },
  {
    cle: "theme-connu",
    quoi: "son thème est un thème DÉJÀ existant, jamais une catégorie inventée pour un seul item",
    // Un thème neuf pour un item unique ajoute une rubrique à cocher pour zéro clarté gagnée — la
    // décision est ancienne et documentée, elle se vérifie plutôt que de se rappeler.
    verifie: ({ items, id }) => {
      const item = items.find((i) => i.id === id);
      if (!item) return false;
      return items.filter((i) => i.theme === item.theme).length > 1;
    },
    forme: () => `  theme: "<un thème déjà porté par au moins un autre item>"  — ou assumer par écrit pourquoi celui-ci mérite le sien`,
  },
  {
    cle: "dossier-de-rapport",
    quoi: "un dossier où déposer son artefact (CIRCLE_REPORT_FOLDERS), OU une dispense écrite (ITEMS_SANS_DOSSIER_ASSUME)",
    verifie: ({ items, id, folders, assumes }) => {
      const item = items.find((i) => i.id === id);
      if (!item?.producesReport) return true;
      return Boolean(folders[id]) || id in assumes;
    },
    forme: (id) => `  "${id}": "docs/${id}/",  // dans CIRCLE_REPORT_FOLDERS — ou une dispense écrite dans ITEMS_SANS_DOSSIER_ASSUME`,
  },
  {
    cle: "changelog",
    quoi: "une entrée dans CIRCLE_ITEMS_CHANGELOG disant POURQUOI cet item existe",
    // Le « pourquoi » n'est déductible d'aucun diff : sans cette ligne il est perdu le jour même.
    verifie: ({ id, changelog, knownBefore }) =>
      knownBefore.has(id) || changelog.some((e) => e.itemId === id && (e.changement === "ajout" || e.changement === "renommage")),
    forme: (id) => `  { date: "...", itemId: "${id}", changement: "ajout", pourquoi: "..." },  // dans CIRCLE_ITEMS_CHANGELOG`,
  },
  {
    cle: "comptes-figes",
    quoi: "les comptes d'items cités en dur dans check-house.mjs sont remis à jour",
    // Deux assertions citent le nombre d'items ; toutes deux refusent le commit tant qu'elles n'ont
    // pas été mises à jour. Elles sont donc déjà protégées — ce raccordement existe pour que le
    // plan le DISE avant la première exécution rouge, plutôt qu'après.
    verifie: ({ items, checkHouseText }) => checkHouseText == null || findStaleItemCountReferences(checkHouseText, items.length).length === 0,
    forme: () => `  mettre à jour les deux assertions de check-house.mjs qui citent le nombre d'items (findStaleItemCountReferences les nomme)`,
  },
];

// etatRaccordementRonde() — l'état réel, raccordement par raccordement. Même forme de retour que
// `etatIntegration()` (integration-outil) à dessein : deux process séparés, une même lecture, pour
// qu'un agent qui connaît l'un sache lire l'autre sans réapprendre.
export function etatRaccordementRonde(id, {
  items = CIRCLE_ITEMS,
  folders = CIRCLE_REPORT_FOLDERS,
  assumes = ITEMS_SANS_DOSSIER_ASSUME,
  changelog = CIRCLE_ITEMS_CHANGELOG,
  knownBefore = KNOWN_ITEMS_BEFORE_CHANGELOG,
  checkHouseText = null,
  raccordements = RACCORDEMENTS_RONDE,
} = {}) {
  const contexte = { items, id, folders, assumes, changelog, knownBefore, checkHouseText };
  return raccordements.map((r) => ({ cle: r.cle, quoi: r.quoi, fait: Boolean(r.verifie(contexte)), forme: r.forme(id) }));
}

export function planRaccordementRonde(id, options = {}) {
  const etat = etatRaccordementRonde(id, options);
  return { id, faits: etat.filter((e) => e.fait), manquants: etat.filter((e) => !e.fait), complet: etat.every((e) => e.fait) };
}

export function formatPlanRaccordementRonde(plan) {
  const l = [`Item de Ronde : ${plan.id}`, `${plan.faits.length}/${plan.faits.length + plan.manquants.length} raccordement(s) déjà faits${plan.faits.length ? ` : ${plan.faits.map((e) => e.cle).join(", ")}` : ""}`, ""];
  if (plan.complet) { l.push("Tous les raccordements de Ronde sont faits."); return l.join("\n"); }
  l.push(`${plan.manquants.length} raccordement(s) manquant(s) — à faire AVANT le commit, pas après l'échec du test :`, "");
  for (const m of plan.manquants) l.push(`· ${m.quoi}`, `  ${m.forme}`, "");
  return l.join("\n");
}

function main() {
  recordCliUsage("circle-process-guardian");
  console.log("=== circle-process-guardian — vérification mécanique du processus de Ronde ===\n");
  console.log("Ce script ne peut vérifier seul que les faits observables depuis le disque (Parties 4/7/8 de");
  console.log("docs/circle-process-detail.txt) — les faits de conversation (question AUTO/PRIME/GOAT, items");
  console.log("réellement cochés, séquence de l'Étape 5) doivent être fournis par l'agent qui pilote via");
  console.log("verifyRondeProcess(), jamais devinés. Lancé sans argument, il ne vérifie donc que 7/8 : \n");
  const result = verifyRondeProcess({});
  for (const f of result.findings) console.log(`- [${f.check}] ${f.message}`);
  console.log(result.ok ? "\nAucun écart mécaniquement détectable." : `\n${result.findings.length} écart(s) trouvé(s) — jamais une correction automatique, signaler seulement à l'agent qui pilote.`);

  console.log("\n=== Aide/vigilance pour une mise à jour de CIRCLE_ITEMS (2026-09-22) ===");
  console.log("Consulté AVANT un changement de CIRCLE_ITEMS, ceci aide à ne rien oublier ; jamais consulté, ceci l'attrape quand même au commit suivant :\n");
  const mapDrift = findCircleItemsMapDrift();
  for (const f of mapDrift) console.log(`- [${f.check}] ${f.message}`);
  let countDrift = [];
  try {
    const checkHouseText = readFileSync(join(ROOT, "scripts/check-house.mjs"), "utf8");
    countDrift = findStaleItemCountReferences(checkHouseText, CIRCLE_ITEMS.length);
    for (const f of countDrift) console.log(`- [${f.check}] ${f.message}`);
  } catch { /* best-effort, jamais bloquant */ }
  // findItemsMissingFromChangelog() — CÂBLÉ ICI LE 2026-09-23, et il ne l'était pas. Construit le
  // 2026-09-22 sur demande explicite (« que process.circle soit là pour consigner ce changement »),
  // avec son garde-fou d'Article 24, il n'avait AUCUN appelant : ni ce main(), ni check-house, ni
  // personne. Huit items avaient rejoint la Ronde sans leur « pourquoi » pendant qu'il veillait dans
  // le vide — la leçon L2 dans sa forme la plus pure, et trouvée cette fois-ci chez un détecteur que
  // le scan des détecteurs muets ne voyait pas, son nom apparaissant dans un commentaire voisin.
  const sansChangelog = findItemsMissingFromChangelog();
  for (const f of sansChangelog) console.log(`- [${f.check}] ${f.message}`);
  if (!mapDrift.length && !countDrift.length && !sansChangelog.length) console.log("Aucun écart de maintenance détecté (tables associées cohérentes, aucun compte figé obsolète, aucun item sans son pourquoi).");

  console.log("\n=== Raccordement d'un item à la Ronde (process séparé de l'intégration à l'Agence) ===");
  const cible = process.argv[2];
  if (!cible) {
    console.log("Passer un id d'item en argument pour obtenir son plan de raccordement (ex. : node scripts/circle-process-guardian.mjs the-equalizer).");
  } else {
    let checkHouseText = null;
    try { checkHouseText = readFileSync(join(ROOT, "scripts/check-house.mjs"), "utf8"); } catch { /* best-effort */ }
    console.log(formatPlanRaccordementRonde(planRaccordementRonde(cible, { checkHouseText })));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
