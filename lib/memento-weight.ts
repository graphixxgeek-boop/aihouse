// memento weight (nom conservé tel quel, 2026-09-21 — l'ombrelle "MEMENTO" qui regroupait ce fichier
// et scripts/memento.mjs sous un même nom a été retirée de la documentation à la demande explicite
// de l'utilisateur, une fois son rôle mieux compris ; ce fichier garde son nom d'origine puisqu'il
// désignait déjà précisément ce rôle). Mesure OBSERVATIONNELLE du poids réel du contexte envoyé à
// Gemini par tour (JSON.stringify(context) dans lib/lia.ts::think()), jamais utilisée pour modifier
// ce contexte : territoire exclusif de l'Article 8/0 de CLAUDE.md, cette mesure ne fait qu'observer
// de l'extérieur, exactement la limite posée à l'investigation préalable (Article 19).
//
// PRÉCISION DE CATÉGORIE (2026-09-21, cf. docs/regles-de-travail.md « Moteur du jeu vs Outillage de
// travail ») : ce fichier vit dans le MOTEUR DU JEU (lib/), pas dans l'Outillage de travail
// (scripts/) — ce n'est donc PAS l'agent « memory-audit » lui-même (ça, c'est scripts/memento.mjs,
// un vrai Membre de l'équipe). C'est un fragment de code de PRODUIT, exactement la même catégorie
// que lib/gemini-keys.ts — jamais éligible à un badge, un blueprint ou une entrée PRESTATIONS. Son
// pendant outillage (persistance après coup + agrégation) vit dans scripts/memento-weight.mjs,
// jamais mélangé avec scripts/memento.mjs (rôle memory-audit, séparé le même soir pour plus de
// clarté — cf. docs/referentiel/memento-weight.md).
//
// Même patron que lib/gemini-keys.ts::episodes (mémoire best-effort au niveau du module JS, jamais
// écrite en base — Cloudflare Workers n'a pas de disque persistant —, cap dur à 200 entrées,
// exposée en lecture seule via l'API admin déjà protégée, persistée après coup par
// scripts/kpi-report.mjs, même chemin déjà validé pour le trafic réel des clés Gemini).
//
// Formule 4 caractères ≈ 1 token dupliquée volontairement depuis scripts/smart-conso-token.mjs::
// estimateTokens() plutôt qu'importée : lib/ est le code d'exécution du jeu, scripts/ l'outillage
// de développement, les deux mondes ne s'importent jamais l'un l'autre — même duplication
// délibérée déjà en place entre fingerprint() (ici, gemini-keys.ts) et keyLabel()
// (scripts/gemini-key-health.mjs), pour la même raison.
type ContextWeightSample = { actor: string; tokens: number; at: number };
const samples: ContextWeightSample[] = [];

export function recordContextWeightSample(actor: string, context: object): number {
    const tokens = Math.round(JSON.stringify(context ?? {}).length / 4);
    samples.push({ actor, tokens, at: Date.now() });
    if (samples.length > 200) samples.shift();
    return tokens;
}

export function getContextWeightSamples() {
    return [...samples];
}

export function __resetContextWeightSamplesForTests(): void {
    samples.length = 0;
}
