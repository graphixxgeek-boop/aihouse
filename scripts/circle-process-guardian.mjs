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
import { CIRCLE_ITEMS, CIRCLE_REPORT_FOLDERS, NOT_RECOMMENDED_BY_DEFAULT, COSTLY_SUBSTITUTES, loadLastRun, findRegistriesMissingFromCircle } from "./circle-tasks.mjs";
import { findOrphanReportFiles, REGISTRIES } from "./doc-report.mjs";
import { walkDocsPaths, sh } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

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
} = {}) {
  const findings = [];
  const add = (check, message) => findings.push({ check, message });

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

  // 3. Items cochés vs réellement exécutés
  if (checkedItemIds && executedItemIds) {
    const missing = checkedItemIds.filter((id) => !executedItemIds.includes(id));
    if (missing.length) add("checked-vs-executed", `${missing.length} item(s) coché(s) jamais exécuté(s) : ${missing.join(", ")}.`);
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
  if (recapHtml !== undefined) {
    if (!/<!DOCTYPE html>/i.test(recapHtml)) add("recap-format", "Le récapitulatif fourni n'est pas un vrai document HTML.");
    if ((analysisPointsFound ?? 0) > 0 && !/class="highlight"/.test(recapHtml)) add("recap-highlight", "Des points ont été trouvés mais le récapitulatif ne porte aucun bloc d'analyse mis en évidence (class=\"highlight\").");
  }
  if (reportsDeliveredBeforeAnalysis === false) add("sequence-order", "La séquence stricte de l'Étape 5 n'a pas été respectée : les rapports doivent être livrés AVANT que l'agent ne construise son analyse.");
  if ((analysisPointsFound ?? 0) > 0) {
    const expectedMin = Math.min(5, analysisPointsFound);
    if ((questionsAsked ?? 0) < expectedMin) add("forced-questions", `${analysisPointsFound} point(s) trouvé(s) mais seulement ${questionsAsked ?? 0} question(s) à choix forcé posée(s) — attendu au moins ${expectedMin} (jamais zéro question sur une analyse à plusieurs problèmes).`);
    if ((questionsAsked ?? 0) > 10) add("forced-questions", `${questionsAsked} questions posées pour ${analysisPointsFound} point(s) trouvé(s) — au-delà de la fourchette 5-10 attendue, jamais une question par détail insignifiant.`);
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

  return { ok: findings.length === 0, findings };
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
  if (!mapDrift.length && !countDrift.length) console.log("Aucun écart de maintenance détecté (tables associées cohérentes, aucun compte figé obsolète trouvé dans check-house.mjs).");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
