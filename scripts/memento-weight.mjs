// memento weight (nom conservé tel quel, 2026-09-21 — demande explicite de l'utilisateur : « je
// n'ai pas tres bien compris le role b [...] on pourrait le laisser en 'memento weight' »). Partie
// OUTILLAGE de ce rôle : persistance après coup et agrégation des échantillons de poids de contexte
// capturés en direct pendant une partie par `lib/memento-weight.ts::recordContextWeightSample()`
// (Moteur du jeu, câblé dans `lib/lia.ts::think()`) — les deux fichiers portent le même nom "memento
// weight" mais restent dans des mondes différents (lib/ = code de production, scripts/ = outillage
// de développement, jamais l'un n'importe l'autre, même frontière déjà en place entre
// `fingerprint()`/`keyLabel()` pour les clés Gemini).
//
// Extrait de `scripts/memento.mjs` le 2026-09-21 (demande explicite de l'utilisateur : « ces 2
// scripts ne doivent plus etre reunis dans le meme script, pour plus de clarté ») — avant cette
// séparation, ce code vivait mélangé avec la cohérence mécanique de la mémoire (memory-audit,
// aujourd'hui `scripts/memento.mjs`), deux sujets réellement différents malgré leur origine commune.
//
// Mesure OBSERVATIONNELLE, jamais utilisée pour modifier le prompt envoyé à Gemini (territoire
// exclusif de l'Article 8/0 de CLAUDE.md) — cf. docs/referentiel/memento-weight.md pour le détail
// complet.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { estimateTokens } from "./smart-conso-token.mjs";

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

// Exportée (2026-09-21, tâche #174 — demande explicite de l'utilisateur : « est-ce que l'équipe
// suivi conso récupère bien les données de memento weight ? ») : jusqu'ici ce fichier était écrit
// à chaque rapport KPI (persistContextWeightSamples()) mais jamais relu — un vrai journal
// « write-only », l'exact type d'écart que Doc-Report signale ailleurs pour d'autres outils.
// kpi-report.mjs l'utilise pour afficher une vraie moyenne multi-sessions à côté de la moyenne de
// la session en cours, jamais un second mécanisme de lecture divergent.
export function loadHistory() {
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
