// Appelé par scripts/hooks/post-commit juste après chaque commit réel (2026-09-19, demande
// explicite de l'utilisateur : « je veux un suivi mis à jour en temps réel, pas toutes les 2h-3h »).
// Vérifie IMMÉDIATEMENT, sur le commit qui vient de se faire, s'il a touché du code/de la charte
// réelle sans jamais toucher docs/suivi/ dans ce même commit — jamais un sondage périodique, un
// déclenchement exact sur l'événement qui compte. N'écrit jamais rien lui-même : signale seulement
// (cf. docs/regles-de-travail.md §4), la rédaction reste toujours faite avec le vrai contexte de la
// conversation, jamais reconstituée depuis le seul message de commit.
import { readFileSync, rmSync } from "node:fs";
import { recentCommits, findCommitsMissingSuiviUpdate, findTaskNumberIssues, nextTaskNumber } from "../check-suivi-fidelity.mjs";
import { walk, findDeadLifeFields, findTodoMarkers } from "../check-argus.mjs";
import { checkLinks, LINKS } from "../check-harmonia.mjs";
import { collectCoverage, robustnessScore, collectScriptCoverage, scriptRobustnessScore, LIB_MAP, AGENT_SCRIPT_FILES } from "../axa-check.mjs";
import { lastTouchDays, relativeStaleness } from "../clean-dirty-old.mjs";
import { buildDuplicateReport, buildNearDuplicateReport } from "../clone-hunter.mjs";
import { THEMES, THEME_PRIMARY_FILE, parseCoverage, recommendZone, countDatedAddenda, addendaSignal, parseNumstat, churnSignal, outillageZones } from "../always-new-code.mjs";
import { findMissingNotes, findOrphanNotes } from "../el-professor.mjs";
import { parseToolsTable, slugifyAgentName, checkAllAgentBadges, pendingCeremonies } from "../le-coordinateur.mjs";
import { formatToolBrainReminder } from "../tool-brain.mjs";
import { summarizeHistory, computeInvestmentRatio, diagnoseAdviceAccuracy } from "../smart-conso-token.mjs";
import { sh, AGENT_CATEGORIES, gardienShouldRun, lastCommitFiles, realCodeFilesChanged } from "../lib-shell.mjs";
import { loadLastRun, shouldRemindCircleTasks } from "../circle-tasks.mjs";
import { buildRealOnboardingContext } from "../check-tasks-details.mjs";

const [last] = recentCommits(1);
if (last && findCommitsMissingSuiviUpdate([last]).length) {
  console.error(
    "\n🚨 SUIVI NON MIS À JOUR : le commit " + last.hash.slice(0, 8) + " (\"" + last.subject +
    "\") touche du code ou la charte réelle sans jamais toucher docs/suivi/. " +
    "Ajoute la ligne de suivi maintenant, dans le prochain commit — cf. docs/regles-de-travail.md §4.\n",
  );
}

// Même statut qu'avertit-sans-bloquer que le garde-fou de fraîcheur ci-dessus (2026-09-20, suite du
// compteur de tâches durable) : un numéro dupliqué ou une régression dans docs/suivi/ reste une
// anomalie de document, pas un test de code cassé — même sévérité que la fraîcheur du suivi, jamais
// un pre-commit bloquant pour ça (cohérent avec la distinction déjà actée dans pre-commit lui-même :
// « un test cassé est plus grave qu'une ligne de suivi manquante »).
const numberIssues = findTaskNumberIssues();
if (numberIssues.length) {
  console.error(
    "\n🚨 NUMÉROTATION DES TÂCHES INCOHÉRENTE dans docs/suivi/ : " +
    numberIssues.map((i) => `[${i.type}] n°${i.number} (${i.file})`).join(", ") +
    `. Prochain numéro correct à utiliser : ${nextTaskNumber()} — corrige avant le prochain commit.\n`,
  );
}

// ARGUS/HARMONIA — vrai balayage à chaque commit, pas seulement le test unitaire de leur logique
// (2026-09-20, demande explicite de l'utilisateur : « je voudrais que ça tourne à chaque commit »).
// Écart réel trouvé en creusant cette demande : `check-house.mjs` teste déjà la LOGIQUE de
// détection à chaque commit (findDeadLifeFields/findTodoMarkers/checkLinks contre des cas
// synthétiques), mais ne l'applique jamais au VRAI code courant — l'Article 20 promettait « toujours
// déployé » sans que ce soit mécaniquement garanti. Ici, on appelle directement les fonctions pures
// (accès "privilégié", même règle que LE-COORDINATEUR) plutôt que le CLI `check-argus.mjs`/
// `check-harmonia.mjs`, dont le `main()` écrirait un nouveau fichier dans docs/argus/ à CHAQUE
// commit — jamais souhaitable à cette fréquence (docs/argus/ n'accueille qu'un balayage archivé
// volontairement, pas un par commit). Warn-only comme le reste de ce hook, jamais bloquant : ces
// verdicts restent une invitation à vérifier, jamais un verdict à traiter comme acquis.
// argusFindingsCount/harmoniaFindingsCount/cleanDirtyOldFlagged/cloneHunterFindingsCount capturés en
// dehors des try ci-dessous (mêmes blocs, valeurs déjà calculées) pour nourrir le badge automatique
// plus bas — jamais un second balayage rien que pour ce signal (règle anti-doublon, §7ter).
let argusFindingsCount, harmoniaFindingsCount, cleanDirtyOldFlagged, cloneHunterFindingsCount, alwaysNewCodeFlagged;
// Réveil conditionnel (2026-09-22, tâche #362) : un Gardien ne se réveille que si le commit a
// réellement touché ce qu'il surveille. Voir lib-shell.mjs pour la mesure qui l'a motivé (20
// commits d'affilée sans que le moteur du jeu ne bouge) et pour la distinction non négociable
// entre l'étage qui GARANTIT (check-house + tsc, pre-commit, bloquants, jamais conditionnés) et
// l'étage qui RENFORCE (ces six-là). Si git ne dit pas ce qui a changé, tout tourne.
const changedFiles = lastCommitFiles();
const reveille = (g) => gardienShouldRun(g, changedFiles);
if (changedFiles && !realCodeFilesChanged(changedFiles).some((f) => /^(lib|app|components|scripts)\//.test(f))) {
  console.log("\n💤 Commit sans changement de code réel — les Gardiens qui n'ont rien à vérifier se taisent (cf. lib-shell.mjs, GARDIEN_DOMAINS).");
}
if (reveille("argus") || reveille("harmonia")) try {  // ce bloc porte les DEUX gardiens
  const lifeSource = readFileSync("lib/life.ts", "utf8");
  const files = walk("lib").concat(walk("app"));
  const dead = findDeadLifeFields(files, lifeSource);
  const todos = findTodoMarkers(walk(".").filter((f) => !f.includes("/scratchpad/")));
  argusFindingsCount = dead.length + todos.length;
  if (dead.length || todos.length) {
    console.error(
      "\n🔎 ARGUS (balayage réel post-commit) : " +
      (dead.length ? `${dead.length} champ(s) life.ts potentiellement jamais lu(s) (${dead.map((d) => d.field).join(", ")})` : "") +
      (dead.length && todos.length ? " ; " : "") +
      (todos.length ? `${todos.length} marqueur(s) TODO/FIXME` : "") +
      " — à vérifier avant d'agir, jamais un verdict acquis (cf. docs/argus/index.md).\n",
    );
  }
  const frictions = checkLinks(LINKS).filter((r) => r.confidence === "confirmé");
  harmoniaFindingsCount = frictions.length;
  if (frictions.length) {
    console.error(
      "\n🔎 HARMONIA (balayage réel post-commit) : " + frictions.length + " friction(s) confirmée(s) — " +
      frictions.map((f) => f.theme).join(", ") + " (cf. docs/harmonia/index.md).\n",
    );
  }
} catch { /* best-effort, jamais bloquant — un balayage raté ne doit jamais empêcher un commit */ }

// AXA-CHECK/CLEAN-DIRTY-OLD — vrai passage à chaque commit, pas seulement leur logique testée sur
// des fixtures (2026-09-21, écart trouvé en répondant à une question directe de l'utilisateur :
// « est-ce qu'il y a bien les scans harmonia et argus en priorité ? ainsi que les autres membres de
// l'équipe noyau ? »). Vérifié à cette occasion : ARGUS/HARMONIA ci-dessus tournent bien réellement à
// chaque commit, mais AXA-CHECK/CLEAN-DIRTY-OLD ne tournaient jusqu'ici que via check-house.mjs
// (fixtures synthétiques, jamais un vrai passage sur le projet réel) — en tension directe avec
// l'Article 20 (« c'est la totalité de l'outil qui tourne ainsi »). AXA-CHECK réutilise LA MÊME
// couverture V8 que scripts/hooks/pre-commit vient de produire dans ce même lancement de
// check-house.mjs (NODE_V8_COVERAGE pointé sur .sites-runtime/axa-check-postcommit-cov) — jamais un
// second lancement rien que pour ce signal (règle anti-doublon, §7ter). Le dossier est consommé puis
// nettoyé ici, jamais laissé traîner d'un commit à l'autre.
// perSlugScriptCoverage capturé ici (avant le rmSync) pour nourrir le badge automatique plus bas
// (axaCoveragePct par outil) — même dossier de couverture déjà ouvert, jamais un second lancement.
let perSlugScriptCoverage;
if (reveille("axa-check")) try {
  const covDir = ".sites-runtime/axa-check-postcommit-cov";
  const perFile = collectCoverage(covDir);
  const score = robustnessScore(Object.values(perFile).flat());
  if (score !== undefined) {
    console.log(`🔎 AXA-CHECK (balayage réel post-commit) : couverture globale par fonction ${Math.round(score)}% sur ${Object.keys(perFile).length} fichier(s) mesuré(s) — jamais une preuve de correction, un signal de robustesse seulement (cf. docs/axa-check/index.md).\n`);
  }
  perSlugScriptCoverage = collectScriptCoverage(covDir);

  // FIN DE GROS CHANTIER — le déclencheur qui manquait (2026-09-22, constat de l'utilisateur :
  // « quand on finalise un outil comme ça ou un gros morceau de code, la suite des gardiens devrait
  // faire une passe dans ce type de cas, sans que je sois obligé de demander »). Il avait raison :
  // le balayage global annonçait « 99 % » pendant qu'ecotoken, tout juste terminé, était à 82 % avec
  // 12 fonctions jamais testées — dont sa mesure phare. Une moyenne sur tout le dépôt noie
  // exactement le fichier sur lequel on vient de travailler.
  //
  // La règle est mécanique et gratuite (la couverture est déjà mesurée, rien n'est relancé) : dès
  // qu'un commit touche substantiellement le script d'un outil à badge, sa couverture PAR FONCTION
  // est affichée et ses fonctions non testées sont nommées. Le seuil de lignes évite de crier pour
  // une correction de commentaire.
  const SEUIL_GROS_CHANTIER = 40;
  for (const [slug, chemin] of Object.entries(AGENT_SCRIPT_FILES)) {
    if (!changedFiles?.includes(chemin)) continue;
    const ampleur = Number(sh(`git show --numstat --format= HEAD -- ${chemin} | awk '{print $1+$2}'`, { quiet: true })?.trim() || 0);
    if (ampleur < SEUIL_GROS_CHANTIER) continue;
    const fonctions = perSlugScriptCoverage?.[slug];
    if (!fonctions?.length) continue;
    const nonTestees = fonctions.filter((f) => !f.covered);
    const pct = Math.round(((fonctions.length - nonTestees.length) / fonctions.length) * 100);
    console.log(`🎯 FIN DE CHANTIER sur ${chemin} (${ampleur} lignes touchées) — couverture PAR FONCTION : ${pct} % (${fonctions.length - nonTestees.length}/${fonctions.length}).`);
    if (nonTestees.length) console.log(`   ${nonTestees.length} fonction(s) jamais exécutée(s) par un test : ${nonTestees.map((f) => f.name).join(", ")}\n   (une moyenne globale les noie — c'est ce fichier-ci qui vient d'être retouché.)\n`);
    else console.log("   Toutes ses fonctions sont exercées par au moins un test.\n");
  }
  rmSync(covDir, { recursive: true, force: true });
} catch { /* best-effort, jamais bloquant */ }

// CLEAN-DIRTY-OLD — coût minime (un seul `git log -1` par fichier de LIB_MAP, aucune instrumentation
// lourde), jamais un frein réel à un commit contrairement à AXA-CHECK ci-dessus. Seul son SIGNAL de
// fraîcheur (depuis quand son carnet n'a pas été relu, clean-dirty-old-signal) rejoignait la Ronde
// CIRCLE-TASKS ; son vrai calcul de stagnation relative n'avait jamais tourné qu'à la main via
// runNetworkCheck().
if (reveille("clean-dirty-old")) try {
  const lastTouchByFile = Object.fromEntries(Object.values(LIB_MAP).map((f) => [f, lastTouchDays(f)]));
  const staleness = relativeStaleness(lastTouchByFile);
  const staleFiles = Object.entries(staleness).filter(([, s]) => s.stale).map(([f]) => f);
  cleanDirtyOldFlagged = staleFiles.length > 0;
  if (staleFiles.length) {
    console.error(
      "\n🔎 CLEAN-DIRTY-OLD (balayage réel post-commit) : " + staleFiles.length +
      ` fichier(s) stagnant(s) relativement au reste du projet — ${staleFiles.join(", ")} ` +
      "(à vérifier via ARGUS/HARMONIA/ALWAYS-NEW-CODE, jamais un jugement seul, cf. docs/clean-dirty-old/index.md).\n",
    );
  }
} catch { /* best-effort, jamais bloquant */ }

// CLONE-HUNTER — cinquième Gardien sacré (2026-09-22, demande explicite de l'utilisateur : « clone
// hunter doit rejoindre les gardiens sacrés [...] il devrait être dans les outils AUTO, à chaque
// commit »). Coût minime mesuré en direct avant ce câblage (~0,4s pour v1+v2 sur tout le dépôt réel,
// aucune instrumentation lourde) — même famille de coût que CLEAN-DIRTY-OLD ci-dessus, jamais un
// frein réel à un commit. v1 (littérale) et v2 (renommage bijectif cohérent) tournent toutes les
// deux — jamais un doublon entre elles, v2 ignore déjà tout bloc que v1 aurait signalé (Article 3).
if (reveille("clone-hunter")) try {
  const literalClusters = buildDuplicateReport();
  const nearClusters = buildNearDuplicateReport();
  cloneHunterFindingsCount = literalClusters.length + nearClusters.length;
  if (literalClusters.length || nearClusters.length) {
    console.error(
      "\n🔎 CLONE-HUNTER (balayage réel post-commit) : " +
      (literalClusters.length ? `${literalClusters.length} cluster(s) dupliqué(s) identique(s)` : "") +
      (literalClusters.length && nearClusters.length ? " ; " : "") +
      (nearClusters.length ? `${nearClusters.length} cluster(s) structurellement dupliqué(s) (renommage)` : "") +
      " — jamais une factorisation acquise, un signal à vérifier (cf. docs/clone-hunter/index.md).\n",
    );
  }
} catch { /* best-effort, jamais bloquant */ }

// ALWAYS-NEW-CODE — sixième Gardien sacré, COUCHE LÉGÈRE seulement (2026-09-21, demande explicite de
// l'utilisateur : « On devrait avoir une version legere de always new code qui tourne à chaque
// commit : always new est un gardien à mon sens » puis confirmé « OK pour always code : on l'integre
// tout de suite en gardien sacré [...] integration complete »). Distinction non négociable avec le
// reste de l'outil (Article 23) : seule la couche déjà gratuite (`recommendZone()`/
// `countDatedAddenda()`/`churnSignal()`, zéro raisonnement) tourne ici, jamais le vrai zoom profond
// (qui exige un vrai raisonnement payant, reste exclusivement déclenché via CHECK-LEVEL-TARGET
// niveau Exceptionnel ou sur demande explicite). Calcule le signal SEULEMENT sur le fichier principal
// de la zone actuellement recommandée par la rotation (THEME_PRIMARY_FILE) — jamais un balayage de
// tout le dépôt à chaque commit, coût minime comme CLEAN-DIRTY-OLD ci-dessus.
if (reveille("always-new-code")) try {
  const alwaysNewCodeIndexText = readFileSync("docs/always-new-code/index.md", "utf8");
  const coverage = parseCoverage(alwaysNewCodeIndexText);
  // La rotation porte sur les 8 zones du MOTEUR + les 8 zones d'OUTILLAGE dérivées (2026-09-22) :
  // ce Gardien ne voyait que le jeu et dormait sur tout commit de scripts/. Les secondes ne sont
  // pas une liste écrite ici mais le croisement de deux tables déjà gardées ailleurs.
  const zonesOutillage = outillageZones(AGENT_SCRIPT_FILES, AGENT_CATEGORIES);
  const toutesZones = [...THEMES, ...Object.keys(zonesOutillage)];
  const fichierDeZone = { ...THEME_PRIMARY_FILE, ...zonesOutillage };
  const zoneRec = recommendZone(toutesZones, coverage, undefined, new Date());
  const primaryFile = zoneRec?.zone ? fichierDeZone[zoneRec.zone] : undefined;
  let addenda, churn;
  if (primaryFile) {
    const fileText = readFileSync(primaryFile, "utf8");
    addenda = addendaSignal(countDatedAddenda(fileText));
    const numstat = sh(`git log --numstat --format= -- ${primaryFile}`, { cwd: new URL("../..", import.meta.url).pathname });
    churn = churnSignal(parseNumstat(numstat));
  }
  alwaysNewCodeFlagged = addenda === "probable" || churn === "probable";
  if (alwaysNewCodeFlagged) {
    console.error(
      "\n🔎 ALWAYS-NEW-CODE (signal léger post-commit) : zone \"" + zoneRec.zone + "\" (" + primaryFile + ") " +
      "montre un indice PROBABLE d'empilement (" +
      [addenda === "probable" && "addenda datés", churn === "probable" && "croissance sans réorganisation"].filter(Boolean).join(" + ") +
      ") — jamais une preuve, proposer un vrai zoom profond (Article 23) plutôt qu'agir seul (cf. docs/always-new-code/index.md).\n",
    );
  }
} catch { /* best-effort, jamais bloquant */ }

// BILAN DES SIX GARDIENS — une seule ligne, toujours affichée (2026-09-22, question de
// l'utilisateur : « seulement 3 gardiens sacrés ont été déclenchés, c'était volontaire ? »).
// Réponse trouvée en vérifiant : CINQ s'étaient bien réveillés sur ce commit, mais deux d'entre eux
// n'avaient RIEN trouvé — et un Gardien qui ne trouve rien ne disait rien du tout. Impossible, en
// lisant la sortie, de distinguer « a dormi » de « a tourné et n'a rien vu » : le silence voulait
// dire deux choses opposées. C'est un défaut d'observabilité, pas de couverture — corrigé ici, et
// pas en rendant les Gardiens plus bavards : une ligne unique, à la fin, qui donne l'état des six.
// ALWAYS-NEW-CODE qui dort sur un commit de `scripts/` n'est PAS un trou : ses 8 zones sont les
// thèmes du MOTEUR DU JEU (lib/app/components), il n'a rien à dire d'un script d'outillage — une
// décision assumée, vérifiée avant d'être prise pour un oubli (Article 23, garde-fou).
// Une cérémonie de certification PRODUITE n'est pas une cérémonie REÇUE (2026-09-22, manquement
// réel sur ecotoken : le bloc a bien été imprimé ici, je l'ai filtré en lisant la sortie, puis
// résumé en une phrase — exactement ce que la règle existait pour empêcher). Tant qu'elle n'est pas
// explicitement acquittée (`markCeremonyRelayed()`), elle est rappelée à chaque commit.
try {
  const enAttente = pendingCeremonies();
  if (enAttente.length) {
    console.error(`\n🎖️  CÉRÉMONIE(S) NON RELAYÉE(S) : ${enAttente.map((c) => c.slug).join(", ")} — le bloc de certification a été produit mais jamais montré à l'utilisateur. L'afficher TEL QUEL dans la réponse (jamais résumé en une phrase), puis acquitter : node -e "import('./scripts/le-coordinateur.mjs').then(c=>c.markCeremonyRelayed('<slug>'))"\n`);
  }
} catch { /* best-effort */ }

{
  const etat = (gardien, eveille, trouvailles) => {
    if (!eveille) return `${gardien} 💤`;
    if (trouvailles === undefined) return `${gardien} ⚪`;   // réveillé mais mesure indisponible
    return trouvailles > 0 ? `${gardien} ⚠️${trouvailles}` : `${gardien} ✅`;
  };
  const bilan = [
    etat("ARGUS", reveille("argus"), argusFindingsCount),
    etat("HARMONIA", reveille("harmonia"), harmoniaFindingsCount),
    etat("AXA-CHECK", reveille("axa-check"), undefined),
    etat("CLEAN-DIRTY-OLD", reveille("clean-dirty-old"), cleanDirtyOldFlagged === undefined ? undefined : (cleanDirtyOldFlagged ? 1 : 0)),
    etat("CLONE-HUNTER", reveille("clone-hunter"), cloneHunterFindingsCount),
    etat("ALWAYS-NEW-CODE", reveille("always-new-code"), alwaysNewCodeFlagged === undefined ? undefined : (alwaysNewCodeFlagged ? 1 : 0)),
  ];
  const dorment = [["argus"], ["harmonia"], ["axa-check"], ["clean-dirty-old"], ["clone-hunter"], ["always-new-code"]].filter(([g]) => !reveille(g)).length;
  console.log(`\n🛡️  Gardiens : ${bilan.join(" · ")}`);
  console.log(`   ✅ = a tourné, rien trouvé · ⚠️n = a trouvé n chose(s) · ⚪ = a tourné, mesure non chiffrable ici · 💤 = hors de son domaine (${dorment}/6 sur ce commit, cf. GARDIEN_DOMAINS)\n`);
}

// EL-PROFESSOR — garde-fou de couverture réel (2026-09-22, trouvé par l'utilisateur : « tu ne m'as
// pas livré de rapport à part le transcript [...] normalement tu dois me faire livrer les
// rapports »). Root-cause confirmée : `findMissingNotes()`/`findOrphanNotes()` (el-professor.mjs)
// existaient déjà et sont déjà testés dans check-house.mjs, mais n'étaient jamais appelés nulle part
// dans le réseau réel — full_sim17 a pu être archivé dans docs/simulations/index.md pendant toute
// une conversation sans que rien ne signale l'absence de sa note EL-PROFESSOR correspondante,
// exactement le même angle mort que celui déjà comblé pour docs/suivi/ (findCommitsMissingSuiviUpdate)
// mais jamais reproduit ici (Article 3 : une règle corrigée une fois ne doit plus jamais se
// reproduire ailleurs sous une autre forme). Warn-only comme le reste de ce hook : ne bloque jamais
// un commit, se contente de rendre l'oubli visible au moment même où il se produit plutôt que des
// tours plus tard.
try {
  const simIndex = readFileSync("docs/simulations/index.md", "utf8");
  const elIndex = readFileSync("docs/el-professor/index.md", "utf8");
  const missing = findMissingNotes(simIndex, elIndex);
  const orphans = findOrphanNotes(simIndex, elIndex);
  if (missing.length || orphans.length) {
    console.error(
      "\n🔎 EL-PROFESSOR (couverture réelle post-commit) : " +
      (missing.length ? `${missing.length} simulation(s) archivée(s) sans note EL-PROFESSOR (${missing.join(", ")})` : "") +
      (missing.length && orphans.length ? " ; " : "") +
      (orphans.length ? `${orphans.length} note(s) référençant une simulation absente de l'archive (${orphans.join(", ")})` : "") +
      " — cf. docs/referentiel/el-professor.md.\n",
    );
  }
} catch { /* best-effort, jamais bloquant */ }

// tool-brain — rappel CENTRALISÉ des outils (2026-09-21, remplace 3 blocs auparavant éparpillés
// ici — find-booster, find-deep-booster, le menu PRESTATIONS nu — demande explicite de
// l'utilisateur : « je veux un rappel centralisé sur tool-brain : c'est sa vocation profonde
// plutôt que des rappels éparpillés. remets à jour tout le système dans ce sens »). Une seule
// bannière, une seule fonction (`formatToolBrainReminder()`) qui réutilise elle-même
// flagFindBoosterCandidates()/flagFindDeepBoosterCandidates()/formatMenu() sans rien recalculer —
// jamais un second calcul dupliqué ici. Reste imparfait par nature (aucun mécanisme ne peut
// intercepter un Read/Grep avant qu'il n'ait lieu) : ceci renforce le rappel, ne le remplace jamais.
console.log(`\n${formatToolBrainReminder()}\n`);

// Rythme récent SMART-CONSO-TOKEN (2026-09-20, demande explicite de l'utilisateur : « je ne me
// rends pas compte que mon rythme de conso de token connaît un pic depuis 30min [...] aux moments
// déjà existants »). Affiché juste à côté du menu ci-dessus — les deux vus ensemble, jamais l'un
// sans l'autre. Limite honnête assumée : un pic qui survient pendant une longue plage de travail
// sans commit entre-temps ne sera vu qu'au prochain commit, pas en temps réel.
try {
  const tokenHistory = JSON.parse(readFileSync(new URL("../../.smart-conso-token-history.json", import.meta.url), "utf8"));
  const summary = summarizeHistory(tokenHistory, Date.now());
  console.log(`🪙 Rythme SMART-CONSO-TOKEN (7 derniers jours) : ${summary.totalRecent} action(s) coûteuse(s) confirmée(s) — ${JSON.stringify(summary.byType)}`);
  // Bilan investissement/sans-retour (2026-09-20, demande explicite de l'utilisateur : « faire de
  // notre suivi-conso-token un vrai héros des économies ») — vu au même moment que le rythme
  // ci-dessus, jamais séparément, pour ne jamais décourager à tort un investissement sain.
  console.log(`💡 ${computeInvestmentRatio(tokenHistory, Date.now()).message}`);
  // Auto-diagnostic (2026-09-20, demande explicite : « il se rend compte s'il a fait des erreurs
  // d'appréciation [...] mécanisme d'apprentissage »). VERSION SÉCURISÉE (tension avec la charte
  // signalée puis calibrée avec l'utilisateur, Article 14) : un simple COMPTE de constats, jamais
  // un ajustement — le détail complet reste dans l'historique local, à relire à la demande.
  const findings = diagnoseAdviceAccuracy(tokenHistory, Date.now());
  console.log(`🩺 Auto-diagnostic SMART-CONSO-TOKEN : ${findings.length ? findings.length + " constat(s) à relire (jamais appliqués seuls)" : "aucun constat pour l'instant"}.\n`);
} catch {
  console.log("🪙 Rythme SMART-CONSO-TOKEN : aucun historique local pour l'instant.\n");
}

// Rappel proactif de CIRCLE-TASKS (2026-09-20, demande explicite de l'utilisateur : « rappelle-moi
// à des moments naturels »). Seuil de COMMITS, jamais une fenêtre de temps (cf. commentaire de
// shouldRemindCircleTasks) — best-effort, jamais bloquant : un rappel manqué une fois n'empêche
// jamais un commit, cohérent avec le reste de ce crochet.
try {
  const totalCommitCount = Number(sh("git rev-list --count HEAD", { cwd: new URL("../..", import.meta.url).pathname }).trim());
  const lastRun = loadLastRun();
  const commitsSinceLastRun = Number.isFinite(totalCommitCount) ? totalCommitCount - (lastRun.lastRunCommitCount ?? 0) : NaN;
  if (shouldRemindCircleTasks(commitsSinceLastRun)) {
    console.log(`🔄 Ça fait ${commitsSinceLastRun} commits sans Ronde périodique (CIRCLE-TASKS, node scripts/circle-tasks.mjs) — envisage de la relancer.\n`);
  }
} catch { /* best-effort, jamais bloquant */ }

// Badge automatique — déclenchement réel à chaque commit (2026-09-22, demande explicite de
// l'utilisateur : « tu crées un petit script pour gérer toute cette partie validation/intégration/
// badge/message [...] avec déclenchement auto quand le script reçoit son badge réellement dans le
// code »). Décision explicite : jamais un nouveau fichier séparé — étend LE-COORDINATEUR
// (`checkAllAgentBadges()`), qui porte déjà `checkAgentOnboarding()`/`announceBadgeCeremony()`.
// Rassemble ici les VRAIES données déjà disponibles à ce point du hook (rien n'est relu en double) :
// `buildRealOnboardingContext()` (déjà construit pour check-tasks-details.mjs) donne CLAUDE.md, la
// table maîtresse, l'arborescence docs/ et le texte du suivi ; les 4 comptes ARGUS/HARMONIA/
// CLEAN-DIRTY-OLD/CLONE-HUNTER et la couverture AXA-CHECK par script sont ceux déjà calculés
// ci-dessus, jamais un second balayage. Le câblage réciproque des Gardiens (post-commit hook,
// HYPER-SCAN-CHECKPOINT, exclusion CIRCLE-TASKS) est vérifié ici en relisant directement les 3
// fichiers concernés — la seule vraie façon de savoir si "les autres le mentionnent" (cf.
// docs/referentiel/organisation-agence.md §3, répertoire des fonctionnements des Gardiens).
// Résultat affiché SEULEMENT au terminal (décision explicite de l'utilisateur, jamais un fichier
// archivé de plus) : `announceBadgeCeremony()` persiste déjà, en interne, la première certification
// dans son propre petit fichier de dédoublonnage — c'est cette persistance-là, minuscule et déjà
// testée, qui garantit que l'annonce ne se répète jamais, jamais un nouveau rapport par certification.
try {
  const onboardingContext = buildRealOnboardingContext();
  const hyperScanText = readFileSync("scripts/hyper-scan-checkpoint.mjs", "utf8");
  const postCommitHookText = readFileSync(new URL(import.meta.url).pathname, "utf8");
  const circleTasksText = readFileSync("scripts/circle-tasks.mjs", "utf8");

  // primaryName (2026-09-21, même bug de la même famille trouvé une 3e fois en fiabilisant tout
  // ceci ce soir — cf. checkAllAgentBadges()/computeBadgeResults() corrigées plus tôt) : `row.tool`
  // brut porte parfois une précision entre parenthèses ("CLONE-HUNTER (`scripts/clone-hunter.mjs`)",
  // "CASSANDRA-RH (...)", "find-booster (...)") — le slugifier tel quel produit un slug qui ne
  // correspond JAMAIS à AGENT_CATEGORIES ni à perSlugScriptCoverage, désactivant silencieusement
  // l'override axaCoveragePct/reciprocalWiring pour ces 3 Agents précisément. Même découpage que
  // checkAllAgentBadges() ; les overrides doivent aussi être indexés par ce même nom propre, jamais
  // la cellule brute (checkAllAgentBadges() cherche `agentOverrides?.[primaryName]`).
  const gardienOverrides = {};
  for (const row of parseToolsTable(onboardingContext.toolsTableMarkdown).filter((r) => r.statut === "Agent")) {
    const primaryName = row.tool.split(/[/(]/)[0].trim();
    const slug = slugifyAgentName(primaryName);
    const perTool = {};
    const pct = perSlugScriptCoverage ? scriptRobustnessScore(slug, perSlugScriptCoverage) : undefined;
    if (pct !== undefined) perTool.axaCoveragePct = pct;
    if (AGENT_CATEGORIES[slug] === "Gardien sacré du code") {
      perTool.reciprocalWiring = [
        { label: "câblé dans le crochet post-commit réel", ok: postCommitHookText.includes(primaryName) },
        { label: "agrégé dans HYPER-SCAN-CHECKPOINT", ok: hyperScanText.includes(primaryName) },
        { label: "exclu de la Ronde périodique CIRCLE-TASKS (déjà automatique à chaque commit)", ok: circleTasksText.includes(slug) },
      ];
    }
    if (Object.keys(perTool).length) gardienOverrides[primaryName] = perTool;
  }
  const mergedOverrides = { ...onboardingContext.agentOverrides };
  for (const [tool, extra] of Object.entries(gardienOverrides)) mergedOverrides[tool] = { ...mergedOverrides[tool], ...extra };

  const announcements = checkAllAgentBadges({
    ...onboardingContext,
    argusFindingsCount,
    harmoniaFindingsCount,
    cleanDirtyOldFlagged,
    cloneHunterFindingsCount,
    alwaysNewCodeFlagged,
    agentOverrides: mergedOverrides,
  });
  for (const announcement of announcements) console.log("\n" + announcement + "\n");
} catch { /* best-effort, jamais bloquant */ }
