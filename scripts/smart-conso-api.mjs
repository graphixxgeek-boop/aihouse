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

// --- Garde-fou de fiabilité (2026-09-19, demande explicite de l'utilisateur : « pense à consulter
// smart conso api pour la prochaine fois, fiabilise stp »). Trouvaille réelle qui a motivé cette
// fonction : le carnet de session (.smart-conso-session.json) n'avait jamais été créé — l'agent
// n'a jamais réellement consulté cet outil avec --confirm avant une action coûteuse, y compris
// avant le lancement d'une simulation fraîche ce jour-là. Se souvenir de le faire n'est pas fiable
// (même discipline manquée que pour docs/suivi/) : ce garde-fou compare l'activité RÉELLE déjà
// enregistrée dans la source partagée à ce que le carnet de session dit avoir été confirmé, et
// signale tout écart — jamais un jugement sur le contenu de l'action, seulement sur l'absence de
// consultation avant une vraie salve d'appels.
//
// Limite honnête, comme le reste de ce paysage : ce garde-fou ne sait pas distinguer une salve de
// simulation d'une salve de diagnostic (les deux produisent beaucoup d'épisodes rapprochés) — il
// signale seulement qu'AUCUNE action, de quelque type que ce soit, n'a été confirmée avant une
// vraie salve d'activité. Une lecture humaine reste nécessaire pour juger si c'était le bon type
// d'action ou un oubli pur et simple.
export function findUnconfirmedBursts(healthData, sessionLog, { burstWindowMinutes = 15, burstThreshold = 4, lookbackMinutes = 30 } = {}) {
  const episodes = [];
  for (const key of Object.values(healthData?.keys ?? {})) {
    for (const ep of key?.episodes ?? []) {
      if (typeof ep?.at === "number") episodes.push(ep.at);
    }
  }
  episodes.sort((a, b) => a - b);
  const burstWindowMs = burstWindowMinutes * 60000;
  const lookbackMs = lookbackMinutes * 60000;
  const confirmedTimes = (sessionLog?.actions ?? []).filter((a) => a?.confirmed && typeof a?.at === "number").map((a) => a.at);

  const bursts = [];
  let i = 0;
  while (i < episodes.length) {
    let j = i;
    while (j < episodes.length && episodes[j] - episodes[i] <= burstWindowMs) j++;
    const count = j - i;
    if (count >= burstThreshold) {
      const burstStart = episodes[i];
      const hasConfirmation = confirmedTimes.some((t) => t <= burstStart && burstStart - t <= lookbackMs);
      if (!hasConfirmation) bursts.push({ start: burstStart, count });
      i = j;
    } else {
      i++;
    }
  }
  return bursts;
}

// Capacité de scan (2026-09-20, demande explicite de l'utilisateur : « est-ce que smart conso api
// peut réaliser un scan aussi ? [...] si non, il faut l'ajouter : c'est utile de savoir scanner »).
// Domaine différent de SMART-CONSO-TOKEN : jamais la taille de documents/texte, toujours le RYTHME
// des appels réels à l'API régulée (Article 22) — cohérent avec la frontière déjà posée avec
// l'Article 8 (jamais l'architecture ou le contenu des prompts, toujours le rythme). Repère des
// SCHÉMAS RÉELS dans l'historique déjà accumulé (`.gemini-key-health.json` partagé avec Smart
// Breaker, `.smart-conso-session.json` propre à cet outil) — jamais un jugement sur le code du jeu
// lui-même, seulement sur la façon dont l'agent a réellement sollicité l'API par le passé.
export function scanConsumptionPatterns(healthData, sessionLog, now) {
  const findings = [];
  const exhaustionRate = recentExhaustionRate(healthData, now, 2);
  if (typeof exhaustionRate === "number" && exhaustionRate >= 0.5) {
    findings.push({
      constat: `Taux d'épuisement élevé sur les 2 dernières heures (${Math.round(exhaustionRate * 100)}%).`,
      piste: "Espacer les prochaines actions coûteuses plutôt que d'insister sur le même modèle/la même clé — consulter check-gemini-quota.mjs avant de relancer quoi que ce soit.",
    });
  }

  // Repère un relancement trop rapproché après un épisode d'épuisement confirmé — schéma réel
  // rencontré le 2026-09-18/19 (une simulation relancée immédiatement après un blocage total a
  // épuisé les modèles de repli en quelques minutes).
  const episodes = [];
  for (const key of Object.values(healthData?.keys ?? {})) {
    for (const ep of key?.episodes ?? []) if (typeof ep?.at === "number") episodes.push(ep);
  }
  episodes.sort((a, b) => a.at - b.at);
  const confirmedActions = (sessionLog?.actions ?? []).filter((a) => a?.confirmed && typeof a?.at === "number").sort((a, b) => a.at - b.at);
  let quickRelaunches = 0;
  for (const ep of episodes) {
    if (ep.outcome !== "QUOTA_ÉPUISÉ") continue;
    const relaunch = confirmedActions.find((a) => a.at > ep.at && a.at - ep.at <= 10 * 60 * 1000);
    if (relaunch) quickRelaunches++;
  }
  if (quickRelaunches > 0) {
    findings.push({
      constat: `${quickRelaunches} relancement(s) confirmé(s) dans les 10 minutes suivant un épisode d'épuisement réel.`,
      piste: "Un quota journalier épuisé ne revient pas en quelques minutes (le retryDelay de Google est trompeur pour ce cas) — attendre une confirmation de check-gemini-quota.mjs avant de relancer, jamais réessayer à l'aveugle.",
    });
  }

  return findings;
}

function reportUnconfirmedBursts(healthData, sessionLog) {
  const bursts = findUnconfirmedBursts(healthData, sessionLog);
  console.log("\n=== Garde-fou fiabilité — salves d'activité jamais confirmées ===\n");
  if (!bursts.length) {
    console.log("Aucune salve d'activité récente sans consultation préalable — discipline respectée.");
    return;
  }
  for (const b of bursts) console.log(`⚠️ ${new Date(b.start).toISOString()} : ${b.count} appel(s) rapprochés sans aucune action confirmée dans les 30 min précédentes.`);
  console.log("\n→ Limite honnête : ce garde-fou ne sait pas si c'était une simulation ou un diagnostic — seulement qu'aucune consultation n'a précédé cette activité.");
}

function main() {
  const actionType = process.argv[2];
  const now = Date.now();
  const healthData = loadJson(HEALTH_PATH, { keys: {} });
  const sessionLog = loadJson(SESSION_PATH, { actions: [] });

  if (actionType === "scan") {
    console.log("=== SMART CONSO API — scan des schémas de consommation réels ===\n");
    const findings = scanConsumptionPatterns(healthData, sessionLog, now);
    if (!findings.length) {
      console.log("Aucun schéma coûteux repéré dans l'historique réel accumulé.");
    } else {
      for (const f of findings) console.log(`⚠️ ${f.constat}\n   → ${f.piste}\n`);
    }
    reportUnconfirmedBursts(healthData, sessionLog);
    return;
  }

  if (!actionType) {
    console.log("Usage: node scripts/smart-conso-api.mjs <type-d'action|scan> [--confirm]");
    console.log("Types connus : simulation, check-spirit, diagnostic, scan");
    reportUnconfirmedBursts(healthData, sessionLog);
    process.exit(1);
  }
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
  reportUnconfirmedBursts(healthData, sessionLog);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
