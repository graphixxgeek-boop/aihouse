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
import { collectCoverage, robustnessScore, LIB_MAP } from "../axa-check.mjs";
import { lastTouchDays, relativeStaleness } from "../clean-dirty-old.mjs";
import { PRESTATIONS, formatMenu } from "../le-coordinateur.mjs";
import { summarizeHistory, computeInvestmentRatio, diagnoseAdviceAccuracy } from "../smart-conso-token.mjs";
import { sh } from "../lib-shell.mjs";
import { loadLastRun, shouldRemindCircleTasks } from "../circle-tasks.mjs";

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
try {
  const lifeSource = readFileSync("lib/life.ts", "utf8");
  const files = walk("lib").concat(walk("app"));
  const dead = findDeadLifeFields(files, lifeSource);
  const todos = findTodoMarkers(walk(".").filter((f) => !f.includes("/scratchpad/")));
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
try {
  const covDir = ".sites-runtime/axa-check-postcommit-cov";
  const perFile = collectCoverage(covDir);
  const score = robustnessScore(Object.values(perFile).flat());
  if (score !== undefined) {
    console.log(`🔎 AXA-CHECK (balayage réel post-commit) : couverture globale par fonction ${Math.round(score)}% sur ${Object.keys(perFile).length} fichier(s) mesuré(s) — jamais une preuve de correction, un signal de robustesse seulement (cf. docs/axa-check/index.md).\n`);
  }
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
  if (staleFiles.length) {
    console.error(
      "\n🔎 CLEAN-DIRTY-OLD (balayage réel post-commit) : " + staleFiles.length +
      ` fichier(s) stagnant(s) relativement au reste du projet — ${staleFiles.join(", ")} ` +
      "(à vérifier via ARGUS/HARMONIA/ALWAYS-NEW-CODE, jamais un jugement seul, cf. docs/clean-dirty-old/index.md).\n",
    );
  }
} catch { /* best-effort, jamais bloquant */ }

// Rappel du catalogue LE-COORDINATEUR (2026-09-20, demande explicite de l'utilisateur : « je
// voudrais que tu exploites ce catalogue et que tu en bénéficies, c'est pour ça que je cherche une
// ouverture auto »). Toujours affiché, jamais conditionné à un problème détecté — ce n'est pas un
// avertissement, c'est un pense-bête systématique de ce qui peut être commandé au réseau d'outils.
// Volontairement SANS relancer runNetworkCheck() (qui reshellerait check-house.mjs une seconde fois
// avec instrumentation de couverture, juste pour le score AXA-CHECK — un vrai coût redondant à
// chaque commit, contraire à la règle anti-doublon) : ce hook n'affiche que la liste de données,
// gratuite et instantanée.
// Réflexe attendu de l'agent à CE moment précis (précisé le 2026-09-20, correction explicite de
// l'utilisateur — l'enchaînement exact, pas seulement "relire avant de répondre") : dès que ce
// catalogue s'affiche en auto, se demander IMMÉDIATEMENT « une de ces prestations correspond-elle au
// besoin actuellement en cours ? ». Un second réflexe, distinct et CUMULABLE avec celui-ci (jamais un
// remplaçant) : relire aussi ce catalogue avant de répondre à toute future demande qui pourrait y
// correspondre, même en dehors d'un commit.
console.log("\n📋 Prestations disponibles via le réseau d'outils (rappel automatique) :\n");
console.log(formatMenu(PRESTATIONS));
console.log("");

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
