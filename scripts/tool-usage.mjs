// COMPTEUR D'USAGE DES OUTILS (tâche #166, 2026-09-21) — capturé en conception le 2026-09-21T01:45Z
// (docs/suivi #230), calibré le même soir : cumul PERMANENT depuis le début du projet (jamais remis
// à zéro par session), nourrit la future CASSANDRA-RH pour juger si un outil a toujours sa place.
//
// Source de la donnée, honnêteté déjà actée pour SMART-CONSO-TOKEN et réutilisée ici à l'identique :
// un JOURNAL AUTO-DÉCLARÉ par l'agent lui-même, jamais vérifiable mécaniquement (aucune trace
// externe indépendante ne prouve qu'un outil a réellement été sollicité) — la discipline "solliciter
// réellement les outils, le dire explicitement" (docs/regles-de-travail.md) EST la seule protection.
//
// Deux enrichissements ajoutés par l'utilisateur en calibrant (2026-09-21) : (1) l'ORIGINE de chaque
// sollicitation (spontanée / demandée / automatique post-commit), pour distinguer un outil qui tourne
// UNIQUEMENT parce qu'il est automatique d'un outil réellement choisi ; (2) si l'appel a produit une
// vraie trouvaille (`foundSomething`), pour croiser "souvent utilisé" et "souvent UTILE" — même
// discipline anti-vanity-metric que ALWAYS-NEW-CODE/THE-DEEP-READER (rereadPerformance()).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HISTORY_PATH = fileURLToPath(new URL("../.tool-usage-history.json", import.meta.url));

// "cli_direct" (2026-09-21, correctif demandé explicitement après un audit honnête : le compteur
// affichait ZÉRO sollicitation réelle pour tout le paysage malgré plusieurs vrais lancements d'outils
// la même soirée — cause racine : aucun `main()` de CLI n'appelait jamais recordToolUsage(), l'agent
// devait s'en souvenir séparément à chaque fois et ne l'a jamais fait). Origine honnête, distincte des
// deux autres : le script SAIT qu'il a été lancé via sa propre ligne de commande, mais ne peut jamais
// savoir POURQUOI (spontané ou demandé — un jugement que seul l'agent qui pilote peut porter) —
// jamais fabriquer cette distinction à l'aveugle. Câblée directement dans le main()/point d'entrée de
// chaque outil réel (recordCliUsage() ci-dessous), best-effort, jamais bloquant.
export const USAGE_ORIGINS = ["spontane", "demande", "automatique_post_commit", "cli_direct"];

// Exportée (2026-09-21) pour que le-coordinateur.mjs::formatBadgeCeremonyAnnouncement() la
// réutilise verbatim plutôt que d'écrire une 4e copie identique — CLONE-HUNTER venait de trouver
// cette exacte duplication (déjà présente 3 fois : ici, smart-conso-api.mjs, smart-conso-token.mjs)
// le soir même ; jamais rouvrir un cas déjà signalé sous une forme légèrement différente (Article 3).
export function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

// Enregistre une sollicitation RÉELLE d'un outil. `toolSlug` : identifiant stable de l'outil (même
// convention que slugifyAgentName() de le-coordinateur.mjs, ex. "argus", "the-final-judge") — jamais
// deviné ici, toujours fourni par l'appelant qui sait déjà quel outil il vient de solliciter.
export function recordToolUsage(toolSlug, origin, now = Date.now(), foundSomething = undefined) {
  if (!toolSlug) throw new Error("recordToolUsage: toolSlug obligatoire — un usage ne peut jamais être anonyme.");
  if (!USAGE_ORIGINS.includes(origin)) throw new Error(`recordToolUsage: origin inconnue "${origin}" — attendu l'une de ${USAGE_ORIGINS.join(", ")}`);
  const history = loadJson(HISTORY_PATH, { events: [] });
  history.events = history.events ?? [];
  history.events.push({ toolSlug, origin, at: now, ...(typeof foundSomething === "boolean" ? { foundSomething } : {}) });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 1));
  return history;
}

// recordCliUsage() — le point d'appel unique câblé dans le main()/point d'entrée de chaque outil
// réel (2026-09-21). Jamais l'appelant lui-même ne construit un try/catch : centralisé une seule
// fois ici pour qu'un échec d'écriture (disque plein, permissions) ne bloque JAMAIS la vraie sortie
// de l'outil, qui reste l'objectif premier — ce compteur reste un bonus d'observation, jamais une
// dépendance du fonctionnement réel (même discipline que lib/memento-weight.ts).
export function recordCliUsage(toolSlug, now = Date.now()) {
  try {
    recordToolUsage(toolSlug, "cli_direct", now);
  } catch { /* best-effort, jamais bloquant — cf. commentaire ci-dessus */ }
}

// Statistiques cumulées, jamais remises à zéro (décision explicite de l'utilisateur : le total
// permanent montre la vraie utilité SUR LA DURÉE, jamais faussé par une session courte ou longue).
export function toolUsageStats(history, toolSlug) {
  const events = (history?.events ?? []).filter((e) => e.toolSlug === toolSlug);
  if (!events.length) return { total: 0, byOrigin: {}, foundSomethingCount: 0, foundSomethingRate: undefined };
  const byOrigin = {};
  for (const origin of USAGE_ORIGINS) byOrigin[origin] = events.filter((e) => e.origin === origin).length;
  const withVerdict = events.filter((e) => typeof e.foundSomething === "boolean");
  const foundSomethingCount = withVerdict.filter((e) => e.foundSomething).length;
  return {
    total: events.length,
    byOrigin,
    foundSomethingCount,
    foundSomethingRate: withVerdict.length ? Math.round((foundSomethingCount / withVerdict.length) * 1000) / 10 : undefined,
  };
}

// Un outil "jamais réellement sollicité" (utile à Doc-Report/#165 et à la future CASSANDRA-RH) :
// aucun événement d'usage n'existe pour lui alors qu'il fait bien partie de la liste des outils
// connus — jamais deviné, toujours comparé à une vraie liste fournie par l'appelant.
export function toolsNeverUsed(history, knownToolSlugs) {
  const used = new Set((history?.events ?? []).map((e) => e.toolSlug));
  return knownToolSlugs.filter((slug) => !used.has(slug));
}

function main() {
  const [, , toolSlug, origin, foundSomethingArg] = process.argv;
  if (!toolSlug || !origin) {
    console.log(`Usage : node scripts/tool-usage.mjs <toolSlug> <${USAGE_ORIGINS.join("|")}> [confirme_utile|sans_trouvaille]`);
    process.exit(1);
  }
  const foundSomething = foundSomethingArg === "confirme_utile" ? true : foundSomethingArg === "sans_trouvaille" ? false : undefined;
  recordToolUsage(toolSlug, origin, Date.now(), foundSomething);
  const history = loadJson(HISTORY_PATH, { events: [] });
  console.log(`Enregistré : ${toolSlug} (${origin}).`);
  console.log(JSON.stringify(toolUsageStats(history, toolSlug), null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
