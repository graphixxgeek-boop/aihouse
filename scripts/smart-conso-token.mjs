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
import { countTasksSince, lastCoveredTaskNumber } from "./check-suivi-fidelity.mjs";

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
    // Enrichissement du 2026-09-20 (2e recherche, demande explicite « niveau expert ») — source
    // PREMIÈRE PARTIE (documentation officielle Anthropic sur CLAUDE.md lui-même, jamais consultée
    // avant cette recherche) :
    "https://code.claude.com/docs/en/best-practices",
    "https://www.morphllm.com/prompt-compression",
    "https://mem0.ai/blog/context-engineering-ai-agents-guide",
  ],
};

// Checklist ACTIONNABLE tirée de la documentation OFFICIELLE Anthropic (code.claude.com,
// 2026-09-20, deuxième recherche à la demande explicite de l'utilisateur — jamais consultée avant
// ce jour malgré son autorité) — vient COMPLÉTER, jamais remplacer, le repère "progressive
// disclosure" déjà utilisé : un test plus précis, ligne par ligne, plutôt qu'un seul seuil global.
export const CLAUDE_MD_INCLUDE_EXCLUDE = {
  test: "Pour chaque ligne : « la retirer ferait-elle faire une erreur à l'agent ? » Si non, elle est candidate au retrait ou au déplacement vers un document lu à la demande.",
  inclure: [
    "commandes shell que l'agent ne devinerait pas",
    "règles de style qui diffèrent des conventions par défaut",
    "instructions de test et lanceur de test préféré",
    "étiquette du dépôt (nommage de branche, conventions de PR)",
    "décisions d'architecture spécifiques au projet",
    "particularités d'environnement (variables requises)",
    "pièges/comportements non évidents déjà rencontrés",
  ],
  exclure: [
    "tout ce que l'agent peut déduire en lisant le code",
    "conventions de langage standard déjà connues",
    "documentation d'API détaillée (un lien suffit)",
    "information qui change fréquemment",
    "longues explications ou tutoriels",
    "description fichier par fichier du dépôt",
    "pratiques évidentes par elles-mêmes",
  ],
  // Trouvaille distincte, jamais dans le repère précédent : une emphase (gras, "IMPORTANT") sur
  // trop de lignes à la fois DILUE l'emphase elle-même — l'agent ne sait plus laquelle prioriser.
  // Un fichier avec beaucoup de gras/MAJUSCULES partout n'aide jamais plus qu'un fichier sobre où
  // seules les vraies priorités ressortent.
  averAttentionSurEmphase: "Une emphase (gras, « IMPORTANT ») répétée sur de nombreuses lignes dilue l'emphase elle-même — l'agent ne peut plus distinguer la vraie priorité du reste.",
  // Conséquence qualité, pas seulement coût — directement pertinente pour le garde-fou non
  // négociable de CLAUDE.md (« jamais entamer la qualité ») : un fichier trop long peut ACTIVEMENT
  // nuire à la qualité (règles réelles noyées et ignorées), pas seulement coûter cher en tokens —
  // donc l'alléger correctement PROTÈGE la qualité, il ne la menace pas par nature.
  consequenceQualite: "Un fichier d'instructions trop long fait que l'agent ignore une partie de son contenu — les vraies règles se noient dans le volume. Le garde-fou « jamais entamer la qualité » ne s'oppose donc pas à l'allègement en soi : un fichier correctement allégé sert MIEUX la qualité qu'un fichier bloated, à condition de ne retirer que ce que ce test qualifie réellement.",
};

// extractNormativeMarkers()/diffNormativeMarkers() (2026-09-20, demande explicite de l'utilisateur,
// juste avant la 4e passe d'allègement réelle de CLAUDE.md : « vigilance maximale pour ne pas
// entamer le sens des règles [...] fais intervenir un outil de check si besoin [...] vois avec le
// coordinateur des outils »). Consultation réelle de LE-COORDINATEUR faite avant d'écrire cette
// fonction (`suggestPrestationsForTask()`) : aucune prestation existante ne couvre ce besoin précis
// — la seule correspondance trouvée (THE-DEEP-READER, sur un chevauchement de mots-clés générique
// "vérifier"/"aucune") ne convient pas : son domaine réel est la conversation/le suivi, jamais un
// diff de prose d'un document. Un nouveau garde-fou MÉCANIQUE et gratuit est donc justifié (règle
// anti-duplication respectée : rien d'existant à réutiliser), plutôt qu'un outil agent coûteux
// (HYPER-SCAN-CHECKPOINT/THE-FINAL-JUDGE) disproportionné pour une vérification ligne à ligne.
//
// Principe : repérer, dans le texte AVANT une passe de resserrement, chaque phrase qui porte un
// contenu normatif (jamais/toujours/obligatoire/interdit/doit, un nombre ou seuil explicite, une
// référence d'Article ou un chemin de fichier) — puis vérifier qu'une phrase du texte APRÈS
// partage encore un vrai chevauchement de mots avec elle (jamais une simple présence du marqueur
// seul, qui laisserait passer un sens complètement changé). Jamais une preuve formelle d'équivalence
// totale (Article 19 : un vrai jugement humain reste nécessaire) — un filet mécanique qui attrape la
// régression la plus grave : une règle normative qui disparaît silencieusement pendant un
// resserrement de prose.
const NORMATIVE_MARKER_PATTERN = /\b(jamais|toujours|obligatoire|non[- ]négociable|interdit|doit|ne doit)\b/i;
const NUMERIC_MARKER_PATTERN = /\d+([.,]\d+)?\s?(%|tokens?|lignes?|ms|s|heures?|jours?|minutes?)\b/i;
const REFERENCE_MARKER_PATTERN = /\b(Article \d+|`[^`]+`)/;

function splitIntoSentences(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .flatMap((para) => para.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extractNormativeMarkers(text) {
  return splitIntoSentences(text).filter(
    (s) => NORMATIVE_MARKER_PATTERN.test(s) || NUMERIC_MARKER_PATTERN.test(s) || REFERENCE_MARKER_PATTERN.test(s),
  );
}

function significantWordsOf(sentence) {
  return new Set(
    sentence
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

// Une phrase "survit" si une phrase du nouveau texte partage au moins 60% de ses mots
// significatifs avec elle — jamais une égalité stricte (le but même du resserrement est de
// reformuler), jamais un seuil trop bas qui laisserait passer une vraie perte de sens.
export function diffNormativeMarkers(oldText, newText, { threshold = 0.6 } = {}) {
  const oldMarkers = extractNormativeMarkers(oldText);
  const newMarkers = extractNormativeMarkers(newText);
  const newWordSets = newMarkers.map((s) => significantWordsOf(s));
  const lost = [];
  for (const marker of oldMarkers) {
    const markerWords = significantWordsOf(marker);
    if (!markerWords.size) continue;
    const survives = newWordSets.some((wordSet) => {
      const overlap = [...markerWords].filter((w) => wordSet.has(w)).length;
      return overlap / markerWords.size >= threshold;
    });
    if (!survives) lost.push(marker);
  }
  return { oldCount: oldMarkers.length, newCount: newMarkers.length, lost };
}

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
//
// Tolère UN niveau de parenthèse imbriquée à l'intérieur de l'aside (2026-09-20, limite réelle
// trouvée en pratique : « *(Ajouté le 2026-09-19 [...] (16 au 19 septembre) [...])* » n'était pas
// détecté par la version précédente, qui s'arrêtait à la première parenthèse fermante rencontrée —
// deux cas réels manqués lors de la première passe d'allègement, documentés dans
// claude-md-asides-historique.md avant ce correctif). Ne tente PAS de gérer un niveau
// d'imbrication arbitraire (jamais rencontré en pratique dans ce fichier) — un cas plus profond
// resterait un angle mort honnête, jamais silencieusement mal découpé.
const DATED_ASIDE_PATTERN = /\*\((?:[^()]*\([^()]*\))*[^()]*\b20\d{2}-\d{2}-\d{2}\b(?:[^()]*\([^()]*\))*[^()]*\)\*/g;
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
// 2026-09-20). "documents" est un objet simple { nomFichier: texte } (jamais un Map — corrigé le
// 2026-09-20 : ce commentaire annonçait un Map alors que l'implémentation et son propre test
// utilisent `Object.entries()` depuis l'origine ; trouvaille réelle faite en auditant CLAUDE.md
// avec cet outil, cf. Article 6/13) — l'appelant choisit quels fichiers correspondent à la portée
// demandée (Global = tous les documents toujours chargés/fréquemment relus ; Partiel = plusieurs ;
// Zoomé = un seul ; Focus = un extrait précis d'un seul document). `alwaysLoadedSet` :
// Set<nomFichier> des documents réellement toujours chargés (dans ce projet, CLAUDE.md seul) —
// tout document absent du set est traité comme lu à la demande.
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

// Distinction investissement / consommation sans retour (2026-09-20, demande explicite de
// l'utilisateur : « il peut y avoir des "investissements" en token [...] il ne faut pas qu'il
// décourage un investissement sain, qu'il vienne de moi, toi ou les outils »). Ne prédit JAMAIS
// littéralement l'avenir (aucune boule de cristal) — applique des critères vérifiables AU MOMENT de
// la dépense. La "mesure précise de la pertinence" demandée est ce verdict catégorique + sa raison
// explicite, jamais un faux score numérique inventé sans base réelle pour le mesurer (même honnêteté
// que le reste de cet outil, cf. estimateTokens).
// - buildsReusableTool : la dépense construit un mécanisme qui tournera ENSUITE à coût nul pour le
//   contexte de l'agent (AUTOMATISATION MÉCANIQUE, cf. AUTOMATION_TOKEN_NUANCE ci-dessus) — chaque
//   réutilisation future rembourse le coût de construction, un investissement par construction même.
// - preventsFutureDebugging : une vérification/un test/un audit AVANT un changement risqué ou
//   complexe — moins cher que de découvrir et corriger le même problème plus tard, potentiellement
//   sur plusieurs sessions futures (rend mesurable le principe déjà derrière l'Article 5).
// - isDuplicateOfRecent : la même action (ou une équivalente) vient déjà d'être faite récemment —
//   ne peut JAMAIS être un investissement, quoi qu'elle prétende construire ou prévenir (principe
//   anti-doublon déjà établi ailleurs dans ce projet) — toujours classée sans retour, prioritaire
//   sur les deux signaux positifs ci-dessus.
// - scopeMatchesNeed : le palier d'intensité/portée choisi correspond à la taille réelle du besoin
//   exprimé (ex. un audit "très lourd" pour une question triviale) — un décalage rend la dépense
//   sans retour même si l'intention de départ était saine, car c'est le SURPLUS de coût qui ne
//   rapporte rien, pas l'action elle-même.
export function classifyConsumption(context = {}) {
  const { buildsReusableTool = false, preventsFutureDebugging = false, isDuplicateOfRecent = false, scopeMatchesNeed = true } = context;
  if (isDuplicateOfRecent) {
    return { classification: "sans_retour", raison: "Doublon d'une action déjà faite récemment — un investissement ne se paie jamais deux fois pour le même travail (principe anti-doublon)." };
  }
  if (!scopeMatchesNeed) {
    return { classification: "sans_retour", raison: "Le palier choisi dépasse la taille réelle du besoin exprimé — le surplus de coût ne rapporte rien, même quand l'intention de départ était saine." };
  }
  if (buildsReusableTool) {
    return { classification: "investissement", raison: "Construit un mécanisme qui tournera ensuite à coût nul (automatisation mécanique) — chaque réutilisation future rembourse ce coût de construction." };
  }
  if (preventsFutureDebugging) {
    return { classification: "investissement", raison: "Vérification/audit avant un changement risqué ou complexe — moins cher que de découvrir et corriger le même problème plus tard, potentiellement sur plusieurs sessions." };
  }
  return { classification: "a_evaluer", raison: "Aucun signal d'investissement reconnu (ni outil réutilisable construit, ni prévention de débogage futur) — à juger au cas par cas selon le besoin réel exprimé, jamais présumé superflu par défaut." };
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

// classifyRereadVolume() / recommendRereadBoundary() (2026-09-20, THE-DEEP-READER) : répondent à la
// demande explicite de l'utilisateur au déclenchement de THE-DEEP-READER — « quel est le repère
// temporel qui fixe la borne de relecture ? comment smart conso accompagne sur le sujet ? ». Jamais un
// repère de date/heure (risque de fuseau horaire explicitement signalé par l'utilisateur : « erreur de
// moi à ce moment là ») — toujours un NUMÉRO DE TÂCHE, strictement croissant et global, zéro ambiguïté
// possible. `countTasksSince()`/`lastCoveredTaskNumber()` (check-suivi-fidelity.mjs) donnent le compte
// réel de tâches enregistrées depuis une borne ; ces deux fonctions traduisent ce compte en un ordre de
// grandeur honnête (jamais un vrai chiffre de tokens, même discipline qu'estimateTokens()) pour aider
// l'agent à présenter des options réelles dans sa fenêtre de calibrage, plutôt que de deviner à l'aveugle.
export function classifyRereadVolume(taskCount) {
  if (!Number.isFinite(taskCount) || taskCount === 0) return { taskCount: 0, niveau: "nul", message: "Aucune tâche enregistrée depuis cette borne — probablement rien de neuf à relire." };
  if (taskCount <= 5) return { taskCount, niveau: "faible", message: `${taskCount} tâche(s) enregistrée(s) depuis cette borne — volume de conversation à relire probablement faible.` };
  if (taskCount <= 20) return { taskCount, niveau: "modéré", message: `${taskCount} tâche(s) enregistrée(s) depuis cette borne — volume modéré, un coût de lecture réel s'ajoute au plancher fixe de l'agent séparé.` };
  return { taskCount, niveau: "élevé", message: `${taskCount} tâche(s) enregistrée(s) depuis cette borne — volume élevé, coût de lecture réel significatif à anticiper en plus du plancher fixe.` };
}

// Combine le registre des passages déjà effectués (docs/suivi/relectures-lourdes/index.md) et le
// compte réel de tâches pour recommander une borne PAR DÉFAUT — jamais imposée, l'agent ou
// l'utilisateur peuvent toujours désigner une autre tâche précise ou choisir "depuis le début" dans la
// fenêtre de calibrage. `deepReaderIndexText` : le texte déjà lu du registre ; `sessionsDir`/`readDir`/
// `readFile`/`exists` : mêmes paramètres injectables que countTasksSince(), pour rester testable sans
// toucher au vrai disque.
export function recommendRereadBoundary(deepReaderIndexText, sessionsDir, readDir, readFile, exists) {
  const lastCovered = lastCoveredTaskNumber(deepReaderIndexText);
  if (lastCovered === undefined) {
    return { borne: "debut", raison: "Aucun passage THE-DEEP-READER encore enregistré — première relecture, forcément depuis le début (aucun ordre de grandeur mesurable pour l'instant)." };
  }
  const args = [lastCovered, sessionsDir, readDir, readFile, exists].filter((a) => a !== undefined);
  const taskCount = countTasksSince(...args);
  return {
    borne: lastCovered,
    ...classifyRereadVolume(taskCount),
    raison: `Dernier passage confirmé après la tâche #${lastCovered} — reprendre à partir de là évite de relire un territoire déjà vérifié.`,
  };
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
export function assess({ actionType, context, history, now, agentIdentity, investment }) {
  const pattern = KNOWN_COSTLY_PATTERNS[actionType];
  const freshness = checkKnowledgeFreshness(agentIdentity);
  const threshold = HARD_THRESHOLDS[actionType];
  const invest = investment ? classifyConsumption(investment) : undefined;
  const investNote = invest ? ` [Investissement : ${invest.classification === "investissement" ? "reconnu" : invest.classification === "sans_retour" ? "SANS RETOUR" : "à évaluer"} — ${invest.raison}]` : "";

  if (threshold) {
    const recentCount = countRecentActions(history, actionType, now, threshold.windowHours);
    if (recentCount >= threshold.count) {
      // Un seuil dur reste non négociable (Article 22) même face à un investissement reconnu — la
      // classification INFORME la question obligatoire à l'utilisateur, elle ne la remplace ni ne la
      // contourne jamais (même principe que Smart Conso API : informe, ne tranche jamais).
      return {
        verdict: "seuil_dur",
        message: `Seuil dur atteint : ${recentCount} action(s) "${actionType}" déjà confirmée(s) dans les ${threshold.windowHours} dernières heures (limite : ${threshold.count}). ${pattern ? pattern.raison : ""} Une fenêtre de question doit s'ouvrir avant de continuer.${investNote}`,
        freshness, investment: invest,
      };
    }
  }
  if (pattern && pattern.poids === "élevé") {
    // Un investissement reconnu ne doit jamais être découragé à tort (demande explicite de
    // l'utilisateur) : la dépense reste réelle et signalée, mais le verdict change de nature — une
    // recommandation de poursuite plutôt qu'un avertissement, dès lors qu'un vrai critère
    // d'investissement est rempli (jamais sur la seule prétention non vérifiée de l'appelant).
    if (invest?.classification === "investissement") {
      return {
        verdict: "investissement_reconnu",
        message: `Schéma connu coûteux ("${actionType}") mais reconnu comme un investissement sain : ${invest.raison} Poursuite recommandée malgré le coût réel — ne pas décourager à tort.`,
        freshness, investment: invest,
      };
    }
    return {
      verdict: "avertissement_souple",
      message: `Schéma connu coûteux ("${actionType}") : ${pattern.raison} Contexte donné : ${context || "non précisé"}. Négociable avec un besoin réel clair, mais à peser avant de foncer ("on ne chauffe pas une pièce en été").${investNote}`,
      freshness, investment: invest,
    };
  }
  if (pattern) {
    return { verdict: "ok", message: `Schéma reconnu ("${actionType}", poids ${pattern.poids}) : ${pattern.raison} Pas de seuil franchi.${investNote}`, freshness, investment: invest };
  }
  return { verdict: "ok", message: `Schéma "${actionType}" non répertorié dans le registre connu — rien à signaler de spécifique.${investNote}`, freshness, investment: invest };
}

// Enregistre le rythme/contexte/conditions de chaque action confirmée (demande explicite de
// l'utilisateur : « il enregistre les rythmes de conso de tokens, les contextes, les conditions, il
// s'améliore dans le temps »). N'ajuste JAMAIS ses propres seuils tout seul à partir de cet
// historique (jamais un apprentissage automatique silencieux) — sert uniquement de matière pour une
// vraie relecture humaine/agent périodique, même principe que `describeKnownLessons()` du Smart
// Breaker.
// `options.recipient` (2026-09-20, demande explicite : « il consigne en historique chaque fois
// qu'il produit un conseil/autorité sur un membre de l'équipe [...] enregistre la réponse effective
// de l'interlocuteur ») — qui a reçu ce conseil : "agent" (par défaut, l'agent lui-même avant sa
// propre action coûteuse), "outil" (une consultation faite pour le compte d'un outil du paysage),
// ou "utilisateur" (l'agent signale une demande lourde de l'utilisateur). `options.verdict` : le
// verdict rendu par assess() pour CETTE action précise, conservé pour pouvoir plus tard vérifier si
// l'interlocuteur s'y est conformé (cf. diagnoseAdviceAccuracy ci-dessous).
export function recordAction(actionType, context, now, options = {}) {
  const { classification, recipient = "agent", verdict } = options;
  const history = loadJson(HISTORY_PATH, { actions: [] });
  history.actions = (history.actions ?? []).slice(-300);
  history.actions.push({ type: actionType, context: context || null, at: now, recipient, ...(classification ? { classification } : {}), ...(verdict ? { verdict } : {}) });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
  return history;
}

// Enregistre le résultat RÉELLEMENT observé d'une action déjà confirmée (2026-09-20, demande
// explicite : « il enregistre les résultats et le contexte »). Jamais deviné ni inféré tout seul —
// une donnée honnête n'existe que si quelqu'un (l'agent, un outil) la fournit explicitement une fois
// le résultat réellement connu. `outcome` : "sans_consequence" (rien de notable ne s'est produit),
// "probleme_reel" (un vrai problème est survenu malgré/à cause de cette action), ou
// "confirme_utile" (l'action a eu l'effet positif attendu). Retrouve l'action par son couple exact
// (type, horodatage) — jamais une correspondance approximative qui risquerait d'attacher un résultat
// à la mauvaise action.
export function recordOutcome(actionType, at, outcome, now = Date.now()) {
  const history = loadJson(HISTORY_PATH, { actions: [] });
  const match = (history.actions ?? []).find((a) => a.type === actionType && a.at === at);
  if (match) match.outcome = outcome;
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
  return { history, found: Boolean(match), recordedAt: now };
}

// Auto-diagnostic (2026-09-20, demande explicite : « il se rend compte s'il a fait des erreurs
// d'appréciation ou de conseils [...] mécanisme d'apprentissage »). VERSION SÉCURISÉE, calibrée
// explicitement avec l'utilisateur après avoir signalé une tension réelle avec une règle déjà
// établie plusieurs fois (jamais d'ajustement automatique de ses propres seuils, cf. blueprint et
// la section "Base de données exploitée de façon autonome" ci-dessus, Article 14) : ce diagnostic
// REPÈRE des erreurs d'appréciation probables dans l'historique déjà accumulé, mais ne change
// JAMAIS lui-même aucun seuil, aucun classement ni aucune logique — chaque constat reste une
// PROPOSITION à lire et à valider humainement/par l'agent, exactement le même principe que
// trackWeightTrend()/scanConsumptionPatterns() (Smart Conso API). Portée volontairement limitée à
// l'AGENT et aux OUTILS (jamais l'utilisateur, calibrage explicite du 2026-09-20) : aucune trace
// mécanique fiable n'existe de ce que l'utilisateur décide de son côté — honnêteté plutôt qu'une
// fausse précision.
export function diagnoseAdviceAccuracy(history, now, { hardThresholdReactionWindowMs = 10 * 60 * 1000 } = {}) {
  const actions = (history?.actions ?? []).filter((a) => (a.recipient ?? "agent") !== "utilisateur").sort((a, b) => a.at - b.at);
  const findings = [];

  // 1) Seuil dur potentiellement non respecté : une action confirmée du même type survient très
  // vite après un verdict "seuil_dur" — trop rapide pour une vraie pause/question obligatoire.
  // Entièrement mécanique, aucune saisie manuelle nécessaire.
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].verdict !== "seuil_dur") continue;
    const next = actions.slice(i + 1).find((a) => a.type === actions[i].type);
    if (next && next.at - actions[i].at < hardThresholdReactionWindowMs) {
      findings.push({
        constat: `Un verdict "seuil_dur" pour "${actions[i].type}" (${new Date(actions[i].at).toISOString()}) a été suivi d'une nouvelle action confirmée du même type ${Math.round((next.at - actions[i].at) / 1000)}s plus tard — trop rapide pour une vraie pause/question.`,
        piste: "Vérifier si la fenêtre de question obligatoire (Article 22) a réellement eu lieu à ce moment ; sinon, renforcer le rappel au moment même du seuil dur.",
      });
    }
  }

  // 2) Verdict contredit par un résultat réellement observé et enregistré (recordOutcome) — jamais
  // inféré, seulement lu si quelqu'un l'a explicitement fourni.
  for (const a of actions) {
    if (!a.outcome) continue;
    if (a.verdict === "avertissement_souple" && a.outcome === "probleme_reel") {
      findings.push({
        constat: `Un avertissement souple pour "${a.type}" (${new Date(a.at).toISOString()}) a malgré tout été suivi d'un vrai problème signalé.`,
        piste: "Le poids \"élevé\" attribué à ce schéma semble justifié par ce cas précis, pas exagéré — aucune raison de l'assouplir.",
      });
    } else if (a.verdict === "avertissement_souple" && a.outcome === "sans_consequence") {
      findings.push({
        constat: `Un avertissement souple pour "${a.type}" (${new Date(a.at).toISOString()}) n'a entraîné aucune conséquence négative signalée.`,
        piste: "Un cas isolé ne prouve rien seul — à recroiser avec d'autres occurrences avant d'envisager un déclassement, jamais un ajustement automatique.",
      });
    } else if (a.verdict === "investissement_reconnu" && a.outcome === "probleme_reel") {
      findings.push({
        constat: `Un investissement reconnu pour "${a.type}" (${new Date(a.at).toISOString()}) s'est révélé, avec le recul, ne pas avoir été rentable.`,
        piste: "Relire le contexte donné à classifyConsumption() à ce moment précis : un des quatre critères a peut-être été mal évalué par l'appelant — jamais une raison de retirer le critère lui-même.",
      });
    }
  }

  return findings;
}

// Bilan investissement/sans-retour sur une fenêtre glissante (2026-09-20, demande explicite : « une
// mesure precise de la pertinence du besoin de conso de tokens [...] faire de notre suivi-conso-token
// un vrai heros des economies »). Alimenté uniquement par les actions confirmées avec une
// classification réelle (recordAction(..., classification)) — jamais une estimation rétroactive sur
// des actions passées qui n'en portaient pas encore. Rapporte un fait mesuré, jamais un jugement
// moral : un fort taux de "sans_retour" est un signal à regarder, pas une faute automatiquement
// reprochée (même honnêteté que le reste de cet outil).
export function computeInvestmentRatio(history, now, windowDays = 7) {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recent = (history?.actions ?? []).filter((a) => a.classification && now - a.at <= windowMs && now - a.at >= 0);
  if (!recent.length) {
    return { total: 0, investissement: 0, sansRetour: 0, aEvaluer: 0, message: "Aucune action classifiée récemment — rien à mesurer pour l'instant." };
  }
  const investissement = recent.filter((a) => a.classification === "investissement").length;
  const sansRetour = recent.filter((a) => a.classification === "sans_retour").length;
  const aEvaluer = recent.filter((a) => a.classification === "a_evaluer").length;
  return {
    total: recent.length, investissement, sansRetour, aEvaluer,
    pctInvestissement: Math.round((investissement / recent.length) * 1000) / 10,
    message: `${investissement}/${recent.length} action(s) coûteuse(s) classifiée(s) comme investissement réel sur ${windowDays} jours (${sansRetour} sans retour, ${aEvaluer} à évaluer).`,
  };
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
// `trend` (optionnel, sortie de trackWeightTrend()) : exploite l'historique déjà accumulé pour dire
// si la situation s'améliore ou se dégrade réellement d'un scan à l'autre — jamais recalculé à la
// main, jamais un ajustement silencieux des seuils, seulement un fait rapporté.
export function formatScanReport(scopeResult, now, trend) {
  const lines = [
    `SMART-CONSO-TOKEN — scan réel — ${new Date(now).toISOString()}`,
    "",
    `Portée : ${scopeResult.portee}`,
    `Documents analysés : ${scopeResult.documentsAnalyses}`,
    `Total estimé : ~${scopeResult.totalTokens} tokens`,
    ...(trend ? [`Tendance : ${trend.message}`] : []),
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

// Test de connexion (2026-09-20, demande explicite de l'utilisateur : « smart conso token a un
// test de connexion dédié à tous les autres outils, ainsi qu'à toi »). Vérifie MÉCANIQUEMENT que
// chaque document censé le citer le fait RÉELLEMENT — jamais une simple affirmation dans une
// conversation, un vrai grep contre le vrai fichier. "CLAUDE.md" représente la connexion à l'agent
// lui-même (ses propres instructions de travail) ; les autres, la connexion à chaque outil coûteux
// censé le consulter avant de se déclencher. Même principe que findToolsMissingFromMenu()
// (LE-COORDINATEUR) : signale une absence réelle, jamais une invention.
export const EXPECTED_CONNECTIONS = {
  "CLAUDE.md": "agent",
  "docs/referentiel/the-final-judge.md": "outil",
  "docs/referentiel/hyper-scan-checkpoint.md": "outil",
  "docs/referentiel/always-new-code.md": "outil",
  "docs/referentiel/the-deep-reader.md": "outil",
};

export function checkToolConnections(documents) {
  const missing = [];
  for (const path of Object.keys(EXPECTED_CONNECTIONS)) {
    const texte = documents[path];
    if (!texte || !/smart-conso-token/i.test(texte)) missing.push(path);
  }
  return missing;
}

// Exploite l'historique local accumulé de façon autonome pour NOURRIR LA QUALITÉ du prochain
// diagnostic (2026-09-20, demande explicite de l'utilisateur : « il enrichit une base de données
// qu'il exploite de façon autonome pour nourrir la qualité de ses conseils »). Jamais un
// apprentissage qui modifie ses propres seuils tout seul (cf. blueprint, "jamais un ajustement
// silencieux") : compare le total de tokens du scan le plus récent PRÉCÉDENT à celui d'aujourd'hui,
// pour que le rapport dise si un chantier de réduction a réellement porté ses fruits, ou si la
// situation a empiré — un fait observé, jamais une décision prise à la place de l'utilisateur.
export function trackWeightTrend(history, currentTotal, now) {
  const pastScans = (history?.actions ?? []).filter((a) => a.type === "scan" && typeof a.totalTokens === "number" && a.at < now).sort((a, b) => b.at - a.at);
  if (!pastScans.length) return { direction: "premier_scan", message: "Premier scan enregistré — rien à comparer pour l'instant." };
  const previousTotal = pastScans[0].totalTokens;
  const delta = currentTotal - previousTotal;
  if (delta === 0) return { direction: "stable", previousTotal, currentTotal, delta, message: `Stable depuis le dernier scan (${new Date(pastScans[0].at).toISOString().slice(0, 10)}) : ~${currentTotal} tokens.` };
  const direction = delta < 0 ? "amelioration" : "degradation";
  return {
    direction, previousTotal, currentTotal, delta,
    message: delta < 0
      ? `Amélioration réelle depuis le dernier scan (${new Date(pastScans[0].at).toISOString().slice(0, 10)}) : ~${Math.abs(delta)} tokens en moins (${previousTotal} → ${currentTotal}).`
      : `Dégradation depuis le dernier scan (${new Date(pastScans[0].at).toISOString().slice(0, 10)}) : ~${delta} tokens en plus (${previousTotal} → ${currentTotal}) — à surveiller.`,
  };
}

// Extrait les 3 arguments réels de la sous-commande "outcome" depuis un vrai process.argv (2026-09-20,
// corrige un bug trouvé au tout premier usage réel en ligne de commande : l'ancien découpage sautait
// un élément de trop et lisait silencieusement le mauvais triplet — jamais détecté avant, car
// recordOutcome() lui-même n'était testé que par appel direct de fonction, jamais via le vrai CLI).
// argv = [node, script, "outcome", type, atArg, outcome] — les 3 premiers éléments sont toujours à ignorer.
export function parseOutcomeArgs(argv) {
  const [, , , type, atArg, outcome] = argv;
  return { type, atArg, outcome };
}

function main() {
  const actionType = process.argv[2];

  // Sous-commande dédiée à l'enregistrement d'un résultat réellement observé (2026-09-20) — jamais
  // mélangée avec le flux normal d'avis, pour ne jamais confondre "je consulte avant d'agir" et
  // "je rapporte après coup ce qui s'est réellement passé".
  if (actionType === "outcome") {
    const { type, atArg, outcome } = parseOutcomeArgs(process.argv);
    if (!type || !atArg || !outcome) {
      console.log('Usage: node scripts/smart-conso-token.mjs outcome <type-d\'action> <horodatage-ms> <sans_consequence|probleme_reel|confirme_utile>');
      process.exit(1);
    }
    const result = recordOutcome(type, Number(atArg), outcome);
    console.log(result.found ? "Résultat enregistré." : "⚠️ Aucune action correspondante trouvée à cet horodatage — rien n'a été modifié.");
    return;
  }

  const identityArg = process.argv.find((a) => a.startsWith("--identity="));
  const contextArg = process.argv.find((a) => a.startsWith("--context="));
  const recipientArg = process.argv.find((a) => a.startsWith("--recipient="));
  const agentIdentity = identityArg ? identityArg.slice("--identity=".length) : undefined;
  const context = contextArg ? contextArg.slice("--context=".length) : undefined;
  const recipient = recipientArg ? recipientArg.slice("--recipient=".length) : "agent";
  const now = Date.now();
  const history = loadJson(HISTORY_PATH, { actions: [] });

  if (!actionType) {
    console.log("Usage: node scripts/smart-conso-token.mjs <type-d'action> [--confirm] [--identity=claude-sonnet-5] [--context=\"...\"] [--recipient=agent|outil|utilisateur] [--builds-tool] [--prevents-debugging] [--duplicate] [--scope-mismatch]");
    console.log("Types connus :", Object.keys(KNOWN_COSTLY_PATTERNS).join(", "));
    console.log("Autre usage : node scripts/smart-conso-token.mjs outcome <type> <horodatage-ms> <résultat>");
    process.exit(1);
  }

  // Flags investissement (2026-09-20) : déclarés explicitement par l'appelant, jamais devinés —
  // classifyConsumption() reste honnête sur ses propres critères, jamais une lecture automatique de
  // l'intention réelle de l'appelant (qui resterait invérifiable ici).
  const hasInvestmentFlag = ["--builds-tool", "--prevents-debugging", "--duplicate", "--scope-mismatch"].some((f) => process.argv.includes(f));
  const investment = hasInvestmentFlag ? {
    buildsReusableTool: process.argv.includes("--builds-tool"),
    preventsFutureDebugging: process.argv.includes("--prevents-debugging"),
    isDuplicateOfRecent: process.argv.includes("--duplicate"),
    scopeMatchesNeed: !process.argv.includes("--scope-mismatch"),
  } : undefined;

  const advice = assess({ actionType, context, history, now, agentIdentity, investment });
  console.log("=== SMART-CONSO-TOKEN — avis avant action coûteuse en tokens ===\n");
  console.log(`Action envisagée : ${actionType} (destinataire : ${recipient})`);
  if (context) console.log(`Contexte : ${context}`);
  console.log(`Avis : [${advice.verdict}] ${advice.message}`);
  if (advice.freshness?.fraiche === false) console.log(`\n⚠️ FRAÎCHEUR DE CONNAISSANCE : ${advice.freshness.message}`);
  else if (advice.freshness) console.log(`(${advice.freshness.message})`);

  if (process.argv.includes("--confirm")) {
    recordAction(actionType, context, now, { classification: advice.investment?.classification, recipient, verdict: advice.verdict });
    console.log(`\nAction confirmée et enregistrée dans l'historique local (horodatage ${now}, à réutiliser pour "outcome" une fois le résultat connu).`);
  } else {
    console.log("\n(Avis seul — relancer avec --confirm une fois la décision prise.)");
  }

  const summary = summarizeHistory(history, now);
  console.log(`\nRythme observé (${summary.windowDays} derniers jours) : ${summary.totalRecent} action(s) au total — ${JSON.stringify(summary.byType)}`);
  const ratio = computeInvestmentRatio(history, now);
  console.log(`Bilan investissement (${7} derniers jours) : ${ratio.message}`);
  const findings = diagnoseAdviceAccuracy(history, now);
  console.log(`Auto-diagnostic (agent + outils) : ${findings.length ? findings.length + " constat(s) — voir le rapport détaillé si besoin" : "aucun constat pour l'instant"}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
