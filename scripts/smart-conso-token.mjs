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
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice, qualifierIndicateur, decouperEnUnites, pairesParJaccard } from "./lib-shell.mjs";
import { printReportHeader } from "./report-template.mjs";
import { loadJson } from "./lib-json.mjs";
import { buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";

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
  tool_learning_assist: {
    poids: "faible à modéré — mais son TEST peut être très élevé",
    raison: "Aider un outil de l'Agence à apprendre (le relire, corriger son critère, lui faire relire sa mémoire) coûte l'équivalent de son script : médiane mesurée le 2026-09-22 sur les 64 scripts réels = ~3 300 tokens, quartile haut ~5 900 — soit environ un dixième d'un agent séparé (~37 000). Ce n'est donc PAS le geste coûteux qu'on suppose, et le supposer coûteux est exactement ce qui empêche de le faire. Le vrai coût est ailleurs et il est massif : le TEST qui accompagne le correctif vit dans check-house.mjs, mesuré à ~273 000 tokens — 44 % du poids de tout scripts/ à lui seul. Lu en entier, il coûte sept agents séparés pour une assertion de trois lignes. D'où la règle qui suit, non négociable : on ne lit JAMAIS check-house.mjs en entier pour ajouter un test, on passe par tool-brain --file (qui délègue à find-booster) pour n'ouvrir que le bloc concerné.",
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

// CHARTER-SPY A DÉMÉNAGÉ (2026-09-23, tâche #613, décision explicite de l'utilisateur en fenêtre
// de calibrage : « migrer ces sept fonctions dans Moïse »).
//
// Les sept fonctions propres à CLAUDE.md — extractRuleUnits, countArticleCrossReferences,
// classifyRuleSensitivity, classifyRuleImportance, findRedundantRulePairs, buildClaudeMdRuleTable,
// renderClaudeMdRuleTable — vivent désormais dans `scripts/moise-tables-de-loi.mjs`, l'agent dédié au
// seul périmètre CLAUDE.md. Elles ont été DÉPLACÉES telles quelles, commentaires de calibrage
// compris : un déplacement ne pouvait rien casser au passage, là où une réécriture l'aurait pu.
//
// POURQUOI ELLES SONT PARTIES. Elles ne servaient qu'à un document, alors que ce fichier-ci
// gouverne une question générique : combien coûte une action, quel qu'en soit le sujet. Les garder
// ici faisait de SMART-CONSO-TOKEN le co-responsable d'un périmètre dont il n'a pas la charge —
// exactement le chevauchement que l'utilisateur a demandé de supprimer.
//
// CE QUI RESTE ICI, ET C'EST VOULU : `scanDocumentWeight()`, `listDatedNarrativeMarkers()` et
// `estimateTokens()` ci-dessus valent pour N'IMPORTE QUEL document toujours chargé. moise-tables-de-loi
// les APPELLE plutôt que de les recopier.

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
// Branchement avec ecotoken (2026-09-22, tâche #359) : ce scan MESURE le poids et
// s'arrête là ; ecotoken RÉDUIT (plan chiffré + texte de remplacement + budget
// anti-regrossissement). Le lien se fait par le TEXTE de actionPossible, jamais par un import :
// ecotoken importe déjà ce fichier, l'importer en retour créerait un cycle. Frontière nette —
// SMART-CONSO-TOKEN dit combien ça coûte, ecotoken dit quoi faire pour que ça coûte
// moins, et aucun des deux ne recalcule ce que l'autre sait déjà.
// L'EXPÉRIENCE D'ECOTOKEN, LUE SANS L'IMPORTER (2026-09-22, question directe de l'utilisateur :
// « est-ce que ecotoken partage son experience avec smart eco token ? »).
//
// RÉPONSE HONNÊTE À CETTE QUESTION, AVANT CE CORRECTIF : le partage existait, mais à SENS UNIQUE.
// ecotoken importe bien 5 fonctions d'ici ; l'inverse est refusé par conception (cycle d'import),
// et le lien retour se faisait par une simple phrase nommant ecotoken. Ce qui manquait n'était donc
// pas le code — c'était l'EXPÉRIENCE : le registre d'ecotoken (`docs/ecotoken/index.md`) accumule
// ce qui a réellement été proposé, et surtout ce que l'utilisateur a REFUSÉ, et rien ici ne le
// lisait. Or lire un fichier n'est pas importer un module : aucun cycle, aucune frontière franchie.
// C'est exactement la règle de travail §3ter (« toute expérience vécue doit alimenter un outil »).
//
// La frontière reste intacte : SMART-CONSO-TOKEN dit combien ça coûte et ce qui a déjà été tenté,
// ecotoken dit quoi faire — celui-ci ne propose toujours aucun plan de réduction lui-même.
export function ecotokenExperience(indexText) {
  const lignes = String(indexText ?? "").split("\n").filter((l) => l.trim().startsWith("|") && !/^\|\s*-+/.test(l.trim()));
  const passages = lignes.slice(1).map((l) => l.split("|").slice(1, -1).map((c) => c.trim())).filter((c) => c.length >= 5 && /^\d{4}-\d{2}-\d{2}/.test(c[0]));
  if (!passages.length) return { passages: 0, refuses: [], aTrancher: 0, dernierPoids: undefined };
  // Une cible REFUSÉE ne doit jamais être reproposée en tête ; une cible « à trancher » est en
  // attente, jamais un refus — la nuance compte, et c'est la seule colonne écrite à la main.
  const refuses = [...new Set(passages.filter((c) => /refus|non|rejet/i.test(c[3])).map((c) => c[4]))];
  const aTrancher = passages.filter((c) => /à trancher|a trancher/i.test(c[3])).length;
  const dernierPoids = Number(passages[passages.length - 1][1]) || undefined;
  return { passages: passages.length, refuses, aTrancher, dernierPoids };
}

// La phrase à glisser dans un avis, quand cette expérience dit quelque chose d'utile. `null` quand
// elle ne dit rien : jamais une ligne creuse ajoutée pour faire savant.
export function ecotokenExperienceNote(experience) {
  if (!experience?.passages) return null;
  const bouts = [`ecotoken a déjà fait ${experience.passages} passage(s) sur ce document`];
  if (experience.dernierPoids) bouts.push(`dernier poids relevé ${experience.dernierPoids} tokens`);
  if (experience.refuses.length) bouts.push(`${experience.refuses.length} cible(s) déjà REFUSÉE(S) par l'utilisateur, à ne jamais reproposer en tête : ${experience.refuses.join(" ; ")}`);
  if (experience.aTrancher) bouts.push(`${experience.aTrancher} proposition(s) encore en attente de décision — relancer un plan avant de trancher celles-là ne servirait à rien`);
  return `Expérience d'ecotoken (lue dans son registre, jamais recalculée) : ${bouts.join(" ; ")}.`;
}

export function scanDocumentWeight(text, filename = "document", { alwaysLoaded = false, ecotokenIndexText = null } = {}) {
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
      ? `Document TOUJOURS CHARGÉ (coût payé à chaque message) : ${markers.occurrences} aside(s) narrative(s) datée(s) repérée(s) mécaniquement (~${markers.tokens} tokens, candidates sûres car déjà explicitement historiques). Pour un PLAN DE RÉDUCTION chiffré et le texte de remplacement prêt à relire : \`node scripts/ecotoken.mjs plan\` (ecotoken). Le tri final reste manuel (Article 19, jamais automatique).`
      : `Document TOUJOURS CHARGÉ (coût payé à chaque message), au-delà du repère, mais aucune aside narrative datée détectée mécaniquement. Le filon mécanique de CE scan est épuisé — ecotoken (\`node scripts/ecotoken.mjs\`) prend le relais avec ses autres stratégies (catalogue, extraction, doublons), jamais ce scan-ci.`;
    // L'expérience d'ecotoken s'ajoute à l'avis quand elle est fournie — jamais recalculée ici, et
    // jamais fabriquée quand le registre est absent (un appelant qui ne la fournit pas obtient
    // exactement l'avis d'avant, mot pour mot).
    const note = ecotokenExperienceNote(ecotokenExperience(ecotokenIndexText));
    if (note) actionPossible += ` ${note}`;
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

// compareChantiers() — tâche #135 (2026-09-20, demande explicite pendant la conception de
// CASSANDRA-RH : « SMART-CONSO-TOKEN doit aussi pouvoir arbitrer entre plusieurs chantiers
// concurrents [...] une fonction qui compare le poids estimé de plusieurs candidats côte à côte, en
// pur mode "informe, jamais ne décide" »). Chaque candidat porte déjà son propre coût estimé
// (calculé ailleurs — estimateTokens()/measureClaudeMdWeight()/un chiffre déjà connu, jamais un
// second calcul ici) et ses propres signaux déjà connus (staleness CLEAN-DIRTY-OLD, priorité
// explicite du suivi, etc., fournis tels quels par l'appelant) — cette fonction ne fait qu'AGRÉGER
// et PRÉSENTER côte à côte, jamais choisir un ordre de traitement à la place de l'utilisateur ou de
// l'agent (même discipline que classifyConsumption()/assess() ci-dessus : informe, ne tranche
// jamais). `candidates`: Array<{ nom: string, tokensEstimes: number, signaux?: string[] }>.
export function compareChantiers(candidates) {
  if (!candidates || !candidates.length) {
    return { comparaison: [], total: 0, message: "Aucun chantier candidat fourni — rien à comparer." };
  }
  const comparaison = candidates.map((c) => ({
    nom: c.nom,
    tokensEstimes: Number.isFinite(c.tokensEstimes) ? c.tokensEstimes : undefined,
    signaux: c.signaux ?? [],
  }));
  const total = comparaison.reduce((sum, c) => sum + (c.tokensEstimes ?? 0), 0);
  return {
    comparaison,
    total,
    message: `${comparaison.length} chantier(s) comparé(s) côte à côte (~${total} tokens estimés au total) — informe seulement, ne décide jamais lequel traiter en premier : le choix reste toujours à l'utilisateur ou à l'agent qui pilote.`,
  };
}

// Rendu texte, même convention que formatScanReport()/renderClaudeMdRuleTable() ci-dessus : une
// table markdown, jamais une écriture disque ici.
export function formatChantierComparison(result) {
  if (!result.comparaison.length) return result.message;
  const lines = [
    "| Chantier | Tokens estimés | Signaux |",
    "|---|---|---|",
    ...result.comparaison.map((c) => `| ${c.nom} | ${c.tokensEstimes !== undefined ? `~${c.tokensEstimes}` : "—"} | ${c.signaux.length ? c.signaux.join(", ") : "—"} |`),
    "",
    result.message,
  ];
  return lines.join("\n");
}

// loadJson : copie privée retirée le 2026-09-23 (tâche #216), remplacée par l'import partagé
// en tête de fichier. Le `existsSync` qu'elle faisait en plus ne changeait rien : le try/catch
// attrape déjà le fichier absent.

// ————————————————————————————————————————————————————————————————————————
// L'ALERTE « RÉDIGE TON PROMPT À PART » (2026-09-23, chantier 8)
// ————————————————————————————————————————————————————————————————————————
//
// CONSEIL DONNÉ PAR L'UTILISATEUR LUI-MÊME, dans le prompt de nuit, et rangé ici parce que c'est
// une question de COÛT EN TOKENS de l'agent — le domaine exact de cet outil.
//
// POURQUOI UNE RAFALE DE MESSAGES COURTS COÛTE CHER, et ce n'est pas intuitif : chaque message,
// même de trois mots, relance un tour complet. Tout le contexte est rechargé — la charte, les
// documents ouverts, l'historique — pour traiter « ok continue ». Dix précisions envoyées une par
// une coûtent donc dix rechargements ; la même demande rédigée d'un bloc n'en coûte qu'un.
//
// CE QUE L'ALERTE DIT, ET CE QU'ELLE NE DIT PAS. Elle ne reproche jamais à l'utilisateur d'écrire
// comme il écrit : découper sa pensée en messages courts est une façon parfaitement légitime de
// réfléchir à voix haute, et c'est souvent comme ça qu'une bonne idée se précise. Elle signale
// seulement le MOMENT où ça devient cher, et propose l'alternative concrète : rédiger dans un
// document à part, puis coller d'un coup.
//
// SA LIMITE, DÉCLARÉE : aucun mécanisme ne peut lire les messages. C'est l'AGENT qui enregistre la
// longueur de chaque tour, donc la mesure dépend de sa discipline — exactement la même limite
// honnête que tool-brain et que SMART-CONSO-TOKEN lui-même. L'écrire est la seule protection
// possible (Article 27).
export const TOURS_PATH = ".conso-tours.json";

// ROOT — AJOUTÉ LE 2026-09-23, ET IL MANQUAIT DEPUIS LE DÉBUT. `loadTours()` et `enregistrerTour()`
// déclarent `root = ROOT` en valeur par défaut, et cette constante n'existait nulle part dans ce
// fichier : tout appel sans `root` explicite levait une ReferenceError. Comme les seuls appels
// existants venaient des tests, qui injectent toujours leur propre racine, personne ne l'a jamais
// vu — le mécanisme d'alerte sur les rafales de messages courts n'aurait donc JAMAIS pu tourner en
// vrai. Trouvé en le branchant pour de bon, jamais en le relisant : c'est exactement la leçon L15.
const ROOT = new URL("..", import.meta.url).pathname;

// SEUILS, calibrés sur ce qui s'est réellement passé plutôt que sur une intuition : la série qui a
// motivé ce conseil comptait une dizaine de messages de quelques mots à la suite. En dessous de 4,
// on est dans l'échange normal ; à 4 messages courts consécutifs, le motif est net.
export const SEUILS_RAFALE = {
  court: 240,        // caractères — en dessous, un message est une précision, pas une demande
  consecutifs: 4,    // le nombre de messages courts d'affilée qui fait basculer
  fenetreMinutes: 20, // au-delà, ce ne sont plus des messages « à la suite » mais deux sessions
};

export function loadTours({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try { return JSON.parse(readFileImpl(join(root, TOURS_PATH), "utf8")); } catch { return []; }
}

export function enregistrerTour(longueur, { root = ROOT, readFileImpl = readFileSync, writeFileImpl = writeFileSync, date = new Date().toISOString(), max = 60 } = {}) {
  const tours = [...loadTours({ root, readFileImpl }), { date, longueur: Number(longueur) || 0 }].slice(-max);
  writeFileImpl(join(root, TOURS_PATH), JSON.stringify(tours, null, 2), "utf8");
  return tours;
}

// detecterRafale() — compte les messages courts CONSÉCUTIFS les plus récents, et s'arrête au
// premier message long : un message substantiel clôt la rafale, puisque c'est précisément ce qu'on
// voulait obtenir. La fenêtre de temps évite de coller ensemble deux séries séparées par une nuit.
export function detecterRafale(tours = [], { seuils = SEUILS_RAFALE, maintenant = Date.now() } = {}) {
  if (!tours.length) return { mesurable: false, raison: "aucun tour enregistré — c'est une absence de mesure, jamais « pas de rafale »" };
  let consecutifs = 0;
  let caracteres = 0;
  for (let i = tours.length - 1; i >= 0; i--) {
    const t = tours[i];
    const ageMinutes = (maintenant - Date.parse(t.date)) / 60000;
    if (!Number.isFinite(ageMinutes) || ageMinutes > seuils.fenetreMinutes) break;
    if (t.longueur > seuils.court) break;
    consecutifs += 1;
    caracteres += t.longueur;
  }
  return { mesurable: true, consecutifs, caracteres, seuil: seuils.consecutifs, alerte: consecutifs >= seuils.consecutifs };
}

export function formatAlerteRafale(rafale) {
  if (!rafale?.mesurable) return `Rafale de messages courts : ${rafale?.raison ?? "pas mesurée"}.`;
  if (!rafale.alerte) return `Rafale de messages courts : ${rafale.consecutifs}/${rafale.seuil} — rien à signaler.`;
  return [
    `💬 ${rafale.consecutifs} messages courts d'affilée (${rafale.caracteres} caractères en tout).`,
    "Ce n'est pas un reproche : découper sa pensée est une façon normale de réfléchir. C'est juste le",
    "moment où ça devient cher — chaque message, même de trois mots, relance un tour complet et",
    "recharge tout le contexte. Les mêmes précisions rédigées d'un bloc coûteraient un tour au lieu de",
    `${rafale.consecutifs}.`,
    "Proposition : garder un document à part (un simple bloc-notes), y écrire la demande tranquillement,",
    "puis la coller d'un coup. Rien ne se perd, et on repart avec un contexte entier plutôt qu'émietté.",
  ].join("\n");
}

export function countRecentActions(history, actionType, now, windowHours) {
  const windowMs = windowHours * 60 * 60 * 1000;
  return (history?.actions ?? []).filter((a) => a.type === actionType && now - a.at <= windowMs && now - a.at >= 0).length;
}

// Seuil dur initial (2026-09-20, PROPOSÉ, pas encore validé explicitement par l'utilisateur — même
// statut d'honnêteté que le seuil de Smart Conso API à sa création) : un nombre d'agents séparés
// lancés dans une fenêtre de 2h, le schéma le plus coûteux du registre ci-dessus.
export const HARD_THRESHOLDS = { agent_subagent_spawn: { count: 3, windowHours: 2 } };

// Rappel proactif "vérifier les archives d'abord" — tâche #136 (rendre SMART-CONSO-TOKEN proactif
// plutôt que purement réactif), généralisation actée le 2026-09-21 d'une précision réelle trouvée
// pendant le chantier 3 : l'agent avait alors répondu à une question purement par calcul/lecture des
// simulations déjà archivées, sans jamais en lancer une nouvelle — l'utilisateur a demandé
// explicitement que ce réflexe devienne systématique plutôt que découvert au cas par cas. Jamais une
// détection automatique (aucun moyen mécanique de savoir si une archive répond VRAIMENT à une
// question donnée) — un rappel systématique, appended à tout avis non anodin, jamais une case qu'on
// oublierait de relire.
export const ARCHIVE_FIRST_REMINDER = "Avant de foncer : les données déjà archivées (docs/simulations/, docs/el-professor/, docs/referentiel/kpi-rapports/, les registres ARGUS/HARMONIA/AXA-CHECK/CLEAN-DIRTY-OLD...) répondent-elles déjà à la question, sans avoir besoin de relancer quoi que ce soit de coûteux ?";

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
        message: `Seuil dur atteint : ${recentCount} action(s) "${actionType}" déjà confirmée(s) dans les ${threshold.windowHours} dernières heures (limite : ${threshold.count}). ${pattern ? pattern.raison : ""} Une fenêtre de question doit s'ouvrir avant de continuer.${investNote} 💡 ${ARCHIVE_FIRST_REMINDER}`,
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
      message: `Schéma connu coûteux ("${actionType}") : ${pattern.raison} Contexte donné : ${context || "non précisé"}. Négociable avec un besoin réel clair, mais à peser avant de foncer ("on ne chauffe pas une pièce en été").${investNote} 💡 ${ARCHIVE_FIRST_REMINDER}`,
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
// `options.tokensEstimes` (2026-09-21, tâche #138) : le coût déjà connu ou déjà mesuré de CETTE
// action précise (37000 pour un spawn d'agent séparé, le résultat déjà calculé par
// measureClaudeMdWeight()/estimateTokens() pour les schémas "variable", etc.) — jamais un second
// calcul ici, l'appelant fournit le chiffre qu'il a déjà en main. Optionnel : une action dont le
// poids réel n'est pas connu numériquement (ex. large_archive_read sans mesure faite) reste comptée
// pour le nombre d'actions et le temps écoulé (cf. detectTaskMomentum ci-dessous), simplement pour
// zéro dans le cumul de tokens.
export function recordAction(actionType, context, now, options = {}) {
  const { classification, recipient = "agent", verdict, reductionPct, tokensEstimes } = options;
  const history = loadJson(HISTORY_PATH, { actions: [] });
  history.actions = (history.actions ?? []).slice(-300);
  history.actions.push({ type: actionType, context: context || null, at: now, recipient, ...(classification ? { classification } : {}), ...(verdict ? { verdict } : {}), ...(typeof reductionPct === "number" ? { reductionPct } : {}), ...(typeof tokensEstimes === "number" ? { tokensEstimes } : {}) });
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

// Accompagnement en temps réel d'une tâche longue (2026-09-21, tâche #138 — demande explicite :
// « SMART-CONSO-TOKEN doit aussi pouvoir intervenir PENDANT une tâche qui s'étire, pas seulement
// avant chaque action isolée »). Laissée explicitement en file le 2026-09-21 lors de l'audit de
// fiabilité (#137) car trop ouverte pour être devinée — calibrée maintenant par trois questions :
// (1) déclencheur — l'utilisateur a demandé "un système pertinent qui combine plusieurs solutions",
// jamais un seul axe ; (2) forme du signal — "entre" une simple ligne discrète et un vrai point
// d'arrêt bloquant : un bloc clairement identifiable, mais purement informatif, jamais une question
// qui exige une réponse avant de continuer ; (3) répétition — une seule fois par tâche, jamais à
// chaque action tant que le seuil reste franchi.
//
// Aucun identifiant de "tâche" n'existe dans l'historique (SMART-CONSO-TOKEN n'a jamais eu besoin
// de savoir où une tâche commence/finit avant ce jour) — approximé honnêtement par une LANCÉE :
// des actions confirmées consécutives, sans écart de plus de `maxGapMs` entre deux d'entre elles ni
// entre la dernière et maintenant. Une vraie tâche qui ferait une pause plus longue que ce délai
// (attente d'une confirmation utilisateur, chantier repris le lendemain) compte alors comme une
// NOUVELLE lancée, ce qui est le comportement voulu : le compteur ne doit jamais recoller
// silencieusement deux chantiers sans lien réel entre eux. Heuristique honnête, jamais une garantie
// (même esprit que le reste de ce fichier) — cf. `docs/referentiel/smart-conso-token.md`.
function currentTaskRun(history, now, { maxGapMs = 30 * 60 * 1000 } = {}) {
  const actions = [...(history?.actions ?? [])].filter((a) => now - a.at >= 0).sort((a, b) => a.at - b.at);
  if (!actions.length || now - actions[actions.length - 1].at > maxGapMs) return [];
  let startIdx = actions.length - 1;
  for (let i = actions.length - 1; i > 0; i--) {
    if (actions[i].at - actions[i - 1].at > maxGapMs) break;
    startIdx = i - 1;
  }
  return actions.slice(startIdx);
}

// Trois seuils indépendants, combinés en OR (n'importe lequel suffit à déclencher) — chacun
// attrape un motif de dérive différent qu'un seul axe manquerait : beaucoup de petites actions
// rapprochées (nombre), un chantier qui traîne en longueur même avec peu d'actions coûteuses
// (temps), une poignée d'actions individuellement énormes (poids cumulé). Valeurs de départ
// choisies par l'agent (délégué explicitement par l'utilisateur : « trouve un système pertinent »),
// jamais calibrées empiriquement faute d'historique réel — à ajuster une fois l'usage réel accumulé
// (même discipline que HARD_THRESHOLDS/classifyRuleImportance ailleurs dans ce fichier).
export const TASK_MOMENTUM_THRESHOLDS = { actionCount: 5, elapsedMs: 45 * 60 * 1000, cumulativeTokens: 50000 };

// Marqueur interne (jamais un schéma connu coûteux lui-même, jamais passé par assess()) : une fois
// écrit dans l'historique via recordAction(), il rejoint la lancée courante et empêche un second
// signal tant qu'aucun écart de plus de maxGapMs ne l'a fermée — c'est ce qui fait respecter "une
// seule fois par tâche" sans avoir besoin d'un second fichier d'état séparé.
const TASK_MOMENTUM_MARKER = "long_task_signal";

export function detectTaskMomentum(history, now, { maxGapMs = 30 * 60 * 1000, thresholds = TASK_MOMENTUM_THRESHOLDS } = {}) {
  const run = currentTaskRun(history, now, { maxGapMs });
  const alreadySignaled = run.some((a) => a.type === TASK_MOMENTUM_MARKER);
  const countableRun = run.filter((a) => a.type !== TASK_MOMENTUM_MARKER);
  if (!countableRun.length) return { signale: false, actionCount: 0, elapsedMs: 0, cumulativeTokens: 0 };
  const elapsedMs = now - countableRun[0].at;
  const cumulativeTokens = countableRun.reduce((sum, a) => sum + (typeof a.tokensEstimes === "number" ? a.tokensEstimes : 0), 0);
  const franchis = [];
  if (countableRun.length >= thresholds.actionCount) franchis.push(`${countableRun.length} actions coûteuses enchaînées (seuil : ${thresholds.actionCount})`);
  if (elapsedMs >= thresholds.elapsedMs) franchis.push(`${Math.round(elapsedMs / 60000)} min écoulées sur ce chantier (seuil : ${Math.round(thresholds.elapsedMs / 60000)} min)`);
  if (cumulativeTokens >= thresholds.cumulativeTokens) franchis.push(`~${cumulativeTokens} tokens cumulés estimés (seuil : ${thresholds.cumulativeTokens})`);
  const base = { actionCount: countableRun.length, elapsedMs, cumulativeTokens };
  if (!franchis.length || alreadySignaled) return { signale: false, ...base };
  return { signale: true, franchis, bloc: formatTaskMomentumBlock({ ...base, franchis }), ...base };
}

// Bloc informatif seul (calibrage : "entre" une ligne discrète et un vrai point d'arrêt) — un
// paragraphe clairement identifiable dans la réponse de l'agent, jamais une question qui bloque la
// suite du travail en attendant une confirmation.
export function formatTaskMomentumBlock({ actionCount, elapsedMs, cumulativeTokens, franchis }) {
  return [
    "⏳ SMART-CONSO-TOKEN — chantier en cours",
    `${actionCount} action(s) coûteuse(s) enchaînée(s) depuis ${Math.round(elapsedMs / 60000)} min${cumulativeTokens ? `, ~${cumulativeTokens} tokens estimés cumulés` : ""}.`,
    `Seuil(s) franchi(s) : ${franchis.join(" ; ")}.`,
    "Signal informatif seul, jamais un blocage — à l'utilisateur/l'agent de juger si une pause ou un point d'étape serait utile maintenant.",
  ].join("\n");
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
// CORRIGÉ LE 2026-09-22 — cause racine d'un chiffre qui mentait depuis sa construction.
//
// Ce que cette fonction affichait : « 2/2 action(s) classifiée(s) comme investissement réel », soit
// 100 %. Ce que la période contenait réellement : 18 actions coûteuses, dont 16 sans aucune
// classification. Le dénominateur ÉTAIT DÉJÀ FILTRÉ sur `a.classification` — le taux décrivait donc
// le sous-ensemble classé, jamais l'activité, et il se présentait comme un bilan de l'activité.
//
// C'est la forme la plus polie du défaut que ce projet combat depuis le début : une mesure
// adjacente servie à la place de la mesure visée. Et ici elle était flatteuse, ce qui la rendait
// invisible — personne ne va vérifier un 100 %.
//
// L'utilisateur a tranché à la fenêtre de clôture de la Ronde du même jour : « un vert non
// représentatif est une alerte ». La population est désormais TOUTE l'activité de la fenêtre, et
// qualifierIndicateur() (lib-shell.mjs) refuse de conclure sous le seuil de représentativité.
export function computeInvestmentRatio(history, now, windowDays = 7) {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const dansLaFenetre = (history?.actions ?? []).filter((a) => now - a.at <= windowMs && now - a.at >= 0);
  const recent = dansLaFenetre.filter((a) => a.classification);
  const nonClassees = dansLaFenetre.length - recent.length;
  if (!recent.length) {
    return { total: 0, population: dansLaFenetre.length, nonClassees, investissement: 0, sansRetour: 0, aEvaluer: 0, message: dansLaFenetre.length ? `${dansLaFenetre.length} action(s) coûteuse(s) sur ${windowDays} jours, AUCUNE classifiée — rien à conclure, et ce n'est jamais un bon résultat.` : "Aucune action coûteuse récente — rien à mesurer pour l'instant." };
  }
  const investissement = recent.filter((a) => a.classification === "investissement").length;
  const sansRetour = recent.filter((a) => a.classification === "sans_retour").length;
  const aEvaluer = recent.filter((a) => a.classification === "a_evaluer").length;
  const qualite = qualifierIndicateur({ taux: investissement / recent.length, mesures: recent.length, population: dansLaFenetre.length });
  const base = `${investissement}/${recent.length} action(s) classifiée(s) comme investissement réel (${sansRetour} sans retour, ${aEvaluer} à évaluer)`;
  return {
    total: recent.length, population: dansLaFenetre.length, nonClassees, investissement, sansRetour, aEvaluer,
    pctInvestissement: Math.round((investissement / recent.length) * 1000) / 10,
    qualite: qualite.etat,
    message: qualite.etat === "non concluant"
      ? `⚠️ NON CONCLUANT — ${base}, mais ${nonClassees} des ${dansLaFenetre.length} actions de la période n'ont JAMAIS été classées : ${qualite.pourquoi}.`
      : `${base}, sur ${dansLaFenetre.length} action(s) coûteuse(s) de la période (${windowDays} jours).`,
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

// filterIndexRowsByVersion() (2026-09-22, demande explicite de l'utilisateur : « l'equipe smart
// conso pouvait aussi venir piocher de la donnée » — depuis le registre de HYPER-SCAN-CHECKPOINT
// cette fois, pas seulement THE-FINAL-JUDGE/THE-DEEP-READER ci-dessus). HYPER-SCAN-CHECKPOINT
// archive AUSSI ses passages en version LÉGÈRE (zéro appel réseau, aucune consultation requise) —
// passer son index tel quel à findJudgeSpawnsWithoutConsultation() ci-dessus fabriquerait un faux
// signal sur chaque passage léger. Filtre GÉNÉRIQUE, réutilisable par tout futur registre à colonne
// "Version" : réduit le texte de l'index aux seules lignes datées qui matchent le motif demandé,
// jamais un second calcul de date — le texte filtré se réinjecte tel quel dans
// findJudgeSpawnsWithoutConsultation(), aucune duplication de logique.
export function filterIndexRowsByVersion(indexText, versionPattern) {
  return (indexText || "")
    .split("\n")
    .filter((line) => !/^\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(line) || versionPattern.test(line))
    .join("\n");
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
  // CHARTER-SPY vit dans ce même fichier (extension de SMART-CONSO-TOKEN) mais reste un outil
  // distinct au registre : sa propre phrase, jamais celle de son hôte (tâche #198).
  printReliabilityNotice("charter-spy");
  recordCliUsage("smart-conso-token");
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
  const tokensEstimesArg = process.argv.find((a) => a.startsWith("--tokens-estimes="));
  const agentIdentity = identityArg ? identityArg.slice("--identity=".length) : undefined;
  const context = contextArg ? contextArg.slice("--context=".length) : undefined;
  const recipient = recipientArg ? recipientArg.slice("--recipient=".length) : "agent";
  const tokensEstimes = tokensEstimesArg ? Number(tokensEstimesArg.slice("--tokens-estimes=".length)) : undefined;
  const now = Date.now();
  let history = loadJson(HISTORY_PATH, { actions: [] });

  if (!actionType) {
    console.log("Usage: node scripts/smart-conso-token.mjs <type-d'action> [--confirm] [--identity=claude-sonnet-5] [--context=\"...\"] [--recipient=agent|outil|utilisateur] [--tokens-estimes=37000] [--builds-tool] [--prevents-debugging] [--duplicate] [--scope-mismatch]");
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
  printReportHeader({ tool: "smart-conso-token", title: "SMART-CONSO-TOKEN — avis avant action coûteuse en tokens", scriptPath: "scripts/smart-conso-token.mjs" });
  console.log(`Action envisagée : ${actionType} (destinataire : ${recipient})`);
  if (context) console.log(`Contexte : ${context}`);
  console.log(`Avis : [${advice.verdict}] ${advice.message}`);
  if (advice.freshness?.fraiche === false) console.log(`\n⚠️ FRAÎCHEUR DE CONNAISSANCE : ${advice.freshness.message}`);
  else if (advice.freshness) console.log(`(${advice.freshness.message})`);

  if (process.argv.includes("--confirm")) {
    history = recordAction(actionType, context, now, { classification: advice.investment?.classification, recipient, verdict: advice.verdict, tokensEstimes });
    console.log(`\nAction confirmée et enregistrée dans l'historique local (horodatage ${now}, à réutiliser pour "outcome" une fois le résultat connu).`);

    // Accompagnement en temps réel (tâche #138) : vérifié seulement APRÈS une confirmation réelle,
    // jamais sur un simple avis — un chantier "en cours" se mesure à ce qui a vraiment été fait.
    const momentum = detectTaskMomentum(history, now);
    if (momentum.signale) {
      console.log(`\n${momentum.bloc}`);
      history = recordAction(TASK_MOMENTUM_MARKER, null, now + 1);
    }
  } else {
    console.log("\n(Avis seul — relancer avec --confirm une fois la décision prise.)");
  }

  const summary = summarizeHistory(history, now);
  console.log(`\nRythme observé (${summary.windowDays} derniers jours) : ${summary.totalRecent} action(s) au total — ${JSON.stringify(summary.byType)}`);
  const ratio = computeInvestmentRatio(history, now);

  // LE PLAN D'ACTION (2026-09-23, tâche #211). SMART-CONSO-TOKEN est un CONSEILLER : on le consulte
  // AVANT une action coûteuse, il rend un avis. Un avis n'est pas un constat, et transformer chaque
  // avis en tâche remplirait le suivi de décisions déjà prises.
  //
  // Son seul vrai constat est son AUTO-DIAGNOSTIC : quand il repère que sa propre mesure dérive.
  // Et il est classé « à trancher », jamais « retenu » — la règle de l'Article 22 est formelle,
  // cet outil INFORME et ne tranche jamais, pas même sur lui-même.
  const auto = typeof autoDiagnostic === "function" ? (autoDiagnostic(history, now) ?? []) : [];
  const planToken = buildPlanDaction((Array.isArray(auto) ? auto : []).map((d) => ({
    constat: String(d.constat ?? d.message ?? d),
    etat: "a-trancher",
    pourquoi: "auto-diagnostic : l'outil signale une dérive de sa PROPRE mesure, et l'Article 22 lui interdit de s'auto-ajuster — la correction est une décision humaine",
  })), { toolSlug: "smart-conso-token" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planToken.lignes) console.log(l);
  console.log(`Bilan investissement (${7} derniers jours) : ${ratio.message}`);
  const findings = diagnoseAdviceAccuracy(history, now);
  console.log(`Auto-diagnostic (agent + outils) : ${findings.length ? findings.length + " constat(s) — voir le rapport détaillé si besoin" : "aucun constat pour l'instant"}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
