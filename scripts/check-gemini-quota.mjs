// Outil de diagnostic quota Gemini (2026-09-18, créé après un vrai blocage rencontré en simulation
// intégrale : le quota gratuit journalier de gemini-flash-lite-latest — alias gemini-3.5-flash-lite,
// 500 requêtes/jour/modèle, GenerateRequestsPerDayPerProjectPerModel-FreeTier — s'est épuisé en
// pleine simulation). Le quota est PAR MODÈLE, pas global au projet : cet outil interroge une
// liste de modèles candidats avec un appel minimal (quelques tokens, coût négligeable même répété)
// et rapporte lesquels répondent réellement MAINTENANT, pour choisir en connaissance de cause un
// modèle de repli plutôt qu'à l'aveugle. Usage : `node scripts/check-gemini-quota.mjs`.
// N'écrit jamais dans .dev.vars tout seul — affiche une ligne GEMINI_FALLBACK_MODELS suggérée à
// copier soi-même, pour ne jamais modifier la configuration sans un geste explicite.
//
// Mémoire d'expérience (2026-09-18, demande explicite de l'utilisateur : « que cet outil devienne
// peu à peu une bombe d'efficacité grâce à tous les épisodes vécus » puis « je veux que l'outil
// ait une connaissance fine de la clef API de façon à pouvoir la dominer ») : chaque sonde
// alimente un historique local (`.gemini-key-health.json`, jamais committé), qui sert ensuite à
// ordonner les clés testées par fiabilité récente plutôt qu'à l'aveugle — portée strictement
// dev/diagnostic, jamais la vraie application en production (cf. gemini-key-health.mjs).
//
// Multi-fournisseurs (2026-09-18, demande explicite : « fais en sorte que cet outil puisse
// s'adapter à une autre clef API, identique ou totalement différente, fournie par un fournisseur
// différent, payante, etc ») : une entrée de `GEMINI_API_KEY_FALLBACKS` peut porter un préfixe
// `fournisseur:` (cf. api-providers.mjs) pour sonder une clé d'un fournisseur non-Gemini. Portée
// strictement diagnostic — voir la note affichée plus bas si une telle clé s'avère la plus
// prometteuse : elle ne remplace jamais un vrai repli de production tant qu'aucun câblage dédié
// n'existe (Article 0, validation qualité intégrale avant toute activation).
import { readFileSync } from "node:fs";
import { keyLabel, recordOutcome, orderKeysByExperience, summarize, describeKnownLessons } from "./gemini-key-health.mjs";
import { PROVIDERS, parseKeyEntry } from "./api-providers.mjs";

const devVars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
const key = (process.env.GEMINI_API_KEY ?? devVars.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] ?? "").trim();
if (!key) { console.error("GEMINI_API_KEY introuvable (ni process.env, ni .dev.vars)."); process.exit(1); }
const fallbackKeysRaw = (devVars.match(/^GEMINI_API_KEY_FALLBACKS=(.*)$/m)?.[1] ?? "").split(",").map(k => k.trim()).filter(Boolean);
// La clé principale est toujours Gemini (celle réellement appelée par lib/lia.ts/route.ts). Une
// entrée de repli sans préfixe reste Gemini (comportement historique inchangé) ; un préfixe
// `fournisseur:` explicite bascule sur un fournisseur différent, sonde uniquement.
const allKeys = orderKeysByExperience([{ provider: "gemini", key }, ...fallbackKeysRaw.map(parseKeyEntry)]);

const primary = process.env.GEMINI_MODEL ?? devVars.match(/^GEMINI_MODEL=(.*)$/m)?.[1]?.trim() ?? "gemini-flash-lite-latest";
// Ordre délibéré : d'abord les alias "latest" (suivent automatiquement la dernière version stable
// du même palier de coût, jamais un modèle preview) puis quelques generations explicites en repli,
// du moins cher au plus cher — jamais un modèle plus lourd que nécessaire par défaut (Article 8).
const candidates = [...new Set([primary, ...PROVIDERS.gemini.defaultCandidates])];

async function probe(entry, model, options) {
  const r = await PROVIDERS[entry.provider].probe(entry.key, model, options);
  return { model, ...r };
}

function defaultModelFor(entry) {
  return entry.provider === "gemini" ? primary : PROVIDERS[entry.provider].defaultCandidates[0];
}

// Si plusieurs clés sont configurées, on sonde d'abord chacune sur son propre modèle par défaut —
// suffisant pour savoir laquelle est actuellement viable, sans multiplier les appels — ordonnées
// par l'expérience accumulée (la plus récemment vue bonne en premier), jamais à l'aveugle.
if (allKeys.length > 1) {
  console.log(`Plusieurs clés configurées (${allKeys.length}) — sonde rapide de chacune sur son modèle par défaut...\n`);
  for (const entry of allKeys) {
    const model = defaultModelFor(entry);
    const r = await probe(entry, model);
    recordOutcome(entry, model, r.status === "OK" ? "OK" : r.status);
    const note = entry.provider === "gemini" ? "" : "  [fournisseur non-Gemini, diagnostic uniquement]";
    console.log(`${r.status.padEnd(14)} clé ${keyLabel(entry)} (${model})  ${r.ms}ms${r.detail ? "  — " + r.detail : ""}${note}`);
  }
  console.log();
}
const bestKey = orderKeysByExperience(allKeys)[0];
const bestKeyIsPrimary = bestKey.provider === "gemini" && bestKey.key === key;
if (allKeys.length > 1 && !bestKeyIsPrimary) console.log(`Clé la plus prometteuse d'après l'expérience accumulée : ${keyLabel(bestKey)} (pas la clé principale actuelle) — sonde des modèles avec celle-ci ci-dessous.\n`);
if (bestKey.provider !== "gemini") {
  console.log(`Note : la clé la plus prometteuse est un fournisseur non-Gemini (${bestKey.provider}). L'app (lib/lia.ts, route.ts) n'appelle que Gemini — ceci reste un diagnostic outillage, jamais un vrai repli de production tant qu'aucun câblage dédié n'existe (Article 0 : validation qualité intégrale avant toute activation).\n`);
}

const sweepCandidates = bestKey.provider === "gemini" ? candidates : PROVIDERS[bestKey.provider].defaultCandidates;
console.log(`Sonde ${sweepCandidates.length} modèles (clé ${keyLabel(bestKey)}, fournisseur ${bestKey.provider})...\n`);
const results = [];
for (const model of sweepCandidates) {
  const r = await probe(bestKey, model);
  // asKeySignal:false — sonde secondaire sur des modèles candidats (dont gemini-pro-latest,
  // presque toujours en quota serré) : ne doit jamais écraser le signal clé donné par la
  // sonde primaire ci-dessus sur le modèle par défaut, le modèle réellement utilisé par l'app.
  recordOutcome(bestKey, model, r.status === "OK" ? "OK" : r.status, false);
  results.push(r);
  console.log(`${r.status.padEnd(14)} ${model.padEnd(28)} ${r.ms}ms${r.detail ? "  — " + r.detail : ""}`);
}

// Sonde "lourde" (2026-09-19, demande explicite : « veille à ce que le diagnostic qualité soit
// bien poussé au maximum ») : reproduit la TAILLE approximative d'une vraie requête de production
// (systemInstruction + sortie JSON structurée), jamais le contenu réel — uniquement sur le modèle
// PRINCIPAL avec la clé la plus prometteuse, jamais sur toute la liste de candidats (coût
// négligeable mais non nul, Article 8). Raison documentée (CLAUDE.md, blocage du 2026-09-18) :
// une sonde légère peut répondre "OK" alors que la vraie charge de l'application, plus lourde,
// obtient un 429/503 pour la même clé/modèle au même instant — cette seconde sonde referme cet
// angle mort du diagnostic léger ci-dessus.
let heavyResult = null;
if (bestKey.provider === "gemini") {
  heavyResult = await probe(bestKey, primary, { heavy: true });
  recordOutcome(bestKey, primary, heavyResult.status === "OK" ? "OK" : heavyResult.status, false);
  console.log(`\nSonde lourde (taille comparable à un vrai tour) sur le modèle principal (${primary}, clé ${keyLabel(bestKey)}) :`);
  console.log(`${heavyResult.status.padEnd(14)} ${heavyResult.ms}ms${heavyResult.detail ? "  — " + heavyResult.detail : ""}`);
  const lightResult = results.find(r => r.model === primary);
  if (lightResult && lightResult.status === "OK" && heavyResult.status !== "OK") console.log("⚠️  Écart réel détecté : la sonde légère dit OK mais la sonde lourde (taille proche d'un vrai tour) échoue sur ce même modèle/clé — c'est exactement le cas déjà rencontré en simulation réelle (CLAUDE.md, 2026-09-18) ; ne pas se fier à la seule sonde légère pour ce modèle.");
}

console.log("\n" + "-".repeat(60));
if (bestKey.provider === "gemini") {
  const working = results.filter(r => r.status === "OK" && r.model !== primary).map(r => r.model);
  if (results.find(r => r.model === primary)?.status === "OK" && bestKeyIsPrimary) {
    console.log(`Le modèle principal (${primary}) répond normalement sur la clé principale — aucun contournement nécessaire.`);
  } else if (results.find(r => r.model === primary)?.status === "OK") {
    console.log(`Le modèle principal répond, mais seulement sur une clé de repli (${keyLabel(bestKey)}) — vérifie GEMINI_API_KEY_FALLBACKS.`);
  } else if (working.length) {
    console.log(`Modèle principal indisponible sur ${keyLabel(bestKey)}. Repli suggéré (à copier dans .dev.vars si besoin) :`);
    console.log(`GEMINI_FALLBACK_MODELS=${working.join(",")}`);
  } else {
    console.log(`Aucun modèle testé n'est disponible actuellement sur cette clé. Réessayer plus tard, ou vérifier le plan Google.`);
  }
} else {
  const okModels = results.filter(r => r.status === "OK").map(r => r.model);
  console.log(`Clé ${bestKey.provider} sondée avec succès sur : ${okModels.join(", ") || "aucun modèle"}. Rappel : ceci ne remplace pas une clé/modèle Gemini viable pour l'app tant qu'aucun câblage multi-fournisseur n'existe en production.`);
}

if (allKeys.length > 1) {
  console.log("\n" + "-".repeat(60));
  console.log("Expérience accumulée sur les clés (historique local, jamais committé) :");
  for (const s of summarize(allKeys)) {
    if (!s.known) { console.log(`  ${s.label} : aucune expérience enregistrée avant cette exécution.`); continue; }
    const fmt = (t) => t ? new Date(t).toLocaleString("fr-FR") : "jamais";
    console.log(`  ${s.label} : dernière tentative ${fmt(s.lastTouchedAt)} (${s.lastTouchedOutcome}) · ${s.episodeCount} épisode(s) connus${s.likelyStillDown ? " · probablement encore à plat" : ""}`);
  }
}

console.log("\n" + "-".repeat(60));
console.log("Ce qu'on a déjà compris ensemble sur ce blocage (historique curaté, détail complet dans CLAUDE.md) :");
for (const lesson of describeKnownLessons()) console.log(`  · ${lesson}`);
