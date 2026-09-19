// SMART CONSO API — petite sœur de Smart Breaker (2026-09-19, cf.
// docs/smart-conso-api-blueprint.md et docs/referentiel/smart-conso-api.md). Rôle : un vrai canal
// de consultation, sollicité SYSTÉMATIQUEMENT par l'agent avant toute action qui va déclencher de
// vrais appels Gemini (simulation complète, check-spirit, diagnostic lourd) — jamais un journal
// consulté après coup. Lit l'historique PARTAGÉ avec Smart Breaker (.gemini-key-health.json,
// jamais un second fichier, Article 3) et un carnet de session local séparé (nature d'information
// différente : pas "qu'est-ce qui s'est passé côté API", mais "qu'est-ce que cet outil a conseillé
// et qu'en a-t-on fait").
//
// Frontière stricte (charte, section Smart Conso API) : cet outil ne suggère JAMAIS de modifier
// l'architecture de production (ex. la séparation des deux cerveaux) pour économiser des appels —
// son terrain est uniquement le RYTHME des actions de travail (simulations, diagnostics), jamais
// la conception du jeu lui-même.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HEALTH_PATH = fileURLToPath(new URL("../.gemini-key-health.json", import.meta.url));
const SESSION_PATH = fileURLToPath(new URL("../.smart-conso-session.json", import.meta.url));

// Seuil dur initial (2026-09-19, choisi par l'utilisateur comme premier seuil dur : "un nombre de
// lancements de simulation par session"). Faute d'une notion fiable de "session" (l'agent peut
// reprendre le même travail sur plusieurs heures, plusieurs jours), la fenêtre glissante de 6h est
// une approximation assumée et documentée comme telle (docs/referentiel/smart-conso-api.md) —
// jamais présentée comme une vraie limite de session. À valider explicitement avec l'utilisateur
// avant de le considérer vraiment "dur" (cf. blueprint, "validation humaine explicite").
export const HARD_THRESHOLDS = { simulation: { count: 2, windowHours: 6 } };

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function recentExhaustionRate(healthData, now, windowHours = 2) {
  const keys = healthData?.keys && typeof healthData.keys === "object" ? Object.values(healthData.keys) : [];
  const windowMs = windowHours * 60 * 60 * 1000;
  let total = 0, exhausted = 0;
  for (const key of keys) {
    for (const ep of key?.episodes ?? []) {
      if (typeof ep?.at !== "number" || now - ep.at > windowMs || now - ep.at < 0) continue;
      total++;
      if (ep.outcome === "QUOTA_ÉPUISÉ") exhausted++;
    }
  }
  if (total === 0) return undefined;
  return exhausted / total;
}

export function countRecentActions(sessionLog, actionType, now, windowHours) {
  const windowMs = windowHours * 60 * 60 * 1000;
  return (sessionLog?.actions ?? []).filter((a) => a.type === actionType && a.confirmed && now - a.at <= windowMs && now - a.at >= 0).length;
}

// Fonction pure centrale : à partir de l'historique partagé + du carnet de session, produit un
// avis structuré — jamais un blocage silencieux, toujours une raison explicite et une confiance.
export function assess(healthData, sessionLog, actionType, now) {
  const threshold = HARD_THRESHOLDS[actionType];
  const exhaustionRate = recentExhaustionRate(healthData, now, 2);
  const softWarning = typeof exhaustionRate === "number" && exhaustionRate >= 0.5;

  if (threshold) {
    const recentCount = countRecentActions(sessionLog, actionType, now, threshold.windowHours);
    if (recentCount >= threshold.count) {
      return {
        verdict: "seuil_dur",
        message: `Seuil dur atteint : ${recentCount} action(s) "${actionType}" déjà confirmée(s) dans les ${threshold.windowHours} dernières heures (limite : ${threshold.count}). Ne pas lancer sans validation explicite de l'utilisateur.`,
        exhaustionRate,
      };
    }
  }
  if (softWarning) {
    return {
      verdict: "avertissement_souple",
      message: `Quota tendu récemment : ${Math.round(exhaustionRate * 100)}% des tentatives des 2 dernières heures étaient en quota épuisé. Négociable avec un bon argument (ex. reprise d'une simulation interrompue), mais la prudence est recommandée.`,
      exhaustionRate,
    };
  }
  return { verdict: "ok", message: "Rien à signaler : pas de seuil dur atteint, pas de tension de quota récente notable.", exhaustionRate };
}

export function recordAction(actionType, now, confirmed = true) {
  const log = loadJson(SESSION_PATH, { actions: [] });
  log.actions = (log.actions ?? []).slice(-200);
  log.actions.push({ type: actionType, at: now, confirmed });
  writeFileSync(SESSION_PATH, JSON.stringify(log, null, 1));
  return log;
}

function main() {
  const actionType = process.argv[2];
  if (!actionType) {
    console.log("Usage: node scripts/smart-conso-api.mjs <type-d'action> [--confirm]");
    console.log("Types connus : simulation, check-spirit, diagnostic");
    process.exit(1);
  }
  const now = Date.now();
  const healthData = loadJson(HEALTH_PATH, { keys: {} });
  const sessionLog = loadJson(SESSION_PATH, { actions: [] });
  const advice = assess(healthData, sessionLog, actionType, now);
  console.log("=== SMART CONSO API — avis avant action ===\n");
  console.log(`Action envisagée : ${actionType}`);
  console.log(`Avis : [${advice.verdict}] ${advice.message}`);
  if (typeof advice.exhaustionRate === "number") console.log(`(taux d'épuisement observé sur 2h : ${Math.round(advice.exhaustionRate * 100)}%)`);
  if (process.argv.includes("--confirm")) {
    recordAction(actionType, now, true);
    console.log("\nAction confirmée et enregistrée dans le carnet de session.");
  } else {
    console.log("\n(Avis seul — relancer avec --confirm une fois la décision prise, pour que le carnet de session reste exact.)");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
