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

// Corps "léger" (défaut) : un ping minimal, quelques tokens, coût négligeable même répété sur
// tous les modèles candidats (Article 8). Corps "lourd" (heavy:true, cf. plus bas) : reproduit la
// TAILLE approximative d'un vrai tour de jeu (systemInstruction conséquente + sortie JSON
// structurée), jamais le prompt réel — juste un ordre de grandeur comparable. Raison documentée
// (CLAUDE.md, blocage du 2026-09-18) : Google peut répondre différemment (429 vs 503, ou même OK
// vs épuisé) selon le POIDS de la requête pour la MÊME clé/modèle au même instant — une sonde
// uniquement légère peut donc donner un faux "OK" qui ne se vérifie pas avec la vraie charge de
// l'application. Ne sonder ainsi que le modèle principal, jamais toute la liste de candidats :
// plus coûteux qu'un ping, à ne pas multiplier sans raison (Article 8).
const heavyFiller = "Contexte de scène fictif, uniquement pour approcher la taille réelle d'une requête de production sans en reproduire le contenu propriétaire. ".repeat(24);
function requestBody(model, heavy) {
  if (!heavy) return { contents: [{ role: "user", parts: [{ text: "ok" }] }], generationConfig: { maxOutputTokens: 5 } };
  return {
    systemInstruction: { parts: [{ text: heavyFiller }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify({ probe: true, note: "sonde de diagnostic, taille comparable à un vrai tour" }) }] }],
    generationConfig: { maxOutputTokens: 200, responseMimeType: "application/json", responseJsonSchema: { type: "object", additionalProperties: false, properties: { ok: { type: "boolean" } }, required: ["ok"] } },
  };
}
// Une réponse HTTP 200 ne garantit pas un contenu exploitable : un filtre de sécurité ou une
// coupure prématurée peut renvoyer 200 sans le moindre texte utilisable (candidates vide, ou
// content.parts absent) — l'application plante alors au moment de lire cette réponse malgré le
// statut 200. Distinguer ce cas ("OK_VIDE") d'un vrai succès évite de rapporter un faux positif.
function inspectBody(body) {
  const candidate = body?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (typeof text === "string" && text.length > 0) return { status: "OK" };
  return { status: "OK_VIDE", detail: candidate?.finishReason ? `finishReason=${candidate.finishReason}` : "réponse 200 sans contenu exploitable" };
}
async function probeGemini(key, model, { heavy = false } = {}) {
  const started = Date.now();
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody(model, heavy)),
    });
    const ms = Date.now() - started;
    const body = await r.json().catch(() => ({}));
    if (r.status === 200) { const inspected = inspectBody(body); return { ...inspected, ms }; }
    const message = body?.error?.message ?? "";
    if (r.status === 429) {
      const quotaId = body?.error?.details?.find(d => d.violations)?.violations?.[0]?.quotaId;
      // retryDelay est trompeur pour un épuisement de quota JOURNALIER (leçon du 2026-09-18,
      // CLAUDE.md) : affiché tel quel, mais jamais interprété comme "redevient disponible après
      // ce délai" par l'outil lui-même.
      const retryDelay = body?.error?.details?.find(d => d.retryDelay)?.retryDelay;
      return { status: "QUOTA_ÉPUISÉ", ms, detail: (quotaId ?? message.slice(0, 80)) + (retryDelay ? ` (retryDelay Google: ${retryDelay}, souvent trompeur pour un quota journalier)` : "") };
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
