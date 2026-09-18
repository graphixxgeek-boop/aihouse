// Registre des fournisseurs d'API sondables par l'outil de diagnostic (2026-09-18, demande
// explicite de l'utilisateur : « fais en sorte que cet outil puisse s'adapter à une autre clef
// API, identique ou totalement différente, c'est à dire fournie par un fournisseur différent,
// payante, etc »).
//
// Portée strictement diagnostic (check-gemini-quota.mjs), jamais la production : ajouter un
// fournisseur ici ne branche RIEN dans le jeu réel. `lib/lia.ts` et `route.ts` continuent
// d'appeler exclusivement l'API Gemini, avec un prompt et un schéma JSON de sortie qui lui sont
// propres — un vrai fournisseur alternatif en production (réponses différentes, pas de garantie
// de respecter l'esprit des personnages, Article 0) resterait un chantier à part entière, soumis
// à la même validation qualité intégrale que tout changement de modèle, jamais une conséquence
// automatique du fait d'avoir appris à sonder ce fournisseur ici. Rassurant à vérifier : une clé
// d'un fournisseur non-Gemini glissée par erreur dans `GEMINI_API_KEY_FALLBACKS` ne casse rien en
// production — l'app l'essaie contre l'endpoint Gemini, obtient un 400/401/403, et passe à la clé
// suivante (règle déjà en place, cf. CLAUDE.md Article 18 "Repli de clé").
//
// Chaque fournisseur expose : `probe(key, model)` → { status, ms, detail? } dans le MÊME format
// que le reste de l'outil ("OK" / "QUOTA_ÉPUISÉ" / "HTTP xxx" / "ERREUR_RÉSEAU"), et
// `defaultCandidates` (modèles à sonder par défaut pour ce fournisseur, du moins cher au plus
// cher — Article 8, même si ce fournisseur n'est pas la production actuelle).

async function probeGemini(key, model) {
  const started = Date.now();
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ok" }] }], generationConfig: { maxOutputTokens: 5 } }),
    });
    const ms = Date.now() - started;
    if (r.status === 200) return { status: "OK", ms };
    const body = await r.json().catch(() => ({}));
    const message = body?.error?.message ?? "";
    if (r.status === 429) {
      const quotaId = body?.error?.details?.find(d => d.violations)?.violations?.[0]?.quotaId;
      return { status: "QUOTA_ÉPUISÉ", ms, detail: quotaId ?? message.slice(0, 80) };
    }
    return { status: `HTTP ${r.status}`, ms, detail: message.slice(0, 100) };
  } catch (e) {
    return { status: "ERREUR_RÉSEAU", ms: Date.now() - started, detail: e.message };
  }
}

// Fournisseur payant/différent fourni en exemple concret (OpenAI) : appel minimal (1 token en
// sortie), coût négligeable même sondé souvent. Sert d'illustration que le format de clé,
// d'endpoint et de réponse peuvent être totalement différents de Gemini sans que l'outil ait
// besoin d'être réécrit — juste un nouveau fournisseur ajouté à ce registre.
async function probeOpenAI(key, model) {
  const started = Date.now();
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "ok" }], max_tokens: 1 }),
    });
    const ms = Date.now() - started;
    if (r.status === 200) return { status: "OK", ms };
    const body = await r.json().catch(() => ({}));
    const message = body?.error?.message ?? "";
    if (r.status === 429) return { status: "QUOTA_ÉPUISÉ", ms, detail: message.slice(0, 80) };
    return { status: `HTTP ${r.status}`, ms, detail: message.slice(0, 100) };
  } catch (e) {
    return { status: "ERREUR_RÉSEAU", ms: Date.now() - started, detail: e.message };
  }
}

export const PROVIDERS = {
  gemini: {
    probe: probeGemini,
    defaultCandidates: ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-pro-latest"],
  },
  openai: {
    probe: probeOpenAI,
    defaultCandidates: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"],
  },
};

// Une entrée `.dev.vars` sans préfixe reste une clé Gemini (comportement historique inchangé,
// zéro migration à faire sur les clés déjà configurées). Un préfixe `fournisseur:` explicite
// bascule sur un autre fournisseur du registre ci-dessus ; un préfixe inconnu est traité comme
// faisant partie de la clé elle-même plutôt que de planter (une clé peut légitimement contenir
// des deux-points selon le fournisseur).
export function parseKeyEntry(raw) {
  const m = /^([a-z0-9_-]+):(.+)$/i.exec(raw);
  if (m && PROVIDERS[m[1].toLowerCase()]) return { provider: m[1].toLowerCase(), key: m[2] };
  return { provider: "gemini", key: raw };
}
