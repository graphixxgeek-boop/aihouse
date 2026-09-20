// Rotation et disponibilité partagées des clés API Gemini (2026-09-19, demande explicite de
// l'utilisateur au moment de l'ajout d'une 3e clé : « pense à solliciter une rotation des clefs
// pour ne pas saturer une clef de demande [...] pense à un systeme de rotation des clefs, de test
// de disponibilité, fais quelque chose d'intelligent »). Remplace l'ancienne mémoire « collante »
// par point d'appel (une variable `lastGoodKeyIndex` propre à `lib/lia.ts` et une autre, séparée,
// propre à `app/api/lia/route.ts` — qui faisait qu'UNE SEULE clé encaissait tout le trafic tant
// qu'elle répondait, sans jamais tourner vers les autres) par un état commun aux deux SEULS points
// d'appel réseau réels de l'application (`lib/lia.ts::think()` et
// `app/api/lia/route.ts::generateDossierFragment()`, cf. CLAUDE.md) : une clé découverte épuisée
// par l'un profite immédiatement à l'autre, exactement comme les deux « cerveaux » d'un même tour
// se partageaient déjà cette découverte au sein de `think()` seul.
//
// Rotation : à chaque appel, la clé de départ change (round-robin parmi les clés actuellement
// saines), jamais toujours la même — ça répartit le trafic entre les clés au lieu de saturer la
// première tant qu'elle répond, l'objectif explicite de la demande. Disponibilité : une clé qui
// vient d'échouer est mise en retrait pour un temps qui dépend de la cause (429 quota très
// probablement épuisé pour un moment ; 503 souvent transitoire, retenter vite a du sens) et
// sautée par la rotation tant que ce délai n'est pas écoulé — un suivi tiré directement du trafic
// réel, jamais un appel de sonde séparé (zéro coût API additionnel, Article 8 de CLAUDE.md). Une
// clé invalide (401/403) est mise en retrait définitivement pour la durée du process : aucune
// chance de guérison, inutile de regaspiller un essai dessus à chaque appel comme avant.
//
// Une clé en cooldown n'est jamais RETIRÉE de la rotation, seulement reléguée en dernier : si
// toutes les clés sont actuellement en cooldown, la moins mauvaise reste tentée plutôt que
// d'abandonner sans essayer — nos délais sont des heuristiques, pas une certitude d'échec.
//
// Mémoire "best effort" au niveau du module JS, comme l'était `lastGoodKeyIndex` : jamais écrite
// en base, perdue à chaque redémarrage sans que ce soit un problème (on repart simplement de
// l'ordre configuré, jamais une perte de clé ni un comportement incorrect).
let rotation = 0;
const cooldownUntil = new Map<string, number>();
// Empreinte courte d'une clé (2026-09-20, tâche #88 : « persister le vrai trafic Gemini dans
// l'historique partagé »), EXACT même algorithme que `keyLabel()` de `scripts/gemini-key-health.mjs`
// (6 premiers + 4 derniers caractères) — dupliqué ici volontairement plutôt qu'importé, puisque ce
// fichier est partagé avec la production Cloudflare Workers et ne doit JAMAIS tirer un module Node
// avec accès disque dans son propre bundle (cf. le principe déjà posé dans gemini-key-health.mjs :
// « portée strictement dev/simulation, jamais dans le code partagé avec la production »). Les deux
// implémentations doivent rester identiques pour que les empreintes se recoupent correctement une
// fois persistées — testé explicitement dans check-house.mjs (jamais une divergence silencieuse).
// Jamais la clé en clair au-delà de ce fichier : jamais exposée telle quelle par l'API admin.
export function fingerprint(rawKey: string): string {
    if (!rawKey || rawKey.length < 12) return "clé-inconnue";
    return rawKey.slice(0, 6) + "…" + rawKey.slice(-4);
}
// Trafic RÉEL observé, par empreinte de clé et par modèle (2026-09-20, tâche #88) — mémoire
// "best-effort" au même niveau que le reste de ce fichier (process/isolate, jamais écrite en base
// ici : cf. le principe ci-dessus). Exposée en lecture seule via getGeminiKeyEpisodes() pour qu'un
// outil EXTÉRIEUR (tournant côté Node, avec un vrai accès disque) puisse la persister dans
// l'historique partagé (.gemini-key-health.json) après une session — jamais une écriture disque
// directe depuis ce fichier partagé avec la production.
type KeyEpisode = { fingerprint: string; model: string; outcome: "OK" | "429" | "503" | "401" | "403"; at: number };
const episodes: KeyEpisode[] = [];
// Compteurs d'efficacité du Smart Breaker (2026-09-19, demande explicite de l'utilisateur : « un
// petit KPI qui mesure l'efficacité du smart-breaker [...] pour s'assurer que l'utilisation de cet
// outil est rentable »). Même mémoire "best effort" au niveau du module que le reste de ce fichier
// (jamais écrite en base, remise à zéro à chaque redémarrage) — exactement ce qu'il faut pour un
// rapport par simulation, puisqu'une simulation complète tourne sur un process fraîchement
// redémarré (cf. Article 18 de CLAUDE.md). Volontairement limité à des compteurs bruts, sûrs sous
// concurrence (deux "cerveaux" peuvent appeler ce module en parallèle) : pas de tentative de
// calculer précisément "combien de fois le repli a sauvé un tour" (demanderait de suivre une
// frontière de tour partagée entre deux appels concurrents, un vrai risque de résultat faussé) —
// honnêteté à assumer plutôt qu'un chiffre séduisant mais peu fiable.
const metrics = { turns: 0, primaryKeyUnavailableAtStart: 0, attempts: 0, successes: 0, quotaFailures: 0, transientFailures: 0, invalidFailures: 0 };
// Recul adaptatif (2026-09-19, demande explicite de l'utilisateur : « fais en sorte que la
// rotation des clefs [...] soit intelligente, et permette d'optimiser la consommation de l'API au
// global, sans blocage, toujours »). Un compteur d'échecs CONSÉCUTIFS par clé (429 et 503 comptent
// ensemble : même cause probable, cf. CLAUDE.md) fait DOUBLER le délai de mise à l'écart à chaque
// nouvel échec, jusqu'à un plafond — une clé réellement épuisée pour la journée arrête de gaspiller
// une tentative toutes les 15 minutes pour rien, sans jamais être écartée définitivement (le
// plafond garantit un nouvel essai avant la fin de la journée). Un seul succès, à tout moment,
// remet le compteur à zéro : la clé retrouve aussitôt son délai de base la prochaine fois.
// Amélioration autonome, dans les limites déjà fixées (2026-09-19, demande explicite : « ce systeme
// doit pouvoir s'ameliorer de facon autonome dans le temps [...] avec les limites fixées
// precedemment »). Le recul adaptatif ci-dessous fait que ce mécanisme s'ajuste tout seul à
// l'expérience réelle (une clé qui échoue souvent est mise à l'écart plus longtemps, une clé qui se
// rétablit reprend aussitôt son rythme normal) sans qu'aucune intervention humaine ni redéploiement
// ne soit nécessaire — la même philosophie que l'historique d'expérience de l'outil de diagnostic
// (`scripts/gemini-key-health.mjs`, cf. `docs/outil-resilience-api.md`), transposée à la production.
// Ce qui NE change jamais tout seul, conformément aux limites déjà actées pour cet outil : la
// LOGIQUE elle-même (ce fichier) ne se réécrit jamais à l'exécution, seuls les PARAMÈTRES dérivés
// du trafic réel (cooldown, ordre de rotation) s'ajustent — toute évolution de la logique reste une
// intervention délibérée (agent ou humain), documentée le jour même (Article 13 de CLAUDE.md).
const consecutiveFailures = new Map<string, number>();
const QUOTA_COOLDOWN_BASE_MS = 15 * 60 * 1000;
const QUOTA_COOLDOWN_MAX_MS = 4 * 60 * 60 * 1000;
const TRANSIENT_COOLDOWN_BASE_MS = 60 * 1000;
const TRANSIENT_COOLDOWN_MAX_MS = 20 * 60 * 1000;

/**
 * Ordre dans lequel essayer `rawKeys` pour CET appel : les clés actuellement saines d'abord (en
 * rotation, jamais toujours dans le même ordre), les clés en cooldown en dernier recours — et
 * parmi celles-ci, la plus proche de se libérer d'abord (nos délais sont des estimations, autant
 * tenter la moins mauvaise plutôt qu'une clé arbitrairement plus loin de sa guérison). Fait aussi
 * avancer la rotation pour le prochain appel — à n'appeler qu'une fois par tentative réelle.
 */
export function orderKeys(rawKeys: readonly string[]): number[] {
    const now = Date.now();
    const n = rawKeys.length;
    const order = rawKeys.map((_, i) => i).sort((a, b) => {
        const untilA = cooldownUntil.get(rawKeys[a]) ?? 0, untilB = cooldownUntil.get(rawKeys[b]) ?? 0;
        const coolA = untilA > now ? 1 : 0, coolB = untilB > now ? 1 : 0;
        if (coolA !== coolB) return coolA - coolB;
        if (coolA === 1) return untilA - untilB;
        return ((a - rotation + n) % n) - ((b - rotation + n) % n);
    });
    if (n > 0) rotation = (rotation + 1) % n;
    metrics.turns++;
    if (order[0] !== 0) metrics.primaryKeyUnavailableAtStart++; // la clé principale (index 0) n'était déjà plus en tête : un repli a dû prendre le relais dès le départ de ce tour
    return order;
}

/** Met à jour la disponibilité connue d'une clé d'après le statut HTTP obtenu avec elle. */
export function recordKeyStatus(rawKey: string, status: number, model: string): void {
    metrics.attempts++;
    const outcome: KeyEpisode["outcome"] = status === 401 ? "401" : status === 403 ? "403" : status === 429 ? "429" : status === 503 ? "503" : "OK";
    episodes.push({ fingerprint: fingerprint(rawKey), model, outcome, at: Date.now() });
    if (episodes.length > 200) episodes.shift();
    if (status === 401 || status === 403) { metrics.invalidFailures++; cooldownUntil.set(rawKey, Infinity); return; }
    if (status === 429 || status === 503) {
        if (status === 429) metrics.quotaFailures++; else metrics.transientFailures++;
        const streak = (consecutiveFailures.get(rawKey) ?? 0) + 1;
        consecutiveFailures.set(rawKey, streak);
        const [base, max] = status === 429 ? [QUOTA_COOLDOWN_BASE_MS, QUOTA_COOLDOWN_MAX_MS] : [TRANSIENT_COOLDOWN_BASE_MS, TRANSIENT_COOLDOWN_MAX_MS];
        cooldownUntil.set(rawKey, Date.now() + Math.min(max, base * 2 ** (streak - 1)));
        return;
    }
    metrics.successes++;
    consecutiveFailures.delete(rawKey);
    cooldownUntil.delete(rawKey); // réponse définitive et saine : efface un éventuel cooldown périmé
}

/** Lecture des compteurs d'efficacité — jamais mutée depuis l'extérieur, une copie à chaque appel. */
export function getGeminiKeyMetrics() { return { ...metrics }; }

/** Lecture du trafic réel par empreinte de clé/modèle (tâche #88) — jamais la clé en clair, jamais
 * mutée depuis l'extérieur (une copie à chaque appel). Destinée à un outil externe (Node, accès
 * disque réel) qui la persiste dans l'historique partagé après une session. */
export function getGeminiKeyEpisodes() { return [...episodes]; }

/** Réservé aux tests (`scripts/check-house.mjs`) : repart d'un état neuf, déterministe. */
export function __resetGeminiKeyRotationForTests(): void { rotation = 0; cooldownUntil.clear(); consecutiveFailures.clear(); episodes.length = 0; metrics.turns = 0; metrics.primaryKeyUnavailableAtStart = 0; metrics.attempts = 0; metrics.successes = 0; metrics.quotaFailures = 0; metrics.transientFailures = 0; metrics.invalidFailures = 0; }

/** Réservé aux tests : millisecondes restantes avant la fin du cooldown d'une clé (0 si saine). */
export function __cooldownRemainingForTests(rawKey: string): number { return Math.max(0, (cooldownUntil.get(rawKey) ?? 0) - Date.now()); }
