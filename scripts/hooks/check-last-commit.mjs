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
import { collectCoverage, robustnessScore, collectScriptCoverage, scriptRobustnessScore, LIB_MAP } from "../axa-check.mjs";
import { lastTouchDays, relativeStaleness } from "../clean-dirty-old.mjs";
import { buildDuplicateReport, buildNearDuplicateReport } from "../clone-hunter.mjs";
import { findMissingNotes, findOrphanNotes } from "../el-professor.mjs";
import { parseToolsTable, slugifyAgentName, checkAllAgentBadges } from "../le-coordinateur.mjs";
import { formatToolBrainReminder } from "../tool-brain.mjs";
import { summarizeHistory, computeInvestmentRatio, diagnoseAdviceAccuracy } from "../smart-conso-token.mjs";
import { sh, AGENT_CATEGORIES } from "../lib-shell.mjs";
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
let argusFindingsCount, harmoniaFindingsCount, cleanDirtyOldFlagged, cloneHunterFindingsCount;
try {
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
try {
  const covDir = ".sites-runtime/axa-check-postcommit-cov";
  const perFile = collectCoverage(covDir);
  const score = robustnessScore(Object.values(perFile).flat());
  if (score !== undefined) {
    console.log(`🔎 AXA-CHECK (balayage réel post-commit) : couverture globale par fonction ${Math.round(score)}% sur ${Object.keys(perFile).length} fichier(s) mesuré(s) — jamais une preuve de correction, un signal de robustesse seulement (cf. docs/axa-check/index.md).\n`);
  }
  perSlugScriptCoverage = collectScriptCoverage(covDir);
  rmSync(covDir, { recursive: true, force: true });
} catch { /* best-effort, jamais bloquant */ }

// CLEAN-DIRTY-OLD — coût minime (un seul `git log -1` par fichier de LIB_MAP, aucune instrumentation
// lourde), jamais un frein réel à un commit contrairement à AXA-CHECK ci-dessus. Seul son SIGNAL de
// fraîcheur (depuis quand son carnet n'a pas été relu, clean-dirty-old-signal) rejoignait la Ronde
// CIRCLE-TASKS ; son vrai calcul de stagnation relative n'avait jamais tourné qu'à la main via
// runNetworkCheck().
try {
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
try {
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

  const gardienOverrides = {};
  for (const row of parseToolsTable(onboardingContext.toolsTableMarkdown).filter((r) => r.statut === "Agent")) {
    const slug = slugifyAgentName(row.tool);
    const perTool = {};
    const pct = perSlugScriptCoverage ? scriptRobustnessScore(slug, perSlugScriptCoverage) : undefined;
    if (pct !== undefined) perTool.axaCoveragePct = pct;
    if (AGENT_CATEGORIES[slug] === "Gardien sacré du code") {
      perTool.reciprocalWiring = [
        { label: "câblé dans le crochet post-commit réel", ok: postCommitHookText.includes(row.tool) },
        { label: "agrégé dans HYPER-SCAN-CHECKPOINT", ok: hyperScanText.includes(row.tool) },
        { label: "exclu de la Ronde périodique CIRCLE-TASKS (déjà automatique à chaque commit)", ok: circleTasksText.includes(slug) },
      ];
    }
    if (Object.keys(perTool).length) gardienOverrides[row.tool] = perTool;
  }
  const mergedOverrides = { ...onboardingContext.agentOverrides };
  for (const [tool, extra] of Object.entries(gardienOverrides)) mergedOverrides[tool] = { ...mergedOverrides[tool], ...extra };

  const announcements = checkAllAgentBadges({
    ...onboardingContext,
    argusFindingsCount,
    harmoniaFindingsCount,
    cleanDirtyOldFlagged,
    cloneHunterFindingsCount,
    agentOverrides: mergedOverrides,
  });
  for (const announcement of announcements) console.log("\n" + announcement + "\n");
} catch { /* best-effort, jamais bloquant */ }
