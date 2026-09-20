// SMART-CONSO-TOKEN — pendant de Smart Conso API, mais pour les TOKENS de l'agent lui-même
// (2026-09-20, cf. docs/smart-conso-token-blueprint.md et docs/referentiel/smart-conso-token.md).
// Rôle, demandé explicitement par l'utilisateur : « un conseiller en réduction de conso électrique »
// — repère les tâches qui vont consommer beaucoup de tokens et vérifie l'équilibre entre le besoin
// réel et le coût, pour l'agent, pour l'utilisateur (une demande qui implique naturellement une
// grosse consommation), et pour les autres outils du paysage.
//
// Différence structurelle avec Smart Conso API (Article 22) : le quota Gemini est sondable en
// direct (un vrai appel API révèle l'état réel MAINTENANT). Il n'existe AUCUN équivalent pour les
// tokens de la conversation elle-même — cet outil ne peut donc jamais mesurer un vrai total, juste
// reconnaître des SCHÉMAS CONNUS coûteux (recherche du 2026-09-20, sources dans
// docs/referentiel/smart-conso-token.md) combinés à des VALEURS MESURABLES (taille réelle de
// fichiers, nombre d'actions déjà faites cette session) — jamais présenté comme un chiffre exact.
//
// Connaissance liée au MODÈLE/PLATEFORME courant, jamais supposée éternelle (demande explicite de
// l'utilisateur : « s'il change de modèle d'IA [...] il va demander à être mis à jour »). Le
// registre ci-dessous est valable pour Claude (architecture agent/sous-agent, mise en cache de
// contexte) — si un autre modèle reprend ce projet, ce registre doit être revalidé, jamais recopié
// à l'identique en silence.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HISTORY_PATH = fileURLToPath(new URL("../.smart-conso-token-history.json", import.meta.url));

// Provenance de la connaissance (2026-09-20, recherche web réelle — sources dans
// docs/referentiel/smart-conso-token.md). Jamais mise à jour en silence : un changement de modèle
// ou une recherche substantiellement plus récente doit remplacer cette date/ces sources, pas les
// ignorer.
export const KNOWLEDGE_PROVENANCE = {
  validatedFor: "claude",
  researchedAt: "2026-09-20",
  sources: [
    "https://www.firecrawl.dev/blog/claude-code-token-efficiency",
    "https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage",
    "https://www.mindstudio.ai/blog/claude-code-subagents-cost-tokens",
    "https://www.anthropic.com/engineering/advanced-tool-use",
    "https://alexop.dev/posts/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools/",
    "https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models",
  ],
};

// Repère concret et sourcé (enrichissement du 2026-09-20, demande explicite de l'utilisateur :
// « enrichis encore les connaissances [...] pour les rendre hyperperformant ») : un fichier
// d'instructions toujours chargé devrait rester sous ~300 lignes, idéalement moins de 100 —
// seulement ce qui est universellement nécessaire à chaque session, le reste rejoint un document
// de référence lu à la demande (patron déjà appliqué dans ce projet via `docs/referentiel/`,
// jamais inventé ici). Jamais une limite stricte à faire respecter automatiquement — un repère pour
// juger, jamais un couperet mécanique (Article 19 : comprendre le contenu avant de le déplacer).
export const PROGRESSIVE_DISCLOSURE_BENCHMARK = { lignesIdeal: 100, lignesLimite: 300 };

// Schémas connus coûteux pour Claude (2026-09-20) — jamais un chiffre exact, un ORDRE DE GRANDEUR
// documenté et sourcé, pour que l'agent pèse le besoin réel avant de foncer ("on ne chauffe pas une
// pièce en été", demande explicite de l'utilisateur).
// Nuance explicite (2026-09-20, demande explicite de l'utilisateur : « est-ce que d'un autre côté,
// l'utilisation des outils peut économiser des tokens, car automatisés ? »). Réponse honnête, à
// double sens, jamais une généralité du type "les outils coûtent" ou "les outils économisent" :
// - AUTOMATISATION MÉCANIQUE (ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD, LE-COORDINATEUR) tourne
//   dans un processus séparé, à COÛT NUL pour le contexte de l'agent — un vrai gain net, puisque
//   reproduire le même travail à la main (relire tout le code pour chercher un champ jamais lu)
//   coûterait, lui, de vrais tokens de contexte.
// - AUTOMATISATION PAR AGENT SÉPARÉ (THE-FINAL-JUDGE, HYPER-SCAN-CHECKPOINT version complète)
//   n'économise JAMAIS de tokens — elle ajoute un coût fixe (~37k, cf. agent_subagent_spawn
//   ci-dessous) EN PLUS de ce qui a déjà été dépensé pour y arriver. Jamais un raisonnement délégué
//   "gratuitement" : justifié seulement par un besoin réel de regard indépendant, jamais par l'idée
//   fausse que "c'est automatisé donc c'est gratuit".
export const AUTOMATION_TOKEN_NUANCE = {
  mecanique: "Coût nul pour le contexte de l'agent — un vrai gain net face à l'équivalent manuel.",
  agentSepare: "Coût fixe ajouté (~37k tokens), jamais une économie — justifié par le besoin de regard indépendant, jamais par l'automatisation elle-même.",
};

export const KNOWN_COSTLY_PATTERNS = {
  agent_subagent_spawn: {
    poids: "élevé",
    raison: "Un agent séparé (outil Agent) démarre avec un contexte \"à froid\" d'environ 37 000 tokens, dont seulement ~3% concerne réellement la tâche demandée — un coût quasi fixe, presque le même pour une toute petite question que pour une grosse.",
  },
  full_repo_scope: {
    poids: "élevé",
    raison: "Lecture exhaustive de tout le dépôt (lib/app/components/scripts + toute la documentation) — coût proportionnel à la taille totale du projet, jamais négligeable une fois le projet devenu gros.",
  },
  charter_size_tax: {
    poids: "variable (cf. measureClaudeMdWeight)",
    raison: "Un fichier d'instructions permanent (CLAUDE.md) est relu à CHAQUE message de la session, pas une fois — un benchmark cité compare 3847 tokens à 312 tokens pour 91,9% de réduction sans perte de qualité mesurable.",
  },
  large_archive_read: {
    poids: "modéré",
    raison: "Lire un transcript de simulation complet ou un journal JSON brut (plusieurs Mo possibles) — coût proportionnel à la taille du fichier, jamais fixe.",
  },
  progressive_disclosure_violation: {
    poids: "variable (cf. scanDocumentWeight)",
    raison: "Un document toujours chargé (CLAUDE.md) qui mélange consignes universelles et contenu narratif/historique consultable à la demande paie ce contenu à CHAQUE session — le patron recommandé (déjà appliqué dans ce projet via docs/referentiel/) : ne garder dans le fichier toujours chargé que ce qui est vraiment nécessaire à chaque fois.",
  },
};

// Estimation grossière et assumée comme telle (jamais un vrai compteur) : ~4 caractères par token,
// heuristique largement citée dans la recherche du 2026-09-20 — suffisante pour classer un ordre de
// grandeur, jamais pour un budget exact.
export function estimateTokens(text) {
  return Math.round((text?.length ?? 0) / 4);
}

// Seuils dérivés directement du benchmark cité (312 tokens = sain, 3847 tokens = déjà pénalisant,
// "5000+ tokens" = "réduit significativement le contexte de travail effectif").
export function measureClaudeMdWeight(text) {
  const tokens = estimateTokens(text);
  if (tokens >= 5000) return { tokens, niveau: "élevé", message: `~${tokens} tokens estimés — au-delà du seuil (5000+) que la recherche identifie comme réduisant significativement le contexte de travail effectif.` };
  if (tokens >= 1500) return { tokens, niveau: "modéré", message: `~${tokens} tokens estimés — au-dessus d'un fichier "sain" (quelques centaines de tokens), sans être encore au niveau le plus pénalisant.` };
  return { tokens, niveau: "faible", message: `~${tokens} tokens estimés — dans une fourchette raisonnable.` };
}

// Compte les asides narratives datées ("*(ajouté le 2026-09-19, ...)*") — un signal MÉCANIQUE
// faible mais honnête de contenu historique/justificatif plutôt que de règle active, jamais une
// preuve complète (une vraie lecture reste seule capable de trier tout le reste). Réutilisé comme
// point de départ concret et sûr pour une restructuration (2026-09-20, affiné après un premier
// scan jugé pas assez actionnable par l'utilisateur).
const DATED_ASIDE_PATTERN = /\*\([^)]*\b20\d{2}-\d{2}-\d{2}\b[^)]*\)\*/g;
export function countDatedNarrativeMarkers(text) {
  const matches = text?.match(DATED_ASIDE_PATTERN) || [];
  const tokens = matches.reduce((sum, m) => sum + estimateTokens(m), 0);
  return { occurrences: matches.length, tokens };
}

// Livrable concret, pas seulement un chiffre (2026-09-20, demande explicite de l'utilisateur : « il
// délivre un vrai résultat [...] il sait comment économiser »). Localise chaque aside narrative
// datée (numéro de ligne + extrait) pour produire une vraie liste de candidats prête à l'emploi —
// jamais appliquée automatiquement (Article 14), mais un travail mécanique fait une fois, gratuit,
// qui évite de le refaire à la main au moment d'une vraie session de restructuration future : le
// gain réel n'est pas le scan lui-même, c'est le temps/tokens économisés à CETTE session future.
export function listDatedNarrativeMarkers(text) {
  if (!text) return [];
  const lines = text.split("\n");
  let offset = 0;
  const lineStarts = lines.map((l) => { const start = offset; offset += l.length + 1; return start; });
  const results = [];
  for (const m of text.matchAll(DATED_ASIDE_PATTERN)) {
    const idx = m.index ?? 0;
    let ligne = 1;
    for (let i = 0; i < lineStarts.length; i++) if (lineStarts[i] <= idx) ligne = i + 1; else break;
    const extrait = m[0].length > 140 ? m[0].slice(0, 140) + "…" : m[0];
    results.push({ ligne, tokens: estimateTokens(m[0]), extrait: extrait.replace(/\n/g, " ") });
  }
  return results;
}

// Généralise measureClaudeMdWeight() à N'IMPORTE QUEL document toujours chargé ou fréquemment relu
// (2026-09-20, demande explicite : « il est capable de réaliser un scan du code et proposer des
// solutions moins coûteuses en token »). Ajoute le repère "progressive disclosure" (benchmark
// ci-dessus) — jamais une décision automatique de couper quoi que ce soit : seulement un signal
// mesurable, la décision de CE qui peut bouger vers un document à la demande reste toujours une
// vraie lecture humaine/agent (Article 19).
//
// **Affiné le 2026-09-20** (demande explicite : « chaque résultat doit correspondre à une action
// possible »), après un premier scan jugé pas assez actionnable — traitait un document toujours
// chargé (CLAUDE.md, coût payé à CHAQUE message) et un document lu à la demande (le reste de
// docs/, coût payé une fois à la lecture) comme s'ils méritaient la même réaction. `alwaysLoaded`
// change la nature du conseil rendu, jamais seulement son ton : un document toujours chargé reçoit
// une action concrète et datée (les asides narratives déjà repérables mécaniquement) ; un document
// à la demande reçoit explicitement l'absence d'action requise, pour ne jamais faire perdre du
// temps sur un faux problème.
export function scanDocumentWeight(text, filename = "document", { alwaysLoaded = false } = {}) {
  const weight = measureClaudeMdWeight(text);
  const lignes = (text?.match(/\n/g) || []).length + 1;
  const overBenchmark = lignes > PROGRESSIVE_DISCLOSURE_BENCHMARK.lignesLimite;
  let actionPossible;
  let urgence;
  if (!overBenchmark) {
    actionPossible = "Aucune action — dans le repère recommandé.";
    urgence = "aucune";
  } else if (!alwaysLoaded) {
    actionPossible = "Aucune action requise maintenant : ce document est lu À LA DEMANDE, pas à chaque message — sa taille est normale pour de la documentation de référence. Seule question pertinente, qu'aucun scan ne peut mesurer : est-il relu plus souvent que nécessaire dans une même session ?";
    urgence = "informative";
  } else {
    const markers = countDatedNarrativeMarkers(text);
    actionPossible = markers.occurrences
      ? `Document TOUJOURS CHARGÉ (coût payé à chaque message) : ${markers.occurrences} aside(s) narrative(s) datée(s) repérée(s) mécaniquement (~${markers.tokens} tokens, candidates sûres car déjà explicitement historiques) — commencer une restructuration par celles-ci, puis trier le reste à la main (Article 19, jamais automatique).`
      : `Document TOUJOURS CHARGÉ (coût payé à chaque message), au-delà du repère, mais aucune aside narrative datée détectée mécaniquement — le tri doit se faire entièrement à la main, aucun point de départ mécanique à proposer ici.`;
    urgence = "action_requise";
  }
  return {
    fichier: filename,
    lignes,
    alwaysLoaded,
    ...weight,
    conformeProgressiveDisclosure: !overBenchmark,
    urgence,
    actionPossible,
  };
}

// Portée d'une analyse SMART-CONSO-TOKEN — réutilise EXACTEMENT le vocabulaire déjà créé pour
// THE-FINAL-JUDGE (Global/Partiel/Zoomé/Focus, cf. docs/referentiel/the-final-judge.md), jamais un
// second vocabulaire inventé (Article 19, harmonie de taxonomie demandée explicitement le
// 2026-09-20). "documents" est une Map<nomFichier, texte> — l'appelant choisit quels fichiers
// correspondent à la portée demandée (Global = tous les documents toujours chargés/fréquemment
// relus ; Partiel = plusieurs ; Zoomé = un seul ; Focus = un extrait précis d'un seul document).
// `alwaysLoadedSet` : Set<nomFichier> des documents réellement toujours chargés (dans ce projet,
// CLAUDE.md seul) — tout document absent du set est traité comme lu à la demande.
export const SCOPE_LEVELS = ["global", "partiel", "zoome", "focus"];

export function scanScope(portee, documents, alwaysLoadedSet = new Set()) {
  if (!SCOPE_LEVELS.includes(portee)) throw new Error(`Portée inconnue: "${portee}" — attendu l'un de ${SCOPE_LEVELS.join(", ")}`);
  const resultats = Object.entries(documents ?? {}).map(([nom, texte]) => scanDocumentWeight(texte, nom, { alwaysLoaded: alwaysLoadedSet.has(nom) }));
  const totalTokens = resultats.reduce((sum, r) => sum + r.tokens, 0);
  const actionRequise = resultats.filter((r) => r.urgence === "action_requise");
  const informatif = resultats.filter((r) => r.urgence === "informative");
  return { portee, totalTokens, documentsAnalyses: resultats.length, actionRequise, informatif, aRegarder: [...actionRequise, ...informatif] };
}

// KPI (demandé explicitement le 2026-09-20 : « enrichis [...] avec son KPI ») — même principe que
// le KPI "dès la création" d'ALWAYS-NEW-CODE (autre outil qui propose des changements structurels,
// jamais appliqués seul) : le nombre de propositions RÉELLEMENT retenues et appliquées, avec la
// réduction effective mesurée avant/après — jamais un nombre de scans lancés, qui ne dit rien sur
// l'utilité réelle de l'outil. Alimenté par recordAction("proposition_appliquee", ..., { reductionPct }).
export function computeAdoptionKpi(history) {
  const applied = (history?.actions ?? []).filter((a) => a.type === "proposition_appliquee" && typeof a.reductionPct === "number");
  if (!applied.length) return { propositionsAppliquees: 0, reductionMoyennePct: undefined };
  const total = applied.reduce((sum, a) => sum + a.reductionPct, 0);
  return { propositionsAppliquees: applied.length, reductionMoyennePct: Math.round((total / applied.length) * 10) / 10 };
}

// Un changement de modèle/plateforme rend la connaissance ci-dessus potentiellement obsolète —
// jamais supposée valable en silence (demande explicite de l'utilisateur). Comparaison tolérante
// (sous-chaîne, insensible à la casse) : "claude-sonnet-5" valide bien "claude".
export function checkKnowledgeFreshness(agentIdentity, provenance = KNOWLEDGE_PROVENANCE) {
  if (!agentIdentity) {
    return { fraiche: undefined, message: "Identité de l'agent non fournie — impossible de confirmer que le registre de schémas coûteux reste valable. À fournir explicitement pour une vérification fiable." };
  }
  const match = agentIdentity.toLowerCase().includes(provenance.validatedFor.toLowerCase());
  if (!match) {
    return {
      fraiche: false,
      message: `Ce registre a été validé pour "${provenance.validatedFor}" (recherche du ${provenance.researchedAt}), pas pour "${agentIdentity}". Une nouvelle recherche est nécessaire avant de faire confiance à ces schémas coûteux sur ce modèle — ne jamais recopier en silence.`,
    };
  }
  return { fraiche: true, message: `Registre validé pour "${provenance.validatedFor}" (recherche du ${provenance.researchedAt}) — cohérent avec l'identité déclarée "${agentIdentity}".` };
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function countRecentActions(history, actionType, now, windowHours) {
  const windowMs = windowHours * 60 * 60 * 1000;
  return (history?.actions ?? []).filter((a) => a.type === actionType && now - a.at <= windowMs && now - a.at >= 0).length;
}

// Seuil dur initial (2026-09-20, PROPOSÉ, pas encore validé explicitement par l'utilisateur — même
// statut d'honnêteté que le seuil de Smart Conso API à sa création) : un nombre d'agents séparés
// lancés dans une fenêtre de 2h, le schéma le plus coûteux du registre ci-dessus.
export const HARD_THRESHOLDS = { agent_subagent_spawn: { count: 3, windowHours: 2 } };

// Fonction pure centrale : combine un schéma connu (registre ci-dessus) + l'historique mesurable de
// la session (jamais un chiffre exact de tokens) pour un verdict fiabilisé — jamais un blocage
// silencieux, toujours une raison explicite (demande explicite de l'utilisateur : « il combine
// données connues et données observables, et rend un verdict fiabilisé »).
export function assess({ actionType, context, history, now, agentIdentity }) {
  const pattern = KNOWN_COSTLY_PATTERNS[actionType];
  const freshness = checkKnowledgeFreshness(agentIdentity);
  const threshold = HARD_THRESHOLDS[actionType];

  if (threshold) {
    const recentCount = countRecentActions(history, actionType, now, threshold.windowHours);
    if (recentCount >= threshold.count) {
      return {
        verdict: "seuil_dur",
        message: `Seuil dur atteint : ${recentCount} action(s) "${actionType}" déjà confirmée(s) dans les ${threshold.windowHours} dernières heures (limite : ${threshold.count}). ${pattern ? pattern.raison : ""} Une fenêtre de question doit s'ouvrir avant de continuer.`,
        freshness,
      };
    }
  }
  if (pattern && pattern.poids === "élevé") {
    return {
      verdict: "avertissement_souple",
      message: `Schéma connu coûteux ("${actionType}") : ${pattern.raison} Contexte donné : ${context || "non précisé"}. Négociable avec un besoin réel clair, mais à peser avant de foncer ("on ne chauffe pas une pièce en été").`,
      freshness,
    };
  }
  if (pattern) {
    return { verdict: "ok", message: `Schéma reconnu ("${actionType}", poids ${pattern.poids}) : ${pattern.raison} Pas de seuil franchi.`, freshness };
  }
  return { verdict: "ok", message: `Schéma "${actionType}" non répertorié dans le registre connu — rien à signaler de spécifique.`, freshness };
}

// Enregistre le rythme/contexte/conditions de chaque action confirmée (demande explicite de
// l'utilisateur : « il enregistre les rythmes de conso de tokens, les contextes, les conditions, il
// s'améliore dans le temps »). N'ajuste JAMAIS ses propres seuils tout seul à partir de cet
// historique (jamais un apprentissage automatique silencieux) — sert uniquement de matière pour une
// vraie relecture humaine/agent périodique, même principe que `describeKnownLessons()` du Smart
// Breaker.
export function recordAction(actionType, context, now) {
  const history = loadJson(HISTORY_PATH, { actions: [] });
  history.actions = (history.actions ?? []).slice(-300);
  history.actions.push({ type: actionType, context: context || null, at: now });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
  return history;
}

export function summarizeHistory(history, now, windowDays = 7) {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recent = (history?.actions ?? []).filter((a) => now - a.at <= windowMs && now - a.at >= 0);
  const byType = {};
  for (const a of recent) byType[a.type] = (byType[a.type] ?? 0) + 1;
  return { totalRecent: recent.length, byType, windowDays };
}

// Archive un scan réel (2026-09-20, demande explicite de l'utilisateur : « chaque scan livre un
// diagnostic directement dans la conversation, mais qui est historisé dans un fichier local, afin
// que smart-conso-token puisse se forger sa propre expérience aussi »). Deux traces, deux natures
// différentes, jamais confondues (même principe que Smart Conso API : registre archivé vs carnet de
// session) : un rapport lisible complet dans `docs/smart-conso-token/scans/` (committé, consultable
// par un futur agent) et une entrée compacte dans l'historique local non versionné (pour le rythme
// et l'expérience accumulée, jamais pour relire le détail).
// **Affiné le 2026-09-20** (demande explicite : « chaque résultat doit correspondre à une action
// possible [...] plus cohérent, plus lisible ») : sépare clairement ce qui demande une vraie action
// (documents toujours chargés au-delà du repère) de ce qui est purement informatif (documents lus à
// la demande, taille normale pour de la référence) — jamais les deux mélangés dans une seule liste
// plate comme le premier scan le faisait.
export function formatScanReport(scopeResult, now) {
  const lines = [
    `SMART-CONSO-TOKEN — scan réel — ${new Date(now).toISOString()}`,
    "",
    `Portée : ${scopeResult.portee}`,
    `Documents analysés : ${scopeResult.documentsAnalyses}`,
    `Total estimé : ~${scopeResult.totalTokens} tokens`,
    "",
    "=== ACTION REQUISE (documents toujours chargés, au-delà du repère) ===",
    scopeResult.actionRequise.length ? "" : "Aucun.",
    ...scopeResult.actionRequise.map((r) => `  - ${r.fichier} : ${r.lignes} lignes, ~${r.tokens} tokens — ${r.actionPossible}`),
    "",
    "=== INFORMATIF SEULEMENT (documents lus à la demande, aucune action requise) ===",
    scopeResult.informatif.length ? "" : "Aucun.",
    ...scopeResult.informatif.map((r) => `  - ${r.fichier} : ${r.lignes} lignes, ~${r.tokens} tokens — ${r.actionPossible}`),
  ];
  return lines.join("\n") + "\n";
}

export function recordScan(scopeResult, now) {
  const history = loadJson(HISTORY_PATH, { actions: [] });
  history.actions = (history.actions ?? []).slice(-300);
  history.actions.push({ type: "scan", at: now, portee: scopeResult.portee, totalTokens: scopeResult.totalTokens, aRegarder: scopeResult.aRegarder.length });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
  return history;
}

// Garde-fou d'AUTORITÉ RÉELLE sur les autres outils (2026-09-20, demande explicite de l'utilisateur :
// « comment son autorité est réglée avec les outils ? »). Limite déjà posée : aucune preuve externe
// n'existe pour un appel d'agent séparé EN GÉNÉRAL — mais un outil comme THE-FINAL-JUDGE laisse
// toujours une trace externe et vérifiable de son propre passage (son rapport archivé dans
// docs/the-final-judge/index.md) : ce garde-fou compare CETTE trace à l'historique local de
// SMART-CONSO-TOKEN, exactement le même principe que findUnconfirmedBursts() de Smart Conso API
// (comparer une preuve indépendante au carnet de consultation). Ça rend l'obligation de consultation
// écrite dans la charte VÉRIFIABLE après coup pour les outils qui archivent leur propre passage —
// jamais pour un simple appel d'agent ad hoc, qui reste hors de portée (aucune trace externe).
export function findJudgeSpawnsWithoutConsultation(indexText, history, dayWindowMs = 24 * 60 * 60 * 1000) {
  const dates = [];
  for (const line of (indexText || "").split("\n")) {
    const m = /^\|\s*(\d{4}-\d{2}-\d{2})\s*\|/.exec(line);
    if (m) dates.push(m[1]);
  }
  const confirmedSpawns = (history?.actions ?? []).filter((a) => a.type === "agent_subagent_spawn").map((a) => a.at);
  const missing = [];
  for (const date of dates) {
    const dayStart = new Date(date + "T00:00:00Z").getTime();
    const hasConsultation = confirmedSpawns.some((at) => at >= dayStart - dayWindowMs && at < dayStart + dayWindowMs);
    if (!hasConsultation) missing.push(date);
  }
  return missing;
}

function main() {
  const actionType = process.argv[2];
  const identityArg = process.argv.find((a) => a.startsWith("--identity="));
  const contextArg = process.argv.find((a) => a.startsWith("--context="));
  const agentIdentity = identityArg ? identityArg.slice("--identity=".length) : undefined;
  const context = contextArg ? contextArg.slice("--context=".length) : undefined;
  const now = Date.now();
  const history = loadJson(HISTORY_PATH, { actions: [] });

  if (!actionType) {
    console.log("Usage: node scripts/smart-conso-token.mjs <type-d'action> [--confirm] [--identity=claude-sonnet-5] [--context=\"...\"]");
    console.log("Types connus :", Object.keys(KNOWN_COSTLY_PATTERNS).join(", "));
    process.exit(1);
  }

  const advice = assess({ actionType, context, history, now, agentIdentity });
  console.log("=== SMART-CONSO-TOKEN — avis avant action coûteuse en tokens ===\n");
  console.log(`Action envisagée : ${actionType}`);
  if (context) console.log(`Contexte : ${context}`);
  console.log(`Avis : [${advice.verdict}] ${advice.message}`);
  if (advice.freshness?.fraiche === false) console.log(`\n⚠️ FRAÎCHEUR DE CONNAISSANCE : ${advice.freshness.message}`);
  else if (advice.freshness) console.log(`(${advice.freshness.message})`);

  if (process.argv.includes("--confirm")) {
    recordAction(actionType, context, now);
    console.log("\nAction confirmée et enregistrée dans l'historique local.");
  } else {
    console.log("\n(Avis seul — relancer avec --confirm une fois la décision prise.)");
  }

  const summary = summarizeHistory(history, now);
  console.log(`\nRythme observé (${summary.windowDays} derniers jours) : ${summary.totalRecent} action(s) au total — ${JSON.stringify(summary.byType)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
