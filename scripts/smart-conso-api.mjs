// ICEBERG: membre
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
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, imprimerPlanDaction } from "./report-template.mjs";
import { loadJson } from "./lib-json.mjs";
import { planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

const HEALTH_PATH = fileURLToPath(new URL("../.gemini-key-health.json", import.meta.url));
const SESSION_PATH = fileURLToPath(new URL("../.smart-conso-session.json", import.meta.url));

// Seuil dur initial (2026-09-19, choisi par l'utilisateur comme premier seuil dur : "un nombre de
// lancements de simulation par session"). Faute d'une notion fiable de "session" (l'agent peut
// reprendre le même travail sur plusieurs heures, plusieurs jours), la fenêtre glissante de 6h est
// une approximation assumée et documentée comme telle (docs/referentiel/smart-conso-api.md) —
// jamais présentée comme une vraie limite de session. À valider explicitement avec l'utilisateur
// avant de le considérer vraiment "dur" (cf. blueprint, "validation humaine explicite").
export const HARD_THRESHOLDS = { simulation: { count: 2, windowHours: 6 } };

// loadJson : copie privée retirée le 2026-09-23 (tâche #216), remplacée par l'import partagé
// en tête de fichier. Le `existsSync` qu'elle faisait en plus ne changeait rien : le try/catch
// attrape déjà le fichier absent.

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
// fraicheurDeLHistorique() — DEPUIS QUAND CE QUE JE LIS EST-IL VRAI ? (2026-09-28, tâche #1091).
//
// LE CONSTAT QUI L'A FAIT NAÎTRE, et il est net : le 2026-09-28, check-spirit a passé QUARANTE
// appels réels au modèle (deux passages de vingt, dont un entièrement bloqué). `.gemini-key-health.json`
// n'a enregistré AUCUN épisode : son dernier date du 2026-09-23, cinq jours plus tôt. Et pendant
// ce temps, cet outil répondait « ok, pas de tension de quota récente notable » — pendant que
// vingt provocations sur vingt se faisaient refuser par le moteur.
//
// L'AVIS N'ÉTAIT PAS FAUX PAR SON CALCUL, il était faux par son ÂGE : il n'y a effectivement aucune
// tension récente ENREGISTRÉE, parce que plus rien ne s'enregistre. La cause est documentée dans
// `lib/gemini-keys.ts` : le runtime garde ses épisodes EN MÉMOIRE et compte sur « un outil
// EXTÉRIEUR » pour les persister après une session. Cet outil n'existe pas. Le registre ne contient
// donc que les sondages de `check-gemini-quota.mjs`, jamais le trafic réel — alors que le
// commentaire de ce fichier-ci le présente comme « le vrai trafic API, une preuve INDÉPENDANTE ».
//
// POURQUOI ÇA COMPTE PLUS QU'UN CHIFFRE FAUX : l'Article 22 rend la consultation de cet outil
// OBLIGATOIRE avant toute action coûteuse. Une obligation qui s'appuie sur une donnée périmée en
// silence n'est plus une protection, c'est un rituel. Et un « ok » est exactement le verdict qu'on
// ne re-vérifie jamais.
//
// CE QUI EST FAIT ICI, ET CE QUI NE L'EST PAS. La passerelle qui persisterait le vrai trafic touche
// le runtime du produit : elle se propose, elle ne se pose pas une nuit (tâche ouverte). Ce qui est
// fait est la seule chose honnête en attendant : **l'avis DIT l'âge de ce sur quoi il se prononce**.
// Un lecteur peut alors juger ; il ne le pouvait pas.
export const AGE_SUSPECT_HEURES = 24;

export function fraicheurDeLHistorique(healthData, now = Date.now()) {
  const ats = [];
  for (const cle of Object.values(healthData?.keys ?? {})) {
    for (const e of cle?.episodes ?? []) if (typeof e?.at === "number") ats.push(e.at);
  }
  if (!ats.length) {
    return { mesurable: false, pourquoi: "l'historique des clés est vide : cet avis ne s'appuie sur AUCUNE donnée de trafic, ce qui n'est pas la même chose qu'un trafic sans incident" };
  }
  const dernier = Math.max(...ats);
  const heures = Math.max(0, (now - dernier) / 3_600_000);
  return {
    mesurable: true,
    dernier,
    heures: Math.round(heures),
    perime: heures > AGE_SUSPECT_HEURES,
    pourquoi: heures > AGE_SUSPECT_HEURES
      ? `le dernier épisode enregistré date de ${Math.round(heures)} h : cet avis porte sur un historique PÉRIMÉ, pas sur l'état d'aujourd'hui. Le registre n'enregistre que les sondages de check-gemini-quota.mjs — le trafic réel de l'application vit en mémoire et personne ne le persiste (cf. lib/gemini-keys.ts)`
      : `dernier épisode enregistré il y a ${Math.round(heures)} h`,
  };
}

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

// L'ÂGE ACCOMPAGNE TOUJOURS L'AVIS, jamais séparément (2026-09-28, tâche #1091) : un « ok » est
// exactement le verdict qu'on ne re-vérifie jamais, donc c'est là que l'âge doit être imprimé.
export function lignesDeFraicheur(healthData, now = Date.now()) {
  const f = fraicheurDeLHistorique(healthData, now);
  if (!f.mesurable) return [`⚪ PAS MESURÉ — ${f.pourquoi}.`];
  if (!f.perime) return [`   (historique : ${f.pourquoi})`];
  return [
    `⚠️ AVIS FONDÉ SUR UN HISTORIQUE PÉRIMÉ — ${f.pourquoi}.`,
    "   Un « ok » rendu là-dessus dit « rien d'enregistré », jamais « l'API répondra ». L'Article 22 rend cette consultation obligatoire : une obligation adossée à une donnée périmée en silence est un rituel, plus une protection.",
  ];
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
// Cœur partagé de la détection de salves (2026-09-20, extrait pour nourrir aussi
// `burstComplianceScore()` ci-dessous, jamais une seconde boucle de détection dupliquée — même
// règle anti-doublon que le reste de ce paysage, §7ter). Retourne TOUTES les salves détectées
// (confirmées et non confirmées), chacune marquée `confirmed` — `findUnconfirmedBursts()` en garde
// le comportement externe exact d'avant (ne retourne que les non confirmées), jamais un changement
// de signature qui casserait ses appelants existants.
function detectBurstWindows(healthData, sessionLog, { burstWindowMinutes = 15, burstThreshold = 4, lookbackMinutes = 30 } = {}) {
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
      bursts.push({ start: burstStart, count, confirmed: hasConfirmation });
      i = j;
    } else {
      i++;
    }
  }
  return bursts;
}

export function findUnconfirmedBursts(healthData, sessionLog, opts = {}) {
  return detectBurstWindows(healthData, sessionLog, opts).filter((b) => !b.confirmed).map(({ start, count }) => ({ start, count }));
}

// Taux de conformité réel (2026-09-20, demande explicite de l'utilisateur : nourrir la famille KPI
// "Smart Conso" du tableau de bord avec un vrai "taux de respect de la consigne", jamais un chiffre
// inventé). Contrairement à l'historique de SMART-CONSO-TOKEN (qui ne peut voir QUE les
// consultations réellement faites — biais de survivance, une non-consultation ne laisse aucune
// trace de son côté), le vrai trafic API (`.gemini-key-health.json`) est une preuve INDÉPENDANTE de
// l'activité réelle, qu'elle ait été consultée ou non — c'est la seule source de ce paysage qui
// permette un vrai dénominateur honnête. Retourne `undefined` si aucune salve n'a jamais été
// détectée (rien à mesurer), jamais un 100% par défaut qui ferait croire à une conformité jamais
// testée.
export function burstComplianceScore(healthData, sessionLog, opts = {}) {
  const bursts = detectBurstWindows(healthData, sessionLog, opts);
  if (!bursts.length) return undefined;
  const confirmed = bursts.filter((b) => b.confirmed).length;
  return { score: (confirmed / bursts.length) * 100, confirmed, total: bursts.length };
}

// Capacité de scan (2026-09-20, demande explicite de l'utilisateur : « est-ce que smart conso api
// peut réaliser un scan aussi ? [...] si non, il faut l'ajouter : c'est utile de savoir scanner »).
// Domaine différent de SMART-CONSO-TOKEN : jamais la taille de documents/texte, toujours le RYTHME
// des appels réels à l'API régulée (Article 22) — cohérent avec la frontière déjà posée avec
// l'Article 8 (jamais l'architecture ou le contenu des prompts, toujours le rythme). Repère des
// SCHÉMAS RÉELS dans l'historique déjà accumulé (`.gemini-key-health.json` partagé avec Smart
// Breaker, `.smart-conso-session.json` propre à cet outil) — jamais un jugement sur le code du jeu
// lui-même, seulement sur la façon dont l'agent a réellement sollicité l'API par le passé.
// blocageTotalA() — restait-il quelque chose d'utilisable à cet instant ? Une clé est jugée
// utilisable quand son DERNIER signal favorable est au moins aussi récent que son dernier
// épuisement : une clé épuisée puis redevenue OK est utilisable, et une clé jamais épuisée l'est
// aussi. S'il reste ne serait-ce qu'une clé utilisable, relancer est le comportement voulu, pas une
// faute — c'est le passage à une clé saine, la raison d'être de Smart Breaker.
//
// L'ABSENCE DE DONNÉE NE VAUT JAMAIS ACCUSATION : sans aucun épisode lisible, on ne sait pas, donc
// on ne reproche pas (leçons L5/L11). La fonction rend alors false, et le constat ne se déclenche
// pas.
export function blocageTotalA(healthData, instant) {
  const cles = Object.values(healthData?.keys ?? {});
  if (!cles.length) return false;
  let auMoinsUneLue = false;
  for (const cle of cles) {
    const eps = (cle?.episodes ?? []).filter((e) => typeof e?.at === "number" && e.at <= instant);
    if (!eps.length) continue;
    auMoinsUneLue = true;
    const dernierEpuise = Math.max(...eps.filter((e) => e.outcome === "QUOTA_ÉPUISÉ").map((e) => e.at), -Infinity);
    const dernierOk = Math.max(...eps.filter((e) => e.outcome !== "QUOTA_ÉPUISÉ").map((e) => e.at), -Infinity);
    if (dernierEpuise === -Infinity) return false;       // jamais épuisée : utilisable
    if (dernierOk >= dernierEpuise) return false;        // épuisée puis revenue : utilisable
  }
  return auMoinsUneLue;
}

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
  //
  // « ÉPUISÉ » NE VEUT PAS DIRE « BLOQUÉ », ET LES CONFONDRE RENDAIT CE CONSTAT FAUX (2026-09-28,
  // tâche #493). Le seul relancement jamais signalé par cette sonde a été instruit en détail : le
  // 2026-09-21 à 23h07, UNE clé sur trois a rendu QUOTA_ÉPUISÉ ; les deux autres étaient OK
  // vingt-neuf secondes plus tôt, et la clé épuisée portait elle-même un OK à la MÊME milliseconde
  // (un modèle épuisé, un autre disponible sur la même clé). La simulation lancée trois minutes
  // après n'était donc pas un relancement à l'aveugle : c'était exactement ce que Smart Breaker
  // existe pour faire — passer à une clé saine. Le reproche visait un comportement CORRECT.
  //
  // Encore un signal ADJACENT lu comme le signal visé : « un épisode d'épuisement existe » n'est
  // pas « l'API était bloquée ». Ce qui compte est qu'il ne restait RIEN d'utilisable, et c'est ce
  // que la sonde mesure désormais. La borne de dix minutes, elle, est inchangée.
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
    if (!relaunch) continue;
    if (!blocageTotalA(healthData, ep.at)) continue;
    quickRelaunches++;
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

async function main() {
  recordCliUsage("smart-conso-api");
  const actionType = process.argv[2];
  const now = Date.now();
  const healthData = loadJson(HEALTH_PATH, { keys: {} });
  const sessionLog = loadJson(SESSION_PATH, { actions: [] });

  // ── `trafic-reel` — LE RACCORD QUI MANQUAIT, ET AUCUN OUTIL NOUVEAU N'ÉTAIT NÉCESSAIRE
  // (2026-10-02, tâche #1092). Sa question, mot pour mot : « possible d'étendre smart conso plutôt
  // que nouvel outil ? » — et elle était meilleure que ma formulation du problème.
  //
  // CE QUE DISAIT LA TÂCHE, ET CE QUI ÉTAIT FAUX DEDANS : `lib/gemini-keys.ts` garde les épisodes
  // d'appel EN MÉMOIRE et son commentaire compte sur « un outil EXTÉRIEUR, tournant côté Node avec
  // un vrai accès disque, pour les persister ». J'en avais conclu que cet outil n'existait pas.
  // En réalité DEUX des trois pièces existaient déjà :
  //   · le Worker EXPOSE les épisodes — `app/api/admin/route.ts` rend `geminiKeyEpisodes` ;
  //   · la persistance EXISTE — `recordOutcomeByLabel()` de `gemini-key-health.mjs`, écrite le
  //     2026-09-20 pour la tâche #88, dont l'intitulé était littéralement « persister le vrai
  //     trafic Gemini dans l'historique partagé », et qui prend l'EMPREINTE reçue via l'API admin
  //     précisément pour que la clé en clair ne circule jamais sur le réseau.
  // Il ne manquait que ces quinze lignes de raccord. Deux pièces sur trois attendaient depuis
  // douze jours de se rencontrer, et personne ne l'avait vu parce que chacune, prise seule, était
  // parfaitement en ordre.
  //
  // POURQUOI ICI PLUTÔT QUE CHEZ `gemini-key-health` : c'est Smart Conso qui REND l'avis que
  // l'Article 22 oblige à consulter. Un avis fondé sur un registre mort est un faux vert sur la
  // consommation ; l'outil qui porte l'avis est donc celui qui doit pouvoir aller chercher la
  // matière de cet avis. La persistance, elle, reste chez son propriétaire — on relaie, on ne
  // recopie pas (Article 24).
  //
  // ET IL REFUSE DE CONCLURE PLUTÔT QUE DE RENDRE UN ZÉRO : si le serveur de jeu ne tourne pas,
  // il n'y a AUCUN épisode à lire — ce qui n'est jamais « aucun trafic » (leçons L5/L11).
  if (actionType === "trafic-reel") {
    printReportHeader({ tool: "smart-conso-api", title: "SMART CONSO API — persistance du trafic API réel", scriptPath: "scripts/smart-conso-api.mjs" });
    const base = process.env.ADMIN_BASE_URL || "http://127.0.0.1:5173";
    const motDePasse = process.env.ADMIN_PASSWORD || "";
    let charge;
    try {
      const r = await fetch(`${base}/api/admin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: motDePasse }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      charge = await r.json();
    } catch (e) {
      console.log(`🚨 PAS MESURÉ — le panneau admin n'a pas répondu sur ${base} (${e?.message ?? e}).`);
      console.log("   Ce n'est PAS « aucun trafic API » : c'est « je n'ai pas pu regarder ». Les épisodes vivent en mémoire");
      console.log("   dans le serveur de jeu ; sans serveur qui tourne, il n'y a rien à aller chercher, et un zéro rendu ici");
      console.log("   ferait croire à un quota intact (leçons L5/L11).");
      return;
    }
    const episodes = Array.isArray(charge?.geminiKeyEpisodes) ? charge.geminiKeyEpisodes : null;
    if (!episodes) {
      console.log("🚨 PAS MESURÉ — le panneau admin a répondu, mais sans champ `geminiKeyEpisodes`. Le contrat a changé, ou le mot de passe a été refusé.");
      return;
    }
    const { recordOutcomeByLabel } = await import("./gemini-key-health.mjs");
    let persistes = 0;
    for (const ep of episodes) {
      if (!ep?.fingerprint || !ep?.model || !ep?.outcome) continue;
      recordOutcomeByLabel(ep.fingerprint, ep.model, ep.outcome, true, ep.at ?? Date.now());
      persistes += 1;
    }
    console.log(`✅ ${persistes} épisode(s) de trafic RÉEL persisté(s) dans l'historique partagé, sur ${episodes.length} lu(s) depuis le panneau admin.`);
    if (persistes < episodes.length) console.log(`   ${episodes.length - persistes} épisode(s) écarté(s) faute d'empreinte, de modèle ou de verdict — jamais comptés comme persistés.`);
    console.log("   L'empreinte circule, jamais la clé en clair : c'est la raison d'être de `recordOutcomeByLabel()` (tâche #88, 2026-09-20).");
    return;
  }

  if (actionType === "scan") {
    printReportHeader({ tool: "smart-conso-api", title: "SMART CONSO API — scan des schémas de consommation réels", scriptPath: "scripts/smart-conso-api.mjs" });
    const findings = scanConsumptionPatterns(healthData, sessionLog, now);
    if (!findings.length) {
      console.log("Aucun schéma coûteux repéré dans l'historique réel accumulé.");
    } else {
      for (const f of findings) console.log(`⚠️ ${f.constat}\n   → ${f.piste}\n`);
    }
    {
      // LE PLAN D'ACTION (2026-09-23, tâche #211). Smart Conso API surveille le RYTHME de
      // consommation de l'API pendant le travail de développement — jamais l'architecture de
      // production, qui reste sous la seule autorité de l'Article 8.
      //
      // `fausseUneMesure: true` : une rafale non confirmée fausse le quota restant sur lequel TOUTES
      // les décisions coûteuses suivantes s'appuient. Ce n'est pas du confort, c'est l'instrument.
      //
      // La PISTE que l'outil a déjà calculée devient la tâche : il sait quoi proposer, il ne le
      // disait simplement jamais sous forme de suite à donner.
      const planConso = planDactionDepuisEcarts(findings, { toolSlug: "smart-conso-api", fausseUneMesure: true,
        libelle: (f) => f.constat, tache: (f) => f.piste });
      imprimerPlanDaction(planConso);
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
  for (const l of lignesDeFraicheur(healthData, now)) console.log(l);
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
