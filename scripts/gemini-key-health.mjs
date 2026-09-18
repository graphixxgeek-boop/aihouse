// PRINCIPE FONDATEUR DE CE MODULE (2026-09-18, formulation explicite de l'utilisateur : « je veux
// que l'outil ait une connaissance fine de la clef API de façon à pouvoir la dominer : c'est le
// principe fondateur de l'outil qui lui permet d'atteindre son objectif : contourner les
// obstacles et blocages posés par la clef API »). L'objectif n'est jamais de deviner ou de réagir
// à l'aveugle à un blocage isolé, mais de connaître CHAQUE clé configurée assez finement (par
// modèle, dans le temps, épisode par épisode) pour anticiper et contourner ses blocages avant
// qu'ils ne bloquent une vraie session — la sonde ponctuelle (`check-gemini-quota.mjs`) répond à
// l'instant présent, cette mémoire répond à la durée : plus l'outil est utilisé, plus sa
// connaissance de chaque clé s'affine, jamais l'inverse. Née de la demande initiale (« que cet
// outil devienne peu à peu une bombe d'efficacité grâce à tous les épisodes vécus, toute
// l'expérience accumulée »), reformulée ici pour ne jamais perdre de vue le POURQUOI derrière le
// COMMENT (Article 7 — épreuve de la page blanche).
//
// Portée strictement dev/simulation, jamais la vraie application en production (confirmé
// explicitement) : `lib/lia.ts`/`route.ts` tournent en production sur Cloudflare Workers, qui n'a
// pas de système de fichiers persistant — cette mémoire ne peut techniquement vivre que côté
// outillage Node (`check-gemini-quota.mjs` et les scripts de simulation), jamais dans le code
// partagé avec la production.
//
// Fichier local jamais committé (comme `.dev.vars`, cf. `.gitignore`) : l'historique reste sur
// cette machine/ce conteneur, jamais dans git — cohérent avec la discrétion déjà demandée sur ce
// chantier. Conséquence honnête à ne jamais masquer : un nouveau conteneur (nouvelle session)
// repart d'un historique vide, exactement comme `.dev.vars` lui-même doit être refourni à chaque
// fois — l'accumulation vaut pour la durée de vie d'un même conteneur, pas au-delà.
//
// Chaque clé est identifiée par une empreinte courte (6 premiers + 4 derniers caractères), jamais
// la valeur complète — précaution supplémentaire même si le fichier n'est jamais committé.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HEALTH_PATH = fileURLToPath(new URL("../.gemini-key-health.json", import.meta.url));

// Historique désormais multi-fournisseurs (2026-09-18, cf. api-providers.mjs) : une entrée reste
// une simple chaîne de clé (fournisseur Gemini implicite, comportement historique inchangé) ou un
// objet { provider, key } pour un fournisseur explicite. `normalize()` ramène les deux formes à
// une paire cohérente une seule fois, en tête de chaque fonction publique.
function normalize(entry) {
  return typeof entry === "string" ? { provider: "gemini", key: entry } : entry;
}

export function keyLabel(entry) {
  const { provider, key } = normalize(entry);
  if (!key || key.length < 12) return "clé-inconnue";
  const fingerprint = key.slice(0, 6) + "…" + key.slice(-4);
  return provider === "gemini" ? fingerprint : `${provider}:${fingerprint}`;
}

function load() {
  if (!existsSync(HEALTH_PATH)) return { keys: {} };
  try {
    const data = JSON.parse(readFileSync(HEALTH_PATH, "utf8"));
    return data && typeof data === "object" && data.keys ? data : { keys: {} };
  } catch {
    return { keys: {} };
  }
}

function save(data) {
  writeFileSync(HEALTH_PATH, JSON.stringify(data, null, 1));
}

// Enregistre l'issue d'une vraie tentative (probe ou appel réel) pour CETTE clé et CE modèle —
// jamais un événement pour un modèle qui n'a même pas été essayé, pour ne jamais halluciner de
// l'expérience qui n'a pas eu lieu. `lastTouched*` retient la toute DERNIÈRE tentative sur cette
// clé, tous modèles confondus — jamais un mélange de "la meilleure marque toutes catégories" entre
// modèles différents (bug réel trouvé en testant : un modèle épuisé plus tard dans la boucle de
// sonde faisait passer une clé pour "encore à plat" alors qu'un autre modèle venait de répondre).
// `asKeySignal` (par défaut vrai) marque cette tentative comme représentative de l'état GLOBAL de
// la clé pour l'ordonnancement (lastTouched*) — à mettre à faux pour une sonde secondaire sur un
// modèle candidat rarement utilisé, dont l'échec/succès ne doit jamais éclipser le signal donné
// par le modèle réellement utilisé par l'application (bug réel trouvé en testant : sonder ensuite
// gemini-pro-latest, presque toujours en quota serré, faisait passer une clé par ailleurs saine
// pour "probablement encore à plat").
export function recordOutcome(key, model, outcome, asKeySignal = true) {
  const data = load();
  const label = keyLabel(key);
  const entry = data.keys[label] ?? { models: {}, episodes: [] };
  const now = Date.now();
  entry.models[model] = { ...(entry.models[model] ?? {}), lastOutcome: outcome, lastAt: now };
  if (asKeySignal) { entry.lastTouchedAt = now; entry.lastTouchedOutcome = outcome; }
  entry.episodes = [...entry.episodes, { at: now, model, outcome }].slice(-100);
  data.keys[label] = entry;
  save(data);
}

// Ordonne une liste de clés selon l'expérience accumulée : une clé vue bonne en dernier passe
// devant une clé jamais testée, qui passe elle-même devant une clé vue en échec en dernier — sans
// jamais en retirer une (l'apprentissage réordonne, il ne décide jamais seul qu'une clé est morte
// pour de bon : le quota se renouvelle chaque jour, une clé "épuisée hier" redevient viable).
export function orderKeysByExperience(keys) {
  const data = load();
  const rank = (outcome) => outcome === "OK" ? 2 : outcome === undefined ? 1 : 0;
  const scored = keys.map((key, index) => {
    const entry = data.keys[keyLabel(key)];
    return { key, index, rank: rank(entry?.lastTouchedOutcome), lastTouchedAt: entry?.lastTouchedAt ?? 0 };
  });
  scored.sort((a, b) => b.rank - a.rank || b.lastTouchedAt - a.lastTouchedAt || a.index - b.index);
  return scored.map(s => s.key);
}

// Résumé lisible de l'expérience accumulée à ce jour, pour affichage dans check-gemini-quota.mjs —
// jamais la clé en clair, seulement son empreinte. `likelyStillDown` se lit sur la toute dernière
// tentative connue (tous modèles confondus), jamais sur un mélange trompeur entre modèles.
export function summarize(keys) {
  const data = load();
  return keys.map(key => {
    const label = keyLabel(key);
    const entry = data.keys[label];
    if (!entry) return { label, known: false };
    return {
      label,
      known: true,
      lastTouchedAt: entry.lastTouchedAt,
      lastTouchedOutcome: entry.lastTouchedOutcome,
      episodeCount: entry.episodes.length,
      likelyStillDown: entry.lastTouchedOutcome !== "OK" && Date.now() - entry.lastTouchedAt < 5 * 60 * 1000,
    };
  });
}

// Leçons apprises AVEC l'assistance de l'utilisateur (2026-09-18, demande explicite : « intègre
// aussi l'historique des points clefs que nous avons découvert, pour l'aider à comprendre ce
// qu'il a déjà appris avec notre assistance »). Distinct de l'expérience automatique ci-dessus
// (recordOutcome/summarize, alimentée par de vraies sondes, se réinitialise à chaque nouveau
// conteneur) : ceci est un historique CURATÉ à la main, jamais généré par une sonde, qui capture
// ce qu'on a compris ENSEMBLE (diagnostic humain + IA) en creusant de vrais blocages en
// simulation. Narré en détail dans CLAUDE.md ("Blocage de quota Gemini — diagnostic et repli") ;
// reproduit ici en forme courte pour un affichage outillage, jamais comme copie faisant autorité
// — CLAUDE.md reste la version de référence en cas de divergence (Article 6/13). Une leçon
// s'ajoute ici seulement après avoir été vécue et comprise en vrai, jamais par anticipation d'un
// cas hypothétique.
export const KNOWN_LESSONS = [
  "Le quota gratuit Gemini est journalier ET par modèle ET par projet Google Cloud — jamais global au projet ni à la clé seule (GenerateRequestsPerDayPerProjectPerModel-FreeTier).",
  "Le `retryDelay` renvoyé par Google dans l'erreur 429 (souvent \"30s\") est trompeur pour un épuisement journalier : le quota ne revient pas après ce délai, il se renouvelle le lendemain.",
  "Deux clés du même projet Google Cloud partagent le même panier de quota (confirmé empiriquement) — seule une clé d'un projet Google Cloud réellement distinct apporte un quota indépendant.",
  "Google répond parfois 503 plutôt que 429 pour un modèle pourtant confirmé épuisé par sonde directe au même instant — même cause (quota épuisé), même traitement (repli), pas une erreur à part.",
  "Une variable d'environnement shell seule n'est PAS prise en compte par le runtime Cloudflare Workers en mode dev — modifier `.dev.vars` exige un redémarrage du serveur de dev pour être effectif.",
  "Sonder un appel minimal réel (ce script) donne une réponse fiable MAINTENANT ; deviner à l'aveugle quel modèle est encore disponible a mené à des tentatives perdues en pleine simulation.",
  "Une clé invalide (401/403) doit passer directement à la clé suivante sans gaspiller de tentatives sur ses autres modèles — un 429/503 seul justifie d'essayer d'autres modèles sur la même clé.",
];

export function describeKnownLessons() {
  return KNOWN_LESSONS;
}
