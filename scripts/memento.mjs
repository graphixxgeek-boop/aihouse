// MEMENTO (tâche #169, 2026-09-21) — cible EXCLUSIVEMENT la catégorie "Personnages" (Lia/Noé),
// jamais les membres de l'équipe (cf. PERSONNAGES/assertNotAPersonnage de lib-shell.mjs, qui fait
// l'inverse — refuser un outil de membre de l'équipe sur un Personnage — MEMENTO est le premier
// outil pour qui l'inverse est vrai : il s'applique VRAIMENT aux personnages, jamais aux scripts).
//
// Deux rôles confirmés (2026-09-21, calibrage explicite) :
//  (a) cohérence de la mémoire dans le temps — détection MÉCANIQUE seulement, jamais un second
//      appel Gemini, jamais un jugement sur ce qui EST dit, seulement sur la structure des données
//      persistées (lib/life.ts) qui nourrissent chaque tour.
//  (b) dette de taille mémoire — mesure honnête de ce qui est réellement envoyé à Gemini par tour,
//      jamais utilisée pour modifier le prompt lui-même (territoire exclusif de l'Article 8/0).
//
// Investigation préalable (Article 19, 2026-09-21, agent séparé) : le stockage de `Life`
// (lib/life.ts) est déjà rigoureusement plafonné — chaque tableau porte une limite explicite
// (`.slice(-12)`, `.slice(0,300)`, etc.) directement dans `readLife()`. MEMENTO n'a donc AUCUNE
// raison de refaire ce travail de plafonnage. Ce qui manque réellement, confirmé par
// l'investigation : (a) aucune vérification mécanique n'existe que ces données plafonnées restent
// VRAIMENT cohérentes dans le temps (ordre chronologique, remise à zéro suspecte, régression de
// gravité) ; (b) le poids réel envoyé à Gemini par tour est un territoire explicitement laissé de
// côté par SMART-CONSO-TOKEN et Smart Conso API (cf. docs/referentiel/smart-conso-token.md :
// « jamais le texte envoyé à Gemini pour Lia et Noé »).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { estimateTokens } from "./smart-conso-token.mjs";

// --- Rôle (a) : cohérence mécanique de la mémoire ------------------------------------------------

// Vérifie qu'une liste d'entrées portant un numéro de round réel (bonusLog, negotiationLog,
// contacts...) reste dans l'ordre chronologique où elle s'est VRAIMENT produite — un mélange serait
// le signe d'un bug de sauvegarde (tableau réordonné par erreur), jamais un jugement sur le contenu
// lui-même. `getRound` accepte aussi bien un tableau d'objets `{round}` (bonusLog, negotiationLog)
// qu'un tableau de nombres bruts (contacts) — même fonction, jamais deux vérifications séparées
// pour une seule et même règle.
export function checkChronologicalOrder(entries, getRound = (e) => (typeof e === "number" ? e : e?.round)) {
  const violations = [];
  for (let i = 1; i < entries.length; i++) {
    const previousRound = getRound(entries[i - 1]);
    const currentRound = getRound(entries[i]);
    if (typeof previousRound === "number" && typeof currentRound === "number" && currentRound < previousRound) {
      violations.push({ index: i, previousRound, currentRound });
    }
  }
  return violations;
}

// Détecte une remise à zéro suspecte d'un compteur persistant (wordFrequency/themeFrequency) entre
// deux instantanés successifs de Life — exactement le type de bug déjà trouvé une fois ce soir sur
// l'attirance (loveRealized, cf. Plan d'origine de CLAUDE.md) : une valeur significative qui
// disparaît ou chute sans qu'aucun événement explicite ne le justifie. `threshold` : la valeur
// minimale pour qu'une chute compte comme suspecte, jamais un bruit de fond sur un compteur qui
// vient tout juste de démarrer (une chute de 1 à 0 n'a aucune valeur de signal).
export function detectSuspiciousCounterReset(previousCounters = {}, currentCounters = {}, { threshold = 3 } = {}) {
  const resets = [];
  for (const [key, previousValue] of Object.entries(previousCounters ?? {})) {
    if (typeof previousValue !== "number" || previousValue < threshold) continue;
    const currentValue = currentCounters?.[key];
    if (typeof currentValue !== "number" || currentValue < previousValue) {
      resets.push({ key, previousValue, currentValue: currentValue ?? 0 });
    }
  }
  return resets;
}

// Vérifie que `worstMoment` (le pire moment vécu par un personnage, lib/life.ts) ne redevient
// jamais moins grave avec le temps — la règle du jeu dit qu'il ne doit être remplacé que par un
// moment PLUS sévère (cf. commentaire lib/life.ts:129). Un recul serait le signe que le code
// d'écriture a été contourné ou cassé, jamais un jugement sur la sévérité elle-même.
export function detectWorstMomentRegression(previousWorstMoment, currentWorstMoment) {
  if (!previousWorstMoment || !currentWorstMoment) return null;
  if (currentWorstMoment.severity < previousWorstMoment.severity) {
    return {
      previousSeverity: previousWorstMoment.severity,
      currentSeverity: currentWorstMoment.severity,
      previousRound: previousWorstMoment.round,
      currentRound: currentWorstMoment.round,
    };
  }
  return null;
}

// Champs réellement porteurs d'un round dans lib/life.ts (cf. investigation Article 19) — tenue à
// la main, comme AGENT_SCRIPT_FILES d'axa-check.mjs : un futur champ de ce type ajouté à Life devra
// être ajouté ici explicitement, jamais deviné par une heuristique de nommage fragile.
const CHRONOLOGICAL_FIELDS = ["bonusLog", "negotiationLog", "contacts"];

// Agrège les trois vérifications confirmées (2026-09-21) sur un instantané de Life — `previousLife`
// (l'instantané précédent, pour les deux vérifications qui ont besoin d'une comparaison dans le
// temps) est optionnel : sans lui, seul l'ordre chronologique (vérifiable sur un seul instantané)
// est rapporté. Jamais une action automatique : un signal à lire, la même retenue que le reste du
// réseau d'outils (Smart Conso API, SMART-CONSO-TOKEN, THE-KING).
export function checkMemoryCoherence(life, previousLife = null) {
  const findings = [];
  for (const field of CHRONOLOGICAL_FIELDS) {
    const entries = life?.[field];
    if (!Array.isArray(entries) || entries.length < 2) continue;
    const violations = checkChronologicalOrder(entries);
    if (violations.length) findings.push({ type: "ordre_chronologique", champ: field, violations });
  }
  if (previousLife) {
    for (const field of ["wordFrequency", "themeFrequency"]) {
      const resets = detectSuspiciousCounterReset(previousLife[field], life?.[field]);
      if (resets.length) findings.push({ type: "remise_a_zero_suspecte", champ: field, resets });
    }
    const regression = detectWorstMomentRegression(previousLife.worstMoment, life?.worstMoment);
    if (regression) findings.push({ type: "regression_gravite", champ: "worstMoment", ...regression });
  }
  return findings;
}

// --- Rôle (b) : dette de taille mémoire (poids réel envoyé à Gemini par tour) -------------------

// Réutilise TEL QUEL l'heuristique déjà validée de SMART-CONSO-TOKEN (4 caractères ≈ 1 token),
// jamais un second calcul divergent — appliquée ici à un artefact différent (le contexte JSON
// envoyé à Gemini, `JSON.stringify(context)` dans lib/lia.ts, jamais le texte de CLAUDE.md).
// `context` est l'objet passé à `think()`, jamais une chaîne déjà sérialisée par l'appelant — cette
// fonction fait elle-même la sérialisation pour ne jamais dépendre d'un choix de format en amont.
export function estimateContextWeight(context) {
  return estimateTokens(JSON.stringify(context ?? {}));
}

// Persistance après coup (2026-09-21), même chemin déjà validé pour le trafic réel des clés Gemini
// (tâche #88) : `samples` vient de l'API admin (lib/memento-weight.ts::getContextWeightSamples(),
// mémoire process, jamais écrite en base côté jeu — Cloudflare Workers n'a pas de disque
// persistant). Écrit dans `.memento-history.json` (local, gitignored), plafonné à 500 échantillons
// — jamais un second mécanisme d'écriture pour un concept déjà couvert par un autre fichier.
const HISTORY_PATH = fileURLToPath(new URL("../.memento-history.json", import.meta.url));

function loadHistory() {
  try {
    return JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
  } catch {
    return { samples: [] };
  }
}

export function persistContextWeightSamples(samples) {
  if (!samples || !samples.length) return;
  const data = loadHistory();
  data.samples = [...(data.samples ?? []), ...samples].slice(-500);
  writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 1));
  return data.samples.length;
}

// Poids moyen honnête — `undefined` (jamais 0 fabriqué) sur un historique vide, distingué par
// acteur pour ne jamais masquer un déséquilibre Lia/Noé derrière une seule moyenne globale.
export function averageContextWeightByActor(samples) {
  const byActor = {};
  for (const s of samples ?? []) {
    if (!s || typeof s.tokens !== "number" || !s.actor) continue;
    byActor[s.actor] = byActor[s.actor] ?? [];
    byActor[s.actor].push(s.tokens);
  }
  return Object.fromEntries(
    Object.entries(byActor).map(([actor, tokens]) => [actor, Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length)]),
  );
}
