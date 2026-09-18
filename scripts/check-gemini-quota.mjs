// Outil de diagnostic quota Gemini (2026-09-18, créé après un vrai blocage rencontré en simulation
// intégrale : le quota gratuit journalier de gemini-flash-lite-latest — alias gemini-3.5-flash-lite,
// 500 requêtes/jour/modèle, GenerateRequestsPerDayPerProjectPerModel-FreeTier — s'est épuisé en
// pleine simulation). Le quota est PAR MODÈLE, pas global au projet : cet outil interroge une
// liste de modèles candidats avec un appel minimal (quelques tokens, coût négligeable même répété)
// et rapporte lesquels répondent réellement MAINTENANT, pour choisir en connaissance de cause un
// modèle de repli plutôt qu'à l'aveugle. Usage : `node scripts/check-gemini-quota.mjs`.
// N'écrit jamais dans .dev.vars tout seul — affiche une ligne GEMINI_FALLBACK_MODELS suggérée à
// copier soi-même, pour ne jamais modifier la configuration sans un geste explicite.
import { readFileSync } from "node:fs";

const devVars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
const key = (process.env.GEMINI_API_KEY ?? devVars.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] ?? "").trim();
if (!key) { console.error("GEMINI_API_KEY introuvable (ni process.env, ni .dev.vars)."); process.exit(1); }

const primary = process.env.GEMINI_MODEL ?? devVars.match(/^GEMINI_MODEL=(.*)$/m)?.[1]?.trim() ?? "gemini-flash-lite-latest";
// Ordre délibéré : d'abord les alias "latest" (suivent automatiquement la dernière version stable
// du même palier de coût, jamais un modèle preview) puis quelques generations explicites en repli,
// du moins cher au plus cher — jamais un modèle plus lourd que nécessaire par défaut (Article 8).
const candidates = [...new Set([primary, "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-pro-latest"])];

async function probe(model) {
  const started = Date.now();
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ok" }] }], generationConfig: { maxOutputTokens: 5 } }),
    });
    const ms = Date.now() - started;
    if (r.status === 200) return { model, status: "OK", ms };
    const body = await r.json().catch(() => ({}));
    const message = body?.error?.message ?? "";
    if (r.status === 429) {
      const quotaId = body?.error?.details?.find(d => d.violations)?.violations?.[0]?.quotaId;
      return { model, status: "QUOTA_ÉPUISÉ", ms, detail: quotaId ?? message.slice(0, 80) };
    }
    return { model, status: `HTTP ${r.status}`, ms, detail: message.slice(0, 100) };
  } catch (e) {
    return { model, status: "ERREUR_RÉSEAU", ms: Date.now() - started, detail: e.message };
  }
}

console.log(`Sonde ${candidates.length} modèles (modèle principal actuel : ${primary})...\n`);
const results = [];
for (const model of candidates) {
  const r = await probe(model);
  results.push(r);
  console.log(`${r.status.padEnd(14)} ${model.padEnd(28)} ${r.ms}ms${r.detail ? "  — " + r.detail : ""}`);
}

const working = results.filter(r => r.status === "OK" && r.model !== primary).map(r => r.model);
console.log("\n" + "-".repeat(60));
if (results.find(r => r.model === primary)?.status === "OK") {
  console.log(`Le modèle principal (${primary}) répond normalement — aucun contournement nécessaire.`);
} else if (working.length) {
  console.log(`Modèle principal indisponible. Repli suggéré (à copier dans .dev.vars si besoin) :`);
  console.log(`GEMINI_FALLBACK_MODELS=${working.join(",")}`);
} else {
  console.log(`Aucun modèle testé n'est disponible actuellement. Réessayer plus tard, ou vérifier le plan Google.`);
}
